from nltk.corpus import wordnet as wn
from functools import lru_cache

POS_MAP = {
    "n": "Noun",
    "v": "Verb",
    "a": "Adjective",
    "s": "Adjective",
    "r": "Adverb"
}

@lru_cache(maxsize=5000)
def get_word_data(word):
    data = {
        "pos": set(),
        "meanings": [],
        "synonyms": set(),
        "antonyms": set(),
        "examples": [],
        "forms": set()
    }

    for syn in wn.synsets(word):
        pos_name = POS_MAP.get(syn.pos(), syn.pos())
        data["pos"].add(pos_name)
        data["meanings"].append(syn.definition())

        for lemma in syn.lemmas():
            data["synonyms"].add(lemma.name())
            if lemma.antonyms():
                data["antonyms"].add(lemma.antonyms()[0].name())

        if syn.examples():
            data["examples"] += syn.examples()

        for lemma in syn.lemmas():
            data["forms"].add(lemma.name())

    for key in ["pos", "synonyms", "antonyms", "forms"]:
        data[key] = list(data[key])

    return data
