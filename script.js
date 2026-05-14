// STORAGE MANAGER 
class StorageManager {
    constructor() {
        this.keys = {
            TASKS: 'kanban_tasks',
            STUDENTS: 'kanban_students',
            THEME: 'kanban_theme',
            GOOGLE_API_KEY: 'google_api_key',
            GOOGLE_SHEET_ID: 'google_sheet_id'
        };
    }

    saveTasks(tasks) {
        localStorage.setItem(this.keys.TASKS, JSON.stringify(tasks));
        console.log('✅ Задачи сохранены');
    }

    loadTasks() {
        const saved = localStorage.getItem(this.keys.TASKS);
        return saved ? JSON.parse(saved) : null;
    }

    saveStudents(students) {
        localStorage.setItem(this.keys.STUDENTS, JSON.stringify(students));
        console.log('✅ Студенты сохранены');
    }

    loadStudents() {
        const saved = localStorage.getItem(this.keys.STUDENTS);
        return saved ? JSON.parse(saved) : null;
    }

    saveTheme(theme) {
        localStorage.setItem(this.keys.THEME, theme);
    }

    loadTheme() {
        return localStorage.getItem(this.keys.THEME);
    }

    saveGoogleSettings(apiKey, sheetId) {
        if (apiKey) localStorage.setItem(this.keys.GOOGLE_API_KEY, apiKey);
        if (sheetId) localStorage.setItem(this.keys.GOOGLE_SHEET_ID, sheetId);
    }

    loadGoogleSettings() {
        return {
            apiKey: localStorage.getItem(this.keys.GOOGLE_API_KEY),
            sheetId: localStorage.getItem(this.keys.GOOGLE_SHEET_ID)
        };
    }

    clearAll() {
        Object.values(this.keys).forEach(key => localStorage.removeItem(key));
        location.reload();
    }
}

// THEME MANAGER 
class ThemeManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.currentTheme = 'pink';
        this.init();
    }

    init() {
        const savedTheme = this.storage.loadTheme();
        if (savedTheme === 'purple') {
            this.currentTheme = 'purple';
            document.body.classList.add('purple-theme');
        } else {
            this.currentTheme = 'pink';
            document.body.classList.remove('purple-theme');
        }
        this.updateButtonText();
    }

    updateButtonText() {
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            btn.innerHTML = this.currentTheme === 'pink' ? '🟣 Фиолетовая тема' : '🌸 Розовая тема';
        }
    }

    toggle() {
        if (this.currentTheme === 'pink') {
            document.body.classList.add('purple-theme');
            this.currentTheme = 'purple';
            this.storage.saveTheme('purple');
            this.showMessage('🟣 Фиолетовая тема активирована', '#7c3aed');
        } else {
            document.body.classList.remove('purple-theme');
            this.currentTheme = 'pink';
            this.storage.saveTheme('pink');
            this.showMessage('🌸 Розовая тема активирована', '#e91e63');
        }
        this.updateButtonText();
    }

    getNotificationColor() {
        return this.currentTheme === 'purple' ? '#a855f7' : '#f48fb1';
    }

    showMessage(message, color) {
        let msgDiv = document.getElementById('globalMessage');
        if (!msgDiv) {
            msgDiv = document.createElement('div');
            msgDiv.id = 'globalMessage';
            document.body.appendChild(msgDiv);
        }
        msgDiv.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background: ${color || this.getNotificationColor()}; color: white;
            padding: 12px 20px; border-radius: 30px; font-size: 0.9rem;
            z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;
        msgDiv.innerHTML = message;
        msgDiv.style.display = 'block';
        setTimeout(() => msgDiv.style.display = 'none', 4000);
    }
}

// TIMER MANAGER (ИСПРАВЛЕННЫЙ - с обновлением таймеров на карточках)
class TimerManager {
    constructor(uiRenderer, themeManager) {
        this.ui = uiRenderer;
        this.theme = themeManager;
        this.totalStartTime = null;
        this.finalTotalTime = null;
        this.completedTasksTimes = [];
        this.timerInterval = null;
        this.isTimerRunning = false;
        this.isProjectCompleted = false;
        this.timerStartNotified = false;
    }

    startTimerUpdate() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.updateDisplay();
            this.updateCardTimers();
        }, 1000);
    }

    updateDisplay() {
        if (this.isProjectCompleted && this.finalTotalTime) {
            document.getElementById('totalTimeDisplay').innerHTML = this.formatMinutes(this.finalTotalTime);
        } else if (this.isTimerRunning && this.totalStartTime) {
            document.getElementById('totalTimeDisplay').innerHTML = this.formatMinutes(Date.now() - this.totalStartTime);
        } else {
            document.getElementById('totalTimeDisplay').innerHTML = '0 мин 0 сек';
        }

        if (this.completedTasksTimes.length > 0) {
            const avg = this.completedTasksTimes.reduce((a, b) => a + b, 0) / this.completedTasksTimes.length;
            document.getElementById('cycleTimeDisplay').innerHTML = this.formatMinutes(avg);
        } else {
            document.getElementById('cycleTimeDisplay').innerHTML = '0 мин 0 сек';
        }
        document.getElementById('completedTasksCount').innerHTML = this.completedTasksTimes.length;
    }

    // НОВЫЙ МЕТОД: обновление таймеров на карточках в реальном времени
    updateCardTimers() {
        const container = document.getElementById('inprogressList');
        if (!container) return;
        
        const cards = container.querySelectorAll('.task-card');
        cards.forEach(card => {
            const taskId = card.getAttribute('data-id');
            if (window.board && window.board.getTaskById) {
                const task = window.board.getTaskById(taskId);
                if (task && task.startTime) {
                    const timerSpan = card.querySelector('.task-timer-value');
                    if (timerSpan) {
                        const elapsed = Date.now() - task.startTime;
                        timerSpan.textContent = this.formatMinutes(elapsed);
                    }
                }
            }
        });
    }

    formatMinutes(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes} мин ${seconds} сек`;
    }

    formatSeconds(ms) {
        return Math.floor(ms / 1000);
    }

    startProjectTimer() {
        if (!this.isTimerRunning && !this.isProjectCompleted && this.totalStartTime === null) {
            this.isTimerRunning = true;
            this.totalStartTime = Date.now();
            this.timerStartNotified = true;
            this.theme.showMessage('⏱️ Таймер проекта запущен!', '#4caf50');
            console.log('⏱️ Таймер проекта запущен!');
        }
    }

    completeTask(task) {
        if (task.startTime && !task.cycleTime) {
            task.cycleTime = Date.now() - task.startTime;
            this.completedTasksTimes.push(task.cycleTime);
            this.theme.showMessage(`✅ Задача "${task.text.substring(0, 35)}..." выполнена за ${this.formatMinutes(task.cycleTime)}!`, '#4caf50');
            this.updateDisplay();
            return true;
        }
        return false;
    }

    checkAllTasksCompleted(todoLength, inprogressLength) {
        if (todoLength === 0 && inprogressLength === 0 && this.isTimerRunning) {
            this.isTimerRunning = false;
            this.isProjectCompleted = true;
            this.finalTotalTime = Date.now() - this.totalStartTime;
            const totalTimeFormatted = this.formatMinutes(this.finalTotalTime);
            this.theme.showMessage(`🏆 Проект завершён! Общее время: ${totalTimeFormatted}`, '#4caf50');
            console.log(`🏆 Проект завершён! Общее время: ${totalTimeFormatted}`);
            return true;
        }
        return false;
    }

    reset() {
        this.totalStartTime = null;
        this.finalTotalTime = null;
        this.completedTasksTimes = [];
        this.isTimerRunning = false;
        this.isProjectCompleted = false;
        this.timerStartNotified = false;
        this.updateDisplay();
    }

    getCompletedTimes() {
        return this.completedTasksTimes;
    }

    getTotalTime() {
        if (this.isTimerRunning && this.totalStartTime) {
            return Date.now() - this.totalStartTime;
        }
        return this.finalTotalTime || 0;
    }
}

// GOOGLE SHEETS MANAGER
class GoogleSheetsManager {
    constructor(storageManager, themeManager, onImportCallback) {
        this.storage = storageManager;
        this.theme = themeManager;
        this.onImport = onImportCallback;
    }

    loadSettings() {
        const { apiKey, sheetId } = this.storage.loadGoogleSettings();
        const apiKeyInput = document.getElementById('apiKeyInput');
        const sheetIdInput = document.getElementById('sheetIdInput');
        if (apiKeyInput && apiKey) apiKeyInput.value = apiKey;
        if (sheetIdInput && sheetId) sheetIdInput.value = sheetId;
    }

    saveSettings() {
        const apiKey = document.getElementById('apiKeyInput')?.value;
        const sheetId = document.getElementById('sheetIdInput')?.value;
        this.storage.saveGoogleSettings(apiKey, sheetId);
        this.theme.showMessage('✅ Настройки Google Sheets сохранены!', this.theme.getNotificationColor());
    }

    async importTasks() {
        const { apiKey, sheetId } = this.storage.loadGoogleSettings();
        if (!apiKey || !sheetId) {
            this.theme.showMessage('❌ Сначала сохраните API ключ и ID таблицы!', this.theme.getNotificationColor());
            return;
        }
        this.theme.showMessage('🔄 Загрузка задач из Google Sheets...', this.theme.getNotificationColor());

        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Лист1!A:A?key=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                this.theme.showMessage(`❌ Ошибка API: ${data.error.message}`, '#c44569');
                return;
            }
            if (!data.values || data.values.length <= 1) {
                this.theme.showMessage('❌ В таблице нет задач! Первая строка должна содержать заголовок "Задача"', '#c44569');
                return;
            }

            const tasksList = [];
            for (let i = 1; i < data.values.length; i++) {
                const taskName = data.values[i][0];
                if (taskName && taskName.trim()) tasksList.push(taskName.trim());
            }
            if (tasksList.length === 0) {
                this.theme.showMessage('❌ Не найдено задач для импорта!', '#c44569');
                return;
            }
            if (this.onImport) this.onImport(tasksList);
            this.theme.showMessage(`✅ Импортировано ${tasksList.length} задач из Google Sheets!`, '#4caf50');
        } catch (error) {
            console.error('Ошибка импорта:', error);
            this.theme.showMessage('❌ Ошибка импорта! Проверьте API ключ и ID таблицы.', '#c44569');
        }
    }

    exportToCSV(tasks, timerManager) {
        const allTasks = [...tasks.todo, ...tasks.inprogress, ...tasks.done];
        const totalTasks = allTasks.length;
        const completedTasks = tasks.done.length;
        const totalTime = timerManager.getTotalTime();
        const avgCycleTime = timerManager.getCompletedTimes().length > 0
            ? timerManager.getCompletedTimes().reduce((a, b) => a + b, 0) / timerManager.getCompletedTimes().length
            : 0;

        const exportData = [
            ['Статистика проекта'],
            ['Общее время работы', timerManager.formatMinutes(totalTime)],
            ['Общее время (секунды)', timerManager.formatSeconds(totalTime)],
            ['Средний Cycle Time', timerManager.formatMinutes(avgCycleTime)],
            ['Средний Cycle Time (секунды)', timerManager.formatSeconds(avgCycleTime)],
            ['Всего задач', totalTasks],
            ['Выполнено задач', completedTasks],
            ['Осталось задач', tasks.todo.length + tasks.inprogress.length],
            [],
            ['Детали задач'],
            ['Задача', 'Статус', 'Время выполнения (сек)', 'Время выполнения']
        ];

        for (let task of allTasks) {
            let status = '';
            if (tasks.done.includes(task)) status = 'Готово';
            else if (tasks.inprogress.includes(task)) status = 'В работе';
            else status = 'Ожидает';

            let cycleTimeSec = '';
            let cycleTimeFormatted = '';
            if (task.cycleTime) {
                cycleTimeSec = timerManager.formatSeconds(task.cycleTime);
                cycleTimeFormatted = timerManager.formatMinutes(task.cycleTime);
            }
            exportData.push([task.text, status, cycleTimeSec, cycleTimeFormatted]);
        }

        const csvRows = [];
        for (const row of exportData) {
            csvRows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
        }
        const csvContent = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `kanban_results_${new Date().toISOString().slice(0, 19)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.theme.showMessage('📥 CSV файл с результатами скачан!', '#4caf50');
    }
}

// FILE IMPORT HANDLER
class FileImportHandler {
    constructor(themeManager, onTasksImported, onStudentsImported) {
        this.theme = themeManager;
        this.onTasksImported = onTasksImported;
        this.onStudentsImported = onStudentsImported;
    }

    parseCSVLine(line) {
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

    handleFileUpload(file, type = 'tasks') {
        const ext = file.name.split('.').pop().toLowerCase();
        const process = (data) => {
            const items = [];
            data.split(/\r?\n/).forEach(line => {
                if (line.trim()) {
                    let name = this.parseCSVLine(line)[0];
                    name = name.replace(/^["']|["']$/g, '');
                    if (name) items.push(name);
                }
            });
            if (type === 'tasks' && this.onTasksImported) this.onTasksImported(items);
            else if (this.onStudentsImported) this.onStudentsImported(items);
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
                if (type === 'tasks' && this.onTasksImported) this.onTasksImported(items);
                else if (this.onStudentsImported) this.onStudentsImported(items);
            };
            reader.readAsArrayBuffer(file);
        }
    }

    importFromTextarea(type = 'tasks') {
        const textarea = document.getElementById(type === 'tasks' ? 'pasteData' : 'studentsData');
        if (!textarea) return;
        const raw = textarea.value;
        if (!raw.trim()) {
            this.theme.showMessage('Вставьте данные!', this.theme.getNotificationColor());
            return;
        }
        const items = [];
        raw.split(/\r?\n/).forEach(line => {
            line = line.trim();
            if (line) {
                let name = line;
                if (line.includes('\t')) name = line.split('\t')[0];
                else if (line.includes(',')) name = this.parseCSVLine(line)[0];
                else if (line.includes(';')) name = line.split(';')[0];
                name = name.replace(/^["']|["']$/g, '').trim();
                if (name) items.push(name);
            }
        });
        if (items.length === 0) {
            this.theme.showMessage('Нет данных для импорта!', this.theme.getNotificationColor());
            return;
        }
        if (type === 'tasks' && this.onTasksImported) this.onTasksImported(items);
        else if (this.onStudentsImported) this.onStudentsImported(items);
        textarea.value = '';
    }
}

// UI RENDERER 
class UIRenderer {
    constructor(themeManager, timerManager, onMoveTask, onDeleteTask, onRandomAssign, onAddTask) {
        this.theme = themeManager;
        this.timer = timerManager;
        this.onMoveTask = onMoveTask;
        this.onDeleteTask = onDeleteTask;
        this.onRandomAssign = onRandomAssign;
        this.onAddTask = onAddTask;
    }

    renderBoard(tasks, students, wipLimit) {
        this.renderTaskList(tasks.todo, document.getElementById('todoList'), 'todo', students, tasks);
        this.renderTaskList(tasks.inprogress, document.getElementById('inprogressList'), 'inprogress', students, tasks);
        this.renderTaskList(tasks.done, document.getElementById('doneList'), 'done', students, tasks);
        this.updateCounters(tasks);
    }

    renderTaskList(taskArray, container, status, students, tasks) {
        if (!container) return;
        container.innerHTML = '';

        if (!taskArray.length) {
            const empty = document.createElement('div');
            empty.textContent = '✨ Нет задач';
            container.appendChild(empty);
            return;
        }

        taskArray.forEach(task => {
            const card = this.createTaskCard(task, status, students, tasks);
            container.appendChild(card);
        });
    }

    createTaskCard(task, status, students, tasks) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('data-id', task.id);

        const textWrapper = document.createElement('div');
        textWrapper.className = 'task-text-wrapper';
        const textDiv = document.createElement('div');
        textDiv.className = 'task-text';
        textDiv.textContent = task.text;
        textWrapper.appendChild(textDiv);
        card.appendChild(textWrapper);

        const studentName = document.createElement('div');
        studentName.className = 'student-name';
        studentName.textContent = task.student || '❌ Не назначен';
        card.appendChild(studentName);

        const actionsRow = document.createElement('div');
        actionsRow.className = 'actions-row';

        const randomBtn = document.createElement('button');
        randomBtn.className = 'random-student-btn';
        randomBtn.innerHTML = '🎲 Случайный';
        randomBtn.onclick = (e) => {
            e.stopPropagation();
            if (this.onRandomAssign) this.onRandomAssign(task.id, studentName);
        };
        actionsRow.appendChild(randomBtn);

        if (status === 'inprogress' && task.startTime) {
            const timerDiv = document.createElement('div');
            timerDiv.className = 'task-timer';
            const timeValue = Date.now() - task.startTime;
            timerDiv.innerHTML = `<span class="timer-icon">⏱️</span> <span class="task-timer-value">${this.timer.formatMinutes(timeValue)}</span>`;
            actionsRow.appendChild(timerDiv);
        }

        if (status === 'done' && task.cycleTime) {
            const cycleDiv = document.createElement('div');
            cycleDiv.className = 'task-cycle';
            cycleDiv.innerHTML = `<span class="cycle-icon">✅</span> <span class="task-cycle-value">${this.timer.formatMinutes(task.cycleTime)}</span>`;
            actionsRow.appendChild(cycleDiv);
        }

        card.appendChild(actionsRow);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';
        const btnsDiv = document.createElement('div');
        btnsDiv.className = 'move-buttons';

        if (status === 'todo') {
            const btn = document.createElement('button');
            btn.className = 'move-btn';
            btn.innerHTML = '→ In Progress';
            btn.onclick = (e) => { e.stopPropagation(); if (this.onMoveTask) this.onMoveTask(task.id, 'todo', 'inprogress'); };
            btnsDiv.appendChild(btn);
        } else if (status === 'inprogress') {
            const back = document.createElement('button');
            back.className = 'move-btn';
            back.innerHTML = '← To Do';
            back.onclick = (e) => { e.stopPropagation(); if (this.onMoveTask) this.onMoveTask(task.id, 'inprogress', 'todo'); };
            const done = document.createElement('button');
            done.className = 'move-btn';
            done.innerHTML = 'Done →';
            done.onclick = (e) => { e.stopPropagation(); if (this.onMoveTask) this.onMoveTask(task.id, 'inprogress', 'done'); };
            btnsDiv.appendChild(back);
            btnsDiv.appendChild(done);
        } else if (status === 'done') {
            const back = document.createElement('button');
            back.className = 'move-btn';
            back.innerHTML = '← In Progress';
            back.onclick = (e) => { e.stopPropagation(); if (this.onMoveTask) this.onMoveTask(task.id, 'done', 'inprogress'); };
            btnsDiv.appendChild(back);
        }

        const del = document.createElement('button');
        del.className = 'task-delete';
        del.innerHTML = '✕';
        del.onclick = (e) => { e.stopPropagation(); if (this.onDeleteTask) this.onDeleteTask(task.id); };
        actionsDiv.appendChild(btnsDiv);
        actionsDiv.appendChild(del);
        card.appendChild(actionsDiv);

        card.onclick = (e) => {
            if (e.target === card || e.target.classList.contains('task-text')) {
                if (status === 'todo' && this.onMoveTask) this.onMoveTask(task.id, 'todo', 'inprogress');
                else if (status === 'inprogress' && this.onMoveTask) this.onMoveTask(task.id, 'inprogress', 'done');
            }
        };

        return card;
    }

    updateCounters(tasks) {
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

    updateStudentsListDisplay(students) {
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

    showWipWarning(message) {
        const warning = document.getElementById('inprogressWipWarning');
        if (warning) {
            warning.innerHTML = `⚠️ ${message}`;
            warning.style.display = 'block';
            setTimeout(() => warning.style.display = 'none', 3000);
        }
    }
}

// KANBAN BOARD (основная бизнес-логика) 
class KanbanBoard {
    constructor(storageManager, themeManager, timerManager, uiRenderer, googleSheetsManager, fileImportHandler) {
        this.storage = storageManager;
        this.theme = themeManager;
        this.timer = timerManager;
        this.ui = uiRenderer;
        this.google = googleSheetsManager;
        this.fileHandler = fileImportHandler;

        this.wipLimitInProgress = 3;
        this.students = [];
        this.tasks = {
            todo: [],
            inprogress: [],
            done: []
        };
    }

    generateId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    }

    getRandomStudent() {
        if (this.students.length === 0) {
            this.theme.showMessage('Сначала добавьте обучающихся в список!', this.theme.getNotificationColor());
            return null;
        }
        return this.students[Math.floor(Math.random() * this.students.length)];
    }

    loadData() {
        const savedTasks = this.storage.loadTasks();
        if (savedTasks) {
            const loadedTasks = savedTasks;
            const allTasks = [...(loadedTasks.todo || []), ...(loadedTasks.inprogress || []), ...(loadedTasks.done || [])];
            this.tasks.todo = allTasks.map(task => ({
                id: task.id,
                text: task.text,
                student: null,
                startTime: null,
                cycleTime: null
            }));
            this.tasks.inprogress = [];
            this.tasks.done = [];
            console.log(`📋 Загружено ${allTasks.length} задач, все перенесены в To Do`);
        } else {
            this.tasks = {
                todo: [
                    { id: this.generateId(), text: 'Изучить проектный треугольник', student: null, startTime: null, cycleTime: null },
                    { id: this.generateId(), text: 'Разработать макет канбан-доски', student: null, startTime: null, cycleTime: null },
                    { id: this.generateId(), text: 'Написать документацию к курсовой', student: null, startTime: null, cycleTime: null }
                ],
                inprogress: [],
                done: []
            };
        }

        const savedStudents = this.storage.loadStudents();
        if (savedStudents) {
            this.students = savedStudents;
            console.log('👨‍🎓 Обучающиеся загружены');
        } else {
            this.students = ['Иванов Иван Иванович', 'Петрова Мария Сергеевна', 'Сидоров Алексей Дмитриевич'];
        }
    }

    saveData() {
        this.storage.saveTasks(this.tasks);
        this.storage.saveStudents(this.students);
    }

    addTask(text) {
        if (!text || !text.trim()) return false;
        this.tasks.todo.push({
            id: this.generateId(),
            text: text.trim(),
            student: null,
            startTime: null,
            cycleTime: null
        });
        this.ui.renderBoard(this.tasks, this.students, this.wipLimitInProgress);
        this.saveData();
        return true;
    }

    moveTask(taskId, from, to) {
        const idx = this.tasks[from].findIndex(t => t.id === taskId);
        if (idx === -1) return false;
        const task = this.tasks[from][idx];

        if (to === 'inprogress' && this.tasks.inprogress.length >= this.wipLimitInProgress) {
            this.ui.showWipWarning(`Лимит In Progress: ${this.wipLimitInProgress}. Невозможно добавить задачу!`);
            return false;
        }

        if (to === 'inprogress' && !task.startTime) {
            task.startTime = Date.now();
            this.timer.startProjectTimer();
            if (task.student === null) {
                const randomStudent = this.getRandomStudent();
                if (randomStudent) {
                    task.student = randomStudent;
                    this.theme.showMessage(`👨‍🎓 На задачу "${task.text.substring(0, 35)}..." автоматически назначен ${randomStudent}`, this.theme.getNotificationColor());
                }
            }
        }

        if (to === 'done' && task.startTime && !task.cycleTime) {
            this.timer.completeTask(task);
        }

        this.tasks[from].splice(idx, 1);
        this.tasks[to].push(task);

        this.timer.checkAllTasksCompleted(this.tasks.todo.length, this.tasks.inprogress.length);

        this.ui.renderBoard(this.tasks, this.students, this.wipLimitInProgress);
        this.saveData();
        this.timer.updateDisplay();
        return true;
    }

    getTaskById(taskId) {
        for (let status of ['todo', 'inprogress', 'done']) {
            const task = this.tasks[status].find(t => t.id === taskId);
            if (task) return task;
        }
        return null;
    }

    deleteTask(taskId) {
        for (let status of ['todo', 'inprogress', 'done']) {
            const idx = this.tasks[status].findIndex(t => t.id === taskId);
            if (idx !== -1) {
                this.tasks[status].splice(idx, 1);
                this.timer.checkAllTasksCompleted(this.tasks.todo.length, this.tasks.inprogress.length);
                this.ui.renderBoard(this.tasks, this.students, this.wipLimitInProgress);
                this.saveData();
                return;
            }
        }
    }

    randomAssignStudent(taskId, studentNameElement) {
        const task = this.getTaskById(taskId);
        if (task) {
            const newStudent = this.getRandomStudent();
            if (newStudent) {
                task.student = newStudent;
                if (studentNameElement) studentNameElement.textContent = task.student;
                this.ui.renderBoard(this.tasks, this.students, this.wipLimitInProgress);
                this.saveData();
                this.theme.showMessage(`🎲 Назначен: ${newStudent}`, this.theme.getNotificationColor());
            }
        }
    }

    importTasks(tasksList) {
        let added = 0;
        for (let text of tasksList) {
            if (text && text.trim()) {
                this.tasks.todo.push({
                    id: this.generateId(),
                    text: text.trim(),
                    student: null,
                    startTime: null,
                    cycleTime: null
                });
                added++;
            }
        }
        if (added > 0) {
            this.ui.renderBoard(this.tasks, this.students, this.wipLimitInProgress);
            this.saveData();
            this.theme.showMessage(`✅ Импортировано ${added} задач!`, '#4caf50');
        }
        return added;
    }

    importStudents(studentList) {
        const newStudents = [];
        for (let student of studentList) {
            if (student && student.trim()) newStudents.push(student.trim());
        }
        if (newStudents.length === 0) {
            this.theme.showMessage('Не найдено обучающихся!', this.theme.getNotificationColor());
            return false;
        }
        this.students = newStudents;
        this.ui.updateStudentsListDisplay(this.students);
        this.saveData();
        this.theme.showMessage(`✅ Импортировано ${this.students.length} обучающихся!`, '#4caf50');
        return true;
    }

    clearTasksFromTodo() {
        if (this.tasks.todo.length === 0) {
            this.theme.showMessage('В колонке To Do нет задач для очистки!', this.theme.getNotificationColor());
            return;
        }
        const count = this.tasks.todo.length;
        this.tasks.todo = [];
        this.ui.renderBoard(this.tasks, this.students, this.wipLimitInProgress);
        this.saveData();
        this.theme.showMessage(`🗑 Очищено ${count} задач из колонки To Do!`, '#4caf50');
    }

    clearStudents() {
        this.students = [];
        this.ui.updateStudentsListDisplay(this.students);
        this.saveData();
        this.theme.showMessage('Список обучающихся очищен!', this.theme.getNotificationColor());
    }

    setWipLimit(newLimit) {
        const limit = parseInt(newLimit);
        if (isNaN(limit)) return false;
        this.wipLimitInProgress = Math.min(30, Math.max(1, limit));
        const input = document.querySelector('.wip-limit-input');
        if (input && input.value != this.wipLimitInProgress) input.value = this.wipLimitInProgress;
        if (this.tasks.inprogress.length > this.wipLimitInProgress) {
            const excess = this.tasks.inprogress.splice(-(this.tasks.inprogress.length - this.wipLimitInProgress));
            this.tasks.todo.unshift(...excess);
            this.ui.renderBoard(this.tasks, this.students, this.wipLimitInProgress);
        }
        return true;
    }

    exportToCSV() {
        this.google.exportToCSV(this.tasks, this.timer);
    }

    init() {
        this.loadData();
        this.timer.reset();
        this.timer.startTimerUpdate();
        this.ui.updateStudentsListDisplay(this.students);
        this.ui.renderBoard(this.tasks, this.students, this.wipLimitInProgress);
        this.google.loadSettings();
    }
}

// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ 
let board;

function init() {
    const storage = new StorageManager();
    const theme = new ThemeManager(storage);
    const timer = new TimerManager(null, theme);
    const ui = new UIRenderer(theme, timer, null, null, null, null);
    timer.ui = ui;
    const google = new GoogleSheetsManager(storage, theme, null);
    const fileHandler = new FileImportHandler(theme, null, null);
    const boardInstance = new KanbanBoard(storage, theme, timer, ui, google, fileHandler);

    google.onImport = (tasksList) => boardInstance.importTasks(tasksList);
    fileHandler.onTasksImported = (tasksList) => boardInstance.importTasks(tasksList);
    fileHandler.onStudentsImported = (studentsList) => boardInstance.importStudents(studentsList);
    ui.onMoveTask = (taskId, from, to) => boardInstance.moveTask(taskId, from, to);
    ui.onDeleteTask = (taskId) => boardInstance.deleteTask(taskId);
    ui.onRandomAssign = (taskId, studentElement) => boardInstance.randomAssignStudent(taskId, studentElement);
    ui.onAddTask = (text) => boardInstance.addTask(text);

    board = boardInstance;
    window.board = board;
    board.init();

    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) themeBtn.addEventListener('click', () => theme.toggle());

    const addBtn = document.querySelector('.add-btn');
    const todoInput = document.getElementById('todoInput');
    if (addBtn && todoInput) {
        addBtn.onclick = () => {
            if (todoInput.value) {
                boardInstance.addTask(todoInput.value);
                todoInput.value = '';
            }
        };
        todoInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                boardInstance.addTask(todoInput.value);
                todoInput.value = '';
            }
        };
    }

    const setWipBtn = document.querySelector('.set-wip-btn');
    const wipInput = document.querySelector('.wip-limit-input');
    if (setWipBtn && wipInput) {
        setWipBtn.onclick = () => boardInstance.setWipLimit(wipInput.value);
        wipInput.onkeypress = (e) => { if (e.key === 'Enter') boardInstance.setWipLimit(wipInput.value); };
    }

    const toggleGoogle = document.getElementById('toggleGoogleBtn');
    const googleContent = document.getElementById('googleContent');
    if (toggleGoogle && googleContent) {
        toggleGoogle.onclick = () => {
            const isHidden = googleContent.style.display === 'none';
            googleContent.style.display = isHidden ? 'block' : 'none';
            toggleGoogle.innerHTML = isHidden ? '▲ Скрыть' : '▼ Показать';
        };
    }
    const saveGoogleBtn = document.getElementById('saveGoogleSettingsBtn');
    const importGoogleBtn = document.getElementById('importFromGoogleBtn');
    const exportGoogleBtn = document.getElementById('exportToGoogleBtn');
    if (saveGoogleBtn) saveGoogleBtn.addEventListener('click', () => google.saveSettings());
    if (importGoogleBtn) importGoogleBtn.addEventListener('click', () => google.importTasks());
    if (exportGoogleBtn) exportGoogleBtn.addEventListener('click', () => boardInstance.exportToCSV());

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

    const pasteImportBtn = document.getElementById('pasteImportBtn');
    if (pasteImportBtn) pasteImportBtn.addEventListener('click', () => fileHandler.importFromTextarea('tasks'));
    const excelFileInput = document.getElementById('excelFileInput');
    if (excelFileInput) {
        excelFileInput.addEventListener('change', e => {
            if (e.target.files[0]) fileHandler.handleFileUpload(e.target.files[0], 'tasks');
            e.target.value = '';
        });
    }
    const clearTasksBtn = document.getElementById('clearTasksBtn');
    if (clearTasksBtn) clearTasksBtn.addEventListener('click', () => boardInstance.clearTasksFromTodo());

    const studentsImportBtn = document.getElementById('studentsImportBtn');
    if (studentsImportBtn) studentsImportBtn.addEventListener('click', () => fileHandler.importFromTextarea('students'));
    const studentsFileInput = document.getElementById('studentsFileInput');
    if (studentsFileInput) {
        studentsFileInput.addEventListener('change', e => {
            if (e.target.files[0]) fileHandler.handleFileUpload(e.target.files[0], 'students');
            e.target.value = '';
        });
    }
    const clearStudentsBtn = document.getElementById('clearStudentsBtn');
    if (clearStudentsBtn) clearStudentsBtn.addEventListener('click', () => boardInstance.clearStudents());

    console.log('✅ Канбан-доска готова! (ООП-версия)');
    console.log('⏱️ Таймеры на карточках обновляются в реальном времени!');
}

window.clearAllData = () => {
    localStorage.clear();
    location.reload();
};

init();
