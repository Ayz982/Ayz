const changeButton = document.getElementById('changeBtn');
const targetElement = document.getElementById('target');

changeButton.addEventListener('click', () => {
    targetElement.style.backgroundColor = "green";
    targetElement.style.color = "white";
    targetElement.textContent = "Змінений текст";
})