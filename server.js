require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const DB_PATH = path.join(ROOT, 'dev.db');
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

const defaultCategories = [
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

initializeDatabase();

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (requestUrl.pathname.startsWith('/api/')) {
      await handleApi(req, res, requestUrl);
      return;
    }

    serveStatic(res, requestUrl.pathname);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: 'Internal server error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Fintrack running at http://${HOST}:${PORT}`);
});

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "avatarUrl" TEXT,
      "plan" TEXT NOT NULL DEFAULT 'free',
      "currency" TEXT NOT NULL DEFAULT 'NGN',
      "location" TEXT NOT NULL DEFAULT 'Abuja, Nigeria',
      "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
      "gmailLinked" BOOLEAN NOT NULL DEFAULT false,
      "smsActive" BOOLEAN NOT NULL DEFAULT false,
      "cameraEnabled" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "Category" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "icon" TEXT NOT NULL DEFAULT 'category',
      "color" TEXT NOT NULL DEFAULT '#77777b',
      "budget" REAL,
      "userId" TEXT NOT NULL,
      CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "Transaction" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "amount" REAL NOT NULL,
      "type" TEXT NOT NULL,
      "merchant" TEXT NOT NULL,
      "note" TEXT,
      "source" TEXT NOT NULL DEFAULT 'manual',
      "status" TEXT NOT NULL DEFAULT 'approved',
      "categoryId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    CREATE UNIQUE INDEX IF NOT EXISTS "Category_userId_name_key" ON "Category"("userId", "name");
  `);

  ensureColumn('User', 'location', "TEXT NOT NULL DEFAULT 'Abuja, Nigeria'");
  ensureColumn('User', 'pushNotifications', 'BOOLEAN NOT NULL DEFAULT true');
  ensureColumn('User', 'gmailLinked', 'BOOLEAN NOT NULL DEFAULT false');
  ensureColumn('User', 'smsActive', 'BOOLEAN NOT NULL DEFAULT false');
  ensureColumn('User', 'cameraEnabled', 'BOOLEAN NOT NULL DEFAULT false');
}

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info("${table}")`).all().map((item) => item.name);
  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
  }
}

async function handleApi(req, res, requestUrl) {
  const method = req.method || 'GET';
  const pathname = requestUrl.pathname;

  if (pathname === '/api/user' && method === 'GET') {
    const user = getCurrentUser();
    return user ? sendJson(res, 200, serializeUser(user)) : sendJson(res, 404, { error: 'No user found' });
  }

  if (pathname === '/api/user' && method === 'POST') {
    const body = await readJson(req);
    const email = typeof body.email === 'string' && body.email.trim() ? body.email.trim().toLowerCase() : null;
    if (!email) return sendJson(res, 400, { error: 'Email is required' });

    const existing = db.prepare('SELECT * FROM "User" WHERE email = ?').get(email);
    const now = nowSql();
    let user;

    if (existing) {
      db.prepare(`
        UPDATE "User"
        SET name = ?, location = ?, currency = ?, updatedAt = ?
        WHERE id = ?
      `).run(body.name || inferNameFromEmail(email), body.location || 'Nigeria', body.currency || existing.currency || 'NGN', now, existing.id);
      user = db.prepare('SELECT * FROM "User" WHERE id = ?').get(existing.id);
    } else {
      const id = createId();
      db.prepare(`
        INSERT INTO "User" (id, name, email, plan, currency, location, createdAt, updatedAt)
        VALUES (?, ?, ?, 'free', ?, ?, ?, ?)
      `).run(id, body.name || inferNameFromEmail(email), email, body.currency || 'NGN', body.location || 'Nigeria', now, now);
      user = db.prepare('SELECT * FROM "User" WHERE id = ?').get(id);
    }

    ensureDefaultCategories(user.id);
    return sendJson(res, 201, serializeUser(user));
  }

  if (pathname === '/api/user' && method === 'PATCH') {
    const user = getCurrentUser();
    if (!user) return sendJson(res, 404, { error: 'No user found' });

    const body = await readJson(req);
    const allowed = ['name', 'email', 'location', 'currency', 'pushNotifications', 'gmailLinked', 'smsActive', 'cameraEnabled'];
    const updates = {};

    for (const field of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, field)) updates[field] = body[field];
    }

    if (Object.keys(updates).length) {
      const assignments = Object.keys(updates).map((field) => `"${field}" = ?`).join(', ');
      const values = Object.entries(updates).map(([field, value]) => {
        if (['pushNotifications', 'gmailLinked', 'smsActive', 'cameraEnabled'].includes(field)) return value ? 1 : 0;
        if (field === 'email') return String(value || user.email).trim().toLowerCase();
        return value;
      });

      db.prepare(`UPDATE "User" SET ${assignments}, updatedAt = ? WHERE id = ?`).run(...values, nowSql(), user.id);
    }

    return sendJson(res, 200, serializeUser(db.prepare('SELECT * FROM "User" WHERE id = ?').get(user.id)));
  }

  if (pathname === '/api/categories' && method === 'GET') {
    const user = getCurrentUser();
    if (!user) return sendJson(res, 200, []);
    ensureDefaultCategories(user.id);
    return sendJson(res, 200, getCategories(user.id));
  }

  if (pathname === '/api/dashboard' && method === 'GET') {
    const user = getCurrentUser();
    if (!user) return sendJson(res, 404, { error: 'No user found' });
    const transactions = getTransactions(user.id);
    const totalIncome = transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
    const topCategories = topSpendingByCategory(transactions).slice(0, 5);

    return sendJson(res, 200, {
      user: {
        name: user.name,
        plan: user.plan,
        currency: user.currency,
        location: user.location,
      },
      balance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
      transactionCount: transactions.length,
      savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
      recentTransactions: transactions.slice(0, 5),
      topCategories,
      syncStatus: {
        sms: Boolean(user.smsActive),
        email: Boolean(user.gmailLinked),
      },
    });
  }

  if (pathname === '/api/transactions' && method === 'GET') {
    const user = getCurrentUser();
    if (!user) return sendJson(res, 200, []);
    return sendJson(res, 200, getTransactions(user.id, {
      search: requestUrl.searchParams.get('search') || '',
      category: requestUrl.searchParams.get('category') || '',
    }));
  }

  if (pathname === '/api/transactions' && method === 'POST') {
    const user = getCurrentUser();
    if (!user) return sendJson(res, 404, { error: 'No user found' });
    const body = await readJson(req);
    const validation = validateTransactionInput(body, user.id);
    if (validation.error) return sendJson(res, 400, { error: validation.error });

    const id = createId();
    const now = nowSql();
    db.prepare(`
      INSERT INTO "Transaction" (id, amount, type, merchant, note, source, status, categoryId, userId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      validation.amount,
      validation.type,
      validation.merchant,
      body.note || null,
      body.source || 'manual',
      body.status || 'approved',
      body.categoryId,
      user.id,
      now,
      now
    );

    return sendJson(res, 201, getTransaction(user.id, id));
  }

  const transactionMatch = pathname.match(/^\/api\/transactions\/([^/]+)$/);
  if (transactionMatch && method === 'PATCH') {
    const user = getCurrentUser();
    if (!user) return sendJson(res, 404, { error: 'No user found' });
    const id = decodeURIComponent(transactionMatch[1]);
    const existing = getTransaction(user.id, id);
    if (!existing) return sendJson(res, 404, { error: 'Transaction not found' });

    const body = await readJson(req);
    const validation = validateTransactionInput(body, user.id);
    if (validation.error) return sendJson(res, 400, { error: validation.error });

    db.prepare(`
      UPDATE "Transaction"
      SET merchant = ?, amount = ?, type = ?, source = ?, status = ?, note = ?, categoryId = ?, updatedAt = ?
      WHERE id = ? AND userId = ?
    `).run(
      validation.merchant,
      validation.amount,
      validation.type,
      body.source || 'manual',
      body.status || 'approved',
      body.note || null,
      body.categoryId,
      nowSql(),
      id,
      user.id
    );

    return sendJson(res, 200, getTransaction(user.id, id));
  }

  if (transactionMatch && method === 'DELETE') {
    const user = getCurrentUser();
    if (!user) return sendJson(res, 404, { error: 'No user found' });
    const id = decodeURIComponent(transactionMatch[1]);
    const result = db.prepare('DELETE FROM "Transaction" WHERE id = ? AND userId = ?').run(id, user.id);
    return result.changes ? sendJson(res, 200, { ok: true }) : sendJson(res, 404, { error: 'Transaction not found' });
  }

  if (pathname === '/api/receipt/extract' && method === 'POST') {
    const file = await readMultipartFile(req);
    if (!file) return sendJson(res, 400, { error: 'Receipt image is required' });

    const fallback = inferFromFileName(file.filename || 'receipt');
    if (!process.env.GEMINI_API_KEY) {
      return sendJson(res, 200, {
        ...fallback,
        provider: 'local',
        note: `${fallback.note}. Add GEMINI_API_KEY to enable image reading.`,
      });
    }

    try {
      const extracted = await extractWithGemini(file);
      return sendJson(res, 200, { ...fallback, ...extracted, provider: 'gemini' });
    } catch (error) {
      console.error('Receipt extraction failed:', error);
      return sendJson(res, 200, {
        ...fallback,
        provider: 'local',
        note: `${fallback.note}. Gemini extraction failed, so local fallback was used.`,
      });
    }
  }

  sendJson(res, 404, { error: 'Not found' });
}

function getCurrentUser() {
  return db.prepare('SELECT * FROM "User" ORDER BY createdAt ASC LIMIT 1').get();
}

function ensureDefaultCategories(userId) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO "Category" (id, name, icon, color, userId)
    VALUES (?, ?, ?, ?, ?)
  `);
  const transaction = db.transaction(() => {
    for (const category of defaultCategories) {
      insert.run(createId(), category.name, category.icon, category.color, userId);
    }
  });
  transaction();
}

function getCategories(userId) {
  return db.prepare('SELECT * FROM "Category" WHERE userId = ? ORDER BY name ASC').all(userId);
}

function getTransactions(userId, filters = {}) {
  const params = [userId];
  const clauses = ['t.userId = ?'];

  if (filters.search) {
    clauses.push('(LOWER(t.merchant) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(COALESCE(t.note, "")) LIKE ?)');
    const term = `%${filters.search.toLowerCase()}%`;
    params.push(term, term, term);
  }

  if (filters.category) {
    clauses.push('c.name = ?');
    params.push(filters.category);
  }

  return db.prepare(`
    SELECT
      t.*,
      c.id AS category_id,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      c.budget AS category_budget
    FROM "Transaction" t
    JOIN "Category" c ON c.id = t.categoryId
    WHERE ${clauses.join(' AND ')}
    ORDER BY datetime(t.createdAt) DESC
  `).all(...params).map(serializeTransaction);
}

function getTransaction(userId, id) {
  const row = db.prepare(`
    SELECT
      t.*,
      c.id AS category_id,
      c.name AS category_name,
      c.icon AS category_icon,
      c.color AS category_color,
      c.budget AS category_budget
    FROM "Transaction" t
    JOIN "Category" c ON c.id = t.categoryId
    WHERE t.userId = ? AND t.id = ?
  `).get(userId, id);
  return row ? serializeTransaction(row) : null;
}

function validateTransactionInput(body, userId) {
  const amount = Number(body.amount);
  const merchant = String(body.merchant || '').trim();
  const type = body.type === 'income' ? 'income' : 'expense';

  if (!merchant) return { error: 'Merchant is required' };
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Amount must be greater than 0' };
  if (!body.categoryId) return { error: 'Category is required' };

  const category = db.prepare('SELECT id FROM "Category" WHERE id = ? AND userId = ?').get(body.categoryId, userId);
  if (!category) return { error: 'Category not found' };

  return { amount, merchant, type };
}

function topSpendingByCategory(transactions) {
  const totals = new Map();

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') continue;
    const key = transaction.category.name;
    const current = totals.get(key) || {
      name: key,
      total: 0,
      icon: transaction.category.icon,
      color: transaction.category.color,
    };
    current.total += transaction.amount;
    totals.set(key, current);
  }

  return [...totals.values()].sort((a, b) => b.total - a.total);
}

function serializeUser(user) {
  return {
    ...user,
    pushNotifications: Boolean(user.pushNotifications),
    gmailLinked: Boolean(user.gmailLinked),
    smsActive: Boolean(user.smsActive),
    cameraEnabled: Boolean(user.cameraEnabled),
  };
}

function serializeTransaction(row) {
  return {
    id: row.id,
    amount: row.amount,
    type: row.type,
    merchant: row.merchant,
    note: row.note,
    source: row.source,
    status: row.status,
    categoryId: row.categoryId,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    category: {
      id: row.category_id,
      name: row.category_name,
      icon: row.category_icon,
      color: row.category_color,
      budget: row.category_budget,
    },
  };
}

function serveStatic(res, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const requestedPath = path.normalize(path.join(PUBLIC_DIR, safePath));
  const publicRoot = `${PUBLIC_DIR}${path.sep}`;
  const filePath = requestedPath.startsWith(publicRoot) && fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()
    ? requestedPath
    : path.join(PUBLIC_DIR, 'index.html');

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
  };

  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

async function readJson(req) {
  const buffer = await readBody(req);
  if (!buffer.length) return {};
  return JSON.parse(buffer.toString('utf8'));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readMultipartFile(req) {
  const contentType = req.headers['content-type'] || '';
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1] || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];
  if (!boundary) return null;

  const buffer = await readBody(req);
  const firstBoundary = Buffer.from(`--${boundary}`);
  const headerEnd = buffer.indexOf(Buffer.from('\r\n\r\n'), buffer.indexOf(firstBoundary));
  if (headerEnd === -1) return null;

  const headers = buffer.slice(buffer.indexOf(firstBoundary), headerEnd).toString('utf8');
  const filename = headers.match(/filename="([^"]*)"/)?.[1] || 'receipt';
  const mimeType = headers.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] || 'image/jpeg';
  const dataStart = headerEnd + 4;
  const dataEnd = buffer.indexOf(Buffer.from(`\r\n--${boundary}`), dataStart);
  if (dataEnd === -1) return null;

  return {
    filename,
    mimeType,
    buffer: buffer.slice(dataStart, dataEnd),
  };
}

async function extractWithGemini(file) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY || '',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: file.mimeType,
                data: file.buffer.toString('base64'),
              },
            },
            {
              text: [
                'Read this receipt or payment screenshot and return only valid JSON.',
                'Extract merchant, total amount as a number, best categoryName, and a short note.',
                'Allowed categoryName values: Shopping, Food, Transport, Utility, Subscription, Entertainment, Health, Markets, Rent.',
                'If the receipt is unclear, use the most likely value and lower confidence.',
                'JSON shape: {"merchant":"string","amount":12345,"categoryName":"Food","note":"string","confidence":0.0}',
              ].join('\n'),
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) throw new Error(`Gemini API failed with ${response.status}`);

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text');

  return normalizeReceipt(JSON.parse(text));
}

function normalizeReceipt(value) {
  const merchant = typeof value.merchant === 'string' && value.merchant.trim()
    ? value.merchant.trim()
    : 'Receipt Purchase';
  const amount = typeof value.amount === 'number'
    ? value.amount
    : Number(String(value.amount || '').replace(/[^\d.]/g, '')) || 0;
  const categoryName = typeof value.categoryName === 'string' && value.categoryName.trim()
    ? value.categoryName.trim()
    : 'Shopping';
  const note = typeof value.note === 'string' && value.note.trim()
    ? value.note.trim()
    : 'Captured from receipt';
  const confidence = typeof value.confidence === 'number'
    ? Math.max(0, Math.min(1, value.confidence))
    : 0.75;

  return { merchant, amount, categoryName, note, confidence };
}

function inferFromFileName(fileName) {
  const normalized = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
  const merchant = normalized.length > 2 ? titleCase(normalized) : 'Receipt Purchase';
  const lower = merchant.toLowerCase();
  const categoryName = lower.includes('fuel') || lower.includes('bolt')
    ? 'Transport'
    : lower.includes('market') || lower.includes('sahad')
      ? 'Markets'
      : lower.includes('cafe') || lower.includes('food') || lower.includes('kilishi')
        ? 'Food'
        : lower.includes('pharmacy') || lower.includes('clinic')
          ? 'Health'
          : 'Shopping';

  return {
    merchant,
    amount: lower.includes('fuel') ? 45000 : 18650,
    categoryName,
    note: 'Locally inferred receipt draft',
    confidence: 0.35,
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function createId() {
  return crypto.randomUUID();
}

function nowSql() {
  return new Date().toISOString();
}

function inferNameFromEmail(email) {
  const localPart = email.split('@')[0] || 'User';
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function titleCase(value) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
