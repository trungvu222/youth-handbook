"use client";

import { useState, useEffect, useRef } from "react";
import { bookApi, Book } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  QrCode,
  Camera,
  BookOpen,
  Clock,
  Check,
  X,
  RefreshCw,
  Keyboard,
} from "lucide-react";

export function LibraryScreen() {
  const { toast } = useToast();

  // State
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [scannedBook, setScannedBook] = useState<Book | null>(null);
  const [borrowingTime, setBorrowingTime] = useState<string>("");
  const [returnDate, setReturnDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);

  // QR Scanner ref
  const qrScannerRef = useRef<any>(null);

  // Start scanning - Manual input only (camera disabled)
  const startScanning = async () => {
    setScanning(true);
    setScannedBook(null);
    setScanMode("manual"); // Force manual mode
  };

  // Stop scanning
  const stopScanning = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
      } catch (e) {}
      qrScannerRef.current = null;
    }
    setScanning(false);
  };

  // Handle QR code scanned
  const handleQRCodeScanned = async (qrCode: string) => {
    setLoading(true);
    try {
      const response = await bookApi.getBookByQR(qrCode);
      if (response.success && response.data) {
        setScannedBook(response.data);
        // Khoảng thời gian mượn hiển thị là thời điểm quét / xác nhận gần đúng
        setBorrowingTime(new Date().toLocaleString("vi-VN"));
        setShowBorrowDialog(true);
      } else {
        toast({
          title: "Không tìm thấy sách",
          description: response.error || "Mã QR không hợp lệ",
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
      setScanning(false);
    }
  };

  // Handle manual code submit
  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập mã QR",
        variant: "destructive",
      });
      return;
    }
    handleQRCodeScanned(manualCode.trim());
    setManualCode("");
  };

  // Handle borrow book
  const handleBorrowBook = async () => {
    if (!scannedBook) return;

    if (!returnDate) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn thời gian trả sách",
        variant: "destructive",
      });
      return;
    }

    if (!isReturnDateWithinLimit(returnDate)) {
      toast({
        title: "Lỗi",
        description:
          "Thời gian trả sách không được quá 2 tháng kể từ thời điểm mượn",
        variant: "destructive",
      });
      return;
    }

    const confirmedBorrowingTime = new Date().toLocaleString("vi-VN");
    setBorrowingTime(confirmedBorrowingTime);

    setLoading(true);
    try {
      const response = await bookApi.borrowBook(scannedBook.id, {
        returnDate,
      });

      if (response.success) {
        toast({
          title: "Mượn sách thành công!",
          description: `Đã mượn sách "${scannedBook.title}". Hẹn trả: ${new Date(returnDate).toLocaleDateString("vi-VN")}`,
        });
        setShowBorrowDialog(false);
        setScannedBook(null);
        setReturnDate("");
      } else {
        toast({
          title: "Không thể mượn sách",
          description: response.error || "Có lỗi xảy ra",
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Get min date for return (tomorrow)
  const getMinReturnDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Get max return date (2 months from now)
  const getMaxReturnDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);
    return maxDate.toISOString().split("T")[0];
  };

  const isReturnDateWithinLimit = (dateString: string) => {
    if (!dateString) return false;
    const chosen = new Date(dateString);
    const max = new Date();
    max.setMonth(max.getMonth() + 2);
    return chosen <= max;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Phòng Hồ Chí Minh</h1>
        <p className="text-gray-500 mt-1">Quét mã QR để mượn sách</p>
      </div>

      {/* Main Card */}
      <Card>
        <CardContent className="p-6">
          {!scanning ? (
            <div className="space-y-6">
              {/* Start Scan Button */}
              <div className="flex flex-col items-center gap-4">
                <div className="p-6 bg-blue-50 rounded-full">
                  <QrCode className="h-16 w-16 text-blue-500" />
                </div>
                <Button
                  size="lg"
                  className="w-full max-w-xs"
                  onClick={startScanning}
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Quét mã QR mượn sách
                </Button>
              </div>

              {/* Or divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t"></div>
                <span className="text-gray-400 text-sm">hoặc</span>
                <div className="flex-1 border-t"></div>
              </div>

              {/* Manual Input */}
              <div className="space-y-3">
                <Label>Nhập mã sách thủ công</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập mã QR sách..."
                    value={manualCode}
                    onChange={(e) =>
                      setManualCode(e.target.value.toUpperCase())
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  />
                  <Button onClick={handleManualSubmit} disabled={loading}>
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Scanner Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Quét mã QR</h3>
                <Button variant="ghost" size="sm" onClick={stopScanning}>
                  <X className="h-4 w-4 mr-1" /> Hủy
                </Button>
              </div>

              {/* Mode Toggle - Camera disabled */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  className="flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 text-sm font-medium text-gray-400 cursor-not-allowed"
                  disabled
                >
                  <Camera className="h-4 w-4" /> Quét QR (Không khả dụng)
                </button>
                <button
                  className="flex-1 py-2 px-3 rounded-md flex items-center justify-center gap-2 text-sm font-medium bg-white shadow text-blue-600"
                >
                  <Keyboard className="h-4 w-4" /> Nhập mã
                </button>
              </div>

              {/* Manual Input Only */}
              <div className="space-y-3">
                <Input
                  placeholder="Nhập mã QR sách..."
                  value={manualCode}
                  onChange={(e) =>
                    setManualCode(e.target.value.toUpperCase())
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  autoFocus
                />
                <Button
                  className="w-full"
                  onClick={handleManualSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Đang
                      tìm...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" /> Xác nhận
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hướng dẫn mượn sách</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
              1
            </div>
            <p className="text-sm text-gray-600">
              Đến kệ sách và chọn quyển sách muốn mượn
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
              2
            </div>
            <p className="text-sm text-gray-600">
              Quét mã QR dán trên bìa sách
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
              3
            </div>
            <p className="text-sm text-gray-600">
              Chọn ngày dự kiến trả sách và xác nhận mượn
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
              4
            </div>
            <p className="text-sm text-gray-600">
              Mang sách về và trả đúng hẹn
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Borrow Dialog */}
      <Dialog open={showBorrowDialog} onOpenChange={setShowBorrowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận mượn sách</DialogTitle>
          </DialogHeader>

          {scannedBook && (
            <div className="space-y-4">
              {/* Book Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-10 w-10 text-blue-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg">
                      {scannedBook.title}
                    </h3>
                    {scannedBook.author && (
                      <p className="text-sm text-gray-600">
                        Tác giả: {scannedBook.author}
                      </p>
                    )}
                    {scannedBook.publisher && (
                      <p className="text-sm text-gray-600">
                        NXB: {scannedBook.publisher}
                      </p>
                    )}
                  </div>
                </div>

                {scannedBook.isBorrowed && (
                  <Badge variant="destructive" className="mt-2">
                    Sách đang được mượn bởi người khác
                  </Badge>
                )}
              </div>

              {/* Borrow Time */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Thời gian mượn
                </Label>
                <Input value={borrowingTime} disabled className="bg-gray-50" />
              </div>

              {/* Return Date */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Thời gian trả (dự kiến) *
                </Label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  min={getMinReturnDate()}
                  max={getMaxReturnDate()}
                />
                <p className="text-xs text-gray-500">
                  Chọn ngày trả trong khoảng {getMinReturnDate()} -{" "}
                  {getMaxReturnDate()} (tối đa 2 tháng)
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBorrowDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleBorrowBook}
              disabled={loading || scannedBook?.isBorrowed}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Đang xử
                  lý...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" /> Xác nhận mượn
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
