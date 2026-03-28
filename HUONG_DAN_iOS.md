# 🍎 YOUTH HANDBOOK iOS APP - HƯỚNG DẪN TEST

## ⚠️ LƯU Ý QUAN TRỌNG
**iOS app chỉ có thể build và test trên macOS với Xcode.**
Windows không thể build trực tiếp iOS app, nhưng project đã được setup sẵn.

## 📁 iOS Project đã sẵn sàng
iOS project đã được tạo tại: `ios/App/App.xcodeproj`

## 🔧 YÊU CẦU ĐỂ BUILD iOS:

### Phần cứng:
- **Mac computer** (MacBook, iMac, Mac Mini, hoặc Mac Studio)
- **iPhone** hoặc **iPad** để test (tùy chọn - có thể dùng simulator)

### Phần mềm:
- **macOS** 12.0+ (Monterey hoặc mới hơn)
- **Xcode** 14.0+ (miễn phí từ App Store)
- **iOS 13.0+** trên thiết bị test

## 🚀 HƯỚNG DẪN BUILD TRÊN macOS:

### Bước 1: Chuẩn bị môi trường
```bash
# Cài đặt Xcode từ App Store
# Cài đặt Xcode Command Line Tools
xcode-select --install

# Cài đặt CocoaPods (nếu chưa có)
sudo gem install cocoapods
```

### Bước 2: Copy project sang Mac
1. **Copy toàn bộ thư mục** `youth-handbook` sang Mac
2. **Hoặc** push code lên Git và clone về Mac

### Bước 3: Setup trên Mac
```bash
cd youth-handbook

# Cài dependencies
npm install
# hoặc
pnpm install

# Build web assets
npm run build:mobile
# hoặc
pnpm run build:mobile

# Mở iOS project trong Xcode
npx cap open ios
```

### Bước 4: Cấu hình trong Xcode
1. **Đổi Bundle Identifier:**
   - Mở Xcode → Chọn project "App"
   - General tab → Bundle Identifier
   - Đổi từ `com.youthhandbook.app` thành tên duy nhất (vd: `com.yourcompany.youthhandbook`)

2. **Cấu hình Team:**
   - Signing & Capabilities tab
   - Chọn Team (Apple Developer Account)
   - Hoặc dùng Personal Team cho testing

3. **Chọn Target Device:**
   - iOS Simulator (không cần developer account)
   - Physical iPhone (cần developer account miễn phí)

### Bước 5: Build và Test
```bash
# Build cho simulator
npx cap run ios

# Hoặc build trong Xcode:
# Product → Build (⌘+B)
# Product → Run (⌘+R)
```

## 📱 CÁC CÁCH TEST iOS APP:

### Option 1: iOS Simulator (Dễ nhất)
- Không cần thiết bị vật lý
- Không cần Apple Developer Account
- Test trên máy Mac với simulator

### Option 2: TestFlight (Khuyến nghị cho client)
- Cần Apple Developer Account ($99/năm)
- Upload app lên App Store Connect
- Gửi link TestFlight cho khách hàng
- Khách hàng install TestFlight app và test

### Option 3: Direct Install (Development)
- Cần Apple Developer Account (miễn phí cũng được)
- Kết nối iPhone với Mac
- Install trực tiếp từ Xcode

### Option 4: Enterprise Distribution
- Cần Apple Developer Enterprise Account
- Tạo .ipa file để phân phối

## 📦 PACKAGE CHO KHÁCH HÀNG iOS:

### Nếu có Mac để build:
1. **Build .ipa file:**
```bash
# Archive app trong Xcode
# Export .ipa file
# Gửi .ipa cho khách hàng
```

2. **TestFlight Distribution:**
```bash
# Upload lên App Store Connect
# Add khách hàng làm beta tester
# Gửi TestFlight invitation
```

### Nếu không có Mac:
1. **Gửi source code:**
   - Copy thư mục `ios` 
   - Kèm hướng dẫn này
   - Khách hàng tự build trên Mac

2. **Cloud Build Service:**
   - Dùng Expo EAS Build
   - GitHub Actions với Mac runner
   - Bitrise, CircleCI, etc.

## 📋 FILES ĐÃ TẠO CHO iOS:

```
ios/
├── App/
│   ├── App.xcodeproj          # Xcode project file
│   ├── App/
│   │   ├── Info.plist         # App configuration
│   │   ├── capacitor.config.json
│   │   └── public/            # Web assets
│   └── Podfile                # iOS dependencies
└── capacitor-cordova-ios-plugins/
```

## 🔒 BẢO MẬT & PHÂN PHỐI:

### Development Build:
- Chỉ chạy trên máy đã đăng ký
- Hạn chế thời gian (7 ngày miễn phí, 1 năm có trả phí)

### TestFlight Build:
- Cho phép 10,000 beta testers
- App tự động expire sau 90 ngày
- Khách hàng dùng TestFlight app để install

### App Store Build:
- Phân phối chính thức
- Cần review của Apple
- Không giới hạn người dùng

## 🆘 HỖ TRỢ NEXT STEPS:

### Nếu khách hàng có Mac:
1. Gửi toàn bộ source code
2. Kèm theo hướng dẫn này
3. Hỗ trợ setup qua video call

### Nếu khách hàng không có Mac:
1. Thuê dịch vụ build iOS
2. Dùng cloud build services
3. Tìm partner có Mac để build

### Để build production iOS app:
1. Cần Apple Developer Account ($99/năm)
2. Cần Mac với Xcode
3. Cần thời gian setup certificates & provisioning profiles

---

**iOS project đã sẵn sàng - chỉ cần Mac để build! 🍎**