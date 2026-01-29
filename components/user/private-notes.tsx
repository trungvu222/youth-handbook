"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StickyNote, Plus, Search, Calendar, Edit, Trash2 } from "lucide-react"

const mockNotes = [
  {
    id: 1,
    title: "Ý tưởng hoạt động tháng 3",
    content: "Tổ chức workshop về kỹ năng mềm cho đoàn viên. Liên hệ diễn giả từ các công ty công nghệ.",
    tags: ["hoạt động", "workshop"],
    createdAt: "2024-01-20",
    updatedAt: "2024-01-22",
  },
  {
    id: 2,
    title: "Ghi chú cuộc họp BCH",
    content: "Quyết định tăng ngân sách cho hoạt động ngoại khóa. Cần lập kế hoạch chi tiết cho quý 2.",
    tags: ["họp", "ngân sách"],
    createdAt: "2024-01-18",
    updatedAt: "2024-01-18",
  },
  {
    id: 3,
    title: "Danh sách cần liên hệ",
    content: "Anh Minh - 0901234567 (thiết kế poster)\nChị Lan - 0912345678 (MC sự kiện)",
    tags: ["liên hệ"],
    createdAt: "2024-01-15",
    updatedAt: "2024-01-19",
  },
]

export default function PrivateNotes() {
  const [notes, setNotes] = useState(mockNotes)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<number | null>(null)
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    tags: "",
  })

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleSaveNote = () => {
    if (!newNote.title || !newNote.content) return

    const note = {
      id: Date.now(),
      title: newNote.title,
      content: newNote.content,
      tags: newNote.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    }

    if (editingNote) {
      setNotes((prev) => prev.map((n) => (n.id === editingNote ? { ...note, id: editingNote } : n)))
      setEditingNote(null)
    } else {
      setNotes((prev) => [note, ...prev])
    }

    setNewNote({ title: "", content: "", tags: "" })
    setIsCreating(false)
  }

  const handleEditNote = (note: (typeof mockNotes)[0]) => {
    setNewNote({
      title: note.title,
      content: note.content,
      tags: note.tags.join(", "),
    })
    setEditingNote(note.id)
    setIsCreating(true)
  }

  const handleDeleteNote = (id: number) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const handleCancel = () => {
    setNewNote({ title: "", content: "", tags: "" })
    setEditingNote(null)
    setIsCreating(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Ghi chú cá nhân</h2>
        <p className="text-gray-600 mt-2">Lưu trữ những ý tưởng và ghi chú quan trọng</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm kiếm ghi chú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />
          Tạo mới
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-amber-600" />
              {editingNote ? "Chỉnh sửa ghi chú" : "Tạo ghi chú mới"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Tiêu đề ghi chú..."
                value={newNote.title}
                onChange={(e) => setNewNote((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Textarea
                placeholder="Nội dung ghi chú..."
                value={newNote.content}
                onChange={(e) => setNewNote((prev) => ({ ...prev, content: e.target.value }))}
                className="min-h-[120px]"
              />
            </div>
            <div>
              <Input
                placeholder="Tags (phân cách bằng dấu phẩy)..."
                value={newNote.tags}
                onChange={(e) => setNewNote((prev) => ({ ...prev, tags: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveNote}
                disabled={!newNote.title || !newNote.content}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {editingNote ? "Cập nhật" : "Lưu ghi chú"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {filteredNotes.map((note) => (
          <Card key={note.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{note.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditNote(note)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Tạo: {note.createdAt}
                </div>
                {note.updatedAt !== note.createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Sửa: {note.updatedAt}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{searchTerm ? "Không tìm thấy ghi chú nào" : "Chưa có ghi chú nào"}</p>
        </div>
      )}
    </div>
  )
}
