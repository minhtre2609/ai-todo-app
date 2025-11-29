# Firebase Migration - Quick Start Guide

## 🎯 Tóm tắt

Ứng dụng đã được chuẩn bị sẵn code Firebase. Bạn chỉ cần:
1. Tạo Firebase project
2. Cập nhật credentials vào `firebase-config.js`
3. Deploy

## 📋 Các file đã tạo sẵn

✅ `firebase-config.js` - Firebase configuration  
✅ `firebase-auth.js` - Authentication service mới  
✅ `firebase.json` - Firebase project config  
✅ `firestore.rules` - Database security rules  
✅ `FIREBASE_SETUP.md` - Hướng dẫn đầy đủ  
✅ `package.json` - Dependencies  

## ⚡ Quick Start (5 phút)

### Bước 1: Tạo Firebase Project
1. Vào https://console.firebase.google.com/
2. Click "Add project"
3. Đặt tên project → Create

### Bước 2: Enable Services
**Authentication:**
- Vào Authentication → Get Started
- Enable "Email/Password"

**Firestore:**
- Vào Firestore Database → Create database
- Chọn "Production mode"
- Chọn location gần nhất

### Bước 3: Lấy Config
1. Project Settings (icon ⚙️)
2. Scroll xuống "Your apps"
3. Click icon Web `</>`
4. Register app
5. Copy config object

### Bước 4: Cập nhật Code
Mở `firebase-config.js`, thay thế:
```javascript
const firebaseConfig = {
  apiKey: "PASTE-YOUR-API-KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc"
};
```

### Bước 5: Update HTML Files
Thay `auth.js` bằng `firebase-auth.js` và `firebase-config.js` trong các file HTML

## 🚀 Deploy (nếu có Node.js)

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

## 📝 Lưu ý quan trọng

⚠️ **Admin account:** User đầu tiên phải set role="admin" thủ công trong Firestore  
⚠️ **Dữ liệu cũ:** localStorage không tự động migrate  
⚠️ **Email format:** Username được chuyển thành email dạng `username@aitodo.local`

## 🔗 Tài liệu đầy đủ

Xem `FIREBASE_SETUP.md` để biết chi tiết từng bước.
