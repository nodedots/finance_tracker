'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  currency: string;
  pushNotifications: boolean;
  gmailLinked: boolean;
  smsActive: boolean;
  cameraEnabled: boolean;
}

interface Props {
  initialUser: User;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${checked ? 'bg-black' : 'bg-zinc-300'}`}
    >
      <span className={`inline-block w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function SettingsContent({ initialUser }: Props) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);

  async function updateField(field: string, value: boolean | string) {
    const res = await fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      router.refresh();
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await updateField('name', name);
      await updateField('email', email);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section className="bg-white rounded-2xl p-6 border border-zinc-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[32px]">account_circle</span>
            </div>
            <div>
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="block bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm font-semibold text-zinc-900 w-full focus:ring-2 focus:ring-black"
                  />
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="block bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm text-zinc-600 w-full focus:ring-2 focus:ring-black"
                  />
                </div>
              ) : (
                <>
                  <h2 className="font-['Manrope'] font-semibold text-xl text-zinc-900">{user.name}</h2>
                  <p className="text-sm text-zinc-500">{user.email}</p>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-700">Cancel</button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="px-4 py-1.5 text-sm font-semibold bg-black text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            )}
          </div>
        </div>
        <div className="inline-flex items-center px-3 py-1 bg-[#6bff8f] text-[#002109] rounded-full text-[12px] font-bold tracking-wider uppercase">
          {user.plan === 'pro' ? 'Verified' : 'Community'} Account
        </div>
      </section>

      {/* Data Sources */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-1">Data Sources</h3>
        <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-zinc-900">Gmail</p>
                <p className="text-xs text-zinc-500">Scanning receipts automatically</p>
              </div>
            </div>
            <Toggle checked={user.gmailLinked} onChange={v => updateField('gmailLinked', v)} />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined">sms</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-zinc-900">SMS Notifications</p>
                <p className="text-xs text-zinc-500">Bank alert parsing</p>
              </div>
            </div>
            <Toggle checked={user.smsActive} onChange={v => updateField('smsActive', v)} />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
                <span className="material-symbols-outlined">camera_alt</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-zinc-900">Camera Permissions</p>
                <p className="text-xs text-zinc-500">Manual receipt capture</p>
              </div>
            </div>
            <Toggle checked={user.cameraEnabled} onChange={v => updateField('cameraEnabled', v)} />
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-1">Preferences</h3>
        <div className="bg-white rounded-2xl border border-zinc-100 divide-y divide-zinc-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-zinc-900">Default Currency</p>
                <p className="text-xs text-zinc-500">{user.currency}</p>
              </div>
            </div>
            <select
              value={user.currency}
              onChange={e => updateField('currency', e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg py-1.5 px-3 text-sm text-zinc-700 focus:ring-2 focus:ring-black"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
                <span className="material-symbols-outlined">notifications_active</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-zinc-900">Push Notifications</p>
                <p className="text-xs text-zinc-500">Instant transaction alerts</p>
              </div>
            </div>
            <Toggle checked={user.pushNotifications} onChange={v => updateField('pushNotifications', v)} />
          </div>
        </div>
      </section>
    </div>
  );
}
