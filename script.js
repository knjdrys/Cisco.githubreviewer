/* =========================================================
   ITN EXAM REVIEWER
   Flashcards + Multiple Choice Quiz
   Offline + Persistent Mistake Review
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
   MISTAKE REVIEW
   ========================================================= */

let mistakeQuestions = [];
let mistakeIndex = 0;
let mistakeScore = 0;
let mistakeAnswered = false;

const MISTAKE_STORAGE_KEY =
  "itnMistakeQuestions";


/* =========================================================
   HELPER
   ========================================================= */

function $(id) {
  return document.getElementById(id);
}


function shuffle(array) {

  const copy = [...array];

  for (
    let i = copy.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [copy[i], copy[j]] =
      [copy[j], copy[i]];

  }

  return copy;
}


function getPriorityLabel(priority) {

  if (priority === "HIGH") {
    return "🔥 HIGH PRIORITY";
  }

  if (priority === "MEDIUM") {
    return "🟡 MEDIUM PRIORITY";
  }

  return "⚪ LOW PRIORITY";

}


function getModuleNumber(moduleName) {

  const match =
    String(moduleName || "")
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

    const response =
      await fetch(
        "ITN_Modules_1-3_Flashcards.json"
      );


    if (!response.ok) {

      throw new Error(
        `HTTP error ${response.status}`
      );

    }


    const data =
      await response.json();


    if (
      !Array.isArray(data.cards)
    ) {

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

  }

  catch (error) {

    console.error(
      "Failed to load flashcards:",
      error
    );


    $("flashTerm").textContent =
      "Unable to load flashcards.";


    $("flashDefinition").textContent =
      "The flashcard data could not be loaded. Open the website online once so the files can be cached for offline use.";

  }

}


/* =========================================================
   FLASHCARDS
   ========================================================= */

function renderFlashcard() {

  if (
    filteredCards.length === 0
  ) {

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


    $("flashProgressFill")
      .style
      .width = "0%";


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
    (
      (flashIndex + 1) /
      filteredCards.length
    ) * 100;


  $("flashProgressFill")
    .style
    .width =
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

  if (
    !filteredCards.length
  ) {
    return;
  }


  flashIndex =
    (
      flashIndex + 1
    ) %
    filteredCards.length;


  renderFlashcard();

}


function previousCard() {

  if (
    !filteredCards.length
  ) {
    return;
  }


  flashIndex =
    (
      flashIndex - 1 +
      filteredCards.length
    ) %
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
      getModuleNumber(
        card.module
      ).toLowerCase() ===
      moduleFilter.toLowerCase();


    const priorityMatch =
      priorityFilter === "all" ||
      card.priority ===
      priorityFilter;


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


  $("availableCount")
    .textContent =
    cards.length;


  const selected =
    $("quizCount").value;


  let questionCount;


  if (
    selected === "all"
  ) {

    questionCount =
      cards.length;

  }

  else {

    questionCount =
      Math.min(
        Number(selected),
        cards.length
      );

  }


  $("selectedCount")
    .textContent =
    questionCount;


  $("highCount")
    .textContent =
    cards.filter(
      card =>
        card.priority ===
        "HIGH"
    ).length;

}


/* =========================================================
   MISTAKE STORAGE
   ========================================================= */

function getSavedMistakes() {

  try {

    const saved =
      localStorage.getItem(
        MISTAKE_STORAGE_KEY
      );


    if (!saved) {
      return [];
    }


    const parsed =
      JSON.parse(saved);


    return Array.isArray(parsed)
      ? parsed
      : [];

  }

  catch (error) {

    console.error(
      "Unable to read saved mistakes:",
      error
    );


    return [];

  }

}


function saveMistakes(
  mistakes
) {

  try {

    localStorage.setItem(
      MISTAKE_STORAGE_KEY,
      JSON.stringify(mistakes)
    );

  }

  catch (error) {

    console.error(
      "Unable to save mistakes:",
      error
    );

  }

}


/*
  Add a question to the mistake pool.

  We identify the card using its ID.
*/

function addMistake(card) {

  if (!card) {
    return;
  }


  const mistakes =
    getSavedMistakes();


  const exists =
    mistakes.some(
      mistake =>
        String(mistake.id) ===
        String(card.id)
    );


  if (!exists) {

    mistakes.push({
      id: card.id
    });


    saveMistakes(
      mistakes
    );

  }

}


/*
  Remove a question from the
  mistake pool after the user
  answers it correctly.
*/

function removeMistake(card) {

  if (!card) {
    return;
  }


  const mistakes =
    getSavedMistakes();


  const updated =
    mistakes.filter(
      mistake =>
        String(mistake.id) !==
        String(card.id)
    );


  saveMistakes(
    updated
  );

}


/*
  Get the actual card objects
  from the saved IDs.
*/

function getMistakeCards() {

  const saved =
    getSavedMistakes();


  return saved
    .map(savedMistake => {

      return allCards.find(
        card =>
          String(card.id) ===
          String(savedMistake.id)
      );

    })
    .filter(Boolean);

}


/* =========================================================
   QUIZ
   ========================================================= */

function createQuiz() {

  const sourceCards =
    getFilteredCards();


  if (
    sourceCards.length < 4
  ) {

    alert(
      "You need at least 4 flashcards for a multiple-choice quiz."
    );


    return false;

  }


  const requested =
    $("quizCount").value;


  let amount;


  if (
    requested === "all"
  ) {

    amount =
      sourceCards.length;

  }

  else {

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
    selectedCards.map(
      card => {

        const wrongAnswers =
          shuffle(
            sourceCards.filter(
              other => {

                return (
                  other.id !==
                    card.id &&
                  other.definition !==
                    card.definition
                );

              }
            )
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

      }
    );


  quizIndex = 0;

  quizScore = 0;

  quizAnswered = false;


  return true;

}


/* =========================================================
   START QUIZ
   ========================================================= */

function startQuiz() {

  if (
    !createQuiz()
  ) {
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
    quizQuestions[
      quizIndex
    ];


  if (!question) {

    finishQuiz();

    return;

  }


  quizAnswered =
    false;


  $("quizProgress")
    .textContent =
    `${quizIndex + 1} / ${quizQuestions.length}`;


  $("quizScore")
    .textContent =
    quizScore;


  const progress =
    (
      (quizIndex + 1) /
      quizQuestions.length
    ) * 100;


  $("quizProgressFill")
    .style
    .width =
    `${progress}%`;


  $("quizTopic")
    .textContent =
    `${question.card.module} • ${question.card.topic}`;


  $("quizPriority")
    .textContent =
    getPriorityLabel(
      question.card.priority
    );


  $("quizQuestion")
    .textContent =
    `Which definition matches "${question.card.term}"?`;


  $("answers")
    .innerHTML =
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

          selectAnswer(
            index
          );

        }
      );


      $("answers")
        .appendChild(
          button
        );

    }
  );


  $("quizFeedback")
    .classList
    .add("hidden");


  $("quizFeedback")
    .textContent =
    "";


  $("nextQuestionBtn")
    .disabled =
    true;

}


/* =========================================================
   ANSWER QUESTION
   ========================================================= */

function selectAnswer(
  selectedIndex
) {

  if (
    quizAnswered
  ) {
    return;
  }


  quizAnswered =
    true;


  const question =
    quizQuestions[
      quizIndex
    ];


  const buttons =
    [
      ...$("answers")
        .querySelectorAll(
          ".answer"
        )
    ];


  buttons.forEach(
    button => {

      button.disabled =
        true;

    }
  );


  const selected =
    question.answers[
      selectedIndex
    ];


  const correctIndex =
    question.answers.findIndex(
      answer =>
        answer.correct ===
        true
    );


  if (
    selected.correct
  ) {

    buttons[
      selectedIndex
    ]
      .classList
      .add("correct");


    quizScore++;


    $("quizScore")
      .textContent =
      quizScore;


    $("quizFeedback")
      .textContent =
      "✅ Correct!";


  }

  else {

    buttons[
      selectedIndex
    ]
      .classList
      .add("wrong");


    buttons[
      correctIndex
    ]
      .classList
      .add("correct");


    $("quizFeedback")
      .textContent =
      `❌ Incorrect. The correct answer is: ${question.card.definition}`;


    /*
      NEW:
      Save the wrong answer.
    */

    addMistake(
      question.card
    );

  }


  $("quizFeedback")
    .classList
    .remove("hidden");


  $("nextQuestionBtn")
    .disabled =
    false;

}


/* =========================================================
   NEXT QUESTION
   ========================================================= */

function nextQuestion() {

  if (
    !quizAnswered
  ) {
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
          (
            quizScore /
            total
          ) * 100
        );


  $("finalScore")
    .textContent =
    `${percentage}%`;


  if (
    percentage >= 90
  ) {

    $("resultTitle")
      .textContent =
      "Excellent! 🔥";

  }

  else if (
    percentage >= 80
  ) {

    $("resultTitle")
      .textContent =
      "Great job! 💪";

  }

  else if (
    percentage >= 70
  ) {

    $("resultTitle")
      .textContent =
      "Good work! 📚";

  }

  else {

    $("resultTitle")
      .textContent =
      "Keep studying! 💡";

  }


  $("resultText")
    .textContent =
    `You scored ${quizScore} out of ${total}. Review the material and try again.`;


  /*
    NEW:
    Display mistake review box
    when mistakes exist.
  */

  updateMistakeReviewBox();

}


/* =========================================================
   MISTAKE REVIEW BOX
   ========================================================= */

function updateMistakeReviewBox() {

  const mistakes =
    getMistakeCards();


  const box =
    $("mistakeReviewBox");


  if (
    !box
  ) {
    return;
  }


  if (
    mistakes.length === 0
  ) {

    box.classList
      .add("hidden");


    return;

  }


  box.classList
    .remove("hidden");


  const count =
    mistakes.length;


  $("mistakeReviewText")
    .textContent =
    `You currently have ${count} question${count === 1 ? "" : "s"} that need${count === 1 ? "s" : ""} another review.`;

}


/* =========================================================
   CREATE MISTAKE REVIEW
   ========================================================= */

function createMistakeReview() {

  const mistakes =
    getMistakeCards();


  if (
    mistakes.length === 0
  ) {

    alert(
      "You currently have no mistakes to review! 🎉"
    );


    return false;

  }


  /*
    Randomly select mistakes.

    We review up to 5 at a time.
  */

  const amount =
    Math.min(
      5,
      mistakes.length
    );


  const selectedCards =
    shuffle(mistakes)
      .slice(
        0,
        amount
      );


  mistakeQuestions =
    selectedCards.map(
      card => {

        /*
          We need at least
          4 possible cards for
          multiple choice answers.
        */

        const possibleWrongAnswers =
          shuffle(
            allCards.filter(
              other => {

                return (
                  String(other.id) !==
                    String(card.id) &&
                  other.definition !==
                    card.definition
                );

              }
            )
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
              ...possibleWrongAnswers
            ])

        };

      }
    );


  mistakeIndex = 0;

  mistakeScore = 0;

  mistakeAnswered = false;


  return true;

}


/* =========================================================
   START MISTAKE REVIEW
   ========================================================= */

function startMistakeReview() {

  if (
    !createMistakeReview()
  ) {
    return;
  }


  currentMode =
    "quiz";


  $("quizResult")
    .classList
    .add("hidden");


  $("quizStartScreen")
    .classList
    .add("hidden");


  $("quizGame")
    .classList
    .remove("hidden");


  renderMistakeQuestion();

}


/* =========================================================
   RENDER MISTAKE QUESTION
   ========================================================= */

function renderMistakeQuestion() {

  const question =
    mistakeQuestions[
      mistakeIndex
    ];


  if (!question) {

    finishMistakeReview();

    return;

  }


  mistakeAnswered =
    false;


  $("quizProgress")
    .textContent =
    `Mistake Review ${mistakeIndex + 1} / ${mistakeQuestions.length}`;


  $("quizScore")
    .textContent =
    mistakeScore;


  const progress =
    (
      (mistakeIndex + 1) /
      mistakeQuestions.length
    ) * 100;


  $("quizProgressFill")
    .style
    .width =
    `${progress}%`;


  $("quizTopic")
    .textContent =
    `${question.card.module} • ${question.card.topic}`;


  $("quizPriority")
    .textContent =
    getPriorityLabel(
      question.card.priority
    );


  $("quizQuestion")
    .textContent =
    `Which definition matches "${question.card.term}"?`;


  $("answers")
    .innerHTML =
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

          selectMistakeAnswer(
            index
          );

        }
      );


      $("answers")
        .appendChild(
          button
        );

    }
  );


  $("quizFeedback")
    .classList
    .add("hidden");


  $("quizFeedback")
    .textContent =
    "";


  $("nextQuestionBtn")
    .disabled =
    true;

}


/* =========================================================
   ANSWER MISTAKE QUESTION
   ========================================================= */

function selectMistakeAnswer(
  selectedIndex
) {

  if (
    mistakeAnswered
  ) {
    return;
  }


  mistakeAnswered =
    true;


  const question =
    mistakeQuestions[
      mistakeIndex
    ];


  const buttons =
    [
      ...$("answers")
        .querySelectorAll(
          ".answer"
        )
    ];


  buttons.forEach(
    button => {

      button.disabled =
        true;

    }
  );


  const selected =
    question.answers[
      selectedIndex
    ];


  const correctIndex =
    question.answers.findIndex(
      answer =>
        answer.correct ===
        true
    );


  if (
    selected.correct
  ) {

    buttons[
      selectedIndex
    ]
      .classList
      .add("correct");


    mistakeScore++;


    $("quizScore")
      .textContent =
      mistakeScore;


    $("quizFeedback")
      .textContent =
      "✅ Correct! You mastered this mistake.";


    /*
      IMPORTANT:

      Correct answer means
      remove it from the
      persistent mistake pool.
    */

    removeMistake(
      question.card
    );

  }

  else {

    buttons[
      selectedIndex
    ]
      .classList
      .add("wrong");


    buttons[
      correctIndex
    ]
      .classList
      .add("correct");


    $("quizFeedback")
      .textContent =
      `❌ Not yet. The correct answer is: ${question.card.definition}`;

    /*
      Do NOT remove the mistake.

      It remains in storage.
    */

  }


  $("quizFeedback")
    .classList
    .remove("hidden");


  $("nextQuestionBtn")
    .disabled =
    false;

}


/* =========================================================
   NEXT MISTAKE QUESTION
   ========================================================= */

function nextMistakeQuestion() {

  if (
    !mistakeAnswered
  ) {
    return;
  }


  mistakeIndex++;


  if (
    mistakeIndex >=
    mistakeQuestions.length
  ) {

    finishMistakeReview();

    return;

  }


  renderMistakeQuestion();

}


/* =========================================================
   FINISH MISTAKE REVIEW
   ========================================================= */

function finishMistakeReview() {

  $("quizGame")
    .classList
    .add("hidden");


  $("quizResult")
    .classList
    .remove("hidden");


  const total =
    mistakeQuestions.length;


  const percentage =
    total === 0
      ? 0
      : Math.round(
          (
            mistakeScore /
            total
          ) * 100
        );


  $("finalScore")
    .textContent =
    `${percentage}%`;


  $("resultTitle")
    .textContent =
    "Mistake Review Complete! 🔥";


  $("resultText")
    .textContent =
    `You got ${mistakeScore} out of ${total} mistake questions correct.`;


  updateMistakeReviewBox();

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
    .querySelectorAll(
      ".flashcard-only"
    )
    .forEach(element => {

      element.classList
        .remove("hidden");

    });


  document
    .querySelectorAll(
      ".quiz-only"
    )
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
    .querySelectorAll(
      ".mode-tab"
    )
    .forEach(tab => {

      tab.classList.toggle(
        "active",
        tab.dataset.mode ===
          "quiz"
      );

    });


  document
    .querySelectorAll(
      ".flashcard-only"
    )
    .forEach(element => {

      element.classList
        .add("hidden");

    });


  document
    .querySelectorAll(
      ".quiz-only"
    )
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


  $("themeBtn")
    .textContent =
    isLight
      ? "☀"
      : "☾";

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */


/* Flashcards */

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
  .querySelectorAll(
    ".mode-tab"
  )
  .forEach(tab => {

    tab.addEventListener(
      "click",
      () => {

        if (
          tab.dataset.mode ===
          "quiz"
        ) {

          showQuiz();

        }

        else {

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
    () => {

      /*
        If we're currently doing
        mistake review, use the
        mistake-review navigation.
      */

      if (
        mistakeQuestions.length &&
        $("quizResult")
          .classList
          .contains("hidden") &&
        currentMode === "quiz" &&
        !quizQuestions[
          quizIndex
        ]
      ) {

        nextMistakeQuestion();

      }

      else {

        nextQuestion();

      }

    }
  );


$("retryQuizBtn")
  .addEventListener(
    "click",
    () => {

      /*
        Clear mistake-review state
        before starting a normal quiz.
      */

      mistakeQuestions = [];

      mistakeIndex = 0;

      mistakeScore = 0;

      startQuiz();

    }
  );


/* Review mistakes */

$("reviewMistakesBtn")
  .addEventListener(
    "click",
    startMistakeReview
  );


/* Review high priority */

$("reviewHighBtn")
  .addEventListener(
    "click",
    () => {

      $("priorityFilter")
        .value =
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


    if (
      currentMode ===
        "quiz" &&
      event.key ===
        "Enter" &&
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


  $("themeBtn")
    .textContent =
    "☀";

}


/* =========================================================
   START
   ========================================================= */

showFlashcards();

loadCards();
