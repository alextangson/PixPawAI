'use client';

import { useState, useEffect } from 'react';
import { Plus, Copy, Check, Trash2, Ban, CheckCircle, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReferralCode {
  id: string;
  code: string;
  type: 'beta_invite' | 'user_referral';
  createdByType: 'admin' | 'user';
  newUserReward: number;
  referrerReward: number;
  currentUses: number;
  maxUses: number | null;
  isActive: boolean;
  expiresAt: string | null;
  deactivatedAt: string | null;
  createdAt: string;
}

export default function ReferralCodesAdminPage() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    newUserReward: 20,
    maxUses: 100,
    expiresAt: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await fetch('/api/admin/referral/create');
      if (response.ok) {
        const data = await response.json();
        setCodes(data.codes);
      }
    } catch (error) {
      console.error('Failed to fetch codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/admin/referral/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          type: 'beta_invite',
          newUserReward: formData.newUserReward,
          maxUses: formData.maxUses || null,
          expiresAt: formData.expiresAt || null,
        }),
      });

      if (response.ok) {
        alert('✅ Referral code created successfully!');
        setShowCreateForm(false);
        setFormData({ code: '', newUserReward: 20, maxUses: 100, expiresAt: '' });
        fetchCodes();
      } else {
        const error = await response.json();
        alert('❌ Error: ' + (error.error || 'Failed to create code'));
      }
    } catch (error) {
      console.error('Failed to create code:', error);
      alert('❌ Failed to create code');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pixpaw.ai';
    const url = `${baseUrl}?invite=${code}`;
    
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Referral Codes</h1>
            <p className="text-gray-600 mt-2">Manage beta invite codes and user referrals</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-coral hover:bg-orange-600 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Beta Invite Code
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-orange-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create Beta Invite Code</h3>
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code (e.g., BETA2024)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
                    placeholder="BETA2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Credits for New User
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.newUserReward}
                    onChange={(e) => setFormData({ ...formData, newUserReward: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Uses (leave empty for unlimited)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expires At (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-coral hover:bg-orange-600 text-white"
                >
                  {creating ? 'Creating...' : 'Create Code'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Codes</p>
                <p className="text-3xl font-bold text-gray-900">{codes.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Codes</p>
                <p className="text-3xl font-bold text-green-600">
                  {codes.filter(c => c.isActive).length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Beta Invites</p>
                <p className="text-3xl font-bold text-coral">
                  {codes.filter(c => c.type === 'beta_invite').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Uses</p>
                <p className="text-3xl font-bold text-purple-600">
                  {codes.reduce((sum, c) => sum + c.currentUses, 0)}
                </p>
              </div>
              <Users className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Codes Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm font-bold text-coral">{code.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        code.type === 'beta_invite' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {code.type === 'beta_invite' ? 'Beta Invite' : 'User Referral'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {code.newUserReward} credits
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {code.currentUses} {code.maxUses ? `/ ${code.maxUses}` : '/ ∞'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {code.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(code.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="text-coral hover:text-orange-600 mr-3"
                        title="Copy invite link"
                      >
                        {copiedCode === code.code ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {codes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No referral codes yet. Create your first beta invite code!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
