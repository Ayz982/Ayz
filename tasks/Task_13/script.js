const dataElement = document.getElementById('data-time');

function displayCurrentDataTime(){
    const now = new Date();

    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const hours =  String(now.getHours()).padStart(2, '0');
    const minutes =  String(now.getMinutes()).padStart(2, '0');

    dataElement.textContent = `Сьогодні: ${day}.${month}.${year}, Час: ${hours}:${minutes}`;
}

displayCurrentDataTime();