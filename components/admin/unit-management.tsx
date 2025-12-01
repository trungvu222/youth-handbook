'use client';

import { useState } from 'react';
import {
  Flag,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Award,
  Star,
  Activity,
  BarChart3,
  X
} from 'lucide-react';

interface Unit {
  id: string;
  name: string;
  leader: string;
  leaderEmail: string;
  leaderPhone: string;
  memberCount: number;
  activeMembers: number;
  establishedDate: string;
  address: string;
  description: string;
  totalPoints: number;
  averagePoints: number;
  activitiesCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function UnitManagement() {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
  };

  const handleDelete = (unitId: string) => {
    setShowDeleteConfirm(unitId);
  };

  const confirmDelete = () => {
    // TODO: Call API to delete unit
    alert('Đã xóa chi đoàn thành công!');
    setShowDeleteConfirm(null);
  };

  const handleSaveEdit = () => {
    // TODO: Call API to save changes
    alert('Đã cập nhật chi đoàn thành công!');
    setEditingUnit(null);
  };

  // Mock data chi đoàn
  const units: Unit[] = [
    {
      id: '1',
      name: 'Chi đoàn Công nghệ',
      leader: 'Nguyễn Văn An',
      leaderEmail: 'an.nguyen@email.com',
      leaderPhone: '0123456789',
      memberCount: 28,
      activeMembers: 26,
      establishedDate: '2020-09-15',
      address: 'Khoa Công nghệ thông tin, Trường Đại học ABC',
      description: 'Chi đoàn chuyên về lĩnh vực công nghệ thông tin và kỹ thuật',
      totalPoints: 12450,
      averagePoints: 445,
      activitiesCount: 12,
      status: 'ACTIVE'
    },
    {
      id: '2',
      name: 'Chi đoàn Kinh tế',
      leader: 'Trần Thị Bình',
      leaderEmail: 'binh.tran@email.com',
      leaderPhone: '0987654321',
      memberCount: 32,
      activeMembers: 30,
      establishedDate: '2020-10-20',
      address: 'Khoa Kinh tế, Trường Đại học ABC',
      description: 'Chi đoàn chuyên về lĩnh vực kinh tế và quản trị',
      totalPoints: 15680,
      averagePoints: 490,
      activitiesCount: 15,
      status: 'ACTIVE'
    },
    {
      id: '3',
      name: 'Chi đoàn Y khoa',
      leader: 'Lê Văn Cường',
      leaderEmail: 'cuong.le@email.com',
      leaderPhone: '0369258147',
      memberCount: 24,
      activeMembers: 22,
      establishedDate: '2021-01-10',
      address: 'Khoa Y, Trường Đại học ABC',
      description: 'Chi đoàn chuyên về lĩnh vực y khoa và chăm sóc sức khỏe',
      totalPoints: 10800,
      averagePoints: 450,
      activitiesCount: 8,
      status: 'ACTIVE'
    }
  ];

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusText = (status: string) => {
    return status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Flag className="h-8 w-8 mr-3" />
              Quản lý chi đoàn
            </h1>
            <p className="text-red-100 mt-2">
              Quản lý {units.length} chi đoàn trực thuộc
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Thêm chi đoàn
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Tổng chi đoàn</p>
              <p className="text-3xl font-bold text-gray-900">{units.length}</p>
            </div>
            <Flag className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Đang hoạt động</p>
              <p className="text-3xl font-bold text-gray-900">
                {units.filter(u => u.status === 'ACTIVE').length}
              </p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Tổng đoàn viên</p>
              <p className="text-3xl font-bold text-gray-900">
                {units.reduce((sum, u) => sum + u.memberCount, 0)}
              </p>
            </div>
            <Users className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Điểm TB</p>
              <p className="text-3xl font-bold text-gray-900">
                {Math.round(units.reduce((sum, u) => sum + u.averagePoints, 0) / units.length)}
              </p>
            </div>
            <Star className="h-12 w-12 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {units.map((unit) => (
          <div key={unit.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{unit.name}</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(unit.status)}`}>
                  {getStatusText(unit.status)}
                </span>
              </div>
              <p className="text-red-100 text-sm mt-1">{unit.description}</p>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Đoàn viên:</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {unit.activeMembers}/{unit.memberCount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Award className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Bí thư:</span>
                  </div>
                  <span className="font-semibold text-gray-900">{unit.leader}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Điểm TB:</span>
                  </div>
                  <span className="font-semibold text-gray-900">{unit.averagePoints}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Hoạt động:</span>
                  </div>
                  <span className="font-semibold text-gray-900">{unit.activitiesCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Thành lập:</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {new Date(unit.establishedDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedUnit(unit)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Xem chi tiết"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEdit(unit)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  title="Chỉnh sửa"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(unit.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Xóa"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Unit Detail Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{selectedUnit.name}</h3>
                <button
                  onClick={() => setSelectedUnit(null)}
                  className="text-white hover:text-red-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Thông tin chi đoàn</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Flag className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600 w-24">Tên:</span>
                      <span className="font-medium">{selectedUnit.name}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600 w-24">Địa chỉ:</span>
                      <span className="font-medium">{selectedUnit.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600 w-24">Thành lập:</span>
                      <span className="font-medium">
                        {new Date(selectedUnit.establishedDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-sm text-gray-600 w-24 mt-1">Mô tả:</span>
                      <span className="font-medium">{selectedUnit.description}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Thông tin bí thư</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600 w-24">Họ tên:</span>
                      <span className="font-medium">{selectedUnit.leader}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600 w-24">Email:</span>
                      <span className="font-medium">{selectedUnit.leaderEmail}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600 w-24">SĐT:</span>
                      <span className="font-medium">{selectedUnit.leaderPhone}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-4">Thống kê hoạt động</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Tổng đoàn viên</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedUnit.memberCount}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Điểm trung bình</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedUnit.averagePoints}</p>
                      </div>
                      <Star className="h-8 w-8 text-yellow-500" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Hoạt động</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedUnit.activitiesCount}</p>
                      </div>
                      <Activity className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedUnit(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
                <button 
                  onClick={() => {
                    setSelectedUnit(null);
                    handleEdit(selectedUnit);
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
      {editingUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center">
                  <Edit className="h-5 w-5 mr-2" />
                  Chỉnh sửa chi đoàn
                </h3>
                <button
                  onClick={() => setEditingUnit(null)}
                  className="text-white hover:text-green-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chi đoàn</label>
                <input
                  type="text"
                  defaultValue={editingUnit.name}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  defaultValue={editingUnit.address}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  defaultValue={editingUnit.description}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bí thư</label>
                  <input
                    type="text"
                    defaultValue={editingUnit.leader}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email bí thư</label>
                  <input
                    type="email"
                    defaultValue={editingUnit.leaderEmail}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SĐT bí thư</label>
                  <input
                    type="tel"
                    defaultValue={editingUnit.leaderPhone}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    defaultValue={editingUnit.status}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Không hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingUnit(null)}
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
                Bạn có chắc chắn muốn xóa chi đoàn này? Hành động này không thể hoàn tác.
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

