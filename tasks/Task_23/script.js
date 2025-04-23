function changeButtonTextOnInput(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    input.addEventListener('input', () => {
        button.textContent = input.value;
    });
}

changeButtonTextOnInput('input', 'btn');