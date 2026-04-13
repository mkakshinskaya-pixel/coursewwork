// Ключи для localStorage
const STORAGE_KEYS = {
    TASKS: 'kanban_tasks',
    STUDENTS: 'kanban_students',
    THEME: 'kanban_theme'
};

// Хранилище WIP лимитов (только для In Progress)
let wipLimitInProgress = 3;

// Данные для таймеров
let totalStartTime = null;
let finalTotalTime = null;
let completedTasksTimes = [];
let timerInterval = null;
let isTimerRunning = false;
let isProjectCompleted = false;

// Список обучающихся
let students = [];

// Задачи
let tasks = {
    todo: [],
    inprogress: [],
    done: []
};

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С LOCALSTORAGE ==========

function saveAllData() {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    console.log('✅ Задачи и обучающиеся сохранены');
}

function loadAllData() {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (savedTasks) {
        const loadedTasks = JSON.parse(savedTasks);
        
        const allTasks = [
            ...(loadedTasks.todo || []),
            ...(loadedTasks.inprogress || []),
            ...(loadedTasks.done || [])
        ];
        
        tasks.todo = allTasks.map(task => ({
            id: task.id,
            text: task.text,
            student: null,
            startTime: null,
            cycleTime: null
        }));
        tasks.inprogress = [];
        tasks.done = [];
        
        console.log(`📋 Загружено ${allTasks.length} задач, все перенесены в To Do`);
    } else {
        tasks = {
            todo: [
                { id: 't1', text: 'Изучить проектный треугольник', student: null, startTime: null, cycleTime: null },
                { id: 't2', text: 'Разработать макет канбан-доски', student: null, startTime: null, cycleTime: null },
                { id: 't3', text: 'Написать документацию к курсовой', student: null, startTime: null, cycleTime: null }
            ],
            inprogress: [],
            done: []
        };
    }
    
    const savedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (savedStudents) {
        students = JSON.parse(savedStudents);
        console.log('👨‍🎓 Обучающиеся загружены');
    } else {
        students = [
            'Иванов Иван Иванович',
            'Петрова Мария Сергеевна',
            'Сидоров Алексей Дмитриевич'
        ];
    }
}

function clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.THEME);
    location.reload();
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ТЕМОЙ ==========

function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const themeBtn = document.getElementById('themeToggleBtn');
    
    if (savedTheme === 'purple') {
        document.body.classList.add('purple-theme');
        if (themeBtn) themeBtn.innerHTML = '🌸 Розовая тема';
    } else {
        document.body.classList.remove('purple-theme');
        if (themeBtn) themeBtn.innerHTML = '🟣 Фиолетовая тема';
    }
}

function toggleTheme() {
    const themeBtn = document.getElementById('themeToggleBtn');
    
    if (document.body.classList.contains('purple-theme')) {
        document.body.classList.remove('purple-theme');
        localStorage.setItem(STORAGE_KEYS.THEME, 'pink');
        if (themeBtn) themeBtn.innerHTML = '🟣 Фиолетовая тема';
        showGlobalMessage('🌸 Розовая тема активирована', '#e91e63');
    } else {
        document.body.classList.add('purple-theme');
        localStorage.setItem(STORAGE_KEYS.THEME, 'purple');
        if (themeBtn) themeBtn.innerHTML = '🌸 Розовая тема';
        showGlobalMessage('🟣 Фиолетовая тема активирована', '#7c3aed');
    }
}

// Функция для получения цвета уведомления в зависимости от темы
function getNotificationColor() {
    if (document.body.classList.contains('purple-theme')) {
        return '#a855f7';
    } else {
        return '#f48fb1';
    }
}

// ========== ОСТАЛЬНЫЕ ФУНКЦИИ ==========

function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 6);
}

function areAllTasksCompleted() {
    return tasks.todo.length === 0 && tasks.inprogress.length === 0;
}

function resetTimers() {
    totalStartTime = null;
    finalTotalTime = null;
    completedTasksTimes = [];
    isTimerRunning = false;
    isProjectCompleted = false;
    
    for (let task of tasks.inprogress) {
        task.startTime = null;
    }
    
    updateTimersDisplay();
    startTimerUpdate();
}

function startTimerUpdate() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        updateTimersDisplay();
        updateCardTimers();
    }, 1000);
}

function updateTimersDisplay() {
    if (isProjectCompleted && finalTotalTime) {
        document.getElementById('totalTimeDisplay').innerHTML = formatTimeMinutes(finalTotalTime);
    } else if (isTimerRunning && totalStartTime) {
        document.getElementById('totalTimeDisplay').innerHTML = formatTimeMinutes(Date.now() - totalStartTime);
    } else {
        document.getElementById('totalTimeDisplay').innerHTML = '0 мин 0 сек';
    }
    
    if (completedTasksTimes.length > 0) {
        const avg = completedTasksTimes.reduce((a, b) => a + b, 0) / completedTasksTimes.length;
        document.getElementById('cycleTimeDisplay').innerHTML = formatTimeMinutes(avg);
    } else {
        document.getElementById('cycleTimeDisplay').innerHTML = '0 мин 0 сек';
    }
    
    document.getElementById('completedTasksCount').innerHTML = completedTasksTimes.length;
}

function updateCardTimers() {
    const container = document.getElementById('inprogressList');
    if (!container) return;
    
    container.querySelectorAll('.task-card').forEach(card => {
        const taskId = card.getAttribute('data-id');
        const task = tasks.inprogress.find(t => t.id === taskId);
        if (task && task.startTime) {
            const timerSpan = card.querySelector('.task-timer-value');
            if (timerSpan) timerSpan.textContent = formatTimeMinutes(Date.now() - task.startTime);
        }
    });
}

function formatTimeMinutes(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes} мин ${seconds} сек`;
}

function updateStudentsListDisplay() {
    const container = document.getElementById('studentsList');
    if (container) {
        container.innerHTML = '';
        students.forEach(student => {
            const tag = document.createElement('span');
            tag.className = 'student-tag';
            tag.textContent = student;
            container.appendChild(tag);
        });
    }
}

function getRandomStudent() {
    if (students.length === 0) {
        showGlobalMessage('Сначала добавьте обучающихся в список!', getNotificationColor());
        return null;
    }
    return students[Math.floor(Math.random() * students.length)];
}

function showGlobalMessage(message, color) {
    let msgDiv = document.getElementById('globalMessage');
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'globalMessage';
        document.body.appendChild(msgDiv);
    }
    
    // Если цвет не передан, определяем по теме
    const finalColor = color || getNotificationColor();
    
    msgDiv.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: ${finalColor}; color: white; padding: 12px 20px;
        border-radius: 30px; font-size: 0.9rem; z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    msgDiv.innerHTML = message;
    msgDiv.style.display = 'block';
    setTimeout(() => msgDiv.style.display = 'none', 4000);
}

// ========== ИМПОРТ ==========

function importStudents(studentList) {
    const newStudents = [];
    for (let student of studentList) {
        if (student && student.trim()) newStudents.push(student.trim());
    }
    if (newStudents.length === 0) {
        showGlobalMessage('Не найдено обучающихся!', getNotificationColor());
        return false;
    }
    students = newStudents;
    updateStudentsListDisplay();
    saveAllData();
    showGlobalMessage(`✅ Импортировано ${students.length} обучающихся!`, '#4caf50');
    return true;
}

function importTasksToTodo(newTasks) {
    let added = 0;
    for (let text of newTasks) {
        if (text && text.trim()) {
            tasks.todo.push({
                id: generateId(),
                text: text.trim(),
                student: null,
                startTime: null,
                cycleTime: null
            });
            added++;
        }
    }
    if (added > 0) {
        renderBoard();
        saveAllData();
        showGlobalMessage(`✅ Импортировано ${added} задач!`, '#4caf50');
    }
    return added;
}

function clearTasksFromTodo() {
    if (tasks.todo.length === 0) {
        showGlobalMessage('В колонке To Do нет задач для очистки!', getNotificationColor());
        return;
    }
    
    const count = tasks.todo.length;
    tasks.todo = [];
    renderBoard();
    saveAllData();
    showGlobalMessage(`🗑 Очищено ${count} задач из колонки To Do!`, '#4caf50');
}

function parseCSVLine(line) {
    const result = [];
    let inQuotes = false, current = '';
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else current += char;
    }
    result.push(current.trim());
    return result;
}

function handleFileUpload(file, type = 'tasks') {
    const ext = file.name.split('.').pop().toLowerCase();
    const process = (data) => {
        const items = [];
        data.split(/\r?\n/).forEach(line => {
            if (line.trim()) {
                let name = parseCSVLine(line)[0];
                name = name.replace(/^["']|["']$/g, '');
                if (name) items.push(name);
            }
        });
        if (type === 'tasks') importTasksToTodo(items);
        else importStudents(items);
    };
    
    if (ext === 'csv' || ext === 'txt') {
        const reader = new FileReader();
        reader.onload = e => process(e.target.result);
        reader.readAsText(file, 'UTF-8');
    } else if (ext === 'xlsx' || ext === 'xls') {
        const reader = new FileReader();
        reader.onload = e => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            const items = [];
            for (let row of json) {
                if (row && row[0]) {
                    let name = String(row[0]).trim();
                    if (name && name !== 'Задача' && name !== 'Название' && name !== 'ФИО') items.push(name);
                }
            }
            if (type === 'tasks') importTasksToTodo(items);
            else importStudents(items);
        };
        reader.readAsArrayBuffer(file);
    }
}

function importFromTextarea(type = 'tasks') {
    const textarea = document.getElementById(type === 'tasks' ? 'pasteData' : 'studentsData');
    if (!textarea) return;
    
    const raw = textarea.value;
    if (!raw.trim()) {
        showGlobalMessage('Вставьте данные!', getNotificationColor());
        return;
    }
    
    const items = [];
    raw.split(/\r?\n/).forEach(line => {
        line = line.trim();
        if (line) {
            let name = line;
            if (line.includes('\t')) name = line.split('\t')[0];
            else if (line.includes(',')) name = parseCSVLine(line)[0];
            else if (line.includes(';')) name = line.split(';')[0];
            name = name.replace(/^["']|["']$/g, '').trim();
            if (name) items.push(name);
        }
    });
    
    if (items.length === 0) {
        showGlobalMessage('Нет данных для импорта!', getNotificationColor());
        return;
    }
    
    if (type === 'tasks') importTasksToTodo(items);
    else importStudents(items);
    textarea.value = '';
}

// ========== КАНБАН ==========

function setWipLimit(column, newLimit) {
    if (column !== 'inprogress') return;
    const limit = parseInt(newLimit);
    if (isNaN(limit)) return false;
    wipLimitInProgress = Math.min(30, Math.max(1, limit));
    updateWipDisplay();
    
    if (tasks.inprogress.length > wipLimitInProgress) {
        const excess = tasks.inprogress.splice(-(tasks.inprogress.length - wipLimitInProgress));
        tasks.todo.unshift(...excess);
        renderBoard();
    }
    return true;
}

function updateWipDisplay() {
    const input = document.querySelector('.wip-limit-input');
    if (input && input.value != wipLimitInProgress) input.value = wipLimitInProgress;
}

function showWarning(message) {
    const warning = document.getElementById('inprogressWipWarning');
    if (warning) {
        warning.innerHTML = `⚠️ ${message}`;
        warning.style.display = 'block';
        setTimeout(() => warning.style.display = 'none', 3000);
    }
}

function renderBoard() {
    renderTaskList(tasks.todo, document.getElementById('todoList'), 'todo');
    renderTaskList(tasks.inprogress, document.getElementById('inprogressList'), 'inprogress');
    renderTaskList(tasks.done, document.getElementById('doneList'), 'done');
    updateCounters();
    updateCardTimers();
}

function renderTaskList(taskArray, container, status) {
    if (!container) return;
    container.innerHTML = '';
    
    if (!taskArray.length) {
        const empty = document.createElement('div');
        empty.textContent = '✨ Нет задач';
        empty.style.cssText = 'color:#c4b5fd; text-align:center; padding:20px 0; font-size:0.8rem';
        container.appendChild(empty);
        return;
    }
    
    taskArray.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('data-id', task.id);
        
        const textWrapper = document.createElement('div');
        textWrapper.className = 'task-text-wrapper';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'task-text';
        textDiv.textContent = task.text;
        textWrapper.appendChild(textDiv);
        
        const studentName = document.createElement('div');
        studentName.className = 'student-name';
        studentName.textContent = task.student || '❌ Не назначен';
        
        const actionsRow = document.createElement('div');
        actionsRow.className = 'actions-row';
        
        const randomBtn = document.createElement('button');
        randomBtn.className = 'random-student-btn';
        randomBtn.innerHTML = '🎲 Случайный';
        randomBtn.onclick = (e) => {
            e.stopPropagation();
            const newStudent = getRandomStudent();
            if (newStudent) {
                task.student = newStudent;
                studentName.textContent = task.student;
                renderBoard();
                saveAllData();
                showGlobalMessage(`🎲 Назначен: ${newStudent}`, getNotificationColor());
            }
        };
        actionsRow.appendChild(randomBtn);
        
        if (status === 'inprogress' && task.startTime) {
            const timerDiv = document.createElement('div');
            timerDiv.className = 'task-timer';
            timerDiv.innerHTML = `<span class="timer-icon">⏱️</span> <span class="task-timer-value">${formatTimeMinutes(Date.now() - task.startTime)}</span>`;
            actionsRow.appendChild(timerDiv);
        }
        
        if (status === 'done' && task.cycleTime) {
            const cycleDiv = document.createElement('div');
            cycleDiv.className = 'task-cycle';
            cycleDiv.innerHTML = `<span class="cycle-icon">✅</span> <span class="task-cycle-value">${formatTimeMinutes(task.cycleTime)}</span>`;
            actionsRow.appendChild(cycleDiv);
        }
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';
        
        const btnsDiv = document.createElement('div');
        btnsDiv.className = 'move-buttons';
        
        if (status === 'todo') {
            const btn = document.createElement('button');
            btn.className = 'move-btn';
            btn.innerHTML = '→ In Progress';
            btn.onclick = (e) => { e.stopPropagation(); moveTask(task.id, 'todo', 'inprogress'); };
            btnsDiv.appendChild(btn);
        } else if (status === 'inprogress') {
            const back = document.createElement('button');
            back.className = 'move-btn';
            back.innerHTML = '← To Do';
            back.onclick = (e) => { e.stopPropagation(); moveTask(task.id, 'inprogress', 'todo'); };
            
            const done = document.createElement('button');
            done.className = 'move-btn';
            done.innerHTML = 'Done →';
            done.onclick = (e) => { e.stopPropagation(); moveTask(task.id, 'inprogress', 'done'); };
            
            btnsDiv.appendChild(back);
            btnsDiv.appendChild(done);
        } else if (status === 'done') {
            const back = document.createElement('button');
            back.className = 'move-btn';
            back.innerHTML = '← In Progress';
            back.onclick = (e) => { e.stopPropagation(); moveTask(task.id, 'done', 'inprogress'); };
            btnsDiv.appendChild(back);
        }
        
        const del = document.createElement('button');
        del.className = 'task-delete';
        del.innerHTML = '✕';
        del.onclick = (e) => { e.stopPropagation(); deleteTaskById(task.id); };
        
        actionsDiv.appendChild(btnsDiv);
        actionsDiv.appendChild(del);
        
        card.appendChild(textWrapper);
        card.appendChild(studentName);
        card.appendChild(actionsRow);
        card.appendChild(actionsDiv);
        
        card.onclick = (e) => {
            if (e.target === card || e.target.classList.contains('task-text')) {
                if (status === 'todo') moveTask(task.id, 'todo', 'inprogress');
                else if (status === 'inprogress') moveTask(task.id, 'inprogress', 'done');
            }
        };
        
        container.appendChild(card);
    });
}

function moveTask(taskId, from, to) {
    const idx = tasks[from].findIndex(t => t.id === taskId);
    if (idx === -1) return false;
    const task = tasks[from][idx];
    
    if (to === 'inprogress' && tasks.inprogress.length >= wipLimitInProgress) {
        showWarning(`Лимит In Progress: ${wipLimitInProgress}. Невозможно добавить задачу!`);
        return false;
    }
    
    if (to === 'inprogress' && !task.startTime) {
        task.startTime = Date.now();
        
        if (!isTimerRunning && !isProjectCompleted && totalStartTime === null) {
            isTimerRunning = true;
            totalStartTime = Date.now();
            showGlobalMessage('⏱️ Таймер проекта запущен!', getNotificationColor());
        }
        
        if (task.student === null) {
            const randomStudent = getRandomStudent();
            if (randomStudent) {
                task.student = randomStudent;
                showGlobalMessage(`👨‍🎓 На задачу "${task.text.substring(0, 35)}..." автоматически назначен ${randomStudent}`, getNotificationColor());
            }
        }
    }
    
    if (to === 'done' && task.startTime && !task.cycleTime) {
        task.cycleTime = Date.now() - task.startTime;
        completedTasksTimes.push(task.cycleTime);
        showGlobalMessage(`✅ Задача "${task.text.substring(0, 30)}..." выполнена за ${formatTimeMinutes(task.cycleTime)}!`, '#4caf50');
    }
    
    tasks[from].splice(idx, 1);
    tasks[to].push(task);
    
    if (areAllTasksCompleted() && isTimerRunning) {
        isTimerRunning = false;
        isProjectCompleted = true;
        finalTotalTime = Date.now() - totalStartTime;
        showGlobalMessage(`🏆 Проект завершён! Общее время: ${formatTimeMinutes(finalTotalTime)}`, getNotificationColor());
    }
    
    renderBoard();
    saveAllData();
    updateTimersDisplay();
    return true;
}

function deleteTaskById(taskId) {
    for (let status of ['todo', 'inprogress', 'done']) {
        const idx = tasks[status].findIndex(t => t.id === taskId);
        if (idx !== -1) {
            tasks[status].splice(idx, 1);
            renderBoard();
            saveAllData();
            return;
        }
    }
}

function updateCounters() {
    const totalTasks = tasks.todo.length + tasks.inprogress.length + tasks.done.length;
    
    const todoBadge = document.getElementById('todoCountBadge');
    const inprogBadge = document.getElementById('inprogCountBadge');
    const doneBadge = document.getElementById('doneCountBadge');
    
    if (todoBadge) todoBadge.innerText = `${tasks.todo.length} / ${totalTasks}`;
    if (inprogBadge) inprogBadge.innerText = `${tasks.inprogress.length} / ${totalTasks}`;
    if (doneBadge) doneBadge.innerText = `${tasks.done.length} / ${totalTasks}`;
    
    const todoCountSpan = document.getElementById('todoCount');
    const inprogCountSpan = document.getElementById('inprogCount');
    const doneCountSpan = document.getElementById('doneCount');
    
    if (todoCountSpan) todoCountSpan.innerText = tasks.todo.length;
    if (inprogCountSpan) inprogCountSpan.innerText = tasks.inprogress.length;
    if (doneCountSpan) doneCountSpan.innerText = tasks.done.length;
    
    const globalStats = document.getElementById('globalStats');
    if (globalStats) {
        globalStats.innerHTML = `To Do <span id="todoCount">${tasks.todo.length}</span> | In Progress <span id="inprogCount">${tasks.inprogress.length}</span> | Done <span id="doneCount">${tasks.done.length}</span>`;
    }
}

function addTaskToColumn(status, text) {
    if (!text || !text.trim()) return false;
    if (status !== 'todo') return false;
    
    tasks.todo.push({
        id: generateId(),
        text: text.trim(),
        student: null,
        startTime: null,
        cycleTime: null
    });
    renderBoard();
    saveAllData();
    return true;
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========

function init() {
    loadAllData();
    resetTimers();
    updateStudentsListDisplay();
    renderBoard();
    initTheme();
    
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
    
    const addBtn = document.querySelector('.add-btn');
    const todoInput = document.getElementById('todoInput');
    if (addBtn && todoInput) {
        addBtn.onclick = () => {
            if (todoInput.value) {
                addTaskToColumn('todo', todoInput.value);
                todoInput.value = '';
            }
        };
        todoInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                addTaskToColumn('todo', todoInput.value);
                todoInput.value = '';
            }
        };
    }
    
    const setWipBtn = document.querySelector('.set-wip-btn');
    const wipInput = document.querySelector('.wip-limit-input');
    if (setWipBtn && wipInput) {
        setWipBtn.onclick = () => {
            setWipLimit('inprogress', wipInput.value);
        };
        wipInput.onkeypress = (e) => {
            if (e.key === 'Enter') setWipLimit('inprogress', wipInput.value);
        };
    }
    updateWipDisplay();
    
    const toggleImport = document.getElementById('toggleImportBtn');
    const importContent = document.getElementById('importContent');
    if (toggleImport && importContent) {
        toggleImport.onclick = () => {
            const isHidden = importContent.style.display === 'none';
            importContent.style.display = isHidden ? 'block' : 'none';
            toggleImport.innerHTML = isHidden ? '▲ Скрыть' : '▼ Показать';
        };
    }
    
    const toggleStudents = document.getElementById('toggleStudentsBtn');
    const studentsContent = document.getElementById('studentsContent');
    if (toggleStudents && studentsContent) {
        toggleStudents.onclick = () => {
            const isHidden = studentsContent.style.display === 'none';
            studentsContent.style.display = isHidden ? 'block' : 'none';
            toggleStudents.innerHTML = isHidden ? '▲ Скрыть' : '▼ Показать';
        };
    }
    
    document.getElementById('pasteImportBtn')?.addEventListener('click', () => importFromTextarea('tasks'));
    document.getElementById('excelFileInput')?.addEventListener('change', e => { if(e.target.files[0]) handleFileUpload(e.target.files[0], 'tasks'); e.target.value = ''; });
    
    const clearTasksBtn = document.getElementById('clearTasksBtn');
    if (clearTasksBtn) {
        clearTasksBtn.addEventListener('click', () => {
            clearTasksFromTodo();
        });
    }
    
    document.getElementById('studentsImportBtn')?.addEventListener('click', () => importFromTextarea('students'));
    document.getElementById('studentsFileInput')?.addEventListener('change', e => { if(e.target.files[0]) handleFileUpload(e.target.files[0], 'students'); e.target.value = ''; });
    
    document.getElementById('clearStudentsBtn')?.addEventListener('click', () => { 
        students = []; 
        updateStudentsListDisplay(); 
        saveAllData(); 
        showGlobalMessage('Список обучающихся очищен!', getNotificationColor());
    });
    
    console.log('✅ Канбан-доска готова!');
    console.log('📌 При перемещении задачи в In Progress автоматически назначается случайный обучающийся');
    console.log('🎨 Доступны две темы: розовая и фиолетовая');
}

window.clearAllData = clearAllData;
init();