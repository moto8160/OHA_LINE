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

const generateTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      options.push(`${h}:${m}`);
    }
  }
  return options;
};

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
  const timeOptions = useMemo(() => generateTimeOptions(), []);

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
    <div className="bg-white/90 border border-slate-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
          ⏰
        </div>
        <h2 className="text-lg font-semibold text-slate-900">LINE通知の時刻</h2>
      </div>
      <p className="text-sm text-slate-600 mb-4">毎日の通知を受け取る時刻を設定できます。</p>

      <div className="flex items-center gap-3">
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          disabled={disabled || saving}
          className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent disabled:bg-slate-100"
        >
          {timeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || saving || !hasChanges}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {disabled && <p className="text-xs text-slate-500 mt-3">ログイン後に設定できます。</p>}
    </div>
  );
}
