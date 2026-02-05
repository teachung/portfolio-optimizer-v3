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

// Helper: Convert email to Firestore document ID
function emailToDocId(email: string): string {
  return email.replace(/@/g, '_at_').replace(/\./g, '_dot_');
}

// Helper: Check if plan has expired
function isPlanExpired(planEndDate: string | null | undefined): boolean {
  if (!planEndDate) return false;  // 沒有結束日期 = 不會過期

  const today = new Date();
  today.setHours(0, 0, 0, 0);  // 只比較日期，不比較時間

  const endDate = new Date(planEndDate);
  endDate.setHours(0, 0, 0, 0);

  return today > endDate;  // 今天 > 結束日期 = 已過期
}

// Plans that have expiration (Trial, FirstMonth)
const EXPIRING_PLANS = ['Trial', 'FirstMonth'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accept both GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Firebase
    await initFirebase();

    // Get email from query (GET) or body (POST)
    const email = req.method === 'GET'
      ? req.query.email as string
      : req.body?.email;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const docId = emailToDocId(email);

    // Step 1: Check blacklist
    const blacklistDoc = await db.collection('blacklist').doc(docId).get();
    if (blacklistDoc.exists) {
      console.log(`Blocked user attempted login: ${email}`);
      return res.status(200).json({
        exists: true,
        isBlocked: true,
        plan: null,
        status: false,
        message: '此帳號已被停用',
      });
    }

    // Step 2: Get user data
    const userDoc = await db.collection('users').doc(docId).get();

    if (!userDoc.exists) {
      // User doesn't exist - create new user (pending approval)
      const newUser = {
        email: email,
        plan: null,  // 未付款，沒有 plan
        status: false,  // 未審批
        payerId: null,
        aiUsageCount: 0,
        aiUsageResetDate: new Date().toISOString().split('T')[0],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('users').doc(docId).set(newUser);

      console.log(`New user created (pending): ${email}`);

      return res.status(200).json({
        exists: false,
        isBlocked: false,
        plan: null,
        status: false,
        isNewUser: true,
        approved: false,  // 新用戶需要先付款，approved = false
      });
    }

    // User exists
    const userData = userDoc.data();
    let currentPlan = userData?.plan || null;
    let planExpired = false;

    // Step 3: Check if plan has expired (for Trial and FirstMonth)
    if (currentPlan && EXPIRING_PLANS.includes(currentPlan)) {
      const planEndDate = userData?.planEndDate;

      if (isPlanExpired(planEndDate)) {
        // Plan has expired - auto change to 'Expired'
        console.log(`Plan expired for user ${email}: ${currentPlan} -> Expired (was valid until ${planEndDate})`);

        await db.collection('users').doc(docId).update({
          plan: 'Expired',
          previousPlan: currentPlan,  // 記錄之前的方案
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        currentPlan = 'Expired';
        planExpired = true;
      }
    }

    // Update last login time
    await db.collection('users').doc(docId).update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      exists: true,
      isBlocked: false,
      plan: currentPlan,
      status: userData?.status !== false,
      payerId: userData?.payerId || null,
      approved: userData?.status !== false,  // 前端需要這個欄位來判斷是否跳轉到 app
      planStartDate: userData?.planStartDate || null,
      planEndDate: userData?.planEndDate || null,
      planExpired: planExpired,  // 讓前端知道剛剛過期了
    });

  } catch (error) {
    console.error('Error checking user status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
