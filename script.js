let cards = [];
let filteredCards = [];

let currentIndex = 0;

const flashcard = document.getElementById("flashcard");

const term = document.getElementById("term");
const definition = document.getElementById("definition");
const topic = document.getElementById("topic");
const priority = document.getElementById("priority");

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

const moduleFilter = document.getElementById("moduleFilter");
const priorityFilter = document.getElementById("priorityFilter");


// Load flashcards
fetch("ITN_Modules_1-3_Flashcards.json")
    .then(response => response.json())
    .then(data => {

        cards = data.cards;

        filteredCards = [...cards];

        showCard();

    })
    .catch(error => {

        console.error(error);

        term.textContent = "Could not load flashcards.";
        definition.textContent =
            "Make sure the JSON file is in the same repository.";

    });


// Show current card
function showCard() {

    if (filteredCards.length === 0) {

        term.textContent = "No cards found";

        definition.textContent =
            "Try changing the filters.";

        topic.textContent = "";

        priority.textContent = "";

        return;
    }

    const card = filteredCards[currentIndex];

    term.textContent = card.term;

    definition.textContent = card.definition;

    topic.textContent =
        `${card.module} • ${card.topic}`;

    priority.textContent =
        getPriorityLabel(card.priority);

    progressText.textContent =
        `${currentIndex + 1} / ${filteredCards.length}`;

    const percentage =
        ((currentIndex + 1) / filteredCards.length) * 100;

    progressFill.style.width =
        `${percentage}%`;

    flashcard.classList.remove("flipped");
}


// Priority labels
function getPriorityLabel(priority) {

    if (priority === "HIGH") {
        return "🔥 HIGH PRIORITY";
    }

    if (priority === "MEDIUM") {
        return "🟡 MEDIUM PRIORITY";
    }

    return "⚪ LOW PRIORITY";
}


// Flip card
flashcard.addEventListener("click", () => {

    flashcard.classList.toggle("flipped");

});


// Flip button
document.getElementById("flipBtn")
    .addEventListener("click", () => {

        flashcard.classList.toggle("flipped");

    });


// Next
document.getElementById("nextBtn")
    .addEventListener("click", () => {

        currentIndex++;

        if (currentIndex >= filteredCards.length) {
            currentIndex = 0;
        }

        showCard();

    });


// Previous
document.getElementById("previousBtn")
    .addEventListener("click", () => {

        currentIndex--;

        if (currentIndex < 0) {
            currentIndex = filteredCards.length - 1;
        }

        showCard();

    });


// Apply filters
function applyFilters() {

    const module =
        moduleFilter.value;

    const selectedPriority =
        priorityFilter.value;

    filteredCards = cards.filter(card => {

        const moduleMatch =
            module === "all" ||
            card.module.includes(module);

        const priorityMatch =
            selectedPriority === "all" ||
            card.priority === selectedPriority;

        return moduleMatch && priorityMatch;

    });

    currentIndex = 0;

    showCard();
}


moduleFilter.addEventListener(
    "change",
    applyFilters
);

priorityFilter.addEventListener(
    "change",
    applyFilters
);


// Shuffle
document.getElementById("shuffleBtn")
    .addEventListener("click", () => {

        for (
            let i = filteredCards.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(Math.random() * (i + 1));

            [
                filteredCards[i],
                filteredCards[j]
            ] = [
                filteredCards[j],
                filteredCards[i]
            ];

        }

        currentIndex = 0;

        showCard();

    });


// Keyboard controls
document.addEventListener("keydown", event => {

    if (event.key === "ArrowRight") {

        document.getElementById("nextBtn").click();

    }

    if (event.key === "ArrowLeft") {

        document.getElementById("previousBtn").click();

    }

    if (event.key === " ") {

        event.preventDefault();

        flashcard.classList.toggle("flipped");

    }

});