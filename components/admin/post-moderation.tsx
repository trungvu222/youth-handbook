"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Newspaper, Clock, CheckCircle2, XCircle, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { BACKEND_URL } from "@/lib/config"

const API_URL = BACKEND_URL

interface Post {
  id: string
  title: string
  content: string
  status: string
  postType: string
  createdAt: string
  moderationNote?: string
  author?: { fullName: string; email?: string }
}

type TabKey = "PENDING" | "APPROVED" | "REJECTED" | "ALL"

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: "Chờ duyệt", color: "#92400e", bg: "#fef3c7" },
  APPROVED: { label: "Đã duyệt",  color: "#065f46", bg: "#d1fae5" },
  REJECTED: { label: "Từ chối",   color: "#991b1b", bg: "#fee2e2" },
  DRAFT:    { label: "Nháp",      color: "#374151", bg: "#f3f4f6" },
}

const TYPE_CFG: Record<string, { label: string; accent: string }> = {
  ANNOUNCEMENT: { label: "Thông báo", accent: "#3b82f6" },
  NEWS:         { label: "Tin tức",   accent: "#8b5cf6" },
  SUGGESTION:   { label: "Kiến nghị", accent: "#f59e0b" },
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return "Vừa xong"
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`
  return new Date(dateStr).toLocaleDateString("vi-VN")
}

function initials(name?: string) {
  if (!name) return "?"
  const parts = name.trim().split(" ")
  return parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0]
}

/* ── stat card config ── */
const STAT_CARDS = [
  { key: "total", label: "Tổng bài viết", from: "blue-500", to: "indigo-600", Icon: FileText },
  { key: "pending", label: "Chờ duyệt", from: "amber-500", to: "orange-500", Icon: Clock },
  { key: "approved", label: "Đã xuất bản", from: "emerald-500", to: "green-600", Icon: CheckCircle2 },
  { key: "rejected", label: "Đã từ chối", from: "red-500", to: "rose-600", Icon: XCircle },
] as const

export function PostModeration() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>("PENDING")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [moderationNote, setModerationNote] = useState("")
  const [actioning, setActioning] = useState<"approve" | "reject" | null>(null)
  const [toastMsg, setToastMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 5

  function showToast(text: string, ok = true) {
    setToastMsg({ text, ok })
    setTimeout(() => setToastMsg(null), 3200)
  }

  const fetchPosts = async (silent = false) => {
    if (!silent) setLoading(true)
    setRefreshing(true)
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/posts?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const list = data.data || data.posts || data || []
        setPosts(Array.isArray(list) ? list : [])
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchPosts() }, [])

  const handleModerate = async (id: string, action: "approve" | "reject") => {
    const status = action === "approve" ? "APPROVED" : "REJECTED"
    setActioning(action)
    try {
      const token = localStorage.getItem("accessToken")
      const res = await fetch(`${API_URL}/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, moderationNote: moderationNote.trim() || undefined }),
      })
      if (res.ok) {
        showToast(action === "approve" ? "Đã duyệt và xuất bản bài viết" : "Đã từ chối bài viết", action === "approve")
        setSelectedPost(null)
        setModerationNote("")
        fetchPosts(true)
      } else { showToast("Có lỗi xảy ra, vui lòng thử lại", false) }
    } catch { showToast("Lỗi kết nối đến máy chủ", false) }
    finally { setActioning(null) }
  }

  const pending  = posts.filter(p => p.status === "PENDING")
  const approved = posts.filter(p => p.status === "APPROVED")
  const rejected = posts.filter(p => p.status === "REJECTED")
  const displayPosts = activeTab === "ALL" ? posts : posts.filter(p => p.status === activeTab)
  const totalPages = Math.max(1, Math.ceil(displayPosts.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedPosts = displayPosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const counts: Record<string, number> = { total: posts.length, pending: pending.length, approved: approved.length, rejected: rejected.length }

  const TABS: { key: TabKey; label: string; count: number; color: string }[] = [
    { key: "PENDING",  label: "Chờ duyệt", count: pending.length,  color: "#d97706" },
    { key: "APPROVED", label: "Đã duyệt",  count: approved.length, color: "#059669" },
    { key: "REJECTED", label: "Từ chối",   count: rejected.length, color: "#dc2626" },
    { key: "ALL",      label: "Tất cả",    count: posts.length,    color: "#475569" },
  ]

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <RefreshCw className="h-7 w-7 animate-spin text-orange-500" />
      <p className="text-gray-400 text-sm">Đang tải danh sách bài viết...</p>
    </div>
  )

  /* ── gradient CSS for stat cards (Tailwind can't do dynamic from-{var}) ── */
  const gradients: Record<string, string> = {
    total:    "linear-gradient(135deg, #3b82f6, #4f46e5)",
    pending:  "linear-gradient(135deg, #f59e0b, #f97316)",
    approved: "linear-gradient(135deg, #10b981, #16a34a)",
    rejected: "linear-gradient(135deg, #ef4444, #e11d48)",
  }

  return (
    <div className="space-y-5">
      {/* ── Toast ── */}
      {toastMsg && (
        <div
          className="fixed top-5 right-5 z-[9999]"
          style={{
            background: toastMsg.ok ? "#0f172a" : "#7f1d1d",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 10px 30px rgba(0,0,0,.22)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: 340,
            animation: "pmSlideDown .3s ease",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: toastMsg.ok ? "#34d399" : "#fca5a5", flexShrink: 0 }} />
          {toastMsg.text}
        </div>
      )}

      {/* keyframes */}
      <style>{`
        @keyframes pmSlideDown { from { opacity:0; transform:translateY(-12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pmFadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* ══════════════ GRADIENT HEADER BANNER ══════════════ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 px-6 py-5 text-white shadow-lg">
        {/* pattern overlay */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%23fff' fill-opacity='.35'/%3E%3C/svg%3E\")", backgroundSize: "20px 20px" }} />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight">Duyệt bài viết</h2>
              <p className="text-sm text-orange-100 mt-0.5">Xét duyệt nội dung trước khi hiển thị cho đoàn viên</p>
            </div>
          </div>
          <button
            onClick={() => fetchPosts()}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/20 hover:bg-white/30 border-none rounded-xl backdrop-blur-sm cursor-pointer transition-all duration-200 active:scale-95"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ══════════════ STAT CARDS ══════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, Icon }) => (
          <div
            key={key}
            className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-400 hover:-translate-y-0.5"
          >
            {/* hover gradient fill */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-xl" style={{ background: gradients[key] }} />
            <div className="relative px-5 py-4 flex items-center gap-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl text-white shadow transition-all duration-400 group-hover:shadow-lg group-hover:scale-105"
                style={{ background: gradients[key] }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400 group-hover:text-white/80 transition-colors duration-400 leading-none mb-1">{label}</p>
                <p className="text-2xl font-extrabold leading-none transition-colors duration-400 group-hover:text-white" style={{ color: key === "total" ? "#3b82f6" : key === "pending" ? "#d97706" : key === "approved" ? "#059669" : "#dc2626" }}>
                  {counts[key]}
                </p>
              </div>
            </div>
            {/* bottom accent bar */}
            <div className="h-0.5 transition-transform duration-400 origin-left scale-x-0 group-hover:scale-x-100 rounded-b-xl" style={{ background: gradients[key] }} />
          </div>
        ))}
      </div>

      {/* ══════════════ PENDING ALERT ══════════════ */}
      {pending.length > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">{pending.length} bài viết đang chờ duyệt</p>
              <p className="text-xs text-amber-600 mt-0.5">Hãy xem xét và phê duyệt để hiển thị đến đoàn viên</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (pending.length === 1) {
                setSelectedPost(pending[0])
                setModerationNote("")
              } else {
                setActiveTab("PENDING")
                setCurrentPage(1)
              }
            }}
            className="px-4 py-2 text-sm font-bold text-white border-none rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 cursor-pointer shadow hover:shadow-md transition-all duration-200 active:scale-95"
          >
            Xem ngay
          </button>
        </div>
      )}

      {/* ══════════════ TABS ══════════════ */}
      <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 shadow-sm">
        {TABS.map(tab => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCurrentPage(1) }}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold border-none cursor-pointer transition-all duration-200 ${
                active ? "text-white shadow-md" : "text-gray-500 bg-transparent hover:bg-gray-50"
              }`}
              style={active ? { background: tab.color, boxShadow: `0 2px 8px ${tab.color}55` } : {}}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-md ${active ? "bg-white/25" : "bg-gray-100 text-gray-400"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ══════════════ POST LIST ══════════════ */}
      {displayPosts.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm py-16 text-center">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Newspaper className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-600 mb-1">
            {activeTab === "PENDING" ? "Không có bài nào chờ duyệt" : "Chưa có bài viết nào"}
          </p>
          <p className="text-sm text-gray-400">
            {activeTab === "PENDING" ? "Tuyệt vời! Mọi bài viết đã được xử lý" : "Danh sách trống"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          {paginatedPosts.map((post, idx) => {
            const s = STATUS_CFG[post.status] || STATUS_CFG.PENDING
            const t = TYPE_CFG[post.postType] || { label: post.postType, accent: "#64748b" }
            const isLast = idx === paginatedPosts.length - 1
            return (
              <div
                key={post.id}
                className={`px-5 py-4 hover:bg-gray-50/60 transition-colors duration-200 ${!isLast ? "border-b border-gray-50" : ""}`}
                style={{ animation: `pmFadeUp .35s ${Math.min(idx, 8) * 40}ms both ease` }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      background: `hsl(${((post.author?.fullName?.charCodeAt(0) || 65) * 7) % 360}, 50%, 92%)`,
                      color: `hsl(${((post.author?.fullName?.charCodeAt(0) || 65) * 7) % 360}, 40%, 40%)`,
                    }}
                  >
                    {initials(post.author?.fullName)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: t.accent + "14", color: t.accent }}>{t.label}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug truncate">{post.title}</h3>
                    <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">{post.content}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                      <span>{post.author?.fullName || "Ẩn danh"}</span>
                      <span className="text-gray-200">·</span>
                      <span>{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setSelectedPost(post); setModerationNote("") }}
                      className="px-3.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 text-xs font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 cursor-pointer"
                    >
                      Xem
                    </button>
                    {post.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleModerate(post.id, "approve")}
                          disabled={!!actioning}
                          className="px-3.5 py-1.5 rounded-lg border-none text-white text-xs font-bold cursor-pointer transition-all duration-150 disabled:opacity-50 active:scale-95 hover:shadow-md"
                          style={{ background: "linear-gradient(135deg,#10b981,#16a34a)" }}
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleModerate(post.id, "reject")}
                          disabled={!!actioning}
                          className="px-3.5 py-1.5 rounded-lg border-none text-white text-xs font-bold cursor-pointer transition-all duration-150 disabled:opacity-50 active:scale-95 hover:shadow-md"
                          style={{ background: "linear-gradient(135deg,#ef4444,#e11d48)" }}
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {/* ══════════════ PAGINATION ══════════════ */}
      {displayPosts.length > PAGE_SIZE && (
        <div className="flex items-center justify-between rounded-xl bg-white border border-gray-100 shadow-sm px-5 py-3">
          <p className="text-xs text-gray-400">
            Hiển thị <span className="font-semibold text-gray-600">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, displayPosts.length)}</span> / {displayPosts.length} bài
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg border-none text-xs font-bold cursor-pointer transition-all duration-200 ${
                  page === safePage
                    ? "text-white shadow-md"
                    : "text-gray-500 bg-transparent hover:bg-gray-100"
                }`}
                style={page === safePage ? { background: "linear-gradient(135deg,#f59e0b,#f97316)", boxShadow: "0 2px 8px rgba(245,158,11,.35)" } : {}}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
      {/* ══════════════ DETAIL MODAL ══════════════ */}
      {selectedPost && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setSelectedPost(null) }}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
          style={{ background: "rgba(15,23,42,.45)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="bg-white w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
            style={{ borderRadius: 16, animation: "pmFadeUp .25s ease" }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex gap-3 items-start" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div className="flex-1 min-w-0">
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md" style={{ background: (TYPE_CFG[selectedPost.postType]?.accent || "#64748b") + "14", color: TYPE_CFG[selectedPost.postType]?.accent || "#64748b" }}>
                    {TYPE_CFG[selectedPost.postType]?.label || selectedPost.postType}
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md" style={{ background: (STATUS_CFG[selectedPost.status] || STATUS_CFG.PENDING).bg, color: (STATUS_CFG[selectedPost.status] || STATUS_CFG.PENDING).color }}>
                    {(STATUS_CFG[selectedPost.status] || STATUS_CFG.PENDING).label}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 leading-snug">{selectedPost.title}</h2>
                <p className="mt-1.5 text-xs text-gray-400">
                  {selectedPost.author?.fullName || "Ẩn danh"} &middot; {new Date(selectedPost.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="w-8 h-8 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 cursor-pointer text-gray-400 hover:text-gray-600 flex items-center justify-center flex-shrink-0 transition-colors text-base leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 overflow-y-auto flex-1">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Nội dung bài viết</p>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedPost.content}
              </div>
              {selectedPost.status === "PENDING" && (
                <div className="mt-5">
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                    Ghi chú phản hồi <span className="text-gray-400 font-normal text-xs">(tùy chọn)</span>
                  </label>
                  <textarea
                    value={moderationNote}
                    onChange={e => setModerationNote(e.target.value)}
                    placeholder="Nhập phản hồi gửi đến người đăng..."
                    rows={3}
                    className="w-full p-3 border border-gray-200 rounded-lg text-sm outline-none resize-none text-gray-700 transition-all focus:border-orange-300 focus:ring-2 focus:ring-orange-50"
                    style={{ boxSizing: "border-box" }}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedPost.status === "PENDING" && (
              <div className="px-6 pb-6 pt-4 flex gap-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                <button
                  onClick={() => handleModerate(selectedPost.id, "reject")}
                  disabled={!!actioning}
                  className="flex-1 py-2.5 rounded-lg border border-red-200 bg-white text-red-600 text-sm font-bold cursor-pointer hover:bg-red-50 transition-all disabled:opacity-50"
                >
                  {actioning === "reject" ? "Đang xử lý..." : "Từ chối"}
                </button>
                <button
                  onClick={() => handleModerate(selectedPost.id, "approve")}
                  disabled={!!actioning}
                  className="flex-[2] py-2.5 rounded-lg border-none text-white text-sm font-bold cursor-pointer transition-all disabled:opacity-50 active:scale-[.98] hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg,#10b981,#16a34a)", boxShadow: actioning ? "none" : "0 4px 12px rgba(16,185,129,.3)" }}
                >
                  {actioning === "approve" ? "Đang xuất bản..." : "Duyệt & Xuất bản"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
