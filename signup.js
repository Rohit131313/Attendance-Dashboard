import { auth, database } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

import {imagekitUrl , imagekitPublicKey , imagekitPrivateKey , imagekitFolder} from "./imagekit-config.js"


document.getElementById("signupBtn").addEventListener("click", async function () {
    console.log("Signup button clicked");

    const name = document.getElementById("name").value;
    const scholarNumber = document.getElementById("scholarNumber").value;
    const batch = document.getElementById("batch").value;
    const major = document.getElementById("major").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const profileImage = document.getElementById("profileImage").files[0];

    if (!name || !scholarNumber || !batch || !major || !email || !password || !profileImage) {
        showAlert("Please fill in all fields and upload an image.", "error");
        return;
    }

    // Disable button to prevent multiple clicks
    const btn = document.getElementById("signupBtn");
    const spinner = btn.querySelector(".spinner");
    btn.disabled = true;
    spinner.style.display = "inline-block";

    let userCredential = null;
    let imageResult = null;
    try {
        // Create the user so that auth.currentUser is set.
        userCredential = await createUserWithEmailAndPassword(auth, email, password)
            .catch(error => {
                let errorMessage = "";
                if (error.code === "auth/email-already-in-use") {
                    errorMessage = "This email is already registered. Please use a different email.";
                } else if (error.code === "auth/invalid-email") {
                    errorMessage = "Enter email in correct format.";
                } else if (error.code === "auth/weak-password") {
                    errorMessage = "Password should be at least 6 characters.";
                } else {
                    errorMessage = error.message;
                }
                showAlert(errorMessage, "error");
                resetButton();
                throw error;
            });
        const uid = userCredential.user.uid;

        // Check if the scholar number already exists.
        const userRef = ref(database, `Students/${scholarNumber}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            showAlert("Account with this Scholar Number already exists!", "error");
            // Rollback: delete the created auth user.
            await userCredential.user.delete();
            resetButton();
            return;
        }
        console.log("scholar number already not exists");

        // Upload image to ImageKit.
        // Note: Now uploadImageToImageKit returns an object with {url, fileId}
        imageResult = await uploadImageToImageKit(profileImage, scholarNumber);
        if (!imageResult) {
            showAlert("Failed to upload image. Please try again.", "error");
            await userCredential.user.delete();
            resetButton();
            return;
        }
        console.log("Upload image to ImageKit.");

        // Save user data in Firebase Realtime Database.
        await set(ref(database, "Students/" + scholarNumber), {
            name,
            batch,
            major,
            email,
            total_attendance: 0,
            last_attendance_time: getCurrentDateTime(),
            uid: uid,
            profile_image: imageResult.url // Store ImageKit URL
        });
        console.log("Save user data in Firebase");

        // Run EncodeGenerator AFTER image upload and Firebase save.
        let encodeResponse = await fetch('http://<ipofbackend>:5000/run-encode-generator', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        console.log(encodeResponse);

        // If encode generator did not succeed, rollback everything.
        if (!encodeResponse.ok) {
            throw new Error("Encode generator call failed");
        }

        showAlert("Signup Successful! Redirecting to login...", "success");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);
    } catch (error) {
        console.error("Error:", error);
        // Rollback if a user was created
        if (userCredential && userCredential.user) {
            try {
                // Delete DB entry for this student
                await set(ref(database, "Students/" + scholarNumber), null);
                // Delete the Firebase auth user
                await userCredential.user.delete();
                // Delete the uploaded image from ImageKit if we have its fileId
                if (imageResult && imageResult.fileId) {
                    await deleteImageFromImageKit(imageResult.fileId);
                }
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError);
            }
        }
        showAlert("Something went wrong. Please try again later.", "error");
    }

    resetButton();
});

async function uploadImageToImageKit(file, scholarNumber) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", `${scholarNumber}.png`); // Use Scholar Number as filename
    formData.append("useUniqueFileName", "false"); // Prevent ImageKit from renaming file
    formData.append("folder", imagekitFolder);

    try {
        const response = await fetch(imagekitUrl, {
            method: "POST",
            headers: {
                Authorization: "Basic " + btoa(imagekitPrivateKey + ":"),
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Image upload failed");
        // Return both the image URL and fileId for rollback purposes
        return { url: data.url, fileId: data.fileId };
    } catch (error) {
        console.error("Image upload error:", error);
        return null;
    }
}

async function deleteImageFromImageKit(fileId) {
    try {
        const response = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
            method: "DELETE",
            headers: {
                Authorization: "Basic " + btoa(imagekitPrivateKey + ":"),
            },
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Image deletion failed");
        }
        console.log("Image deleted successfully from ImageKit");
    } catch (error) {
        console.error("Image deletion error:", error);
    }
}

function resetButton() {
    const btn = document.getElementById("signupBtn");
    const spinner = btn.querySelector(".spinner");
    btn.disabled = false;
    spinner.style.display = "none";
}

function showAlert(message, type) {
    const alertBox = document.getElementById("alertBox");
    alertBox.innerText = message;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = "block";

    setTimeout(() => {
        alertBox.style.display = "none";
    }, 7000);
}

function getCurrentDateTime() {
    const now = new Date();
    return now.toISOString().replace("T", " ").split(".")[0]; // Format: YYYY-MM-DD HH:MM:SS
}
