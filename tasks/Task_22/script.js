function createListFromArray(array){
    const ul = document.createElement('ul');
    array.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        ul.appendChild(li);
    });
    document.body.appendChild(ul);
}

const Arr = ["HTML", "CSS", "JavaScript", "React", "Angular", "Vue"];
createListFromArray(Arr);