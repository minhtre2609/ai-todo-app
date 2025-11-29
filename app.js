// =======================================
// AI Smart To-Do List - Application Logic
// =======================================

class AITodoApp {
    constructor() {
        // Get current user for user-specific storage
        this.currentUser = authService.getCurrentUser();
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        this.tasks = this.loadTasks();
        this.currentDate = new Date();
        this.init();
    }

    // Initialize the application
    init() {
        this.setupEventListeners();
        this.renderTasks();
        this.updateAnalysis();
    }

    // Setup event listeners
    setupEventListeners() {
        const form = document.getElementById('taskForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });
    }

    // AI: Analyze task and determine priority & urgency
    analyzeTask(title, deadline, manualPriority) {
        const analysis = {
            urgencyScore: 0,
            importanceScore: 0,
            category: '',
            estimatedTime: 0,
            priority: 'low'
        };

        const lowerTitle = title.toLowerCase();

        // Detect urgency keywords
        const urgencyKeywords = {
            critical: ['asap', 'urgent', 'khẩn cấp', 'gấp', 'ngay', 'immediately', 'critical', 'emergency'],
            high: ['today', 'hôm nay', 'deadline', 'hạn chót', 'important', 'quan trọng'],
            medium: ['soon', 'sớm', 'this week', 'tuần này'],
            low: ['later', 'sau', 'someday', 'when possible']
        };

        // Detect importance keywords
        const importanceKeywords = {
            critical: ['critical', 'vital', 'essential', 'must', 'phải', 'cực kỳ', 'sếp', 'boss', 'client', 'khách hàng'],
            high: ['important', 'quan trọng', 'significant', 'key', 'major', 'presentation', 'thuyết trình', 'meeting', 'họp'],
            medium: ['should', 'nên', 'review', 'check', 'update', 'cập nhật'],
            low: ['nice to have', 'optional', 'tùy chọn', 'if time allows']
        };

        // Calculate urgency score
        for (const [level, keywords] of Object.entries(urgencyKeywords)) {
            if (keywords.some(keyword => lowerTitle.includes(keyword))) {
                if (level === 'critical') analysis.urgencyScore = 4;
                else if (level === 'high') analysis.urgencyScore = 3;
                else if (level === 'medium') analysis.urgencyScore = 2;
                else analysis.urgencyScore = 1;
                break;
            }
        }

        // Calculate importance score
        for (const [level, keywords] of Object.entries(importanceKeywords)) {
            if (keywords.some(keyword => lowerTitle.includes(keyword))) {
                if (level === 'critical') analysis.importanceScore = 4;
                else if (level === 'high') analysis.importanceScore = 3;
                else if (level === 'medium') analysis.importanceScore = 2;
                else analysis.importanceScore = 1;
                break;
            }
        }

        // Deadline affects urgency
        if (deadline === 'today') {
            analysis.urgencyScore = Math.max(analysis.urgencyScore, 4);
        } else if (deadline === 'tomorrow') {
            analysis.urgencyScore = Math.max(analysis.urgencyScore, 3);
        } else if (deadline === 'this-week') {
            analysis.urgencyScore = Math.max(analysis.urgencyScore, 2);
        }

        // Manual priority override
        if (manualPriority) {
            if (manualPriority === 'critical') analysis.importanceScore = 4;
            else if (manualPriority === 'high') analysis.importanceScore = 3;
            else if (manualPriority === 'medium') analysis.importanceScore = 2;
            else analysis.importanceScore = 1;
        }

        // Default scores ifnone detected
        if (analysis.urgencyScore === 0) analysis.urgencyScore = 2;
        if (analysis.importanceScore === 0) analysis.importanceScore = 2;

        // Eisenhower Matrix categorization
        if (analysis.urgencyScore >= 3 && analysis.importanceScore >= 3) {
            analysis.category = 'Do First';
            analysis.priority = 'critical';
            analysis.estimatedTime = 90; // 1.5 hours
        } else if (analysis.urgencyScore < 3 && analysis.importanceScore >= 3) {
            analysis.category = 'Schedule';
            analysis.priority = 'high';
            analysis.estimatedTime = 60; // 1 hour
        } else if (analysis.urgencyScore >= 3 && analysis.importanceScore < 3) {
            analysis.category = 'Delegate';
            analysis.priority = 'medium';
            analysis.estimatedTime = 30; // 30 minutes
        } else {
            analysis.category = 'Eliminate';
            analysis.priority = 'low';
            analysis.estimatedTime = 20; // 20 minutes
        }

        // Estimate time based on task complexity (word count)
        const wordCount = title.split(' ').length;
        if (wordCount > 10) {
            analysis.estimatedTime *= 1.5;
        }

        return analysis;
    }

    // Add new task
    addTask() {
        const titleInput = document.getElementById('taskTitle');
        const deadlineInput = document.getElementById('taskDeadline');
        const priorityInput = document.getElementById('taskManualPriority');

        const title = titleInput.value.trim();
        const deadline = deadlineInput.value;
        const manualPriority = priorityInput.value;

        if (!title) return;

        // AI Analysis
        const analysis = this.analyzeTask(title, deadline, manualPriority);

        const task = {
            id: Date.now(),
            title: title,
            deadline: deadline,
            manualPriority: manualPriority,
            urgencyScore: analysis.urgencyScore,
            importanceScore: analysis.importanceScore,
            category: analysis.category,
            priority: analysis.priority,
            estimatedTime: Math.round(analysis.estimatedTime),
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateAnalysis();

        // Reset form
        titleInput.value = '';
        deadlineInput.value = '';
        priorityInput.value = '';

        // Show success animation
        this.showNotification('✅ Công việc đã được thêm và phân tích!');
    }

    // Toggle task completion
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
            this.updateAnalysis();
        }
    }

    // Delete task
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateAnalysis();
        this.showNotification('🗑️ Công việc đã được xóa');
    }

    // Render tasks
    renderTasks() {
        const container = document.getElementById('tasksContainer');

        if (this.tasks.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>Chưa có công việc nào. Hãy thêm công việc đầu tiên!</p>
        </div>
      `;
            return;
        }

        // Sort tasks by priority (critical > high > medium > low) and then by urgency
        const sortedTasks = [...this.tasks].sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return b.urgencyScore - a.urgencyScore;
        });

        container.innerHTML = sortedTasks.map(task => `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-header">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            ${task.completed ? 'checked' : ''}
            onchange="app.toggleTask(${task.id})"
          >
          <div class="task-content">
            <div class="task-title">${this.escapeHtml(task.title)}</div>
            <div class="task-meta">
              <span class="badge badge-priority ${task.priority}">
                ${this.getPriorityIcon(task.priority)} ${task.priority.toUpperCase()}
              </span>
              <span class="badge badge-category">
                ${task.category}
              </span>
              <span class="badge badge-time">
                ⏱️ ${task.estimatedTime} phút
              </span>
              ${task.deadline ? `
                <span class="badge badge-time">
                  📅 ${this.getDeadlineText(task.deadline)}
                </span>
              ` : ''}
            </div>
          </div>
          <div class="task-actions">
            <button class="btn-icon delete" onclick="app.deleteTask(${task.id})" title="Xóa">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `).join('');
    }

    // Update analysis and statistics
    updateAnalysis() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const totalEstimatedTime = this.tasks
            .filter(t => !t.completed)
            .reduce((sum, task) => sum + task.estimatedTime, 0);

        // Update stats
        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('completionRate').textContent = completionRate + '%';
        document.getElementById('estimatedTime').textContent = (totalEstimatedTime / 60).toFixed(1) + 'h';
        document.getElementById('progressFill').style.width = completionRate + '%';

        // Generate AI insights
        const insights = this.generateInsights();
        const analysisList = document.getElementById('analysisList');

        if (insights.length > 0) {
            analysisList.innerHTML = insights.map(insight => `<li>${insight}</li>`).join('');
        } else {
            analysisList.innerHTML = '<li>Bắt đầu thêm công việc để nhận được phân tích từ AI</li>';
        }
    }

    // AI: Generate insights and recommendations
    generateInsights() {
        const insights = [];
        const pending = this.tasks.filter(t => !t.completed);
        const completed = this.tasks.filter(t => t.completed);

        if (this.tasks.length === 0) return insights;

        // Priority distribution analysis
        const criticalTasks = pending.filter(t => t.priority === 'critical');
        const highTasks = pending.filter(t => t.priority === 'high');

        if (criticalTasks.length > 0) {
            insights.push(`⚠️ Bạn có ${criticalTasks.length} công việc CỰC KỲ QUAN TRỌNG và KHẨN CẤP. Hãy ưu tiên làm ngay!`);
            insights.push(`🎯 Đề xuất: Tập trung hoàn thành "${criticalTasks[0].title}" trước tiên (${criticalTasks[0].estimatedTime} phút)`);
        }

        if (highTasks.length > 3) {
            insights.push(`📌 Bạn có ${highTasks.length} công việc quan trọng cần lên lịch. Hãy sắp xếp thời gian cụ thể cho chúng.`);
        }

        // Time management
        const totalTime = pending.reduce((sum, t) => sum + t.estimatedTime, 0);
        if (totalTime > 480) { // More than 8 hours
            insights.push(`⏰ Tổng thời gian ước tính: ${(totalTime / 60).toFixed(1)} giờ. Điều này có thể không thực tế cho 1 ngày. Hãy xem xét giảm bớt hoặc lên lịch cho nhiều ngày.`);
        } else {
            insights.push(`✅ Tổng thời gian ước tính: ${(totalTime / 60).toFixed(1)} giờ. Kế hoạch hợp lý cho ngày hôm nay!`);
        }

        // Completion rate analysis
        if (completed.length > 0) {
            const rate = (completed.length / this.tasks.length) * 100;
            if (rate >= 70) {
                insights.push(`🎉 Tuyệt vời! Bạn đã hoàn thành ${rate.toFixed(0)}% công việc. Năng suất rất cao!`);
            } else if (rate >= 40) {
                insights.push(`👍 Bạn đã hoàn thành ${rate.toFixed(0)}% công việc. Tiếp tục phát huy!`);
            } else {
                insights.push(`💪 Bạn mới hoàn thành ${rate.toFixed(0)}% công việc. Hãy tập trung hơn để đạt mục tiêu!`);
            }
        }

        // Procrastination detection
        if (completed.length === 0 && this.tasks.length > 3) {
            insights.push(`🤔 Phân tích: Bạn chưa hoàn thành công việc nào. Có thể do:`);
            insights.push(`  • Quá nhiều công việc trong danh sách (${this.tasks.length} việc)`);
            insights.push(`  • Thiếu tập trung hoặc bị phân tâm`);
            insights.push(`  • Công việc quá khó - hãy chia nhỏ ra`);
        }

        // Task recommendation
        if (pending.length > 0) {
            const nextTask = pending.sort((a, b) => {
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            })[0];

            insights.push(`🚀 Công việc tiếp theo nên làm: "${nextTask.title}" (${nextTask.category})`);
        }

        // End of day analysis (after 6 PM)
        const currentHour = new Date().getHours();
        if (currentHour >= 18 && pending.length > 0) {
            insights.push(`🌙 Cuối ngày: Bạn còn ${pending.length} công việc chưa hoàn thành.`);

            if (pending.filter(t => t.priority === 'critical').length > 0) {
                insights.push(`  • ⚠️ Vẫn còn công việc QUAN TRỌNG chưa xong. Cân nhắc làm thêm hoặc đặt lịch sáng mai.`);
            }

            if (completed.length === 0) {
                insights.push(`  • 💡 Lý do có thể: Mục tiêu chưa rõ ràng, quá nhiều công việc, hoặc thiếu động lực.`);
                insights.push(`  • 📋 Đề xuất: Ngày mai hãy bắt đầu với 3 công việc quan trọng nhất.`);
            }
        }

        return insights;
    }

    // Helper: Get priority icon
    getPriorityIcon(priority) {
        const icons = {
            critical: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '🟢'
        };
        return icons[priority] || '⚪';
    }

    // Helper: Get deadline text
    getDeadlineText(deadline) {
        const texts = {
            'today': 'Hôm nay',
            'tomorrow': 'Ngày mai',
            'this-week': 'Tuần này',
            'next-week': 'Tuần sau',
            'no-deadline': 'Không có hạn'
        };
        return texts[deadline] || deadline;
    }

    // Helper: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper: Show notification
    showNotification(message) {
        // Simple console log for now; could be enhanced with toast notifications
        console.log(message);
    }

    // Save tasks to localStorage (user-specific)
    saveTasks() {
        const key = `tasks_${this.currentUser.username}`;
        localStorage.setItem(key, JSON.stringify(this.tasks));
    }

    // Load tasks from localStorage (user-specific)
    loadTasks() {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return [];

        const key = `tasks_${currentUser.username}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize app
const app = new AITodoApp();
