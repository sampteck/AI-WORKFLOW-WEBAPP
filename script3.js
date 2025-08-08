// DARK MODE TOGGLE
function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

window.onload = () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
  initChart();
  initSpeechRecognition();
  initDragAndDrop();
};

// TOAST FUNCTION
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// COLLAPSIBLE SECTIONS
function toggleCollapse(header) {
  const section = header.parentElement;
  section.classList.toggle("collapsed");
}

// TASK LOGIC
let tasks = [];
const timeline = document.getElementById("taskTimeline");
const totalTasksEl = document.getElementById("totalTasks");
const avgDurationEl = document.getElementById("avgDuration");
const suggestionsList = document.getElementById("suggestionsList");

function addTask(name, duration) {
  const taskName = name || document.getElementById("taskInput").value.trim();
  const durationVal = duration || parseInt(document.getElementById("durationInput").value);

  if (!taskName || isNaN(durationVal)) {
    showToast("Please enter both task name and duration!");
    return;
  }

  const task = { name: taskName, duration: durationVal, time: new Date().toLocaleTimeString() };
  tasks.push(task);

  updateUI();
  document.getElementById("taskInput").value = "";
  document.getElementById("durationInput").value = "";
  showToast("Task added successfully!");
}

function updateUI() {
  updateTimeline();
  updateKPIs();
  updateSuggestions();
  updateChart();
}

// UPDATE TIMELINE WITH DRAGGABLE LIST
function updateTimeline() {
  timeline.innerHTML = "";
  tasks.forEach((t, index) => {
    const li = document.createElement("li");
    li.innerText = `${t.time} - ${t.name} (${t.duration} mins)`;
    li.setAttribute("draggable", true);
    li.dataset.index = index;
    li.classList.add("draggable-task");
    timeline.appendChild(li);
  });
  initDragAndDrop();
}

function updateKPIs() {
  totalTasksEl.innerText = tasks.length;
  const avg = tasks.length ? (tasks.reduce((a, b) => a + b.duration, 0) / tasks.length).toFixed(2) : 0;
  avgDurationEl.innerText = avg;
}

function updateSuggestions() {
  suggestionsList.innerHTML = "";
  if (tasks.length >= 5) {
    const avg = tasks.reduce((a, b) => a + b.duration, 0) / tasks.length;
    if (avg > 45) {
      addSuggestion("Consider automating longer tasks to save time.");
    } else {
      addSuggestion("Workflow efficiency is within optimal range.");
    }
  } else {
    addSuggestion("More task data needed for deeper AI insights.");
  }
}

function addSuggestion(text) {
  const li = document.createElement("li");
  li.textContent = text;
  suggestionsList.appendChild(li);
}

// EXPORT TO CSV
function exportToCSV() {
  if (!tasks.length) return showToast("No tasks to export!");
  const csvRows = [["Task Name", "Duration", "Time"]];
  tasks.forEach(t => csvRows.push([t.name, t.duration, t.time]));
  const csvContent = csvRows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "workflow_tasks.csv";
  link.click();
  showToast("Exported to CSV!");
}

// CHART
let chart;
function initChart() {
  const ctx = document.getElementById("workflowChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [{
        label: 'Task Duration (mins)',
        data: [],
        backgroundColor: "#0066ff",
        borderRadius: 8
      }]
    },
    options: {
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function updateChart() {
  chart.data.labels = tasks.map(t => t.name);
  chart.data.datasets[0].data = tasks.map(t => t.duration);
  chart.update();
}

// DRAG & DROP REORDERING
function initDragAndDrop() {
  const draggables = document.querySelectorAll(".draggable-task");

  draggables.forEach(item => {
    item.addEventListener("dragstart", dragStart);
    item.addEventListener("dragover", dragOver);
    item.addEventListener("drop", drop);
  });
}

let draggedIndex = null;

function dragStart(e) {
  draggedIndex = +e.target.dataset.index;
  e.dataTransfer.effectAllowed = "move";
}

function dragOver(e) {
  e.preventDefault();
}

function drop(e) {
  const droppedIndex = +e.target.dataset.index;
  if (draggedIndex === null || droppedIndex === null) return;

  const draggedTask = tasks[draggedIndex];
  tasks.splice(draggedIndex, 1);
  tasks.splice(droppedIndex, 0, draggedTask);

  updateUI();
  draggedIndex = null;
  showToast("Tasks reordered!");
}

// SPEECH COMMANDS
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    console.warn("Speech recognition not supported.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = function (event) {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        const command = event.results[i][0].transcript.trim().toLowerCase();
        processCommand(command);
      }
    }
  };

  recognition.onerror = function (event) {
    console.warn("Speech recognition error:", event.error);
  };

  recognition.start();
}

function processCommand(command) {
  if (command.startsWith("add task")) {
    const parts = command.replace("add task", "").trim().split(" ");
    const name = parts.slice(0, -1).join(" ");
    const duration = parseInt(parts[parts.length - 1]);
    if (name && !isNaN(duration)) {
      addTask(name, duration);
    }
  } else if (command.includes("dark mode")) {
    toggleTheme();
  } else if (command.includes("export")) {
    exportToCSV();
  } else {
    showToast("Unrecognized command: " + command);
  }
}