const testElement = document.getElementById('test-element');

function toggleElementStyle(element) {
    element.addEventListener("mouseenter", () => {
        element.style.backgroundColor = "black";
        element.style.color = "white";
    });
    element.addEventListener("mouseleave", () => {
        element.style.backgroundColor = "";
        element.style.color = "";
    });
}

toggleElementStyle(testElement);