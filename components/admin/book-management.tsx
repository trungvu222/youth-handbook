"use client";

import { useState, useEffect, useMemo } from "react";
import { bookApi, Book, BookBorrowing, BookStats } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  BookOpen,
  QrCode,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
} from "lucide-react";

interface BorrowingRecord {
  stt: number;
  id: string;
  borrower: string;
  borrowerUnit: string;
  bookTitle: string;
  author: string;
  publisher: string;
  borrowedAt: string
  dueDate: string | null
  returnedAt: string | null
  status: string;
}

export function BookManagement() {
  const { toast } = useToast();

  // State
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowings, setBorrowings] = useState<BorrowingRecord[]>([]);
  const [stats, setStats] = useState<BookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"books" | "stats">("books");

  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    publisher: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Load data
  useEffect(() => {
    loadBooks();
    loadStats();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await bookApi.getBooks();
      if (response.success && response.data) {
        setBooks(response.data);
      } else {
        toast({
          title: "Lỗi",
          description: response.error || "Không thể tải danh sách sách",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể kết nối server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (status?: "borrowed" | "returned") => {
    try {
      const response = await bookApi.getBorrowingStats(status);
      if (response.success && response.data) {
        setStats(response.data.stats);
        setBorrowings(response.data.borrowings);
      }
    } catch (error) {
      console.error("Load stats error:", error);
    }
  };

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        !searchTerm ||
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (book.author &&
          book.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (book.publisher &&
          book.publisher.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }, [books, searchTerm]);

  // Filter borrowings
  const filteredBorrowings = useMemo(() => {
    return borrowings.filter((b) => {
      if (statusFilter === "borrowed") return !b.returnedAt;
      if (statusFilter === "returned") return !!b.returnedAt;
      return true;
    });
  }, [borrowings, statusFilter]);

  // Return borrowing for admin
  const handleReturnBorrowing = async (borrowingId: string) => {
    try {
      setLoading(true);
      const response = await bookApi.returnBook(borrowingId);
      if (response.success) {
        toast({ title: "Thành công", description: "Đã đánh dấu trả sách" });
        loadStats(statusFilter === "all" ? undefined : (statusFilter as any));
        loadBooks();
      } else {
        toast({
          title: "Lỗi",
          description:
            response.error || "Không thể cập nhật trạng thái trả sách",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể kết nối server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBooks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);

  // CRUD handlers
  const resetForm = () => {
    setFormData({ title: "", author: "", publisher: "" });
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên sách",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await bookApi.createBook(formData);
      if (response.success) {
        toast({ title: "Thành công", description: "Đã thêm sách mới" });
        setShowCreateDialog(false);
        resetForm();
        loadBooks();
      } else {
        toast({
          title: "Lỗi",
          description: response.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thêm sách",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedBook || !formData.title.trim()) return;

    try {
      const response = await bookApi.updateBook(selectedBook.id, formData);
      if (response.success) {
        toast({ title: "Thành công", description: "Đã cập nhật sách" });
        setShowEditDialog(false);
        resetForm();
        loadBooks();
      } else {
        toast({
          title: "Lỗi",
          description: response.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật sách",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedBook) return;

    try {
      const response = await bookApi.deleteBook(selectedBook.id);
      if (response.success) {
        toast({ title: "Thành công", description: "Đã xóa sách" });
        setShowDeleteDialog(false);
        setSelectedBook(null);
        loadBooks();
      } else {
        toast({
          title: "Lỗi",
          description: response.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa sách",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (book: Book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author || "",
      publisher: book.publisher || "",
    });
    setShowEditDialog(true);
  };

  const openQRDialog = (book: Book) => {
    setSelectedBook(book);
    setShowQRDialog(true);
  };

  const printQRCode = () => {
    if (!selectedBook) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
        <head>
          <title>QR Code - ${selectedBook.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .qr-container {
              border: 2px solid #333;
              padding: 20px;
              display: inline-block;
              margin: 20px;
            }
            .book-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .book-info {
              font-size: 12px;
              color: #666;
              margin-bottom: 15px;
            }
            .qr-code {
              margin-bottom: 10px;
            }
            .qr-text {
              font-size: 10px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="book-title">${selectedBook.title}</div>
            <div class="book-info">${selectedBook.author || ""} - ${selectedBook.publisher || ""}</div>
            <div class="qr-code">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedBook.qrCode)}" alt="QR Code" />
            </div>
            <div class="qr-text">Mã: ${selectedBook.qrCode}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  if (loading && books.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Phòng HCM</h1>
          <p className="text-gray-500">Quản lý sách và theo dõi mượn/trả</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Thêm sách
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng sách</p>
                <p className="text-2xl font-bold">
                  {stats?.totalBooks || books.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Đang mượn</p>
                <p className="text-2xl font-bold">
                  {stats?.currentlyBorrowed || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Đã trả</p>
                <p className="text-2xl font-bold">{stats?.returned || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <QrCode className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Tổng lượt mượn</p>
                <p className="text-2xl font-bold">
                  {stats?.totalBorrowings || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium ${activeTab === "books" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("books")}
        >
          Quản lý sách
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === "stats" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
          onClick={() => {
            setActiveTab("stats");
            loadStats();
          }}
        >
          Thống kê mượn trả
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "books" ? (
        <>
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm sách..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadBooks}>
              <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
            </Button>
          </div>

          {/* Books Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Tên sách
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Tác giả
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Nhà xuất bản
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Mã QR
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedBooks.map((book, index) => (
                      <tr key={book.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{book.title}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {book.author || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {book.publisher || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              book.isBorrowed ? "destructive" : "secondary"
                            }
                          >
                            {book.isBorrowed ? "Đang mượn" : "Sẵn sàng"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openQRDialog(book)}
                          >
                            <QrCode className="h-4 w-4 mr-1" />
                            Xem QR
                          </Button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(book)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedBook(book);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedBooks.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          Không có sách nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredBooks.length)} /{" "}
                {filteredBooks.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                loadStats(v === "all" ? undefined : (v as any));
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="borrowed">Đang mượn</SelectItem>
                <SelectItem value="returned">Đã trả</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => loadStats()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
            </Button>
          </div>

          {/* Borrowings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Thống kê mượn/trả sách</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        STT
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Người mượn
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Tên sách
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Tác giả
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Nhà xuất bản
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Thời gian mượn
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        Thời gian trả/Dự kiến
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBorrowings.map((b, index) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{index + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-sm">{b.borrower}</p>
                          <p className="text-xs text-gray-500">
                            {b.borrowerUnit}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm">{b.bookTitle}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {b.author || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {b.publisher || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {formatDate(b.borrowedAt)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {b.returnedAt ? (
                            <div>
                              <div className="text-green-600 font-medium">Đã trả: {formatDate(b.returnedAt)}</div>
                              {b.dueDate && <div className="text-xs text-gray-500">Dự kiến: {formatDate(b.dueDate)}</div>}
                            </div>
                          ) : (
                            <div>
                              <Badge variant="outline" className="text-orange-600 border-orange-300 mb-1">Chưa trả</Badge>
                              {b.dueDate && <div className="text-xs text-gray-500">Dự kiến: {formatDate(b.dueDate)}</div>}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!b.returnedAt ? (
                            <Button
                              size="sm"
                              onClick={() => handleReturnBorrowing(b.id)}
                            >
                              Trả sách
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" disabled>
                              Đã trả
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredBorrowings.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-gray-500"
                        >
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm sách mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên sách *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Nhập tên sách"
              />
            </div>
            <div>
              <Label>Tác giả</Label>
              <Input
                value={formData.author}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, author: e.target.value }))
                }
                placeholder="Nhập tên tác giả"
              />
            </div>
            <div>
              <Label>Nhà xuất bản</Label>
              <Input
                value={formData.publisher}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    publisher: e.target.value,
                  }))
                }
                placeholder="Nhập nhà xuất bản"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleCreate}>Thêm sách</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa thông tin sách</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên sách *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Tác giả</Label>
              <Input
                value={formData.author}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, author: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Nhà xuất bản</Label>
              <Input
                value={formData.publisher}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    publisher: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdate}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Bạn có chắc muốn xóa sách "{selectedBook?.title}"? Hành động này
            không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Mã QR - {selectedBook?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedBook?.qrCode || "")}`}
              alt="QR Code"
              className="border rounded-lg"
            />
            <p className="text-sm text-gray-500">Mã: {selectedBook?.qrCode}</p>
            {selectedBook?.author && (
              <p className="text-sm">Tác giả: {selectedBook.author}</p>
            )}
            {selectedBook?.publisher && (
              <p className="text-sm">NXB: {selectedBook.publisher}</p>
            )}
          </div>
          <DialogFooter className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setShowQRDialog(false)}>
              Đóng
            </Button>
            <Button onClick={printQRCode}>
              <Printer className="h-4 w-4 mr-2" /> In QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
