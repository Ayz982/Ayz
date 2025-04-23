console.log("Executing script.js - Version with state saving and navigation logic"); // Додайте це для перевірки, яка версія виконується

let questions = [];
let currentQuestionIndex = 0;
let selectedAnswers = []; // This will store answers: index for 'choice', string for 'input', object for 'match' (for D&D pairs), array of indices for 'multichoice'
let score = 0;

// Timer variables
let timerInterval;
let timeLeft = 0;
const TIME_PER_QUESTION = 60; // Set your desired time per question in seconds
let totalTimeForQuiz = 0;
let quizStartTime; // Timestamp when the quiz started
let isQuizPaused = false; // Flag to track if quiz is paused
let pauseStartTime = 0; // Timestamp when pause started


// localStorage keys
const LOCAL_STORAGE_RESULTS_KEY = "quizResults"; // To save final results
const LOCAL_STORAGE_STATE_KEY = "quizState"; // To save quiz progress


const startBtn = document.getElementById("startBtn");
const quizContainer = document.getElementById("quizContainer");
const questionContainer = document.getElementById("questionContainer");
const nextBtn = document.getElementById("nextBtn");
const finishBtn = document.getElementById("finishBtn");
// const prevBtn = document.getElementById("prevBtn"); // Кнопка "Попереднє" відсутня у наданому HTML - розкоментуйте, якщо додасте
const resultContainer = document.getElementById("resultContainer");
const scoreText = document.getElementById("score");
const reviewContainer = document.getElementById("reviewContainer");
const totalQuestionsInfo = document.getElementById("totalQuestionsInfo");
const quizHeader = document.getElementById("quizHeader");
const timerElement = document.getElementById("time");
const progressBar = document.getElementById("progress-bar");
const questionCounterElement = document.getElementById("questionCounter");
const currentQuestionNumElement = document.getElementById("currentQuestionNum");
const totalQuestionsCountElement = document.getElementById("totalQuestionsCount");
const restartBtn = document.getElementById("restartBtn");
// const pauseResumeBtn = document.getElementById("pauseResumeBtn"); // Кнопка Пауза/Продовжити - потрібно додати ID в HTML, якщо плануєте використовувати


// DOMContentLoaded listener
document.addEventListener("DOMContentLoaded", loadQuizInfo);

// Event listeners
startBtn.addEventListener("click", startQuiz);
nextBtn.addEventListener("click", showNextQuestion); // Ця функція визначена нижче
finishBtn.addEventListener("click", finishQuizEarly); // Ця функція визначена нижче
// if (prevBtn) { // Логіка для кнопки "Попереднє" - розкоментуйте, якщо додасте кнопку в HTML з id="prevBtn"
//     prevBtn.addEventListener("click", showPreviousQuestion); // Ця функція визначена нижче
// }
if (restartBtn) {
    restartBtn.addEventListener("click", restartQuiz); // Ця функція визначена нижче
}
// if (pauseResumeBtn) { // Логіка для кнопки "Пауза" - розкоментуйте, якщо додасте ID в HTML
//    pauseResumeBtn.addEventListener("click", togglePause); // Ця функція визначена нижче
// }


// --- Timer Functions ---
function startTimer() {
     // If resuming, timeLeft might be loaded. If starting new, it's 0 or recalculated.
     // Check startBtn text or a dedicated flag to know if it's a new quiz start
     const isNewQuiz = startBtn.textContent === "Почати тест";

     if (isNewQuiz || timeLeft <= 0 || totalTimeForQuiz <= 0) {
         totalTimeForQuiz = questions.length * TIME_PER_QUESTION;
         timeLeft = totalTimeForQuiz;
     }
     // Adjust start time based on loaded timeLeft if resuming, otherwise use now
     quizStartTime = Date.now() - (totalTimeForQuiz - timeLeft) * 1000;


    isQuizPaused = false; // Ensure timer is not paused on start/resume
    // if (pauseResumeBtn) pauseResumeBtn.textContent = "Пауза"; // Update button text

    // Clear any existing interval before starting a new one
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer(); // Update immediately
    timerElement.classList.remove("warning");
}

function updateTimer() {
    if (isQuizPaused) return; // Do nothing if paused

    const now = Date.now();
    // Якщо quizStartTime не встановлено (наприклад, при першому завантаженні без збереженого стану або після скидання), встановлюємо його
    if (!quizStartTime || quizStartTime === 0) {
        quizStartTime = now - (totalTimeForQuiz - timeLeft) * 1000; // Calculate based on current timeLeft
    }


    const elapsed = Math.floor((now - quizStartTime) / 1000);
    timeLeft = totalTimeForQuiz - elapsed;

    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerElement.textContent = "00:00";
        // Ensure timeLeft is exactly 0 before finishing
        timeLeft = 0;
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

    // Save state periodically while timer is running (e.g., every 5 seconds) - Optional
    // Saving on answer/submit/navigation is generally sufficient and less heavy.
    // if (timeLeft % 5 === 0) { // Save every 5 seconds - this can be heavy
    //     saveQuizState();
    // }
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null; // Clear the interval ID
}

// function togglePause() { // Логіка для кнопки "Пауза" - розкоментуйте, якщо додасте ID в HTML
//     if (isQuizPaused) {
//         // Resume
//         isQuizPaused = false;
//         // Adjust start time based on pause duration
//         const pauseDuration = Date.now() - pauseStartTime;
//         quizStartTime += pauseDuration; // Add the pause duration to the original start time
//         timerInterval = setInterval(updateTimer, 1000);
//         if (pauseResumeBtn) pauseResumeBtn.textContent = "Продовжити";
//          console.log("Таймер відновлено.");
//          saveQuizState(); // Save state when resuming
//     } else {
//         // Pause
//         isQuizPaused = true;
//         pauseStartTime = Date.now(); // Record pause start time
//         clearInterval(timerInterval);
//         if (pauseResumeBtn) pauseResumeBtn.textContent = "Пауза";
//         saveQuizState(); // Save state when pausing
//          console.log("Таймер на паузі.");
//     }
// }


// --- Progress Bar Function ---
function updateProgressBar() {
    // Progress is based on completed questions (current index) divided by total
    const completedQuestions = currentQuestionIndex; // Number of questions *before* the current one
    const progress = (completedQuestions / questions.length) * 100;
    progressBar.style.width = `${progress}%`;

    currentQuestionNumElement.textContent = currentQuestionIndex + 1; // Display 1-based index
    totalQuestionsCountElement.textContent = questions.length;
    // questionCounterElement.classList.remove("hidden"); // Show counter - it's always visible in your HTML structure
}


// --- Load Quiz Info & State ---
async function loadQuizInfo() {
    try {
        const res = await fetch("questions.json");
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        questions = await res.json();

        if (!questions || questions.length === 0) {
            totalQuestionsInfo.textContent = "Не вдалося завантажити запитання або список запитань порожній.";
            startBtn.disabled = true;
            return;
        }

        totalQuestionsInfo.textContent = `Всього питань у тесті: ${questions.length}`;
        totalQuestionsCountElement.textContent = questions.length; // Ensure total count is set


        // --- Load saved quiz state ---
        const savedState = localStorage.getItem(LOCAL_STORAGE_STATE_KEY);
        if (savedState) {
             try {
                 const state = JSON.parse(savedState);
                 // Basic validation: check if question count matches and answers array exists
                 if (state && state.questionsCount === questions.length && Array.isArray(state.selectedAnswers)) {
                      console.log("Знайдено збережений стан тесту. Питання:", state.currentQuestionIndex + 1, "Відповідей збережено:", state.selectedAnswers.filter(a => isAnswerProvided(a)).length); // Use helper here

                      // Restore state variables
                      currentQuestionIndex = state.currentQuestionIndex;
                      selectedAnswers = state.selectedAnswers;
                      timeLeft = state.timeLeft;
                      totalTimeForQuiz = state.totalTimeForQuiz;
                      quizStartTime = state.quizStartTime;
                      // isQuizPaused = state.isQuizPaused || false; // Restore pause state
                      // pauseStartTime = state.pauseStartTime || 0; // Restore pause start time


                      // Check if the quiz was already finished in the saved state (e.g., time ran out on the last question)
                       if (currentQuestionIndex >= questions.length || (timeLeft <= 0 && currentQuestionIndex === questions.length -1 && isAnswerProvided(selectedAnswers[currentQuestionIndex]))) {
                           // Quiz was finished or time ran out on the last answered question, show results
                            console.log("Збережений стан вказує на завершений тест або час закінчився на останньому питанні. Показуємо результати.");
                           // Recalculate final score based on potentially incomplete answers if time ran out
                           calculateFinalScore();
                           showResults(); // Go directly to results screen
                           localStorage.removeItem(LOCAL_STORAGE_STATE_KEY); // Clear state after showing results

                       } else {
                            // Quiz was in progress, offer to resume
                            startBtn.textContent = "Продовжити тест";
                            totalQuestionsInfo.textContent += ` | Ви проходили тест. Питання ${state.currentQuestionIndex + 1} з ${questions.length}. Залишилось часу: ${Math.floor(state.timeLeft / 60).toString().padStart(2, '0')}:${(state.timeLeft % 60).toString().padStart(2, '0')}`;
                            // Optionally, show a separate resume button and keep start new button
                       }


                 } else {
                      console.log("Збережений стан тесту недійсний або несумісний. Починаємо новий тест.");
                      localStorage.removeItem(LOCAL_STORAGE_STATE_KEY); // Clear invalid state
                      // Keep default start button text and info
                 }
             } catch (e) {
                 console.error("Помилка при парсингу збереженого стану:", e);
                 localStorage.removeItem(LOCAL_STORAGE_STATE_KEY); // Clear corrupted state
                 // Keep default start button text and info
             }
        } else {
             console.log("Збережених станів тесту не знайдено.");
             // Keep default start button text and info
        }


        // --- Load previous final results (optional, for info display) ---
        loadFinalResults(); // Display previous final result if any

        startBtn.disabled = false;

    } catch (err) {
        console.error("Помилка завантаження або обробки запитань:", err);
        totalQuestionsInfo.textContent = "Сталася помилка під час завантаження запитань.";
        startBtn.disabled = true;
    }
}

// --- Start or Resume Quiz ---
function startQuiz() {
    if (!questions || questions.length === 0) {
        console.warn("Немає запитань для початку тесту.");
        return;
    }

    // Determine if we are resuming or starting a new test
    const isResuming = startBtn.textContent === "Продовжити тест" && selectedAnswers.length === questions.length && timeLeft > 0; // Check if answers array was loaded and time left

    if (!isResuming) {
        // Starting a new test
        currentQuestionIndex = 0;
        selectedAnswers = new Array(questions.length).fill(null);
        score = 0; // Reset score
        timeLeft = 0; // Will be calculated in startTimer
        totalTimeForQuiz = 0; // Will be calculated in startTimer
        quizStartTime = 0; // Reset start time
        isQuizPaused = false;
        pauseStartTime = 0;
        localStorage.removeItem(LOCAL_STORAGE_STATE_KEY); // Clear any old state
         console.log("Почато новий тест.");
    } else {
        // Resuming an existing test - state variables are already loaded in loadQuizInfo
         console.log("Тест відновлено.");
         // Ensure totalTimeForQuiz is set correctly if resuming
         if (!totalTimeForQuiz || totalTimeForQuiz <= 0) {
              totalTimeForQuiz = questions.length * TIME_PER_QUESTION;
         }
         // Ensure timeLeft is not negative if time ran out while page was closed - handled in loadQuizInfo
         // quizStartTime is already loaded from state if resuming
    }


    startBtn.classList.add("hidden");
    totalQuestionsInfo.classList.add("hidden");
    resultContainer.classList.add("hidden");

    quizHeader.classList.remove("hidden");
    quizContainer.classList.remove("hidden");
    // if (pauseResumeBtn) pauseResumeBtn.classList.remove("hidden"); // Show pause button if it exists


    // If resuming and time has run out, go directly to finish
    // This check is also done in loadQuizInfo, but good to have here too in case startQuiz is called directly
    if (isResuming && timeLeft <= 0) {
         console.log("Час закінчився при відновленні. Завершуємо тест.");
         finishQuizEarly(); // This will also calculate score and show results
         return; // Stop startQuiz execution here
    }


    startTimer(); // Start or resume the timer
    updateProgressBar(); // Initialize progress bar based on currentQuestionIndex

    // Show/hide navigation buttons based on current index
    updateNavigationButtons();

    showQuestion(); // Load the current or first question
}

// --- Show Next Question ---
function showNextQuestion() {
    // This function is called when the "Наступне" or "Завершити" button is clicked.
    // The answer for the current question should already be saved in selectedAnswers
    // by the respective answer/submit handlers before this button becomes visible/clickable.

    currentQuestionIndex++; // Move to the next question index

    if (currentQuestionIndex < questions.length) {
        // If there are more questions, show the next one
        console.log("Showing next question:", currentQuestionIndex + 1);
        showQuestion();
    } else {
        // If this was the last question (or we went past it), finish the quiz
        console.log("End of quiz, showing results.");
        calculateFinalScore();
        saveFinalResults(); // Save the result using the dedicated function
        showResults();
    }
}

// --- Finish Quiz Early ---
function finishQuizEarly() {
     console.log("Finishing quiz early.");
     stopTimer(); // Stop the timer

     // Save the state one last time to capture the current question's answer if any was provided
     saveQuizState();

     calculateFinalScore(); // Calculate the final score based on all selectedAnswers
     saveFinalResults(); // Save the result using the dedicated function
     showResults(); // Show the results
}

// --- Show Question ---
function showQuestion() {
    // Save state before showing a new question (user is leaving the previous one)
    // This prevents losing the answer on the previous question if navigating back/next
     // Only save if we are not on the very first question being loaded initially (index 0, answers[0] is null)
     // and if questions are actually loaded.
     if (questions.length > 0 && (currentQuestionIndex > 0 || (currentQuestionIndex === 0 && isAnswerProvided(selectedAnswers[0])))) { // Use helper here
         saveQuizState();
     }


    if (currentQuestionIndex >= questions.length) {
         console.error("showQuestion called with invalid index:", currentQuestionIndex, "Total questions:", questions.length);
         // If this happens, redirect to results or show an error
         if (currentQuestionIndex === questions.length && questions.length > 0) {
              // This might happen if finishQuizEarly was somehow bypassed after the last question
              calculateFinalScore();
              showResults();
         }
         return;
    }

    const question = questions[currentQuestionIndex];
    questionContainer.innerHTML = `<h2>Питання ${currentQuestionIndex + 1}: ${question.question}</h2>`;

    // Clear previous immediate feedback message (if using a separate div)
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

                 saveQuizState(); // Save state after answer
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

            saveQuizState(); // Save state after submit
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
         const leftItems = Object.keys(question.pairs); // Use pairs to get the items that *need* a match
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
         const rightOptions = [...question.options].sort(() => Math.random() - 0.5); // Copy and shuffle options

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
                       if (!question.pairs.hasOwnProperty(leftText)) {
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
                       showMatchFeedback(li, leftText, rightText, question.pairs);

                      // Check if all required pairs are matched
                      checkMatchCompletion();

                       saveQuizState(); // Save state after each successful drag/drop
                 }
             });
             rightList.appendChild(li);
         });

         matchContainer.appendChild(leftList);
         matchContainer.appendChild(rightList);
         questionContainer.appendChild(matchContainer);


         // Function to check if all *required* pairs are matched, and show Next button
         function checkMatchCompletion() {
              const requiredPairsCount = Object.keys(question.pairs).length;
              // Count how many of the *required* left items have been matched by the user
              let completedRequiredMatches = 0;
              for (const left in question.pairs) {
                  // Check if the left item is present in user's answers (means it was dropped somewhere)
                  if (matchAnswers.hasOwnProperty(left) && matchAnswers[left] !== null) {
                       completedRequiredMatches++;
                  }
              }

              if (completedRequiredMatches === requiredPairsCount && requiredPairsCount > 0) { // Ensure there are required pairs
                   // All required items have been dropped somewhere. Now check if Next should be visible.
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
                        showMatchFeedback(dropTarget, leftText, rightText, question.pairs);

                       restoredLeftItems.add(leftText); // Mark this left item as restored
                       // Disable drop target events directly if needed (more complex)
                       // A simpler approach is checking dataset.matchedLeft in dragover/drop listeners
                  } else {
                        // Handle case where a saved rightText doesn't exist in current options
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

         const correctAnswers = question.correct; // Array of correct indices from JSON

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
              const isSubmitted = Array.isArray(userAnswer) && submitBtn && submitBtn.classList.contains("hidden");


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
                 // We don't save state on every checkbox change, only on submit or navigation
            });

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(answer));
            questionContainer.appendChild(label);
        });

        const submit = document.createElement("button");
        submit.textContent = "Підтвердити";

         // Restore state: Hide submit button if already submitted
         const userAnswer = selectedAnswers[currentQuestionIndex];
          // Submitted if answer is an array and submit button was hidden
          const isSubmitted = Array.isArray(userAnswer) && submit.classList.contains("hidden");


          if (isSubmitted) {
              // Hide submit button and disable checkboxes if already submitted
               const checkboxes = questionContainer.querySelectorAll("input[type='checkbox']");
               if (checkboxes.length > 0) {
                   checkboxes.forEach(cb => cb.disabled = true); // Ensure checkboxes are disabled
                   submit.classList.add("hidden"); // Hide the submit button
               }
               // nextBtn.classList.remove("hidden"); // Handled by updateNavigationButtons
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
             const correctAnswers = question.correct;
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

            saveQuizState(); // Save state after submit
        });
        questionContainer.appendChild(submit);

         // If already answered, ensure feedback is shown on load (logic integrated above)
    }
    // --- END MULTICHOICE TYPE ---


     // Update progress after loading question
     updateProgressBar();

     // Save state after rendering UI and restoring answers/feedback for the current question
     // This ensures the state in localStorage matches the displayed UI, crucial for resuming.
     // This call is important AFTER all UI restoration for the current question is done.
     // It complements the call at the start of showQuestion for saving the PREVIOUS question.
     saveQuizState(); // This should save the state of the question that was just displayed and potentially updated
}

// --- Helper function to check if an answer is provided for a given value ---
// Used in loadQuizInfo and updateNavigationButtons to determine if a question is "answered"
function isAnswerProvided(answerValue) {
     if (answerValue === null) return false; // Default null state
     if (typeof answerValue === 'string' && answerValue.trim() === '') return false; // Empty string for input
     if (Array.isArray(answerValue) && answerValue.length === 0) return false; // Empty array for multichoice
     if (typeof answerValue === 'object' && Object.keys(answerValue).length === 0) return false; // Empty object for match
     // For other types or non-empty values, consider it provided
     return true;
}


// --- Update Navigation Buttons Visibility and Text ---
function updateNavigationButtons() {
    // Кнопки "Попереднє" немає у наданому HTML, логіку приховано.
    // if (prevBtn) {
    //     if (currentQuestionIndex > 0) {
    //         prevBtn.classList.remove("hidden");
    //     } else {
    //         prevBtn.classList.add("hidden");
    //     }
    // }

    // Приховуємо "Наступне" та "Завершити" за замовчуванням
    nextBtn.classList.add("hidden");
    finishBtn.classList.add("hidden");


     // Встановлюємо текст кнопки "Наступне"
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
               isQuestionSubmitted = submitBtn ? submitBtn.classList.contains("hidden") : false; // Multichoice should always have a submit button initially
          } else if (question.type === 'match') {
               // Match is submitted if the number of user's matches equals the number of required pairs
               const matchAnswers = selectedAnswers[currentQuestionIndex] || {};
               const requiredPairsCount = Object.keys(question.pairs).length;
               isQuestionSubmitted = Object.keys(matchAnswers).length === requiredPairsCount && requiredPairsCount > 0; // Consider submitted only if required pairs exist and are all matched
          }
          // Add logic for other question types here if needed
     }

     console.log(`UpdateNavButtons Q${currentQuestionIndex+1}: isSubmitted=${isQuestionSubmitted}, isLastQ=${isLastQuestion}`);


     // If the question is submitted, show the Next/Finish button
     if (isQuestionSubmitted) {
          nextBtn.classList.remove("hidden");
          // The "Finish Early" button is only shown if it's *not* the last question.
          if (!isLastQuestion) {
               finishBtn.classList.remove("hidden");
          } else {
               finishBtn.classList.add("hidden"); // Hide "Finish Early" on the last question
          }
     } else {
          // If the question is NOT submitted, hide the Next button, but show Finish Early if not the last question
          nextBtn.classList.add("hidden");
          if (!isLastQuestion) {
               finishBtn.classList.remove("hidden");
          } else {
               finishBtn.classList.add("hidden"); // Hide both Next and Finish Early on the last question until answered
          }

     }
      // Add console logs for button visibility state after updating
     console.log(`Next hidden: ${nextBtn.classList.contains("hidden")}, Finish hidden: ${finishBtn.classList.contains("hidden")}`);
}


// --- Show Previous Question ---
// Функція для кнопки "Попереднє" - розкоментуйте, якщо додасте кнопку в HTML з id="prevBtn"
// function showPreviousQuestion() {
//     if (currentQuestionIndex > 0) {
//         // Save the state of the current question before moving back
//         // saveQuizState() is already called at the start of showQuestion when navigating away
//         currentQuestionIndex--;
//         showQuestion();
//     }
// }


// --- Show Immediate Feedback (Helper Functions per Type) ---
function showInputFeedback(inputElement, userAnswer, correctAnswer) {
     // Clear any previous feedback classes
     inputElement.classList.remove('correct-answer-input', 'incorrect-answer-input');

     if (userAnswer && typeof userAnswer === 'string') {
          if (userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) { // Compare trimmed and lowercased
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

     // Check if the left text dropped here has a correct pair defined AND if the right text matches the correct right text
     // Use hasOwnProperty to ensure the leftText is expected in the correct pairs
     if (correctPairs.hasOwnProperty(matchedLeftText) && correctPairs[matchedLeftText] === matchedRightText) {
         dropTargetLi.classList.add('correct-match');
         // Optionally add text feedback or icon
         // dropTargetLi.innerHTML += ' ✅';
     } else {
         dropTargetLi.classList.add('incorrect-match');
         // Optionally add text feedback or icon
         // dropTargetLi.innerHTML += ' ❌';
     }
}

// Helper for Multichoice Feedback (applied to the Label) - Called after submit or on load if submitted
// Logic integrated directly in showQuestion and submit handler


// --- Calculate Final Score ---
function calculateFinalScore() {
    score = 0; // Reset score before recalculating

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
            if (userAnswer && typeof userAnswer === 'string' && userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
                score++;
            }
        } else if (q.type === "match") {
             // For match, userAnswer is an object { left_item: right_item_text, ... }
             // correctAnswer is the object { left_item: correct_right_item_text, ... } from q.pairs
             let allMatchedCorrectly = true;
             const requiredPairs = q.pairs; // Use q.pairs to get the correct pairs definition

             // Score is awarded only if ALL required items are matched correctly to their correct partners.
             // Check if user answer is an object AND has the same number of *required* keys AND all matches are correct.
             if (userAnswer && typeof userAnswer === 'object' && Object.keys(userAnswer).length === Object.keys(requiredPairs).length && Object.keys(requiredPairs).length > 0) {
                 // Iterate through the *required* pairs defined in q.pairs
                 for (const left in requiredPairs) {
                     // Check if the left part exists in user answer AND the matched right part is correct
                     if (!userAnswer.hasOwnProperty(left) || userAnswer[left] !== requiredPairs[left]) {
                         allMatchedCorrectly = false;
                         break; // Found one incorrect match
                     }
                 }
             } else {
                 allMatchedCorrectly = false; // User did not match all required pairs correctly, or provided wrong format/count
             }

            if (allMatchedCorrectly) {
                score++;
            }

        } else if (q.type === "multichoice") {
             // For multichoice, userAnswer is an array of selected indices
             // correctAnswer is the array of correct indices
             const sortedUserAnswer = Array.isArray(userAnswer) ? [...userAnswer].sort((a,b) => a - b) : [];
             const sortedCorrectAnswer = Array.isArray(correctAnswer) ? [...correctAnswer].sort((a,b) => a - b) : [];

             // Score is awarded only if the sorted arrays are identical (same elements, same order, same count)
             if (sortedUserAnswer.length === sortedCorrectAnswer.length &&
                 sortedUserAnswer.every((value, index) => value === sortedCorrectAnswer[index])) {
                 score++;
             }
        }
        // Add logic for other question types here if needed
    });
}

// --- Show Results ---
function showResults() {
    stopTimer(); // Зупиняємо таймер

    quizHeader.classList.add("hidden"); // Приховуємо хедер тесту
    quizContainer.classList.add("hidden");
    finishBtn.classList.add("hidden"); // Приховуємо кнопку "Завершити тест" (хоча вона вже прихована updateNavigationButtons на останньому питанні)
    // if (prevBtn) prevBtn.classList.add("hidden"); // Приховуємо кнопку "Попереднє"

    resultContainer.classList.remove("hidden");
    restartBtn.classList.remove("hidden"); // Показуємо кнопку "Спробувати ще раз"


    scoreText.textContent = `Ваш результат: ${score} з ${questions.length}`;

    reviewContainer.innerHTML = ""; // Clear previous review

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
                 // Note: selected-correct is for immediate feedback, 'correct' is enough for review

                reviewBlock.appendChild(p);
            });
             // Add overall status for the question
             const overallStatus = document.createElement("p");
             overallStatus.classList.add("question-status");
             // Determine correctness for display purposes in review summary
             const isCorrect = (userAnswer !== null && userAnswer === correctAnswer);
             overallStatus.textContent = isCorrect ? "Результат по питанню: Правильно" : "Результат по питанню: Неправильно";
             overallStatus.classList.add(isCorrect ? "correct" : "incorrect");

             if (userAnswer === null) { // If skipped, explicitly mark as incorrect overall
                 overallStatus.textContent = "Результат по питанню: Неправильно"; // Or "Статус: Пропущено" could be used here instead of separate <p>
                 overallStatus.classList.add("incorrect");
              }
             reviewBlock.appendChild(overallStatus);
        }

        if (q.type === "input") {
            const p = document.createElement("p");
            const displayUserAnswer = (userAnswer !== null && userAnswer !== "") ? userAnswer : "-";
            p.innerHTML = `<strong>Ваша відповідь:</strong> ${displayUserAnswer}`;

            const isCorrect = (userAnswer && typeof userAnswer === 'string' && userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim());

            if (isCorrect) {
                 p.classList.add("correct");
            } else {
                 p.classList.add("incorrect");
                 // Only show correct answer if user was incorrect or skipped
                 if (!isCorrect || userAnswer === null || (typeof userAnswer === 'string' && userAnswer.trim() === '')) {
                      const correct = document.createElement("p");
                      correct.innerHTML = `<strong>Правильна відповідь:</strong> ${correctAnswer}`;
                      correct.classList.add("correct"); // Style for correct answer in review
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
            let questionOverallCorrect = true; // Assume correct until proven otherwise in calculating individual pairs
            const requiredPairs = q.pairs; // Use q.pairs for correct definition (object)

            // Review based on the required pairs defined in q.pairs
            for (const left in requiredPairs) {
                 const correctAns = requiredPairs[left]; // Correct right part for this left part
                 const userAns = userAnswers[left]; // User's matched right part (might be undefined)

                const p = document.createElement("p");
                 p.classList.add("match-pair"); // Додаємо клас для стилізації пари в review
                 p.innerHTML = `<strong>${left} →</strong> ${userAns !== undefined ? userAns : "-"}`; // Display user's matched right part or "-"


                 if (userAns !== undefined && userAns === correctAns) {
                    p.classList.add("correct"); // User matched correctly
                 } else {
                     p.classList.add("incorrect"); // User matched incorrectly or not at all
                     // No need to set questionOverallCorrect = false here, will check overall status below
                     // Show the correct match below the incorrect user match
                      const correctPairP = document.createElement("p");
                      correctPairP.classList.add("match-pair", "correct"); // Стиль для правильної пари в review
                      correctPairP.innerHTML = `<strong>Правильно: ${left} →</strong> ${correctAns}`;
                      reviewBlock.appendChild(correctPairP);
                 }
                reviewBlock.appendChild(p);
            }

             // Add overall status for the match question
             const overallStatus = document.createElement("p");
             overallStatus.classList.add("question-status");

             // Determine overall correctness based on calculation logic (similar to calculateFinalScore)
             let calculatedScoreForMatch = 0;
             const requiredPairsCount = Object.keys(requiredPairs).length;
              // Score is 1 only if user answered AND matched all required pairs correctly
              if (userAnswer && typeof userAnswer === 'object' && Object.keys(userAnswer).length === requiredPairsCount && requiredPairsCount > 0) {
                 let allMatchPairsCorrect = true;
                  for(const left in requiredPairs) {
                       if(!userAnswer.hasOwnProperty(left) || userAnswer[left] !== requiredPairs[left]) { // Check if left key exists AND match is correct
                            allMatchPairsCorrect = false;
                            break;
                       }
                  }
                  if (allMatchPairsCorrect) calculatedScoreForMatch = 1;
             }

             const isOverallCorrect = calculatedScoreForMatch === 1;

             overallStatus.textContent = isOverallCorrect ? "Результат по питанню: Правильно" : "Результат по питанню: Неправильно";
             overallStatus.classList.add(isOverallCorrect ? "correct" : "incorrect");

              // If no matches were attempted at all, consider it incorrect/skipped for overall status display
              if (userAnswer === null || (typeof userAnswer === 'object' && Object.keys(userAnswer).length === 0)) { // Use isAnswerProvided? No, check specific state for match
                   overallStatus.textContent = "Результат по питанню: Неправильно"; // Or "Статус: Пропущено"
                   overallStatus.classList.add("incorrect");
              }

             reviewBlock.appendChild(overallStatus);
        }

        if (q.type === "multichoice") {
            const correctAnswers = correctAnswer; // Array of correct indices from JSON
            const userSelected = Array.isArray(userAnswer) ? userAnswer : []; // Array of user's selected indices

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

             if (userSelected.length === 0 && correctAnswer.length > 0) { // If no options were selected and there were correct answers to select
                 overallStatus.textContent = "Результат по питанню: Неправильно"; // Or "Статус: Пропущено"
                 overallStatus.classList.add("incorrect");
             } else if (userSelected.length === 0 && correctAnswer.length === 0) {
                 // Edge case: question with no correct answers, and user selected none. Could be correct.
                 // The calculateFinalScore handles this as correct.
                  overallStatus.textContent = "Результат по питанню: Правильно";
                  overallStatus.classList.add("correct");
             }

            reviewBlock.appendChild(overallStatus);
        }
        // Add logic for other question types here if needed


         // Add "Skipped" status only if the user *could* have provided an answer but didn't attempt it.
         // Check if the entry in selectedAnswers is the initial/empty state for the type.
          const userAnswerValue = selectedAnswers[i];
           let trulySkipped = false;
            if (userAnswerValue === null && q.type !== 'multichoice' && q.type !== 'match') trulySkipped = true; // Initial state for choice, input
            if (Array.isArray(userAnswerValue) && userAnswerValue.length === 0 && q.type === 'multichoice') trulySkipped = true; // Initial state for multichoice
            if (typeof userAnswerValue === 'object' && Object.keys(userAnswerValue).length === 0 && q.type === 'match') trulySkipped = true; // Initial state for match

           if (trulySkipped) {
                const skippedStatus = document.createElement("p");
                skippedStatus.textContent = "Статус: Пропущено";
                skippedStatus.classList.add("skipped");
                reviewBlock.appendChild(skippedStatus);
           }


        reviewContainer.appendChild(reviewBlock);
    });

    // After showing results, clear saved quiz state
    localStorage.removeItem(LOCAL_STORAGE_STATE_KEY);
    // Also clear any temporary previous result info displayed on the start screen
     const prevResultInfo = document.querySelector(".previous-result-info");
     if (prevResultInfo) {
          prevResultInfo.remove();
     }
}

// --- Save Quiz State (Progress) ---
function saveQuizState() {
     // Do not save state if the quiz is finished or not started
     // Check if quizContainer is visible (meaning test is in progress)
     if (quizContainer.classList.contains("hidden")) {
          // console.log("Attempted to save state, but quiz container is hidden.");
          return;
     }
     // Also prevent saving if questions are not loaded
     if (!questions || questions.length === 0) {
         // console.log("Attempted to save state, but questions are not loaded.");
         return;
     }


    const stateToSave = {
        currentQuestionIndex: currentQuestionIndex,
        selectedAnswers: selectedAnswers,
        timeLeft: timeLeft, // Save remaining time
        totalTimeForQuiz: totalTimeForQuiz, // Save total time
        questionsCount: questions.length, // Save question count for validation on load
        quizStartTime: quizStartTime // Save start time to accurately resume timer
        // isQuizPaused: isQuizPaused, // Save pause state if implementing pause
        // pauseStartTime: pauseStartTime // Save pause start time if implementing pause
    };
    try {
       localStorage.setItem(LOCAL_STORAGE_STATE_KEY, JSON.stringify(stateToSave));
        // console.log(`Quiz state saved: Q ${currentQuestionIndex + 1}/${questions.length}, Time left ${timeLeft}s`); // Optional logging
    } catch (e) {
        console.error("Error saving quiz state to localStorage:", e);
        // Optionally alert user or use a different storage method
    }
}

// --- Save Final Results ---
function saveFinalResults() {
    // Recalculate score just in case (e.g. if time ran out unexpectedly)
    calculateFinalScore();

    const resultsToSave = {
        score: score,
        totalQuestions: questions.length,
        // Optionally save selectedAnswers here too for detailed review later if needed,
        // selectedAnswers: selectedAnswers, // Saved in quizState, cleared after results
        timestamp: new Date().toISOString() // Save timestamp of completion
    };
    // Convert object to JSON string and save
    try {
        localStorage.setItem(LOCAL_STORAGE_RESULTS_KEY, JSON.stringify(resultsToSave));
        console.log("Фінальні результати тесту збережено в localStorage.");
    } catch (e) {
        console.error("Error saving final results to localStorage:", e);
    }
}

// --- Load Final Results (for info display on start screen) ---
function loadFinalResults() {
    const savedResults = localStorage.getItem(LOCAL_STORAGE_RESULTS_KEY);
    if (savedResults) {
        try {
            const results = JSON.parse(savedResults);
             // Only show if it was a full quiz completion with the same number of questions and score is available
             if (results && results.totalQuestions === questions.length && results.score !== undefined) {
                  const resultInfo = document.createElement("p");
                  resultInfo.classList.add("previous-result-info"); // Add a class for styling
                  const timestamp = results.timestamp ? new Date(results.timestamp).toLocaleString() : 'невідомо';
                  resultInfo.innerHTML = `<strong>Ваш останній результат:</strong> ${results.score} з ${results.totalQuestions}<br><small>(${timestamp})</small>`;

                  // Insert it below the total questions info or replace it if already exists
                   const existingInfo = document.querySelector(".previous-result-info");
                   if (existingInfo) {
                       existingInfo.remove(); // Remove old one if it exists
                   }
                   // Insert before the start button, which should be the next sibling of totalQuestionsInfo
                   // Ensure totalQuestionsInfo and startBtn exist before trying to insert
                   if (totalQuestionsInfo && startBtn && totalQuestionsInfo.parentNode) {
                        totalQuestionsInfo.parentNode.insertBefore(resultInfo, startBtn);
                   }


             }

        } catch (e) {
            console.error("Помилка при завантаженні або парсингу останніх результатів:", e);
            localStorage.removeItem(LOCAL_STORAGE_RESULTS_KEY); // Clear incorrect data
        }
    }
}

// --- Restart Quiz ---
function restartQuiz() {
    // Reset all states
    currentQuestionIndex = 0;
    selectedAnswers = new Array(questions.length).fill(null); // Reset answers
    score = 0; // Reset score
    timeLeft = 0; // Will be calculated in startTimer
    totalTimeForQuiz = 0; // Will be calculated in startTimer
    quizStartTime = 0; // Reset start time
    isQuizPaused = false;
    pauseStartTime = 0;

    stopTimer(); // Stop the current timer, if active

    // Clear any saved state
    localStorage.removeItem(LOCAL_STORAGE_STATE_KEY);
     console.log("Тест перезапущено.");

    // Hide results screen
    resultContainer.classList.add("hidden");
    restartBtn.classList.add("hidden");

    // Show quiz header and container
    quizHeader.classList.remove("hidden");
    quizContainer.classList.remove("hidden");
    // if (pauseResumeBtn) pauseResumeBtn.classList.add("hidden"); // Hide pause button on restart


    // Приховуємо/показуємо кнопки навігації - вони будуть оновлені в showQuestion
    // nextBtn ховається в updateNavigationButtons (викликається в showQuestion)
    // finishBtn visible if not the last question (handled by updateNavigationButtons)
    // No prevBtn logic needed as per current HTML
    updateNavigationButtons(); // Ensure initial state is applied


    // Reset start button text
     startBtn.textContent = "Почати тест"; // Ensure text is "Почати тест"

    // Show total questions info again before quiz starts
     totalQuestionsInfo.classList.remove("hidden");
     // Remove any previous result info added by loadFinalResults if it's there
     const prevResultInfo = document.querySelector(".previous-result-info");
     if (prevResultInfo) {
          prevResultInfo.remove();
     }


    // Start timer and show the first question
    startTimer(); // startTimer will calculate totalTimeForQuiz and reset timeLeft
    updateProgressBar(); // Update progress to start (0/Total)

    showQuestion(); // Load the first question
}

// Initial load of quiz info and potentially state/results
// loadQuizInfo is already called by DOMContentLoaded listener