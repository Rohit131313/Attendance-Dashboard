import { auth, database } from "./firebase-config.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
// ImageKit Base URL
import {imagekitBaseUrl} from "./imagekit-config.js"


console.log("🚀 Script Loaded");

// Authentication Check
onAuthStateChanged(auth, (user) => {
    console.log("🔍 Checking Auth State:", user);
    if (!user) {
        console.error("❌ No user logged in! Redirecting...");
        window.location.href = "login.html";
    }
});

// Get Scholar Number from Local Storage
const scholarNumber = localStorage.getItem("userScholarNumber");
console.log("📌 Scholar Number from localStorage:", scholarNumber);

if (!scholarNumber) {
    console.error("❌ No scholar number found in localStorage.");
    showAlert("No user logged in. Redirecting to login...", "error");
    setTimeout(() => window.location.href = "login.html", 2000);
} else {
    loadStudentData(scholarNumber);
}

// Function to load student data
async function loadStudentData(scholarNumber) {
    try {
        const studentRef = ref(database, "Students/" + scholarNumber);
        console.log("📂 Fetching data from:", "Students/" + scholarNumber);
        const snapshot = await get(studentRef);

        if (!snapshot.exists()) {
            console.error("❌ No data found for this user.");
            showAlert("No data found for this user.", "error");
            return;
        }

        const data = snapshot.val();
        console.log("✅ Fetched Student Data:", data);

        // Display student details
        document.getElementById("name").textContent = data.name;
        document.getElementById("scholarNumber").textContent = scholarNumber;
        document.getElementById("batch").textContent = data.batch;
        document.getElementById("major").textContent = data.major;
        document.getElementById("totalAttendance").textContent = data.total_attendance;

        // Fetch semester start date
        let semesterStartDate = await fetchSemesterStartDate();
        console.log("📅 Semester Start Date:", semesterStartDate);

        // Ensure semesterStartDate is valid before calculating attendance percentage
        if (!semesterStartDate || isNaN(new Date(semesterStartDate))) {
            console.error("❌ Invalid Semester Start Date. Using default date.");
            semesterStartDate = "2025-03-01"; // Default fallback date
        }

        // Calculate total weekdays from semester start
        let totalWeekdays = getWeekdaysCount(semesterStartDate);
        console.log("📊 Total Weekdays:", totalWeekdays);

        // Calculate Attendance Percentage safely
        let attendancePercentage = totalWeekdays > 0 ? (data.total_attendance / totalWeekdays) * 100 : 0;
        document.getElementById("attendancepercentage").textContent = attendancePercentage.toFixed(2) + "%";

        // Set Profile Image
        let imageUrl = `${imagekitBaseUrl}${scholarNumber}.png`;
        console.log("🖼️ Generated Image URL:", imageUrl);
        const profileImage = document.getElementById("profileImage");
        profileImage.src = imageUrl;

        // Handle Image Loading Errors
        profileImage.onerror = function () {
            console.error("❌ Failed to load image from:", imageUrl);
            profileImage.src = "default-profile.png"; // Fallback Image
        };

    } catch (error) {
        console.error("❌ Error fetching student data:", error);
        showAlert("Error fetching data. Please try again.", "error");
    }
}

// Function to fetch semester start date
async function fetchSemesterStartDate() {
    try {
        const snapshot = await get(ref(database, "AdminLocation/"));
        if (snapshot.exists() && snapshot.val().startDate) {
            return snapshot.val().startDate;
        } else {
            console.warn("⚠️ No semester start date found. Using default.");
            return "2025-03-01"; // Default fallback date
        }
    } catch (error) {
        console.error("❌ Error fetching semester start date:", error);
        return "2025-03-01"; // Default fallback date in case of an error
    }
}

// Function to count weekdays between two dates
function getWeekdaysCount(startDate, endDate = new Date()) {
    let start = new Date(startDate);
    let end = new Date(endDate);
    let count = 0;

    while (start <= end) {
        let day = start.getDay(); // Monday to Friday (1-5)
        if (day >= 1 && day <= 5) count++;
        start.setDate(start.getDate() + 1);
    }
    return count;
}

// Logout function
document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            console.log("✅ Logout successful!");
            showAlert("Logout successful! Redirecting...", "success");
            setTimeout(() => window.location.href = "login.html", 2000);
        })
        .catch(error => {
            console.error("❌ Error logging out:", error);
            showAlert("Error logging out. Please try again.", "error");
        });
});

// Function to show alerts
function showAlert(message, type) {
    const alertBox = document.getElementById("alertBox");
    alertBox.innerText = message;
    alertBox.className = `alert ${type}`;
    alertBox.style.display = "block";
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}
