"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DataDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testEverything = async () => {
    setLoading(true)
    const info: any = {
      timestamp: new Date().toISOString(),
      localStorage: {},
      apis: {},
      errors: []
    }

    try {
      // 1. Check localStorage
      if (typeof window !== 'undefined') {
        info.localStorage = {
          auth_token: localStorage.getItem('auth_token') ? 'EXISTS' : 'MISSING',
          user: localStorage.getItem('user') ? 'EXISTS' : 'MISSING',
          auth_token_preview: localStorage.getItem('auth_token')?.substring(0, 20),
          user_data: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
        }
      }

      // 2. Test authentication functions
      const { isAuthenticated, getAuthToken, getStoredUser } = await import('@/lib/api')
      info.auth = {
        isAuthenticated: isAuthenticated(),
        hasToken: !!getAuthToken(),
        hasUser: !!getStoredUser(),
        token_preview: getAuthToken()?.substring(0, 20),
        user_data: getStoredUser()
      }

      // 3. Test APIs
      const { postApi, activityApi } = await import('@/lib/api')
      
      try {
        const postsResult = await postApi.getPosts({ limit: 5 })
        info.apis.posts = {
          success: postsResult.success,
          error: postsResult.error,
          dataCount: postsResult.data?.data?.length || 0,
          sampleData: postsResult.data?.data?.[0]
        }
      } catch (e: any) {
        info.apis.posts = { error: e.message }
        info.errors.push(`Posts API: ${e.message}`)
      }

      try {
        const activitiesResult = await activityApi.getActivities({ limit: 5 })
        info.apis.activities = {
          success: activitiesResult.success,
          error: activitiesResult.error,
          dataCount: activitiesResult.data?.data?.length || 0,
          sampleData: activitiesResult.data?.data?.[0]
        }
      } catch (e: any) {
        info.apis.activities = { error: e.message }
        info.errors.push(`Activities API: ${e.message}`)
      }

      // 4. Test direct fetch
      try {
        const directFetch = await fetch('http://localhost:3001/api/health')
        const healthData = await directFetch.json()
        info.directAPI = {
          health: healthData,
          status: directFetch.status
        }
      } catch (e: any) {
        info.directAPI = { error: e.message }
        info.errors.push(`Direct API: ${e.message}`)
      }

    } catch (e: any) {
      info.errors.push(`General error: ${e.message}`)
    }

    setDebugInfo(info)
    setLoading(false)
  }

  const clearStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      setDebugInfo(null)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Data Debug Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testEverything} disabled={loading}>
            {loading ? 'Testing...' : '🔍 Test Everything'}
          </Button>
          <Button onClick={clearStorage} variant="destructive">
            🗑️ Clear Storage
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            🔄 Reload Page
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={debugInfo.auth?.isAuthenticated ? "default" : "destructive"}>
                Auth: {debugInfo.auth?.isAuthenticated ? "OK" : "FAIL"}
              </Badge>
              <Badge variant={debugInfo.apis?.posts?.success ? "default" : "destructive"}>
                Posts: {debugInfo.apis?.posts?.success ? `${debugInfo.apis.posts.dataCount} items` : "FAIL"}
              </Badge>
              <Badge variant={debugInfo.apis?.activities?.success ? "default" : "destructive"}>
                Activities: {debugInfo.apis?.activities?.success ? `${debugInfo.apis.activities.dataCount} items` : "FAIL"}
              </Badge>
              <Badge variant={debugInfo.directAPI?.health ? "default" : "destructive"}>
                Backend: {debugInfo.directAPI?.health ? "OK" : "FAIL"}
              </Badge>
            </div>

            {/* Errors */}
            {debugInfo.errors?.length > 0 && (
              <div className="bg-red-50 p-4 rounded border border-red-200">
                <h3 className="font-bold text-red-800 mb-2">🚨 Errors:</h3>
                {debugInfo.errors.map((error: string, i: number) => (
                  <div key={i} className="text-red-700 text-sm">• {error}</div>
                ))}
              </div>
            )}

            {/* Detailed Info */}
            <div className="bg-gray-50 p-4 rounded">
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

