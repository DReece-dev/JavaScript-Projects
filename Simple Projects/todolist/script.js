// Get the form, input field and task list from the DOM
const form = document.getElementById("add-task-form");
const taskInput = document.getElementById("new-task");
const taskList = document.getElementById("task-list");

// Initialize an empty array to store tasks
let tasks = [];

// Function to add a new task
function addTask(event) {
    event.preventDefault(); // Prevent the form from submitting normally
    const taskText = taskInput.value.trim(); // Get the task text and remove leading/trailing whitespace
    if (taskText) { // If the task text is not empty
        tasks.push({ id: Date.now(), text: taskText, completed: false }); // Add a new task object to the tasks array
        renderTasks(); // Render the tasks
        taskInput.value = ""; // Clear the input field
    }
}

// Function to toggle the completion status of a task
function toggleTaskCompletion(event) {
    const taskId = Number(event.target.parentElement.dataset.id); // Get the task ID
    const taskIndex = tasks.findIndex((task) => task.id === taskId); // Find the index of the task in the tasks array

    if (taskIndex !== -1) { // If the task exists
        tasks[taskIndex].completed = !tasks[taskIndex].completed; // Toggle the completion status
        renderTasks(); // Render the tasks
    }
}

// Function to render the tasks
function renderTasks() {
    taskList.innerHTML = ""; // Clear the task list
    tasks.forEach((task) => {
        const li = document.createElement("li"); // Create a new list item
        li.dataset.id = task.id; // Set the task ID
        li.innerHTML = `
      <span class="${task.completed ? "completed" : ""}" onclick="toggleTaskCompletion(event)">${task.text}</span>
      <button class="edit-button" data-id="${task.id}">Edit</button>
      <button class="delete-button" data-id="${task.id}">Delete</button>
    `; // Set the HTML content of the list item
        taskList.appendChild(li); // Append the list item to the task list
    });

    const editButtons = document.querySelectorAll(".edit-button"); // Get all edit buttons
    const deleteButtons = document.querySelectorAll(".delete-button"); // Get all delete buttons

    editButtons.forEach((button) => {
        button.addEventListener("click", handleEditTask); // Add a click event listener to each edit button
    });

    deleteButtons.forEach((button) => {
        button.addEventListener("click", handleDeleteTask); // Add a click event listener to each delete button
    });
}

// Function to handle editing a task
function handleEditTask(event) {
    const taskId = Number(event.target.dataset.id); // Get the task ID
    const taskIndex = tasks.findIndex((task) => task.id === taskId); // Find the index of the task in the tasks array

    if (taskIndex !== -1) { // If the task exists
        const newTaskText = prompt("Enter the new task", tasks[taskIndex].text); // Ask the user for the new task text
        if (newTaskText) { // If the new task text is not empty
            tasks[taskIndex].text = newTaskText.trim(); // Update the task text
            renderTasks(); // Render the tasks
        }
    }
}

// Function to handle deleting a task
function handleDeleteTask(event) {
    const taskId = Number(event.target.dataset.id); // Get the task ID
    tasks = tasks.filter((task) => task.id !== taskId); // Remove the task from the tasks array
    renderTasks(); // Render the tasks
}

form.addEventListener("submit", addTask); // Add a submit event listener to the form
renderTasks(); // Render the tasks