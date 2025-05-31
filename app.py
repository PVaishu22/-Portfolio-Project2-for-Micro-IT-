# app.py
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Hardcoded quiz questions
# In a real application, these might come from a database or a more complex data source.
quiz_questions = [
    {
        "id": 1,
        "question": "What is the capital of France?",
        "options": ["Berlin", "Madrid", "Paris", "Rome"],
        "correct_answer": "Paris"
    },
    {
        "id": 2,
        "question": "Which planet is known as the Red Planet?",
        "options": ["Earth", "Mars", "Jupiter", "Venus"],
        "correct_answer": "Mars"
    },
    {
        "id": 3,
        "question": "What is the largest ocean on Earth?",
        "options": ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        "correct_answer": "Pacific Ocean"
    },
    {
        "id": 4,
        "question": "Who wrote 'Romeo and Juliet'?",
        "options": ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        "correct_answer": "William Shakespeare"
    },
    {
        "id": 5,
        "question": "What is the chemical symbol for water?",
        "options": ["O2", "H2O", "CO2", "NaCl"],
        "correct_answer": "H2O"
    },
    {
        "id": 6,
        "question": "What is the fastest land animal?",
        "options": ["Lion", "Cheetah", "Gazelle", "Horse"],
        "correct_answer": "Cheetah"
    },
    {
        "id": 7,
        "question": "What is the highest mountain in the world?",
        "options": ["K2", "Mount Everest", "Kangchenjunga", "Lhotse"],
        "correct_answer": "Mount Everest"
    },
    {
        "id": 8,
        "question": "Which country is famous for the Great Wall?",
        "options": ["Japan", "India", "China", "Egypt"],
        "correct_answer": "China"
    },
    {
        "id": 9,
        "question": "What is the smallest prime number?",
        "options": ["0", "1", "2", "3"],
        "correct_answer": "2"
    },
    {
        "id": 10,
        "question": "What is the main ingredient in guacamole?",
        "options": ["Tomato", "Avocado", "Onion", "Chili"],
        "correct_answer": "Avocado"
    }
]


@app.route('/')
def index():
    """Serves the main HTML page for the quiz game."""
    return render_template('index.html')


@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Returns the quiz questions as a JSON array."""
    return jsonify(quiz_questions)


@app.route('/api/submit_quiz', methods=['POST'])
def submit_quiz():
    """
    Receives user's answers, calculates the score, and returns the result.
    Expected request body: {'answers': {'question_id': 'selected_option', ...}}
    """
    user_answers = request.get_json().get('answers', {})
    score = 0
    total_questions = len(quiz_questions)
    correct_answers_map = {q['id']: q['correct_answer'] for q in quiz_questions}

    # Track which questions were answered correctly/incorrectly
    results_detail = []

    for q_id_str, user_ans in user_answers.items():
        q_id = int(q_id_str)  # Convert string ID from JS to int
        correct_ans = correct_answers_map.get(q_id)

        is_correct = (user_ans == correct_ans)
        if is_correct:
            score += 1

        # Add detail for review
        question_data = next((q for q in quiz_questions if q['id'] == q_id), None)
        results_detail.append({
            "question_id": q_id,
            "question_text": question_data['question'] if question_data else 'N/A',
            "user_answer": user_ans,
            "correct_answer": correct_ans,
            "is_correct": is_correct
        })

    return jsonify({
        'score': score,
        'total_questions': total_questions,
        'percentage': (score / total_questions) * 100 if total_questions > 0 else 0,
        'results_detail': results_detail
    })


if __name__ == '__main__':
    app.run(debug=True)  # debug=True for development, auto-reloads on code changes