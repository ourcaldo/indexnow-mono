'use client';

import { User, Mail, Phone, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import type { UserProfile } from './index';

interface UserProfileCardProps {
  user: UserProfile;
  editMode: boolean;
  editForm: { full_name: string; role: string; email_notifications: boolean; phone_number: string; };
  onEditFormChange: (updates: Partial<UserProfileCardProps['editForm']>) => void;
}

const inputCls = 'px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-[#0f0f17] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-colors';

function roleChip(role: string) {
  if (role === 'super_admin') return 'bg-gray-200 text-gray-800 dark:bg-white/10 dark:text-gray-200';
  if (role === 'admin') return 'bg-gray-100 text-gray-700 dark:bg-white/[0.07] dark:text-gray-300';
  return 'bg-gray-100 text-gray-600 dark:bg-white/[0.05] dark:text-gray-400';
}

export function UserProfileCard({ user, editMode, editForm, onEditFormChange }: UserProfileCardProps) {
  return (
    <div className="bg-white dark:bg-[#141520] border border-gray-200 dark:border-gray-800 rounded-lg p-6">
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-gray-600 dark:text-gray-300 select-none">
            {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </span>
        </div>

        <div className="flex-1 min-w-0 space-y-4">
          {/* Name + role row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {!editMode ? (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user.full_name || 'No name set'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </>
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => onEditFormChange({ full_name: e.target.value })}
                    placeholder="Full name"
                    className={`text-lg font-semibold ${inputCls}`}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!editMode ? (
                <>
                  <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-md ${roleChip(user.role)}`}>
                    {user.role.replace(/_/g, ' ')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    {user.email_confirmed_at
                      ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Verified</>
                      : <><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Unverified</>}
                  </span>
                </>
              ) : (
                <select
                  value={editForm.role}
                  onChange={(e) => onEditFormChange({ role: e.target.value })}
                  className={inputCls}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              )}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">User ID</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white break-all">{user.user_id}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</p>
                {!editMode ? (
                  <p className="text-sm text-gray-900 dark:text-white">{user.phone_number || 'Not provided'}</p>
                ) : (
                  <input type="text" value={editForm.phone_number} onChange={(e) => onEditFormChange({ phone_number: e.target.value })} placeholder="Phone number" className={inputCls} />
                )}
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Joined</p>
                <p className="text-sm text-gray-900 dark:text-white">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Last active</p>
                <p className="text-sm text-gray-900 dark:text-white">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Email notifications</p>
                {!editMode ? (
                  <p className="text-sm text-gray-900 dark:text-white">{user.email_notifications ? 'Enabled' : 'Disabled'}</p>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editForm.email_notifications} onChange={(e) => onEditFormChange({ email_notifications: e.target.checked })}
                      className="w-4 h-4 text-gray-700 border-gray-300 rounded focus:ring-1 focus:ring-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">Enable notifications</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
