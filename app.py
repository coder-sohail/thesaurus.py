import nltk
nltk.download('wordnet')
nltk.download('omw-1.4')

from flask import Flask, render_template, request, jsonify
from thesaurus import get_word_data
from word_of_day import get_word_of_the_day
from quiz import generate_question
import json

app = Flask(__name__)

# 🔹 Load data into memory for speed
with open("data/favorites.json") as f:
    FAVORITES = json.load(f)

with open("data/history.json") as f:
    HISTORY = json.load(f)

with open("data/stats.json") as f:
    STATS = json.load(f)

# ------------------- ROUTES -------------------

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/search", methods=["POST"])
def search():
    word = request.json["word"]

    if word not in HISTORY:
        HISTORY.append(word)
        with open("data/history.json", "w") as f:
            json.dump(HISTORY, f)

    return jsonify(get_word_data(word))

@app.route("/word_of_day")
def word_of_day():
    return jsonify({"word": get_word_of_the_day()})

@app.route("/quiz")
def quiz():
    return jsonify(generate_question())

@app.route("/add_favorite", methods=["POST"])
def add_favorite():
    word = request.json["word"]
    if word not in FAVORITES:
        FAVORITES.append(word)
        with open("data/favorites.json", "w") as f:
            json.dump(FAVORITES, f)
    return jsonify({"status": "added"})

@app.route("/get_favorites")
def get_favorites():
    return jsonify(FAVORITES)

@app.route("/get_history")
def get_history():
    return jsonify(HISTORY)

@app.route("/update_stats", methods=["POST"])
def update_stats():
    result = request.json["result"]
    STATS["attempted"] += 1
    if result == "correct":
        STATS["correct"] += 1

    with open("data/stats.json", "w") as f:
        json.dump(STATS, f)

    return jsonify(STATS)

@app.route("/get_stats")
def get_stats():
    return jsonify(STATS)

# ------------------- RUN -------------------

if __name__ == "__main__":
    app.run(debug=True)
