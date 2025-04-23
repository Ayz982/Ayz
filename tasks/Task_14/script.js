const themeButton = document.getElementById('themeBtn');
applySavedTheme();

function saveThemePreference(theme){
    localStorage.setItem('theme', theme);
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    if(localStorage.getItem("theme") == "dark-mode"){
        saveThemePreference("light-mode");
    } else {
        saveThemePreference("dark-mode");
    }
}

themeButton.addEventListener('click', toggleDarkMode);

function applySavedTheme(){
    if(localStorage.getItem("theme") == "dark-mode"){
        document.body.classList.add("dark-mode");
    }
}
