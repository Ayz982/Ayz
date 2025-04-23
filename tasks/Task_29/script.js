async function loadDataWithAsync(url) {
    try {
        const response = await fetch(url); 
        if (!response.ok) { 
            throw new Error(`Помилка: ${response.status} ${response.statusText}`);
        }
        const data = await response.json(); 
        console.log("Отримані дані:", data); 
        return data; 
    } catch (error) {
        console.error("Сталася помилка:", error.message); 
    }
}

// const apiUrl = "https://jsonplaceholder.typicode.com/posts"; 
// loadDataWithAsync(apiUrl);