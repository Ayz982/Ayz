function handleLocalStorage() {
    const saveButton = document.querySelector('.save-btn');
    const removeButton = document.querySelector('.remove-btn');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            localStorage.setItem("data", "data");
            console.log("Ключ 'data' додано до localStorage");
        });
    }
    if (removeButton) {
        removeButton.addEventListener('click', () => {
            localStorage.removeItem("data");
            console.log("Ключ 'data' видалено з localStorage");
        });
    }
}

handleLocalStorage();