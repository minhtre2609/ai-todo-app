// ========================================
// Firebase Authentication Service
// ========================================

import { auth, db } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updatePassword,
    updateEmail,
    EmailAuthProvider,
    reauthenticateWithCredential,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class FirebaseAuthService {
    constructor() {
        this.currentUser = null;
        this.authReady = false;
        this.authReadyPromise = new Promise((resolve) => {
            this.authReadyResolver = resolve;
        });
        this.initAuthListener();
    }

    // Listen to auth state changes
    initAuthListener() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in, fetch additional data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        this.currentUser = {
                            uid: user.uid,
                            email: user.email,
                            ...userDoc.data()
                        };
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            } else {
                // User is signed out
                this.currentUser = null;
            }

            // Mark auth as ready
            if (!this.authReady) {
                this.authReady = true;
                this.authReadyResolver();
            }
        });
    }

    // Wait for auth to be ready
    async waitForAuth() {
        return this.authReadyPromise;
    }

    // Register new user
    async register(username, password, fullName, email = null) {
        try {
            // Use provided email or create from username for Firebase Auth
            const authEmail = email || `${username}@aitodo.local`;

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
            const user = userCredential.user;

            // Create user profile in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                username: username,
                fullName: fullName,
                email: email || authEmail,
                role: 'user',
                createdAt: serverTimestamp()
            });

            return {
                success: true,
                message: 'Đăng ký thành công!'
            };
        } catch (error) {
            console.error('Registration error:', error);

            let message = 'Đăng ký thất bại!';
            if (error.code === 'auth/email-already-in-use') {
                message = 'Email hoặc tên đăng nhập đã tồn tại!';
            } else if (error.code === 'auth/weak-password') {
                message = 'Mật khẩu quá yếu! Tối thiểu 6 ký tự.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Email không hợp lệ!';
            }

            return {
                success: false,
                message: message
            };
        }
    }

    // Login user
    async login(username, password) {
        try {
            console.log('🔍 Login attempt for username:', username);

            // First, find user by username to get their actual email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);

            console.log('📊 Query result - found users:', querySnapshot.size);

            if (querySnapshot.empty) {
                console.error('❌ Username not found in Firestore');
                return {
                    success: false,
                    message: 'Tên đăng nhập không tồn tại!'
                };
            }

            // Get user data
            const userDocData = querySnapshot.docs[0].data();
            const userId = querySnapshot.docs[0].id;

            console.log('✅ Found user in Firestore:', {
                userId,
                username: userDocData.username,
                email: userDocData.email
            });

            // Use the email from Firestore
            const userEmail = userDocData.email;

            console.log('🔐 Attempting Firebase Auth login with email:', userEmail);

            // Login with Firebase Auth using the email
            const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
            const user = userCredential.user;

            console.log('✅ Firebase Auth login successful');

            // Set current user
            this.currentUser = {
                uid: userId,
                email: user.email,
                ...userDocData
            };

            return {
                success: true,
                message: 'Đăng nhập thành công!',
                user: this.currentUser
            };
        } catch (error) {
            console.error('❌ Login error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            let message = 'Đăng nhập thất bại!';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'Tên đăng nhập hoặc mật khẩu không đúng!';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Quá nhiều lần thử. Vui lòng thử lại sau!';
            }

            return {
                success: false,
                message: message
            };
        }
    }

    // Logout user
    async logout() {
        try {
            await signOut(auth);
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false };
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Check if user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    // Require authentication
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
        }
    }

    // Require admin
    requireAdmin() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
        } else if (!this.isAdmin()) {
            alert('Bạn không có quyền truy cập trang này!');
            window.location.href = 'index.html';
        }
    }

    // Get user statistics
    async getUserStats() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return {
                totalTasks: 0,
                completedTasks: 0,
                pendingTasks: 0,
                completionRate: 0
            };
        }

        try {
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('userId', '==', currentUser.uid)
            );
            const tasksSnapshot = await getDocs(tasksQuery);

            const tasks = tasksSnapshot.docs.map(doc => doc.data());
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(t => t.completed).length;
            const pendingTasks = totalTasks - completedTasks;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return {
                totalTasks,
                completedTasks,
                pendingTasks,
                completionRate
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return {
                totalTasks: 0,
                completedTasks: 0,
                pendingTasks: 0,
                completionRate: 0
            };
        }
    }

    // Check if username is available
    async checkUsernameAvailable(username, excludeCurrentUser = true) {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return { available: true };
            }

            if (excludeCurrentUser && this.currentUser) {
                const doc = querySnapshot.docs[0];
                if (doc.id === this.currentUser.uid) {
                    return { available: true };
                }
            }

            return { available: false, message: 'Username đã được sử dụng!' };
        } catch (error) {
            console.error('Error checking username:', error);
            return { available: false, message: 'Lỗi kiểm tra username!' };
        }
    }

    // Update user email
    async updateUserEmail(newEmail, currentPassword) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return {
                success: false,
                message: 'Bạn chưa đăng nhập!'
            };
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    message: 'Không tìm thấy user!'
                };
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newEmail)) {
                return {
                    success: false,
                    message: 'Email không hợp lệ!'
                };
            }

            // Re-authenticate
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            try {
                await reauthenticateWithCredential(user, credential);
            } catch (error) {
                console.error('Re-authentication failed:', error);
                return {
                    success: false,
                    message: 'Mật khẩu không đúng!'
                };
            }

            // Update email in Firebase Auth
            await updateEmail(user, newEmail);

            // Update email in Firestore
            await updateDoc(doc(db, 'users', currentUser.uid), {
                email: newEmail
            });

            this.currentUser.email = newEmail;

            return {
                success: true,
                message: 'Đổi email thành công! Vui lòng đăng nhập lại.'
            };
        } catch (error) {
            console.error('Update email error:', error);

            let message = 'Đổi email thất bại!';
            if (error.code === 'auth/email-already-in-use') {
                message = 'Email đã được sử dụng bởi tài khoản khác!';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Email không hợp lệ!';
            } else if (error.code === 'auth/requires-recent-login') {
                message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
            }

            return {
                success: false,
                message: message
            };
        }
    }

    // Update username
    async updateUsername(newUsername, currentPassword) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return {
                success: false,
                message: 'Bạn chưa đăng nhập!'
            };
        }

        try {
            // Validate username format
            const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
            if (!usernameRegex.test(newUsername)) {
                return {
                    success: false,
                    message: 'Username phải từ 3-20 ký tự, chỉ chứa chữ, số và _'
                };
            }

            // Check if username is available
            const availabilityCheck = await this.checkUsernameAvailable(newUsername, true);
            if (!availabilityCheck.available) {
                return {
                    success: false,
                    message: availabilityCheck.message
                };
            }

            const user = auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    message: 'Không tìm thấy user!'
                };
            }

            // Re-authenticate
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            try {
                await reauthenticateWithCredential(user, credential);
            } catch (error) {
                console.error('Re-authentication failed:', error);
                return {
                    success: false,
                    message: 'Mật khẩu không đúng!'
                };
            }

            // Update username in Firestore
            await updateDoc(doc(db, 'users', currentUser.uid), {
                username: newUsername
            });

            // Update Firebase Auth email to new username@aitodo.local
            const newEmail = `${newUsername}@aitodo.local`;
            await updateEmail(user, newEmail);

            // Update Firestore email
            await updateDoc(doc(db, 'users', currentUser.uid), {
                email: newEmail
            });

            this.currentUser.username = newUsername;
            this.currentUser.email = newEmail;

            return {
                success: true,
                message: 'Đổi username thành công! Vui lòng đăng nhập lại với username mới.'
            };
        } catch (error) {
            console.error('Update username error:', error);

            let message = 'Đổi username thất bại!';
            if (error.code === 'auth/email-already-in-use') {
                message = 'Username đã được sử dụng!';
            } else if (error.code === 'auth/requires-recent-login') {
                message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
            }

            return {
                success: false,
                message: message
            };
        }
    }

    // Change password
    async changePassword(oldPassword, newPassword) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) {
            return {
                success: false,
                message: 'Bạn chưa đăng nhập!'
            };
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    message: 'Không tìm thấy user!'
                };
            }

            // Re-authenticate with old password
            const email = currentUser.email;
            const credential = EmailAuthProvider.credential(email, oldPassword);

            try {
                await reauthenticateWithCredential(user, credential);
            } catch (error) {
                console.error('Re-authentication failed:', error);
                return {
                    success: false,
                    message: 'Mật khẩu hiện tại không đúng!'
                };
            }

            // Update password
            await updatePassword(user, newPassword);

            return {
                success: true,
                message: 'Đổi mật khẩu thành công!'
            };
        } catch (error) {
            console.error('Change password error:', error);

            let message = 'Đổi mật khẩu thất bại!';
            if (error.code === 'auth/weak-password') {
                message = 'Mật khẩu quá yếu! Tối thiểu 6 ký tự.';
            } else if (error.code === 'auth/requires-recent-login') {
                message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!';
            }

            return {
                success: false,
                message: message
            };
        }
    }

    // Reset password (Forgot password)
    async resetPassword(username) {
        try {
            console.log('🔄 Reset password attempt for username:', username);

            // Find user by username to get their email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);

            console.log('📊 User query result:', querySnapshot.size);

            if (querySnapshot.empty) {
                console.error('❌ Username not found');
                return {
                    success: false,
                    message: 'Tên đăng nhập không tồn tại!'
                };
            }

            const userData = querySnapshot.docs[0].data();
            const userEmail = userData.email;

            console.log('📧 User email found:', userEmail);
            console.log('🔍 Email validation:', {
                email: userEmail,
                endsWithAitodo: userEmail.endsWith('@aitodo.local')
            });

            // Check if email is a real email or @aitodo.local
            if (userEmail.endsWith('@aitodo.local')) {
                console.warn('⚠️ Email is @aitodo.local - cannot reset');
                return {
                    success: false,
                    message: 'Tài khoản này không có email thật. Vui lòng liên hệ admin để reset mật khẩu!'
                };
            }

            console.log('📨 Sending reset email to:', userEmail);

            // Send password reset email
            await sendPasswordResetEmail(auth, userEmail);

            console.log('✅ Reset email sent successfully');

            return {
                success: true,
                message: `Email reset mật khẩu đã được gửi đến ${userEmail}. Vui lòng kiểm tra hộp thư!`
            };
        } catch (error) {
            console.error('❌ Reset password error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            let message = 'Gửi email reset thất bại!';
            if (error.code === 'auth/user-not-found') {
                message = 'Không tìm thấy tài khoản!';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau!';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Email không hợp lệ!';
            }

            return {
                success: false,
                message: message + ` (${error.code})`
            };
        }
    }

    // Get all users with stats (admin only)
    async getAllUsersWithStats() {
        if (!this.isAdmin()) {
            return [];
        }

        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersWithStats = [];

            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();

                // Get user's tasks
                const tasksQuery = query(
                    collection(db, 'tasks'),
                    where('userId', '==', userDoc.id)
                );
                const tasksSnapshot = await getDocs(tasksQuery);

                const tasks = tasksSnapshot.docs.map(doc => doc.data());
                const totalTasks = tasks.length;
                const completedTasks = tasks.filter(t => t.completed).length;
                const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                usersWithStats.push({
                    uid: userDoc.id,
                    username: userData.username,
                    fullName: userData.fullName,
                    email: userData.email,
                    role: userData.role,
                    createdAt: userData.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
                    stats: {
                        totalTasks,
                        completedTasks,
                        completionRate
                    }
                });
            }

            return usersWithStats;
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

    // Delete user (admin only)
    async deleteUser(username) {
        if (!this.isAdmin()) {
            return {
                success: false,
                message: 'Bạn không có quyền thực hiện thao tác này!'
            };
        }

        try {
            // Find user by username
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return {
                    success: false,
                    message: 'Không tìm thấy user!'
                };
            }

            const userId = querySnapshot.docs[0].id;

            // Delete user's tasks
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('userId', '==', userId)
            );
            const tasksSnapshot = await getDocs(tasksQuery);
            const deletePromises = tasksSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // Delete user profile
            await deleteDoc(doc(db, 'users', userId));

            return {
                success: true,
                message: 'Xóa user thành công!'
            };
        } catch (error) {
            console.error('Delete user error:', error);
            return {
                success: false,
                message: 'Xóa user thất bại!'
            };
        }
    }
}

// Create and export singleton instance
const authService = new FirebaseAuthService();
export default authService;
