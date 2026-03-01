'use client';

import { Calendar, Mail, Phone, User } from 'lucide-react';
import type { UserProfile } from './index';

interface UserProfileCardProps {
  user: UserProfile;
  editMode: boolean;
  editForm: { full_name: string; role: string; email_notifications: boolean; phone_number: string; };
  onEditFormChange: (updates: Partial<UserProfileCardProps['editForm']>) => void;
}

const inputCls = 'w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-[#0f0f17] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-colors';

export function UserProfileCard({ user, editMode, editForm, onEditFormChange }: UserProfileCardProps) {
  return (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg">

      {/* Section header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Profile Information</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Personal details and account identifiers</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">

          {/* Full name */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <User className="w-3.5 h-3.5" />
              Full name
            </label>
            {editMode ? (
              <input
                type="text"
                value={editForm.full_name}
                onChange={(e) => onEditFormChange({ full_name: e.target.value })}
                placeholder="Full name"
                className={inputCls}
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-white">{user.full_name || <span className="text-gray-400 italic">Not set</span>}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <User className="w-3.5 h-3.5" />
              Role
            </label>
            {editMode ? (
              <select
                value={editForm.role}
                onChange={(e) => onEditFormChange({ role: e.target.value })}
                className={inputCls}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            ) : (
              <p className="text-sm text-gray-900 dark:text-white">{user.role.replace(/_/g, ' ')}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email address
            </label>
            <p className="text-sm text-gray-900 dark:text-white font-mono break-all">{user.email}</p>
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <Phone className="w-3.5 h-3.5" />
              Phone
            </label>
            {editMode ? (
              <input
                type="text"
                value={editForm.phone_number}
                onChange={(e) => onEditFormChange({ phone_number: e.target.value })}
                placeholder="Phone number"
                className={inputCls}
              />
            ) : (
              <p className="text-sm text-gray-900 dark:text-white">{user.phone_number || <span className="text-gray-400 italic">Not provided</span>}</p>
            )}
          </div>

          {/* Joined */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Joined
            </label>
            <p className="text-sm text-gray-900 dark:text-white">{new Date(user.created_at).toLocaleDateString()}</p>
          </div>

          {/* Last active */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Last active
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : <span className="text-gray-400">Never</span>}
            </p>
          </div>

          {/* User ID - full width */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <User className="w-3.5 h-3.5" />
              User ID
            </label>
            <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all bg-gray-50 dark:bg-gray-800/50 rounded px-3 py-2 border border-gray-100 dark:border-gray-800">
              {user.user_id}
            </p>
          </div>

          {/* Email notifications */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Email notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Receive system and marketing emails</p>
              </div>
              {editMode ? (
                <button
                  type="button"
                  onClick={() => onEditFormChange({ email_notifications: !editForm.email_notifications })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${editForm.email_notifications ? 'bg-gray-600 dark:bg-gray-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${editForm.email_notifications ? 'translate-x-[18px]' : 'translate-x-1'}`} />
                </button>
              ) : (
                <span className={`text-xs font-medium ${user.email_notifications ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                  {user.email_notifications ? 'Enabled' : 'Disabled'}
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}