import { auth, database } from "./firebase-config.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

document.getElementById("saveDataBtn").addEventListener("click", function () {
    const longitude = document.getElementById("longitude").value;
    const latitude = document.getElementById("latitude").value;
    const radius = document.getElementById("radius").value;
    const startDate = document.getElementById("startDate").value; // New field

    if (!longitude || !latitude || !radius || !startDate) {
        showAlert("Please fill in all fields.", "error");
        return;
    }

    const adminRef = ref(database, "AdminLocation");

    set(adminRef, {
        longitude: longitude,
        latitude: latitude,
        radius: radius,
        startDate: startDate  // Save start date in Firebase
    })
    .then(() => {
        showAlert("Data saved successfully!", "success");
    })
    .catch((error) => {
        console.error("Failed to save data:", error);
        showAlert("Failed to save data. " + error.message, "error");
    });
});

// Function to show alert messages
function showAlert(message, type) {
    const alertBox = document.getElementById("adminAlertBox");
    if (!alertBox) {
        console.error("Error: Alert box element not found.");
        return;
    }
    
    alertBox.innerText = message;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = "block";

    setTimeout(() => {
        alertBox.style.display = "none";
    }, 5000);
}

document.getElementById("goToIndex").addEventListener("click", function () {
    window.location.href = "index.html";
});
