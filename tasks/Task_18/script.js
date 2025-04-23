function createList(array) {
    const ul = document.createElement('ul');

    array.forEach(element => {
        const li = document.createElement('li');
        li.textContent = element;
        ul.appendChild(li);
    });

    document.body.appendChild(ul);
}

const test = ["яблуко", "банан", "груша"];
createList(test);