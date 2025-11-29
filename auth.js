// =======================================
// Authentication Service
// =======================================

class AuthService {
    constructor() {
        this.USERS_KEY = 'ai-todo-users';
        this.SESSION_KEY = 'ai-todo-session';
        this.initializeAdmin();
    }

    // Initialize admin account if not exists
    initializeAdmin() {
        let users = this.getUsers();

        // Check if admin exists
        const adminExists = users.some(user => user.username === 'admin');

        if (!adminExists) {
            const adminUser = {
                username: 'admin',
                password: 'admin123', // In production, this should be hashed
                fullName: 'Administrator',
                role: 'admin',
                createdAt: new Date().toISOString()
            };
            users.push(adminUser);
            this.saveUsers(users);
        }
    }

    // Get all users from localStorage
    getUsers() {
        const usersJson = localStorage.getItem(this.USERS_KEY);
        return usersJson ? JSON.parse(usersJson) : [];
    }

    // Save users to localStorage
    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }

    // Register new user
    register(username, password, fullName) {
        // Validation
        if (!username || !password || !fullName) {
            return { success: false, message: 'Vui lòng điền đầy đủ thông tin' };
        }

        if (username.length < 3) {
            return { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' };
        }

        if (password.length < 6) {
            return { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
        }

        const users = this.getUsers();

        // Check if username already exists
        if (users.some(user => user.username === username)) {
            return { success: false, message: 'Tên đăng nhập đã tồn tại' };
        }

        // Create new user
        const newUser = {
            username: username.trim(),
            password: password, // In production, hash this
            fullName: fullName.trim(),
            role: 'user',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);

        return { success: true, message: 'Đăng ký thành công!' };
    }

    // Login user
    login(username, password) {
        if (!username || !password) {
            return { success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' };
        }

        const users = this.getUsers();
        const user = users.find(u => u.username === username && u.password === password);

        if (!user) {
            return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng' };
        }

        // Create session
        const session = {
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            loginAt: new Date().toISOString()
        };

        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

        return { success: true, message: 'Đăng nhập thành công!', user: session };
    }

    // Logout user
    logout() {
        sessionStorage.removeItem(this.SESSION_KEY);
    }

    // Get current session
    getCurrentUser() {
        const sessionJson = sessionStorage.getItem(this.SESSION_KEY);
        return sessionJson ? JSON.parse(sessionJson) : null;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    // Check if current user is admin
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }

    // Require authentication (redirect to login if not logged in)
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Require admin access
    requireAdmin() {
        if (!this.requireAuth()) return false;

        if (!this.isAdmin()) {
            alert('Bạn không có quyền truy cập trang này!');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Delete user (admin only)
    deleteUser(username) {
        if (!this.isAdmin()) {
            return { success: false, message: 'Không có quyền thực hiện' };
        }

        if (username === 'admin') {
            return { success: false, message: 'Không thể xóa tài khoản admin' };
        }

        let users = this.getUsers();
        const initialLength = users.length;
        users = users.filter(u => u.username !== username);

        if (users.length === initialLength) {
            return { success: false, message: 'Không tìm thấy người dùng' };
        }

        this.saveUsers(users);

        // Also delete user's tasks
        localStorage.removeItem(`tasks_${username}`);

        return { success: true, message: 'Đã xóa người dùng thành công' };
    }

    // Get user statistics
    getUserStats(username) {
        const tasksKey = `tasks_${username}`;
        const tasksJson = localStorage.getItem(tasksKey);
        const tasks = tasksJson ? JSON.parse(tasksJson) : [];

        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            totalTasks: total,
            completedTasks: completed,
            completionRate: completionRate
        };
    }

    // Get all users with statistics
    getAllUsersWithStats() {
        const users = this.getUsers();
        return users.map(user => ({
            ...user,
            stats: this.getUserStats(user.username)
        }));
    }
}

// Create global auth service instance
const authService = new AuthService();
