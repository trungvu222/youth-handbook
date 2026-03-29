# Design Document: Library Borrowing System

## Overview

Hệ thống Library Borrowing System là một tính năng mới được tích hợp vào ứng dụng Youth Handbook, cho phép đoàn viên mượn và trả sách từ Phòng HCM thông qua việc quét mã QR. Hệ thống bao gồm:

- **Frontend Mobile App**: Giao diện người dùng cho đoàn viên với các màn hình danh sách sách, quét QR, chi tiết sách, và lịch sử mượn sách
- **Backend API**: RESTful API xử lý logic nghiệp vụ mượn/trả sách, quản lý trạng thái sách, và lưu trữ lịch sử
- **Admin Module**: Giao diện quản trị để admin theo dõi tình trạng mượn sách và thống kê
- **Database**: Hai bảng chính là `books` (đã có) và `book_borrowings` (đã có) để lưu trữ thông tin sách và lịch sử mượn/trả

Hệ thống được thiết kế với các nguyên tắc:
- **Simplicity**: Quy trình mượn/trả sách đơn giản chỉ cần quét QR code
- **Real-time**: Trạng thái sách được cập nhật ngay lập tức
- **Traceability**: Mọi giao dịch mượn/trả đều được ghi lại đầy đủ
- **Security**: Chỉ người mượn mới có thể trả sách, có xác thực và phân quyền
- **Mobile-first**: Tối ưu cho trải nghiệm di động với Capacitor

## Architecture

### System Architecture


```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Books Screen │  │ QR Scanner   │  │ History      │      │
│  │              │  │ Modal        │  │ Screen       │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                             │ HTTPS/REST API
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                            ▼                                 │
│                   Backend API (Express)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  API Routes                                          │   │
│  │  - GET /api/books                                    │   │
│  │  - GET /api/books/scan/:qrCode                       │   │
│  │  - POST /api/books/:id/borrow                        │   │
│  │  - POST /api/books/borrowings/:id/return             │   │
│  │  - GET /api/books/my-borrows                         │   │
│  │  - GET /api/books/admin/stats                        │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  Business Logic Layer                                │   │
│  │  - Book Status Calculation                           │   │
│  │  - Borrowing Validation                              │   │
│  │  - Concurrent Request Handling                       │   │
│  │  - Authorization Checks                              │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼───────────────────────────────────┐   │
│  │  Data Access Layer (Prisma ORM)                      │   │
│  └──────────────────┬───────────────────────────────────┘   │
└─────────────────────┼──────────────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────────────────┐
│              PostgreSQL Database                            │
│  ┌──────────────┐              ┌──────────────┐            │
│  │ books        │              │ book_        │            │
│  │              │◄─────────────┤ borrowings   │            │
│  │ - id         │  1        N  │              │            │
│  │ - title      │              │ - id         │            │
│  │ - author     │              │ - bookId     │            │
│  │ - publisher  │              │ - userId     │            │
│  │ - qrCode     │              │ - borrowedAt │            │
│  │ - createdAt  │              │ - returnedAt │            │
│  │ - updatedAt  │              │ - createdAt  │            │
│  └──────────────┘              └──────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ với TypeScript
- Capacitor 6+ cho native features (camera, permissions)
- Capacitor Camera Plugin hoặc capacitor-plugin-qrscanner cho QR scanning
- Lucide React cho icons
- CSS-in-JS cho styling (inline styles theo pattern hiện tại)

**Backend:**
- Node.js 18+
- Express.js cho REST API
- Prisma ORM cho database access
- JWT cho authentication
- bcrypt cho password hashing

**Database:**
- PostgreSQL 14+
- Prisma migrations cho schema management

**Mobile Platform:**
- iOS và Android thông qua Capacitor
- Camera API cho QR scanning
- Permissions API cho camera access

### Component Hierarchy


```
App
├── BottomNavigation (Updated)
│   ├── HomeTab
│   ├── DocumentsTab
│   ├── QRScanButton (NEW - Center position)
│   ├── BooksTab (NEW)
│   └── StudyTab
│
├── BooksScreenMobile (NEW)
│   ├── SearchBar
│   ├── FilterButtons (Sẵn sàng / Đang mượn)
│   ├── BookList
│   │   └── BookCard[]
│   │       ├── BookTitle
│   │       ├── BookAuthor
│   │       ├── BookPublisher
│   │       └── StatusBadge
│   └── LoadingSpinner
│
├── BookDetailMobile (NEW)
│   ├── BackButton
│   ├── BookInfo
│   │   ├── Title
│   │   ├── Author
│   │   ├── Publisher
│   │   └── StatusBadge
│   └── BorrowerInfo (if borrowed)
│       ├── BorrowerName
│       └── BorrowedDate
│
├── QRScannerModal (NEW)
│   ├── CameraView
│   ├── ScanOverlay
│   ├── CloseButton
│   └── ConfirmationDialog
│       ├── BorrowConfirmation
│       │   ├── BookInfo
│       │   ├── ConfirmButton
│       │   └── CancelButton
│       └── ReturnConfirmation
│           ├── BookInfo
│           ├── BorrowedDate
│           ├── ConfirmButton
│           └── CancelButton
│
├── BorrowingHistoryScreen (NEW)
│   ├── BackButton
│   ├── BorrowingList
│   │   └── BorrowingCard[]
│   │       ├── BookTitle
│   │       ├── BorrowedDate
│   │       ├── ReturnedDate (if returned)
│   │       └── StatusBadge
│   └── EmptyState
│
└── MeScreenMobile (Updated)
    ├── ProfileHeader
    ├── BorrowedBooksCount (NEW)
    ├── BorrowingHistoryLink (NEW)
    └── ... (existing sections)
```

## Components and Interfaces

### Frontend Components

#### 1. BooksScreenMobile

**Purpose**: Hiển thị danh sách tất cả sách có sẵn từ Phòng HCM

**Props**:
```typescript
interface BooksScreenMobileProps {
  onBookClick?: (bookId: string) => void;
}
```

**State**:
```typescript
interface BooksScreenState {
  books: Book[];
  loading: boolean;
  searchTerm: string;
  statusFilter: 'ALL' | 'AVAILABLE' | 'BORROWED';
  error: string | null;
}
```

**Key Features**:
- Real-time search by title and author
- Filter by book status (Sẵn sàng / Đang mượn)
- Pull-to-refresh functionality
- Loading states and error handling
- Empty state when no books found

**API Integration**:
- Calls `GET /api/books` on mount and refresh
- Applies client-side filtering for search and status


#### 2. BookDetailMobile

**Purpose**: Hiển thị thông tin chi tiết của một cuốn sách

**Props**:
```typescript
interface BookDetailMobileProps {
  bookId: string;
  onBack: () => void;
}
```

**State**:
```typescript
interface BookDetailState {
  book: Book | null;
  loading: boolean;
  error: string | null;
}
```

**Key Features**:
- Display full book information
- Show current status (Available/Borrowed)
- Show borrower info if book is borrowed
- Back navigation

**API Integration**:
- Calls `GET /api/books/:id` on mount

#### 3. QRScannerModal

**Purpose**: Quét mã QR để mượn hoặc trả sách

**Props**:
```typescript
interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}
```

**State**:
```typescript
interface QRScannerState {
  scanning: boolean;
  cameraPermission: 'granted' | 'denied' | 'prompt';
  scannedBook: Book | null;
  showConfirmation: boolean;
  confirmationType: 'borrow' | 'return' | null;
  processing: boolean;
}
```

**Key Features**:
- Request camera permission on open
- Continuous QR code scanning
- Show confirmation dialog based on book status
- Handle borrow/return actions
- Error handling for invalid QR codes

**API Integration**:
- Calls `GET /api/books/scan/:qrCode` when QR detected
- Calls `POST /api/books/:id/borrow` for borrowing
- Calls `POST /api/books/borrowings/:id/return` for returning

**Capacitor Integration**:
```typescript
import { Camera, CameraResultType } from '@capacitor/camera';
// OR
import { QRScanner } from 'capacitor-plugin-qrscanner';
```

#### 4. BorrowingHistoryScreen

**Purpose**: Hiển thị lịch sử mượn sách của người dùng

**Props**:
```typescript
interface BorrowingHistoryScreenProps {
  onBack: () => void;
}
```

**State**:
```typescript
interface BorrowingHistoryState {
  borrowings: BookBorrowing[];
  loading: boolean;
  error: string | null;
}
```

**Key Features**:
- Display all borrowing records sorted by date (newest first)
- Show book title, borrowed date, and return date
- Distinguish between active and returned borrowings
- Empty state when no history

**API Integration**:
- Calls `GET /api/books/my-borrows` on mount

#### 5. BottomNavigation (Updated)

**Updates Required**:
- Add "Sách" tab with book icon
- Add circular QR scan button in center position
- Reposition existing tabs to accommodate new items

**Layout**:
```
[Trang chủ] [Tài liệu] [QR Scan] [Sách] [Học tập]
```

#### 6. MeScreenMobile (Updated)

**Updates Required**:
- Add "Sách đang mượn" section showing count of active borrowings
- Add "Lịch sử mượn sách" menu item linking to BorrowingHistoryScreen

**New State**:
```typescript
interface MeScreenState {
  // ... existing state
  borrowedBooksCount: number;
}
```

**API Integration**:
- Fetch borrowed books count from `GET /api/books/my-borrows` and filter by `returnedAt === null`

### Backend API Endpoints


#### 1. GET /api/books

**Purpose**: Lấy danh sách tất cả sách

**Authentication**: Required (JWT token)

**Query Parameters**:
```typescript
interface GetBooksQuery {
  search?: string;  // Search by title or author
  status?: 'AVAILABLE' | 'BORROWED';
  page?: number;
  limit?: number;
}
```

**Response**:
```typescript
interface GetBooksResponse {
  success: boolean;
  data: {
    data: Book[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

interface Book {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  qrCode: string;
  status: 'AVAILABLE' | 'BORROWED';  // Computed field
  createdAt: string;
  updatedAt: string;
}
```

**Business Logic**:
1. Query all books from database
2. For each book, check if there's an active borrowing (returnedAt === null)
3. Set status to 'BORROWED' if active borrowing exists, otherwise 'AVAILABLE'
4. Apply search filter if provided (case-insensitive match on title or author)
5. Apply status filter if provided
6. Return paginated results

**Error Responses**:
- 401: Unauthorized (invalid or missing token)
- 500: Internal server error

#### 2. GET /api/books/:id

**Purpose**: Lấy thông tin chi tiết một cuốn sách

**Authentication**: Required (JWT token)

**Path Parameters**:
- `id`: Book ID (string)

**Response**:
```typescript
interface GetBookResponse {
  success: boolean;
  data: BookDetail;
}

interface BookDetail extends Book {
  currentBorrower?: {
    id: string;
    fullName: string;
    borrowedAt: string;
  };
}
```

**Business Logic**:
1. Query book by ID
2. If book has active borrowing, include borrower information
3. Return book details with status

**Error Responses**:
- 401: Unauthorized
- 404: Book not found
- 500: Internal server error

#### 3. GET /api/books/scan/:qrCode

**Purpose**: Lấy thông tin sách qua mã QR

**Authentication**: Required (JWT token)

**Path Parameters**:
- `qrCode`: QR code value (string)

**Response**:
```typescript
interface ScanBookResponse {
  success: boolean;
  data: BookDetail;
}
```

**Business Logic**:
1. Query book by qrCode (unique field)
2. Calculate current status
3. If borrowed, include current borrower info
4. Return book details

**Error Responses**:
- 401: Unauthorized
- 404: Book not found (invalid QR code)
- 500: Internal server error

#### 4. POST /api/books/:id/borrow

**Purpose**: Mượn sách

**Authentication**: Required (JWT token)

**Path Parameters**:
- `id`: Book ID (string)

**Request Body**: None (userId extracted from JWT token)

**Response**:
```typescript
interface BorrowBookResponse {
  success: boolean;
  data: {
    borrowing: BookBorrowing;
    message: string;
  };
}

interface BookBorrowing {
  id: string;
  bookId: string;
  userId: string;
  borrowedAt: string;
  returnedAt: string | null;
  createdAt: string;
}
```

**Business Logic**:
1. Verify book exists
2. Check if book has active borrowing (use database transaction with row locking)
3. If book is already borrowed, return 400 error
4. Create new borrowing record with current timestamp
5. Return created borrowing record

**Concurrency Handling**:
```typescript
// Use Prisma transaction with SELECT FOR UPDATE
await prisma.$transaction(async (tx) => {
  const book = await tx.book.findUnique({
    where: { id: bookId },
    include: {
      borrowings: {
        where: { returnedAt: null },
        take: 1
      }
    }
  });
  
  if (book.borrowings.length > 0) {
    throw new Error('Book already borrowed');
  }
  
  const borrowing = await tx.bookBorrowing.create({
    data: {
      bookId,
      userId,
      borrowedAt: new Date()
    }
  });
  
  return borrowing;
});
```

**Error Responses**:
- 400: Book already borrowed
- 401: Unauthorized
- 404: Book not found
- 500: Internal server error


#### 5. POST /api/books/borrowings/:id/return

**Purpose**: Trả sách

**Authentication**: Required (JWT token)

**Path Parameters**:
- `id`: Borrowing ID (string)

**Request Body**: None (userId extracted from JWT token)

**Response**:
```typescript
interface ReturnBookResponse {
  success: boolean;
  data: {
    borrowing: BookBorrowing;
    message: string;
  };
}
```

**Business Logic**:
1. Verify borrowing record exists
2. Check if userId matches the borrower (authorization)
3. Check if book is already returned (returnedAt !== null)
4. Update borrowing record with returnedAt timestamp
5. Return updated borrowing record

**Error Responses**:
- 400: Book already returned
- 401: Unauthorized
- 403: Forbidden (user is not the borrower)
- 404: Borrowing record not found
- 500: Internal server error

#### 6. GET /api/books/my-borrows

**Purpose**: Lấy lịch sử mượn sách của người dùng hiện tại

**Authentication**: Required (JWT token)

**Query Parameters**:
```typescript
interface GetMyBorrowsQuery {
  status?: 'active' | 'returned';  // Filter by status
  page?: number;
  limit?: number;
}
```

**Response**:
```typescript
interface GetMyBorrowsResponse {
  success: boolean;
  data: {
    data: BorrowingWithBook[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

interface BorrowingWithBook extends BookBorrowing {
  book: {
    id: string;
    title: string;
    author: string | null;
    publisher: string | null;
  };
}
```

**Business Logic**:
1. Query all borrowings for current user (from JWT token)
2. Include book information for each borrowing
3. Apply status filter if provided:
   - 'active': returnedAt === null
   - 'returned': returnedAt !== null
4. Sort by borrowedAt descending (newest first)
5. Return paginated results

**Error Responses**:
- 401: Unauthorized
- 500: Internal server error

#### 7. GET /api/books/admin/stats

**Purpose**: Lấy thống kê mượn sách cho admin

**Authentication**: Required (JWT token with ADMIN or LEADER role)

**Response**:
```typescript
interface GetAdminStatsResponse {
  success: boolean;
  data: {
    totalBooks: number;
    availableBooks: number;
    borrowedBooks: number;
    totalBorrowings: number;
    activeBorrowings: number;
    recentBorrowings: BorrowingWithBookAndUser[];
  };
}

interface BorrowingWithBookAndUser extends BookBorrowing {
  book: {
    id: string;
    title: string;
    author: string | null;
  };
  user: {
    id: string;
    fullName: string;
  };
}
```

**Business Logic**:
1. Verify user has ADMIN or LEADER role
2. Calculate statistics:
   - Total books count
   - Available books (no active borrowing)
   - Borrowed books (has active borrowing)
   - Total borrowings count
   - Active borrowings count
3. Get recent borrowings (last 20) with book and user info
4. Return statistics

**Error Responses**:
- 401: Unauthorized
- 403: Forbidden (not admin/leader)
- 500: Internal server error

## Data Models

### Database Schema

#### Book Model (Existing)

```prisma
model Book {
  id          String   @id @default(cuid())
  title       String
  author      String?
  publisher   String?
  qrCode      String   @unique @map("qr_code")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  borrowings  BookBorrowing[]

  @@map("books")
}
```

**Constraints**:
- `qrCode` must be unique
- `title` is required
- `author` and `publisher` are optional


#### BookBorrowing Model (Existing)

```prisma
model BookBorrowing {
  id          String    @id @default(cuid())
  bookId      String    @map("book_id")
  userId      String    @map("user_id")
  borrowedAt  DateTime  @default(now()) @map("borrowed_at")
  returnedAt  DateTime? @map("returned_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  book Book @relation(fields: [bookId], references: [id])
  user User @relation(fields: [userId], references: [id])

  @@map("book_borrowings")
}
```

**Constraints**:
- `bookId` references `books.id`
- `userId` references `users.id`
- `borrowedAt` defaults to current timestamp
- `returnedAt` is nullable (null means book is still borrowed)

**Indexes** (Recommended for performance):
```prisma
@@index([bookId, returnedAt])  // For checking active borrowings
@@index([userId, borrowedAt])  // For user borrowing history
```

### TypeScript Interfaces

#### Frontend Types

```typescript
// lib/types/book.ts

export interface Book {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  qrCode: string;
  status: 'AVAILABLE' | 'BORROWED';
  createdAt: string;
  updatedAt: string;
}

export interface BookDetail extends Book {
  currentBorrower?: {
    id: string;
    fullName: string;
    borrowedAt: string;
  };
}

export interface BookBorrowing {
  id: string;
  bookId: string;
  userId: string;
  borrowedAt: string;
  returnedAt: string | null;
  createdAt: string;
  book?: {
    id: string;
    title: string;
    author: string | null;
    publisher: string | null;
  };
}

export interface BorrowingHistory {
  borrowings: BookBorrowing[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

#### API Service Types

```typescript
// lib/api.ts (additions)

export const bookApi = {
  // Get all books
  async getBooks(params?: {
    search?: string;
    status?: 'AVAILABLE' | 'BORROWED';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: Book[]; pagination: any }>>,

  // Get book by ID
  async getBookById(id: string): Promise<ApiResponse<BookDetail>>,

  // Scan QR code
  async scanBook(qrCode: string): Promise<ApiResponse<BookDetail>>,

  // Borrow book
  async borrowBook(bookId: string): Promise<ApiResponse<{ borrowing: BookBorrowing; message: string }>>,

  // Return book
  async returnBook(borrowingId: string): Promise<ApiResponse<{ borrowing: BookBorrowing; message: string }>>,

  // Get my borrowing history
  async getMyBorrows(params?: {
    status?: 'active' | 'returned';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: BookBorrowing[]; pagination: any }>>,

  // Admin: Get statistics
  async getAdminStats(): Promise<ApiResponse<AdminStats>>
};
```

## State Management

### Local Component State

Hệ thống sử dụng React hooks (`useState`, `useEffect`) cho state management tại component level. Không cần Redux hoặc global state management vì:
- Các màn hình độc lập, ít chia sẻ state
- Data được fetch fresh từ API khi cần
- Đơn giản hóa architecture

### State Patterns

#### 1. Loading States

```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState<T | null>(null);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getData();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

#### 2. Form States

```typescript
const [processing, setProcessing] = useState(false);
const [showConfirmation, setShowConfirmation] = useState(false);

const handleSubmit = async () => {
  setProcessing(true);
  try {
    const result = await api.submitData();
    if (result.success) {
      onSuccess(result.message);
      setShowConfirmation(false);
    } else {
      onError(result.error);
    }
  } catch (err) {
    onError('Network error');
  } finally {
    setProcessing(false);
  }
};
```

#### 3. Toast Notifications

```typescript
const [toast, setToast] = useState<{
  show: boolean;
  message: string;
  type: 'success' | 'error';
}>({ show: false, message: '', type: 'success' });

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  setToast({ show: true, message, type });
  setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
};
```

### Data Refresh Strategy

- **Pull-to-refresh**: Implemented on list screens (BooksScreenMobile, BorrowingHistoryScreen)
- **Auto-refresh**: Use `useAutoRefresh` hook (existing pattern) for periodic updates
- **Manual refresh**: After mutations (borrow/return), refresh affected screens

