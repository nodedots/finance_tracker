import { NextResponse } from 'next/server';

type ExtractedReceipt = {
  merchant: string;
  amount: number;
  categoryName: string;
  note: string;
  confidence: number;
  provider: 'gemini' | 'local';
};

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('receipt');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Receipt image is required' }, { status: 400 });
  }

  const fallback = inferFromFileName(file.name);

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      ...fallback,
      provider: 'local',
      note: `${fallback.note}. Add GEMINI_API_KEY to enable image reading.`,
    });
  }

  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const result = await extractWithGemini(base64, file.type || 'image/jpeg');
    return NextResponse.json({
      ...fallback,
      ...result,
      provider: 'gemini',
    });
  } catch (error) {
    console.error('Receipt extraction failed:', error);
    return NextResponse.json({
      ...fallback,
      provider: 'local',
      note: `${fallback.note}. Gemini extraction failed, so local fallback was used.`,
    });
  }
}

async function extractWithGemini(base64: string, mimeType: string): Promise<Omit<ExtractedReceipt, 'provider'>> {
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
                mime_type: mimeType,
                data: base64,
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

  if (!response.ok) {
    throw new Error(`Gemini API failed with ${response.status}`);
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text');

  const parsed = JSON.parse(text);
  return normalizeReceipt(parsed);
}

function normalizeReceipt(value: Record<string, unknown>): Omit<ExtractedReceipt, 'provider'> {
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

function inferFromFileName(fileName: string): Omit<ExtractedReceipt, 'provider'> {
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

function titleCase(value: string) {
  return value.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}
