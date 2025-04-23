const testArr = [
    { id: 1, category: "food", },
    { id: 2, category: "car", },
    { id: 3, category: "car", },
    { id: 4, category: "car", },
    { id: 5, category: "food", },
    { id: 6, category: "book", },
    { id: 7, category: "book", },
    { id: 8, category: "book", },
    { id: 9, category: "food", },
];

function filterBycategory(items, category) {
    return items.filter(item => item.category === category);
}

const resArr = filterBycategory(testArr, "book");
console.log(resArr);
