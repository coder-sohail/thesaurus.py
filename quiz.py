import random
from nltk.corpus import wordnet as wn

ALL_SYNSETS = list(wn.all_synsets())

def generate_question():
    correct = random.choice(ALL_SYNSETS)

    word = correct.lemmas()[0].name()
    correct_def = correct.definition()

    options = {correct_def}

    while len(options) < 4:
        options.add(random.choice(ALL_SYNSETS).definition())

    options = list(options)
    random.shuffle(options)

    return {
        "word": word,
        "options": options,
        "answer": correct_def
    }
