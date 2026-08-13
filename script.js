/* =========================================================
   ITN EXAM REVIEWER
   Flashcards + Multiple Choice Quiz
   OFFLINE / PWA COMPATIBLE
   ========================================================= */

let allCards = [];
let filteredCards = [];

let flashIndex = 0;
let currentMode = "flashcards";

let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;


/* =========================================================
   HELPER
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}


function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] =
      [copy[j], copy[i]];
  }

  return copy;
}


function getPriorityLabel(priority) {
  if (priority === "HIGH") return "🔥 HIGH PRIORITY";
  if (priority === "MEDIUM") return "🟡 MEDIUM PRIORITY";
  return "⚪ LOW PRIORITY";
}


function getModuleNumber(moduleName) {
  const match = String(moduleName || "")
    .match(/^Module\s+[123]/i);

  return match
    ? match[0].replace(/\s+/g, " ")
    : "";
}


/* =========================================================
   LOAD JSON
   ========================================================= */

async function loadCards() {

  try {

    /*
      The Service Worker caches this file.

      IMPORTANT:
      We intentionally do NOT use:

      cache: "no-store"

      because the website needs to be able to
      retrieve the cached JSON when offline.
    */

    const response = await fetch(
      "ITN_Modules_1-3_Flashcards.json"
    );


    if (!response.ok) {

      throw new Error(
        `HTTP error ${response.status}`
      );

    }


    const data =
      await response.json();


    /*
      Expected JSON format:

      {
        "title": "...",
        "note": "...",
        "cards": [
          {...},
          {...}
        ]
      }
    */

    if (!Array.isArray(data.cards)) {

      throw new Error(
        "The JSON does not contain a valid cards array."
      );

    }


    allCards =
      data.cards;


    filteredCards =
      [...allCards];


    console.log(
      `Loaded ${allCards.length} flashcards.`
    );


    updateQuizStats();

    renderFlashcard();


  } catch (error) {

    console.error(
      "Failed to load flashcards:",
      error
    );


    $("flashTerm").textContent =
      "Unable to load flashcards.";


    $("flashDefinition").textContent =
      "The flashcard data could not be loaded. Open the website online once so the files can be cached for offline use.";


    $("flashTopic").textContent =
      "";


    $("flashBackTopic").textContent =
      "";


    $("flashPriority").textContent =
      "—";


    $("flashProgress").textContent =
      "0 / 0";

  }

}


/* =========================================================
   FLASHCARDS
   ========================================================= */

function renderFlashcard() {

  if (filteredCards.length === 0) {

    $("flashTerm").textContent =
      "No flashcards found.";


    $("flashDefinition").textContent =
      "Try changing your filters.";


    $("flashTopic").textContent =
      "";


    $("flashBackTopic").textContent =
      "";


    $("flashPriority").textContent =
      "—";


    $("flashProgress").textContent =
      "0 / 0";


    $("flashProgressFill").style.width =
      "0%";


    return;

  }


  if (
    flashIndex >=
    filteredCards.length
  ) {

    flashIndex = 0;

  }


  if (flashIndex < 0) {

    flashIndex =
      filteredCards.length - 1;

  }


  const card =
    filteredCards[flashIndex];


  $("flashTerm").textContent =
    card.term || "Untitled";


  $("flashBackTerm").textContent =
    card.term || "Untitled";


  $("flashDefinition").textContent =
    card.definition ||
    "No definition available.";


  const topic =
    `${card.module || ""} • ${card.topic || ""}`;


  $("flashTopic").textContent =
    topic;


  $("flashBackTopic").textContent =
    topic;


  $("flashPriority").textContent =
    getPriorityLabel(
      card.priority
    );


  $("flashProgress").textContent =
    `${flashIndex + 1} / ${filteredCards.length}`;


  const percentage =
    ((flashIndex + 1) /
      filteredCards.length) * 100;


  $("flashProgressFill").style.width =
    `${percentage}%`;


  $("flashcard")
    .classList
    .remove("flipped");

}


function flipCard() {

  $("flashcard")
    .classList
    .toggle("flipped");

}


function nextCard() {

  if (!filteredCards.length) {
    return;
  }


  flashIndex =
    (flashIndex + 1) %
    filteredCards.length;


  renderFlashcard();

}


function previousCard() {

  if (!filteredCards.length) {
    return;
  }


  flashIndex =
    (flashIndex - 1 +
      filteredCards.length) %
    filteredCards.length;


  renderFlashcard();

}


function shuffleCards() {

  filteredCards =
    shuffle(filteredCards);


  flashIndex = 0;


  renderFlashcard();

}


/* =========================================================
   FILTERS
   ========================================================= */

function getFilteredCards() {

  const moduleFilter =
    $("moduleFilter").value;


  const priorityFilter =
    $("priorityFilter").value;


  return allCards.filter(card => {

    const moduleMatch =
      moduleFilter === "all" ||
      getModuleNumber(card.module)
        .toLowerCase() ===
      moduleFilter.toLowerCase();


    const priorityMatch =
      priorityFilter === "all" ||
      card.priority === priorityFilter;


    return (
      moduleMatch &&
      priorityMatch
    );

  });

}


function applyFilters() {

  filteredCards =
    getFilteredCards();


  flashIndex = 0;


  renderFlashcard();


  updateQuizStats();

}


function updateQuizStats() {

  const cards =
    getFilteredCards();


  $("availableCount").textContent =
    cards.length;


  const selected =
    $("quizCount").value;


  let questionCount;


  if (selected === "all") {

    questionCount =
      cards.length;

  } else {

    questionCount =
      Math.min(
        Number(selected),
        cards.length
      );

  }


  $("selectedCount").textContent =
    questionCount;


  $("highCount").textContent =
    cards.filter(
      card =>
        card.priority === "HIGH"
    ).length;

}


/* =========================================================
   QUIZ
   ========================================================= */

function createQuiz() {

  const sourceCards =
    getFilteredCards();


  if (sourceCards.length < 4) {

    alert(
      "You need at least 4 flashcards for a multiple-choice quiz."
    );


    return false;

  }


  const requested =
    $("quizCount").value;


  let amount;


  if (requested === "all") {

    amount =
      sourceCards.length;

  } else {

    amount =
      Math.min(
        Number(requested),
        sourceCards.length
      );

  }


  const selectedCards =
    shuffle(sourceCards)
      .slice(0, amount);


  quizQuestions =
    selectedCards.map(card => {

      const wrongAnswers =
        shuffle(
          sourceCards.filter(other => {

            return (
              other.id !== card.id &&
              other.definition !==
                card.definition
            );

          })
        )
        .slice(0, 3)
        .map(other => ({

          text:
            other.definition,

          correct:
            false

        }));


      const correctAnswer = {

        text:
          card.definition,

        correct:
          true

      };


      return {

        card:
          card,

        answers:
          shuffle([
            correctAnswer,
            ...wrongAnswers
          ])

      };

    });


  quizIndex = 0;

  quizScore = 0;

  quizAnswered = false;


  return true;

}


/* =========================================================
   START QUIZ
   ========================================================= */

function startQuiz() {

  if (!createQuiz()) {
    return;
  }


  $("quizStartScreen")
    .classList
    .add("hidden");


  $("quizResult")
    .classList
    .add("hidden");


  $("quizGame")
    .classList
    .remove("hidden");


  renderQuizQuestion();

}


/* =========================================================
   RENDER QUIZ QUESTION
   ========================================================= */

function renderQuizQuestion() {

  const question =
    quizQuestions[quizIndex];


  if (!question) {

    finishQuiz();

    return;

  }


  quizAnswered = false;


  $("quizProgress").textContent =
    `${quizIndex + 1} / ${quizQuestions.length}`;


  $("quizScore").textContent =
    quizScore;


  const progress =
    ((quizIndex + 1) /
      quizQuestions.length) * 100;


  $("quizProgressFill").style.width =
    `${progress}%`;


  $("quizTopic").textContent =
    `${question.card.module} • ${question.card.topic}`;


  $("quizPriority").textContent =
    getPriorityLabel(
      question.card.priority
    );


  $("quizQuestion").textContent =
    `Which definition matches "${question.card.term}"?`;


  $("answers").innerHTML =
    "";


  const letters = [
    "A",
    "B",
    "C",
    "D"
  ];


  question.answers.forEach(
    (answer, index) => {

      const button =
        document.createElement(
          "button"
        );


      button.className =
        "answer";


      const letter =
        document.createElement(
          "span"
        );


      letter.className =
        "letter";


      letter.textContent =
        letters[index];


      const text =
        document.createElement(
          "span"
        );


      text.textContent =
        answer.text;


      button.appendChild(
        letter
      );


      button.appendChild(
        text
      );


      button.addEventListener(
        "click",
        () => {
          selectAnswer(index);
        }
      );


      $("answers")
        .appendChild(button);

    }
  );


  $("quizFeedback")
    .classList
    .add("hidden");


  $("quizFeedback").textContent =
    "";


  $("nextQuestionBtn").disabled =
    true;

}


/* =========================================================
   ANSWER QUESTION
   ========================================================= */

function selectAnswer(selectedIndex) {

  if (quizAnswered) {
    return;
  }


  quizAnswered = true;


  const question =
    quizQuestions[quizIndex];


  const buttons =
    [
      ...$("answers")
        .querySelectorAll(
          ".answer"
        )
    ];


  buttons.forEach(button => {

    button.disabled = true;

  });


  const selected =
    question.answers[selectedIndex];


  const correctIndex =
    question.answers.findIndex(
      answer =>
        answer.correct === true
    );


  if (selected.correct) {

    buttons[selectedIndex]
      .classList
      .add("correct");


    quizScore++;


    $("quizScore").textContent =
      quizScore;


    $("quizFeedback").textContent =
      "✅ Correct!";


  } else {

    buttons[selectedIndex]
      .classList
      .add("wrong");


    buttons[correctIndex]
      .classList
      .add("correct");


    $("quizFeedback").textContent =
      `❌ Incorrect. The correct answer is: ${question.card.definition}`;

  }


  $("quizFeedback")
    .classList
    .remove("hidden");


  $("nextQuestionBtn").disabled =
    false;

}


/* =========================================================
   NEXT QUESTION
   ========================================================= */

function nextQuestion() {

  if (!quizAnswered) {
    return;
  }


  quizIndex++;


  if (
    quizIndex >=
    quizQuestions.length
  ) {

    finishQuiz();

    return;

  }


  renderQuizQuestion();

}


/* =========================================================
   FINISH QUIZ
   ========================================================= */

function finishQuiz() {

  $("quizGame")
    .classList
    .add("hidden");


  $("quizResult")
    .classList
    .remove("hidden");


  const total =
    quizQuestions.length;


  const percentage =
    total === 0
      ? 0
      : Math.round(
          (quizScore / total) * 100
        );


  $("finalScore").textContent =
    `${percentage}%`;


  if (percentage >= 90) {

    $("resultTitle").textContent =
      "Excellent! 🔥";

  } else if (percentage >= 80) {

    $("resultTitle").textContent =
      "Great job! 💪";

  } else if (percentage >= 70) {

    $("resultTitle").textContent =
      "Good work! 📚";

  } else {

    $("resultTitle").textContent =
      "Keep studying! 💡";

  }


  $("resultText").textContent =
    `You scored ${quizScore} out of ${total}. Review the material and try again.`;

}


/* =========================================================
   SWITCH TO FLASHCARDS
   ========================================================= */

function showFlashcards() {

  currentMode =
    "flashcards";


  $("flashcardsView")
    .classList
    .remove("hidden");


  $("quizView")
    .classList
    .add("hidden");


  document
    .querySelectorAll(".mode-tab")
    .forEach(tab => {

      tab.classList.toggle(
        "active",
        tab.dataset.mode ===
          "flashcards"
      );

    });


  document
    .querySelectorAll(".flashcard-only")
    .forEach(element => {

      element.classList
        .remove("hidden");

    });


  document
    .querySelectorAll(".quiz-only")
    .forEach(element => {

      element.classList
        .add("hidden");

    });

}


/* =========================================================
   SWITCH TO QUIZ
   ========================================================= */

function showQuiz() {

  currentMode =
    "quiz";


  $("flashcardsView")
    .classList
    .add("hidden");


  $("quizView")
    .classList
    .remove("hidden");


  document
    .querySelectorAll(".mode-tab")
    .forEach(tab => {

      tab.classList.toggle(
        "active",
        tab.dataset.mode === "quiz"
      );

    });


  document
    .querySelectorAll(".flashcard-only")
    .forEach(element => {

      element.classList
        .add("hidden");

    });


  document
    .querySelectorAll(".quiz-only")
    .forEach(element => {

      element.classList
        .remove("hidden");

    });


  $("quizGame")
    .classList
    .add("hidden");


  $("quizResult")
    .classList
    .add("hidden");


  $("quizStartScreen")
    .classList
    .remove("hidden");


  updateQuizStats();

}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {

  document.body
    .classList
    .toggle("light");


  const isLight =
    document.body
      .classList
      .contains("light");


  localStorage.setItem(
    "itnTheme",
    isLight
      ? "light"
      : "dark"
  );


  $("themeBtn").textContent =
    isLight
      ? "☀"
      : "☾";

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */


/* Flashcard navigation */

$("prevBtn")
  .addEventListener(
    "click",
    previousCard
  );


$("nextBtn")
  .addEventListener(
    "click",
    nextCard
  );


$("flipBtn")
  .addEventListener(
    "click",
    flipCard
  );


$("shuffleBtn")
  .addEventListener(
    "click",
    shuffleCards
  );


$("flashcard")
  .addEventListener(
    "click",
    flipCard
  );


/* Filters */

$("applyBtn")
  .addEventListener(
    "click",
    applyFilters
  );


$("moduleFilter")
  .addEventListener(
    "change",
    applyFilters
  );


$("priorityFilter")
  .addEventListener(
    "change",
    applyFilters
  );


$("quizCount")
  .addEventListener(
    "change",
    updateQuizStats
  );


/* Mode buttons */

document
  .querySelectorAll(".mode-tab")
  .forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        if (
          tab.dataset.mode ===
          "quiz"
        ) {

          showQuiz();

        } else {

          showFlashcards();

        }

      }
    );

  });


/* Start quiz */

$("startQuizBtn")
  .addEventListener(
    "click",
    () => {

      showQuiz();

      startQuiz();

    }
  );


$("beginQuizBtn")
  .addEventListener(
    "click",
    startQuiz
  );


/* Quiz navigation */

$("nextQuestionBtn")
  .addEventListener(
    "click",
    nextQuestion
  );


$("retryQuizBtn")
  .addEventListener(
    "click",
    startQuiz
  );


/* Review high priority */

$("reviewHighBtn")
  .addEventListener(
    "click",
    () => {

      $("priorityFilter").value =
        "HIGH";


      applyFilters();


      showFlashcards();

    }
  );


/* Theme */

$("themeBtn")
  .addEventListener(
    "click",
    toggleTheme
  );


/* =========================================================
   KEYBOARD CONTROLS
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.target.tagName ===
      "SELECT"
    ) {

      return;

    }


    /* Flashcard controls */

    if (
      currentMode ===
      "flashcards"
    ) {

      if (
        event.key ===
        "ArrowRight"
      ) {

        nextCard();

      }


      if (
        event.key ===
        "ArrowLeft"
      ) {

        previousCard();

      }


      if (
        event.code ===
        "Space"
      ) {

        event.preventDefault();

        flipCard();

      }


      return;

    }


    /* Quiz */

    if (
      currentMode ===
      "quiz" &&
      event.key === "Enter" &&
      quizAnswered
    ) {

      nextQuestion();

    }

  }
);


/* =========================================================
   RESTORE THEME
   ========================================================= */

if (
  localStorage.getItem(
    "itnTheme"
  ) === "light"
) {

  document.body
    .classList
    .add("light");


  $("themeBtn").textContent =
    "☀";

}


/* =========================================================
   START
   ========================================================= */

showFlashcards();

loadCards();
