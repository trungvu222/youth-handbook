# 📱 Hướng dẫn Build iOS App - Youth Handbook

## ⚠️ YÊU CẦU BẮT BUỘC

Để build app iOS, bạn **BẮT BUỘC** phải có:
1. **Máy Mac** (MacBook, iMac, Mac Mini, hoặc Mac Studio)
2. **Xcode** (phiên bản mới nhất từ App Store)
3. **Apple Developer Account** (miễn phí để test, $99/năm để publish lên App Store)
4. **iPhone/iPad thật** hoặc dùng Simulator trong Xcode

---

## 🚀 CÁCH 1: Build trên máy Mac

### Bước 1: Chuẩn bị môi trường Mac

```bash
# Cài đặt Homebrew (nếu chưa có)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Cài đặt Node.js
brew install node

# Cài đặt pnpm
npm install -g pnpm

# Cài đặt CocoaPods
sudo gem install cocoapods
```

### Bước 2: Clone và cài đặt project

```bash
# Clone repository
git clone https://github.com/trungvu222/youth-handbook.git
cd youth-handbook

# Cài đặt dependencies
pnpm install
```

### Bước 3: Build web assets

```bash
# Set biến môi trường và build
export BUILD_TARGET=mobile
pnpm run build

# Fix paths cho Capacitor
node fix-paths.js

# Sync với iOS
npx cap sync ios
```

### Bước 4: Cài đặt CocoaPods

```bash
cd ios/App
pod install
cd ../..
```

### Bước 5: Mở Xcode

```bash
npx cap open ios
```

### Bước 6: Cấu hình trong Xcode

1. **Chọn Team**: 
   - Click vào project "App" trong navigator
   - Tab "Signing & Capabilities"
   - Chọn Team (Apple ID của bạn)

2. **Bundle Identifier**:
   - Đổi thành: `com.yourcompany.youthhandbook`

3. **Build cho Simulator hoặc Device**:
   - Chọn device/simulator ở thanh trên
   - Nhấn nút ▶️ (Run)

---

## 🌐 CÁCH 2: Dùng dịch vụ Cloud Build (Không cần Mac)

### Option A: Codemagic (Miễn phí 500 phút/tháng)

1. Truy cập https://codemagic.io
2. Đăng ký bằng GitHub
3. Kết nối repository `youth-handbook`
4. Tạo workflow cho iOS
5. Build sẽ chạy trên máy Mac ảo của Codemagic

### Option B: Expo EAS Build

1. Chuyển project sang Expo (cần refactor)
2. Dùng EAS Build service

### Option C: AppFlow (Ionic)

1. Truy cập https://ionic.io/appflow
2. Kết nối repository
3. Build iOS trên cloud

---

## 📲 CÁCH 3: Thuê Mac ảo trên Cloud

### MacStadium
- https://www.macstadium.com
- Thuê Mac Mini M1 từ $79/tháng

### MacinCloud
- https://www.macincloud.com
- Pay-per-use từ $1/giờ

### AWS EC2 Mac
- Mac instances trên AWS
- Tính theo giờ sử dụng

---

## 📋 HƯỚNG DẪN CHI TIẾT CHO TỪNG TRƯỜNG HỢP

### A. Nếu bạn có Mac:

```bash
# 1. Clone project
git clone https://github.com/trungvu222/youth-handbook.git
cd youth-handbook

# 2. Cài dependencies
pnpm install

# 3. Build
export BUILD_TARGET=mobile
pnpm run build
node fix-paths.js

# 4. Sync iOS
npx cap sync ios

# 5. Cài pods
cd ios/App && pod install && cd ../..

# 6. Mở Xcode
npx cap open ios

# 7. Trong Xcode:
#    - Chọn Signing Team
#    - Nhấn Run (▶️)
```

### B. Nếu khách hàng có Mac:

Gửi cho khách file hướng dẫn này + source code, khách tự build.

### C. Nếu không ai có Mac:

Dùng **Codemagic** - miễn phí 500 phút build/tháng:

1. Push code lên GitHub
2. Đăng ký Codemagic bằng GitHub
3. Tạo iOS workflow
4. Codemagic sẽ build và tạo file .ipa

---

## 🔑 ĐĂNG KÝ APPLE DEVELOPER

### Để test trên device (Miễn phí):
1. Tạo Apple ID tại https://appleid.apple.com
2. Đăng nhập Xcode với Apple ID
3. Chỉ test được trên chính device của mình

### Để publish lên App Store ($99/năm):
1. Đăng ký tại https://developer.apple.com/programs/
2. Thanh toán $99 USD/năm
3. Đợi Apple duyệt (1-2 ngày)
4. Sau đó có thể submit app lên App Store

---

## 📁 CẤU TRÚC PROJECT iOS

```
ios/
├── App/
│   ├── App/                    # Source files
│   │   ├── AppDelegate.swift   # App delegate
│   │   ├── Info.plist          # App configuration
│   │   └── Assets.xcassets/    # App icons, images
│   ├── App.xcodeproj/          # Xcode project
│   ├── App.xcworkspace/        # Xcode workspace (mở file này)
│   └── Podfile                 # CocoaPods dependencies
└── capacitor-cordova-ios-plugins/
```

---

## ❓ CÂU HỎI THƯỜNG GẶP

**Q: Có thể build iOS trên Windows không?**
A: Không thể trực tiếp. Phải dùng Mac hoặc dịch vụ cloud.

**Q: Chi phí publish lên App Store?**
A: $99 USD/năm cho Apple Developer Program.

**Q: Có thể test không cần publish?**
A: Có, dùng TestFlight hoặc cài trực tiếp qua Xcode.

**Q: Cần iPhone thật không?**
A: Không bắt buộc, có thể test trên Simulator trong Xcode.

---

## 📞 HỖ TRỢ

Nếu cần hỗ trợ thêm, liên hệ:
- Email: [your-email]
- Zalo/Phone: [your-phone]

---

**Ghi chú**: File APK Android đã sẵn sàng tại `youth-handbook-app.apk`
