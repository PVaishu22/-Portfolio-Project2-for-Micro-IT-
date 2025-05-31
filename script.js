// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const quizCard = document.getElementById('quiz-card');
    const welcomeScreen = document.getElementById('welcome-screen');
    const questionScreen = document.getElementById('question-screen');
    const resultsScreen = document.getElementById('results-screen');
    const reviewScreen = document.getElementById('review-screen');

    const startQuizButton = document.getElementById('start-quiz-button');
    const questionCounter = document.getElementById('question-counter');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const submitButton = document.getElementById('submit-button');

    const finalScoreDisplay = document.getElementById('final-score');
    const totalQuestionsDisplay = document.getElementById('total-questions-display');
    const percentageScoreDisplay = document.getElementById('percentage-score');
    const feedbackMessage = document.getElementById('feedback-message');
    const reviewAnswersButton = document.getElementById('review-answers-button');
    const restartQuizButton = document.getElementById('restart-quiz-button');
    const reviewQuestionsContainer = document.getElementById('review-questions-container');
    const backToResultsButton = document.getElementById('back-to-results-button');


    // --- Quiz State Variables ---
    let questions = [];
    let currentQuestionIndex = 0;
    let userAnswers = {}; // Stores {question_id: selected_option}
    let quizResults = null; // Stores results from backend after submission

    // --- Utility Functions ---

    // Function to fetch questions from the Flask backend
    async function fetchQuestions() {
        try {
            const response = await fetch('/api/questions');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            questions = await response.json();
            if (questions.length === 0) {
                displayError("No questions loaded. Please check the backend.");
                return false;
            }
            return true;
        } catch (error) {
            console.error("Error fetching questions:", error);
            displayError("Failed to load quiz questions. Please try again later.");
            return false;
        }
    }

    // Displays an error message on the quiz card
    function displayError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        quizCard.appendChild(errorDiv);
        setTimeout(() => {
            errorDiv.remove();
        }, 5000); // Remove error after 5 seconds
    }

    // Function to switch between quiz sections with animation
    function showSection(sectionToShow, direction = 'next') {
        const currentActive = document.querySelector('.quiz-section.active');
        if (currentActive) {
            // Apply exit animation class
            currentActive.classList.remove('active');
            currentActive.classList.add(direction === 'next' ? 'exit-left' : 'exit-right');

            // Wait for exit animation to complete before applying enter animation
            currentActive.addEventListener('transitionend', function handler() {
                currentActive.classList.remove('exit-left', 'exit-right');
                currentActive.removeEventListener('transitionend', handler);

                // Apply enter animation class to the new section
                sectionToShow.classList.add(direction === 'next' ? 'enter-right' : 'enter-left');
                setTimeout(() => { // Small delay to ensure enter animation starts after exit
                    sectionToShow.classList.add('active');
                    sectionToShow.classList.remove('enter-right', 'enter-left');
                }, 50); // Adjust delay as needed
            }, { once: true }); // Ensure handler runs only once
        } else {
            // If no active section, just activate the new one
            sectionToShow.classList.add('active');
        }
    }

    // Function to render the current question
    function renderQuestion() {
        if (questions.length === 0) {
            displayError("No questions available to render.");
            return;
        }

        const question = questions[currentQuestionIndex];
        questionCounter.textContent = `Question ${currentQuestionIndex + 1}/${questions.length}`;
        questionText.textContent = question.question;
        optionsContainer.innerHTML = ''; // Clear previous options

        question.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-button';
            button.textContent = option;
            button.dataset.questionId = question.id;
            button.dataset.option = option;

            // Mark as selected if already answered
            if (userAnswers[question.id] === option) {
                button.classList.add('selected');
            }

            // Add ripple effect on click
            button.addEventListener('click', (e) => {
                const existingRipple = button.querySelector('.ripple');
                if (existingRipple) existingRipple.remove(); // Remove old ripple if exists

                const circle = document.createElement('span');
                const diameter = Math.max(button.clientWidth, button.clientHeight);
                const radius = diameter / 2;
                circle.style.width = circle.style.height = `${diameter}px`;
                circle.style.left = `${e.clientX - button.offsetLeft - radius}px`;
                circle.style.top = `${e.clientY - button.offsetTop - radius}px`;
                circle.classList.add('ripple');
                button.appendChild(circle);

                // Store user's answer
                selectOption(question.id, option);
            });

            optionsContainer.appendChild(button);
        });

        updateNavigationButtons();
    }

    // Handles selecting an option
    function selectOption(questionId, option) {
        userAnswers[questionId] = option;
        // Update UI to show selected option
        const currentQuestionOptions = optionsContainer.querySelectorAll('.option-button');
        currentQuestionOptions.forEach(btn => {
            if (btn.dataset.questionId == questionId) { // Use == for loose comparison with string/number
                if (btn.dataset.option === option) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            }
        });
    }

    // Updates the state of Next/Prev/Submit buttons
    function updateNavigationButtons() {
        prevButton.disabled = currentQuestionIndex === 0;
        nextButton.disabled = currentQuestionIndex === questions.length - 1;

        if (currentQuestionIndex === questions.length - 1) {
            submitButton.style.display = 'inline-block';
            nextButton.style.display = 'none';
        } else {
            submitButton.style.display = 'none';
            nextButton.style.display = 'inline-block';
        }
    }

    // --- Navigation Handlers ---
    function goToNextQuestion() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showSection(questionScreen, 'next'); // Slide next
            setTimeout(renderQuestion, 500); // Render after transition
        }
    }

    function goToPrevQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showSection(questionScreen, 'prev'); // Slide prev
            setTimeout(renderQuestion, 500); // Render after transition
        }
    }

    async function submitQuiz() {
        // Optional: Confirm submission if not all questions answered
        if (Object.keys(userAnswers).length < questions.length) {
            if (!confirm("You haven't answered all questions. Do you want to submit anyway?")) {
                return;
            }
        }

        try {
            const response = await fetch('/api/submit_quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ answers: userAnswers })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            quizResults = await response.json();
            displayResults();
            showSection(resultsScreen, 'next');
        } catch (error) {
            console.error("Error submitting quiz:", error);
            displayError("Failed to submit quiz. Please try again.");
        }
    }

    // --- Results Display ---
    function displayResults() {
        if (!quizResults) return;

        finalScoreDisplay.textContent = quizResults.score;
        totalQuestionsDisplay.textContent = quizResults.total_questions;
        percentageScoreDisplay.textContent = quizResults.percentage.toFixed(0); // Round percentage

        // === FIX APPLIED HERE ===
        // Removed `var()` which is a CSS function and used hardcoded colors
        if (quizResults.percentage >= 80) {
            feedbackMessage.textContent = "Excellent job! You're a true knowledge master!";
            feedbackMessage.style.color = '#4CAF50'; // Green: Matches --correct-color from CSS
        } else if (quizResults.percentage >= 50) {
            feedbackMessage.textContent = "Good effort! Keep learning and you'll get even better!";
            feedbackMessage.style.color = '#FFD700'; // Gold: Matches --accent-color-2 from CSS
        } else {
            feedbackMessage.textContent = "Don't worry, every mistake is a step towards learning! Try again!";
            feedbackMessage.style.color = '#F44336'; // Red: Matches --incorrect-color from CSS
        }
    }

    function renderReviewScreen() {
        if (!quizResults || !quizResults.results_detail) return;

        reviewQuestionsContainer.innerHTML = ''; // Clear previous review items

        quizResults.results_detail.forEach(item => {
            const questionData = questions.find(q => q.id === item.question_id);
            if (!questionData) return;

            const reviewItem = document.createElement('div');
            reviewItem.className = `review-item ${item.is_correct ? 'correct-answer-item' : 'incorrect-answer'}`;

            reviewItem.innerHTML = `
                <h3>${questionData.question}</h3>
                <p>Your Answer: <span class="user-answer">${item.user_answer || 'Not Answered'}</span></p>
                <p>Correct Answer: <span class="correct-answer">${item.correct_answer}</span></p>
            `;
            reviewQuestionsContainer.appendChild(reviewItem);
        });
        showSection(reviewScreen, 'next');
    }

    // --- Event Listeners ---
    startQuizButton.addEventListener('click', async () => {
        const loaded = await fetchQuestions();
        if (loaded) {
            currentQuestionIndex = 0;
            userAnswers = {}; // Reset answers for new game
            renderQuestion();
            showSection(questionScreen, 'next');
        }
    });

    nextButton.addEventListener('click', goToNextQuestion);
    prevButton.addEventListener('click', goToPrevQuestion);
    submitButton.addEventListener('click', submitQuiz);
    reviewAnswersButton.addEventListener('click', renderReviewScreen);
    backToResultsButton.addEventListener('click', () => showSection(resultsScreen, 'prev'));

    restartQuizButton.addEventListener('click', () => {
        currentQuestionIndex = 0;
        userAnswers = {};
        quizResults = null;
        renderQuestion(); // Render first question
        showSection(questionScreen, 'next'); // Go back to question screen
    });

    // Initial load: show welcome screen
    showSection(welcomeScreen);
});