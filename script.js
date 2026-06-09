document.addEventListener('DOMContentLoaded', () => {
    // Array to hold task data arrays initialized via browser LocalStorage
    let tasks = JSON.parse(localStorage.getItem('stream_tasks')) || [];
    let categories = JSON.parse(localStorage.getItem('stream_categories')) || ["Personal", "Work", "Shopping"];
    
    // Tracking States
    let currentCategory = "All";
    let currentStatusFilter = "All"; // All, Pending, Completed
    let taskToEditId = null;

    // DOM Element Reference Extracts
    const taskList = document.getElementById('taskList');
    const taskForm = document.getElementById('taskForm');
    const categoryList = document.getElementById('categoryList');
    const taskCategorySelect = document.getElementById('taskCategorySelect');
    const currentCategoryTitle = document.getElementById('currentCategoryTitle');
    const taskCountSummary = document.getElementById('taskCountSummary');
    
    // Modal Selectors
    const editModal = document.getElementById('editModal');
    const editTextInput = document.getElementById('editTextInput');
    const editDateTimeInput = document.getElementById('editDateTimeInput');

    // 1. INTIALIZER APP INVOCATION RUN
    function initApp() {
        renderCategories();
        renderTasks();
    }

    // 2. RENDER CATEGORIES SIDEBAR LISTINGS
    function renderCategories() {
        // Clear except the fixed base "All Tasks"
        categoryList.innerHTML = `<li class="category-item ${currentCategory === 'All' ? 'active' : ''}" data-category="All">All Tasks</li>`;
        taskCategorySelect.innerHTML = '';

        categories.forEach(cat => {
            // Append Sidebar list items
            const li = document.createElement('li');
            li.className = `category-item ${currentCategory === cat ? 'active' : ''}`;
            li.setAttribute('data-category', cat);
            li.innerText = cat;
            categoryList.appendChild(li);

            // Synchronize Input Form drop-down values option lists
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            taskCategorySelect.appendChild(opt);
        });
    }

    // 3. RENDER CORE TASKS VIEW STREAM
    function renderTasks() {
        taskList.innerHTML = '';
        
        // Filter tasks based on active category and completion status
        let filteredTasks = tasks.filter(task => {
            const matchesCategory = (currentCategory === "All" || task.category === currentCategory);
            const matchesStatus = (currentStatusFilter === "All" || 
                                   (currentStatusFilter === "Pending" && !task.completed) || 
                                   (currentStatusFilter === "Completed" && task.completed));
            return matchesCategory && matchesStatus;
        });

        // Compute incomplete remaining counter metrics
        const incompleteCount = tasks.filter(t => !t.completed && (currentCategory === "All" || t.category === currentCategory)).length;
        taskCountSummary.innerText = `${incompleteCount} pending task${incompleteCount !== 1 ? 's' : ''} total`;

        // Render Empty Warning Screen if tasks list evaluation is empty
        if (filteredTasks.length === 0) {
            taskList.innerHTML = `<p style="text-align:center; color:#64748b; margin-top:20px;">No items found in this section.</p>`;
            return;
        }

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            
            // Format time parameters
            let dateTimeDisplay = '';
            if (task.dueDate) {
                const dateObj = new Date(task.dueDate);
                dateTimeDisplay = dateObj.toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
            }

            li.innerHTML = `
                <div class="task-item-left">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                    <div class="task-details">
                        <span class="task-text">${escapeHTML(task.text)}</span>
                        <div class="task-meta-info">
                            <span class="tag-badge">${task.category}</span>
                            ${task.dueDate ? `<span class="date-badge">⏱ ${dateTimeDisplay}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-action btn-edit" data-id="${task.id}">Edit</button>
                    <button class="btn-action btn-delete" data-id="${task.id}">Delete</button>
                </div>
            `;
            taskList.appendChild(li);
        });

        saveToLocalStorage();
    }

    // 4. ADD TASK OPERATIONS CREATION
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = document.getElementById('taskTextInput').value.trim();
        const dueDate = document.getElementById('taskDateTime').value;
        const category = taskCategorySelect.value;

        if (!text) return;

        const newTask = {
            id: Date.now().toString(),
            text: text,
            dueDate: dueDate || null,
            category: category,
            completed: false
        };

        tasks.push(newTask);
        taskForm.reset();
        renderTasks();
    });

    // 5. DATA MUTATION HANDLING EVENT-DELEGATION ACTION CLUSTER
    taskList.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        if (!id) return;

        if (e.target.classList.contains('task-checkbox')) {
            // Checkbox Toggle Completion operation
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = e.target.checked;
                renderTasks();
            }
        } 
        else if (e.target.classList.contains('btn-delete')) {
            // Delete operation
            tasks = tasks.filter(t => t.id !== id);
            renderTasks();
        } 
        else if (e.target.classList.contains('btn-edit')) {
            // Open Edit Modal Overlay setup
            const task = tasks.find(t => t.id === id);
            if (task) {
                taskToEditId = id;
                editTextInput.value = task.text;
                editDateTimeInput.value = task.dueDate || '';
                editModal.classList.add('open');
            }
        }
    });

    // 6. MODAL INTERFACE COMMIT TRIGGERS
    document.getElementById('saveEditBtn').addEventListener('click', () => {
        const updatedText = editTextInput.value.trim();
        const updatedDate = editDateTimeInput.value;

        if (!updatedText) return;

        const task = tasks.find(t => t.id === taskToEditId);
        if (task) {
            task.text = updatedText;
            task.dueDate = updatedDate || null;
            renderTasks();
        }
        editModal.classList.remove('open');
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
        editModal.classList.remove('open');
    });

    // 7. NEW CATEGORIES CREATION MANAGEMENT
    document.getElementById('addCategoryBtn').addEventListener('click', () => {
        const catInput = document.getElementById('newCategoryInput');
        const newCat = catInput.value.trim();
        if (newCat && !categories.includes(newCat)) {
            categories.push(newCat);
            catInput.value = '';
            renderCategories();
        }
    });

    // 8. SIDEBAR CATEGORY CLICK ROUTING SELECTIONS
    categoryList.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-item')) {
            document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
            e.target.classList.add('active');
            currentCategory = e.target.getAttribute('data-category');
            currentCategoryTitle.innerText = currentCategory === "All" ? "All Tasks" : currentCategory;
            renderTasks();
        }
    });

    // 9. STATUS BAR FILTER CONTROLS
    function setStatusFilter(filterValue, activeElement) {
        document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));
        activeElement.classList.add('active');
        currentStatusFilter = filterValue;
        renderTasks();
    }

    document.getElementById('filterAll').addEventListener('click', (e) => setStatusFilter('All', e.target));
    document.getElementById('filterPending').addEventListener('click', (e) => setStatusFilter('Pending', e.target));
    document.getElementById('filterCompleted').addEventListener('click', (e) => setStatusFilter('Completed', e.target));

    // 10. LOCALSTORAGE COMMS & UTILITIES
    function saveToLocalStorage() {
        localStorage.setItem('stream_tasks', JSON.stringify(tasks));
        localStorage.setItem('stream_categories', JSON.stringify(categories));
    }

    function escapeHTML(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    // Kickstart application logic
    initApp();
});