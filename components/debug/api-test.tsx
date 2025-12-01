"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export function ApiTest() {
  const [healthResult, setHealthResult] = useState<string>('')
  const [loginResult, setLoginResult] = useState<string>('')
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [isLoading, setIsLoading] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    checkBackendStatus()
  }, [])

  const checkBackendStatus = async () => {
    setBackendStatus('checking')
    try {
      const { checkBackendHealth } = await import('@/lib/api')
      const isOnline = await checkBackendHealth()
      setBackendStatus(isOnline ? 'online' : 'offline')
    } catch (error) {
      setBackendStatus('offline')
    }
  }

  const testHealth = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/health')
      const data = await response.json()
      setHealthResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setHealthResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testLogin = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })
      
      const data = await response.json()
      setLoginResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setLoginResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testRealAPI = async () => {
    setIsLoading(true)
    try {
      const { authApi } = await import('@/lib/api')
      const result = await authApi.login({ username, password })
      setLoginResult(JSON.stringify(result, null, 2))
    } catch (error) {
      setLoginResult(`API Service Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>🔧 API Debug Tools</span>
            <div className="flex items-center gap-2">
              <span className="text-sm">Backend:</span>
              <Badge 
                variant={backendStatus === 'online' ? 'default' : backendStatus === 'offline' ? 'destructive' : 'secondary'}
              >
                {backendStatus === 'checking' ? 'Checking...' : 
                 backendStatus === 'online' ? '🟢 Online' : '🔴 Offline (Using Mock)'}
              </Badge>
              <Button size="sm" variant="outline" onClick={checkBackendStatus}>
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Health Check */}
          <div>
            <h3 className="font-semibold mb-2">Health Check</h3>
            <Button onClick={testHealth} disabled={isLoading}>
              Test Health Endpoint
            </Button>
            {healthResult && (
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {healthResult}
              </pre>
            )}
          </div>

          {/* Login Test */}
          <div>
            <h3 className="font-semibold mb-2">Login Test</h3>
            <div className="flex gap-2 mb-2">
              <Input 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input 
                type="password"
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={testLogin} disabled={isLoading}>
                Direct API Test
              </Button>
              <Button onClick={testRealAPI} disabled={isLoading} variant="secondary">
                API Service Test
              </Button>
            </div>
            {loginResult && (
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {loginResult}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
