const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = "en-US";

let speechRate = localStorage.getItem("speechRate") || 1;

document.addEventListener("DOMContentLoaded", () => {
    const theme = localStorage.getItem("theme");
    const fontSize = localStorage.getItem("fontSize");

    if (theme === "light") document.body.classList.add("light");
    if (fontSize) document.body.style.fontSize = fontSize + "px";
});

function searchWord() {
    let word = document.getElementById("word").value.trim();
    if (!word) return;

    saveLocalHistory(word);
    
    const result = document.getElementById("result");
    result.innerHTML = "⏳ Searching...";

    document.querySelectorAll("button").forEach(b => b.disabled = true);

    fetch("/search", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({word})
    })
    .then(res => res.json())
    .then(data => display(data))
    .finally(() => {
        document.querySelectorAll("button").forEach(b => b.disabled = false);
    });
}

function display(data) {
    let html = "";

    html += `<h3>Part of Speech:</h3> ${data.pos.join(", ")}`;
    html += `<h3>Meanings:</h3><ul>` + data.meanings.map(m => `<li>${m}</li>`).join("") + `</ul>`;
    html += `<h3>Synonyms:</h3> ${data.synonyms.join(", ")}`;
    html += `<h3>Antonyms:</h3> ${data.antonyms.join(", ")}`;
    html += `<h3>Examples:</h3><ul>` + data.examples.map(e => `<li>${e}</li>`).join("") + `</ul>`;
    html += `<h3>Other Forms:</h3> ${data.forms.join(", ")}`;

    document.getElementById("result").innerHTML = html;
    if (!data.meanings.length) {
    document.getElementById("result").innerHTML =
        `<p style="opacity:.6;text-align:center;">No results found. Try another word.</p>`;
    return;
}

}

function voiceInput() {
    recognition.start();

    recognition.onresult = function(event) {
        let spokenWord = event.results[0][0].transcript;
        document.getElementById("word").value = spokenWord;
        searchWord();
    };
}

function talkBack() {
    let text = document.getElementById("result").innerText;
    let speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = speechRate;
    window.speechSynthesis.speak(speech);
}
function stopTalk() {
    window.speechSynthesis.cancel();
}

function loadWordOfDay() {
    fetch("/word_of_day")
        .then(res => res.json())
        .then(data => {
            const word = data.word;
            document.getElementById("wotd").innerText = word;
            document.getElementById("word").value = word;
            searchWord();
        });
}
function openQuiz() {
    document.getElementById("quizModal").style.display = "block";
    newQuiz();
}

function closeQuiz() {
    document.getElementById("quizModal").style.display = "none";
}

let score = 0;

function newQuiz() {
  fetch("/quiz")
    .then(r => r.json())
    .then(data => {
      let html = `
        <p><b>Meaning of:</b> ${data.word}</p>
        <div id="quiz-options"></div>
        <p id="quiz-score"></p>
        <p id="quiz-stats"></p>
        <button onclick="newQuiz()">Next Question</button>
      `;

      openModal("🎯 Quiz", html);

      let optionsHTML = "";
      data.options.forEach(o => {
        optionsHTML += `<button onclick="checkAnswer(this, \`${o}\`, \`${data.answer}\`)">${o}</button><br><br>`;
      });

      document.getElementById("quiz-options").innerHTML = optionsHTML;
      loadStats();
    });
}



function checkAnswer(btn, selected, correct) {
    const buttons = document.querySelectorAll("#quiz-options button");
    buttons.forEach(b => b.disabled = true);

    let result;

    if (selected === correct) {
        btn.style.background = "#22c55e";
        result = "correct";
    } else {
        btn.style.background = "#ef4444";
        buttons.forEach(b => {
            if (b.innerText === correct)
                b.style.background = "#22c55e";
        });
        result = "wrong";
    }

    fetch("/update_stats", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({result})
    })
    .then(() => loadStats());
}

function addToFav() {
    let word = document.getElementById("word").value;

    fetch("/add_favorite", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({word: word})
    }).then(() => alert("Added to favorites!"));
}

function showFavs() {
    fetch("/get_favorites")
        .then(res => res.json())
        .then(data => {
            let html = "<h3>🧡 Favorite Words</h3><ul>";
            data.forEach(w => {
                html += `<li onclick="loadWord('${w}')">${w}</li>`;
            });
            html += "</ul>";
            document.getElementById("result").innerHTML = html;
        });
}

function loadWord(word) {
    document.getElementById("word").value = word;
    searchWord();
}

function showHistory() {
    fetch("/get_history")
        .then(res => res.json())
        .then(data => {
            let html = "<h3>📜 Search History</h3><ul>";
            data.forEach(w => {
                html += `<li onclick="loadWord('${w}')">${w}</li>`;
            });
            html += "</ul>";
            document.getElementById("result").innerHTML = html;
        });
}

function loadStats() {
    fetch("/get_stats")
      .then(res => res.json())
      .then(data => {
          let accuracy = data.attempted === 0 ? 0 :
            ((data.correct / data.attempted) * 100).toFixed(1);

          document.getElementById("quiz-stats").innerText =
            `Attempted: ${data.attempted} | Correct: ${data.correct} | Accuracy: ${accuracy}%`;
      });
}

function openModal(title, content) {
    document.getElementById("modal-title").innerText = title;
    document.getElementById("modal-content").innerHTML = content;
    document.getElementById("modal").style.display = "flex";

    document.querySelector("footer").style.display = "none";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
    document.querySelector("footer").style.display = "block";
}

function openFavorites() {
    fetch("/get_favorites")
      .then(r=>r.json())
      .then(data=>{
          let html = "<ul>";
          data.forEach(w=> html += `<li onclick="loadWord('${w}')">${w}</li>`);
          html += "</ul>";
          openModal("🧡 Favorites", html);
      });
}

function openHistory() {
    let history = JSON.parse(localStorage.getItem("history")) || [];

    if (!history.length) {
        openModal("📜 History", "<p>No history yet.</p>");
        return;
    }

    let html = "<ul>";
    history.forEach(w => {
        html += `<li onclick="loadWord('${w}')">${w}</li>`;
    });
    html += "</ul>";

    openModal("📜 History", html);
}

function openQuiz() {
    newQuiz();
}

function openSettings() {
    let html = `
        <h4>Theme</h4>
        <button onclick="setTheme('dark')">🌙 Dark</button>
        <button onclick="setTheme('light')">☀️ Light</button>

        <hr style="margin:15px 0">

        <h4>Font Size</h4>
        <input type="range" min="14" max="20" value="16" onchange="setFontSize(this.value)">

        <hr style="margin:15px 0">

        <h4>Speech Speed</h4>
        <input type="range" min="0.5" max="1.5" step="0.1" value="1" onchange="setSpeechRate(this.value)">
    `;
    openModal("⚙️ Settings", html);
}

function setTheme(mode) {
    if (mode === "light") {
        document.body.classList.add("light");
    } else {
        document.body.classList.remove("light");
    }
    localStorage.setItem("theme", mode);
}

function setFontSize(size) {
    document.body.style.fontSize = size + "px";
    localStorage.setItem("fontSize", size);
}

function setSpeechRate(rate) {
    speechRate = rate;
    localStorage.setItem("speechRate", rate);
}

if (!localStorage.getItem("visited")) {
    setTimeout(() => {
        openModal("👋 Welcome", `
            <p>Welcome to The English Thesaurus!</p>
            <ul>
                <li>Search words with full meanings & examples</li>
                <li>Use 🎤 for voice input and 🔊 for pronunciation</li>
                <li>Practice with 🎯 Quiz and track your progress</li>
                <li>Customize your experience in ⚙️ Settings</li>
            </ul>
            <button onclick="closeModal()">Start Exploring</button>
        `);
        localStorage.setItem("visited", true);
    }, 600);
}

const clickSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3");

document.addEventListener("click", e => {
    if (e.target.tagName === "BUTTON") clickSound.play();
});

document.getElementById("word").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        searchWord();
    }
});

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        closeModal();
    }
});

window.addEventListener("load", () => {
    setTimeout(() => {
        const splash = document.getElementById("splash");
        splash.style.animation = "splashOut .8s ease forwards";
        setTimeout(() => splash.style.display = "none", 800);
    }, 2200);
});

function showWordOfDay() {
    fetch("/word_of_day")
      .then(res => res.json())
      .then(data => {
          document.getElementById("word").value = data.word;
          searchWord();
      });
}

function saveLocalHistory(word) {
    let history = JSON.parse(localStorage.getItem("history")) || [];

    if (!history.includes(word)) {
        history.unshift(word);
        if (history.length > 50) history.pop();
    }

    localStorage.setItem("history", JSON.stringify(history));
}
