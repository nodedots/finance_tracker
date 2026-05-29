'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  location: string;
  gmailLinked: boolean;
  smsActive: boolean;
  cameraEnabled: boolean;
}

interface Props {
  initialUser: User | null;
}

const steps = [
  { label: 'Profile', icon: 'person' },
  { label: 'Connect', icon: 'hub' },
  { label: 'Capture', icon: 'receipt_long' },
];

export default function OnboardingFlow({ initialUser }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser?.name || '');
  const [email, setEmail] = useState(initialUser?.email || '');
  const [location, setLocation] = useState(initialUser?.location || '');
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  async function patchUser(data: Partial<User>) {
    setSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: user ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile() {
    if (!email.trim()) {
      setProfileError('Email is required to create your account.');
      return;
    }
    setProfileError(null);
    await patchUser({ name, email, location });
    setStep(1);
  }

  async function finish() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('fintrack:onboarded', 'true');
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f0f1f2] px-4 py-6 sm:px-6 sm:py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex min-w-0 items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-['Manrope'] font-black text-2xl sm:text-3xl text-zinc-900">Set up Fintrack</h1>
              <p className="text-sm text-zinc-500">Connect your transaction sources in a few steps.</p>
            </div>
            </Link>
            <Link href="/dashboard" className="inline-flex px-4 py-2 rounded-xl bg-white border border-zinc-100 text-sm font-semibold text-zinc-600 hover:bg-zinc-50">
              Skip
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {steps.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setStep(index)}
                className={`flex items-center justify-center gap-1 rounded-xl px-2 py-3 text-[11px] font-black uppercase tracking-[0.16em] transition-colors sm:gap-2 sm:text-xs sm:tracking-widest ${
                  index === step ? 'bg-black text-white' : 'bg-white text-zinc-400 border border-zinc-100'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-zinc-100 rounded-2xl p-6 md:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Account</p>
                <h2 className="font-['Manrope'] font-bold text-2xl text-zinc-900">Confirm your local profile</h2>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Name</span>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="mt-2 w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Email</span>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="mt-2 w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Location</span>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Optional" className="mt-2 w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 px-4 text-sm text-zinc-900 focus:ring-2 focus:ring-black" />
              </label>
              {profileError && <p className="text-sm font-semibold text-red-600">{profileError}</p>}
              <button onClick={saveProfile} disabled={saving} className="w-full bg-black text-white py-4 rounded-xl font-semibold disabled:opacity-50">
                {saving ? 'Saving...' : user ? 'Continue' : 'Create Account'}
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Connections</p>
                <h2 className="font-['Manrope'] font-bold text-2xl text-zinc-900">Choose capture channels</h2>
              </div>
              <ConnectionCard
                icon="mail"
                title="Email receipts"
                detail="Enable receipt intake for forwarded emails or a future OAuth inbox connection."
                connected={Boolean(user?.gmailLinked)}
                onClick={() => patchUser({ gmailLinked: !user?.gmailLinked })}
              />
              <ConnectionCard
                icon="sms"
                title="Bank SMS alerts"
                detail="Enable alert capture for pasted, forwarded, or mobile-permission SMS records."
                connected={Boolean(user?.smsActive)}
                onClick={() => patchUser({ smsActive: !user?.smsActive })}
              />
              <ConnectionCard
                icon="photo_camera"
                title="Receipt camera"
                detail="Enable receipt capture with image extraction and editable review before saving."
                connected={Boolean(user?.cameraEnabled)}
                onClick={() => patchUser({ cameraEnabled: !user?.cameraEnabled })}
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={() => setStep(0)} className="flex-1 bg-zinc-100 text-zinc-700 py-4 rounded-xl font-semibold">Back</button>
                <button onClick={() => setStep(2)} className="flex-1 bg-black text-white py-4 rounded-xl font-semibold">Continue</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">Ready</p>
                <h2 className="font-['Manrope'] font-bold text-2xl text-zinc-900">Your capture workflow is set</h2>
                <p className="text-sm text-zinc-500 mt-2">
                  Start with receipt capture now, then add real email/SMS integrations when you are ready for OAuth, permissions, and privacy review.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatusPill label="Email" active={Boolean(user?.gmailLinked)} />
                <StatusPill label="SMS" active={Boolean(user?.smsActive)} />
                <StatusPill label="Camera" active={Boolean(user?.cameraEnabled)} />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={() => setStep(1)} className="flex-1 bg-zinc-100 text-zinc-700 py-4 rounded-xl font-semibold">Back</button>
                <button onClick={finish} className="flex-1 bg-black text-white py-4 rounded-xl font-semibold">Go to Dashboard</button>
              </div>
              <Link href="/scan" className="flex items-center justify-center gap-2 w-full bg-zinc-100 text-zinc-700 py-4 rounded-xl font-semibold">
                <span className="material-symbols-outlined text-lg">photo_camera</span>
                Capture a Receipt
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectionCard({
  icon,
  title,
  detail,
  connected,
  onClick,
}: {
  icon: string;
  title: string;
  detail: string;
  connected: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left flex items-start gap-4 p-4 rounded-2xl border border-zinc-100 hover:bg-zinc-50 transition-colors">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${connected ? 'bg-[#009844] text-white' : 'bg-zinc-100 text-zinc-600'}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-zinc-900">{title}</p>
        <p className="text-xs text-zinc-500 mt-1">{detail}</p>
      </div>
      <span className={`text-xs font-black uppercase tracking-widest ${connected ? 'text-[#009844]' : 'text-zinc-400'}`}>
        {connected ? 'Connected' : 'Connect'}
      </span>
    </button>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${active ? 'border-[#009844]/20 bg-[#009844]/10' : 'border-zinc-100 bg-zinc-50'}`}>
      <p className="text-xs font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className={`font-semibold text-sm mt-1 ${active ? 'text-[#009844]' : 'text-zinc-500'}`}>{active ? 'Enabled' : 'Skipped'}</p>
    </div>
  );
}
