const saveButton = document.querySelector('.save-btn');
const removeButton = document.querySelector('.remove-btn');

const object = {
    name: "Bob",
    age: 25,
};

function handleLocalStorageActions(){
    saveButton.addEventListener('click', () => {
        localStorage.setItem('user', JSON.stringify(object));
    });
    removeButton.addEventListener('click', () => {
        localStorage.removeItem('user');
    });
}

handleLocalStorageActions();