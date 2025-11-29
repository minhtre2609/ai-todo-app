# Firebase Setup Guide

## Bước 1: Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" hoặc "Create a project"
3. Nhập tên project (vd: `ai-todo-app`)
4. Disable Google Analytics (không cần thiết)  
5. Click "Create project"

## Bước 2: Kích hoạt Authentication

1. Trong Firebase Console, vào **Authentication**
2. Click "Get started"
3. Chọn **Email/Password** ở tab "Sign-in method"
4. Enable "Email/Password"
5. Click "Save"

## Bước 3: Tạo Firestore Database

1. Trong Firebase Console, vào **Firestore Database**
2. Click "Create database"
3. Chọn **Start in production mode**
4. Chọn location gần nhất (vd: `asia-southeast1`)
5. Click "Enable"

## Bước 4: Lấy Firebase Config

1. Trong Firebase Console, click ⚙️ **Project Settings**
2. Scroll xuống phần "Your apps"
3. Click icon **</>** (Web)
4. Nhập  app nickname (vd: `AI Todo Web`)
5. **KHÔNG** check "Also set up Firebase Hosting"
6. Click "Register app"
7. Copy đoạn config code

## Bước 5: Cập nhật firebase-config.js

Mở file `firebase-config.js` và thay thế phần config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",           // Thay bằng giá trị thực
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## Bước 6: Deploy Firestore Rules

1. Cài đặt Firebase CLI (nếu có Node.js):
   ```bash
   npm install -g firebase-tools
   ```

2. Login vào Firebase:
   ```bash
   firebase login
   ```

3. Init project trong thư mục app:
   ```bash
   cd ai-todo-app
   firebase init
   ```
   - Chọn: Firestore, Hosting
   - Chọn existing project
   - Firestore rules: `firestore.rules`
   - Firestore indexes: `firestore.indexes.json`
   - Public directory: `.` (current directory)
   - Single-page app: `No`

4. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Bước 7: Tạo Admin Account

Sau khi deploy app, user đầu tiên đăng ký sẽ cần được set làm admin thủ công:

1. Đăng ký tài khoản admin qua web
2. Vào Firestore Database trong Console
3. Tìm document của user vừa tạo trong collection `users`
4. Edit field `role` từ `user` thành `admin`
5. Save

## Bước 8: Test Local (Không bắt buộc)

Nếu muốn test local trước khi deploy:

```bash
firebase emulators:start
```

Truy cập: `http://localhost:5000`

## Bước 9: Deploy lên Web

```bash
firebase deploy
```

Sau khi deploy xong, Firebase sẽ cho URL dạng:
`https://your-project.firebaseapp.com`

## Lưu ý

- ⚠️ **KHÔNG** commit file `.env` hoặc credentials lên Git
- 🔐 Firebase API Key có thể public (đã được bảo vệ bởi Firestore Rules)
- 📊 Firestore có quota miễn phí: 50K reads/day, 20K writes/day
- 🔄 Nếu cần migrate dữ liệu localStorage, phải làm thủ công

## Troubleshooting

**Lỗi: "Firebase not defined"**
- Kiểm tra đã import firebase-config.js trong HTML chưa

**Lỗi: "Permission denied"**
- Kiểm tra Firestore rules đã deploy chưa
- Kiểm tra user đã authenticated chưa

**Lỗi khi deploy:**
- Đảm bảo đã `firebase login`
- Đảm bảo đã `firebase init` đúng project
