"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function LoginTest() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState({
    username: 'admin',
    password: '123456'
  })

  const testLogin = async () => {
    setLoading(true)
    try {
      const { authApi } = await import('@/lib/api')
      const response = await authApi.login(credentials)
      setResult({ type: 'login', response })
      
      if (response.success) {
        // Try to fetch posts right after login
        const { postApi } = await import('@/lib/api')
        const postsResponse = await postApi.getPosts()
        setResult(prev => ({ ...prev, postsResponse }))
      }
    } catch (error) {
      setResult({ type: 'error', error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testPosts = async () => {
    setLoading(true)
    try {
      const { postApi } = await import('@/lib/api')
      const response = await postApi.getPosts()
      setResult({ type: 'posts', response })
    } catch (error) {
      setResult({ type: 'error', error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testActivities = async () => {
    setLoading(true)
    try {
      const { activityApi } = await import('@/lib/api')
      const response = await activityApi.getActivities()
      setResult({ type: 'activities', response })
    } catch (error) {
      setResult({ type: 'error', error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkStorage = () => {
    const token = localStorage.getItem('auth_token')
    const user = localStorage.getItem('user')
    setResult({
      type: 'storage',
      token: token ? token.substring(0, 20) + '...' : 'No token',
      user: user ? JSON.parse(user) : 'No user'
    })
  }

  const clearStorage = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setResult({ type: 'cleared', message: 'Storage cleared' })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Login & API Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Credentials */}
        <div className="space-y-2">
          <Input
            placeholder="Username"
            value={credentials.username}
            onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
          />
          <Input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
          />
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={testLogin} disabled={loading} variant="outline">
            🔐 Test Login
          </Button>
          <Button onClick={testPosts} disabled={loading} variant="outline">
            📰 Test Posts
          </Button>
          <Button onClick={testActivities} disabled={loading} variant="outline">
            📅 Test Activities
          </Button>
          <Button onClick={checkStorage} disabled={loading} variant="outline">
            💾 Check Storage
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button onClick={clearStorage} disabled={loading} variant="destructive">
            🗑️ Clear Storage
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded text-xs">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{result.type}</Badge>
              {result.response?.success && <Badge className="bg-green-100 text-green-800">Success</Badge>}
              {result.response?.success === false && <Badge className="bg-red-100 text-red-800">Failed</Badge>}
            </div>
            <pre className="overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

