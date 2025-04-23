export function sortByKey(array, key) {
    return array.sort((a, b) => {
        if (a[key] == undefined || b[key] == undefined) {
            throw new Error("Ключ не знайдено.");
        }
        if (a[key] > b[key]) {
            return 1;
        } else if (a[key] < b[key]) {
            return -1
        } else {
            return 0;
        }
    });
}