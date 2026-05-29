import Link from 'next/link';

const sections = [
  {
    title: 'What Fintrack Does',
    body: [
      'Fintrack helps you record and organize financial activity from sources you choose to connect or upload, including email receipts, SMS alerts, bank alert text, and scanned receipts.',
      'Fintrack is an organization and record-keeping tool. It is not a bank, lender, investment adviser, accountant, tax adviser, or legal adviser.',
    ],
  },
  {
    title: 'Your Data',
    body: [
      'You own the information you enter, upload, connect, or capture in Fintrack. This includes profile details, receipts, transaction records, categories, notes, and connection preferences.',
      'The local prototype stores data in the app database on this machine. If Fintrack is deployed with cloud storage or third-party integrations, those services may process data needed to provide the feature.',
    ],
  },
  {
    title: 'Receipts, Email, and SMS',
    body: [
      'Fintrack only processes receipt images, email content, SMS content, or alert text that you provide, upload, forward, paste, or explicitly authorize through a connection flow.',
      'When AI extraction is enabled, receipt images or text may be sent to the configured AI provider to identify merchant names, dates, amounts, categories, and notes. You should review extracted results before saving them.',
    ],
  },
  {
    title: 'Accuracy',
    body: [
      'Automated extraction can make mistakes. Amounts, merchants, dates, categories, and notes should be reviewed before you rely on them.',
      'You are responsible for confirming that your records are complete and accurate, especially before using them for budgeting, accounting, tax, reimbursement, or reporting purposes.',
    ],
  },
  {
    title: 'Security',
    body: [
      'Fintrack is designed to minimize unnecessary data entry and keep sensitive records organized. You should still protect access to your device, database, API keys, and connected accounts.',
      'Do not upload or connect information you are not authorized to use. If you deploy this app publicly, add authentication, encryption, access controls, audit logging, and a reviewed privacy policy before handling real user data.',
    ],
  },
  {
    title: 'Third-Party Services',
    body: [
      'Some features may rely on third-party providers, such as email providers, SMS platforms, cloud hosting, AI extraction services, or database services.',
      'Your use of those services may be subject to their own terms, privacy policies, rate limits, fees, and data processing practices.',
    ],
  },
  {
    title: 'No Financial Advice',
    body: [
      'Insights, summaries, categories, savings rates, and spending views are informational only.',
      'Fintrack does not provide financial, legal, accounting, or tax advice. You should consult a qualified professional for decisions that require professional advice.',
    ],
  },
  {
    title: 'Changes',
    body: [
      'These terms may be updated as the product changes. Continued use of Fintrack after changes means you accept the updated terms.',
      'For a production launch, replace this page with reviewed legal terms and a privacy policy that match your actual deployment, data flows, vendors, and jurisdiction.',
    ],
  },
];

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-[#f8f9fa] text-zinc-900">
      <header className="bg-white border-b border-zinc-100">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <span className="text-xl font-black font-['Manrope'] tracking-tighter">Fintrack</span>
          </Link>
          <Link href="/onboarding" className="px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold">
            Set Up
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <div className="mb-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-3">Legal</p>
          <h1 className="font-['Manrope'] font-black text-4xl md:text-6xl tracking-tight mb-4">Terms & Privacy</h1>
          <p className="text-zinc-500 text-base md:text-lg leading-relaxed max-w-2xl">
            This page explains how Fintrack should be used, what data it handles, and the limits of automated financial record capture.
          </p>
          <p className="text-xs text-zinc-400 mt-4">Last updated: May 29, 2026</p>
        </div>

        <div className="space-y-4">
          {sections.map(section => (
            <section key={section.title} className="bg-white border border-zinc-100 rounded-2xl p-6">
              <h2 className="font-['Manrope'] font-bold text-xl mb-3">{section.title}</h2>
              <div className="space-y-3">
                {section.body.map(paragraph => (
                  <p key={paragraph} className="text-sm md:text-base text-zinc-600 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 bg-zinc-900 text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-['Manrope'] font-bold text-xl">Need to review your setup?</h2>
            <p className="text-sm text-zinc-400 mt-1">Manage connected sources and capture preferences from onboarding or settings.</p>
          </div>
          <Link href="/onboarding" className="inline-flex justify-center px-5 py-3 bg-white text-black rounded-xl font-semibold text-sm">
            Go to Setup
          </Link>
        </div>
      </section>
    </main>
  );
}
