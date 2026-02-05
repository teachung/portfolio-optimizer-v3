import type { VercelRequest, VercelResponse } from '@vercel/node';

// Dynamic import for firebase-admin
let admin: any = null;
let db: any = null;

async function initFirebase() {
  if (admin && db) return;

  const firebaseAdmin = await import('firebase-admin');
  admin = firebaseAdmin.default || firebaseAdmin;

  if (!admin.apps || admin.apps.length === 0) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  db = admin.firestore();
}

// Monthly usage limit
const MONTHLY_AI_LIMIT = 30;

// Helper: Convert email to Firestore document ID
function emailToDocId(email: string): string {
  return email.replace(/@/g, '_at_').replace(/\./g, '_dot_');
}

// Verify Firebase ID Token
async function verifyToken(authHeader: string | undefined): Promise<{ valid: boolean; email?: string; error?: string }> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: '未提供認證 Token' };
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return { valid: true, email: decodedToken.email };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { valid: false, error: 'Token 無效或已過期' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Firebase
    await initFirebase();

    // Verify Firebase Token
    const tokenResult = await verifyToken(req.headers.authorization);
    if (!tokenResult.valid || !tokenResult.email) {
      return res.status(401).json({
        error: tokenResult.error || '認證失敗',
      });
    }

    const userEmail = tokenResult.email;
    const docId = emailToDocId(userEmail);

    // Get user document
    const userDoc = await db.collection('users').doc(docId).get();

    if (!userDoc.exists) {
      return res.status(200).json({
        usageCount: 0,
        remainingUsage: MONTHLY_AI_LIMIT,
        limit: MONTHLY_AI_LIMIT,
      });
    }

    const userData = userDoc.data();

    // Check if user has AI access (FirstMonth or Pro)
    const plansWithAI = ['FirstMonth', 'Pro'];
    if (!plansWithAI.includes(userData?.plan)) {
      return res.status(200).json({
        usageCount: 0,
        remainingUsage: 0,
        limit: MONTHLY_AI_LIMIT,
        hasAIAccess: false,
        message: 'AI 分析是 FirstMonth / Pro 專屬功能',
      });
    }

    // Check usage count
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const resetDate = userData?.aiUsageResetDate || '';
    const resetMonth = resetDate ? resetDate.substring(0, 7) : '';

    let usageCount = userData?.aiUsageCount || 0;

    // Reset count if it's a new month
    if (resetMonth !== currentMonth) {
      usageCount = 0;
      // Update the reset date in Firestore
      await db.collection('users').doc(docId).update({
        aiUsageCount: 0,
        aiUsageResetDate: now.toISOString().split('T')[0],
      });
    }

    const remainingUsage = Math.max(0, MONTHLY_AI_LIMIT - usageCount);

    return res.status(200).json({
      usageCount,
      remainingUsage,
      limit: MONTHLY_AI_LIMIT,
      hasAIAccess: true,
    });

  } catch (error) {
    console.error('Error getting AI usage:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
