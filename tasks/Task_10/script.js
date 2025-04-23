function processArray(arr, callback) {
    return arr.map(callback);
}

function operationElement(element) {
    return element * 2;
}

const Arr = [2, 4, 2, 1, 6, 3, 2];

console.log(processArray(Arr, operationElement));