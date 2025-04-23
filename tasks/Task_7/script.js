function mockServerRequest() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve("Дані успішно отримані!");
        }, 2000);
    })
}

mockServerRequest()
    .then(response => console.log(response))
    .catch(error => console.error(error));