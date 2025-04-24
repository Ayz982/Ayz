document.getElementById("uploadBtn").addEventListener("click", () => {
    document.getElementById("docxInput").click();
  });
  
  document.getElementById("docxInput").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const output = document.getElementById("output");
    output.textContent = "Обробка файлу...";
  
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      const json = parseDocxToJson(text);
      output.textContent = JSON.stringify(json, null, 2);
      downloadJSON(json, "questions.json");
    } catch (err) {
      console.error("Помилка при парсингу DOCX:", err);
      output.textContent = "Сталася помилка під час обробки файлу.";
    }
  });

  function parseDocxToJson(text) {
    const questions = [];
    // Розділяємо текст на рядки, видаляємо зайві пробіли та порожні рядки
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    let i = 0;
  
    // Регулярний вираз для варіантів відповідей: будь-яка літера (велика чи мала), за якою йде ')', на початку рядка
    const answerRegex = /^[a-zA-Z]\)/;
  
    while (i < lines.length) {
      // Парсинг запитань з одним правильним варіантом (старий тип 'choice')
      if (lines[i].startsWith("Q:")) {
        const questionText = lines[i].slice(2).trim();
        i++;
  
        const answers = [];
        // Варіанти відповіді позначаються літерами (тепер будь-якою літерою) з ')', перевіряємо за оновленим regex
        while (i < lines.length && answerRegex.test(lines[i])) {
          answers.push(lines[i].slice(2).trim()); // Все одно відрізаємо перші 2 символи (літера та дужка)
          i++;
        }
  
        let correct = null; // Для 'choice' правильна відповідь - один індекс
        // Правильна відповідь позначається A: з номером варіанта (від 1)
        if (i < lines.length && lines[i].startsWith("A:")) {
          const correctAnswerIndex = parseInt(lines[i].slice(2).trim(), 10);
          // Перевіряємо, що індекс валідний і в межах кількості парсених відповідей
          if (!isNaN(correctAnswerIndex) && correctAnswerIndex >= 1 && correctAnswerIndex <= answers.length) {
              correct = correctAnswerIndex - 1; // Відлік з 0 для масиву
          }
          i++;
        }
  
        questions.push({ type: "choice", question: questionText, answers, correct });
  
      }
      // --- НОВИЙ ТИП: MULTICHOICE ---
      else if (lines[i].startsWith("MQ:")) { // Використовуємо MQ: як маркер для multichoice
          const questionText = lines[i].slice(3).trim(); // Slice 3, оскільки маркер MQ:
          i++;
  
          const answers = [];
          // Варіанти відповіді позначаються літерами (тепер будь-якою літерою) з ')', перевіряємо за оновленим regex
          while (i < lines.length && answerRegex.test(lines[i])) {
              answers.push(lines[i].slice(2).trim()); // Все одно відрізаємо перші 2 символи
              i++;
          }
  
          let correct = []; // Для 'multichoice' правильна відповідь - масив індексів
          // Правильні відповіді позначаються A: з номерами варіантів, розділеними комою (наприклад, A: 1,3,4)
          if (i < lines.length && lines[i].startsWith("A:")) {
              const correctAnswersString = lines[i].slice(2).trim();
              // Розділяємо рядок за комою, парсимо числа та віднімаємо 1 для індексу
              correct = correctAnswersString.split(',')
                                             .map(numStr => parseInt(numStr.trim(), 10))
                                             // Фільтруємо невалідні числа та номери, що виходять за межі кількості парсених відповідей
                                             .filter(num => !isNaN(num) && num >= 1 && num <= answers.length)
                                             .map(num => num - 1); // Переводимо в індекси (відлік з 0)
              i++;
          }
  
          questions.push({ type: "multichoice", question: questionText, answers, correct }); // Зберігаємо тип як 'multichoice'
      }
      // --- КІНЕЦЬ НОВОГО ТИПУ ---
  
      // Парсинг запитань з текстовою відповіддю (старий тип 'input')
      else if (lines[i].startsWith("W:")) {
        const questionText = lines[i].slice(2).trim();
        i++;
        let correct = "";
  
        // Правильна відповідь позначається A:
        if (i < lines.length && lines[i].startsWith("A:")) {
          correct = lines[i].slice(2).trim();
          i++;
        }
  
        questions.push({ type: "input", question: questionText, correct });
  
      }
      // Парсинг запитань на зіставлення (старий тип 'match')
      else if (lines[i].startsWith("M:")) {
        const questionText = lines[i].slice(2).trim();
        i++;
  
        const pairs = {};
        // Пари для зіставлення в форматі "Ліва частина -> Права частина"
        while (i < lines.length && lines[i].includes("->")) {
          const [left, right] = lines[i].split("->").map(s => s.trim());
          if (left && right) { // Перевіряємо, що обидві частини не порожні
               pairs[left] = right;
          }
          i++;
        }
  
        // Формуємо список опцій для випадаючих списків, перемішуємо їх
        const options = Object.values(pairs).sort(() => Math.random() - 0.5);
  
  
        questions.push({
          type: "match",
          question: questionText,
          pairs,
          options
        });
      }
      // Пропускаємо рядки, які не відповідають жодному з відомих маркерів
      else {
        i++;
      }
    }
  
    return questions;
  }

  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }