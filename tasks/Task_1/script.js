const labelName = document.getElementById("name");
const labelEmail = document.getElementById("email");
const sendForm = document.getElementById("send-form");

function validateFormFields(event) {
    let isValid = true; 

    if (labelName.value.trim() === "") {
        labelName.style.border = "1px solid red";
        isValid = false;
    } else{
        labelName.style.border = "1px solid black";
    }

    if (labelEmail.value.trim() === "") {
        labelEmail.style.border = "1px solid red";
        isValid = false; 
    } else{
        labelEmail.style.border = "1px solid black";
    }

    if (!isValid) {
        alert("Заповніть всі поля!");
        event.preventDefault();
    }
}

sendForm.addEventListener("submit", validateFormFields);