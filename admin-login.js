import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

document.getElementById("adminLoginBtn").addEventListener("click", function() {
    const email = document.getElementById("adminEmail").value;
    const password = document.getElementById("adminPassword").value;
    const btn = document.getElementById("adminLoginBtn");
    const spinner = btn.querySelector(".spinner");

    if (!email || !password) {
        showAlert("Please enter both email and password.", "error");
        return;
    }

    btn.disabled = true;
    spinner.style.display = "inline-block";

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // Check if the logged-in user is an admin
            if (email === "admin@gmail.com") { // Change to your admin email
                showAlert("Admin login successful! Redirecting...", "success");
                setTimeout(() => {
                    window.location.href = "admin-dashboard.html";
                }, 2000);
            } else {
                showAlert("Unauthorized access!", "error");
                resetButton();
            }
        })
        .catch(() => {
            showAlert("Invalid email or password.", "error");
            resetButton();
        });

    function resetButton() {
        btn.disabled = false;
        spinner.style.display = "none";
    }
});

function showAlert(message, type) {
    const alertBox = document.getElementById("adminAlertBox");
    alertBox.innerText = message;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = "block";

    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}
