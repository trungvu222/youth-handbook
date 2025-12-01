const express = require('express');

const router = express.Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin route working',
    timestamp: new Date().toISOString()
  });
});

// Simple dashboard stats
router.get('/dashboard/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      overview: {
        totalUsers: 10,
        activeUsers: 8,
        totalPosts: 0,
        pendingPosts: 0,
        totalDocuments: 0,
        publishedDocuments: 0,
        totalExams: 0,
        publishedExams: 0,
        pendingRatings: 0,
        newSuggestions: 0,
        totalActivities: 0,
        upcomingActivities: 0
      },
      recentActivities: [
        {
          id: '1',
          title: 'Hoạt động mẫu',
          type: 'MEETING',
          createdAt: new Date().toISOString(),
          author: { fullName: 'Admin' }
        }
      ],
      recentPosts: [],
      recentUsers: [],
      systemInfo: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      }
    }
  });
});

module.exports = router;