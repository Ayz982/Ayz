const ulId = document.getElementById("list");
ulId.addEventListener("click", (event) => {
    if (event.target.tagName === "LI"){
        console.log(event.target.textContent);
    }
});