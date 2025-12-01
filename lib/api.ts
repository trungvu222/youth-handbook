// API service for Youth Handbook Frontend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-domain.com/api' 
    : 'http://localhost:3001/api');

// API Response types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
  user?: User;
}

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'LEADER' | 'MEMBER';
  points?: number;
  unitId?: string;
  phone?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  birthPlace?: string;
  address?: string;
  province?: string;
  district?: string;
  ward?: string;
  title?: string;
  dateJoined?: string;
  workPlace?: string;
  ethnicity?: string;
  religion?: string;
  educationLevel?: string;
  majorLevel?: string;
  itLevel?: string;
  languageLevel?: string;
  politicsLevel?: string;
  youthPosition?: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

// Mock users database
const MOCK_USERS = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@youth-handbook.com',
    password: 'admin123',
    fullName: 'Quản trị viên hệ thống',
    role: 'ADMIN' as const,
    points: 1000,
    phone: '0123456789'
  },
  {
    id: '2',
    username: 'leader_cntt',
    email: 'leader.cntt@youth-handbook.com',
    password: 'leader123',
    fullName: 'Nguyễn Văn An',
    role: 'LEADER' as const,
    points: 850,
    phone: '0987654321',
    unitId: 'unit_cntt'
  },
  {
    id: '3',
    username: 'member_001',
    email: 'member001@youth-handbook.com',
    password: 'member123',
    fullName: 'Lê Văn Cường',
    role: 'MEMBER' as const,
    points: 780,
    phone: '0987654323',
    unitId: 'unit_cntt'
  }
];

// Utility function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Utility function to make API calls with fallback to mock
async function apiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add Content-Type header for JSON requests and force no-cache
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return {
      success: data.success !== undefined ? data.success : true,
      ...data
    };
  } catch (error) {
    console.warn('Real API failed, falling back to mock API:', error);
    
    // Fallback to mock API if real API fails
    return mockApiCall<T>(endpoint, options);
  }
}

// Mock API implementation
async function mockApiCall<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  await delay(500); // Simulate network delay

  const url = endpoint.replace('/', '');
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : null;

  console.log('Mock API Call:', { method, url, body });

  // Handle different endpoints
  if (url === 'auth/login' && method === 'POST') {
    const { username, password } = body as LoginCredentials;
    
    const user = MOCK_USERS.find(u => 
      (u.username === username || u.email === username) && u.password === password
    );

    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      const token = `mock-jwt-token-${user.id}`;
      
      // Store token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      }

      return {
        success: true,
        token,
        user: userWithoutPassword
      };
    } else {
      return {
        success: false,
        error: 'Tên đăng nhập hoặc mật khẩu không đúng'
      };
    }
  }

  if (url === 'auth/me' && method === 'GET') {
    const authHeader = options.headers?.['Authorization'] as string;
    const token = authHeader?.replace('Bearer ', '');

    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('auth_token');

      if (token === storedToken && storedUser) {
        return {
          success: true,
          data: JSON.parse(storedUser)
        };
      }
    }

    return {
      success: false,
      error: 'Token không hợp lệ'
    };
  }

  if (url === 'auth/register' && method === 'POST') {
    const { username, email } = body as RegisterData;
    
    // Check if user already exists
    const existingUser = MOCK_USERS.find(u => u.username === username || u.email === email);
    
    if (existingUser) {
      return {
        success: false,
        error: 'Tên đăng nhập hoặc email đã được sử dụng'
      };
    }

    // Simulate successful registration
    const newUser = {
      id: Date.now().toString(),
      ...body,
      role: 'MEMBER' as const,
      points: 0
    };

    const { password: _, ...userWithoutPassword } = newUser;
    const token = `mock-jwt-token-${newUser.id}`;

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    }

    return {
      success: true,
      token,
      user: userWithoutPassword
    };
  }

  // Default response for unhandled endpoints
  return {
    success: false,
    error: 'Endpoint không tồn tại'
  };
}

// Get stored auth token
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

// Get stored user
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Clear auth data
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!getStoredUser();
}

// API Service
export const authApi = {
  // Login user
  async login(credentials: LoginCredentials): Promise<ApiResponse> {
    const result = await apiCall('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    // Save token and user to localStorage on successful login
    if (result.success && result.token && result.user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Trigger storage event to notify other components
        window.dispatchEvent(new Event('storage'));
        
        // Also trigger custom event for immediate updates
        window.dispatchEvent(new CustomEvent('auth_changed', { 
          detail: { authenticated: true, user: result.user } 
        }));
      }
    }

    return result;
  },

  // Register user
  async register(userData: RegisterData): Promise<ApiResponse> {
    return apiCall('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  },

  // Get current user
  async getMe(): Promise<ApiResponse<User>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Logout user
  async logout(): Promise<void> {
    clearAuth();
  }
};

// Profile API
export const profileApi = {
  // Update current user profile
  async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
  },

  // Get current user full profile
  async getMyProfile(): Promise<ApiResponse<User>> {
    return authApi.getMe();
  }
};

// User Management API (Admin/Leader only)
export const userApi = {
  // Get all users with filters
  async getUsers(params?: {
    unitId?: string;
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{data: User[], pagination: any}>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return apiCall(`/api/users?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Get user by ID
  async getUserById(id: string): Promise<ApiResponse<User>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/api/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Update user profile (Admin/Leader)
  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  },

  // Assign user to unit (Admin only)
  async assignUserToUnit(id: string, unitId: string | null): Promise<ApiResponse<User>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/api/users/${id}/unit`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ unitId }),
    });
  },

  // Change user role (Admin only)
  async changeUserRole(id: string, role: 'ADMIN' | 'LEADER' | 'MEMBER'): Promise<ApiResponse<User>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/api/users/${id}/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
  }
};

// Activity API
export const activityApi = {
  // Get all activities
  async getActivities(params?: {
    unitId?: string;
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{data: any[], pagination: any}>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return apiCall(`/activities?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Get single activity
  async getActivity(id: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/activities/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Create activity (Admin/Leader only)
  async createActivity(activityData: any): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/activities', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityData),
    });
  },

  // Join activity
  async joinActivity(id: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/activities/${id}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },

  // Check in to activity
  async checkInActivity(id: string, data: {
    qrCode: string;
    latitude?: number;
    longitude?: number;
  }): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/activities/${id}/checkin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  // Get activity statistics (Admin/Leader)
  async getActivityStats(id: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/activities/${id}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Submit feedback
  async submitFeedback(id: string, feedbackData: {
    content: string;
    type?: string;
    isAnonymous?: boolean;
  }): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/activities/${id}/feedback`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    });
  },

  // Respond to feedback (Admin/Leader)
  async respondToFeedback(feedbackId: string, data: {
    response: string;
    status?: string;
  }): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/activities/feedback/${feedbackId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }
};

// Posts API
export const postApi = {
  // Get all posts
  async getPosts(params?: {
    postType?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{data: any[], pagination: any}>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return apiCall(`/posts?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Get single post
  async getPost(id: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/posts/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Create post
  async createPost(postData: any): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });
  },

  // Update post
  async updatePost(id: string, postData: any): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/posts/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });
  },

  // Delete post
  async deletePost(id: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }
};

// Enhanced Activity API for Module 3.3
export const enhancedActivityApi = {
  // QR GPS check-in
  async checkInWithGPS(id: string, qrData: string, latitude?: number, longitude?: number): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/activities/${id}/checkin-gps`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qrData, latitude, longitude }),
    });
  },

  // Get activity surveys
  async getActivitySurveys(id: string): Promise<ApiResponse<any[]>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/activities/${id}/surveys`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Submit survey response
  async submitSurveyResponse(activityId: string, surveyId: string, answers: any): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/activities/${activityId}/surveys/${surveyId}/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers }),
    });
  },

  // Get enhanced activity statistics
  async getEnhancedStats(id: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/activities/${id}/enhanced-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }
};

// Study API for Module 3.4
export const studyApi = {
  // Get study topics
  async getStudyTopics(category?: string): Promise<ApiResponse<any[]>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const params = new URLSearchParams();
    if (category && category !== 'all') {
      params.append('category', category);
    }

    return apiCall(`/study/topics?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Get specific study topic
  async getStudyTopic(id: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/study/topics/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Start studying a material
  async startStudyMaterial(materialId: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/study/materials/${materialId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Update material progress
  async updateMaterialProgress(materialId: string, viewedDuration?: number, completed?: boolean): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/study/materials/${materialId}/progress`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ viewedDuration, completed }),
    });
  },

  // Get quiz for material
  async getQuiz(materialId: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/study/materials/${materialId}/quiz`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Submit quiz attempt
  async submitQuizAttempt(quizId: string, answers: any[], timeSpent?: number): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/study/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers, timeSpent }),
    });
  },

  // Get my study progress
  async getMyProgress(): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/study/my-progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Get study leaderboard
  async getLeaderboard(category?: string, timeRange?: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const params = new URLSearchParams();
    if (category && category !== 'all') {
      params.append('category', category);
    }
    if (timeRange) {
      params.append('timeRange', timeRange);
    }

    return apiCall(`/study/leaderboard?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Admin: Create study topic
  async createStudyTopic(topicData: any): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/study/topics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(topicData),
    });
  },

  // Admin: Get study statistics
  async getStudyStats(timeRange?: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const params = new URLSearchParams();
    if (timeRange) {
      params.append('timeRange', timeRange);
    }

    return apiCall(`/study/admin/stats?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }
};

// Check backend health
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Force use mock API (for testing)
export const useMockApi = () => {
  (window as any).__USE_MOCK_API = true;
};

// Force use real API (for testing)
export const useRealApi = () => {
  (window as any).__USE_MOCK_API = false;
};

// =====================================
// MODULE 3.7: SELF QUALITY RATING  
// =====================================

interface RatingCriteria {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
}

interface RatingPeriod {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  criteria: RatingCriteria[];
  scope?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface SelfRating {
  id: string;
  periodId: string;
  userId: string;
  criteriaResponses: Array<{
    criteriaId: string;
    value: boolean;
    note?: string;
  }>;
  suggestedRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  selfAssessment: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  finalRating?: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  adminNotes?: string;
  pointsAwarded?: number;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  period?: RatingPeriod;
}

interface RatingCreateData {
  periodId: string;
  criteriaResponses: Array<{
    criteriaId: string;
    value: boolean;
    note?: string;
  }>;
  suggestedRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  selfAssessment: string;
}

export const ratingApi = {
  // User methods
  async getRatingPeriods(status?: string): Promise<ApiResponse<RatingPeriod[]>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    return apiCall(`/rating/periods?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getRatingPeriod(id: string): Promise<ApiResponse<RatingPeriod>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/rating/periods/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getMyRating(periodId: string): Promise<ApiResponse<SelfRating>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/rating/periods/${periodId}/my-rating`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async submitRating(ratingData: RatingCreateData): Promise<ApiResponse<SelfRating>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/rating/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ratingData),
    });
  },

  async updateRating(id: string, ratingData: Partial<RatingCreateData>): Promise<ApiResponse<SelfRating>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/rating/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ratingData),
    });
  },

  async getMyRatingHistory(): Promise<ApiResponse<SelfRating[]>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/rating/my-history', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Admin methods
  async createRatingPeriod(periodData: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    criteria: RatingCriteria[];
    scope?: string;
  }): Promise<ApiResponse<RatingPeriod>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/rating/periods', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(periodData),
    });
  },

  async updateRatingPeriod(id: string, periodData: any): Promise<ApiResponse<RatingPeriod>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/rating/periods/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(periodData),
    });
  },

  async getPendingRatings(periodId?: string): Promise<ApiResponse<SelfRating[]>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId);

    return apiCall(`/rating/pending?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async approveRating(id: string, data: {
    finalRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    pointsAwarded: number;
    adminNotes?: string;
  }): Promise<ApiResponse<SelfRating>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/rating/${id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },

  async rejectRating(id: string, adminNotes: string): Promise<ApiResponse<SelfRating>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/rating/${id}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminNotes }),
    });
  },

  async getRatingStats(periodId?: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const params = new URLSearchParams();
    if (periodId) params.append('periodId', periodId);

    return apiCall(`/rating/stats?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async sendRatingReminder(periodId: string): Promise<ApiResponse<void>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/rating/periods/${periodId}/remind`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// =====================================
// MODULE 3.8: PERSONAL SUGGESTIONS
// =====================================

interface Suggestion {
  id: string;
  title: string;
  content: string;
  category: 'POLICY' | 'PROCESS' | 'FACILITY' | 'SERVICE' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED' | 'ARCHIVED';
  isAnonymous: boolean;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  responses?: SuggestionResponse[];
  createdAt: string;
  updatedAt: string;
}

interface SuggestionResponse {
  id: string;
  suggestionId: string;
  content: string;
  responderId: string;
  responder: {
    id: string;
    name: string;
    role: string;
  };
  createdAt: string;
}

interface SuggestionCreateData {
  title: string;
  content: string;
  category: 'POLICY' | 'PROCESS' | 'FACILITY' | 'SERVICE' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  isAnonymous: boolean;
  attachments?: string[]; // Array of file URLs
}

export const suggestionApi = {
  // User methods
  async getSuggestions(params?: {
    category?: string;
    status?: string;
    priority?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{data: Suggestion[], pagination: any}>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return apiCall(`/suggestions?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getSuggestion(id: string): Promise<ApiResponse<Suggestion>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/suggestions/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async createSuggestion(suggestionData: SuggestionCreateData): Promise<ApiResponse<Suggestion>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/suggestions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(suggestionData),
    });
  },

  async updateSuggestion(id: string, suggestionData: Partial<SuggestionCreateData>): Promise<ApiResponse<Suggestion>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/suggestions/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(suggestionData),
    });
  },

  async deleteSuggestion(id: string): Promise<ApiResponse<void>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/suggestions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getMySuggestions(): Promise<ApiResponse<Suggestion[]>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/suggestions/my-suggestions', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Admin methods
  async getAllSuggestions(params?: {
    category?: string;
    status?: string;
    priority?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{data: Suggestion[], pagination: any}>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return apiCall(`/suggestions/admin/all?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async respondToSuggestion(id: string, responseData: {
    content: string;
  }): Promise<ApiResponse<SuggestionResponse>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/suggestions/${id}/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData),
    });
  },

  async updateSuggestionStatus(id: string, status: string): Promise<ApiResponse<Suggestion>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/suggestions/${id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
  },

  async getSuggestionStats(timeRange?: string): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const params = new URLSearchParams();
    if (timeRange) params.append('timeRange', timeRange);

    return apiCall(`/suggestions/stats?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // File upload
  async uploadSuggestionFile(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<{fileUrl: string; fileName: string; fileSize: number}>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ success: true, data: response });
          } else {
            resolve({ success: false, error: response.error || 'Upload failed' });
          }
        } catch (error) {
          resolve({ success: false, error: 'Invalid response format' });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({ success: false, error: 'Upload failed' });
      });

      xhr.open('POST', `${API_BASE_URL}/suggestions/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  },
};

// =====================================
// MODULE 3.5: DOCUMENT MANAGEMENT
// =====================================

interface Document {
  id: string;
  title: string;
  content: string;
  type: 'POLICY' | 'GUIDELINE' | 'FORM' | 'REPORT' | 'OTHER';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  tags: string[];
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  authorId: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  unitId?: string;
  unit?: {
    id: string;
    name: string;
  };
  viewCount: number;
  favorites?: number;
  createdAt: string;
  updatedAt: string;
}

export const documentApi = {
  async getDocuments(params?: {
    type?: string;
    status?: string;
    search?: string;
    tags?: string;
    unitId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Document[]>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return apiCall(`/documents?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getDocument(id: string): Promise<ApiResponse<Document>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/documents/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getFavorites(): Promise<ApiResponse<Document[]>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/documents/favorites', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async toggleFavorite(id: string): Promise<ApiResponse<void>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/documents/${id}/favorite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async downloadDocument(id: string): Promise<ApiResponse<{fileUrl: string; fileName: string}>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/documents/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// =====================================  
// MODULE 3.6: EXAM MANAGEMENT
// =====================================

interface Exam {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // in minutes
  totalQuestions: number;
  passingScore: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  questions: ExamQuestion[];
  attempts?: ExamAttempt[];
  authorId: string;
  author?: {
    id: string;
    name: string;
  };
  unitId?: string;
  unit?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ExamQuestion {
  id: string;
  examId: string;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY';
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  points: number;
  order: number;
}

interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  user?: {
    id: string;
    name: string;
  };
  answers: Array<{
    questionId: string;
    answer: string | number;
    isCorrect: boolean;
    points: number;
  }>;
  score: number;
  totalPoints: number;
  passed: boolean;
  startedAt: string;
  completedAt: string;
  duration: number; // in seconds
}

export const examApi = {
  async getExams(params?: {
    status?: string;
    category?: string;
    search?: string;
    unitId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Exam[]>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    return apiCall(`/exams?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getExam(id: string): Promise<ApiResponse<Exam>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/exams/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async startExam(id: string): Promise<ApiResponse<ExamAttempt>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/exams/${id}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async submitExam(attemptId: string, answers: Array<{
    questionId: string;
    answer: string | number;
  }>): Promise<ApiResponse<ExamAttempt>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/exams/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers }),
    });
  },

  async getMyAttempts(): Promise<ApiResponse<ExamAttempt[]>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/exams/my-attempts', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getLeaderboard(examId?: string): Promise<ApiResponse<Array<{
    user: {
      id: string;
      name: string;
    };
    highestScore: number;
    attemptCount: number;
    lastAttempt: string;
  }>>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    const params = examId ? `?examId=${examId}` : '';
    return apiCall(`/exams/leaderboard${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// =====================================
// ADMIN API  
// =====================================

export const adminApi = {
  async getDashboardStats(): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getUserAnalytics(period: string = '30'): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall(`/admin/analytics/users?period=${period}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getActivityAnalytics(): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/admin/analytics/activities', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  async getSystemPerformance(): Promise<ApiResponse<any>> {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'Không có token' };
    }

    return apiCall('/admin/system/performance', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

export default authApi;

