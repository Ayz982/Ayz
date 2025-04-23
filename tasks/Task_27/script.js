function showMessageByInput(value){
    const input = document.getElementById(value);
    const message = document.createElement("p");
    input.addEventListener('input', () => {
        message.textContent = `You typed: ${input.value}`;
        document.body.appendChild(message);
    })
}

showMessageByInput('input');