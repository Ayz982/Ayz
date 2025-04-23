import { sortByKey } from "./sortModule.js";

const testArray = [
    { name: "John", age: 25 },
    { name: "Alice", age: 30 },
    { name: "Bob", age: 20 },
    { name: "Charlie", age: 35 }
];

const resultDiv = document.createElement('div');
resultDiv.textContent = `Тестовий масив об'єктів: ${JSON.stringify(testArray)}`;
document.body.appendChild(resultDiv);

try {
    const sortedArray = sortByKey(testArray, 'age');
    const resultDiv = document.createElement('div');
    resultDiv.textContent = `Сортування за age: ${JSON.stringify(sortedArray)}`;
    document.body.appendChild(resultDiv);

} catch (error) {
    const errorDiv = document.createElement('div');
    errorDiv.textContent = `Помилка: ${error.message}`;
    errorDiv.style.color = 'red';
    document.body.appendChild(errorDiv);
}
