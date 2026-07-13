import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, initializeFirestore, collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMwk_CY8S2fV1cYaQYX_nEaMVlEdpOxv4",
  authDomain: "fintrack-5379c.firebaseapp.com",
  projectId: "fintrack-5379c",
  storageBucket: "fintrack-5379c.firebasestorage.app",
  messagingSenderId: "842419163448",
  appId: "1:842419163448:web:a2ce9e11f33de86a4f71cd",
  measurementId: "G-D0D2SGZBWG"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = initializeFirestore(firebaseApp, { experimentalForceLongPolling: true });
const storage = getStorage(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const app = document.getElementById('app');
let isBooted = false;

// Handle Redirect Result for Google Auth
getRedirectResult(auth).then(async (result) => {
  if (result && result.user) {
    await initializeNewUser(result.user, '');
    state.authModalOpen = false;
    navigate('/dashboard');
  }
}).catch((error) => {
  console.error("Redirect auth error:", error);
  state.message = "Authentication failed: " + error.message;
  render();
});

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: 'grid_view' },
  { href: '/transactions', label: 'Transactions', icon: 'receipt_long' },
  { href: '/scan', label: 'Capture', icon: 'photo_camera' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

const sourceIcons = {
  email: { icon: 'mail', color: '#4854bb' },
  sms: { icon: 'sms', color: '#27272a' },
  receipt: { icon: 'receipt_long', color: '#009844' },
  manual: { icon: 'edit', color: '#71717a' },
};

const receiptFileAccept = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
  'text/plain',
  '.pdf',
  '.doc',
  '.docx',
  '.rtf',
  '.txt',
].join(',');

const state = {
  user: null,
  categories: [],
  transactions: [],
  dashboard: null,
  onboardingStep: 0,
  scanMode: 'receipt',
  receiptFile: null,
  authMode: 'email',
  confirmationResult: null,
  receiptDraft: {
    merchant: '',
    amount: '',
    categoryId: '',
    note: '',
    reader: null,
    confidence: null,
    converted: false,
    originalAmount: null,
    originalCurrency: null,
    currency: 'NGN',
    status: 'idle',
    error: '',
  },
  filters: {
    search: '',
    category: 'All',
    source: 'All',
  },
  editingTransaction: null,
  authModalOpen: false,
  message: '',
};

window.addEventListener('popstate', render);
document.addEventListener('click', handleDocumentClick);
document.addEventListener('submit', handleSubmit);
document.addEventListener('change', handleChange);
document.addEventListener('input', handleInput);


onAuthStateChanged(auth, async (user) => {
  if (user) {
    await refreshBaseData();
  } else {
    state.user = null;
    state.categories = [];
    state.dashboard = null;
    state.transactions = [];
  }
  
  if (!isBooted) {
    isBooted = true;
    render();
  } else {
    if (!user && location.pathname !== '/' && !['/terms', '/privacy', '/support'].includes(location.pathname)) {
      navigate('/');
    } else {
      render();
    }
  }
});

async function refreshBaseData() {
  if (!auth.currentUser) return;
  const userRef = doc(db, 'users', auth.currentUser.uid);
  let userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    await initializeNewUser(auth.currentUser, auth.currentUser.displayName || '');
    userDoc = await getDoc(userRef);
  }
  
  state.user = { id: auth.currentUser.uid, ...userDoc.data() };
  const catsSnap = await getDocs(collection(db, 'users', auth.currentUser.uid, 'categories'));
  state.categories = catsSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.name.localeCompare(b.name));

  if (!state.receiptDraft.categoryId) {
    state.receiptDraft.categoryId = categoryIdForName('Markets') || firstExpenseCategory()?.id || state.categories[0]?.id || '';
  }
}

async function render() {
  const path = normalizePath(location.pathname);

  if (path === '/') {
    if (auth.currentUser) {
      setTimeout(() => navigate('/dashboard'), 0);
      return;
    }
    app.innerHTML = renderLanding();
    return;
  }

  if (path === '/terms') {
    app.innerHTML = renderTerms();
    return;
  }

  if (path === '/privacy') {
    app.innerHTML = renderPrivacy();
    return;
  }

  if (path === '/support') {
    app.innerHTML = renderSupport();
    return;
  }

  if (path === '/onboarding') {
    await refreshBaseData();
    app.innerHTML = renderOnboarding();
    return;
  }

  if (path === '/dashboard') {
    await refreshDashboard();
    app.innerHTML = renderDashboardLayout(renderDashboard());
    return;
  }

  if (path === '/transactions') {
    await refreshTransactions();
    app.innerHTML = renderDashboardLayout(renderTransactions());
    return;
  }

  if (path === '/scan') {
    await refreshBaseData();
    app.innerHTML = renderDashboardLayout(renderScan());
    return;
  }

  if (path === '/settings') {
    await refreshBaseData();
    app.innerHTML = renderDashboardLayout(renderSettings());
    return;
  }

  navigate('/');
}

async function refreshDashboard() {
  await refreshBaseData();
  if (!state.user) {
    state.dashboard = null;
    return;
  }
  await refreshTransactions();
  const txns = state.transactions;
  const totalIncome = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  const totals = new Map();
  for (const t of txns) {
    if (t.type !== 'expense') continue;
    const key = t.category.name;
    const current = totals.get(key) || { name: key, total: 0, icon: t.category.icon, color: t.category.color };
    current.total += t.amount;
    totals.set(key, current);
  }
  const topCategories = [...totals.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  
  state.dashboard = {
    user: state.user,
    balance: totalIncome - totalExpenses,
    totalIncome,
    totalExpenses,
    transactionCount: txns.length,
    savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
    recentTransactions: txns.slice(0, 5),
    topCategories,
    syncStatus: { sms: Boolean(state.user.smsActive), email: Boolean(state.user.gmailLinked) }
  };
}

async function refreshTransactions() {
  await refreshBaseData();
  if (!state.user) {
    state.transactions = [];
    return;
  }
  const q = query(collection(db, 'users', auth.currentUser.uid, 'transactions'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  state.transactions = snap.docs.map(d => {
    const data = d.data();
    const cat = state.categories.find(c => c.id === data.categoryId) || {};
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      category: cat
    };
  });
}

function renderLanding() {
  return `
    <div class="page-shell">
      <nav class="landing-nav">
        <div class="landing-nav-inner">
          <a href="/" class="brand" data-link>
            <span class="brand-mark"><span class="material-symbols-outlined">account_balance_wallet</span></span>
            <span class="brand-word">Fintrack</span>
          </a>
          <div class="landing-links">
            <a href="#features">Features</a>
            <a href="#security">Security</a>
            <a href="/dashboard" data-link>Dashboard</a>
          </div>
          <button class="btn" data-action="open-auth">Sign In</button>
        </div>
      </nav>

      <main>
        <section class="hero">
          <div class="hero-grid">
            <div class="fade-in">
              <h1>Your money records,<br><span class="hero-muted">handled automatically.</span></h1>
              <p class="hero-copy">Fintrack automatically captures transactions from bank alerts, email receipts, SMS, and scanned receipts. No manual entry, just clear insights.</p>
              <div class="hero-actions">
                <button class="btn large" data-action="open-auth">Get Started Now</button>
                <a href="/onboarding" class="btn large secondary" data-link>Set Up Capture</a>
              </div>
            </div>
            <div class="phone-wrap fade-in">
              <div class="phone">
                <div class="phone-screen">
                  <div class="phone-top"></div>
                  <div class="phone-content">
                    <div class="mock-balance">
                      <p>Balance</p>
                      <strong>${formatCurrency(1245000, 'NGN')}</strong>
                    </div>
                    <p class="mock-list-title">Recent Activity</p>
                    ${[1, 2, 3].map(() => `
                      <div class="mock-row">
                        <div style="display:flex;align-items:center;gap:12px">
                          <span class="mock-dot"></span>
                          <span class="mock-lines">
                            <span class="mock-line"></span>
                            <span class="mock-line short"></span>
                          </span>
                        </div>
                        <span class="mock-line short"></span>
                      </div>
                    `).join('')}
                  </div>
                  <span class="scan-line"></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="stats-band" id="features">
          <div class="stats-grid">
            ${renderStat('99.9%', 'Accuracy Rate')}
            ${renderStat('NGN', 'Multi-source Capture')}
            ${renderStat('24/7', 'AI Monitoring')}
            ${renderStat('0', 'Manual Entry')}
          </div>
        </section>

        <section class="feature-section" id="security">
          <div class="feature-grid">
            ${renderFeature('/onboarding', 'hub', 'Onboarding', 'Set profile, email, SMS, and file capture preferences.')}
            ${renderFeature('/scan', 'photo_camera', 'Capture', 'Upload receipts, PDFs, or documents and turn them into records.')}
            ${renderFeature('/dashboard', 'grid_view', 'Dashboard', 'Review your financial snapshot and recent activity.')}
          </div>
        </section>
      </main>

      <footer class="landing-footer">
        <h2>Ready to reclaim<br>your time?</h2>
        <button class="btn large" data-action="open-auth">Get Started Now</button>
        <p style="color:var(--faint);font-weight:700">Free to use. Open source prototype.</p>
        <div class="footer-row">
          <span>&copy; 2026 Fintrack. All rights reserved.</span>
          <nav>
            <a href="https://github.com/nodedots/finance_tracker" target="_blank" rel="noreferrer">GitHub</a>
            <a href="/terms" data-link>Terms</a>
            <a href="/privacy" data-link>Privacy</a>
            <a href="/support" data-link>Support</a>
          </nav>
        </div>
      </footer>
      ${state.authModalOpen ? renderAuthModal() : ''}
    </div>
  `;
}

function renderStat(value, label) {
  return `<div class="stat"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`;
}

function renderFeature(href, icon, title, detail) {
  return `
    <a href="${href}" class="feature-card" data-link>
      <span class="material-symbols-outlined">${icon}</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(detail)}</p>
    </a>
  `;
}

async function initializeNewUser(user, name, location = 'Nigeria') {
  const uid = user.uid;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      name: name || user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
      email: user.email || '',
      phone: user.phoneNumber || '',
      plan: 'free',
      currency: 'NGN',
      location: location,
      pushNotifications: true,
      gmailLinked: false,
      smsActive: false,
      cameraEnabled: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    const defaultCats = [
      { name: 'Shopping', icon: 'shopping_bag', color: '#4854bb' },
      { name: 'Food', icon: 'restaurant', color: '#e65100' },
      { name: 'Transport', icon: 'directions_car', color: '#1565c0' },
      { name: 'Utility', icon: 'bolt', color: '#f9a825' },
      { name: 'Subscription', icon: 'subscriptions', color: '#6a1b9a' },
      { name: 'Income', icon: 'account_balance_wallet', color: '#009844' },
      { name: 'Entertainment', icon: 'movie', color: '#c62828' },
      { name: 'Health', icon: 'health_and_safety', color: '#00897b' },
      { name: 'Markets', icon: 'local_grocery_store', color: '#2e7d32' },
      { name: 'Rent', icon: 'home', color: '#37474f' },
    ];
    await Promise.all(defaultCats.map(c => addDoc(collection(db, 'users', uid, 'categories'), c)));
  }
}

function renderAuthModal() {
  let modalContent = '';

  if (state.authMode === 'phone-input') {
    modalContent = `
      <form class="modal form-stack" data-form="phone-auth">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Phone Login</p>
            <h2>Enter your number</h2>
          </div>
          <button class="icon-btn" type="button" data-action="close-auth" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        ${state.message ? `<p class="notice error">${escapeHtml(state.message)}</p>` : ''}
        <label class="field">
          <span>Phone Number</span>
          <input name="phone" type="tel" placeholder="+234800000000" required>
        </label>
        <div id="recaptcha-container"></div>
        <button class="btn full large" type="submit">Send Code</button>
        <button class="btn text full" type="button" data-action="auth-mode" data-mode="email" style="margin-top: 8px;">Back to Email</button>
      </form>
    `;
  } else if (state.authMode === 'phone-verify') {
    modalContent = `
      <form class="modal form-stack" data-form="phone-verify">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Phone Login</p>
            <h2>Verification Code</h2>
          </div>
          <button class="icon-btn" type="button" data-action="close-auth" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        ${state.message ? `<p class="notice error">${escapeHtml(state.message)}</p>` : ''}
        <p style="color:var(--muted);font-size:14px;margin-bottom:8px">Enter the 6-digit code sent to your phone.</p>
        <label class="field">
          <span>OTP Code</span>
          <input name="otp" type="text" placeholder="123456" required>
        </label>
        <button class="btn full large" type="submit">Verify Code</button>
        <button class="btn text full" type="button" data-action="auth-mode" data-mode="phone-input" style="margin-top: 8px;">Back</button>
      </form>
    `;
  } else {
    // Default Email Mode with OAuth options
    modalContent = `
      <form class="modal form-stack" data-form="auth">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Welcome</p>
            <h2>Sign in to Fintrack</h2>
          </div>
          <button class="icon-btn" type="button" data-action="close-auth" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        ${state.message ? `<p class="notice error">${escapeHtml(state.message)}</p>` : ''}
        
        <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:12px">
          <button class="btn secondary full large" type="button" data-action="auth-google" style="justify-content:center">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:18px;margin-right:8px">
            Continue with Google
          </button>
          <button class="btn secondary full large" type="button" data-action="auth-mode" data-mode="phone-input" style="justify-content:center">
            <span class="material-symbols-outlined" style="margin-right:8px">smartphone</span>
            Continue with Phone
          </button>
        </div>
        
        <div style="display:flex;align-items:center;margin:16px 0;">
          <div style="flex:1;height:1px;background:var(--border)"></div>
          <span style="padding:0 12px;color:var(--faint);font-size:12px;text-transform:uppercase;font-weight:700">or use email</span>
          <div style="flex:1;height:1px;background:var(--border)"></div>
        </div>

        <label class="field">
          <span>Name (New Account)</span>
          <input name="name" value="${escapeAttr(state.user?.name || '')}" placeholder="Your name">
        </label>
        <label class="field">
          <span>Email</span>
          <input name="email" type="email" value="${escapeAttr(state.user?.email || '')}" placeholder="you@example.com" required>
        </label>
        <button class="btn full large" type="submit">Continue</button>
      </form>
    `;
  }

  return `
    <div class="modal-backdrop" data-action="close-auth">
      ${modalContent}
    </div>
  `;
}

function renderDashboardLayout(content) {
  return `
    <div class="dashboard-layout">
      ${renderSidebar()}
      <main class="dashboard-main">${content}</main>
      ${renderBottomNav()}
    </div>
  `;
}

function renderSidebar() {
  const name = state.user?.name || 'Not set up';
  const plan = state.user ? `${state.user.plan === 'pro' ? 'Pro' : 'Free'} Account` : 'Create account';
  return `
    <aside class="sidebar">
      <a href="/" class="brand sidebar-brand" data-link>
        <span class="brand-mark"><span class="material-symbols-outlined">account_balance_wallet</span></span>
        <span class="brand-word">Fintrack</span>
      </a>
      <nav class="sidebar-nav">
        ${navItems.map(renderNavLink).join('')}
      </nav>
      <div class="sidebar-user">
        <div class="sidebar-user-inner">
          <span class="avatar" style="width:38px;height:38px"><span class="material-symbols-outlined">person</span></span>
          <div>
            <p>${escapeHtml(name)}</p>
            <small>${escapeHtml(plan)}</small>
          </div>
        </div>
      </div>
    </aside>
  `;
}

function renderBottomNav() {
  return `<nav class="bottom-nav">${navItems.map(renderNavLink).join('')}</nav>`;
}

function renderNavLink(item) {
  const active = normalizePath(location.pathname) === item.href;
  return `
    <a href="${item.href}" class="${active ? 'active' : ''}" data-link>
      <span class="material-symbols-outlined ${active ? 'filled' : ''}">${item.icon}</span>
      <span>${item.label}</span>
    </a>
  `;
}

function renderDashboard() {
  if (!state.user || !state.dashboard) {
    return renderSetupPrompt();
  }

  const data = state.dashboard;
  return `
    <header class="app-header">
      <div class="app-header-inner">
        <div class="header-title">
          <p>Welcome back,</p>
          <h1>${escapeHtml(data.user.name)}</h1>
        </div>
        <div class="status-pills">
          ${data.syncStatus.sms ? '<span class="sync-pill">SMS</span>' : ''}
          ${data.syncStatus.email ? '<span class="sync-pill">Email</span>' : ''}
          <button class="btn icon secondary" aria-label="Notifications"><span class="material-symbols-outlined">notifications</span></button>
        </div>
      </div>
    </header>
    <div class="app-content form-stack">
      <section class="balance-card fade-in">
        <p class="eyebrow">Total Balance</p>
        <h2 class="balance-amount">${formatCurrency(data.balance, data.user.currency)}</h2>
        <div class="metric-grid">
          ${renderMetric('arrow_downward', 'Income', formatCurrency(data.totalIncome, data.user.currency))}
          ${renderMetric('arrow_upward', 'Expenses', formatCurrency(data.totalExpenses, data.user.currency))}
          ${renderMetric('savings', 'Savings Rate', `${data.savingsRate}%`)}
        </div>
      </section>

      <section class="bento-grid fade-in">
        <div class="bento-card blue">
          <span class="icon-box" style="background:rgba(255,255,255,.22)"><span class="material-symbols-outlined">savings</span></span>
          <div><p class="eyebrow" style="color:rgba(22,35,142,.7)">Savings Rate</p><p class="value">${data.savingsRate}%</p></div>
        </div>
        <div class="bento-card dark">
          <span class="icon-box" style="background:rgba(255,255,255,.12)"><span class="material-symbols-outlined">auto_awesome</span></span>
          <div><p class="eyebrow">Total Logs</p><p class="value">${data.transactionCount}</p></div>
        </div>
        ${data.topCategories.slice(0, 2).map((category) => renderTopCategory(category, data.user.currency)).join('')}
      </section>

      <section>
        <div class="section-heading">
          <h2>Recent Activity</h2>
          <a href="/transactions" data-link>View All</a>
        </div>
        ${data.recentTransactions.length ? renderTransactionList(data.recentTransactions, data.user.currency, false) : renderEmptyTransactions()}
      </section>
    </div>
  `;
}

function renderMetric(icon, label, value) {
  return `
    <div class="metric">
      <span class="metric-label"><span class="material-symbols-outlined" style="font-size:16px">${icon}</span>${label}</span>
      <p class="metric-value">${value}</p>
    </div>
  `;
}

function renderTopCategory(category, currency) {
  return `
    <div class="bento-card light">
      <span class="icon-box" style="background:${category.color}18;color:${category.color}">
        <span class="material-symbols-outlined">${category.icon}</span>
      </span>
      <div>
        <p class="eyebrow">${escapeHtml(category.name)}</p>
        <p class="value" style="font-size:25px">${formatCurrency(category.total, currency)}</p>
      </div>
    </div>
  `;
}

function renderSetupPrompt() {
  return `
    <div class="app-content" style="min-height:100vh;display:flex;align-items:center;justify-content:center">
      <div class="card empty-state" style="max-width:430px">
        <span class="material-symbols-outlined">account_circle</span>
        <h3>Create your account</h3>
        <p>Set up your profile and capture sources before recording transactions.</p>
        <a href="/onboarding" class="btn full" style="margin-top:22px" data-link>Start Setup</a>
      </div>
    </div>
  `;
}

function renderEmptyTransactions() {
  return `
    <div class="card empty-state">
      <span class="material-symbols-outlined">receipt_long</span>
      <h3>No transactions yet</h3>
      <p>Capture a receipt or add your first transaction manually.</p>
      <a href="/scan" class="btn" style="margin-top:20px" data-link>Capture Transaction</a>
    </div>
  `;
}

function renderTransactions() {
  if (!state.user) return renderSetupPrompt();

  const filtered = filteredTransactions();
  const grouped = groupByDate(filtered);
  const categoryNames = ['All', ...state.categories.filter((category) => category.name !== 'Income').map((category) => category.name)];

  return `
    <header class="app-header">
      <div class="app-header-inner">
        <div class="header-title">
          <p>Manage records</p>
          <h1>Transactions</h1>
        </div>
        <a href="/scan" class="btn" data-link><span class="material-symbols-outlined">add_circle</span>Add</a>
      </div>
    </header>
    <div class="app-content">
      ${state.message ? `<p class="notice error" style="margin-bottom:16px">${escapeHtml(state.message)}</p>` : ''}
      <div class="toolbar" style="flex-wrap: wrap;">
        <label class="search-field" style="flex: 1 1 100%;">
          <span class="material-symbols-outlined">search</span>
          <input class="input" data-input="search" value="${escapeAttr(state.filters.search)}" placeholder="Search merchants, categories, notes...">
        </label>
        <select class="select" data-input="source" style="flex: 1;">
          ${['All', 'manual', 'sms', 'email', 'receipt'].map((source) => `<option value="${source}" ${state.filters.source === source ? 'selected' : ''}>${source === 'All' ? 'All sources' : source}</option>`).join('')}
        </select>
        <select class="select" data-input="category-select" style="flex: 1;">
          ${categoryNames.map((name) => `<option value="${escapeAttr(name)}" ${state.filters.category === name ? 'selected' : ''}>${name === 'All' ? 'All categories' : escapeHtml(name)}</option>`).join('')}
        </select>
      </div>
      ${state.filters.search || state.filters.category !== 'All' || state.filters.source !== 'All'
        ? `<p style="color:var(--faint);font-size:14px">${filtered.length} result${filtered.length === 1 ? '' : 's'}</p>`
        : ''}
      <div class="form-stack">
        ${Object.keys(grouped).map((date) => `
          <section>
            <p class="eyebrow">${escapeHtml(date)}</p>
            ${renderTransactionList(grouped[date], state.user.currency, true)}
          </section>
        `).join('')}
      </div>
      ${filtered.length ? '' : '<div class="empty-state"><span class="material-symbols-outlined">search_off</span><p>No transactions found</p></div>'}
      ${state.editingTransaction ? renderEditModal() : ''}
    </div>
  `;
}

function renderTransactionList(transactions, currency, withActions) {
  return `
    <div class="txn-list">
      ${transactions.map((transaction) => renderTransactionRow(transaction, currency, withActions)).join('')}
    </div>
  `;
}

function renderTransactionRow(transaction, currency, withActions) {
  const src = sourceIcons[transaction.source] || sourceIcons.manual;
  const sign = transaction.type === 'income' ? '+' : '-';

  return `
    <div class="txn-row">
      <div class="txn-main">
        <div class="txn-icon" style="background:${transaction.category.color}18;color:${transaction.category.color}">
          <span class="material-symbols-outlined">${transaction.category.icon}</span>
          <span class="source-badge" style="color:${src.color}"><span class="material-symbols-outlined filled">${src.icon}</span></span>
        </div>
        <div style="min-width:0">
          <p class="txn-title">${escapeHtml(transaction.merchant)}</p>
          <p class="txn-meta">${escapeHtml(transaction.category.name)} &middot; ${withActions ? formatTime(transaction.createdAt) : timeAgo(transaction.createdAt)}</p>
          ${transaction.note ? `<p class="txn-note">${escapeHtml(transaction.note)}</p>` : ''}
        </div>
      </div>
      <div class="txn-side">
        <div style="text-align:right">
          <p class="txn-amount ${transaction.type === 'income' ? 'income' : ''}">${sign}${formatCurrency(transaction.amount, currency)}</p>
          <p class="txn-status">${escapeHtml(transaction.status)}</p>
        </div>
        ${withActions ? `
          <div class="row-actions">
            <button class="icon-btn" data-action="edit-transaction" data-id="${transaction.id}" title="Edit" aria-label="Edit ${escapeAttr(transaction.merchant)}"><span class="material-symbols-outlined">edit</span></button>
            <button class="icon-btn danger" data-action="delete-transaction" data-id="${transaction.id}" title="Delete" aria-label="Delete ${escapeAttr(transaction.merchant)}"><span class="material-symbols-outlined">delete</span></button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderEditModal() {
  const transaction = state.editingTransaction;
  return `
    <div class="modal-backdrop">
      <form class="modal form-stack" data-form="edit-transaction">
        <div class="modal-head">
          <div>
            <p class="eyebrow">Manage</p>
            <h2>Edit transaction</h2>
          </div>
          <button class="icon-btn" type="button" data-action="close-edit" aria-label="Close editor"><span class="material-symbols-outlined">close</span></button>
        </div>
        <div class="form-grid">
          <label class="field wide"><span>Merchant / Description</span><input name="merchant" value="${escapeAttr(transaction.merchant)}" required></label>
          <label class="field"><span>Amount</span><span class="amount-field"><strong>${currencySymbol(state.user.currency)}</strong><input name="amount" type="number" min="0" step="0.01" value="${escapeAttr(transaction.amount)}" required></span></label>
          <label class="field"><span>Category</span><select name="categoryId">${state.categories.map((category) => `<option value="${category.id}" ${category.id === transaction.categoryId ? 'selected' : ''}>${escapeHtml(category.name)}</option>`).join('')}</select></label>
          <label class="field"><span>Type</span><select name="type">${['expense', 'income'].map((type) => `<option value="${type}" ${type === transaction.type ? 'selected' : ''}>${type}</option>`).join('')}</select></label>
          <label class="field"><span>Status</span><select name="status">${['approved', 'pending', 'matched', 'verified'].map((status) => `<option value="${status}" ${status === transaction.status ? 'selected' : ''}>${status}</option>`).join('')}</select></label>
          <label class="field"><span>Source</span><select name="source">${['manual', 'sms', 'email', 'receipt'].map((source) => `<option value="${source}" ${source === transaction.source ? 'selected' : ''}>${source}</option>`).join('')}</select></label>
          <label class="field wide"><span>Note</span><textarea name="note" rows="3">${escapeHtml(transaction.note || '')}</textarea></label>
        </div>
        <div class="button-row">
          <button class="btn secondary full" type="button" data-action="close-edit">Cancel</button>
          <button class="btn full" type="submit">Save Changes</button>
        </div>
      </form>
    </div>
  `;
}

function renderScan() {
  if (!state.user) return renderSetupPrompt();

  return `
    <header class="app-header">
      <div class="app-header-inner">
        <div class="header-title">
          <p>Capture flow</p>
          <h1>Capture</h1>
        </div>
      </div>
    </header>
    <div class="app-content">
      <div class="scan-toolbar">
        <div class="segmented">
          <button class="${state.scanMode === 'receipt' ? 'active' : ''}" data-action="scan-mode" data-mode="receipt">Receipt Capture</button>
          <button class="${state.scanMode === 'manual' ? 'active' : ''}" data-action="scan-mode" data-mode="manual">Manual Entry</button>
        </div>
        <button class="btn secondary reset-capture" type="button" data-action="reset-scan">
          <span class="material-symbols-outlined">restart_alt</span>
          Reset
        </button>
      </div>
      ${state.scanMode === 'manual' ? renderAddTransactionForm() : renderReceiptForm()}
    </div>
  `;
}

function renderAddTransactionForm() {
  return `
    <form class="form-stack" data-form="add-transaction">
      ${state.message ? `<p class="notice success">${escapeHtml(state.message)}</p>` : ''}
      <div class="segmented">
        <button class="active" type="button" data-action="manual-type" data-type="expense">Expense</button>
        <button class="green" type="button" data-action="manual-type" data-type="income">Income</button>
      </div>
      <input type="hidden" name="type" value="expense">
      <label class="field"><span>Amount</span><span class="amount-field"><strong>${currencySymbol(state.user.currency)}</strong><input name="amount" type="number" step="0.01" min="0" placeholder="0.00" required></span></label>
      <label class="field"><span>Merchant / Description</span><input name="merchant" placeholder="e.g., Sahad Stores, Monthly Salary" required></label>
      <div class="field"><span>Category</span><div class="category-grid">${renderCategoryOptions()}</div></div>
      <input type="hidden" name="categoryId" value="${state.categories[0]?.id || ''}">
      <div class="field"><span>Source</span><div class="source-options">${['manual', 'sms', 'email', 'receipt'].map((source) => `<button class="chip ${source === 'manual' ? 'active' : ''}" type="button" data-action="manual-source" data-source="${source}">${source}</button>`).join('')}</div></div>
      <input type="hidden" name="source" value="manual">
      <label class="field"><span>Note (optional)</span><textarea name="note" rows="3" placeholder="Add a note..."></textarea></label>
      <div class="button-row">
        <button class="btn secondary full large" type="button" data-action="reset-scan"><span class="material-symbols-outlined">restart_alt</span>Reset</button>
        <button class="btn full large" type="submit"><span class="material-symbols-outlined">add_circle</span>Add Transaction</button>
      </div>
    </form>
  `;
}

function renderCategoryOptions(activeId = state.categories[0]?.id || '') {
  return state.categories.map((category) => `
    <button class="category-option ${category.id === activeId ? 'active' : ''}" type="button" data-action="select-category" data-category-id="${category.id}">
      <span class="material-symbols-outlined" style="color:${category.id === activeId ? '#fff' : category.color}">${category.icon}</span>
      <span>${escapeHtml(category.name)}</span>
    </button>
  `).join('');
}

function renderReceiptForm() {
  const draft = state.receiptDraft;
  return `
    <form class="form-stack" data-form="receipt">
      <div class="card" style="padding:16px">
        <input id="receipt-file" type="file" accept="${receiptFileAccept}" hidden data-input="receipt-file">
        <div class="receipt-upload-shell">
          <button class="receipt-drop" type="button" data-action="choose-receipt" ${draft.status === 'scanning' ? 'disabled' : ''}>
            ${renderReceiptFilePreview()}
          </button>
          ${draft.status === 'scanning' ? renderReceiptScanningOverlay() : ''}
        </div>
        <div class="scan-status">
          <span>${receiptStatusText()}</span>
          <strong>${draft.status === 'scanning' ? 'Scanning' : draft.status === 'ready' ? 'Ready' : 'Draft'}</strong>
        </div>
      </div>
      ${draft.error ? `<p class="notice error">${escapeHtml(draft.error)}</p>` : ''}
      <div class="form-grid">
        <label class="field"><span>Merchant</span><input name="merchant" value="${escapeAttr(draft.merchant)}" required></label>
        <label class="field"><span>Amount</span><span class="amount-field"><strong>${currencySymbol(state.user.currency)}</strong><input name="amount" type="number" value="${escapeAttr(draft.amount)}" required></span></label>
      </div>
      <label class="field"><span>Category</span><select name="categoryId">${state.categories.map((category) => `<option value="${category.id}" ${category.id === draft.categoryId ? 'selected' : ''}>${escapeHtml(category.name)}</option>`).join('')}</select></label>
      <label class="field"><span>Note</span><textarea name="note" rows="3">${escapeHtml(draft.note)}</textarea></label>
      <div class="button-row">
        <button class="btn secondary full large" type="button" data-action="reset-scan" ${draft.status === 'saving' ? 'disabled' : ''}>
          <span class="material-symbols-outlined">restart_alt</span>
          Reset
        </button>
        <button class="btn full large" type="submit" ${draft.status === 'saving' ? 'disabled' : ''}>
          <span class="material-symbols-outlined ${draft.status === 'saving' ? 'spinner' : ''}">${draft.status === 'saving' ? 'progress_activity' : 'receipt_long'}</span>
          ${draft.status === 'saving' ? 'Recording...' : 'Record Receipt'}
        </button>
      </div>
    </form>
  `;
}

function renderReceiptScanningOverlay() {
  return `
    <div class="receipt-scan-overlay" role="status" aria-live="polite">
      <span class="scan-loader" aria-hidden="true"></span>
      <strong>Scanning receipt...</strong>
      <small>Reading fields and checking currency. This can take a moment.</small>
    </div>
  `;
}

function renderReceiptFilePreview() {
  if (!state.receiptFile) {
    return `
      <span class="upload-placeholder">
        <span class="material-symbols-outlined">upload_file</span>
        <strong>Upload receipt or document</strong>
        <small>Images, PDFs, Word docs, and text files are supported.</small>
      </span>
    `;
  }

  if (state.receiptFile.previewUrl) {
    return `<img src="${state.receiptFile.previewUrl}" alt="Receipt preview">`;
  }

  return `
    <span class="file-preview">
      <span class="material-symbols-outlined">${iconForReceiptFile(state.receiptFile.type)}</span>
      <strong>${escapeHtml(state.receiptFile.name)}</strong>
      <small>${escapeHtml(labelForReceiptFile(state.receiptFile.type))}</small>
    </span>
  `;
}

function iconForReceiptFile(type) {
  if (type === 'application/pdf') return 'picture_as_pdf';
  if (type.includes('wordprocessingml') || type === 'application/msword') return 'description';
  return 'draft';
}

function labelForReceiptFile(type) {
  if (type === 'application/pdf') return 'PDF document';
  if (type.includes('wordprocessingml') || type === 'application/msword') return 'Word document';
  if (type === 'application/rtf' || type === 'text/rtf') return 'RTF document';
  if (type === 'text/plain') return 'Text document';
  return 'Document';
}

function receiptStatusText() {
  const draft = state.receiptDraft;
  if (draft.status === 'scanning') return 'Reading receipt fields...';
  if (draft.converted && draft.originalCurrency && draft.currency) return `Converted ${draft.originalCurrency} to ${draft.currency}`;
  if (draft.reader === 'gemini') return `Read by Gemini${draft.confidence !== null ? ` - ${Math.round(draft.confidence * 100)}% confidence` : ''}`;
  return 'Upload a clear receipt to extract fields.';
}

function renderSettings() {
  if (!state.user) return renderSetupPrompt();
  const user = state.user;

  return `
    <header class="app-header">
      <div class="app-header-inner">
        <div class="header-title">
          <p>Profile and capture</p>
          <h1>Settings</h1>
        </div>
      </div>
    </header>
    <div class="app-content form-stack">
      <section class="card profile-card">
        <form class="form-stack" data-form="profile">
          <div class="profile-row">
            <div style="display:flex;align-items:center;gap:16px;min-width:0">
              <span class="avatar"><span class="material-symbols-outlined" style="font-size:32px">account_circle</span></span>
              <div class="profile-copy" style="min-width:0;flex:1">
                <input class="input" name="name" value="${escapeAttr(user.name)}" aria-label="Name">
                <input class="input" name="email" type="email" value="${escapeAttr(user.email)}" aria-label="Email" style="margin-top:8px">
                <input class="input" name="location" value="${escapeAttr(user.location)}" aria-label="Location" style="margin-top:8px">
              </div>
            </div>
            <button class="btn" type="submit">Save</button>
          </div>
        </form>
        <span class="account-pill">${user.plan === 'pro' ? 'Verified' : 'Community'} Account</span>
        <div style="margin-top:22px;padding-top:20px;border-top:1px solid var(--border-soft);display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap">
          <div><strong>Session</strong><br><small style="color:var(--muted)">Leave this profile and return to the landing page.</small></div>
          <button class="btn secondary" data-action="logout" type="button"><span class="material-symbols-outlined">logout</span>Log out</button>
        </div>
      </section>

      <section>
        <p class="eyebrow">Data Sources</p>
        <div class="settings-list">
          ${renderSettingsToggle('mail', 'Gmail', 'Scanning receipts automatically', 'gmailLinked', user.gmailLinked, '#fee2e2', '#dc2626')}
          ${renderSettingsToggle('sms', 'SMS Notifications', 'Bank alert parsing', 'smsActive', user.smsActive, '#dbeafe', '#2563eb')}
          ${renderSettingsToggle('upload_file', 'Receipt File Capture', 'Manual receipt and document capture', 'cameraEnabled', user.cameraEnabled, '#f4f4f5', '#18181b')}
        </div>
      </section>

      <section>
        <p class="eyebrow">Preferences</p>
        <div class="settings-list">
          <div class="settings-row">
            <div class="settings-info">
              <span class="settings-icon" style="background:var(--primary);color:#fff"><span class="material-symbols-outlined">payments</span></span>
              <div><p>Default Currency</p><small>${escapeHtml(user.currency)}</small></div>
            </div>
            <select class="select" style="max-width:170px" data-input="currency">
              ${['NGN', 'GHS', 'KES', 'ZAR', 'USD', 'EUR', 'GBP'].map((currency) => `<option value="${currency}" ${currency === user.currency ? 'selected' : ''}>${currency}</option>`).join('')}
            </select>
          </div>
          ${renderSettingsToggle('notifications_active', 'Push Notifications', 'Instant transaction alerts', 'pushNotifications', user.pushNotifications, 'var(--primary)', '#fff')}
        </div>
      </section>
    </div>
  `;
}

function renderSettingsToggle(icon, title, detail, field, checked, bg, color) {
  return `
    <div class="settings-row">
      <div class="settings-info">
        <span class="settings-icon" style="background:${bg};color:${color}"><span class="material-symbols-outlined">${icon}</span></span>
        <div><p>${escapeHtml(title)}</p><small>${escapeHtml(detail)}</small></div>
      </div>
      <button class="toggle ${checked ? 'active' : ''}" data-action="toggle-setting" data-field="${field}" aria-label="${escapeAttr(title)}" type="button"></button>
    </div>
  `;
}

function renderOnboarding() {
  const user = state.user || {};
  const step = state.onboardingStep;

  return `
    <div class="onboarding">
      <div class="onboarding-inner">
        <div class="onboarding-top">
          <a href="/" class="brand" data-link>
            <span class="brand-mark"><span class="material-symbols-outlined">account_balance_wallet</span></span>
            <span>
              <span class="brand-word" style="display:block">Set up Fintrack</span>
              <small style="color:var(--muted)">Connect your transaction sources in a few steps.</small>
            </span>
          </a>
          <a href="/dashboard" class="btn secondary" data-link>Skip</a>
        </div>
        <div class="step-grid" style="margin-bottom:22px">
          ${[
            { label: 'Profile', icon: 'person' },
            { label: 'Connect', icon: 'hub' },
            { label: 'Capture', icon: 'receipt_long' },
          ].map((item, index) => `
            <button class="step-btn ${index === step ? 'active' : ''}" data-action="onboarding-step" data-step="${index}">
              <span class="material-symbols-outlined">${item.icon}</span>${item.label}
            </button>
          `).join('')}
        </div>
        <div class="onboarding-card">
          ${step === 0 ? renderOnboardingProfile(user) : ''}
          ${step === 1 ? renderOnboardingConnections(user) : ''}
          ${step === 2 ? renderOnboardingReady(user) : ''}
        </div>
      </div>
    </div>
  `;
}

function renderOnboardingProfile(user) {
  return `
    <form class="form-stack" data-form="onboarding-profile">
      <div><p class="eyebrow">Account</p><h2 style="margin:0">Confirm your local profile</h2></div>
      ${state.message ? `<p class="notice error">${escapeHtml(state.message)}</p>` : ''}
      <label class="field"><span>Name</span><input name="name" value="${escapeAttr(user.name || '')}" placeholder="Your name"></label>
      <label class="field"><span>Email</span><input name="email" type="email" value="${escapeAttr(user.email || '')}" placeholder="you@example.com" required></label>
      <label class="field"><span>Location</span><input name="location" value="${escapeAttr(user.location || '')}" placeholder="Optional"></label>
      <button class="btn full large" type="submit">${state.user ? 'Continue' : 'Create Account'}</button>
    </form>
  `;
}

function renderOnboardingConnections(user) {
  return `
    <div class="form-stack">
      <div><p class="eyebrow">Connections</p><h2 style="margin:0">Choose capture channels</h2></div>
      ${renderConnectionCard('mail', 'Email receipts', 'Enable receipt intake for forwarded emails or a future OAuth inbox connection.', 'gmailLinked', Boolean(user.gmailLinked))}
      ${renderConnectionCard('sms', 'Bank SMS alerts', 'Enable alert capture for pasted, forwarded, or mobile-permission SMS records.', 'smsActive', Boolean(user.smsActive))}
      ${renderConnectionCard('upload_file', 'Receipt files', 'Enable receipt capture with file extraction and editable review before saving.', 'cameraEnabled', Boolean(user.cameraEnabled))}
      <div class="button-row">
        <button class="btn secondary full" data-action="onboarding-step" data-step="0">Back</button>
        <button class="btn full" data-action="onboarding-step" data-step="2">Continue</button>
      </div>
    </div>
  `;
}

function renderConnectionCard(icon, title, detail, field, connected) {
  return `
    <button class="connection-card" data-action="toggle-setting" data-field="${field}">
      <span class="settings-icon" style="background:${connected ? 'var(--tertiary)' : '#f4f4f5'};color:${connected ? '#fff' : '#52525b'}"><span class="material-symbols-outlined">${icon}</span></span>
      <span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(detail)}</p></span>
      <span class="eyebrow" style="color:${connected ? '#009844' : 'var(--faint)'}">${connected ? 'Connected' : 'Connect'}</span>
    </button>
  `;
}

function renderOnboardingReady(user) {
  return `
    <div class="form-stack">
      <div>
        <p class="eyebrow">Ready</p>
        <h2 style="margin:0">Your capture workflow is set</h2>
        <p style="color:var(--muted);line-height:1.55">Start with receipt capture now, then add real email/SMS integrations when you are ready for OAuth, permissions, and privacy review.</p>
      </div>
      <div class="status-grid">
        ${renderStatusCard('Email', Boolean(user.gmailLinked))}
        ${renderStatusCard('SMS', Boolean(user.smsActive))}
        ${renderStatusCard('File capture', Boolean(user.cameraEnabled))}
      </div>
      <div class="button-row">
        <button class="btn secondary full" data-action="onboarding-step" data-step="1">Back</button>
        <button class="btn full" data-action="finish-onboarding">Go to Dashboard</button>
      </div>
      <a href="/scan" class="btn secondary full" data-link><span class="material-symbols-outlined">photo_camera</span>Capture a Receipt</a>
    </div>
  `;
}

function renderStatusCard(label, active) {
  return `<div class="status-card ${active ? 'active' : ''}"><p class="eyebrow">${label}</p><strong style="color:${active ? '#009844' : 'var(--muted)'}">${active ? 'Enabled' : 'Skipped'}</strong></div>`;
}

function renderTerms() {
  return `
    <div class="legal-page" style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
      <a href="/" class="brand" data-link style="margin-bottom: 24px; display: inline-flex;">
        <span class="brand-mark"><span class="material-symbols-outlined">account_balance_wallet</span></span>
        <span class="brand-word">Fintrack</span>
      </a>
      <h1 style="margin-bottom: 24px;">Terms of Service</h1>
      <div class="card" style="padding:32px;line-height:1.7;color:var(--text)">
        <p><strong>Last Updated: July 2026</strong></p>
        <p>Welcome to Fintrack. By using our application, you agree to these terms. Fintrack is a personal finance tracking tool designed to help you organize your financial data locally.</p>
        <h3 style="margin-top: 24px;">1. Usage</h3>
        <p>You may use this app for personal, non-commercial purposes. You are responsible for the accuracy of the data you input and for maintaining the security of your device and Firebase credentials.</p>
        <h3 style="margin-top: 24px;">2. Disclaimers</h3>
        <p>Fintrack is provided "as is" without any warranties. We are not financial advisors, and the data presented within the app should not be construed as professional financial advice.</p>
      </div>
    </div>
  `;
}

function renderPrivacy() {
  return `
    <div class="legal-page" style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
      <a href="/" class="brand" data-link style="margin-bottom: 24px; display: inline-flex;">
        <span class="brand-mark"><span class="material-symbols-outlined">account_balance_wallet</span></span>
        <span class="brand-word">Fintrack</span>
      </a>
      <h1 style="margin-bottom: 24px;">Privacy Policy</h1>
      <div class="card" style="padding:32px;line-height:1.7;color:var(--text)">
        <p><strong>Last Updated: July 2026</strong></p>
        <p>Your privacy is important to us. Fintrack is built with a local-first philosophy to give you full control over your financial data.</p>
        <h3 style="margin-top: 24px;">Data Storage</h3>
        <p>Your data is securely stored using Firebase. Only you have access to your transactions, categories, and settings, protected by your authentication credentials and Firebase Security Rules.</p>
        <h3 style="margin-top: 24px;">AI Processing</h3>
        <p>When you upload a receipt, the image is temporarily processed by an AI service to extract transaction details. Images are not permanently stored on third-party servers beyond the extraction process.</p>
      </div>
    </div>
  `;
}

function renderSupport() {
  return `
    <div class="legal-page" style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
      <a href="/" class="brand" data-link style="margin-bottom: 24px; display: inline-flex;">
        <span class="brand-mark"><span class="material-symbols-outlined">account_balance_wallet</span></span>
        <span class="brand-word">Fintrack</span>
      </a>
      <h1 style="margin-bottom: 24px;">Support & Help</h1>
      <div class="card" style="padding:32px;line-height:1.7;color:var(--text)">
        <p>Need help using Fintrack? We're here to assist you.</p>
        <h3 style="margin-top: 24px;">Frequently Asked Questions</h3>
        <ul style="margin-top: 12px; padding-left: 20px;">
          <li style="margin-bottom: 12px;"><strong>How do I add a receipt?</strong><br>Go to the Dashboard and click the "Scan Receipt" card, or use the floating action button.</li>
          <li style="margin-bottom: 12px;"><strong>Can I export my data?</strong><br>Currently, data is synced securely to your Firebase project. Export features will be available in future updates.</li>
          <li style="margin-bottom: 12px;"><strong>How do I change my currency?</strong><br>Navigate to Settings to update your default currency symbol.</li>
        </ul>
        <h3 style="margin-top: 24px;">Contact Us</h3>
        <p>If you encounter bugs or need further assistance, please open an issue on our <a href="https://github.com/nodedots/finance_tracker" target="_blank" style="color:var(--primary);text-decoration:underline;">GitHub repository</a>.</p>
      </div>
    </div>
  `;
}

async function handleDocumentClick(event) {
  const link = event.target.closest('[data-link]');
  if (link) {
    const href = link.getAttribute('href');
    if (href && href.startsWith('/')) {
      event.preventDefault();
      navigate(href);
    }
    return;
  }

  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.dataset.action;

  if (action === 'open-auth') {
    state.authModalOpen = true;
    state.message = '';
    render();
  }

  if (action === 'close-auth') {
    if (actionEl.classList.contains('modal-backdrop') && event.target !== actionEl) return;
    state.authModalOpen = false;
    state.message = '';
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    render();
  }

  if (action === 'auth-mode') {
    state.authMode = actionEl.dataset.mode;
    state.message = '';
    if (state.authMode !== 'phone-input' && state.authMode !== 'phone-verify' && window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    render();
  }

  if (action === 'auth-google') {
    try {
      state.message = 'Connecting to Google...';
      render();
      const result = await signInWithPopup(auth, googleProvider);
      if (result && result.user) {
        await initializeNewUser(result.user, '');
        await refreshBaseData();
        state.authModalOpen = false;
        state.message = '';
        navigate('/dashboard');
      }
    } catch(e) {
      console.warn("Popup auth failed, trying redirect:", e);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch(re) {
        state.message = re.message;
        render();
      }
    }
  }

  if (action === 'scan-mode') {
    state.scanMode = actionEl.dataset.mode;
    render();
  }

  if (action === 'reset-scan') {
    resetScanEntry();
    return;
  }

  if (action === 'choose-receipt') {
    document.getElementById('receipt-file')?.click();
  }

  if (action === 'filter-category') {
    state.filters.category = actionEl.dataset.category;
    render();
  }

  if (action === 'edit-transaction') {
    const transaction = state.transactions.find((item) => item.id === actionEl.dataset.id);
    state.editingTransaction = transaction ? { ...transaction, amount: String(transaction.amount), note: transaction.note || '' } : null;
    render();
  }

  if (action === 'close-edit') {
    state.editingTransaction = null;
    render();
  }

  if (action === 'delete-transaction') {
    const transaction = state.transactions.find((item) => item.id === actionEl.dataset.id);
    if (!transaction || !confirm(`Remove "${transaction.merchant}" from your transactions?`)) return;
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'transactions', transaction.id));
    await refreshTransactions();
    render();
  }

  if (action === 'toggle-setting') {
    if (!state.user) return;
    const field = actionEl.dataset.field;
    const updatedValue = !state.user[field];
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { [field]: updatedValue, updatedAt: serverTimestamp() });
    state.user[field] = updatedValue;
    render();
  }

  if (action === 'logout') {
    localStorage.removeItem('fintrack:onboarded');
    await signOut(auth);
  }

  if (action === 'onboarding-step') {
    state.onboardingStep = Number(actionEl.dataset.step || 0);
    state.message = '';
    render();
  }

  if (action === 'finish-onboarding') {
    localStorage.setItem('fintrack:onboarded', 'true');
    navigate('/dashboard');
  }

  if (action === 'manual-type') {
    const form = actionEl.closest('form');
    form.querySelector('input[name="type"]').value = actionEl.dataset.type;
    form.querySelectorAll('[data-action="manual-type"]').forEach((button) => {
      button.classList.toggle('active', button === actionEl);
      button.classList.toggle('green', button.dataset.type === 'income');
    });
  }

  if (action === 'manual-source') {
    const form = actionEl.closest('form');
    form.querySelector('input[name="source"]').value = actionEl.dataset.source;
    form.querySelectorAll('[data-action="manual-source"]').forEach((button) => button.classList.toggle('active', button === actionEl));
  }

  if (action === 'select-category') {
    const form = actionEl.closest('form');
    form.querySelector('input[name="categoryId"]').value = actionEl.dataset.categoryId;
    form.querySelectorAll('[data-action="select-category"]').forEach((button) => button.classList.toggle('active', button === actionEl));
  }
}

async function handleSubmit(event) {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();

  const formName = form.dataset.form;
  const data = Object.fromEntries(new FormData(form).entries());

  if (formName === 'auth' || formName === 'onboarding-profile') {
    if (formName === 'auth' && !data.email) {
      state.message = 'Email is required to create your account.';
      render();
      return;
    }
    const password = data.password || 'password123';
    try {
      if (formName === 'auth') {
        await signInWithEmailAndPassword(auth, data.email, password).catch(async (e) => {
          if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
             const userCred = await createUserWithEmailAndPassword(auth, data.email, password);
             await initializeNewUser(userCred.user, data.name, data.location);
          } else {
             throw e;
          }
        });
      } else {
         if (auth.currentUser) {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
               name: data.name,
               email: data.email,
               location: data.location,
               updatedAt: serverTimestamp()
            });
         }
      }
      
      state.message = '';
      state.authModalOpen = false;
      if (formName === 'auth') navigate('/dashboard');
      else {
        state.onboardingStep = 1;
        render();
      }
    } catch(e) {
      state.message = e.message;
      render();
    }
    return;
  }

  if (formName === 'phone-auth') {
    if (!data.phone) {
      state.message = 'Phone number is required.';
      render();
      return;
    }
    try {
      state.message = 'Sending code...';
      render(); // Update UI first so recaptcha-container is in its final state for this step
      
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
      
      const confirmationResult = await signInWithPhoneNumber(auth, data.phone, window.recaptchaVerifier);
      state.confirmationResult = confirmationResult;
      state.authMode = 'phone-verify';
      state.message = '';
      render();
    } catch(e) {
      state.message = e.message;
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      render();
    }
    return;
  }

  if (formName === 'phone-verify') {
    if (!data.otp || !state.confirmationResult) {
      state.message = 'Verification code is required.';
      render();
      return;
    }
    try {
      const result = await state.confirmationResult.confirm(data.otp);
      await initializeNewUser(result.user, '');
      state.message = '';
      state.authModalOpen = false;
      state.authMode = 'email';
      navigate('/dashboard');
    } catch(e) {
      state.message = 'Invalid verification code. Please try again.';
      render();
    }
    return;
  }

  if (formName === 'add-transaction') {
    await addDoc(collection(db, 'users', auth.currentUser.uid, 'transactions'), {
        merchant: data.merchant,
        amount: Number(data.amount),
        type: data.type,
        categoryId: data.categoryId,
        source: data.source || 'manual',
        status: 'approved',
        note: data.note || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    state.message = 'Transaction added successfully.';
    await refreshTransactions();
    navigate('/transactions');
  }

  if (formName === 'receipt') {
    state.receiptDraft.status = 'saving';
    render();
    
    let receiptUrl = null;
    if (state.receiptFile && state.receiptFile.fileObj) {
       try {
         const fileRef = ref(storage, `users/${auth.currentUser.uid}/receipts/${Date.now()}_${state.receiptFile.name}`);
         await uploadBytes(fileRef, state.receiptFile.fileObj);
         receiptUrl = await getDownloadURL(fileRef);
       } catch (e) {
         console.warn('Failed to upload receipt to storage:', e);
       }
    }

    const receiptCategory = state.categories.find((category) => category.id === data.categoryId);
    await addDoc(collection(db, 'users', auth.currentUser.uid, 'transactions'), {
        merchant: data.merchant,
        amount: Number(data.amount),
        type: receiptCategory?.name === 'Income' ? 'income' : 'expense',
        categoryId: data.categoryId,
        source: 'receipt',
        status: 'verified',
        note: data.note || null,
        receiptUrl: receiptUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    resetReceiptCapture();
    state.message = 'Receipt recorded successfully.';
    await refreshTransactions();
    navigate('/transactions');
  }

  if (formName === 'edit-transaction') {
    const id = state.editingTransaction.id;
    await updateDoc(doc(db, 'users', auth.currentUser.uid, 'transactions', id), {
        merchant: data.merchant,
        amount: Number(data.amount),
        type: data.type,
        categoryId: data.categoryId,
        source: data.source,
        status: data.status,
        note: data.note || null,
        updatedAt: serverTimestamp()
    });
    state.editingTransaction = null;
    await refreshTransactions();
    render();
  }

  if (formName === 'profile') {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        name: data.name,
        email: data.email,
        location: data.location,
        updatedAt: serverTimestamp()
    });
    state.user.name = data.name;
    state.user.email = data.email;
    state.user.location = data.location;
    render();
  }
}

async function handleChange(event) {
  const input = event.target;

  if (input.dataset.input === 'source') {
    state.filters.source = input.value;
    render();
  }

  if (input.dataset.input === 'category-select') {
    state.filters.category = input.value;
    render();
  }

  if (input.dataset.input === 'currency') {
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        currency: input.value,
        updatedAt: serverTimestamp()
    });
    state.user.currency = input.value;
    render();
  }

  if (input.dataset.input === 'receipt-file' && input.files?.[0]) {
    await handleReceiptFile(input.files[0]);
  }
}

function handleInput(event) {
  const input = event.target;
  if (input.dataset.input === 'search') {
    state.filters.search = input.value;
    render();
  }
}

async function handleReceiptFile(file) {
  if (state.receiptFile?.previewUrl) URL.revokeObjectURL(state.receiptFile.previewUrl);
  state.receiptFile = {
    name: file.name,
    type: file.type || 'application/octet-stream',
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    fileObj: file,
  };
  state.receiptDraft.status = 'scanning';
  state.receiptDraft.error = '';
  render();

  const formData = new FormData();
  formData.append('receipt', file);

  try {
    const extracted = await api('/api/receipt/extract', {
      method: 'POST',
      body: formData,
      rawBody: true,
    });
    state.receiptDraft = {
      merchant: extracted.merchant,
      amount: String(extracted.amount || ''),
      categoryId: categoryIdForName(extracted.categoryName) || firstExpenseCategory()?.id || state.categories[0]?.id || '',
      note: extracted.note,
      reader: extracted.provider,
      confidence: extracted.confidence,
      converted: Boolean(extracted.converted),
      originalAmount: extracted.originalAmount,
      originalCurrency: extracted.originalCurrency,
      currency: extracted.currency,
      status: 'ready',
      error: '',
    };
  } catch (error) {
    state.receiptDraft = {
      merchant: '',
      amount: '',
      categoryId: firstExpenseCategory()?.id || state.categories[0]?.id || '',
      note: '',
      reader: null,
      confidence: null,
      converted: false,
      originalAmount: null,
      originalCurrency: null,
      currency: state.user?.currency || 'NGN',
      status: 'ready',
      error: error.message || 'Could not read this receipt file. Enter the details manually or try a clearer upload.',
    };
  }

  render();
}

function resetReceiptCapture() {
  if (state.receiptFile?.previewUrl) URL.revokeObjectURL(state.receiptFile.previewUrl);
  state.receiptFile = null;
  state.receiptDraft = createEmptyReceiptDraft();
}

function resetScanEntry() {
  state.message = '';
  if (state.scanMode === 'receipt') {
    resetReceiptCapture();
    render();
    return;
  }

  state.receiptDraft = createEmptyReceiptDraft();
  render();
  resetManualEntryForm(document.querySelector('form[data-form="add-transaction"]'));
}

function resetManualEntryForm(form) {
  if (!form) return;
  form.reset();

  const typeInput = form.querySelector('input[name="type"]');
  const sourceInput = form.querySelector('input[name="source"]');
  const categoryInput = form.querySelector('input[name="categoryId"]');
  if (typeInput) typeInput.value = 'expense';
  if (sourceInput) sourceInput.value = 'manual';
  if (categoryInput) categoryInput.value = state.categories[0]?.id || '';

  form.querySelectorAll('[data-action="manual-type"]').forEach((button) => {
    button.classList.toggle('active', button.dataset.type === 'expense');
    button.classList.toggle('green', button.dataset.type === 'income');
  });
  form.querySelectorAll('[data-action="manual-source"]').forEach((button) => {
    button.classList.toggle('active', button.dataset.source === 'manual');
  });
  form.querySelectorAll('[data-action="select-category"]').forEach((button) => {
    button.classList.toggle('active', button.dataset.categoryId === (state.categories[0]?.id || ''));
  });
}

function createEmptyReceiptDraft() {
  return {
    merchant: '',
    amount: '',
    categoryId: firstExpenseCategory()?.id || state.categories[0]?.id || '',
    note: '',
    reader: null,
    confidence: null,
    converted: false,
    originalAmount: null,
    originalCurrency: null,
    currency: state.user?.currency || 'NGN',
    status: 'idle',
    error: '',
  };
}

async function api(url, options = {}) {
  const init = {
    method: options.method || 'GET',
    headers: {},
  };

  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    init.headers['Authorization'] = `Bearer ${token}`;
  }
  // Add target currency for receipt extraction
  if (state.user && state.user.currency) {
    init.headers['x-target-currency'] = state.user.currency;
  }

  if (options.body !== undefined) {
    if (options.rawBody) {
      init.body = options.body;
    } else {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || 'Request failed');
  return payload;
}

function navigate(path) {
  history.pushState(null, '', path);
  state.message = '';
  render();
}

function normalizePath(path) {
  return path.replace(/\/+$/, '') || '/';
}

function filteredTransactions() {
  const term = state.filters.search.toLowerCase();
  return state.transactions.filter((transaction) => {
    const matchesSearch = !term ||
      transaction.merchant.toLowerCase().includes(term) ||
      transaction.category.name.toLowerCase().includes(term) ||
      (transaction.note || '').toLowerCase().includes(term);
    const matchesCategory = state.filters.category === 'All' || transaction.category.name === state.filters.category;
    const matchesSource = state.filters.source === 'All' || transaction.source === state.filters.source;
    return matchesSearch && matchesCategory && matchesSource;
  });
}

function groupByDate(transactions) {
  return transactions.reduce((groups, transaction) => {
    const key = formatDate(transaction.createdAt);
    groups[key] = groups[key] || [];
    groups[key].push(transaction);
    return groups;
  }, {});
}

function categoryIdForName(name) {
  return state.categories.find((category) => category.name.toLowerCase() === String(name || '').toLowerCase())?.id || '';
}

function firstExpenseCategory() {
  return state.categories.find((category) => category.name !== 'Income');
}

function formatCurrency(amount, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'NGN' ? 0 : 2,
  }).format(Number(amount || 0));
}

function currencySymbol(currency = 'NGN') {
  const formatted = formatCurrency(0, currency);
  return formatted.replace(/[0-9.,\s]/g, '') || currency;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return 'Just now';
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return diffD === 1 ? 'Yesterday' : `${diffD}d ago`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}
