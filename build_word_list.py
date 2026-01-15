from nltk.corpus import wordnet as wn

words = set()

for syn in wn.all_synsets():
    for lemma in syn.lemmas():
        w = lemma.name().lower()
        if w.isalpha():
            words.add(w)

with open("data/word_list.txt", "w") as f:
    for w in sorted(words):
        f.write(w + "\n")

print("Word list created:", len(words), "words")
