// Ключи для localStorage
const STORAGE_KEYS = {
    TASKS: 'kanban_tasks',
    STUDENTS: 'kanban_students'
};

// Хранилище WIP лимитов
let wipLimits = {
    todo: 10,
    inprogress: 3,
    done: 10
};

// Данные для таймеров
let totalStartTime = null;
let finalTotalTime = null;
let completedTasksTimes = [];
let timerInterval = null;
let isTimerRunning = false;
let isProjectCompleted = false;

// Список учеников
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
    console.log('✅ Задачи и ученики сохранены');
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
        console.log('👨‍🎓 Ученики загружены');
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
    location.reload();
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
        showGlobalMessage('Сначала добавьте учеников в список!', '#c44569');
        return null;
    }
    return students[Math.floor(Math.random() * students.length)];
}

function showGlobalMessage(message, color = '#c44569') {
    let msgDiv = document.getElementById('globalMessage');
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.id = 'globalMessage';
        msgDiv.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background: ${color}; color: white; padding: 12px 20px;
            border-radius: 30px; font-size: 0.9rem; z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(msgDiv);
    } else {
        msgDiv.style.background = color;
        msgDiv.style.display = 'block';
    }
    msgDiv.innerHTML = message;
    setTimeout(() => msgDiv.style.display = 'none', 3000);
}

// ========== ИМПОРТ ==========

function importStudents(studentList) {
    const newStudents = [];
    for (let student of studentList) {
        if (student && student.trim()) newStudents.push(student.trim());
    }
    if (newStudents.length === 0) {
        showGlobalMessage('Не найдено учеников!', '#c44569');
        return false;
    }
    students = newStudents;
    updateStudentsListDisplay();
    saveAllData();
    showGlobalMessage(`✅ Импортировано ${students.length} учеников!`, '#4caf50');
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
        showGlobalMessage('Вставьте данные!', '#c44569');
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
        showGlobalMessage('Нет данных для импорта!', '#c44569');
        return;
    }
    
    if (type === 'tasks') importTasksToTodo(items);
    else importStudents(items);
    textarea.value = '';
}

function loadExampleData() {
    importTasksToTodo([
        'Изучить проектный треугольник',
        'Разобрать модель Такмана',
        'Написать определение информации',
        'Создать схему информационной системы',
        'Подготовить презентацию'
    ]);
}

// ========== КАНБАН ==========

function setWipLimit(column, newLimit) {
    const limit = parseInt(newLimit);
    if (isNaN(limit)) return false;
    wipLimits[column] = Math.min(30, Math.max(1, limit));
    updateWipDisplay(column);
    
    if (tasks[column].length > wipLimits[column]) {
        const excess = tasks[column].splice(-(tasks[column].length - wipLimits[column]));
        tasks.todo.unshift(...excess);
        renderBoard();
    }
    return true;
}

function updateWipDisplay(column) {
    const input = document.querySelector(`.wip-limit-input[data-column="${column}"]`);
    if (input && input.value != wipLimits[column]) input.value = wipLimits[column];
}

function showWarning(column, message) {
    const warning = document.getElementById(`${column}WipWarning`);
    if (warning) {
        warning.innerHTML = `⚠️ ${message}`;
        warning.style.display = 'block';
        setTimeout(() => warning.style.display = 'none', 3000);
    }
}

function checkWipLimitBeforeAdd(column) {
    if (tasks[column].length >= wipLimits[column]) {
        const name = column === 'todo' ? 'To Do' : column === 'inprogress' ? 'In Progress' : 'Done';
        showWarning(column, `Лимит ${name}: ${wipLimits[column]}`);
        return false;
    }
    return true;
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
        empty.style.cssText = 'color:#f8bbd0; text-align:center; padding:20px 0; font-size:0.8rem';
        container.appendChild(empty);
        return;
    }
    
    taskArray.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('data-id', task.id);
        
        const textDiv = document.createElement('div');
        textDiv.className = 'task-text';
        textDiv.textContent = task.text;
        
        const studentDiv = document.createElement('div');
        studentDiv.className = 'task-student';
        
        const studentName = document.createElement('span');
        studentName.className = 'student-name';
        // Показываем только если есть ученик
        studentName.textContent = task.student || '❌ Не назначен';
        
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
                showGlobalMessage(`🎲 Назначен: ${newStudent}`, '#4caf50');
            }
        };
        
        studentDiv.appendChild(studentName);
        studentDiv.appendChild(randomBtn);
        
        if (status === 'inprogress' && task.startTime) {
            const timerDiv = document.createElement('div');
            timerDiv.className = 'task-timer';
            timerDiv.innerHTML = `⏱️ <span class="task-timer-value">${formatTimeMinutes(Date.now() - task.startTime)}</span>`;
            studentDiv.appendChild(timerDiv);
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
            
            if (task.cycleTime) {
                const cycle = document.createElement('span');
                cycle.className = 'task-cycle-badge';
                cycle.innerHTML = `✅ ${formatTimeMinutes(task.cycleTime)}`;
                btnsDiv.appendChild(cycle);
            }
        }
        
        const del = document.createElement('button');
        del.className = 'task-delete';
        del.innerHTML = '✕';
        del.onclick = (e) => { e.stopPropagation(); deleteTaskById(task.id); };
        
        actionsDiv.appendChild(btnsDiv);
        actionsDiv.appendChild(del);
        
        card.appendChild(textDiv);
        card.appendChild(studentDiv);
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
    
    if (tasks[to].length >= wipLimits[to]) {
        const name = to === 'todo' ? 'To Do' : to === 'inprogress' ? 'In Progress' : 'Done';
        showWarning(to, `Лимит ${name}: ${wipLimits[to]}`);
        return false;
    }
    
    if (to === 'inprogress' && !task.startTime) {
        task.startTime = Date.now();
        if (!isTimerRunning && !isProjectCompleted && totalStartTime === null) {
            isTimerRunning = true;
            totalStartTime = Date.now();
            showGlobalMessage('⏱️ Таймер запущен!', '#4caf50');
        }
    }
    
    if (to === 'done' && task.startTime && !task.cycleTime) {
        task.cycleTime = Date.now() - task.startTime;
        completedTasksTimes.push(task.cycleTime);
        showGlobalMessage(`✅ Выполнено за ${formatTimeMinutes(task.cycleTime)}!`, '#4caf50');
    }
    
    tasks[from].splice(idx, 1);
    tasks[to].push(task);
    
    if (areAllTasksCompleted() && isTimerRunning) {
        isTimerRunning = false;
        isProjectCompleted = true;
        finalTotalTime = Date.now() - totalStartTime;
        showGlobalMessage(`🏆 Проект завершён за ${formatTimeMinutes(finalTotalTime)}!`, '#4caf50');
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
    const counts = { todo: tasks.todo.length, inprogress: tasks.inprogress.length, done: tasks.done.length };
    ['todo', 'inprogress', 'done'].forEach(s => {
        const el = document.getElementById(`${s}Count`);
        const badge = document.getElementById(`${s}CountBadge`);
        if (el) el.innerText = counts[s];
        if (badge) badge.innerText = counts[s];
    });
    const stats = document.getElementById('globalStats');
    if (stats) stats.innerHTML = `To Do <span id="todoCount">${counts.todo}</span> | In Progress <span id="inprogCount">${counts.inprogress}</span> | Done <span id="doneCount">${counts.done}</span>`;
}

function addTaskToColumn(status, text) {
    if (!text || !text.trim()) return false;
    if (!checkWipLimitBeforeAdd(status)) return false;
    
    tasks[status].push({
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
    
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = () => {
            const col = btn.dataset.column;
            const input = document.getElementById(`${col}Input`);
            if (input && input.value) {
                addTaskToColumn(col, input.value);
                input.value = '';
            }
        };
    });
    
    ['todo', 'inprogress', 'done'].forEach(col => {
        const input = document.getElementById(`${col}Input`);
        if (input) input.onkeypress = e => { if (e.key === 'Enter') { addTaskToColumn(col, input.value); input.value = ''; } };
    });
    
    document.querySelectorAll('.set-wip-btn').forEach(btn => {
        btn.onclick = () => {
            const col = btn.dataset.column;
            const input = document.querySelector(`.wip-limit-input[data-column="${col}"]`);
            if (input) setWipLimit(col, input.value);
        };
    });
    
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
    document.getElementById('studentsImportBtn')?.addEventListener('click', () => importFromTextarea('students'));
    document.getElementById('loadExampleBtn')?.addEventListener('click', loadExampleData);
    document.getElementById('clearStudentsBtn')?.addEventListener('click', () => { students = []; updateStudentsListDisplay(); saveAllData(); showGlobalMessage('Список учеников очищен!'); });
    document.getElementById('excelFileInput')?.addEventListener('change', e => { if(e.target.files[0]) handleFileUpload(e.target.files[0], 'tasks'); e.target.value = ''; });
    document.getElementById('studentsFileInput')?.addEventListener('change', e => { if(e.target.files[0]) handleFileUpload(e.target.files[0], 'students'); e.target.value = ''; });
    
    console.log('✅ Канбан-доска готова!');
    console.log('📌 При перезагрузке ВСЕ задачи в To Do, ученики не привязаны до нажатия "Случайный"');
}

window.clearAllData = clearAllData;
init();