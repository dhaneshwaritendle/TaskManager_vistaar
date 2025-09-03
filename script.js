
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('dailyTasks')) || [];
        this.init();
    }

    init() {
        this.updateDateDisplay();
        this.bindEvents();
        this.renderTasks();
        this.updateSummary();
    }

    updateDateDisplay() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    }

    bindEvents() {
        // Form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Export buttons
        document.getElementById('emailExport').addEventListener('click', () => {
            this.showEmailModal();
        });

        document.getElementById('csvExport').addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('clearTasks').addEventListener('click', () => {
            this.clearAllTasks();
        });

        // Modal events
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('copyEmail').addEventListener('click', () => {
            this.copyEmailToClipboard();
        });

        document.getElementById('openEmailClient').addEventListener('click', () => {
            this.openEmailClient();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('emailModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    addTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const status = document.getElementById('taskStatus').value;
        const estimatedHours = parseFloat(document.getElementById('estimatedHours').value) || 0;

        if (!title) {
            alert('Please enter a task title');
            return;
        }

        const task = {
            id: Date.now(),
            title,
            description,
            priority,
            status,
            estimatedHours,
            createdAt: new Date().toISOString(),
            date: new Date().toDateString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateSummary();
        this.clearForm();
    }

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Populate form with task data
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('estimatedHours').value = task.estimatedHours;

        // Remove the task to allow editing
        this.deleteTask(taskId);
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateSummary();
    }

    clearAllTasks() {
        if (confirm('Are you sure you want to clear all tasks? This action cannot be undone.')) {
            this.tasks = [];
            this.saveTasks();
            this.renderTasks();
            this.updateSummary();
        }
    }

    renderTasks() {
        const container = document.getElementById('tasksList');
        
        if (this.tasks.length === 0) {
            container.innerHTML = '<p class="no-tasks">No tasks added yet. Add your first task above!</p>';
            return;
        }

        container.innerHTML = this.tasks.map(task => `
            <div class="task-item">
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">
                            <span class="priority ${task.priority}">${task.priority}</span>
                            <span class="status ${task.status.replace(' ', '')}">${task.status}</span>
                            ${task.estimatedHours > 0 ? `<span class="hours">${task.estimatedHours}h</span>` : ''}
                        </div>
                    </div>
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-actions">
                    <button class="edit-btn" onclick="taskManager.editTask(${task.id})">✏️ Edit</button>
                    <button class="delete-btn" onclick="taskManager.deleteTask(${task.id})">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    updateSummary() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.status === 'Completed').length;
        const inProgress = this.tasks.filter(task => task.status === 'In Progress').length;
        const totalHours = this.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('inProgressTasks').textContent = inProgress;
        document.getElementById('totalHours').textContent = totalHours.toFixed(1);
    }

    showEmailModal() {
        const modal = document.getElementById('emailModal');
        const emailBody = this.generateEmailBody();
        const today = new Date().toDateString();
        
        document.getElementById('emailSubject').value = `Daily Task Report - ${today}`;
        document.getElementById('emailBody').value = emailBody;
        modal.style.display = 'block';
    }

    generateEmailBody() {
        const today = new Date().toDateString();
        const totalTasks = this.tasks.length;
        const completed = this.tasks.filter(task => task.status === 'Completed').length;
        const inProgress = this.tasks.filter(task => task.status === 'In Progress').length;
        const totalHours = this.tasks.reduce((sum, task) => sum + task.estimatedHours, 0);

        let emailBody = `Hello,

Please find below my daily task report for ${today}:

 // Add each task as a row
    this.tasks.forEach(task => {
        emailBody += `| ${task.title.padEnd(18)} | ${task.priority.padEnd(8)} | ${task.status.padEnd(11)} | ${String(task.estimatedHours).padEnd(5)} | ${task.date} |\n`;
    });

    emailBody += `------------------------------------------------------------`

Best regards,
[Your Name]`

        return emailBody;
    }

    exportToCSV() {
        if (this.tasks.length === 0) {
            alert('No tasks to export');
            return;
        }

        const headers = ['Date', 'Task Title', 'Description', 'Priority', 'Status', 'Estimated Hours', 'Created At'];
        const csvContent = [
            headers.join(','),
            ...this.tasks.map(task => [
                `"${task.date}"`,
                `"${task.title}"`,
                `"${task.description || ''}"`,
                `"${task.priority}"`,
                `"${task.status}"`,
                task.estimatedHours,
                `"${new Date(task.createdAt).toLocaleString()}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];
        
        link.href = URL.createObjectURL(blob);
        link.download = `daily-tasks-${today}.csv`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    copyEmailToClipboard() {
        const emailBody = document.getElementById('emailBody');
        emailBody.select();
        document.execCommand('copy');
        alert('Email content copied to clipboard!');
    }

    openEmailClient() {
        const managerEmail = document.getElementById('managerEmail').value;
        const subject = document.getElementById('emailSubject').value;
        const body = document.getElementById('emailBody').value;
        
        const mailtoLink = `mailto:${managerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink);
    }

    closeModal() {
        document.getElementById('emailModal').style.display = 'none';
    }

    clearForm() {
        document.getElementById('taskForm').reset();
        document.getElementById('taskPriority').value = 'Medium';
        document.getElementById('taskStatus').value = 'Not Started';
    }

    saveTasks() {
        localStorage.setItem('dailyTasks', JSON.stringify(this.tasks));
    }
}

// Initialize the app
const taskManager = new TaskManager();
