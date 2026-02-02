'use client';

import { useEffect, useMemo, useState } from 'react';
import { profileApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationTimeSettingsProps {
  initialTime?: string | null;
  disabled?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function NotificationTimeSettings({
  initialTime,
  disabled = false,
  onSuccess,
  onError,
}: NotificationTimeSettingsProps) {
  const { fetchUser } = useAuth();
  const defaultTime = useMemo(() => initialTime || '09:00', [initialTime]);
  const [time, setTime] = useState(defaultTime);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTime(defaultTime);
  }, [defaultTime]);

  const hasChanges = time !== defaultTime;

  const handleSave = async () => {
    if (disabled || !hasChanges) return;
    setSaving(true);

    try {
      await profileApi.updateNotificationTime(time);
      await fetchUser();
      onSuccess?.('通知時刻を更新しました');
    } catch (err) {
      onError?.(err instanceof Error ? err.message : '通知時刻の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">LINE通知の時刻</h2>
      <p className="text-sm text-gray-600 mb-4">毎日の通知を受け取る時刻を設定できます。</p>

      <div className="flex items-center gap-3">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          disabled={disabled || saving}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || saving || !hasChanges}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {disabled && <p className="text-xs text-gray-500 mt-3">ログイン後に設定できます。</p>}
    </div>
  );
}
