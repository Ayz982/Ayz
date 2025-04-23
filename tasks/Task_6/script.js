function checkForSpam(message) {
    const spamKeywords = ["spam", "sale"];
    for (const keyword of spamKeywords) {
        if (message.includes(keyword)) {
            return true;
        }
    }
    return false;
}
const mess = "sdf sdfsd dfsd іфдsale dfdf.";
if (checkForSpam(mess)) {
    console.log("Виявлено спам!");
} else {
    console.log("Спам не виявлено.");
}