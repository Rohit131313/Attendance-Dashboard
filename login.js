import { auth, database } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";


document.getElementById("loginBtn").addEventListener("click", function() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const btn = document.getElementById("loginBtn");
    const spinner = btn.querySelector(".spinner");

    if (!email || !password) {
        showAlert("Please enter both email and password.", "error");
        return;
    }

    // Disable button and show spinner
    btn.disabled = true;
    spinner.style.display = "inline-block";

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const uid = userCredential.user.uid;
            const usersRef = ref(database, "Students");

            get(usersRef).then(snapshot => {
                if (snapshot.exists()) {
                    let userFound = false;
                    snapshot.forEach(childSnapshot => {
                        if (childSnapshot.val().uid === uid) {
                            localStorage.setItem("userScholarNumber", childSnapshot.key);
                            showAlert("Login successful! Redirecting...", "success");

                            setTimeout(() => {
                                window.location.href = "dashboard.html";
                            }, 2000);
                            userFound = true;
                        }
                    });
                    if (!userFound) {
                        showAlert("User not found in database. Please sign up first.", "error");
                        resetButton();
                    }
                } else {
                    showAlert("No users found in the database.", "error");
                    resetButton();
                }
            });
        })
        .catch(() => {
            showAlert("Invalid email or password. If you don’t have an account, please sign up first.", "error");
            resetButton();
        });

    function resetButton() {
        btn.disabled = false;
        spinner.style.display = "none";
    }
});

// Function to show styled alert messages
function showAlert(message, type) {
    const alertBox = document.getElementById("alertBox");
    alertBox.innerText = message;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = "block";

    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}

document.getElementById("adminLoginBtn").addEventListener("click", function() {
    window.location.href = "admin-login.html";
});

