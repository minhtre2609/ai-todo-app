# 🚀 DEPLOYMENT CHECKLIST - AI Todo App

## Files đã được update (Upload lên Netlify)

### ✅ Core Files (BẮT BUỘC upload)

1. **login.html** ⭐ MỚI
   - 3 forms: Login, Register, Forgot Password
   - Show/hide password toggle (👁️ icon)
   - Email field trong register
   - Debug console.log

2. **firebase-auth.js** ⭐ MỚI
   - Login method: Query Firestore → get email → login
   - Register method: Nhận email parameter
   - Reset password method: Send email reset
   - Extensive console.log debug

3. **index.html** ⭐ ĐÃ SỬA
   - Datetime picker cho deadline (thay vì dropdown)
   - Profile link trong nav

### 📋 Files không đổi (KHÔNG cần upload lại)

- firebase-config.js
- style.css
- admin.html
- profile.html
- firebase-app.js
- firestore.rules (đã deploy rồi)

---

## 🔧 Test Steps (sau khi upload)

### 1. Clear Browser Cache
```
Ctrl + Shift + R (hoặc Cmd + Shift + R trên Mac)
```

### 2. Mở Console để debug
```
F12 → Tab Console
```

### 3. Test Register (Tài khoản MỚI)

**Thông tin test:**
- Họ tên: `Minh Phan`
- Email: `minhtre2609@gmail.com` (email THẬT)
- Username: `testuser2024`
- Password: `123456` (hoặc password bạn muốn)

**Expected Console:**
```
(không có lỗi)
```

**Expected Result:**
- Message: "Đăng ký thành công! Đang chuyển sang đăng nhập..."
- Auto chuyển về login form
- Username đã điền sẵn

### 4. Test Login

**Thông tin:**
- Username: `testuser2024`
- Password: `123456`
- Click 👁️ để xem password

**Expected Console:**
```
🔐 Attempting login for: testuser2024
🔍 Login attempt for username: testuser2024
📊 Query result - found users: 1
✅ Found user in Firestore: { userId: "...", username: "testuser2024", email: "..." }
🔐 Attempting Firebase Auth login with email: ...
✅ Firebase Auth login successful
```

**Expected Result:**
- Message: "Đăng nhập thành công!"
- Redirect to index.html

**Nếu thất bại:**
- Check console error
- Đảm bảo đã upload firebase-auth.js mới
- Clear cache

### 5. Test Forgot Password

**Logout trước:**
- Click "Đăng xuất" trong app

**Test:**
- Click "Quên mật khẩu?"
- Nhập username: `testuser2024`
- Click "Gửi Email Reset"

**Expected Result (với email thật):**
```
"Email reset mật khẩu đã được gửi đến minhtre2609@gmail.com. 
Vui lòng kiểm tra hộp thư!"
```

**Expected Result (với email giả @aitodo.local):**
```
"Tài khoản này không có email thật. 
Vui lòng liên hệ admin để reset mật khẩu!"
```

**Check Email:**
- Mở Gmail
- Tìm email từ Firebase
- Click link reset
- Tạo mật khẩu mới

### 6. Test Datetime Picker (index.html)

- Login vào app
- Thêm task mới
- Click vào "Thời hạn hoàn thành"
- Chọn ngày và giờ cụ thể
- Add task
- Verify datetime hiển thị đúng

---

## ⚠️ Troubleshooting

### Login fail dù nhập đúng password

**Nguyên nhân:** File firebase-auth.js cũ chưa upload

**Giải pháp:**
1. Upload firebase-auth.js mới
2. Clear cache (Ctrl + Shift + R)
3. Mở Console (F12)
4. Login lại
5. Xem console log để debug

### Console log không hiện

**Nguyên nhân:** Browser cache

**Giải pháp:**
1. Hard refresh: Ctrl + Shift + R
2. Hoặc: Settings → Clear browsing data

### Email reset không gửi được

**Nguyên nhân:** Email là @aitodo.local (fake)

**Giải pháp:**
1. Đăng ký tài khoản MỚI với email thật
2. Hoặc liên hệ admin để reset

---

## 📝 Summary

**Files cần upload:**
1. ✅ `login.html` (có show/hide password, forgot password)
2. ✅ `firebase-auth.js` (có login fix, reset password, console.log)
3. ✅ `index.html` (có datetime picker)

**Test flow:**
1. Register với email thật
2. Login với username mới
3. Test forgot password
4. Check console log nếu có lỗi

**Deployment:**
```bash
# Upload 3 files trên lên Netlify
# Clear cache
# Test!
```

Xong! 🎉
