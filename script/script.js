console.log("Executing script.js - Final Version with Improved Restart Logic");

let questions = [];
let currentQuestionIndex = 0;
let selectedAnswers = []; // This will store answers: index for 'choice', string for 'input', object for 'match' (for D&D pairs), array of indices for 'multichoice'
let score = 0;
let currentTopicFile = null; // Store the file name of the currently loaded topic

// Timer variables
let timerInterval;
let timeLeft = 0;
const TIME_PER_QUESTION = 60; // Set your desired time per question in seconds
let totalTimeForQuiz = 0;
let quizStartTime; // Timestamp when the quiz started
// Removed isQuizPaused, pauseStartTime as pause is not implemented and resume is removed

// Quiz settings selected by the user at the start
let isTimedQuiz = true; // Default setting: timed quiz is ON
let showAnswersAtEnd = true; // Default setting: show answers is ON


// localStorage key for final results
const LOCAL_STORAGE_RESULTS_KEY = "quizResults";
// Removed LOCAL_STORAGE_STATE_KEY as resume functionality is removed


// --- DOM Elements ---
const quizOptionsContainer = document.getElementById("quizOptions"); // Container for topic select and options
const topicSelect = document.getElementById("topicSelect");
const timedQuizCheckbox = document.getElementById("timedQuizCheckbox");
const showAnswersCheckbox = document.getElementById("showAnswersCheckbox");

const startBtn = document.getElementById("startBtn");
const quizContainer = document.getElementById("quizContainer"); // Container for question and navigation during quiz
const questionContainer = document.getElementById("questionContainer"); // Container for the current question content
const nextBtn = document.getElementById("nextBtn");
const finishBtn = document.getElementById("finishBtn");
// const prevBtn = document.getElementById("prevBtn"); // Кнопка "Попереднє" відсутня у наданому HTML - логіка прихована
const resultContainer = document.getElementById("resultContainer"); // Container for displaying results
const scoreText = document.getElementById("score");
const reviewContainer = document.getElementById("reviewContainer"); // Container for question review in results
const totalQuestionsInfo = document.getElementById("totalQuestionsInfo"); // Displays total number of questions on start screen
const quizHeader = document.getElementById("quizHeader"); // Container for timer and progress bar
const timerElement = document.getElementById("time"); // Element displaying the timer
const progressBar = document.getElementById("progress-bar");
const questionCounterElement = document.getElementById("questionCounter"); // Displays current/total question count
const currentQuestionNumElement = document.getElementById("currentQuestionNum");
const totalQuestionsCountElement = document.getElementById("totalQuestionsCount");
const restartBtn = document.getElementById("restartBtn");


// --- Test Topics Data ---
const testTopics = [
    { id: 1, name: "1 Базова термінологія JavaScript. Змінні та типи.", file: "questions/questions_1.json" },
    { id: 2, name: "2 Рядки.", file: "questions/questions_2.json" },
    { id: 3, name: "3 Оператори порівняння.", file: "questions/questions_3.json" },
    { id: 4, name: "4 Функції.", file: "questions/questions_4.json" },
    { id: 5, name: "5 Розгалуження і цикли.", file: "questions/questions_5.json" },
    { id: 6, name: "6 Методи рядків.", file: "questions/questions_6.json" },
    { id: 7, name: "7 Масиви. Методи масиву.", file: "questions/questions_7.json" },
    { id: 8, name: "8 Ітерація по масиву.", file: "questions/questions_8.json" },
    { id: 9, name: "9 Об’єкти.", file: "questions/questions_9.json" },
    { id: 10, name: "10 Масив об'єктів.", file: "questions_10.json" },
    { id: 11, name: "11 Колбек функції. Перебираючі методи масивів.", file: "questions/questions_11.json" },
    { id: 12, name: "12 Об'єктна модель документа.", file: "questions/questions_12.json" },
    { id: 13, name: "13 Події.", file: "questions/questions_13.json" },
    { id: 14, name: "14 Інструменти веброзробки.", file: "questions/questions_14.json" },
    { id: 15, name: "15 Модульність проєкту та коду.", file: "questions/questions_15.json" },
    { id: 16, name: "16 Вебсховище.", file: "questions/questions_16.json" },
    { id: 17, name: "17 Асинхронність коду.", file: "questions/questions_17.json" },
    { id: 18, name: "18 Проміси.", file: "questions/questions_18.json" },
    { id: 19, name: "19 Промісифікація.", file: "questions/questions_19.json" },
    { id: 20, name: "20 Синтаксис async/await.", file: "questions/questions_20.json" },
    { id: 21, name: "21 Підсумковий тест.", file: "questions/questions_21.json" }, // Added final test
];

// DOMContentLoaded listener
document.addEventListener("DOMContentLoaded", initializeQuizSetup);

// Event listeners
startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", showNextQuestion); // This function is defined below
finishBtn.addEventListener("click", finishQuizEarly); // This function is defined below
// if (prevBtn) { // Logic for "Previous" button - uncomment if you add the button in HTML with id="prevBtn"
//     prevBtn.addEventListener("click", showPreviousQuestion); // This function is defined below
// }
if (restartBtn) {
    restartBtn.addEventListener("click", restartQuiz); // This function is defined below
}


// --- Initialization Function ---
async function initializeQuizSetup() {
    console.log("Initializing quiz setup...");
    populateTopicSelect(); // Populate the dropdown with topics
    loadFinalResults(); // Load and display previous final results

    // Set initial UI state: show options, hide quiz/results
    quizOptionsContainer.classList.remove("hidden");
    startBtn.classList.remove("hidden");
    totalQuestionsInfo.classList.remove("hidden"); // Show info

    quizHeader.classList.add("hidden");
    quizContainer.classList.add("hidden");
    resultContainer.classList.add("hidden");
    restartBtn.classList.add("hidden"); // Hide restart button initially

    // Ensure options are enabled initially
    topicSelect.disabled = false;
    timedQuizCheckbox.disabled = false;
    showAnswersCheckbox.disabled = false;

    // Load questions for the initially selected topic (usually the first one) to update total questions info
    // This is async, totalQuestionsInfo will be updated when done.
    // Use topicSelect.value which should be the value of the first option after populateTopicSelect
    if (topicSelect.options.length > 0) {
       await loadQuestions(topicSelect.value);
    } else {
        console.warn("No topics available to load initial questions.");
        totalQuestionsInfo.textContent = "Немає доступних тем для тестування.";
        startBtn.disabled = true; // Disable start if no topics
    }


     console.log("Initialization finished.");
}

// --- Populate Topic Select Dropdown ---
function populateTopicSelect() {
    console.log("Populating topic select dropdown.");
    topicSelect.innerHTML = ""; // Clear existing options
    if (!testTopics || testTopics.length === 0) {
        console.error("No test topics defined.");
        return;
    }
    testTopics.forEach(topic => {
        const option = document.createElement("option");
        option.value = topic.file; // Value is the JSON file name
        option.textContent = topic.name; // Text is the topic name
        topicSelect.appendChild(option);
    });
     console.log(`Populated dropdown with ${testTopics.length} topics.`);
}


// --- Timer Functions ---
function startTimer() {
     if (!isTimedQuiz) {
          console.log("Timed quiz is off. Timer not started.");
          stopTimer(); // Ensure timer is stopped if not a timed quiz
          timerElement.textContent = "--:--"; // Display placeholder
          timerElement.classList.remove("warning"); // Remove warning class
          timerElement.classList.add("hidden"); // Hide timer element
          return;
     }

     console.log("Starting timer...");
     timerElement.classList.remove("hidden"); // Show timer element


     // Always start timer from scratch for a new quiz
     totalTimeForQuiz = questions.length * TIME_PER_QUESTION;
     timeLeft = totalTimeForQuiz;
     quizStartTime = Date.now(); // Set start time to now

    // Clear any existing interval before starting a new one
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer(); // Update immediately
    timerElement.classList.remove("warning");
}

function updateTimer() {
    if (!isTimedQuiz) return; // Do nothing if not timed

    const now = Date.now();
    // Ensure quizStartTime is set
    if (!quizStartTime || quizStartTime === 0) {
        quizStartTime = now; // If somehow missed, set to now
    }

    const elapsed = Math.floor((now - quizStartTime) / 1000);
    timeLeft = totalTimeForQuiz - elapsed;

    if (timeLeft <= 0) {
        console.log("Timer reached zero. Finishing quiz.");
        clearInterval(timerInterval);
        timerElement.textContent = "00:00";
        timeLeft = 0; // Ensure it's exactly 0
        finishQuizEarly(); // End quiz when time is up
        return;
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (timeLeft <= 60 && !timerElement.classList.contains("warning")) {
        timerElement.classList.add("warning");
    } else if (timeLeft > 60 && timerElement.classList.contains("warning")) {
         timerElement.classList.remove("warning");
    }
}

function stopTimer() {
    console.log("Stopping timer.");
    clearInterval(timerInterval);
    timerInterval = null; // Clear the interval ID
}


// --- Progress Bar Function ---
function updateProgressBar() {
    // Progress is based on completed questions (current index) divided by total
    if (!questions || questions.length === 0) { // Avoid division by zero
        progressBar.style.width = '0%';
        currentQuestionNumElement.textContent = 0;
        totalQuestionsCountElement.textContent = 0;
        return;
    }
    const completedQuestions = currentQuestionIndex; // Number of questions *before* the current one
    const progress = (completedQuestions / questions.length) * 100;
    progressBar.style.width = `${progress}%`;

    currentQuestionNumElement.textContent = currentQuestionIndex + 1; // Display 1-based index
    totalQuestionsCountElement.textContent = questions.length;
    // questionCounterElement.classList.remove("hidden"); // Show counter - it's always visible in your HTML structure
}


// --- Load Quiz Info (only loads final results now) ---
async function loadQuizInfo() {
    console.log("Loading quiz info (previous results)...");
    // --- Load previous final results ---
    loadFinalResults(); // Display previous final result if any

    // Resume functionality removed, no need to load quiz state here
}


// --- Load Questions for Selected Topic ---
async function loadQuestions(topicFile) {
     if (!topicFile) {
         console.error("Attempted to load questions with no topic file specified.");
         questions = [];
         totalQuestionsInfo.textContent = "Не вдалося визначити файл питань.";
         startBtn.disabled = true;
         return;
     }
     console.log("Loading questions from:", topicFile);
     currentTopicFile = topicFile; // Store the loaded topic file name

     try {
         const res = await fetch(topicFile);
         if (!res.ok) {
             throw new Error(`HTTP error! status: ${res.status}`);
         }
         const loadedQuestions = await res.json();

         if (!Array.isArray(loadedQuestions) || loadedQuestions.length === 0) {
             console.warn(`Questions file ${topicFile} is empty or invalid.`);
             questions = [];
             totalQuestionsInfo.textContent = `Файл питань для теми "${topicSelect.options[topicSelect.selectedIndex]?.text || topicFile}" порожній або недійсний.`;
             startBtn.disabled = true;
             return;
         }

         questions = loadedQuestions; // Assign loaded questions
         console.log(`Successfully loaded ${questions.length} questions.`);

         totalQuestionsInfo.textContent = `Всього питань у тесті: ${questions.length}`;
         totalQuestionsCountElement.textContent = questions.length; // Update counter total

         startBtn.disabled = false; // Re-enable start button if it was disabled by a previous load error

     } catch (err) {
         console.error(`Error loading questions from ${topicFile}:`, err);
         questions = []; // Clear questions array on error
         totalQuestionsInfo.textContent = `Помилка завантаження питань для теми "${topicSelect.options[topicSelect.selectedIndex]?.text || topicFile}".`;
         startBtn.disabled = true; // Disable start if questions fail to load
     }
}


// --- Start New Quiz ---
async function startQuiz() {
    console.log("startQuiz called. Starting a NEW test.");

    // Hide quiz options and info
    quizOptionsContainer.classList.add("hidden");
    startBtn.classList.add("hidden"); // Hide the start button once quiz starts
    totalQuestionsInfo.classList.add("hidden"); // Hide info
    resultContainer.classList.add("hidden"); // Ensure result container is hidden


    // Get user settings for this new quiz from UI
    const selectedTopicFile = topicSelect.value;
    isTimedQuiz = timedQuizCheckbox.checked;
    showAnswersAtEnd = showAnswersCheckbox.checked;

    if (!selectedTopicFile) {
        alert("Будь ласка, виберіть тему тесту.");
         // Show options back if topic wasn't selected (shouldn't happen with dropdown)
        quizOptionsContainer.classList.remove("hidden");
        startBtn.classList.remove("hidden");
        totalQuestionsInfo.classList.remove("hidden");
        return; // Stop if no topic selected
    }

    // Load questions for the selected topic
    await loadQuestions(selectedTopicFile); // Sets questions array and currentTopicFile

     if (!questions || questions.length === 0) {
          // loadQuestions failed or returned empty, it already updated UI and disabled startBtn
          console.log("Questions failed to load or are empty during startQuiz.");
           // UI reset is handled in loadQuestions on failure
           return; // Stop if no questions loaded
     }

    // Reset all states for a new quiz
    currentQuestionIndex = 0;
    selectedAnswers = new Array(questions.length).fill(null); // Reset answers array based on loaded questions
    score = 0; // Reset score
    timeLeft = 0; // Will be set in startTimer
    totalTimeForQuiz = 0; // Will be set in startTimer
    quizStartTime = 0; // Reset start time


    // Clear any old saved quiz state explicitly (good practice, though not loaded anymore)
    localStorage.removeItem('quizState'); // Use the literal key as constant was removed
     console.log("Old quiz state cleared from localStorage on new start.");


    // Show quiz elements
    quizHeader.classList.remove("hidden");
    quizContainer.classList.remove("hidden");


    startTimer(); // Start the timer (respects isTimedQuiz)
    updateProgressBar(); // Initialize progress bar based on currentQuestionIndex

    // Show/hide navigation buttons based on current index and answered status
    updateNavigationButtons();

    showQuestion(); // Load the first question (index 0)
    console.log("startQuiz finished, quiz UI shown.");
}

// --- Show Next Question ---
function showNextQuestion() {
    console.log("showNextQuestion called. Current Q:", currentQuestionIndex + 1);
    // This function is called when the "Наступне" button is clicked.
    // The answer for the current question should already be saved in selectedAnswers
    // by the respective answer/submit handlers before this button becomes visible/clickable.

    currentQuestionIndex++; // Move to the next question index

    if (currentQuestionIndex < questions.length) {
        // If there are more questions, show the next one
        console.log("Showing next question:", currentQuestionIndex + 1);
        showQuestion();
    } else {
        // If this was the last question, finish the quiz
        console.log("End of quiz, calling finishQuizEarly.");
        // Call finishQuizEarly to handle final score, saving, and showing results
        finishQuizEarly();
    }
}

// --- Finish Quiz Early ---
function finishQuizEarly() {
     console.log("Finishing quiz early.");
     stopTimer(); // Stop the timer

     calculateFinalScore(); // Calculate the final score based on all selectedAnswers
     saveFinalResults(); // Save the result using the dedicated function (includes topic and showAnswersAtEnd setting)
     showResults(); // Show the results (respects showAnswersAtEnd setting)
}

// --- Show Question ---
function showQuestion() {
    console.log("showQuestion called. Current Q:", currentQuestionIndex + 1);

     // Validate currentQuestionIndex and questions array
     if (!questions || questions.length === 0 || currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
         console.error("showQuestion called with invalid state (no questions or invalid index).");
          // Attempt to transition to results gracefully
          // This might show empty results if questions/answers are missing, but prevents a stuck state.
          finishQuizEarly();
         return;
     }

    const question = questions[currentQuestionIndex];
    questionContainer.innerHTML = `<h2>Питання ${currentQuestionIndex + 1}: ${question.question}</h2>`;

    // Clear previous immediate feedback message (if using a separate div) - not currently in HTML
     // const feedbackDiv = quizContainer.querySelector(".quiz-feedback");
     // if(feedbackDiv) feedbackDiv.innerHTML = "";


    updateNavigationButtons(); // Update button visibility/text based on current index and answered status


    if (question.type === "choice") {
        question.answers.forEach((answer, index) => {
            const btn = document.createElement("button");
            btn.textContent = answer;
            btn.className = "answerBtn"; // Use .answerBtn for styling

             // Restore selection and apply feedback styles if answered
            const userAnswer = selectedAnswers[currentQuestionIndex];
            if (userAnswer !== null) {
                 btn.disabled = true; // Disable if already answered

                 // Apply feedback classes
                 if (index === question.correct) {
                     btn.classList.add('correct-answer'); // Mark correct answer
                 }
                 if (userAnswer === index) { // If this button was selected by the user
                      btn.classList.add('selected'); // Mark user's selection
                      if (userAnswer !== question.correct) {
                           btn.classList.add('incorrect-answer'); // Mark user's wrong selection
                      } else {
                           btn.classList.add('selected-correct'); // Mark user's correct selection
                      }
                 } else if (index === question.correct && userAnswer !== question.correct) {
                     // If this button is the correct answer, but the user selected a different one
                     btn.classList.add('not-selected-correct');
                 }
            }


            btn.addEventListener("click", (event) => {
                 // Only allow selecting if not already answered/disabled
                 if (selectedAnswers[currentQuestionIndex] !== null || event.target.disabled) return;

                const buttons = questionContainer.querySelectorAll(".answerBtn");
                buttons.forEach(b => {
                     // Clear any potential old feedback before applying new one (important if navigating back)
                     b.classList.remove('selected', 'correct-answer', 'incorrect-answer', 'not-selected-correct', 'selected-correct');
                     b.disabled = true; // Disable all buttons after selection
                 });


                selectedAnswers[currentQuestionIndex] = index; // Save the selected index
                event.target.classList.add('selected'); // Mark current selection

                 // Apply immediate feedback styles to all buttons *after* selecting
                 buttons.forEach((b, i) => {
                     if (i === question.correct) {
                         b.classList.add('correct-answer'); // Mark the correct option
                     }
                     if (index === i && index !== question.correct) {
                         b.classList.add('incorrect-answer'); // Mark user's incorrect selection
                     } else if (index === i && index === question.correct) {
                         b.classList.add('selected-correct'); // Mark user's correct selection
                     } else if (index !== question.correct && i === question.correct) {
                          b.classList.add('not-selected-correct'); // Mark correct option if user chose wrong
                     }
                 });


                 // Show next button after selection
                 updateNavigationButtons(); // Re-evaluate buttons state

                 // saveQuizState(); // Moved save to end of showQuestion
            });
            questionContainer.appendChild(btn);
        });
         // updateNavigationButtons handles showing next button if answered when loading
    }

    if (question.type === "input") {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "answerInput"; // Use .answerInput for styling
        input.placeholder = "Введіть вашу відповідь..."; // Додамо placeholder
        const submit = document.createElement("button");
        submit.textContent = "Підтвердити";

        // Restore saved answer and state
        const userAnswer = selectedAnswers[currentQuestionIndex];
        if (userAnswer !== null && userAnswer !== "") { // Check if saved answer is not null or empty
            input.value = userAnswer;
            input.disabled = true;
            submit.classList.add("hidden"); // Hide submit if already answered
            // nextBtn.classList.remove("hidden"); // Show next if already answered (handled by updateNavigationButtons)

             // Apply feedback styles immediately after loading if answered
             showInputFeedback(input, userAnswer, question.correct);
        }


        submit.addEventListener("click", () => {
            const submittedAnswer = input.value.trim();
             if (submittedAnswer === "") {
                  // Optionally alert user they need to enter something
                  // alert("Будь ласка, введіть вашу відповідь."); // Maybe too intrusive
                  console.log("Ввід порожній. Не зберігаємо відповідь і не підтверджуємо.");
                  return; // Do not proceed if input is empty
             }
            selectedAnswers[currentQuestionIndex] = submittedAnswer; // Save the trimmed input

            input.disabled = true;
            submit.classList.add("hidden");

            // Apply immediate feedback
             showInputFeedback(input, selectedAnswers[currentQuestionIndex], question.correct);

            updateNavigationButtons(); // Re-evaluate buttons state after submit

            // saveQuizState(); // Moved save to end of showQuestion
        });
        questionContainer.appendChild(input);
        questionContainer.appendChild(submit);

         // If already answered, ensure feedback is shown on load (call already above)
    }

    // --- Drag & Drop for Match ---
     if (question.type === "match") {
         // Структура для зберігання відповіді: { left_item_text: right_item_text, ... }
         // Ensure it's an object, initialize if null
         const matchAnswers = selectedAnswers[currentQuestionIndex] || {};
         selectedAnswers[currentQuestionIndex] = matchAnswers; // Store the object reference


         const matchContainer = document.createElement("div");
         matchContainer.classList.add("match-container");

         const leftList = document.createElement("ul");
         leftList.classList.add("match-list", "left");

         const rightList = document.createElement("ul");
         rightList.classList.add("match-list", "right");


         // Створюємо елементи для лівої колонки (те, що перетягуємо)
         const questionPairs = question.pairs || {}; // Handle missing pairs property
         const leftItems = Object.keys(questionPairs); // Use pairs to get the items that *need* a match
         leftItems.forEach(leftText => {
             const li = document.createElement("li");
             li.textContent = leftText;
             li.setAttribute("draggable", true); // Make element draggable
             li.dataset.leftText = leftText; // Store the text as a data attribute

             li.addEventListener("dragstart", (event) => {
                 // Allow drag only if not already matched (hidden) or disabled
                 if (event.target.style.display === 'none' || event.target.getAttribute('draggable') === 'false') {
                     event.preventDefault();
                     return;
                 }
                 event.dataTransfer.setData("text/plain", event.target.dataset.leftText);
                 event.target.classList.add("is-dragging");
             });

             li.addEventListener("dragend", (event) => {
                  event.target.classList.remove("is-dragging");
             });

             leftList.appendChild(li);
         });

         // Створюємо елементи для правої колонки (зони скидання)
         // Перемішуємо праві варіанти (опції), щоб порядок не підказував відповіді
         const rightOptions = [...(question.options || [])].sort(() => Math.random() - 0.5); // Handle missing options property and shuffle

         rightOptions.forEach(rightText => {
             const li = document.createElement("li");
             li.textContent = "Скиньте сюди"; // Placeholder text
             li.dataset.rightText = rightText; // Store the right text as data attribute
             li.dataset.matchedLeft = ""; // Data attribute to store which left item was dropped here

             li.addEventListener("dragover", (event) => {
                 // Allow drop only if this target is not already matched
                 if (li.dataset.matchedLeft !== "") {
                     event.dataTransfer.dropEffect = "none"; // Indicate drop not allowed
                     return;
                 }
                 event.preventDefault(); // Allow dropping
                 li.classList.add("dragover");
                 event.dataTransfer.dropEffect = "move"; // Indicate move operation
             });

             li.addEventListener("dragleave", () => {
                 li.classList.remove("dragover");
             });

             li.addEventListener("drop", (event) => {
                 event.preventDefault();
                 li.classList.remove("dragover");

                 // Check if this target is already matched
                 if (li.dataset.matchedLeft !== "") {
                      console.log("Ця зона вже зайнята.");
                      li.classList.add("occupied"); // Optional visual feedback for occupied slot
                      setTimeout(() => li.classList.remove("occupied"), 500);
                      return;
                 }

                 const leftText = event.dataTransfer.getData("text/plain");
                 const draggedElement = questionContainer.querySelector(`li[data-left-text="${leftText}"]`);

                 if (draggedElement) {
                      // Check if the item being dragged is actually one of the required left items
                       if (!questionPairs.hasOwnProperty(leftText)) { // Use questionPairs here
                            console.log("Скинуто невірний елемент.");
                            // Optional: visual feedback that the dropped item is not valid
                            draggedElement.classList.add("invalid-drag"); // Add a temporary class for feedback
                            setTimeout(() => draggedElement.classList.remove("invalid-drag"), 500);
                            return;
                       }

                            // If here, the drop is valid and target is free
                            li.textContent = `${leftText} → ${rightText}`; // Display the match
                            li.dataset.matchedLeft = leftText; // Store the matched left text
                            li.classList.add("matched"); // Apply matched style

                            draggedElement.style.display = "none"; // Hide the dragged element from the left column
                       draggedElement.setAttribute("draggable", false); // Disable dragging hidden item

                            // Store the match in selectedAnswers
                            matchAnswers[leftText] = rightText;

                            // Apply immediate feedback for this specific pair
                       showMatchFeedback(li, leftText, rightText, questionPairs); // Use questionPairs here

                            // Check if all required pairs are matched
                            checkMatchCompletion();

                       // saveQuizState(); // Moved save to end of showQuestion
                       }
                   });
                   rightList.appendChild(li);
               });

               matchContainer.appendChild(leftList);
               matchContainer.appendChild(rightList);
               questionContainer.appendChild(matchContainer);


               // Function to check if all *required* pairs are matched, and show Next button
               function checkMatchCompletion() {
                    const requiredPairsCount = questionPairs ? Object.keys(questionPairs).length : 0; // Use questionPairs here
                    // Count how many of the *required* left items have been matched by the user
                    let completedRequiredMatches = 0;
                    for (const left in questionPairs) { // Use questionPairs here
                        // Check if the left item is present in user's answers (means it was dropped somewhere)
                        if (matchAnswers.hasOwnProperty(left) && matchAnswers[left] !== null) {
                             completedRequiredMatches++;
                        }
                    }

                    // Check if all required pairs are matched OR if there are no required pairs at all.
                    if ((requiredPairsCount > 0 && completedRequiredMatches === requiredPairsCount) || (requiredPairsCount === 0 && Object.keys(matchAnswers).length === 0)) { // Ensure no items dropped if no pairs
                         // All required items have been dropped somewhere or there were none matched. Show Next button.
                       updateNavigationButtons(); // This function will check if all items are dropped AND it's not the last question etc.
                    } else {
                         nextBtn.classList.add("hidden"); // Hide Next if not all required are dropped
                    }
               }

                // Restore D&D state if answer is already saved
                const savedAnswers = selectedAnswers[currentQuestionIndex];
                if (savedAnswers && typeof savedAnswers === 'object' && Object.keys(savedAnswers).length > 0) {
                    // Keep track of left items that were successfully restored to hide them
                    const restoredLeftItems = new Set();

                    // Iterate through saved answers to restore the matches
                    for (const leftText in savedAnswers) {
                        const rightText = savedAnswers[leftText];
                        const dropTarget = questionContainer.querySelector(`li[data-right-text="${rightText}"]`);

                        // Ensure the drop target for this right text exists
                        if (dropTarget) {
                             dropTarget.textContent = `${leftText} → ${rightText}`;
                             dropTarget.dataset.matchedLeft = leftText; // Mark target as occupied
                             dropTarget.classList.add("matched"); // Apply matched style

                             // Apply immediate feedback styles on load
                          showMatchFeedback(dropTarget, leftText, rightText, questionPairs); // Use questionPairs here

                         restoredLeftItems.add(leftText); // Mark this left item as restored
                         // Disable drop target events directly if needed (more complex)
                         // A simpler approach is checking dataset.matchedLeft in dragover/drop listeners
                        } else {
                          // Handle case where a saved rightText doesn't exist in current options or question structure changed
                          console.warn(`Відновлення D&D: Не знайдено цільового елемента для правого тексту "${rightText}"`);
                          // Optionally remove this invalid entry from selectedAnswers
                          delete savedAnswers[leftText];
                     }
                    }

                 // After restoring matches, hide the corresponding items in the left list
                const leftListItems = questionContainer.querySelectorAll('.match-list.left li');
                leftListItems.forEach(li => {
                    const leftText = li.dataset.leftText;
                    if (restoredLeftItems.has(leftText)) {
                         li.style.display = "none"; // Hide the item
                         li.setAttribute("draggable", false); // Disable dragging
                    }
                });


                    checkMatchCompletion(); // Check if all required pairs have been restored
                updateNavigationButtons(); // Update buttons state based on completion
                }
       }
       // --- End Drag & Drop for Match ---


      // --- MULTICHOICE TYPE ---
      if (question.type === "multichoice") {
           // Ensure selectedAnswers for this question is an array, initialize if null
           const multichoiceAnswers = selectedAnswers[currentQuestionIndex] || [];
           if (!Array.isArray(selectedAnswers[currentQuestionIndex])) {
               selectedAnswers[currentQuestionIndex] = multichoiceAnswers;
           }

           const correctAnswers = question.correct || []; // Handle missing correct property - should be an array

          question.answers.forEach((answer, index) => {
              const label = document.createElement("label");
              const checkbox = document.createElement("input");
              checkbox.type = "checkbox";
              checkbox.value = index; // Store the index of the answer

               // Restore saved selections
               if (multichoiceAnswers.includes(index)) {
                   checkbox.checked = true;
               }

               // Check if the question was previously submitted (by checking if an answer exists and checkboxes were disabled)
               const userAnswer = selectedAnswers[currentQuestionIndex];
               // Check if answer is an array and the submit button is hidden (indicates submission)
                const submitBtn = questionContainer.querySelector("button:not(#nextBtn):not(#finishBtn):not(#prevBtn)");
                // isSubmitted logic based on submit button state is fine if submit button exists
                let isSubmitted = false;
                 if (submitBtn) {
                     isSubmitted = submitBtn.classList.contains("hidden");
                 } else {
                     // Fallback: If submit button is somehow missing (shouldn't happen after render),
                     // rely on the user answer existence for multichoice.
                     isSubmitted = Array.isArray(userAnswer) && userAnswer.length > 0;
                 }


               // If submitted, disable checkboxes and apply feedback styles on load
               if (isSubmitted) {
                    checkbox.disabled = true; // Disable if submitted

                   // Apply immediate feedback on load
                   const isCorrectAnswer = correctAnswers.includes(index);
                   const isUserSelected = userAnswer.includes(index);

                   if (isCorrectAnswer && isUserSelected) {
                       label.classList.add("correct-answer-label"); // Style for correctly selected option label
                   } else if (!isCorrectAnswer && isUserSelected) {
                       label.classList.add("incorrect-answer-label"); // Style for incorrectly selected option label
                   } else if (isCorrectAnswer && !isUserSelected) {
                       label.classList.add("not-selected-correct-label"); // Style for correct option not selected
                   }
               }


              checkbox.addEventListener("change", (event) => {
                   // Only allow changing if not disabled (i.e., not already submitted)
                   if (event.target.disabled) return;

                  const value = parseInt(event.target.value, 10);
                  const arrayIndex = multichoiceAnswers.indexOf(value);

                  if (event.target.checked) {
                      if (arrayIndex === -1) {
                         multichoiceAnswers.push(value); // Add index if checked and not already in array
                      }
                  } else {
                      if (arrayIndex > -1) {
                          multichoiceAnswers.splice(arrayIndex, 1); // Remove index if unchecked and in array
                      }
                  }
                   multichoiceAnswers.sort((a, b) => a - b); // Keep the array sorted for easy comparison

                   // Note: No immediate next button here, it appears after clicking "Підтвердити"
              });

              label.appendChild(checkbox);
              label.appendChild(document.createTextNode(answer));
              questionContainer.appendChild(label);
          });

          const submit = document.createElement("button");
          submit.textContent = "Підтвердити";

           // Restore state: Hide submit button if already submitted
           const userAnswer = selectedAnswers[currentQuestionIndex];
            // Submitted if answer is an array and submit button was hidden (primary check)
            const isSubmitted = Array.isArray(userAnswer) && submit.classList.contains("hidden"); // Check submit button state


            if (isSubmitted) {
                // Hide submit button and disable checkboxes if already submitted
                 const checkboxes = questionContainer.querySelectorAll("input[type='checkbox']");
                 if (checkboxes.length > 0) {
                     checkboxes.forEach(cb => cb.disabled = true); // Ensure checkboxes are disabled
                     submit.classList.add("hidden"); // Hide the submit button
                 }
            }


          submit.addEventListener("click", () => {
              const checkboxes = questionContainer.querySelectorAll("input[type='checkbox']");
              const userSelectedIndices = [];
               checkboxes.forEach((cb, index) => {
                   if (cb.checked) {
                       userSelectedIndices.push(index);
                   }
               });
               // Save the currently selected indices
               selectedAnswers[currentQuestionIndex] = userSelectedIndices.sort((a, b) => a - b); // Save sorted indices

               // Disable checkboxes after submission
               checkboxes.forEach(cb => cb.disabled = true);

              submit.classList.add("hidden"); // Hide submit button
              updateNavigationButtons(); // Show next button after submit

               // Apply immediate feedback styles to labels
               const correctAnswers = question.correct || []; // Handle missing correct property
               const userSelected = selectedAnswers[currentQuestionIndex]; // Use the saved answer
               questionContainer.querySelectorAll("label").forEach(label => {
                   const checkbox = label.querySelector("input[type='checkbox']");
                   const index = parseInt(checkbox.value, 10);
                   const isCorrectAnswer = correctAnswers.includes(index);
                   const isUserSelected = userSelected.includes(index);

                   // Apply feedback classes based on correctness and selection
                   label.classList.remove('correct-answer-label', 'incorrect-answer-label', 'not-selected-correct-label'); // Clear previous feedback
                   if (isCorrectAnswer && isUserSelected) {
                       label.classList.add("correct-answer-label");
                   } else if (!isCorrectAnswer && isUserSelected) {
                       label.classList.add("incorrect-answer-label");
                   } else if (isCorrectAnswer && !isUserSelected) {
                       label.classList.add("not-selected-correct-label");
                   }
               });
          });
          questionContainer.appendChild(submit);

           // If already answered, ensure feedback is shown on load (logic integrated above)
      }
      // --- END MULTICHOICE TYPE ---


       // Update progress after loading question
       updateProgressBar();

       // Save state after rendering UI and restoring answers/feedback for the current question
       // This is primarily for continuity in case the browser is closed mid-quiz, though not used for resume flow.
       // Keeping this save here for potential future features or debugging.
       console.log("Saving state after showing question", currentQuestionIndex + 1);
       saveQuizState();

}

// --- Helper function to check if an answer is provided for a given value ---
// Used in updateNavigationButtons and showResults to determine if a question is "answered" or "skipped"
function isAnswerProvided(answerValue) {
     if (answerValue === null) return false; // Default null state for choice, input
     if (typeof answerValue === 'string' && answerValue.trim() === '') return false; // Empty string for input
     if (Array.isArray(answerValue) && answerValue.length === 0) return false; // Empty array for multichoice
     if (typeof answerValue === 'object' && Object.keys(answerValue).length === 0) return false; // Empty object for match
     // For other types or non-empty values, consider it provided
     return true;
}


// --- Update Navigation Buttons Visibility and Text ---
function updateNavigationButtons() {
    // "Previous" button is not in HTML, logic is commented out.

    // Hide "Next" and "Finish Early" by default
    nextBtn.classList.add("hidden");
    finishBtn.classList.add("hidden");


     // Set the text of the "Next" button
     const isLastQuestion = currentQuestionIndex === questions.length - 1;

     if (isLastQuestion) {
          nextBtn.textContent = "Завершити"; // On the last question, Next button becomes Finish
     } else {
          nextBtn.textContent = "Наступне"; // On all other questions, it's Next
     }

     // Check if the current question has been fully answered/submitted
     // This determines if the "Next" (or "Finish" on last Q) button should be shown immediately
     const question = questions[currentQuestionIndex];
     let isQuestionSubmitted = false;

     if (question) {
          const userAnswer = selectedAnswers[currentQuestionIndex];

          if (question.type === 'choice') {
               // Choice is submitted if an answer has been selected (not null)
               isQuestionSubmitted = userAnswer !== null;
          } else if (question.type === 'input') {
               // Input is submitted if the text input is disabled (done after submit click)
               const inputElement = questionContainer.querySelector(".answerInput");
               isQuestionSubmitted = inputElement ? inputElement.disabled : false;
          } else if (question.type === 'multichoice') {
               // Multichoice is submitted if the submit button is hidden (done after submit click)
               const submitBtn = questionContainer.querySelector("button:not(#nextBtn):not(#finishBtn):not(#prevBtn)");
               // Check if submit button exists first
               isQuestionSubmitted = submitBtn ? submitBtn.classList.contains("hidden") : isAnswerProvided(userAnswer); // Fallback to checking if answer is provided if submit btn is missing
          } else if (question.type === 'match') {
               // Match is submitted if the number of user's matches equals the number of required pairs
               const requiredPairs = question.pairs;
               const requiredPairsCount = requiredPairs ? Object.keys(requiredPairs).length : 0; // Handle case where pairs might be missing or empty
               const userAnswers = selectedAnswers[currentQuestionIndex] || {}; // Default to empty object

               // It's submitted if all required pairs were matched AND the user's answer object has the same number of keys.
               // Or if there are no required pairs (then it's always submitted).
                if (requiredPairsCount > 0) {
                    isQuestionSubmitted = typeof userAnswers === 'object' && Object.keys(userAnswers).length === requiredPairsCount;
                } else {
                    // If there are no required pairs for a match question, it's considered submitted immediately
                    // Also check if user didn't drop incorrect items if no required pairs
                    isQuestionSubmitted = typeof userAnswers === 'object' && Object.keys(userAnswers).length === 0;
                }
          }
          // Add logic for other question types here if needed
     }

     console.log(`UpdateNavButtons Q${currentQuestionIndex+1}/${questions.length}: isSubmitted=${isQuestionSubmitted}, isLastQ=${isLastQuestion}`);


     // Always show the "Finish Early" button if it's not the last question
     // The condition "&& isTimedQuiz" is removed here to show it for all test types
     if (!isLastQuestion) {
          finishBtn.classList.remove("hidden");
     } else {
          finishBtn.classList.add("hidden"); // Hide "Finish Early" on the last question
     }

     // If the question is submitted, show the Next/Finish button (the one that progresses the quiz)
     if (isQuestionSubmitted) {
          nextBtn.classList.remove("hidden");
     } else {
          nextBtn.classList.add("hidden"); // If the question is NOT submitted, hide the Next button.
     }
      // Add console logs for button visibility state after updating
     console.log(`Next hidden: ${nextBtn.classList.contains("hidden")}, Finish hidden: ${finishBtn.classList.contains("hidden")}`);
}


// --- Show Previous Question ---
// Function for "Previous" button - uncomment if you add the button in HTML with id="prevBtn"
// function showPreviousQuestion() {
//     if (currentQuestionIndex > 0) {
//         // Save the state of the current question before moving back - saveQuizState() is called at the end of showQuestion
//         currentQuestionIndex--;
//         showQuestion();
//     }
// }


// --- Show Immediate Feedback (Helper Functions per Type) ---
// (No changes needed here)
function showInputFeedback(inputElement, userAnswer, correctAnswer) {
     // Clear any previous feedback classes
     inputElement.classList.remove('correct-answer-input', 'incorrect-answer-input');

     if (userAnswer && typeof userAnswer === 'string') {
          if (correctAnswer && typeof correctAnswer === 'string' && userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) { // Ensure correctAnswer is a string before trimming/comparing
              inputElement.classList.add('correct-answer-input');
          } else {
              inputElement.classList.add('incorrect-answer-input');
          }
     }
}

// Helper for Match Feedback (applied to the drop target LI)
function showMatchFeedback(dropTargetLi, matchedLeftText, matchedRightText, correctPairs) {
     // Clear previous feedback classes
     dropTargetLi.classList.remove('correct-match', 'incorrect-match');

     // Check if correctPairs is a valid object and contains the matchedLeftText key
     if (correctPairs && typeof correctPairs === 'object' && correctPairs.hasOwnProperty(matchedLeftText) && correctPairs[matchedLeftText] === matchedRightText) {
         dropTargetLi.classList.add('correct-match');
     } else {
         dropTargetLi.classList.add('incorrect-match');
     }
}
// Multichoice feedback logic is integrated directly in showQuestion and submit handler


// --- Calculate Final Score ---
// (No significant changes needed here, added error handling for missing questions/answers)
function calculateFinalScore() {
    score = 0; // Reset score before recalculating
    console.log("Calculating final score...");

    if (!questions || questions.length === 0 || !selectedAnswers || selectedAnswers.length !== questions.length) {
         console.warn("Cannot calculate score: questions or answers array is invalid.");
         score = 0; // Set score to 0 if data is missing
         return;
    }

    questions.forEach((q, i) => {
        const userAnswer = selectedAnswers[i];
        const correctAnswer = q.correct; // This is the correct answer definition from JSON

        if (q.type === "choice") {
            // For choice, userAnswer is the index of the selected answer
            if (userAnswer !== null && userAnswer === correctAnswer) {
                score++;
            }
        } else if (q.type === "input") {
            // For input, userAnswer is the string entered by the user
            // Check if answer was provided and if it matches (case-insensitive, trimmed)
            if (userAnswer && typeof userAnswer === 'string' && correctAnswer && typeof correctAnswer === 'string' && userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) { // Ensure correctAnswer is string
                score++;
            }
        } else if (q.type === "match") {
             // For match, userAnswer is an object { left_item: right_item_text, ... }
             const userAnswers = userAnswer || {}; // Default to empty object if null/undefined
             const requiredPairs = q.pairs; // Use q.pairs to get the correct pairs definition
             const requiredPairsCount = requiredPairs ? Object.keys(requiredPairs).length : 0;

             // Score is awarded only if ALL required items are matched correctly to their correct partners.
             // Check if user answer is an object AND has the same number of *required* keys AND all matches are correct.
             if (typeof userAnswers === 'object' && Object.keys(userAnswers).length === requiredPairsCount && requiredPairsCount > 0) {
                 let allMatchPairsCorrect = true;
                 // Iterate through the *required* pairs defined in q.pairs
                 for (const left in requiredPairs) {
                     // Check if the left part exists in user answer AND the matched right part is correct
                     if (!userAnswers.hasOwnProperty(left) || userAnswers[left] !== requiredPairs[left]) {
                         allMatchPairsCorrect = false;
                         break; // Found one incorrect match
                     }
                 }
                 if (allMatchPairsCorrect) score++; // Add score if all matched correctly

             } else if (requiredPairsCount === 0) {
                  // If there are no required pairs for a match question
                  // Check if user didn't drop any incorrect items (userAnswer should be empty object or null)
                   if (userAnswer === null || (typeof userAnswers === 'object' && Object.keys(userAnswer).length === 0)) {
                       score++; // Award score if no required pairs and user didn't drop anything
                   } else if (typeof userAnswers === 'object' && Object.keys(userAnswers).length > 0) {
                       // If there are no required pairs but user dropped something, it's incorrect (score is not incremented)
                   }
             }

        } else if (q.type === "multichoice") {
             // For multichoice, userAnswer is an array of selected indices
             const userSelected = Array.isArray(userAnswer) ? userAnswer : []; // Default to empty array
             const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : []; // Ensure correctAnswers is an array

             // Score is awarded only if the sorted arrays are identical (same elements, same order, same count)
             const sortedUserSelected = [...userSelected].sort((a, b) => a - b);
             const sortedCorrectAnswers = [...correctAnswers].sort((a, b) => a - b);

             if (sortedUserSelected.length === sortedCorrectAnswers.length &&
                 sortedUserSelected.every((value, index) => value === sortedCorrectAnswers[index])) {
                 score++;
             }
        }
        // Add logic for other question types here if needed
    });
     console.log("Score calculated:", score);
}

// --- Show Results ---
function showResults() {
    console.log("Showing results.");
    stopTimer(); // Stop the timer

    // Hide quiz elements
    quizHeader.classList.add("hidden");
    quizContainer.classList.add("hidden");
    nextBtn.classList.add("hidden"); // Ensure Next/Finish button is hidden
    finishBtn.classList.add("hidden"); // Ensure Finish Early button is hidden


    // Show result elements
    resultContainer.classList.remove("hidden");
    restartBtn.classList.remove("hidden"); // Show restart button


    scoreText.textContent = `Ваш результат: ${score} з ${questions.length}`;

    reviewContainer.innerHTML = ""; // Clear previous review

    // --- Show/Hide Review Based on Option ---
    if (showAnswersAtEnd) {
        console.log("Displaying review answers.");
        reviewContainer.classList.remove("hidden"); // Make sure review container is visible
        // Ensure questions and selectedAnswers are available before trying to render review
        if (!questions || questions.length === 0 || !selectedAnswers || selectedAnswers.length !== questions.length) {
             console.error("Cannot display review: questions or answers array is invalid.");
             reviewContainer.innerHTML = "<p>Не вдалося завантажити деталі відповідей для перегляду.</p>";
             // Do not return, still show score and restart button
        } else {
            questions.forEach((q, i) => {
                const reviewBlock = document.createElement("div");
                reviewBlock.classList.add("review-item");
                reviewBlock.innerHTML = `<h3>Питання ${i + 1}: ${q.question}</h3>`;

                const userAnswer = selectedAnswers[i];
                const correctAnswer = q.correct; // Correct answer definition from JSON

                // --- Review Logic per type ---
                if (q.type === "choice") {
                     // Show all options, mark correct, mark user's choice if different
                    q.answers.forEach((ans, j) => {
                        const p = document.createElement("p");
                        p.textContent = ans;
                        if (j === correctAnswer) p.classList.add("correct"); // Always mark correct option in review
                        if (userAnswer !== null && userAnswer === j && j !== correctAnswer) p.classList.add("incorrect"); // Mark user's WRONG choice

                        reviewBlock.appendChild(p);
                    });
                     // Add overall status for the question
                     const overallStatus = document.createElement("p");
                     overallStatus.classList.add("question-status");
                     const isCorrect = (userAnswer !== null && userAnswer === correctAnswer);
                     overallStatus.textContent = isCorrect ? "Результат по питанню: Правильно" : "Результат по питанню: Неправильно";
                     overallStatus.classList.add(isCorrect ? "correct" : "incorrect");

                     if (userAnswer === null) { // If skipped, explicitly mark as incorrect overall
                         overallStatus.textContent = "Результат по питанню: Неправильно"; // Or "Статус: Пропущено"
                         overallStatus.classList.add("incorrect");
                      }
                     reviewBlock.appendChild(overallStatus);
                }

                if (q.type === "input") {
                    const p = document.createElement("p");
                    const displayUserAnswer = (userAnswer !== null && userAnswer !== "") ? userAnswer : "-";
                    p.innerHTML = `<strong>Ваша відповідь:</strong> ${displayUserAnswer}`;

                    const isCorrect = (userAnswer && typeof userAnswer === 'string' && correctAnswer && typeof correctAnswer === 'string' && userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()); // Ensure correctAnswer is string

                    if (isCorrect) {
                         p.classList.add("correct");
                    } else {
                         p.classList.add("incorrect");
                         // Only show correct answer if user was incorrect or skipped/empty
                         if (!isCorrect || userAnswer === null || (typeof userAnswer === 'string' && userAnswer.trim() === '')) {
                              const correct = document.createElement("p");
                               // Ensure correctAnswer is a string before displaying
                              correct.innerHTML = `<strong>Правильна відповідь:</strong> ${correctAnswer && typeof correctAnswer === 'string' ? correctAnswer : 'Не вказано'}`;
                              correct.classList.add("correct");
                              reviewBlock.appendChild(correct);
                         }
                    }
                    reviewBlock.appendChild(p);

                     // Add overall status for the question
                     const overallStatus = document.createElement("p");
                     overallStatus.classList.add("question-status");
                      overallStatus.textContent = isCorrect ? "Результат по питанню: Правильно" : "Результат по питанню: Неправильно";
                     overallStatus.classList.add(isCorrect ? "correct" : "incorrect");
                      if (userAnswer === null || (typeof userAnswer === 'string' && userAnswer.trim() === '')) { // If skipped or empty input
                         overallStatus.textContent = "Результат по питанню: Неправильно"; // Or "Статус: Пропущено"
                         overallStatus.classList.add("incorrect");
                      }
                     reviewBlock.appendChild(overallStatus);
                }

                if (q.type === "match") {
                    const userAnswers = userAnswer || {}; // User's matches (object)
                    const requiredPairs = q.pairs; // Use q.pairs for correct definition (object)
                    const requiredPairsCount = requiredPairs ? Object.keys(requiredPairs).length : 0;

                    // Review based on the required pairs defined in q.pairs
                    if (requiredPairsCount > 0) {
                        for (const left in requiredPairs) {
                             const correctAns = requiredPairs[left]; // Correct right part for this left part
                             const userAns = userAnswers[left]; // User's matched right part (might be undefined)

                            const p = document.createElement("p");
                             p.classList.add("match-pair"); // Add class for styling pairs in review
                             p.innerHTML = `<strong>${left} →</strong> ${userAns !== undefined ? userAns : "-"}`; // Display user's matched right part or "-"


                             if (userAns !== undefined && userAns === correctAns) {
                                p.classList.add("correct"); // User matched correctly
                             } else {
                                 p.classList.add("incorrect"); // User matched incorrectly or not at all
                                 // Show the correct match below the incorrect user match
                                  const correctPairP = document.createElement("p");
                                  correctPairP.classList.add("match-pair", "correct"); // Style for correct pair in review
                                  correctPairP.innerHTML = `<strong>Правильно: ${left} →</strong> ${correctAns}`;
                                  reviewBlock.appendChild(correctPairP);
                             }
                            reviewBlock.appendChild(p);
                        }
                    } else {
                         // Handle match questions with no required pairs (edge case)
                         const p = document.createElement("p");
                         p.textContent = "Немає елементів для зіставлення в цьому питанні.";
                          p.classList.add("skipped"); // Use skipped style for info
                         reviewBlock.appendChild(p);
                    }


                     // Add overall status for the match question
                     const overallStatus = document.createElement("p");
                     overallStatus.classList.add("question-status");

                     // Determine overall correctness based on calculation logic
                     let calculatedScoreForMatch = 0; // 0 or 1
                      // Check if user answer is a valid object
                     if (userAnswer && typeof userAnswers === 'object') {
                         if (requiredPairsCount > 0 && Object.keys(userAnswers).length === requiredPairsCount) {
                             let allMatchPairsCorrect = true;
                              for(const left in requiredPairs) {
                                   if(!userAnswers.hasOwnProperty(left) || userAnswers[left] !== requiredPairs[left]) { // Check if left key exists AND match is correct
                                        allMatchPairsCorrect = false;
                                        break;
                                   }
                              }
                              if (allMatchPairsCorrect) calculatedScoreForMatch = 1;

                         } else if (requiredPairsCount === 0 && Object.keys(userAnswers).length === 0) {
                              // If no required pairs and user didn't drop anything
                              calculatedScoreForMatch = 1;
                         }
                     }


                     const isOverallCorrect = calculatedScoreForMatch === 1;

                     overallStatus.textContent = isOverallCorrect ? "Результат по питанню: Правильно" : "Результат по питанню: Неправильно";
                     overallStatus.classList.add(isOverallCorrect ? "correct" : "incorrect");

                      // If no matches were attempted at all, consider it incorrect/skipped for overall status display
                      if (userAnswer === null || (typeof userAnswer === 'object' && Object.keys(userAnswer).length === 0 && requiredPairsCount > 0)) { // Only skipped if there WERE required pairs
                           overallStatus.textContent = "Результат по питанню: Неправильно"; // Or "Статус: Пропущено"
                           overallStatus.classList.add("incorrect");
                      } else if (userAnswer !== null && typeof userAnswer === 'object' && Object.keys(userAnswer).length > 0 && requiredPairsCount === 0) {
                          // If there are no required pairs, but user dropped something, it's incorrect.
                           overallStatus.textContent = "Результат по питанню: Неправильно";
                           overallStatus.classList.add("incorrect");
                      } else if (userAnswer === null && requiredPairsCount === 0) {
                           // Match question with no pairs, user skipped. Correct.
                            overallStatus.textContent = "Результат по питанню: Правильно";
                            overallStatus.classList.add("correct");
                      }


                     reviewBlock.appendChild(overallStatus);
                }

                if (q.type === "multichoice") {
                    const userSelected = Array.isArray(userAnswer) ? userAnswer : []; // Default to empty array
                    const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : []; // Ensure correctAnswers is an array

                    q.answers.forEach((ans, j) => {
                        const p = document.createElement("p");
                        p.textContent = ans;
                        const isCorrectAnswer = correctAnswers.includes(j);
                        const isUserSelected = userSelected.includes(j);

                        if (isCorrectAnswer && isUserSelected) {
                            p.classList.add("correct"); // Correctly selected option
                        } else if (!isCorrectAnswer && isUserSelected) {
                            p.classList.add("incorrect"); // Incorrectly selected option
                        } else if (isCorrectAnswer && !isUserSelected) {
                            p.classList.add("not-selected-correct"); // Correct option not selected
                             // p.textContent += " (правильно, але не вибрано)";
                        }
                        // If incorrect and not selected, no special class needed for the option itself.

                        reviewBlock.appendChild(p);
                    });

                     // Check if the entire multichoice question was answered correctly for overall status
                     const sortedUserSelected = [...userSelected].sort((a, b) => a - b);
                     const sortedCorrectAnswers = [...correctAnswers].sort((a, b) => a - b);

                     const questionOverallCorrect = sortedUserSelected.length === sortedCorrectAnswers.length &&
                                                      sortedUserSelected.every((value, index) => value === sortedCorrectAnswers[index]);

                    const overallStatus = document.createElement("p");
                    overallStatus.classList.add("question-status");
                    overallStatus.textContent = questionOverallCorrect ? "Результат по питанню: Правильно" : "Результат по питанню: Неправильно";
                    overallStatus.classList.add(questionOverallCorrect ? "correct" : "incorrect");

                     if (userSelected.length === 0 && (correctAnswer && correctAnswer.length > 0)) { // If no options selected AND there were correct answers to select
                         overallStatus.textContent = "Результат по питанню: Неправильно"; // Or "Статус: Пропущено"
                         overallStatus.classList.add("incorrect");
                     } else if (userSelected.length === 0 && (correctAnswer && correctAnswer.length === 0)) {
                         // Edge case: question with no correct answers, and user selected none. Correct.
                          overallStatus.textContent = "Результат по питанню: Правильно";
                          overallStatus.classList.add("correct");
                     } else if (!Array.isArray(userAnswer) || userAnswer === null) {
                         // If userAnswer is null or not an array (e.g., corrupted state), treat as incorrect/skipped
                         overallStatus.textContent = "Результат по питанню: Неправильно";
                         overallStatus.classList.add("incorrect");
                     }


                    reviewBlock.appendChild(overallStatus);
                }
                // Add logic for other question types here if needed


                 // Add "Skipped" status only if the user *could* have provided an answer but didn't attempt it.
                 // Use the isAnswerProvided helper for a consistent check.
                  const userAnswerValue = selectedAnswers[i];
                  const trulySkipped = !isAnswerProvided(userAnswerValue);

                   if (trulySkipped) {
                        const skippedStatus = document.createElement("p");
                        skippedStatus.textContent = "Статус: Пропущено";
                        skippedStatus.classList.add("skipped");
                        reviewBlock.appendChild(skippedStatus);
                   }


                reviewContainer.appendChild(reviewBlock);
            });
        }


    } else {
         // If showAnswersAtEnd is false, clear the review container and hide it
         reviewContainer.innerHTML = "";
         reviewContainer.classList.add("hidden");
         console.log("Review answers hidden as per user option.");
    }


    // After showing results, clear saved quiz state (even though resume is removed)
    localStorage.removeItem('quizState'); // Use the literal key as constant was removed
    console.log("Quiz state cleared from localStorage.");

    // Also clear any temporary previous result info displayed by loadQuizInfo/showResults
     const prevResultInfo = document.querySelector(".previous-result-info");
     if (prevResultInfo) {
          prevResultInfo.remove();
     }
     // The next time the page loads or restartQuiz is called, initializeQuizSetup will run
     // and display the *new* final result using loadFinalResults().
     console.log("showResults finished, state cleaned up. Ready for new quiz.");
}

// --- Save Quiz State (Progress) ---
// This function's primary purpose (for resume) is removed.
// Keeping it for potential future features or debugging if needed,
// but it doesn't affect the current non-resume flow.
function saveQuizState() {
     // Do not save state if the quiz is finished or not started
     if (quizContainer.classList.contains("hidden")) {
          return;
     }
     // Also prevent saving if essential data is missing
     if (!questions || questions.length === 0 || !Array.isArray(selectedAnswers) || selectedAnswers.length !== questions.length || !currentTopicFile) {
         console.warn("Attempted to save state, but essential data is missing.");
         return;
     }

    const stateToSave = {
        currentQuestionIndex: currentQuestionIndex,
        selectedAnswers: selectedAnswers,
        timeLeft: timeLeft,
        totalTimeForQuiz: totalTimeForQuiz,
        questionsCount: questions.length, // Optional: for validation
        quizStartTime: quizStartTime, // Optional: for timer resume if re-added
        topicFile: currentTopicFile // Save the selected topic file name
    };
    try {
       localStorage.setItem('quizState', JSON.stringify(stateToSave)); // Use literal key
        // console.log(`Quiz state saved (for potential future resume/debugging): Q ${currentQuestionIndex + 1}/${questions.length}, Time left ${timeLeft}s, Topic: ${currentTopicFile}`); // Optional logging
    } catch (e) {
        console.error("Error saving quiz state to localStorage:", e);
    }
}

// --- Save Final Results ---
// (No changes needed here, includes topic and showAnswersOption)
function saveFinalResults() {
    // Recalculate score just in case (e.g. if time ran out unexpectedly)
    calculateFinalScore();
    console.log("Saving final results...");

     // Get the topic name from the currently loaded questions data
     const finishedTopic = testTopics.find(topic => topic.file === currentTopicFile); // Find the topic object by the stored file name
     const finishedTopicName = finishedTopic ? finishedTopic.name : "Невідома тема";

    const resultsToSave = {
        score: score,
        totalQuestions: questions.length,
        topic: finishedTopicName, // Save the topic name
        showAnswersOption: showAnswersAtEnd, // Save the show answers setting used for this result
        timestamp: new Date().toISOString() // Save timestamp of completion
    };
    // Convert object to JSON string and save
    try {
        localStorage.setItem(LOCAL_STORAGE_RESULTS_KEY, JSON.stringify(resultsToSave));
        console.log("Фінальні результати тесту збережено в localStorage.", resultsToSave);
    } catch (e) {
        console.error("Error saving final results to localStorage:", e);
    }
}

// --- Load Final Results (for info display on start screen) ---
// (No changes needed here, displays topic and showAnswersOption)
function loadFinalResults() {
    console.log("Loading previous final results...");
    const savedResults = localStorage.getItem(LOCAL_STORAGE_RESULTS_KEY);
    if (savedResults) {
        try {
            const results = JSON.parse(savedResults);
             // Only show if it was a quiz completion with score available and total questions count
             if (results && results.totalQuestions !== undefined && results.score !== undefined) {
                  const resultInfo = document.createElement("p");
                  resultInfo.classList.add("previous-result-info"); // Add a class for styling
                  const timestamp = results.timestamp ? new Date(results.timestamp).toLocaleString() : 'невідомо';
                  const topicName = results.topic || "Невідома тема"; // Get topic name, default if not saved
                   const showAnswersSetting = results.showAnswersOption !== undefined ?
                                              (results.showAnswersOption ? "Так" : "Ні") : "Невідомо";


                  resultInfo.innerHTML = `<strong>Останній результат:</strong> ${results.score} з ${results.totalQuestions}<br>Тема: ${topicName}<br>Показані відповіді: ${showAnswersSetting}<br><small>(${timestamp})</small>`;

                  // Insert it below the total questions info or replace it if already exists
                   const existingInfo = document.querySelector(".previous-result-info");
                   if (existingInfo) {
                       existingInfo.remove(); // Remove old one if it exists
                   }
                   // Insert before the start button, which should be the next sibling of totalQuestionsInfo
                   // Ensure totalQuestionsInfo and startBtn exist before trying to insert
                   if (totalQuestionsInfo && startBtn && totalQuestionsInfo.parentNode) {
                        totalQuestionsInfo.parentNode.insertBefore(resultInfo, startBtn);
                        console.log("Previous final results displayed.");
                   } else {
                        console.warn("Could not find elements to display previous final results.");
                   }


             } else {
                  console.log("Saved results found but are incomplete or invalid.");
                  // Optionally clear invalid results?
                  // localStorage.removeItem(LOCAL_STORAGE_RESULTS_KEY);
             }

        } catch (e) {
            console.error("Помилка при завантаженні або парсингу останніх результатів:", e);
            localStorage.removeItem(LOCAL_STORAGE_RESULTS_KEY); // Clear incorrect data
        }
    } else {
         console.log("No previous final results found.");
    }
     console.log("loadFinalResults finished.");
}

// --- Restart Quiz ---
function restartQuiz() {
    console.log("Restarting quiz. Transitioning to start screen.");

    // Reset all quiz-in-progress states
    currentQuestionIndex = 0;
    selectedAnswers = []; // Clear answers
    score = 0; // Reset score
    timeLeft = 0; // Reset time
    totalTimeForQuiz = 0; // Reset total time
    quizStartTime = 0; // Reset start time
    currentTopicFile = null; // Clear current topic file

    stopTimer(); // Stop the current timer, if active

    // Clear any saved quiz state (progress) - Redundant if loadQuizInfo doesn't load it, but good practice
    localStorage.removeItem('quizState'); // Use literal key
     console.log("Quiz state cleared from localStorage on restart.");


    // Hide quiz elements and results
    quizHeader.classList.add("hidden");
    quizContainer.classList.add("hidden");
    nextBtn.classList.add("hidden"); // Ensure Next/Finish button is hidden
    finishBtn.classList.add("hidden"); // Ensure Finish Early button is hidden
    resultContainer.classList.add("hidden");
    restartBtn.classList.add("hidden");


    // Show quiz options and info
    quizOptionsContainer.classList.remove("hidden");
    startBtn.classList.remove("hidden"); // Show start button again
    totalQuestionsInfo.classList.remove("hidden"); // Show info again


     // Reset UI elements on options screen
     topicSelect.disabled = false; // Enable topic select
     timedQuizCheckbox.checked = true; // Reset checkbox state to default
     showAnswersCheckbox.checked = true; // Reset checkbox state to default
     timedQuizCheckbox.disabled = false; // Ensure checkbox is enabled
     showAnswersCheckbox.disabled = false; // Ensure checkbox is enabled
     populateTopicSelect(); // Repopulate dropdown


     // Remove any temporary previous result info displayed by loadQuizInfo/showResults
     const prevResultInfo = document.querySelector(".previous-result-info");
     if (prevResultInfo) {
          prevResultInfo.remove();
     }

     // Load questions for the default/initially selected topic to update the total questions info
     // This happens after populateTopicSelect sets the value to the first option
     if (topicSelect.options.length > 0) {
        loadQuestions(topicSelect.value); // Async, will update totalQuestionsInfo when done
     } else {
        console.warn("No topics available after restart to load initial questions.");
        totalQuestionsInfo.textContent = "Немає доступних тем для тестування.";
        startBtn.disabled = true;
     }


    startBtn.textContent = "Почати тест"; // Ensure text is "Почати тест"

    // Reload previous final results (if any) to show them on the fresh start screen
    loadFinalResults();

     console.log("RestartQuiz finished, returned to start screen.");
}

// Initial setup on page load
document.addEventListener("DOMContentLoaded", initializeQuizSetup);