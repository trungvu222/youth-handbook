'use client';

import { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  UserCheck,
  UserX,
  Award,
  Star,
  Calendar,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Flag,
  X
} from 'lucide-react';

interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  unit: string;
  position: string;
  joinDate: string;
  points: number;
  rank: 'XUAT_SAC' | 'KHA' | 'TRUNG_BINH' | 'YEU';
  status: 'ACTIVE' | 'INACTIVE';
  avatar?: string;
  birthDate: string;
  address: string;
  education: string;
  workPlace: string;
}

export default function MemberManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterRank, setFilterRank] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Handlers for edit and delete
  const handleEdit = (member: Member) => {
    setEditingMember(member);
  };

  const handleDelete = (memberId: string) => {
    setShowDeleteConfirm(memberId);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      // API call to delete member
      console.log('Deleting member:', showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const handleSaveEdit = () => {
    // API call to save edited member
    console.log('Saving member:', editingMember);
    setEditingMember(null);
  };

  // Mock data đoàn viên
  const members: Member[] = [
    {
      id: '1',
      fullName: 'Nguyễn Văn An',
      email: 'an.nguyen@email.com',
      phone: '0123456789',
      unit: 'Chi đoàn Công nghệ',
      position: 'Bí thư chi đoàn',
      joinDate: '2022-09-15',
      points: 850,
      rank: 'XUAT_SAC',
      status: 'ACTIVE',
      birthDate: '2000-05-15',
      address: 'Hà Nội',
      education: 'Đại học Công nghệ',
      workPlace: 'Công ty ABC'
    },
    {
      id: '2',
      fullName: 'Trần Thị Bình',
      email: 'binh.tran@email.com',
      phone: '0987654321',
      unit: 'Chi đoàn Kinh tế',
      position: 'Phó bí thư',
      joinDate: '2022-10-20',
      points: 720,
      rank: 'KHA',
      status: 'ACTIVE',
      birthDate: '2001-03-22',
      address: 'TP.HCM',
      education: 'Đại học Kinh tế',
      workPlace: 'Ngân hàng XYZ'
    },
    {
      id: '3',
      fullName: 'Lê Văn Cường',
      email: 'cuong.le@email.com',
      phone: '0369258147',
      unit: 'Chi đoàn Y khoa',
      position: 'Ủy viên BCH',
      joinDate: '2023-01-10',
      points: 580,
      rank: 'TRUNG_BINH',
      status: 'ACTIVE',
      birthDate: '2002-07-08',
      address: 'Đà Nẵng',
      education: 'Đại học Y',
      workPlace: 'Bệnh viện DEF'
    }
  ];

  const units = [
    'Chi đoàn Công nghệ',
    'Chi đoàn Kinh tế', 
    'Chi đoàn Y khoa',
    'Chi đoàn Sư phạm',
    'Chi đoàn Kỹ thuật'
  ];

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'XUAT_SAC': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'KHA': return 'bg-green-100 text-green-800 border-green-200';
      case 'TRUNG_BINH': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'YEU': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRankText = (rank: string) => {
    switch (rank) {
      case 'XUAT_SAC': return 'Xuất sắc';
      case 'KHA': return 'Khá';
      case 'TRUNG_BINH': return 'Trung bình';
      case 'YEU': return 'Yếu';
      default: return 'Chưa xếp loại';
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = filterUnit === 'all' || member.unit === filterUnit;
    const matchesRank = filterRank === 'all' || member.rank === filterRank;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    
    return matchesSearch && matchesUnit && matchesRank && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Users className="h-8 w-8 mr-3" />
              Quản lý đoàn viên
            </h1>
            <p className="text-red-100 mt-2">
              Quản lý thông tin chi tiết của {members.length} đoàn viên
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Thêm đoàn viên
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tên, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chi đoàn</label>
            <select
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">Tất cả chi đoàn</option>
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Xếp loại</label>
            <select
              value={filterRank}
              onChange={(e) => setFilterRank(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">Tất cả xếp loại</option>
              <option value="XUAT_SAC">Xuất sắc</option>
              <option value="KHA">Khá</option>
              <option value="TRUNG_BINH">Trung bình</option>
              <option value="YEU">Yếu</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Không hoạt động</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Tổng đoàn viên</p>
              <p className="text-3xl font-bold text-gray-900">{members.length}</p>
            </div>
            <Users className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Đang hoạt động</p>
              <p className="text-3xl font-bold text-gray-900">
                {members.filter(m => m.status === 'ACTIVE').length}
              </p>
            </div>
            <UserCheck className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Xuất sắc</p>
              <p className="text-3xl font-bold text-gray-900">
                {members.filter(m => m.rank === 'XUAT_SAC').length}
              </p>
            </div>
            <Award className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Điểm TB</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(members.reduce((sum, m) => sum + m.points, 0) / members.length)}
              </p>
            </div>
            <Star className="h-12 w-12 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách đoàn viên ({filteredMembers.length})
            </h3>
            <div className="flex space-x-2">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Xuất Excel
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Nhập Excel
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đoàn viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chi đoàn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chức vụ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Xếp loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Điểm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-semibold">
                          {member.fullName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{member.fullName}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Flag className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{member.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{member.position}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRankColor(member.rank)}`}>
                      {getRankText(member.rank)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium text-gray-900">{member.points}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      member.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEdit(member)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Thông tin chi tiết đoàn viên</h3>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-white hover:text-red-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Thông tin cá nhân</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Họ tên:</span>
                      <span className="ml-2 font-medium">{selectedMember.fullName}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{selectedMember.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">SĐT:</span>
                      <span className="ml-2 font-medium">{selectedMember.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Ngày sinh:</span>
                      <span className="ml-2 font-medium">{selectedMember.birthDate}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Địa chỉ:</span>
                      <span className="ml-2 font-medium">{selectedMember.address}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Thông tin đoàn</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Flag className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Chi đoàn:</span>
                      <span className="ml-2 font-medium">{selectedMember.unit}</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Chức vụ:</span>
                      <span className="ml-2 font-medium">{selectedMember.position}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Ngày vào đoàn:</span>
                      <span className="ml-2 font-medium">{selectedMember.joinDate}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Điểm rèn luyện:</span>
                      <span className="ml-2 font-medium">{selectedMember.points}</span>
                    </div>
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Học vấn:</span>
                      <span className="ml-2 font-medium">{selectedMember.education}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
                <button 
                  onClick={() => {
                    setSelectedMember(null);
                    handleEdit(selectedMember);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center">
                  <Edit className="h-5 w-5 mr-2" />
                  Chỉnh sửa đoàn viên
                </h3>
                <button
                  onClick={() => setEditingMember(null)}
                  className="text-white hover:text-green-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    defaultValue={editingMember.fullName}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    defaultValue={editingMember.email}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    defaultValue={editingMember.phone}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    defaultValue={editingMember.birthDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  defaultValue={editingMember.address}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chi đoàn</label>
                  <select
                    defaultValue={editingMember.unit}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Chi đoàn Công nghệ">Chi đoàn Công nghệ</option>
                    <option value="Chi đoàn Kinh tế">Chi đoàn Kinh tế</option>
                    <option value="Chi đoàn Y khoa">Chi đoàn Y khoa</option>
                    <option value="Chi đoàn Sư phạm">Chi đoàn Sư phạm</option>
                    <option value="Chi đoàn Kỹ thuật">Chi đoàn Kỹ thuật</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                  <input
                    type="text"
                    defaultValue={editingMember.position}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xếp loại</label>
                  <select
                    defaultValue={editingMember.rank}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="XUAT_SAC">Xuất sắc</option>
                    <option value="KHA">Khá</option>
                    <option value="TRUNG_BINH">Trung bình</option>
                    <option value="YEU">Yếu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    defaultValue={editingMember.status}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Không hoạt động</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Học vấn</label>
                  <input
                    type="text"
                    defaultValue={editingMember.education}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nơi làm việc</label>
                  <input
                    type="text"
                    defaultValue={editingMember.workPlace}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc chắn muốn xóa đoàn viên này? Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}