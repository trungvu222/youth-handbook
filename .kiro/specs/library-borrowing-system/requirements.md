# Requirements Document: Library Borrowing System

## Introduction

Hệ thống mượn/trả sách với QR code cho ứng dụng Youth Handbook cho phép đoàn viên mượn và trả sách từ Phòng HCM thông qua việc quét mã QR. Hệ thống tích hợp với module quản lý sách hiện có của admin và cung cấp giao diện người dùng để xem danh sách sách, quét QR để mượn/trả, và theo dõi lịch sử mượn sách.

## Glossary

- **User_App**: Ứng dụng di động dành cho đoàn viên (user)
- **Admin_Module**: Module quản lý sách trong trang admin (đã có sẵn)
- **Book_Database**: Cơ sở dữ liệu chứa thông tin sách (bảng Book)
- **Borrowing_Database**: Cơ sở dữ liệu chứa lịch sử mượn/trả (bảng BookBorrowing)
- **QR_Scanner**: Chức năng quét mã QR trên thiết bị di động
- **Book_List_Screen**: Màn hình hiển thị danh sách sách
- **Book_Detail_Screen**: Màn hình chi tiết sách
- **Borrowing_History_Screen**: Màn hình lịch sử mượn sách
- **Bottom_Navigation**: Thanh điều hướng dưới cùng của ứng dụng
- **QR_Scan_Button**: Nút quét QR ở giữa bottom navigation
- **Profile_Screen**: Màn hình cá nhân của user
- **Backend_API**: API backend xử lý logic mượn/trả sách
- **Book_Status**: Trạng thái sách (AVAILABLE - sẵn sàng, BORROWED - đang mượn)
- **Borrowing_Record**: Bản ghi mượn sách trong database
- **Current_User**: Người dùng đang đăng nhập

## Requirements

### Requirement 1: Book List Display

**User Story:** Là một đoàn viên, tôi muốn xem danh sách tất cả các sách có sẵn từ Phòng HCM, để tôi có thể biết sách nào có thể mượn.

#### Acceptance Criteria


1. THE User_App SHALL display a "Sách" tab in the Bottom_Navigation
2. WHEN the user taps the "Sách" tab, THE User_App SHALL display the Book_List_Screen
3. THE Book_List_Screen SHALL fetch book data from the Backend_API endpoint GET /api/books
4. THE Book_List_Screen SHALL display each book with title, author, publisher, and Book_Status
5. WHEN a book has Book_Status "AVAILABLE", THE Book_List_Screen SHALL display "Sẵn sàng" status
6. WHEN a book has Book_Status "BORROWED", THE Book_List_Screen SHALL display "Đang mượn" status
7. THE Book_List_Screen SHALL display a loading indicator while fetching data
8. IF the Backend_API returns an error, THEN THE Book_List_Screen SHALL display an error message

### Requirement 2: Book Search and Filter

**User Story:** Là một đoàn viên, tôi muốn tìm kiếm và lọc sách theo tên, tác giả hoặc trạng thái, để tôi có thể nhanh chóng tìm thấy sách mình cần.

#### Acceptance Criteria

1. THE Book_List_Screen SHALL provide a search input field
2. WHEN the user types in the search field, THE Book_List_Screen SHALL filter books by title matching the search term
3. WHEN the user types in the search field, THE Book_List_Screen SHALL filter books by author matching the search term
4. THE Book_List_Screen SHALL provide filter options for Book_Status
5. WHEN the user selects "Sẵn sàng" filter, THE Book_List_Screen SHALL display only books with Book_Status "AVAILABLE"
6. WHEN the user selects "Đang mượn" filter, THE Book_List_Screen SHALL display only books with Book_Status "BORROWED"
7. THE Book_List_Screen SHALL update the displayed results in real-time as the user types

### Requirement 3: Book Detail View

**User Story:** Là một đoàn viên, tôi muốn xem thông tin chi tiết của một cuốn sách, để tôi có thể biết đầy đủ thông tin trước khi mượn.

#### Acceptance Criteria

1. WHEN the user taps on a book in the Book_List_Screen, THE User_App SHALL navigate to the Book_Detail_Screen
2. THE Book_Detail_Screen SHALL display the book title
3. THE Book_Detail_Screen SHALL display the book author
4. THE Book_Detail_Screen SHALL display the book publisher
5. THE Book_Detail_Screen SHALL display the current Book_Status
6. WHEN the book has Book_Status "BORROWED", THE Book_Detail_Screen SHALL display the borrower name
7. WHEN the book has Book_Status "BORROWED", THE Book_Detail_Screen SHALL display the borrowed date
8. THE Book_Detail_Screen SHALL provide a back button to return to the Book_List_Screen

### Requirement 4: QR Scan Button Integration

**User Story:** Là một đoàn viên, tôi muốn có một nút quét QR dễ truy cập ở giữa bottom navigation, để tôi có thể nhanh chóng quét mã sách.

#### Acceptance Criteria

1. THE Bottom_Navigation SHALL display a circular button in the center position
2. THE QR_Scan_Button SHALL display a camera or QR code icon
3. THE QR_Scan_Button SHALL be positioned between the "Tài liệu" tab and the "Học tập" tab
4. THE QR_Scan_Button SHALL be visually distinct from other navigation tabs
5. WHEN the user taps the QR_Scan_Button, THE User_App SHALL request camera permission
6. IF camera permission is denied, THEN THE User_App SHALL display a permission error message
7. WHEN camera permission is granted, THE User_App SHALL open the QR_Scanner


### Requirement 5: QR Code Scanning for Borrowing

**User Story:** Là một đoàn viên, tôi muốn quét mã QR của sách để mượn sách, để tôi có thể nhanh chóng đăng ký mượn mà không cần nhập thông tin thủ công.

#### Acceptance Criteria

1. WHEN the QR_Scanner is opened, THE User_App SHALL activate the device camera
2. THE QR_Scanner SHALL continuously scan for QR codes in the camera view
3. WHEN a QR code is detected, THE QR_Scanner SHALL send the QR code value to the Backend_API endpoint GET /api/books/scan/:qrCode
4. WHEN the Backend_API returns book data with Book_Status "AVAILABLE", THE User_App SHALL display a borrow confirmation dialog
5. THE borrow confirmation dialog SHALL display the book title, author, and publisher
6. THE borrow confirmation dialog SHALL provide "Xác nhận mượn" and "Hủy" buttons
7. WHEN the user taps "Xác nhận mượn", THE User_App SHALL call the Backend_API endpoint POST /api/books/:id/borrow
8. WHEN the borrow request succeeds, THE User_App SHALL display a success notification
9. WHEN the borrow request succeeds, THE User_App SHALL close the QR_Scanner
10. WHEN the borrow request succeeds, THE Backend_API SHALL create a new Borrowing_Record with borrowedAt timestamp
11. WHEN the borrow request succeeds, THE Backend_API SHALL update the book Book_Status to "BORROWED"
12. IF the Backend_API returns an error, THEN THE User_App SHALL display the error message

### Requirement 6: QR Code Scanning for Returning

**User Story:** Là một đoàn viên, tôi muốn quét mã QR của sách đã mượn để trả sách, để tôi có thể hoàn tất việc trả sách một cách nhanh chóng.

#### Acceptance Criteria

1. WHEN a QR code is scanned and the Backend_API returns book data with Book_Status "BORROWED", THE User_App SHALL check if the Current_User is the borrower
2. WHEN the Current_User is the borrower, THE User_App SHALL display a return confirmation dialog
3. THE return confirmation dialog SHALL display the book title and borrowed date
4. THE return confirmation dialog SHALL provide "Xác nhận trả" and "Hủy" buttons
5. WHEN the user taps "Xác nhận trả", THE User_App SHALL call the Backend_API endpoint POST /api/books/borrowings/:id/return
6. WHEN the return request succeeds, THE User_App SHALL display a success notification
7. WHEN the return request succeeds, THE User_App SHALL close the QR_Scanner
8. WHEN the return request succeeds, THE Backend_API SHALL update the Borrowing_Record with returnedAt timestamp
9. WHEN the return request succeeds, THE Backend_API SHALL update the book Book_Status to "AVAILABLE"
10. IF the Current_User is not the borrower, THEN THE User_App SHALL display an error message "Sách này đang được mượn bởi người khác"

### Requirement 7: Borrowing History Display

**User Story:** Là một đoàn viên, tôi muốn xem lịch sử mượn sách của mình, để tôi có thể theo dõi các sách đã mượn và đã trả.

#### Acceptance Criteria

1. THE Profile_Screen SHALL display a "Lịch sử mượn sách" menu item
2. WHEN the user taps "Lịch sử mượn sách", THE User_App SHALL navigate to the Borrowing_History_Screen
3. THE Borrowing_History_Screen SHALL fetch borrowing data from the Backend_API endpoint GET /api/books/my-borrows
4. THE Borrowing_History_Screen SHALL display each borrowing record with book title, borrowed date, and return date
5. WHEN a borrowing record has returnedAt value, THE Borrowing_History_Screen SHALL display "Đã trả" status
6. WHEN a borrowing record has no returnedAt value, THE Borrowing_History_Screen SHALL display "Đang mượn" status
7. THE Borrowing_History_Screen SHALL sort records by borrowedAt in descending order
8. THE Borrowing_History_Screen SHALL display a loading indicator while fetching data
9. IF the Backend_API returns an error, THEN THE Borrowing_History_Screen SHALL display an error message


### Requirement 8: Borrowed Books Count Display

**User Story:** Là một đoàn viên, tôi muốn thấy số lượng sách đang mượn trên màn hình cá nhân, để tôi có thể nhanh chóng biết mình đang mượn bao nhiêu sách.

#### Acceptance Criteria

1. THE Profile_Screen SHALL display a "Sách đang mượn" section
2. THE Profile_Screen SHALL fetch the count of active borrowings from the Backend_API
3. THE Profile_Screen SHALL display the number of books currently borrowed by the Current_User
4. WHEN the Current_User has no active borrowings, THE Profile_Screen SHALL display "0 sách"
5. WHEN the Current_User has active borrowings, THE Profile_Screen SHALL display the count with format "N sách"

### Requirement 9: Backend API - Get Books List

**User Story:** Là một backend system, tôi cần cung cấp API để lấy danh sách sách, để User_App có thể hiển thị danh sách sách.

#### Acceptance Criteria

1. THE Backend_API SHALL provide endpoint GET /api/books
2. WHEN the endpoint receives a request with valid authentication token, THE Backend_API SHALL query the Book_Database
3. THE Backend_API SHALL return an array of book objects
4. EACH book object SHALL include id, title, author, publisher, qrCode, and Book_Status
5. THE Backend_API SHALL calculate Book_Status based on active Borrowing_Records
6. WHEN a book has an active Borrowing_Record (returnedAt is null), THE Backend_API SHALL set Book_Status to "BORROWED"
7. WHEN a book has no active Borrowing_Record, THE Backend_API SHALL set Book_Status to "AVAILABLE"
8. WHERE the request includes a search parameter, THE Backend_API SHALL filter books by title or author matching the search term
9. IF the authentication token is invalid, THEN THE Backend_API SHALL return a 401 error

### Requirement 10: Backend API - Get Book by QR Code

**User Story:** Là một backend system, tôi cần cung cấp API để lấy thông tin sách qua mã QR, để User_App có thể xác định sách khi quét QR.

#### Acceptance Criteria

1. THE Backend_API SHALL provide endpoint GET /api/books/scan/:qrCode
2. WHEN the endpoint receives a request with valid authentication token, THE Backend_API SHALL query the Book_Database by qrCode
3. WHEN a book is found, THE Backend_API SHALL return the book object with current Book_Status
4. WHEN a book is found with Book_Status "BORROWED", THE Backend_API SHALL include currentBorrower information
5. THE currentBorrower information SHALL include borrower id and fullName
6. WHEN no book is found with the provided qrCode, THE Backend_API SHALL return a 404 error
7. IF the authentication token is invalid, THEN THE Backend_API SHALL return a 401 error

### Requirement 11: Backend API - Borrow Book

**User Story:** Là một backend system, tôi cần cung cấp API để xử lý việc mượn sách, để User_App có thể đăng ký mượn sách cho người dùng.

#### Acceptance Criteria

1. THE Backend_API SHALL provide endpoint POST /api/books/:id/borrow
2. WHEN the endpoint receives a request with valid authentication token, THE Backend_API SHALL verify the book exists
3. WHEN the book exists, THE Backend_API SHALL check if the book has an active Borrowing_Record
4. IF the book has an active Borrowing_Record, THEN THE Backend_API SHALL return a 400 error with message "Sách đang được mượn"
5. WHEN the book is available, THE Backend_API SHALL create a new Borrowing_Record in the Borrowing_Database
6. THE new Borrowing_Record SHALL include bookId, userId from the authentication token, and borrowedAt timestamp
7. THE Backend_API SHALL return the created Borrowing_Record
8. IF the authentication token is invalid, THEN THE Backend_API SHALL return a 401 error
9. IF the book does not exist, THEN THE Backend_API SHALL return a 404 error


### Requirement 12: Backend API - Return Book

**User Story:** Là một backend system, tôi cần cung cấp API để xử lý việc trả sách, để User_App có thể hoàn tất việc trả sách cho người dùng.

#### Acceptance Criteria

1. THE Backend_API SHALL provide endpoint POST /api/books/borrowings/:id/return
2. WHEN the endpoint receives a request with valid authentication token, THE Backend_API SHALL verify the Borrowing_Record exists
3. WHEN the Borrowing_Record exists, THE Backend_API SHALL verify the userId matches the authenticated user
4. IF the userId does not match, THEN THE Backend_API SHALL return a 403 error with message "Bạn không có quyền trả sách này"
5. WHEN the user is authorized, THE Backend_API SHALL check if the Borrowing_Record already has a returnedAt value
6. IF returnedAt already exists, THEN THE Backend_API SHALL return a 400 error with message "Sách đã được trả"
7. WHEN the return is valid, THE Backend_API SHALL update the Borrowing_Record with returnedAt timestamp
8. THE Backend_API SHALL return the updated Borrowing_Record
9. IF the authentication token is invalid, THEN THE Backend_API SHALL return a 401 error
10. IF the Borrowing_Record does not exist, THEN THE Backend_API SHALL return a 404 error

### Requirement 13: Backend API - Get User Borrowing History

**User Story:** Là một backend system, tôi cần cung cấp API để lấy lịch sử mượn sách của người dùng, để User_App có thể hiển thị lịch sử mượn sách.

#### Acceptance Criteria

1. THE Backend_API SHALL provide endpoint GET /api/books/my-borrows
2. WHEN the endpoint receives a request with valid authentication token, THE Backend_API SHALL query the Borrowing_Database by userId
3. THE Backend_API SHALL return an array of Borrowing_Record objects
4. EACH Borrowing_Record SHALL include id, bookId, borrowedAt, returnedAt, and book information
5. THE book information SHALL include title, author, and publisher
6. THE Backend_API SHALL sort the results by borrowedAt in descending order
7. IF the authentication token is invalid, THEN THE Backend_API SHALL return a 401 error

### Requirement 14: Admin View Borrowing Status

**User Story:** Là một admin, tôi muốn xem ai đang mượn sách nào, để tôi có thể quản lý và theo dõi tình trạng mượn sách.

#### Acceptance Criteria

1. THE Admin_Module SHALL display borrowing information for each book
2. WHEN a book has Book_Status "BORROWED", THE Admin_Module SHALL display the borrower name
3. WHEN a book has Book_Status "BORROWED", THE Admin_Module SHALL display the borrowed date
4. THE Admin_Module SHALL provide a view to see all active borrowings
5. THE Admin_Module SHALL provide a view to see borrowing history
6. THE Admin_Module SHALL allow filtering borrowings by status (active/returned)
7. THE Admin_Module SHALL fetch data from the Backend_API endpoint GET /api/books/admin/stats

### Requirement 15: Notification on Successful Borrow

**User Story:** Là một đoàn viên, tôi muốn nhận thông báo khi mượn sách thành công, để tôi biết giao dịch đã được xử lý.

#### Acceptance Criteria

1. WHEN a borrow request succeeds, THE User_App SHALL display a toast notification
2. THE notification SHALL contain the message "Mượn sách thành công"
3. THE notification SHALL display the book title
4. THE notification SHALL automatically dismiss after 3 seconds
5. THE notification SHALL use a success style (green color)


### Requirement 16: Notification on Successful Return

**User Story:** Là một đoàn viên, tôi muốn nhận thông báo khi trả sách thành công, để tôi biết giao dịch đã được xử lý.

#### Acceptance Criteria

1. WHEN a return request succeeds, THE User_App SHALL display a toast notification
2. THE notification SHALL contain the message "Trả sách thành công"
3. THE notification SHALL display the book title
4. THE notification SHALL automatically dismiss after 3 seconds
5. THE notification SHALL use a success style (green color)

### Requirement 17: Database Schema - Book Table

**User Story:** Là một database system, tôi cần lưu trữ thông tin sách, để hệ thống có thể quản lý danh sách sách.

#### Acceptance Criteria

1. THE Book_Database SHALL have a table named "books"
2. THE books table SHALL have column "id" as primary key with type String
3. THE books table SHALL have column "title" with type String
4. THE books table SHALL have column "author" with type String (nullable)
5. THE books table SHALL have column "publisher" with type String (nullable)
6. THE books table SHALL have column "qrCode" with type String and unique constraint
7. THE books table SHALL have column "createdAt" with type DateTime and default value now()
8. THE books table SHALL have column "updatedAt" with type DateTime and auto-update on modification

### Requirement 18: Database Schema - BookBorrowing Table

**User Story:** Là một database system, tôi cần lưu trữ lịch sử mượn/trả sách, để hệ thống có thể theo dõi các giao dịch mượn sách.

#### Acceptance Criteria

1. THE Borrowing_Database SHALL have a table named "book_borrowings"
2. THE book_borrowings table SHALL have column "id" as primary key with type String
3. THE book_borrowings table SHALL have column "bookId" with type String as foreign key to books.id
4. THE book_borrowings table SHALL have column "userId" with type String as foreign key to users.id
5. THE book_borrowings table SHALL have column "borrowedAt" with type DateTime and default value now()
6. THE book_borrowings table SHALL have column "returnedAt" with type DateTime (nullable)
7. THE book_borrowings table SHALL have column "createdAt" with type DateTime and default value now()
8. WHEN a Borrowing_Record is created, THE borrowedAt SHALL be automatically set to current timestamp
9. WHEN a book is returned, THE returnedAt SHALL be set to current timestamp

### Requirement 19: Error Handling - Invalid QR Code

**User Story:** Là một đoàn viên, tôi muốn nhận thông báo rõ ràng khi quét mã QR không hợp lệ, để tôi biết cần làm gì tiếp theo.

#### Acceptance Criteria

1. WHEN the QR_Scanner detects a QR code that does not match any book, THE User_App SHALL display an error notification
2. THE error notification SHALL contain the message "Mã QR không hợp lệ"
3. THE error notification SHALL use an error style (red color)
4. THE QR_Scanner SHALL remain open to allow scanning another code
5. THE error notification SHALL automatically dismiss after 3 seconds

### Requirement 20: Error Handling - Book Already Borrowed

**User Story:** Là một đoàn viên, tôi muốn nhận thông báo khi cố gắng mượn sách đã được mượn, để tôi biết sách không khả dụng.

#### Acceptance Criteria

1. WHEN the user attempts to borrow a book with Book_Status "BORROWED", THE User_App SHALL display an error notification
2. THE error notification SHALL contain the message "Sách đang được mượn bởi người khác"
3. THE error notification SHALL use an error style (red color)
4. THE QR_Scanner SHALL close after displaying the error
5. THE error notification SHALL automatically dismiss after 3 seconds


### Requirement 21: Camera Permission Handling

**User Story:** Là một đoàn viên, tôi muốn được hướng dẫn cấp quyền camera khi cần thiết, để tôi có thể sử dụng chức năng quét QR.

#### Acceptance Criteria

1. WHEN the user taps the QR_Scan_Button for the first time, THE User_App SHALL request camera permission
2. IF the user denies camera permission, THEN THE User_App SHALL display a dialog explaining why camera permission is needed
3. THE permission dialog SHALL provide a button to open device settings
4. WHEN the user grants camera permission, THE User_App SHALL open the QR_Scanner
5. IF camera permission is permanently denied, THEN THE User_App SHALL display instructions to enable it in settings

### Requirement 22: Concurrent Borrowing Prevention

**User Story:** Là một backend system, tôi cần ngăn chặn việc nhiều người cùng mượn một cuốn sách đồng thời, để đảm bảo tính toàn vẹn dữ liệu.

#### Acceptance Criteria

1. WHEN multiple borrow requests for the same book arrive simultaneously, THE Backend_API SHALL process them sequentially
2. THE Backend_API SHALL use database transaction locking to prevent race conditions
3. WHEN the first request creates a Borrowing_Record, THE Backend_API SHALL commit the transaction
4. WHEN subsequent requests check the book status, THE Backend_API SHALL detect the active Borrowing_Record
5. THE Backend_API SHALL return a 400 error to subsequent requests with message "Sách đang được mượn"

### Requirement 23: Data Validation - Book Creation

**User Story:** Là một backend system, tôi cần xác thực dữ liệu khi tạo sách mới, để đảm bảo dữ liệu hợp lệ trong database.

#### Acceptance Criteria

1. WHEN the Backend_API receives a book creation request, THE Backend_API SHALL validate that title is not empty
2. THE Backend_API SHALL validate that qrCode is unique in the Book_Database
3. IF title is empty, THEN THE Backend_API SHALL return a 400 error with message "Tên sách không được để trống"
4. IF qrCode already exists, THEN THE Backend_API SHALL return a 400 error with message "Mã QR đã tồn tại"
5. WHEN validation passes, THE Backend_API SHALL create the book record

### Requirement 24: UI Responsiveness - Loading States

**User Story:** Là một đoàn viên, tôi muốn thấy trạng thái loading khi dữ liệu đang được tải, để tôi biết ứng dụng đang xử lý.

#### Acceptance Criteria

1. WHEN the Book_List_Screen is fetching data, THE User_App SHALL display a loading spinner
2. WHEN the Borrowing_History_Screen is fetching data, THE User_App SHALL display a loading spinner
3. WHEN a borrow or return request is processing, THE User_App SHALL disable the confirmation button
4. THE confirmation button SHALL display "Đang xử lý..." text while processing
5. WHEN the request completes, THE User_App SHALL re-enable the button and close the dialog

### Requirement 25: Offline Handling

**User Story:** Là một đoàn viên, tôi muốn nhận thông báo rõ ràng khi không có kết nối internet, để tôi biết tại sao chức năng không hoạt động.

#### Acceptance Criteria

1. WHEN the User_App detects no internet connection, THE User_App SHALL display an offline indicator
2. WHEN the user attempts to fetch book list without internet, THE User_App SHALL display message "Không có kết nối internet"
3. WHEN the user attempts to borrow or return a book without internet, THE User_App SHALL display message "Không có kết nối internet"
4. THE User_App SHALL provide a retry button when offline errors occur
5. WHEN internet connection is restored, THE User_App SHALL automatically retry the failed request


## Correctness Properties

### Property 1: Book Status Consistency (Invariant)

**Description:** Một cuốn sách chỉ có thể có một trong hai trạng thái: AVAILABLE hoặc BORROWED. Trạng thái này phải nhất quán với việc có hay không có Borrowing_Record active.

**Property:**
```
FOR ALL books IN Book_Database:
  (book.status == "BORROWED") IFF (EXISTS active_borrowing WHERE active_borrowing.bookId == book.id AND active_borrowing.returnedAt IS NULL)
```

**Test Strategy:** Property-based test với random book states và borrowing records, verify invariant holds after any operation.

### Property 2: Borrowing Record Timestamps (Invariant)

**Description:** Thời gian trả sách phải luôn sau thời gian mượn sách.

**Property:**
```
FOR ALL borrowing_records IN Borrowing_Database:
  IF borrowing_record.returnedAt IS NOT NULL THEN
    borrowing_record.returnedAt > borrowing_record.borrowedAt
```

**Test Strategy:** Property-based test với random timestamps, verify constraint holds for all records.

### Property 3: Borrow-Return Round Trip (Round Trip)

**Description:** Sau khi mượn và trả sách, trạng thái sách phải quay về AVAILABLE.

**Property:**
```
FOR ALL books WHERE initial_status == "AVAILABLE":
  borrow(book) -> book.status == "BORROWED"
  return(book) -> book.status == "AVAILABLE"
```

**Test Strategy:** Integration test với sequence: check initial state -> borrow -> verify borrowed -> return -> verify available.

### Property 4: User Borrowing History Completeness (Invariant)

**Description:** Tất cả các Borrowing_Record của một user phải có thể truy vấn được qua API.

**Property:**
```
FOR ALL users:
  LET db_records = SELECT * FROM Borrowing_Database WHERE userId == user.id
  LET api_records = GET /api/books/my-borrows (authenticated as user)
  THEN db_records == api_records
```

**Test Strategy:** Integration test tạo random borrowing records, verify API returns complete list.

### Property 5: Concurrent Borrow Prevention (Idempotence)

**Description:** Nhiều request mượn cùng một sách đồng thời chỉ có một request thành công.

**Property:**
```
FOR ALL books WHERE status == "AVAILABLE":
  LET requests = [borrow(book, user1), borrow(book, user2), ..., borrow(book, userN)]
  WHEN execute_concurrently(requests)
  THEN COUNT(successful_requests) == 1
  AND COUNT(failed_requests) == N - 1
```

**Test Strategy:** Concurrency test với multiple threads attempting to borrow same book simultaneously.

### Property 6: QR Code Uniqueness (Invariant)

**Description:** Mỗi mã QR phải là duy nhất trong hệ thống.

**Property:**
```
FOR ALL book1, book2 IN Book_Database:
  IF book1.id != book2.id THEN
    book1.qrCode != book2.qrCode
```

**Test Strategy:** Database constraint test, attempt to create books with duplicate QR codes.

### Property 7: Authorization Enforcement (Invariant)

**Description:** Chỉ người mượn sách mới có thể trả sách đó.

**Property:**
```
FOR ALL borrowing_records:
  FOR ALL users WHERE user.id != borrowing_record.userId:
    return(borrowing_record, user) MUST FAIL with 403 error
```

**Test Strategy:** Integration test với different users attempting to return books they didn't borrow.


### Property 8: Search Filter Correctness (Metamorphic)

**Description:** Kết quả tìm kiếm phải là tập con của danh sách đầy đủ.

**Property:**
```
FOR ALL search_terms:
  LET full_list = getBooks()
  LET filtered_list = getBooks(search: search_term)
  THEN filtered_list ⊆ full_list
  AND LENGTH(filtered_list) <= LENGTH(full_list)
```

**Test Strategy:** Property-based test với random search terms, verify filtered results are subset of full list.

### Property 9: Borrowing Count Accuracy (Invariant)

**Description:** Số lượng sách đang mượn hiển thị trên Profile phải khớp với số Borrowing_Record active.

**Property:**
```
FOR ALL users:
  LET displayed_count = Profile_Screen.borrowedBooksCount
  LET actual_count = COUNT(SELECT * FROM Borrowing_Database WHERE userId == user.id AND returnedAt IS NULL)
  THEN displayed_count == actual_count
```

**Test Strategy:** Integration test tạo random borrowings, verify displayed count matches database.

### Property 10: API Response Structure Consistency (Invariant)

**Description:** Tất cả API responses phải tuân theo cấu trúc ApiResponse chuẩn.

**Property:**
```
FOR ALL api_endpoints:
  LET response = call(endpoint)
  THEN response HAS FIELD "success" OF TYPE Boolean
  AND (response.success == true IMPLIES response HAS FIELD "data")
  AND (response.success == false IMPLIES response HAS FIELD "error")
```

**Test Strategy:** Contract test cho tất cả endpoints, verify response structure.

### Property 11: Book List Ordering Stability (Confluence)

**Description:** Thứ tự sắp xếp danh sách sách phải nhất quán giữa các lần gọi API.

**Property:**
```
FOR ALL api_calls WITH same_parameters:
  LET result1 = getBooks(params)
  LET result2 = getBooks(params)
  THEN ORDER(result1) == ORDER(result2)
```

**Test Strategy:** Integration test gọi API nhiều lần với cùng parameters, verify order consistency.

### Property 12: Error Message Clarity (Invariant)

**Description:** Tất cả error responses phải chứa message rõ ràng bằng tiếng Việt.

**Property:**
```
FOR ALL api_errors:
  error.message IS NOT NULL
  AND error.message IS NOT EMPTY
  AND error.message MATCHES Vietnamese_Language_Pattern
```

**Test Strategy:** Error scenario tests, verify all error messages are present and in Vietnamese.

### Property 13: Transaction Atomicity (Invariant)

**Description:** Khi mượn sách, việc tạo Borrowing_Record và cập nhật Book_Status phải xảy ra cùng lúc hoặc không xảy ra.

**Property:**
```
FOR ALL borrow_operations:
  (Borrowing_Record.created == true) IFF (Book.status == "BORROWED")
  IF operation_fails THEN
    Borrowing_Record.created == false AND Book.status == "AVAILABLE"
```

**Test Strategy:** Fault injection test, simulate failures during borrow operation, verify no partial updates.

### Property 14: QR Scanner State Management (Idempotence)

**Description:** Mở và đóng QR Scanner nhiều lần không gây ra memory leak hoặc camera lock.

**Property:**
```
FOR ALL sequences OF [open_scanner, close_scanner]:
  AFTER N iterations:
    memory_usage < THRESHOLD
    AND camera_is_released == true
```

**Test Strategy:** Stress test mở/đóng scanner nhiều lần, monitor memory và camera state.

### Property 15: Data Freshness After Mutation (Invariant)

**Description:** Sau khi mượn hoặc trả sách, danh sách sách phải được cập nhật với trạng thái mới.

**Property:**
```
FOR ALL books:
  LET initial_status = book.status
  WHEN borrow(book) OR return(book)
  LET updated_list = getBooks()
  LET updated_book = FIND book IN updated_list
  THEN updated_book.status != initial_status
```

**Test Strategy:** Integration test thực hiện mutation, verify subsequent queries return updated data.

## Notes

- Database schema (Book và BookBorrowing tables) đã tồn tại trong hệ thống
- Backend API endpoints đã được implement một phần trong lib/api.ts
- Admin module quản lý sách đã có sẵn trong components/admin/book-management.tsx
- Cần implement UI components cho user app: Book List Screen, QR Scanner, Borrowing History Screen
- Cần thêm "Sách" tab vào bottom navigation
- Cần thêm QR Scan button ở giữa bottom navigation
- Cần tích hợp với Capacitor Camera plugin để quét QR code
