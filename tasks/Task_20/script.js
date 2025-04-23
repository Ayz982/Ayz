function processUserInput(value){
    try{
        const result = Number(value);
        if (isNaN(result)) {
            throw new Error('Введене значення не є числом.');
        }
        console.log("Квадрат ччисла: " + (result * result));
        
    } catch (error) {
        console.log(error);
    }
}

processUserInput(3);
processUserInput();
processUserInput("sdsfs");
processUserInput(true + true);