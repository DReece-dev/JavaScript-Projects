const form = document.getElementById("add-task-form");
const taskInput = document.getElementById("new-task");
const taskList = document.getElementById("task-list");

let tasks = [];

function addTask(event) {
    event.preventDefault();
    const taskText = taskInput.value.trim();
    if (taskText) {
        tasks.push({ id: Date.now(), text: taskText, completed: false });
        renderTasks();
        taskInput.value = "";
    }
}

function toggleTaskCompletion(event) {
    const taskId = Number(event.target.parentElement.dataset.id);
    const taskIndex = tasks.findIndex((task) => task.id === taskId);

    if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        renderTasks();
    }
}

function renderTasks() {
    taskList.innerHTML = "";
    tasks.forEach((task) => {
        const li = document.createElement("li");
        li.dataset.id = task.id;
        li.innerHTML = `
      <span class="${task.completed ? "completed" : ""}" onclick="toggleTaskCompletion(event)">${task.text}</span>
      <button class="edit-button" data-id="${task.id}">Edit</button>
      <button class="delete-button" data-id="${task.id}">Delete</button>
    `;
        taskList.appendChild(li);
    });

    const editButtons = document.querySelectorAll(".edit-button");
    const deleteButtons = document.querySelectorAll(".delete-button");

    editButtons.forEach((button) => {
        button.addEventListener("click", handleEditTask);
    });

    deleteButtons.forEach((button) => {
        button.addEventListener("click", handleDeleteTask);
    });
}

function handleEditTask(event) {
    const taskId = Number(event.target.dataset.id);
    const taskIndex = tasks.findIndex((task) => task.id === taskId);

    if (taskIndex !== -1) {
        const newTaskText = prompt("Enter the new task", tasks[taskIndex].text);
        if (newTaskText) {
            tasks[taskIndex].text = newTaskText.trim();
            renderTasks();
        }
    }
}

function handleDeleteTask(event) {
    const taskId = Number(event.target.dataset.id);
    tasks = tasks.filter((task) => task.id !== taskId);
    renderTasks();
}

form.addEventListener("submit", addTask);
renderTasks();
