import type { VercelRequest, VercelResponse } from '@vercel/node';

// 動態導入 Firebase Admin（Vercel ESM 兼容）
async function getFirestore() {
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (getApps().length === 0) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore();
}

// 設定的預設值（當 Firestore 沒有設定時使用）
const DEFAULT_SETTINGS: Record<string, string | number> = {
  contact_email: 'contact@portfolioblender.com',
  whatsapp_number: '+85291234567',
  support_email: 'support@portfolioblender.com',
  trial_quota_max: 50,
  plan_duration_days: 30,
  admin_email: '',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { key } = req.query;

  try {
    const db = await getFirestore();
    const settingsDoc = await db.collection('settings').doc('site').get();

    // 如果沒有指定 key，返回所有設定
    if (!key) {
      if (!settingsDoc.exists) {
        return res.status(200).json({
          success: true,
          settings: DEFAULT_SETTINGS,
          source: 'defaults',
        });
      }

      const data = settingsDoc.data() || {};
      // 合併預設值
      const settings: Record<string, string | number> = { ...DEFAULT_SETTINGS };
      for (const k of Object.keys(DEFAULT_SETTINGS)) {
        if (data[k] !== undefined && data[k] !== null && data[k] !== '') {
          settings[k] = data[k];
        }
      }

      return res.status(200).json({
        success: true,
        settings,
        source: 'firestore',
      });
    }

    // 如果指定了 key，只返回該設定
    if (typeof key !== 'string') {
      return res.status(400).json({ error: 'Invalid key parameter' });
    }

    if (!settingsDoc.exists) {
      // 返回預設值
      if (key in DEFAULT_SETTINGS) {
        return res.status(200).json({
          key,
          value: DEFAULT_SETTINGS[key],
          source: 'defaults',
        });
      }
      return res.status(404).json({ error: 'Setting not found' });
    }

    const data = settingsDoc.data() || {};
    const value = data[key] !== undefined ? data[key] : DEFAULT_SETTINGS[key];

    if (value === undefined) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    return res.status(200).json({
      key,
      value,
      source: data[key] !== undefined ? 'firestore' : 'defaults',
    });

  } catch (error) {
    console.error('Error fetching setting:', error);

    // 發生錯誤時嘗試返回預設值
    if (key && typeof key === 'string' && key in DEFAULT_SETTINGS) {
      return res.status(200).json({
        key,
        value: DEFAULT_SETTINGS[key],
        source: 'defaults_fallback',
      });
    }

    return res.status(500).json({ error: 'Failed to fetch setting' });
  }
}
