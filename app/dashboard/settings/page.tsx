'use client'

import { useAppStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Lock, Bell, Palette, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const { currentUser } = useAppStore()

  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center gap-3">
            <User className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Account Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Name
              </label>
              <div className="px-4 py-2 bg-slate-700 rounded-lg text-white border border-slate-600">
                {currentUser?.name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="px-4 py-2 bg-slate-700 rounded-lg text-white border border-slate-600">
                {currentUser?.email}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Role
              </label>
              <div className="px-4 py-2 bg-slate-700 rounded-lg text-white border border-slate-600 capitalize">
                {currentUser?.role.replace('_', ' ')}
              </div>
            </div>
            <div className="pt-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center gap-3">
            <Lock className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold text-white">Security</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Password Management</h3>
              <p className="text-sm text-slate-400 mb-4">
                Keep your account secure by changing your password regularly
              </p>
              <Button className="bg-slate-700 hover:bg-slate-600 text-white">
                Change Password
              </Button>
            </div>
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-sm font-medium text-white mb-3">Active Sessions</h3>
              <p className="text-sm text-slate-400 mb-4">
                Currently signed in on 1 device
              </p>
              <Button className="bg-slate-700 hover:bg-slate-600 text-white">
                Manage Sessions
              </Button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center gap-3">
            <Bell className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Notifications</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Email Notifications</p>
                <p className="text-xs text-slate-500 mt-1">Receive updates about your RFQs and POs</p>
              </div>
              <div className="w-12 h-7 bg-green-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Invoice Alerts</p>
                <p className="text-xs text-slate-500 mt-1">Get notified about pending invoices</p>
              </div>
              <div className="w-12 h-7 bg-green-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="border-t border-slate-700 pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Vendor Updates</p>
                <p className="text-xs text-slate-500 mt-1">Notifications from vendor actions</p>
              </div>
              <div className="w-12 h-7 bg-slate-600 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center gap-3">
            <Palette className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Appearance</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Theme
              </label>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                  Dark
                </button>
                <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600">
                  Light
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold text-white">System Information</h2>
          </div>
          <div className="p-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Application</span>
              <span className="text-white">VendorBridge ERP</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Version</span>
              <span className="text-white">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Last Updated</span>
              <span className="text-white">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status</span>
              <span className="text-green-400 font-medium">Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
