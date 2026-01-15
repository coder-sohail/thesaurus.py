import random
from datetime import date

def get_word_of_the_day():
    with open("data/word_list.txt") as f:
        words = f.read().splitlines()

    random.seed(str(date.today()))
    return random.choice(words)
