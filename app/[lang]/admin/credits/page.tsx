'use client'

/**
 * Credit Management Page
 * 
 * 功能：
 * - 通过邮箱搜索用户
 * - 显示用户当前 credits
 * - 给用户充值 credits
 * - 操作记录
 */

import { useState } from 'react'
import { Search, Plus, AlertCircle, CheckCircle, Loader2, User, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface UserInfo {
  id: string
  email: string
  currentCredits: number
}

export default function CreditManagementPage() {
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [operationType, setOperationType] = useState<'add' | 'deduct'>('add') // 操作类型：充值或扣除

  // 搜索用户
  const handleSearch = async () => {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' })
      return
    }

    setIsSearching(true)
    setMessage(null)
    setUserInfo(null)

    try {
      // 先通过 Supabase Admin API 获取用户信息
      const response = await fetch('/api/admin/search-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search user')
      }

      setUserInfo(data.user)
      setMessage({ type: 'success', text: `Found user: ${data.user.email}` })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsSearching(false)
    }
  }

  // 充值/扣除 credits
  const handleAddCredits = async () => {
    if (!userInfo) {
      setMessage({ type: 'error', text: 'Please search for a user first' })
      return
    }

    const amountNum = parseInt(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' })
      return
    }

    // 如果是扣除操作，传负数
    const finalAmount = operationType === 'deduct' ? -amountNum : amountNum

    setIsAdding(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIdentifier: userInfo.email,
          amount: finalAmount, // 扣除时传负数
          reason: reason.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add credits')
      }

      // 更新用户信息
      setUserInfo({
        ...userInfo,
        currentCredits: data.user.newCredits
      })

      setMessage({ type: 'success', text: data.message })
      setAmount('')
      setReason('')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setIsAdding(false)
    }
  }

  // 快速充值按钮
  const quickAmounts = [1, 5, 10, 20, 50, 100]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Coins className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit Management</h1>
          <p className="text-gray-600">给用户充值积分</p>
        </div>
      </div>

      {/* 搜索用户 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search User
        </h2>
        
        <div className="flex gap-3">
          <Input
            type="email"
            placeholder="Enter user email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !email.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* 消息提示 */}
      {message && (
        <Card className={`p-4 border-l-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-500' 
            : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-start gap-3">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        </Card>
      )}

      {/* 用户信息和充值表单 */}
      {userInfo && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            User Information
          </h2>

          {/* 用户信息卡片 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{userInfo.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">User ID:</span>
              <span className="font-mono text-sm text-gray-500">{userInfo.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-gray-600 font-medium">Current Credits:</span>
              <span className="text-2xl font-bold text-blue-600">{userInfo.currentCredits}</span>
            </div>
          </div>

          {/* 充值表单 */}
          <div className="space-y-4">
            {/* 操作类型选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation Type
              </label>
              <div className="flex gap-2">
                <Button
                  variant={operationType === 'add' ? 'default' : 'outline'}
                  onClick={() => setOperationType('add')}
                  className={operationType === 'add' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Credits
                </Button>
                <Button
                  variant={operationType === 'deduct' ? 'default' : 'outline'}
                  onClick={() => setOperationType('deduct')}
                  className={operationType === 'deduct' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <Plus className="w-4 h-4 mr-1 rotate-45" />
                  Deduct Credits
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {operationType === 'add' ? 'Amount to Add' : 'Amount to Deduct'}
              </label>
              <Input
                type="number"
                min="1"
                placeholder="Enter amount..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              
              {/* 快速充值/扣除按钮 */}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs text-gray-500 w-full">
                  Quick {operationType === 'add' ? 'add' : 'deduct'}:
                </span>
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    size="sm"
                    variant="outline"
                    onClick={() => setAmount(amt.toString())}
                    className="text-xs"
                  >
                    {operationType === 'add' ? '+' : '-'}{amt}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g., Manual adjustment, Compensation, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button
              onClick={handleAddCredits}
              disabled={isAdding || !amount || parseInt(amount) <= 0}
              className={`w-full text-lg py-6 ${
                operationType === 'add' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {operationType === 'add' ? 'Adding' : 'Deducting'} Credits...
                </>
              ) : (
                <>
                  <Plus className={`w-5 h-5 mr-2 ${operationType === 'deduct' ? 'rotate-45' : ''}`} />
                  {operationType === 'add' ? 'Add' : 'Deduct'} {amount || '0'} Credits
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* 使用提示 */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Usage Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>输入用户邮箱并搜索</li>
          <li>确认用户信息无误后输入充值金额</li>
          <li>可选填写充值原因（方便日后审计）</li>
          <li>点击 "Add Credits" 按钮完成充值</li>
          <li>所有操作都会记录在服务器日志中</li>
        </ul>
      </Card>
    </div>
  )
}
