// ========================================
// 日历记事应用 - 核心JavaScript
// ========================================

class CalendarTaskApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.checkins = this.loadCheckins();
        this.currentDate = new Date();
        this.currentView = 'calendar';
        this.currentFilter = 'all';
        this.editingTaskId = null;

        // 通知相关属性
        this.notificationSettings = this.loadNotificationSettings();
        this.lastNotificationDate = null;
        this.notificationTimer = null;

        // SheetJS库加载状态
        this.xlsxLoaded = false;
        this.xlsxLoading = false;

        // 选中的日期
        this.selectedDate = null;

        this.init();
    }

    // 初始化应用
    init() {
        this.bindEvents();
        this.renderCalendar();
        this.updateStats();
        this.setDefaultDate();
        this.initNotificationSystem();
    }

    // 绑定事件
    bindEvents() {
        // 添加任务按钮
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.openTaskModal();
        });

        // 关闭模态框
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('closeDetailModal').addEventListener('click', () => {
            this.closeDetailModal();
        });

        // 点击模态框外部关闭
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') {
                this.closeTaskModal();
            }
        });

        document.getElementById('detailModal').addEventListener('click', (e) => {
            if (e.target.id === 'detailModal') {
                this.closeDetailModal();
            }
        });

        // 表单提交
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // 视图切换
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchView(btn.dataset.view);
            });
        });

        // 筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter);
            });
        });

        // 日历导航
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.navigateMonth(-1);
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.navigateMonth(1);
        });

        // 打卡任务相关事件
        document.getElementById('addCheckinPageBtn').addEventListener('click', () => {
            this.openCheckinModal();
        });

        document.getElementById('closeCheckinModal').addEventListener('click', () => {
            this.closeCheckinModal();
        });

        document.getElementById('cancelCheckinBtn').addEventListener('click', () => {
            this.closeCheckinModal();
        });

        document.getElementById('checkinModal').addEventListener('click', (e) => {
            if (e.target.id === 'checkinModal') {
                this.closeCheckinModal();
            }
        });

        document.getElementById('checkinForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCheckin();
        });

        // 通知设置相关事件
        document.getElementById('notificationSettingsBtn').addEventListener('click', () => {
            this.openNotificationModal();
        });

        // 日期任务列表相关事件
        document.getElementById('closeDateTaskModal').addEventListener('click', () => {
            this.closeDateTaskModal();
        });

        document.getElementById('dateTaskModal').addEventListener('click', (e) => {
            if (e.target.id === 'dateTaskModal') {
                this.closeDateTaskModal();
            }
        });

        document.getElementById('addTaskForDateBtn').addEventListener('click', () => {
            this.closeDateTaskModal();
            if (this.selectedDate) {
                document.getElementById('taskStartDate').value = this.selectedDate;
                document.getElementById('taskEndDate').value = this.selectedDate;
                this.openTaskModal();
            }
        });

        document.getElementById('closeNotificationModal').addEventListener('click', () => {
            this.closeNotificationModal();
        });

        document.getElementById('cancelNotificationBtn').addEventListener('click', () => {
            this.closeNotificationModal();
        });

        document.getElementById('notificationModal').addEventListener('click', (e) => {
            if (e.target.id === 'notificationModal') {
                this.closeNotificationModal();
            }
        });

        document.getElementById('notificationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNotificationSettingsFromForm();
        });

        document.getElementById('testNotificationBtn').addEventListener('click', () => {
            this.testNotification();
        });

        // 导入导出相关事件
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.openExportFormatModal();
        });

        document.getElementById('closeExportFormatModal').addEventListener('click', () => {
            this.closeExportFormatModal();
        });

        document.getElementById('exportFormatModal').addEventListener('click', (e) => {
            if (e.target.id === 'exportFormatModal') {
                this.closeExportFormatModal();
            }
        });

        document.getElementById('exportJsonBtn').addEventListener('click', () => {
            this.closeExportFormatModal();
            this.exportDataAsJson();
        });

        document.getElementById('exportExcelBtn').addEventListener('click', () => {
            this.closeExportFormatModal();
            this.exportDataAsExcel();
        });

        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.importData(e);
        });
    }

    // 设置默认日期为今天
    setDefaultDate() {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        document.getElementById('taskStartDate').value = dateStr;
        document.getElementById('taskEndDate').value = dateStr;
    }

    // 打开任务模态框
    openTaskModal(task = null) {
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('taskForm');

        if (task) {
            // 编辑模式
            title.textContent = '编辑任务';
            this.editingTaskId = task.id;
            this.populateForm(task);
        } else {
            // 添加模式
            title.textContent = '添加新任务';
            this.editingTaskId = null;
            form.reset();
            this.setDefaultDate();
        }

        modal.classList.add('active');
    }

    // 关闭任务模态框
    closeTaskModal() {
        const modal = document.getElementById('taskModal');
        modal.classList.remove('active');
        this.editingTaskId = null;
    }

    // 填充表单（编辑模式）
    populateForm(task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskStartDate').value = task.startDate;
        document.getElementById('taskStartTime').value = task.startTime || '';
        document.getElementById('taskEndDate').value = task.endDate;
        document.getElementById('taskEndTime').value = task.endTime || '';
        document.getElementById('taskProgressNote').value = task.progressNote || '';
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;
    }

    // 保存任务
    saveTask() {
        const taskData = {
            id: this.editingTaskId || this.generateId(),
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            startDate: document.getElementById('taskStartDate').value,
            startTime: document.getElementById('taskStartTime').value,
            endDate: document.getElementById('taskEndDate').value,
            endTime: document.getElementById('taskEndTime').value,
            priority: document.getElementById('taskPriority').value,
            category: document.getElementById('taskCategory').value,
            status: 'pending',
            progress: 0,
            progressNote: document.getElementById('taskProgressNote').value.trim(),
            createdAt: this.editingTaskId ?
                this.tasks.find(t => t.id === this.editingTaskId).createdAt :
                new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingTaskId) {
            // 更新现有任务
            const index = this.tasks.findIndex(t => t.id === this.editingTaskId);
            taskData.status = this.tasks[index].status;
            taskData.progress = this.tasks[index].progress;
            taskData.progressNote = document.getElementById('taskProgressNote').value.trim();
            this.tasks[index] = taskData;
        } else {
            // 添加新任务
            this.tasks.push(taskData);
        }

        this.saveTasks();
        this.closeTaskModal();
        this.renderCalendar();
        this.renderTaskList();
        this.updateStats();
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 保存任务到本地存储
    saveTasks() {
        localStorage.setItem('calendarTasks', JSON.stringify(this.tasks));
    }

    // 从本地存储加载任务
    loadTasks() {
        const saved = localStorage.getItem('calendarTasks');
        return saved ? JSON.parse(saved) : [];
    }

    // 删除任务
    deleteTask(taskId) {
        if (confirm('确定要删除这个任务吗？')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderCalendar();
            this.renderTaskList();
            this.updateStats();
            this.closeDetailModal();
        }
    }

    // 更新任务状态
    updateTaskStatus(taskId, status) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            task.progress = status === 'completed' ? 100 : (status === 'in-progress' ? 50 : 0);
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderCalendar();
            this.renderTaskList();
            this.updateStats();
        }
    }

    // 更新任务进度
    updateTaskProgress(taskId, progress) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.progress = parseInt(progress);
            if (task.progress === 100) {
                task.status = 'completed';
            } else if (task.progress > 0) {
                task.status = 'in-progress';
            } else {
                task.status = 'pending';
            }

            // 保存进展描述
            const progressNoteInput = document.getElementById('progressNoteInput');
            if (progressNoteInput) {
                task.progressNote = progressNoteInput.value.trim();
            }

            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderCalendar();
            this.renderTaskList();
            this.updateStats();

            // 刷新详情显示
            this.showTaskDetail(taskId);
        }
    }

    // 更新任务进度和进展描述（新方法）
    updateTaskProgressWithNote(taskId, progress, note) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.progress = parseInt(progress);
            task.progressNote = note;
            
            if (task.progress === 100) {
                task.status = 'completed';
            } else if (task.progress > 0) {
                task.status = 'in-progress';
            } else {
                task.status = 'pending';
            }

            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderCalendar();
            this.renderTaskList();
            this.updateStats();

            // 刷新详情显示
            this.showTaskDetail(taskId);
        }
    }

    // 切换视图
    switchView(view) {
        this.currentView = view;

        // 更新按钮状态
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // 显示对应视图
        document.getElementById('calendarView').style.display = view === 'calendar' ? 'block' : 'none';
        document.getElementById('listView').style.display = view === 'list' ? 'block' : 'none';
        document.getElementById('checkinView').style.display = view === 'checkin' ? 'block' : 'none';

        if (view === 'list') {
            this.renderTaskList();
        } else if (view === 'checkin') {
            this.renderCheckinPage();
        }
    }

    // 设置筛选
    setFilter(filter) {
        this.currentFilter = filter;

        // 更新按钮状态
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderTaskList();
    }

    // 渲染日历
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // 更新月份标题
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月',
                          '7月', '8月', '9月', '10月', '11月', '12月'];
        document.getElementById('currentMonth').textContent = `${year}年${monthNames[month]}`;

        // 获取月份信息
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        // 生成日历格子
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        // 上个月的日期
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const dayElement = this.createDayElement(prevMonthLastDay - i, true);
            calendarDays.appendChild(dayElement);
        }

        // 当前月的日期
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = today.getFullYear() === year &&
                           today.getMonth() === month &&
                           today.getDate() === day;

            const dayElement = this.createDayElement(day, false, dateStr, isToday);
            calendarDays.appendChild(dayElement);
        }

        // 下个月的日期
        const remainingDays = 42 - (startDay + totalDays);
        for (let i = 1; i <= remainingDays; i++) {
            const dayElement = this.createDayElement(i, true);
            calendarDays.appendChild(dayElement);
        }
    }

    // 创建日期元素
    createDayElement(day, isOtherMonth = false, dateStr = null, isToday = false) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        if (isToday) {
            dayElement.classList.add('today');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        // 添加任务列表
        if (dateStr) {
            const tasksOnDay = this.getTasksByDate(dateStr);
            if (tasksOnDay.length > 0) {
                // 创建任务列表容器
                const taskList = document.createElement('div');
                taskList.className = 'day-task-list';

                // 显示最多6个任务
                const maxTasks = 6;
                tasksOnDay.slice(0, maxTasks).forEach(task => {
                    const taskItem = document.createElement('div');
                    taskItem.className = `day-task-item priority-${task.priority}`;
                    if (task.status === 'completed') {
                        taskItem.classList.add('completed');
                    }

                    // 任务内容容器
                    const taskContent = document.createElement('div');
                    taskContent.className = 'task-content';

                    // 任务标题
                    const taskTitle = document.createElement('div');
                    taskTitle.className = 'task-title-text';
                    const maxLen = 10;
                    const displayName = task.title.length > maxLen ?
                        task.title.substring(0, maxLen) + '...' : task.title;
                    taskTitle.textContent = displayName;
                    taskTitle.title = task.title; // 完整标题作为tooltip

                    // 进度百分比
                    const progressText = document.createElement('span');
                    progressText.className = 'progress-text';
                    progressText.textContent = `${task.progress}%`;

                    taskContent.appendChild(taskTitle);
                    taskContent.appendChild(progressText);
                    taskItem.appendChild(taskContent);

                    // 点击任务项显示详情
                    taskItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showTaskDetail(task.id);
                    });

                    taskList.appendChild(taskItem);
                });

                // 如果有更多任务，显示数量
                if (tasksOnDay.length > maxTasks) {
                    const moreItem = document.createElement('div');
                    moreItem.className = 'day-task-more';
                    moreItem.textContent = `还有 ${tasksOnDay.length - maxTasks} 个任务`;
                    taskList.appendChild(moreItem);
                }

                dayElement.appendChild(taskList);
            }

            // 点击日期空白区域添加任务
            dayElement.addEventListener('click', (e) => {
                if (e.target === dayElement || e.target.classList.contains('day-number')) {
                    this.showTasksForDate(dateStr);
                }
            });
        }

        return dayElement;
    }

    // 获取指定日期的任务（任务在该日期范围内）
    getTasksByDate(dateStr) {
        return this.tasks.filter(task => {
            return dateStr >= task.startDate && dateStr <= task.endDate;
        });
    }

    // 显示指定日期的任务
    showTasksForDate(dateStr) {
        this.selectedDate = dateStr;
        const tasks = this.getTasksByDate(dateStr);

        // 格式化日期显示
        const date = new Date(dateStr);
        const dateDisplay = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        document.getElementById('dateTaskModalTitle').textContent = `${dateDisplay} 任务`;

        const content = document.getElementById('dateTaskContent');

        if (tasks.length === 0) {
            content.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p style="font-size: 48px; margin-bottom: 16px;">📅</p>
                    <p>当天暂无任务</p>
                    <p style="font-size: 14px; margin-top: 8px;">点击下方按钮添加新任务</p>
                </div>
            `;
        } else {
            content.innerHTML = tasks.map(task => this.createDateTaskItemHTML(task)).join('');

            // 绑定任务项事件
            content.querySelectorAll('.date-task-item').forEach(item => {
                const taskId = item.dataset.taskId;

                item.addEventListener('click', (e) => {
                    if (!e.target.closest('.task-action-btn')) {
                        this.closeDateTaskModal();
                        this.showTaskDetail(taskId);
                    }
                });

                // 编辑按钮
                const editBtn = item.querySelector('.edit-btn');
                if (editBtn) {
                    editBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.closeDateTaskModal();
                        const task = this.tasks.find(t => t.id === taskId);
                        this.openTaskModal(task);
                    });
                }

                // 删除按钮
                const deleteBtn = item.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteTask(taskId);
                        // 删除后刷新列表
                        this.showTasksForDate(dateStr);
                    });
                }
            });
        }

        document.getElementById('dateTaskModal').classList.add('active');
    }

    // 创建日期任务项HTML
    createDateTaskItemHTML(task) {
        const statusNames = {
            'pending': '待处理',
            'in-progress': '进行中',
            'completed': '已完成'
        };

        const isOverdue = task.endDate < new Date().toISOString().split('T')[0] && task.status !== 'completed';

        return `
            <div class="date-task-item priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}"
                 data-task-id="${task.id}">
                <div class="date-task-main">
                    <div class="date-task-title-line">
                        <span class="task-title-text">${task.title}</span>
                    </div>
                    ${task.progressNote ? `
                        <div class="date-task-progress-note-line" title="${task.progressNote}">
                            <span class="note-icon">📝</span>
                            <span class="note-text">${task.progressNote}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="date-task-info-line">
                    <span class="status-badge ${isOverdue ? 'overdue' : task.status}">
                        ${isOverdue ? '已逾期' : statusNames[task.status]}
                    </span>
                    <span class="task-progress-percent">${task.progress}%</span>
                </div>
                <div class="date-task-actions">
                    <button class="task-action-btn edit-btn" title="编辑">✏️</button>
                    <button class="task-action-btn delete-btn" title="删除">🗑️</button>
                </div>
            </div>
        `;
    }

    // 关闭日期任务列表模态框
    closeDateTaskModal() {
        document.getElementById('dateTaskModal').classList.remove('active');
    }

    // 导航月份
    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    // 渲染任务列表
    renderTaskList() {
        const taskList = document.getElementById('taskList');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    <p style="font-size: 48px; margin-bottom: 16px;">📝</p>
                    <p>暂无任务</p>
                    <p style="font-size: 14px; margin-top: 8px;">点击"添加新任务"开始创建</p>
                </div>
            `;
            return;
        }

        taskList.innerHTML = filteredTasks.map(task => this.createTaskItemHTML(task)).join('');

        // 绑定任务项事件
        taskList.querySelectorAll('.task-item').forEach(item => {
            const taskId = item.dataset.taskId;

            // 点击任务项显示详情
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.task-action-btn')) {
                    this.showTaskDetail(taskId);
                }
            });

            // 编辑按钮
            item.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const task = this.tasks.find(t => t.id === taskId);
                this.openTaskModal(task);
            });

            // 删除按钮
            item.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(taskId);
            });
        });
    }

    // 获取筛选后的任务
    getFilteredTasks() {
        let filtered = [...this.tasks];

        switch (this.currentFilter) {
            case 'pending':
                filtered = filtered.filter(t => t.status === 'pending' || t.status === 'in-progress');
                break;
            case 'completed':
                filtered = filtered.filter(t => t.status === 'completed');
                break;
            case 'overdue':
                const today = new Date().toISOString().split('T')[0];
                filtered = filtered.filter(t => t.endDate < today && t.status !== 'completed');
                break;
        }

        // 定义优先级权重（高=3, 中=2, 低=1）
        const priorityWeight = {
            'high': 3,
            'medium': 2,
            'low': 1
        };

        // 按优先级从高到低排序，相同优先级按结束时间从早到晚排序
        return filtered.sort((a, b) => {
            // 先比较优先级
            const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
            if (priorityDiff !== 0) {
                return priorityDiff;
            }

            // 优先级相同，比较结束日期
            if (a.endDate !== b.endDate) {
                return a.endDate.localeCompare(b.endDate);
            }

            // 结束日期相同，比较结束时间
            const aEndTime = a.endTime || '23:59';
            const bEndTime = b.endTime || '23:59';
            return aEndTime.localeCompare(bEndTime);
        });
    }

    // 创建任务项HTML
    createTaskItemHTML(task) {
        const categoryNames = {
            'work': '工作',
            'personal': '个人',
            'study': '学习',
            'other': '其他'
        };

        const statusNames = {
            'pending': '待处理',
            'in-progress': '进行中',
            'completed': '已完成'
        };

        const priorityNames = {
            'low': '低',
            'medium': '中',
            'high': '高'
        };

        const today = new Date().toISOString().split('T')[0];
        const isOverdue = task.endDate < today && task.status !== 'completed';

        const dateRange = task.startDate === task.endDate ?
            task.startDate :
            `${task.startDate} ~ ${task.endDate}`;

        return `
            <div class="task-item priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}"
                 data-task-id="${task.id}">
                <div class="task-header">
                    <h3 class="task-title">${task.title}</h3>
                    <div class="task-actions">
                        <button class="task-action-btn edit-btn" title="编辑">✏️</button>
                        <button class="task-action-btn delete-btn" title="删除">🗑️</button>
                    </div>
                </div>
                <div class="task-meta">
                    <span class="task-date">📅 ${dateRange}</span>
                    <span class="task-priority priority-${task.priority}">优先级: ${priorityNames[task.priority]}</span>
                    <span class="task-category ${task.category}">${categoryNames[task.category]}</span>
                    <span class="status-badge ${isOverdue ? 'overdue' : task.status}">
                        ${isOverdue ? '已逾期' : statusNames[task.status]}
                    </span>
                    <span class="task-progress-badge">${task.progress}%</span>
                </div>
                ${task.progressNote ? `
                    <div class="task-progress-note">
                        <span class="note-label">进展：</span>
                        <span class="note-content">${task.progressNote}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 显示任务详情
    showTaskDetail(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const modal = document.getElementById('detailModal');
        const detail = document.getElementById('taskDetail');

        const categoryNames = {
            'work': '工作',
            'personal': '个人',
            'study': '学习',
            'other': '其他'
        };

        const priorityNames = {
            'low': '低',
            'medium': '中',
            'high': '高'
        };

        const statusNames = {
            'pending': '待处理',
            'in-progress': '进行中',
            'completed': '已完成'
        };

        const today = new Date().toISOString().split('T')[0];
        const isOverdue = task.endDate < today && task.status !== 'completed';

        const dateRange = task.startDate === task.endDate ?
            task.startDate :
            `${task.startDate} ~ ${task.endDate}`;

        const timeRange = (task.startTime && task.endTime) ?
            `${task.startTime} ~ ${task.endTime}` :
            (task.startTime || task.endTime || '未指定时间');

        detail.innerHTML = `
            <div class="detail-section">
                <h3>任务标题</h3>
                <div class="detail-content">${task.title}</div>
            </div>

            ${task.description ? `
                <div class="detail-section">
                    <h3>任务描述</h3>
                    <div class="detail-content">${task.description}</div>
                </div>
            ` : ''}

            <div class="detail-section">
                <h3>时间范围</h3>
                <div class="detail-content">
                    <p><strong>日期:</strong> 📅 ${dateRange}</p>
                    <p><strong>时间:</strong> 🕐 ${timeRange}</p>
                </div>
            </div>

            <div class="detail-section">
                <h3>任务属性</h3>
                <div class="detail-content">
                    <p><strong>优先级:</strong> ${priorityNames[task.priority]}</p>
                    <p><strong>分类:</strong> ${categoryNames[task.category]}</p>
                    <p><strong>状态:</strong>
                        <span class="status-badge ${isOverdue ? 'overdue' : task.status}">
                            ${isOverdue ? '已逾期' : statusNames[task.status]}
                        </span>
                    </p>
                </div>
            </div>

            <div class="detail-section">
                <h3>进度与进展</h3>
                <div class="detail-content">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                        <span style="font-size: 14px; color: var(--text-secondary);">当前进度：</span>
                        <span id="currentProgressValue" style="font-size: 20px; font-weight: 600; color: var(--primary-color);">${task.progress}%</span>
                    </div>
                    <input type="range" min="0" max="100" value="${task.progress}"
                           class="progress-slider" id="progressSlider"
                           style="width: 100%; margin-bottom: 16px;">
                    <div style="margin-bottom: 16px;">
                        <label style="font-size: 14px; color: var(--text-secondary); display: block; margin-bottom: 8px;">进展描述：</label>
                        <textarea id="progressNoteInput" rows="3"
                                  style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px; resize: vertical; font-family: inherit;"
                                  placeholder="描述当前进展情况...">${task.progressNote || ''}</textarea>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                        <span style="font-size: 13px; color: var(--text-tertiary);">快捷设置：</span>
                        <button class="btn-secondary" onclick="app.updateTaskProgress('${task.id}', 0)">0%</button>
                        <button class="btn-secondary" onclick="app.updateTaskProgress('${task.id}', 25)">25%</button>
                        <button class="btn-secondary" onclick="app.updateTaskProgress('${task.id}', 50)">50%</button>
                        <button class="btn-secondary" onclick="app.updateTaskProgress('${task.id}', 75)">75%</button>
                        <button class="btn-primary" onclick="app.updateTaskProgress('${task.id}', 100)">100%</button>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h3>状态更新</h3>
                <div class="detail-content" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button class="btn-secondary" onclick="app.updateTaskStatus('${task.id}', 'pending')">待处理</button>
                    <button class="btn-secondary" onclick="app.updateTaskStatus('${task.id}', 'in-progress')">进行中</button>
                    <button class="btn-primary" onclick="app.updateTaskStatus('${task.id}', 'completed')">已完成</button>
                </div>
            </div>

            <div class="form-actions" style="margin-top: 16px;">
                <button class="btn-secondary" onclick="app.openTaskModal(app.tasks.find(t => t.id === '${task.id}'))">编辑任务</button>
                <button class="btn-primary" style="background: var(--danger-color);" onclick="app.deleteTask('${task.id}')">删除任务</button>
            </div>
        `;

        // 绑定进度滑块事件
        const slider = document.getElementById('progressSlider');
        const progressNoteInput = document.getElementById('progressNoteInput');
        
        // 滑块拖动时实时更新显示
        slider.addEventListener('input', (e) => {
            document.getElementById('currentProgressValue').textContent = `${e.target.value}%`;
        });
        
        // 滑块松开时保存
        slider.addEventListener('change', (e) => {
            const progress = parseInt(e.target.value);
            const note = progressNoteInput ? progressNoteInput.value.trim() : '';
            this.updateTaskProgressWithNote(taskId, progress, note);
        });
        
        // 进展描述输入框失焦时保存
        if (progressNoteInput) {
            progressNoteInput.addEventListener('blur', () => {
                const progress = parseInt(slider.value);
                const note = progressNoteInput.value.trim();
                this.updateTaskProgressWithNote(taskId, progress, note);
            });
        }

        modal.classList.add('active');
    }

    // 关闭详情模态框
    closeDetailModal() {
        const modal = document.getElementById('detailModal');
        modal.classList.remove('active');
    }

    // 更新统计信息
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    // ========================================
    // 打卡任务相关方法
    // ========================================

    // 加载打卡任务
    loadCheckins() {
        const saved = localStorage.getItem('checkinTasks');
        return saved ? JSON.parse(saved) : [];
    }

    // 保存打卡任务
    saveCheckins() {
        localStorage.setItem('checkinTasks', JSON.stringify(this.checkins));
    }

    // 打开打卡任务模态框
    openCheckinModal() {
        const modal = document.getElementById('checkinModal');
        const form = document.getElementById('checkinForm');
        form.reset();
        modal.classList.add('active');
    }

    // 关闭打卡任务模态框
    closeCheckinModal() {
        const modal = document.getElementById('checkinModal');
        modal.classList.remove('active');
    }

    // 保存打卡任务
    saveCheckin() {
        const title = document.getElementById('checkinTitle').value.trim();
        const icon = document.getElementById('checkinIcon').value.trim() || '✓';

        if (!title) {
            alert('请输入打卡任务名称');
            return;
        }

        const checkin = {
            id: this.generateId(),
            title: title,
            icon: icon,
            records: [], // 打卡日期记录
            createdAt: new Date().toISOString()
        };

        this.checkins.push(checkin);
        this.saveCheckins();
        this.closeCheckinModal();
        this.renderCheckinPage();
    }

    // 删除打卡任务
    deleteCheckin(checkinId) {
        if (confirm('确定要删除这个打卡任务吗？')) {
            this.checkins = this.checkins.filter(c => c.id !== checkinId);
            this.saveCheckins();
            this.renderCheckinPage();
        }
    }

    // 执行打卡
    toggleCheckin(checkinId) {
        const checkin = this.checkins.find(c => c.id === checkinId);
        if (!checkin) return;

        const today = new Date().toISOString().split('T')[0];
        const index = checkin.records.indexOf(today);

        if (index === -1) {
            // 今日未打卡，添加打卡
            checkin.records.push(today);
        } else {
            // 今日已打卡，取消打卡
            checkin.records.splice(index, 1);
        }

        this.saveCheckins();
        this.renderCheckinPage();
    }

    // 计算连续打卡天数
    getStreak(records) {
        if (records.length === 0) return 0;

        // 按日期降序排序
        const sortedRecords = [...records].sort().reverse();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streak = 0;
        let checkDate = new Date(today);

        for (let i = 0; i < sortedRecords.length; i++) {
            const recordDate = new Date(sortedRecords[i]);
            recordDate.setHours(0, 0, 0, 0);

            // 检查是否是连续的日期
            if (recordDate.getTime() === checkDate.getTime()) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (recordDate.getTime() === checkDate.getTime() - 86400000) {
                // 如果今天没打卡，检查昨天
                streak++;
                checkDate.setDate(checkDate.getDate() - 2);
            } else {
                break;
            }
        }

        return streak;
    }

    // 渲染打卡独立页面
    renderCheckinPage() {
        const list = document.getElementById('checkinPageList');
        const today = new Date().toISOString().split('T')[0];

        // 更新统计数据
        const totalCheckins = this.checkins.length;
        const todayChecked = this.checkins.filter(c => c.records.includes(today)).length;
        const maxStreak = this.checkins.reduce((max, c) => Math.max(max, this.getStreak(c.records)), 0);

        document.getElementById('totalCheckins').textContent = totalCheckins;
        document.getElementById('todayChecked').textContent = todayChecked;
        document.getElementById('maxStreak').textContent = maxStreak;

        if (this.checkins.length === 0) {
            list.innerHTML = '';
            return;
        }

        list.innerHTML = this.checkins.map(checkin => {
            const isCheckedToday = checkin.records.includes(today);
            const streak = this.getStreak(checkin.records);

            return `
                <div class="checkin-page-item ${isCheckedToday ? 'checked-today' : ''}" data-checkin-id="${checkin.id}">
                    <div class="checkin-page-item-header">
                        <div class="checkin-page-icon">${checkin.icon}</div>
                        <div class="checkin-page-title">${checkin.title}</div>
                    </div>
                    <div class="checkin-page-streak">
                        <span class="checkin-page-streak-label">已连续</span>
                        <span class="checkin-page-streak-value">${streak}</span>
                        <span class="checkin-page-streak-unit">天</span>
                    </div>
                    <div class="checkin-page-actions">
                        <button class="checkin-page-btn ${isCheckedToday ? 'checked' : ''}"
                                data-checkin-id="${checkin.id}">
                            ${isCheckedToday ? '✓ 今日已打卡' : '打卡'}
                        </button>
                        <button class="checkin-page-delete-btn"
                                data-checkin-id="${checkin.id}"
                                title="删除">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // 绑定事件
        list.querySelectorAll('.checkin-page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleCheckin(btn.dataset.checkinId);
            });
        });

        list.querySelectorAll('.checkin-page-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCheckin(btn.dataset.checkinId);
            });
        });

        // 点击整个项目也可以打卡
        list.querySelectorAll('.checkin-page-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.checkin-page-btn') && !e.target.closest('.checkin-page-delete-btn')) {
                    this.toggleCheckin(item.dataset.checkinId);
                }
            });
        });
    }

    // ========================================
    // 通知系统相关方法
    // ========================================

    // 加载通知设置
    loadNotificationSettings() {
        const saved = localStorage.getItem('notificationSettings');
        return saved ? JSON.parse(saved) : {
            enabled: true,
            checkTime: '12:00', // 中午12点
            notifyBefore: false, // 是否在时间前提醒
            browserNotification: true,
            espaceNotification: false,
            espaceWebhook: '' // eSpace webhook地址
        };
    }

    // 保存通知设置
    saveNotificationSettings() {
        localStorage.setItem('notificationSettings', JSON.stringify(this.notificationSettings));
    }

    // 初始化通知系统
    initNotificationSystem() {
        // 请求浏览器通知权限
        if (this.notificationSettings.browserNotification && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }

        // 启动定时检查
        this.startNotificationTimer();

        // 页面可见性变化时重新检查
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkAndNotify();
            }
        });
    }

    // 启动通知定时器
    startNotificationTimer() {
        // 清除旧的定时器
        if (this.notificationTimer) {
            clearInterval(this.notificationTimer);
        }

        // 每分钟检查一次
        this.notificationTimer = setInterval(() => {
            this.checkAndNotify();
        }, 60000); // 60秒

        // 立即检查一次
        this.checkAndNotify();
    }

    // 检查并发送通知
    checkAndNotify() {
        if (!this.notificationSettings.enabled) {
            return;
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        // 检查是否已经发送过今天的通知
        if (this.lastNotificationDate === today) {
            return;
        }

        // 检查是否到达通知时间（中午12点）
        if (currentTime >= this.notificationSettings.checkTime) {
            // 检查是否有未完成的打卡任务
            const uncompletedCheckins = this.getUncompletedCheckins();
            // 检查是否有未完成或无进展的日历任务
            const uncompletedCalendarTasks = this.getUncompletedCalendarTasks();

            if (uncompletedCheckins.length > 0 || uncompletedCalendarTasks.length > 0) {
                this.sendNotification(uncompletedCheckins, uncompletedCalendarTasks);
                this.lastNotificationDate = today;
            }
        }
    }

    // 获取未完成的打卡任务
    getUncompletedCheckins() {
        const today = new Date().toISOString().split('T')[0];
        return this.checkins.filter(checkin => !checkin.records.includes(today));
    }

    // 获取当天未完成或无进展的日历任务
    getUncompletedCalendarTasks() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        return this.tasks.filter(task => {
            // 任务日期范围包含今天
            const isTodayTask = task.startDate <= today && task.endDate >= today;

            if (!isTodayTask) return false;

            // 已完成的任务不提醒
            if (task.status === 'completed') return false;

            // 检查今天是否有进展更新
            const updatedAt = new Date(task.updatedAt);
            const isUpdatedToday = updatedAt.toISOString().split('T')[0] === today;

            // 未完成的任务：要么状态不是completed，要么今天没有更新进展
            // 如果任务状态是pending或in-progress，且今天没有更新，则需要提醒
            if (task.status === 'pending' || task.status === 'in-progress') {
                // 如果今天没有更新过，需要提醒
                if (!isUpdatedToday) {
                    return true;
                }
                // 如果进度为0，也需要提醒
                if (task.progress === 0) {
                    return true;
                }
            }

            return false;
        });
    }

    // 发送通知
    async sendNotification(uncompletedCheckins, uncompletedCalendarTasks) {
        const title = '任务提醒';

        let bodyParts = [];

        // 添加打卡任务提醒
        if (uncompletedCheckins.length > 0) {
            bodyParts.push(`【打卡任务】${uncompletedCheckins.length} 个未完成：`);
            bodyParts.push(uncompletedCheckins.map(c => `  • ${c.title}`).join('\n'));
        }

        // 添加日历任务提醒
        if (uncompletedCalendarTasks.length > 0) {
            if (bodyParts.length > 0) bodyParts.push(''); // 添加空行分隔
            bodyParts.push(`【日历任务】${uncompletedCalendarTasks.length} 个待处理：`);
            bodyParts.push(uncompletedCalendarTasks.map(t => {
                const status = t.status === 'pending' ? '待处理' : '进行中';
                const progress = t.progress > 0 ? ` (${t.progress}%)` : '';
                return `  • ${t.title} [${status}]${progress}`;
            }).join('\n'));
        }

        const body = bodyParts.join('\n');

        // 发送浏览器通知
        if (this.notificationSettings.browserNotification) {
            this.sendBrowserNotification(title, body);
        }

        // 发送eSpace通知
        if (this.notificationSettings.espaceNotification && this.notificationSettings.espaceWebhook) {
            await this.sendEspaceNotification(title, body, uncompletedCheckins, uncompletedCalendarTasks);
        }
    }

    // 发送浏览器通知
    sendBrowserNotification(title, body) {
        if (!('Notification' in window)) {
            console.warn('浏览器不支持通知功能');
            return;
        }

        if (Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: '✓',
                tag: 'checkin-reminder',
                requireInteraction: true // 需要用户交互才关闭
            });

            // 点击通知时打开应用
            notification.onclick = () => {
                window.focus();
                this.switchView('checkin');
                notification.close();
            };
        } else if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    // 发送eSpace通知（预留接口）
    async sendEspaceNotification(title, body, uncompletedCheckins, uncompletedCalendarTasks) {
        if (!this.notificationSettings.espaceWebhook) {
            console.warn('未配置eSpace Webhook地址');
            return;
        }

        try {
            const response = await fetch(this.notificationSettings.espaceWebhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    msgtype: 'text',
                    text: {
                        content: `【${title}】\n${body}\n\n时间：${new Date().toLocaleString('zh-CN')}`
                    }
                })
            });

            if (!response.ok) {
                console.error('eSpace通知发送失败:', response.statusText);
            }
        } catch (error) {
            console.error('eSpace通知发送异常:', error);
        }
    }

    // 更新通知设置
    updateNotificationSettings(settings) {
        this.notificationSettings = { ...this.notificationSettings, ...settings };
        this.saveNotificationSettings();

        // 重新初始化通知系统
        this.initNotificationSystem();
    }

    // 手动触发通知检查（用于测试）
    testNotification() {
        const uncompletedCheckins = this.getUncompletedCheckins();
        const uncompletedCalendarTasks = this.getUncompletedCalendarTasks();

        if (uncompletedCheckins.length > 0 || uncompletedCalendarTasks.length > 0) {
            this.sendNotification(uncompletedCheckins, uncompletedCalendarTasks);
            return true;
        } else {
            alert('所有任务已完成！');
            return false;
        }
    }

    // 打开通知设置模态框
    openNotificationModal() {
        const modal = document.getElementById('notificationModal');

        // 填充当前设置
        document.getElementById('notificationEnabled').checked = this.notificationSettings.enabled;
        document.getElementById('checkTime').value = this.notificationSettings.checkTime;
        document.getElementById('browserNotification').checked = this.notificationSettings.browserNotification;
        document.getElementById('espaceNotification').checked = this.notificationSettings.espaceNotification;
        document.getElementById('espaceWebhook').value = this.notificationSettings.espaceWebhook;

        modal.classList.add('active');
    }

    // 关闭通知设置模态框
    closeNotificationModal() {
        const modal = document.getElementById('notificationModal');
        modal.classList.remove('active');
    }

    // 从表单保存通知设置
    saveNotificationSettingsFromForm() {
        const settings = {
            enabled: document.getElementById('notificationEnabled').checked,
            checkTime: document.getElementById('checkTime').value,
            browserNotification: document.getElementById('browserNotification').checked,
            espaceNotification: document.getElementById('espaceNotification').checked,
            espaceWebhook: document.getElementById('espaceWebhook').value.trim()
        };

        this.updateNotificationSettings(settings);
        this.closeNotificationModal();

        // 显示保存成功提示
        alert('通知设置已保存！');
    }

    // ========================================
    // 导入导出相关方法
    // ========================================

    // 打开导出格式选择模态框
    openExportFormatModal() {
        document.getElementById('exportFormatModal').classList.add('active');
    }

    // 关闭导出格式选择模态框
    closeExportFormatModal() {
        document.getElementById('exportFormatModal').classList.remove('active');
    }

    // 导出数据为JSON格式
    exportDataAsJson() {
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            calendarTasks: this.tasks,
            checkinTasks: this.checkins,
            notificationSettings: this.notificationSettings
        };

        // 创建Blob对象
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });

        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // 生成文件名（包含日期）
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        a.download = `日历记事数据_${dateStr}.json`;

        // 触发下载
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 显示成功提示
        const taskCount = this.tasks.length;
        const checkinCount = this.checkins.length;
        alert(`导出成功！\n\n包含：\n- ${taskCount} 个日历任务\n- ${checkinCount} 个打卡任务\n- 通知设置`);
    }

    // 导出数据为Excel格式
    async exportDataAsExcel() {
        // 加载SheetJS库
        const loaded = await this.loadXLSX();
        if (!loaded) {
            return;
        }

        // 创建工作簿
        const wb = XLSX.utils.book_new();

        // 准备日历任务数据
        const calendarTasksData = this.tasks.map(task => ({
            '任务标题': task.title,
            '描述': task.description || '',
            '开始日期': task.startDate,
            '开始时间': task.startTime || '',
            '结束日期': task.endDate,
            '结束时间': task.endTime || '',
            '优先级': task.priority === 'high' ? '高' : (task.priority === 'medium' ? '中' : '低'),
            '分类': task.category === 'work' ? '工作' : (task.category === 'personal' ? '个人' : (task.category === 'study' ? '学习' : '其他')),
            '状态': task.status === 'completed' ? '已完成' : (task.status === 'in-progress' ? '进行中' : '待处理'),
            '进度(%)': task.progress || 0,
            '创建时间': new Date(task.createdAt).toLocaleString('zh-CN'),
            '更新时间': new Date(task.updatedAt).toLocaleString('zh-CN')
        }));

        // 准备打卡任务数据
        const checkinTasksData = this.checkins.map(checkin => ({
            '任务名称': checkin.title,
            '图标': checkin.icon,
            '打卡记录': checkin.records.join(', '),
            '打卡次数': checkin.records.length,
            '创建时间': new Date(checkin.createdAt).toLocaleString('zh-CN')
        }));

        // 创建工作表
        const ws1 = XLSX.utils.json_to_sheet(calendarTasksData);
        const ws2 = XLSX.utils.json_to_sheet(checkinTasksData);

        // 设置列宽
        ws1['!cols'] = [
            { wch: 20 }, { wch: 30 }, { wch: 12 }, { wch: 10 },
            { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 8 },
            { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 20 }
        ];
        ws2['!cols'] = [
            { wch: 20 }, { wch: 8 }, { wch: 50 }, { wch: 10 }, { wch: 20 }
        ];

        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws1, '日历任务');
        XLSX.utils.book_append_sheet(wb, ws2, '打卡任务');

        // 生成文件名
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
        const filename = `日历记事数据_${dateStr}.xlsx`;

        // 导出文件
        XLSX.writeFile(wb, filename);

        // 显示成功提示
        const taskCount = this.tasks.length;
        const checkinCount = this.checkins.length;
        alert(`导出成功！\n\n包含：\n- ${taskCount} 个日历任务\n- ${checkinCount} 个打卡任务`);
    }

    // 导入数据
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        // 判断文件类型
        const fileExt = file.name.split('.').pop().toLowerCase();

        if (fileExt === 'json') {
            this.importFromJson(file, event);
        } else if (fileExt === 'xlsx' || fileExt === 'xls') {
            this.importFromExcel(file, event);
        } else {
            alert('不支持的文件格式！\n请选择 .json、.xlsx 或 .xls 文件。');
            event.target.value = '';
        }
    }

    // 从JSON导入
    importFromJson(file, event) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);

                // 验证数据格式
                if (!importData.version || !importData.calendarTasks || !importData.checkinTasks) {
                    throw new Error('无效的数据格式');
                }

                // 确认导入
                const taskCount = importData.calendarTasks.length;
                const checkinCount = importData.checkinTasks.length;
                const confirmMsg = `确定要导入以下数据吗？\n\n` +
                    `导入文件：${file.name}\n` +
                    `导出时间：${new Date(importData.exportDate).toLocaleString('zh-CN')}\n\n` +
                    `包含：\n` +
                    `- ${taskCount} 个日历任务\n` +
                    `- ${checkinCount} 个打卡任务\n\n` +
                    `⚠️ 注意：这将覆盖当前所有数据！`;

                if (!confirm(confirmMsg)) {
                    event.target.value = '';
                    return;
                }

                // 导入数据
                this.tasks = importData.calendarTasks;
                this.checkins = importData.checkinTasks;

                if (importData.notificationSettings) {
                    this.notificationSettings = importData.notificationSettings;
                    this.saveNotificationSettings();
                }

                this.saveTasks();
                this.saveCheckins();
                this.refreshAfterImport();

                alert('导入成功！所有数据已更新。');

            } catch (error) {
                console.error('导入失败:', error);
                alert(`导入失败：${error.message}\n\n请确保文件格式正确。`);
            }

            event.target.value = '';
        };

        reader.onerror = () => {
            alert('文件读取失败，请重试。');
            event.target.value = '';
        };

        reader.readAsText(file);
    }

    // 从Excel导入
    async importFromExcel(file, event) {
        // 加载SheetJS库
        const loaded = await this.loadXLSX();
        if (!loaded) {
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // 读取日历任务
                let calendarTasks = [];
                if (workbook.SheetNames.includes('日历任务')) {
                    const ws = workbook.Sheets['日历任务'];
                    const jsonData = XLSX.utils.sheet_to_json(ws);

                    calendarTasks = jsonData.map(row => ({
                        id: this.generateId(),
                        title: row['任务标题'] || '',
                        description: row['描述'] || '',
                        startDate: row['开始日期'] || '',
                        startTime: row['开始时间'] || '',
                        endDate: row['结束日期'] || '',
                        endTime: row['结束时间'] || '',
                        priority: row['优先级'] === '高' ? 'high' : (row['优先级'] === '中' ? 'medium' : 'low'),
                        category: row['分类'] === '工作' ? 'work' : (row['分类'] === '个人' ? 'personal' : (row['分类'] === '学习' ? 'study' : 'other')),
                        status: row['状态'] === '已完成' ? 'completed' : (row['状态'] === '进行中' ? 'in-progress' : 'pending'),
                        progress: parseInt(row['进度(%)']) || 0,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }));
                }

                // 读取打卡任务
                let checkinTasks = [];
                if (workbook.SheetNames.includes('打卡任务')) {
                    const ws = workbook.Sheets['打卡任务'];
                    const jsonData = XLSX.utils.sheet_to_json(ws);

                    checkinTasks = jsonData.map(row => ({
                        id: this.generateId(),
                        title: row['任务名称'] || '',
                        icon: row['图标'] || '✓',
                        records: row['打卡记录'] ? row['打卡记录'].split(',').map(d => d.trim()) : [],
                        createdAt: new Date().toISOString()
                    }));
                }

                // 确认导入
                const confirmMsg = `确定要导入以下数据吗？\n\n` +
                    `导入文件：${file.name}\n\n` +
                    `包含：\n` +
                    `- ${calendarTasks.length} 个日历任务\n` +
                    `- ${checkinTasks.length} 个打卡任务\n\n` +
                    `⚠️ 注意：这将覆盖当前所有数据！`;

                if (!confirm(confirmMsg)) {
                    event.target.value = '';
                    return;
                }

                // 导入数据
                this.tasks = calendarTasks;
                this.checkins = checkinTasks;
                this.saveTasks();
                this.saveCheckins();
                this.refreshAfterImport();

                alert('导入成功！所有数据已更新。');

            } catch (error) {
                console.error('导入失败:', error);
                alert(`导入失败：${error.message}\n\n请确保文件格式正确。`);
            }

            event.target.value = '';
        };

        reader.onerror = () => {
            alert('文件读取失败，请重试。');
            event.target.value = '';
        };

        reader.readAsArrayBuffer(file);
    }

    // 加载SheetJS库（按需加载）
    loadXLSX() {
        return new Promise((resolve) => {
            // 如果已经加载，直接返回
            if (this.xlsxLoaded && typeof XLSX !== 'undefined') {
                resolve(true);
                return;
            }

            // 如果正在加载，等待加载完成
            if (this.xlsxLoading) {
                const checkLoaded = setInterval(() => {
                    if (this.xlsxLoaded && typeof XLSX !== 'undefined') {
                        clearInterval(checkLoaded);
                        resolve(true);
                    }
                }, 100);
                return;
            }

            // 开始加载
            this.xlsxLoading = true;

            // 显示加载提示
            const loadingMsg = alert('正在加载Excel处理模块，请稍候...');

            const script = document.createElement('script');
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
            script.async = true;

            script.onload = () => {
                this.xlsxLoaded = true;
                this.xlsxLoading = false;
                resolve(true);
            };

            script.onerror = () => {
                this.xlsxLoading = false;
                alert('Excel处理模块加载失败，请检查网络连接后重试。');
                resolve(false);
            };

            document.head.appendChild(script);
        });
    }

    // 导入后刷新界面
    refreshAfterImport() {
        this.renderCalendar();
        this.renderTaskList();
        this.updateStats();
        if (this.currentView === 'checkin') {
            this.renderCheckinPage();
        }
        this.initNotificationSystem();
    }
}

// 初始化应用
const app = new CalendarTaskApp();
