// Points System for Youth Handbook
export interface PointsRule {
  id: string;
  name: string;
  action: string;
  points: number;
  type: 'EARN' | 'DEDUCT' | 'BONUS';
  category: 'MEETING' | 'VOLUNTEER' | 'POST' | 'SURVEY' | 'STUDY' | 'OTHER';
  description: string;
}

export interface MonthlyPoints {
  userId: string;
  month: string; // Format: YYYY-MM
  basePoints: number; // Starting points (100)
  currentPoints: number; // Current points
  earnedPoints: number; // Total earned
  deductedPoints: number; // Total deducted
  bonusPoints: number; // Total bonus
  finalPoints: number; // Final calculated points
  rank: PointsRank;
  activities: PointsActivity[];
}

export interface PointsActivity {
  id: string;
  userId: string;
  activityId?: string;
  ruleId: string;
  points: number;
  type: 'EARN' | 'DEDUCT' | 'BONUS';
  reason: string;
  category: string;
  timestamp: Date;
  month: string;
  metadata?: any; // Additional data like QR check-in info
}

export type PointsRank = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';

// Points rules configuration
export const POINTS_RULES: PointsRule[] = [
  {
    id: 'meeting_attend',
    name: 'Tham gia sinh hoạt Chi đoàn',
    action: 'attend_meeting',
    points: 10,
    type: 'EARN',
    category: 'MEETING',
    description: 'Điểm danh QR theo buổi sinh hoạt'
  },
  {
    id: 'meeting_absent',
    name: 'Không tham gia sinh hoạt',
    action: 'absent_meeting',
    points: -10,
    type: 'DEDUCT',
    category: 'MEETING',
    description: 'Vắng mặt không phép sinh hoạt Chi đoàn'
  },
  {
    id: 'post_approved',
    name: 'Viết bài tuyên truyền',
    action: 'post_approved',
    points: 20,
    type: 'EARN',
    category: 'POST',
    description: 'Bài viết được duyệt và đăng tải'
  },
  {
    id: 'volunteer_attend',
    name: 'Tham gia hoạt động tình nguyện',
    action: 'attend_volunteer',
    points: 10,
    type: 'EARN',
    category: 'VOLUNTEER',
    description: 'Check-in QR tại hoạt động tình nguyện'
  },
  {
    id: 'volunteer_absent',
    name: 'Không tham gia tình nguyện',
    action: 'absent_volunteer',
    points: -10,
    type: 'DEDUCT',
    category: 'VOLUNTEER',
    description: 'Đăng ký nhưng không tham gia'
  },
  {
    id: 'survey_complete',
    name: 'Trả lời khảo sát',
    action: 'complete_survey',
    points: 5,
    type: 'EARN',
    category: 'SURVEY',
    description: 'Hoàn thành khảo sát trong thời hạn'
  },
  {
    id: 'survey_missed',
    name: 'Không trả lời khảo sát',
    action: 'miss_survey',
    points: -5,
    type: 'DEDUCT',
    category: 'SURVEY',
    description: 'Không trả lời khảo sát trong thời hạn'
  },
  {
    id: 'study_complete',
    name: 'Hoàn thành bài học',
    action: 'complete_study',
    points: 15,
    type: 'EARN',
    category: 'STUDY',
    description: 'Hoàn thành bài học và đạt điểm tối thiểu'
  },
  {
    id: 'leadership_bonus',
    name: 'Thưởng hoạt động tích cực',
    action: 'leadership_bonus',
    points: 50,
    type: 'BONUS',
    category: 'OTHER',
    description: 'Thưởng từ Ban chấp hành'
  }
];

// Constants
export const MONTHLY_BASE_POINTS = 100;
export const CURRENT_MONTH = new Date().toISOString().slice(0, 7); // YYYY-MM

// Get rank based on points
export function getPointsRank(points: number): PointsRank {
  if (points >= 130) return 'EXCELLENT';
  if (points >= 110) return 'GOOD';
  if (points >= 90) return 'AVERAGE';
  return 'POOR';
}

// Get rank display text
export function getRankDisplayText(rank: PointsRank): string {
  switch (rank) {
    case 'EXCELLENT': return 'Xuất sắc';
    case 'GOOD': return 'Khá';
    case 'AVERAGE': return 'Trung bình';
    case 'POOR': return 'Yếu';
  }
}

// Get rank color
export function getRankColor(rank: PointsRank): string {
  switch (rank) {
    case 'EXCELLENT': return 'bg-green-100 text-green-800';
    case 'GOOD': return 'bg-blue-100 text-blue-800';
    case 'AVERAGE': return 'bg-yellow-100 text-yellow-800';
    case 'POOR': return 'bg-red-100 text-red-800';
  }
}

// Calculate monthly points
export function calculateMonthlyPoints(activities: PointsActivity[]): MonthlyPoints {
  const userId = activities[0]?.userId || '';
  const month = activities[0]?.month || CURRENT_MONTH;
  
  const earnedPoints = activities
    .filter(a => a.type === 'EARN')
    .reduce((sum, a) => sum + a.points, 0);
    
  const deductedPoints = activities
    .filter(a => a.type === 'DEDUCT')
    .reduce((sum, a) => sum + Math.abs(a.points), 0);
    
  const bonusPoints = activities
    .filter(a => a.type === 'BONUS')
    .reduce((sum, a) => sum + a.points, 0);
    
  const finalPoints = MONTHLY_BASE_POINTS + earnedPoints - deductedPoints + bonusPoints;
  const currentPoints = Math.max(0, finalPoints); // Don't go below 0
  
  return {
    userId,
    month,
    basePoints: MONTHLY_BASE_POINTS,
    currentPoints,
    earnedPoints,
    deductedPoints,
    bonusPoints,
    finalPoints,
    rank: getPointsRank(currentPoints),
    activities: activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  };
}

// Mock points service
export class PointsService {
  private static activities: PointsActivity[] = [
    {
      id: '1',
      userId: '1', // admin
      ruleId: 'meeting_attend',
      points: 10,
      type: 'EARN',
      reason: 'Tham gia sinh hoạt Chi đoàn tháng 1',
      category: 'MEETING',
      timestamp: new Date('2024-01-22T09:00:00Z'),
      month: '2024-01'
    },
    {
      id: '2',
      userId: '1',
      ruleId: 'post_approved',
      points: 20,
      type: 'EARN',
      reason: 'Bài viết "Hoạt động Đoàn tháng 1" được duyệt',
      category: 'POST',
      timestamp: new Date('2024-01-20T14:00:00Z'),
      month: '2024-01'
    },
    {
      id: '3',
      userId: '3', // member_001
      ruleId: 'meeting_attend',
      points: 10,
      type: 'EARN',
      reason: 'Check-in QR sinh hoạt Chi đoàn CNTT',
      category: 'MEETING',
      timestamp: new Date('2024-01-22T09:05:00Z'),
      month: '2024-01'
    },
    {
      id: '4',
      userId: '3',
      ruleId: 'survey_complete',
      points: 5,
      type: 'EARN',
      reason: 'Hoàn thành khảo sát "Ý kiến về hoạt động Đoàn"',
      category: 'SURVEY',
      timestamp: new Date('2024-01-18T16:30:00Z'),
      month: '2024-01'
    }
  ];

  static getUserMonthlyPoints(userId: string, month: string = CURRENT_MONTH): MonthlyPoints {
    const userActivities = this.activities.filter(a => a.userId === userId && a.month === month);
    return calculateMonthlyPoints(userActivities);
  }

  static getUserPointsHistory(userId: string, limit: number = 10): PointsActivity[] {
    return this.activities
      .filter(a => a.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  static getLeaderboard(unitId?: string, month: string = CURRENT_MONTH): Array<MonthlyPoints & { user: any }> {
    // Group activities by user
    const userGroups = this.activities
      .filter(a => a.month === month)
      .reduce((groups, activity) => {
        if (!groups[activity.userId]) {
          groups[activity.userId] = [];
        }
        groups[activity.userId].push(activity);
        return groups;
      }, {} as Record<string, PointsActivity[]>);

    // Calculate points for each user
    const leaderboard = Object.entries(userGroups).map(([userId, activities]) => {
      const monthlyPoints = calculateMonthlyPoints(activities);
      
      // Mock user data - in real app, fetch from user service
      const mockUsers: Record<string, any> = {
        '1': { id: '1', fullName: 'Quản trị viên hệ thống', role: 'ADMIN', unitId: null },
        '2': { id: '2', fullName: 'Nguyễn Văn An', role: 'LEADER', unitId: 'unit_cntt' },
        '3': { id: '3', fullName: 'Lê Văn Cường', role: 'MEMBER', unitId: 'unit_cntt' }
      };

      return {
        ...monthlyPoints,
        user: mockUsers[userId] || { id: userId, fullName: 'Unknown User', role: 'MEMBER' }
      };
    });

    return leaderboard.sort((a, b) => b.currentPoints - a.currentPoints);
  }

  static addPointsActivity(activity: Omit<PointsActivity, 'id' | 'timestamp' | 'month'>): PointsActivity {
    const newActivity: PointsActivity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date(),
      month: new Date().toISOString().slice(0, 7)
    };

    this.activities.push(newActivity);
    return newActivity;
  }

  static getRuleById(ruleId: string): PointsRule | undefined {
    return POINTS_RULES.find(rule => rule.id === ruleId);
  }
}

export default PointsService;



