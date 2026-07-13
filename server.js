const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const admin = require('firebase-admin');

const ROOT = __dirname;
const localEnv = loadLocalEnv();
for (const [name, value] of Object.entries(localEnv)) {
  if (process.env[name] === undefined) process.env[name] = value;
}

try {
  // Try initializing with application default credentials, which requires
  // GOOGLE_APPLICATION_CREDENTIALS environment variable.
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
} catch (error) {
  console.warn('Firebase Admin initialization failed. Ensure GOOGLE_APPLICATION_CREDENTIALS is set.', error.message);
}

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || 'localhost';
const PUBLIC_DIR = path.join(ROOT, 'public');
const MODEL = envValue('GEMINI_MODEL') || 'gemini-2.5-flash';
const EXCHANGE_RATE_API_URL = envValue('EXCHANGE_RATE_API_URL') || 'https://open.er-api.com/v6/latest/{base}';
const EXCHANGE_RATE_CACHE_MS = 60 * 60 * 1000;
const exchangeRateCache = new Map();
const RECEIPT_MIME_TYPES = new Set([
  'application/msword',
  'application/pdf',
  'application/rtf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'text/rtf',
]);

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

async function handleApi(req, res, requestUrl) {
  const method = req.method || 'GET';
  const pathname = requestUrl.pathname;

  // Endpoint to return user profile when user is logged in
  if ((pathname === '/api/user' || pathname === '/api/profile' || pathname === '/api/user/profile') && method === 'GET') {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return sendJson(res, 401, { error: 'Unauthorized: Missing or invalid authorization header' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    let useFirestore = admin.apps.length > 0;
    try {
      if (admin.apps.length > 0) {
        try {
          decodedToken = await admin.auth().verifyIdToken(token);
        } catch (authError) {
          console.warn('Firebase Admin verification failed, trying fallback JWT decoding:', authError.message);
          useFirestore = false;
          decodedToken = decodeTokenFallback(token);
        }
      } else {
        decodedToken = decodeTokenFallback(token);
      }
      
      if (!decodedToken) {
        throw new Error('Fallback token decoding failed or returned null');
      }
    } catch (error) {
      console.error('Auth verification failed:', error.message);
      return sendJson(res, 401, { error: 'Unauthorized: Invalid ID token or server missing credentials' });
    }

    let profile = null;
    if (useFirestore) {
      try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(decodedToken.uid);
        let userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          const defaultUserData = {
            name: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'User'),
            email: decodedToken.email || '',
            phone: decodedToken.phone || '',
            plan: 'free',
            currency: 'NGN',
            location: 'Nigeria',
            pushNotifications: true,
            gmailLinked: false,
            smsActive: false,
            cameraEnabled: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          await userRef.set(defaultUserData);
          
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
          const batch = db.batch();
          for (const cat of defaultCats) {
            const catRef = userRef.collection('categories').doc();
            batch.set(catRef, cat);
          }
          await batch.commit();
          userDoc = await userRef.get();
        }
        profile = { id: decodedToken.uid, ...userDoc.data() };
      } catch (e) {
        console.error('Firestore operation failed:', e);
      }
    }
    
    if (!profile) {
      profile = {
        id: decodedToken.uid,
        name: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'User'),
        email: decodedToken.email || '',
        phone: '',
        plan: 'free',
        currency: 'NGN',
        location: 'Nigeria',
        pushNotifications: true,
        gmailLinked: false,
        smsActive: false,
        cameraEnabled: false,
      };
    }

    return sendJson(res, 200, profile);
  }

  if (pathname === '/api/receipt/extract' && method === 'POST') {
    // 1. Verify Authentication
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return sendJson(res, 401, { error: 'Unauthorized: Missing or invalid authorization header' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      if (admin.apps.length > 0) {
        try {
          decodedToken = await admin.auth().verifyIdToken(token);
        } catch (authError) {
          console.warn('Firebase Admin verification failed, trying fallback JWT decoding:', authError.message);
          decodedToken = decodeTokenFallback(token);
        }
      } else {
        decodedToken = decodeTokenFallback(token);
      }
      
      if (!decodedToken) {
        throw new Error('Fallback token decoding failed or returned null');
      }
    } catch (error) {
      console.error('Auth verification failed:', error.message);
      return sendJson(res, 401, { error: 'Unauthorized: Invalid ID token or server missing credentials' });
    }

    // 2. Extract Receipt
    const file = await readMultipartFile(req);
    if (!file) return sendJson(res, 400, { error: 'Receipt file is required' });
    if (!isSupportedReceiptFile(file)) {
      return sendJson(res, 415, { error: 'Unsupported receipt file type. Upload an image, PDF, Word document, or text file.' });
    }

    if (!geminiApiKey()) {
      return sendJson(res, 503, { error: 'Gemini receipt reading is not configured. Add GEMINI_API_KEY and restart the server.' });
    }

    try {
      const extracted = await extractWithGemini(file);
      // We read currency preference from the body since we don't have user table
      // The client should send it as a form field, or we default to NGN
      const targetCurrency = req.headers['x-target-currency'] || 'NGN'; 
      const converted = await convertReceiptCurrency(extracted, targetCurrency);
      return sendJson(res, 200, { ...converted, provider: 'gemini' });
    } catch (error) {
      console.error('Receipt extraction failed:', error);
      return sendJson(res, 502, { error: error.publicMessage || 'Gemini could not read this receipt file. Try a clearer file or enter the details manually.' });
    }
  }

  sendJson(res, 404, { error: 'Not found' });
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
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
  };

  res.writeHead(200, { 
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'Cross-Origin-Opener-Policy': 'unsafe-none',
    'Cross-Origin-Embedder-Policy': 'unsafe-none'
  });
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
  const mimeType = headers.match(/Content-Type:\s*([^\r\n]+)/i)?.[1]?.split(';')[0].trim().toLowerCase() || 'image/jpeg';
  const dataStart = headerEnd + 4;
  const dataEnd = buffer.indexOf(Buffer.from(`\r\n--${boundary}`), dataStart);
  if (dataEnd === -1) return null;

  return {
    filename,
    mimeType,
    buffer: buffer.slice(dataStart, dataEnd),
  };
}

function isSupportedReceiptFile(file) {
  return file.mimeType.startsWith('image/') || RECEIPT_MIME_TYPES.has(file.mimeType);
}

async function extractWithGemini(file) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': geminiApiKey(),
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
                'Read this receipt, invoice, payment screenshot, PDF, or document and return only valid JSON.',
                'Extract merchant, total amount as a number, original receipt currency as an ISO 4217 code, best categoryName, and a short note.',
                'Allowed categoryName values: Shopping, Food, Transport, Utility, Subscription, Entertainment, Health, Markets, Rent, Income.',
                'Use the currency printed on the receipt, payment page, or invoice. If currency is unclear, use null.',
                'If the receipt is unclear, use the most likely value and lower confidence.',
                'JSON shape: {"merchant":"string","amount":12345,"currency":"NGN","categoryName":"Food","note":"string","confidence":0.0}',
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

function envValue(name) {
  return String(process.env[name] || localEnv[name] || '').trim();
}

function loadLocalEnv() {
  return ['.env', '.env.local'].reduce((values, filename) => {
    const envPath = path.join(ROOT, filename);
    if (!fs.existsSync(envPath)) return values;
    return { ...values, ...dotenv.parse(fs.readFileSync(envPath)) };
  }, {});
}

function geminiApiKey() {
  return envValue('GEMINI_API_KEY') || envValue('GOOGLE_API_KEY');
}

function normalizeReceipt(value) {
  const merchant = typeof value.merchant === 'string' && value.merchant.trim()
    ? value.merchant.trim()
    : 'Receipt Purchase';
  const amount = typeof value.amount === 'number'
    ? value.amount
    : Number(String(value.amount || '').replace(/[^\d.]/g, '')) || 0;
  const currency = normalizeCurrency(value.currency);
  const categoryName = typeof value.categoryName === 'string' && value.categoryName.trim()
    ? value.categoryName.trim()
    : 'Shopping';
  const note = typeof value.note === 'string' && value.note.trim()
    ? value.note.trim()
    : 'Captured from receipt';
  const confidence = typeof value.confidence === 'number'
    ? Math.max(0, Math.min(1, value.confidence))
    : 0.75;

  return { merchant, amount, currency, categoryName, note, confidence };
}

async function convertReceiptCurrency(receipt, targetCurrency) {
  const destination = normalizeCurrency(targetCurrency) || 'NGN';
  const source = receipt.currency || destination;

  if (source === destination) {
    return {
      ...receipt,
      amount: roundCurrencyAmount(receipt.amount, destination),
      currency: destination,
      originalAmount: roundCurrencyAmount(receipt.amount, source),
      originalCurrency: source,
      exchangeRate: 1,
      converted: false,
    };
  }

  const exchangeRate = await fetchExchangeRate(source, destination);
  const convertedAmount = roundCurrencyAmount(receipt.amount * exchangeRate, destination);
  const originalAmount = roundCurrencyAmount(receipt.amount, source);
  const conversionNote = `Original: ${formatAmountForNote(originalAmount, source)} converted at 1 ${source} = ${formatRateForNote(exchangeRate)} ${destination}.`;

  return {
    ...receipt,
    amount: convertedAmount,
    currency: destination,
    originalAmount,
    originalCurrency: source,
    exchangeRate,
    converted: true,
    note: receipt.note ? `${receipt.note} ${conversionNote}` : conversionNote,
  };
}

async function fetchExchangeRate(sourceCurrency, targetCurrency) {
  const source = normalizeCurrency(sourceCurrency);
  const target = normalizeCurrency(targetCurrency);
  if (!source || !target) throw publicError(`Could not identify receipt currency for conversion to ${targetCurrency}.`);
  if (source === target) return 1;

  const cacheKey = `${source}:${target}`;
  const cached = exchangeRateCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < EXCHANGE_RATE_CACHE_MS) return cached.rate;

  const url = EXCHANGE_RATE_API_URL
    .replace('{base}', encodeURIComponent(source))
    .replace('{source}', encodeURIComponent(source))
    .replace('{target}', encodeURIComponent(target));

  let payload;
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Exchange API failed with ${response.status}`);
    payload = await response.json();
  } catch (error) {
    throw publicError(`Could not convert ${source} to ${target}. Check exchange-rate configuration or enter the converted amount manually.`, error);
  }

  const rate = readExchangeRate(payload, target);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw publicError(`Could not find an exchange rate for ${source} to ${target}. Enter the converted amount manually.`);
  }

  exchangeRateCache.set(cacheKey, { rate, fetchedAt: Date.now() });
  return rate;
}

function readExchangeRate(payload, targetCurrency) {
  if (typeof payload?.conversion_rate === 'number') return payload.conversion_rate;
  if (typeof payload?.result === 'number') return payload.result;
  if (typeof payload?.rates?.[targetCurrency] === 'number') return payload.rates[targetCurrency];
  if (typeof payload?.conversion_rates?.[targetCurrency] === 'number') return payload.conversion_rates[targetCurrency];
  return 0;
}

function normalizeCurrency(value) {
  if (typeof value !== 'string') return '';
  const currency = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : '';
}

function roundCurrencyAmount(amount, currency) {
  const decimals = currency === 'NGN' ? 0 : 2;
  const factor = 10 ** decimals;
  return Math.round(Number(amount || 0) * factor) / factor;
}

function formatAmountForNote(amount, currency) {
  return `${currency} ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: currency === 'NGN' ? 0 : 2,
    maximumFractionDigits: currency === 'NGN' ? 0 : 2,
  })}`;
}

function formatRateForNote(rate) {
  return Number(rate || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function publicError(message, cause) {
  const error = new Error(message);
  error.publicMessage = message;
  if (cause) error.cause = cause;
  return error;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function createId() {
  return crypto.randomUUID();
}

function decodeTokenFallback(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadBuffer = Buffer.from(parts[1], 'base64');
    const payload = JSON.parse(payloadBuffer.toString('utf8'));
    return {
      uid: payload.sub,
      email: payload.email,
      name: payload.name || (payload.email ? payload.email.split('@')[0] : 'User'),
      ...payload
    };
  } catch (error) {
    console.error('Fallback token decoding failed:', error);
    return null;
  }
}
