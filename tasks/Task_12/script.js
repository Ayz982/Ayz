const themeButton = document.getElementById('themeBtn');

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

themeButton.addEventListener('click', toggleDarkMode);