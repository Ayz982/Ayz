function calculateSum(...numbers){
    let sum = 0;
    for (let number of numbers) {
        sum += number;
    }
    return sum;
}

console.log(calculateSum(1, 3, 1, 3, 1));
console.log(calculateSum(2, 2));
console.log(calculateSum());