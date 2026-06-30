const form = document.getElementById("attendanceForm");
const studentIdInput = document.getElementById("studentId");
const mealSelect = document.getElementById("meal");
const message = document.getElementById("message");

const breakfastCountElement = document.getElementById("breakfastCount");
const lunchCountElement = document.getElementById("lunchCount");
const dinnerCountElement = document.getElementById("dinnerCount");

// Meal counters
let breakfastCount = 0;
let lunchCount = 0;
let dinnerCount = 0;

// Form submit handler
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const studentId = studentIdInput.value.trim();
  const meal = mealSelect.value;

  if (!studentId || !meal) {
    showMessage("Please enter Student ID and select a meal.", "red");
    return;
  }

  // Update meal counters
  if (meal === "breakfast") {
    breakfastCount++;
  } else if (meal === "lunch") {
    lunchCount++;
  } else if (meal === "dinner") {
    dinnerCount++;
  }

  // Update the UI
  updateMealCounts();
  showMessage(`Recorded: ${studentId} wants ${meal}.`, "green");

  // Reset form
  form.reset();
});

// Function to update meal counts on page
function updateMealCounts() {
  breakfastCountElement.textContent = breakfastCount;
  lunchCountElement.textContent = lunchCount;
  dinnerCountElement.textContent = dinnerCount;
}

// Function to show temporary status messages
function showMessage(text, color = "green") {
  message.textContent = text;
  message.style.color = color;

  setTimeout(() => {
    message.textContent = "";
  }, 3000);
}
