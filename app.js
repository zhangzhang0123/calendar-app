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

        this.init();
    }

    // 初始化应用
    init() {
        this.bindEvents();
        this.renderCalendar();
        this.updateStats();
        this.setDefaultDate();
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

        // 进度滑块实时更新
        document.getElementById('taskProgressSlider').addEventListener('input', (e) => {
            document.getElementById('taskProgressValue').textContent = `${e.target.value}%`;
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
    }

    // 设置默认日期为今天
    setDefaultDate() {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        document.getElementById('taskStartDate').value = dateStr;
        document.getElementById('taskEndDate').value = dateStr;
        document.getElementById('taskProgressSlider').value = 0;
        document.getElementById('taskProgressValue').textContent = '0%';
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
        document.getElementById('taskProgressSlider').value = task.progress || 0;
        document.getElementById('taskProgressValue').textContent = `${task.progress || 0}%`;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskCategory').value = task.category;
    }

    // 保存任务
    saveTask() {
        const progress = parseInt(document.getElementById('taskProgressSlider').value);
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
            status: progress === 100 ? 'completed' : (progress > 0 ? 'in-progress' : 'pending'),
            progress: progress,
            status: 'pending',
            progress: 0,
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
            task.updatedAt = new Date().toISOString();
            this.saveTasks();
            this.renderCalendar();
            this.renderTaskList();
            this.updateStats();
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

                // 显示最多3个任务
                const maxTasks = 3;
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

                    // 进度条
                    const progressBar = document.createElement('div');
                    progressBar.className = 'mini-progress-bar';
                    const progressFill = document.createElement('div');
                    progressFill.className = 'mini-progress-fill';
                    progressFill.style.width = `${task.progress}%`;
                    progressBar.appendChild(progressFill);

                    // 进度百分比
                    const progressText = document.createElement('span');
                    progressText.className = 'progress-text';
                    progressText.textContent = `${task.progress}%`;

                    taskContent.appendChild(taskTitle);
                    taskContent.appendChild(progressBar);
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
        const tasks = this.getTasksByDate(dateStr);
        if (tasks.length === 0) {
            // 如果没有任务，打开添加任务模态框并设置日期
            document.getElementById('taskStartDate').value = dateStr;
            document.getElementById('taskEndDate').value = dateStr;
            this.openTaskModal();
        } else if (tasks.length === 1) {
            // 如果只有一个任务，显示详情
            this.showTaskDetail(tasks[0].id);
        } else {
            // 如果有多个任务，切换到列表视图并筛选
            this.currentFilter = 'all';
            this.switchView('list');
            // 滚动到对应任务
            setTimeout(() => {
                const taskElement = document.querySelector(`[data-task-id="${tasks[0].id}"]`);
                if (taskElement) {
                    taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
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

        // 按开始日期排序
        return filtered.sort((a, b) => {
            if (a.startDate !== b.startDate) {
                return a.startDate.localeCompare(b.startDate);
            }
            return (a.startTime || '').localeCompare(b.startTime || '');
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
                    <span class="task-category ${task.category}">${categoryNames[task.category]}</span>
                    <span class="status-badge ${isOverdue ? 'overdue' : task.status}">
                        ${isOverdue ? '已逾期' : statusNames[task.status]}
                    </span>
                </div>
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
                <h3>进度</h3>
                <div class="detail-content">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${task.progress}%"></div>
                    </div>
                    <p style="margin-top: 8px;">${task.progress}%</p>
                </div>
            </div>

            <div class="detail-section">
                <h3>更新进度</h3>
                <div class="detail-content">
                    <input type="range" min="0" max="100" value="${task.progress}"
                           class="progress-slider" id="progressSlider"
                           style="width: 100%; margin-bottom: 8px;">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn-secondary" onclick="app.updateTaskProgress('${task.id}', 0)">重置</button>
                        <button class="btn-secondary" onclick="app.updateTaskProgress('${task.id}', 25)">25%</button>
                        <button class="btn-secondary" onclick="app.updateTaskProgress('${task.id}', 50)">50%</button>
                        <button class="btn-secondary" onclick="app.updateTaskProgress('${task.id}', 75)">75%</button>
                        <button class="btn-primary" onclick="app.updateTaskProgress('${task.id}', 100)">完成</button>
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
        slider.addEventListener('input', (e) => {
            this.updateTaskProgress(taskId, e.target.value);
        });

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

        if (!title) return;

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
        this.renderCheckinList();
    }

    // 删除打卡任务
    deleteCheckin(checkinId) {
        if (confirm('确定要删除这个打卡任务吗？')) {
            this.checkins = this.checkins.filter(c => c.id !== checkinId);
            this.saveCheckins();
            this.renderCheckinList();
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
}

// 初始化应用
const app = new CalendarTaskApp();
