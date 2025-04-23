const testObject = {
    id: 1,
    name: 'John',
    age: 30,
    email: 'john@example.com',
}

function saveAndReadJSON(obj){
    localStorage.setItem("userData", JSON.stringify(obj));
    let data = JSON.parse(localStorage.getItem("userData"));
    console.log(data);
}
saveAndReadJSON(testObject);