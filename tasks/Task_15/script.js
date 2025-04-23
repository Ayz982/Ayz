async function fetchDataFromAPI(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const data = await response.json();
        displayDataList(data.results); 
        console.log("Дані відображено!");
        
    } catch (error) {
        console.error("Помилка: ", error);
    }
}

function displayDataList(data) {
    const dataList = document.getElementById("data-list");
    dataList.innerHTML = "";
    data.forEach(item => {
        const itemElement = document.createElement("li");
        itemElement.textContent = `${item.name.first} ${item.name.last}`; 
        dataList.appendChild(itemElement); 
    });
}

fetchDataFromAPI("https://randomuser.me/api/?results=10");