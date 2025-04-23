function liveCharacterCount(inputId, outputId){
    var input = document.getElementById(inputId);
    var output = document.getElementById(outputId);
    input.addEventListener('input', () => {
        let lenghtInput = input.value.length;
        output.textContent = "Кількість символів: " + String(lenghtInput);
    });
}

liveCharacterCount('inputId', 'outputId');