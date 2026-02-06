import type { VercelRequest, VercelResponse } from '@vercel/node';

// Dynamic import for firebase-admin (same fix as check-user-status)
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

// Poe API Configuration
const POE_API_URL = 'https://api.poe.com/v1/chat/completions';
// 使用 GPT-4o 並開啟 web_search
const POE_MODEL = 'GPT-4o';

// Monthly usage limit
const MONTHLY_AI_LIMIT = 30;

interface PortfolioData {
  weights: Record<string, number>;
  metrics: {
    cagr: number;
    sharpe: number;
    maxDD: number;
    winRate?: number;
    volatility: number;
    calmar: number;
    totalReturn?: number;
    duration?: number;
  };
  query?: string;
  language?: string;
}

interface UserData {
  email: string;
  plan: string;
  status: boolean;
  aiUsageCount: number;
  aiUsageResetDate: string;
}

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

// Check user access from Firestore
async function checkUserAccess(email: string): Promise<{
  allowed: boolean;
  isPro: boolean;
  usageCount: number;
  remainingUsage: number;
  error?: string;
}> {
  try {
    // Check blacklist first
    const blacklistDoc = await db.collection('blacklist').doc(emailToDocId(email)).get();
    if (blacklistDoc.exists) {
      return {
        allowed: false,
        isPro: false,
        usageCount: 0,
        remainingUsage: 0,
        error: '此帳號已被停用'
      };
    }

    // Get user document
    const userDoc = await db.collection('users').doc(emailToDocId(email)).get();

    if (!userDoc.exists) {
      return {
        allowed: false,
        isPro: false,
        usageCount: 0,
        remainingUsage: 0,
        error: '用戶不存在'
      };
    }

    const userData = userDoc.data() as UserData;

    // Check if user has AI access (FirstMonth, Pro, or Admin)
    const plansWithAI = ['FirstMonth', 'Pro', 'Admin'];
    if (!plansWithAI.includes(userData.plan)) {
      return {
        allowed: false,
        isPro: false,
        usageCount: 0,
        remainingUsage: 0,
        error: 'AI 分析是 FirstMonth / Pro 專屬功能'
      };
    }

    // Check usage count
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const resetDate = userData.aiUsageResetDate || '';
    const resetMonth = resetDate ? resetDate.substring(0, 7) : '';

    let usageCount = userData.aiUsageCount || 0;

    // Reset count if it's a new month
    if (resetMonth !== currentMonth) {
      usageCount = 0;
      // Update the reset date in Firestore
      await db.collection('users').doc(emailToDocId(email)).update({
        aiUsageCount: 0,
        aiUsageResetDate: now.toISOString().split('T')[0],
      });
    }

    const remainingUsage = Math.max(0, MONTHLY_AI_LIMIT - usageCount);

    if (usageCount >= MONTHLY_AI_LIMIT) {
      return {
        allowed: false,
        isPro: true,
        usageCount,
        remainingUsage: 0,
        error: `本月 AI 使用次數已達上限 (${MONTHLY_AI_LIMIT} 次)`,
      };
    }

    return { allowed: true, isPro: true, usageCount, remainingUsage };

  } catch (error) {
    console.error('Error checking user access:', error);
    return {
      allowed: false,
      isPro: false,
      usageCount: 0,
      remainingUsage: 0,
      error: 'Internal error'
    };
  }
}

// Update usage count in Firestore
async function updateUsageCount(email: string, newCount: number): Promise<void> {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  try {
    await db.collection('users').doc(emailToDocId(email)).update({
      aiUsageCount: newCount,
      aiUsageResetDate: todayStr,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating usage count:', error);
  }
}

// 生成系統提示詞
function generateSystemPrompt(language: string): string {
  const langInstruction = language === 'en'
    ? 'Please respond in English.'
    : '請用粵語回覆。';

  return `${langInstruction}

你係一個專業詳盡又有趣嘅股票thread爆文分析專家。

每次分析股票或投資組合時，請跟以下結構：

1. 開頭：
- 用一句捉眼球、反差或爆點嘅問題／現象引入（例如：「XXX點解突然抽升，背後其實唔止一個原因！」）
- 指定目標受眾（新手／專業／炒家），用對應語氣

2. 中段：
- 按以下重點每個都要有 point form 條列，並且每點都要解釋 (若分析組合，請針對主要持倉或整體配置)：
- ✨【大訂單／新生意】有冇？金額、交付時間、對業績有幾大boost？
- 💰【投資評級／目標價】有冇機構調升／調低？乜機構？內容點講？目標價距現價幾多%？（講埋點解啲大行會咁睇）
- 📜【法規／政策利好】有冇新政策？點影響公司主業？（解釋政策有咩深層影響）
- 🦈【大戶／名人買入】有冇著名投資者／基金大手掃貨？（背後可能係咩訊號？）
- 🔄【收購／ETF／指數納入】有冇相關消息？點解會吸引資金？
- 🧐【其他因素】有冇啲你未提但可能影響股價嘅消息？
- 🏭【公司主業／產品】簡單解釋公司主業、產品、創新、稀缺性、競爭對手、市佔率、行業地位
- 🥊【潛在對手表現】近期主要對手有冇大動作？股價/業績/新聞動態？有冇威脅？
- 📈【PE（市盈率）與同行比較】現時PE高/低？行內排第幾？反映咩？有無折讓/溢價（需用最簡單例子解釋）
- 🏷️【現價對比52周高/低】現價對比52周最高/最低喺咩位？（只要唔係新高就唔用「新高」兩字，務求誠實分析）
- 📊【最近財報】賺唔賺錢？有冇超預期？下次財報幾多日後？（講埋財報爆點）
- 🪙【負債與現金流】
    - 公司總負債有幾多？（如有分長短債分開講）
    - 現金流夠唔夠頂住負債？（簡單例子：現金夠唔夠還債？會唔會有財務壓力？現金流入定流出？）
    - 有冇潛在財務風險隱憂？
- 🆙【看升觀點】列1-2個，點解有咩利好？（每個比1-5分）
- 🆘【看跌觀點】列1-2個，點解有咩風險？（每個比1-5分）
- 🔮【未來一星期走勢預測】（要講埋背後推理）

- 每個point唔只列事實，要加一兩句解釋、比喻、或反差（例如：「你以為只係因為大訂單，但原來背後仲有呢個隱藏催化劑…」）
- 每300字要有一個「啊哈」moment／反直覺觀點
- 🔗【組合相關性】解釋這組合的correlation，他們如何達到平衡

3. 結尾：
- **投資建議分數（10分滿分）**
- 🌱【長線投資分數】：請用10分制評分，並用2-3句解釋長線應否考慮持有，主要睇業務、增長、行業、財務、風險。
- ⚡️【短線投機分數】：請用10分制評分，並用2-3句解釋短線炒作值唔值得，主要睇消息、成交、炒作氛圍。
- 用一句問題／挑戰call to action，**不要叫人留言**，而是問讀者是否想投資這組合，有什麼考慮之類（例如：「睇完分析，你會唔會想跟呢個組合？定係仲有咩風險令你卻步？」）
- 可加emoji、meme語氣
- ➕【加倉建議】加入你的建議，如應該加入什麼股票到這組合

語氣要求：
- 用粵語，手機友好爆文style
- 節奏明快，易睇易明
- 兼顧專業細節同共鳴感
- 適當時用emoji／短句／問題拉近距離
- （如要針對某隻股票／目標受眾／特定話題，請先講明）`;
}

// 格式化投資組合數據
function formatPortfolioData(data: PortfolioData): string {
  const sortedWeights = Object.entries(data.weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([ticker, weight]) => `${ticker}: ${(weight * 100).toFixed(2)}%`)
    .join('\n');

  const metrics = data.metrics;
  const metricsText = `
- 年化回報 (CAGR): ${(metrics.cagr * 100).toFixed(2)}%
- 夏普比率 (Sharpe): ${metrics.sharpe.toFixed(2)}
- 最大回撤 (MaxDD): ${(metrics.maxDD * 100).toFixed(2)}%
- 波動率 (Volatility): ${(metrics.volatility * 100).toFixed(2)}%
- 卡爾馬比率 (Calmar): ${metrics.calmar.toFixed(2)}
${metrics.winRate !== undefined ? `- 勝率 (Win Rate): ${(metrics.winRate * 100).toFixed(1)}%` : ''}
${metrics.totalReturn !== undefined ? `- 總回報 (Total Return): ${(metrics.totalReturn * 100).toFixed(1)}%` : ''}
${metrics.duration !== undefined ? `- 數據跨度: ${metrics.duration.toFixed(1)} 年` : ''}
`.trim();

  return `
【前 15 大持倉權重】
${sortedWeights}

【核心績效指標】
${metricsText}
`.trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Firebase (dynamic import)
    await initFirebase();

    // Step 1: Verify Firebase Token
    const tokenResult = await verifyToken(req.headers.authorization);
    if (!tokenResult.valid || !tokenResult.email) {
      return res.status(401).json({
        error: tokenResult.error || '認證失敗',
        code: 'AUTH_FAILED',
      });
    }

    const userEmail = tokenResult.email;
    console.log(`AI request from verified user: ${userEmail}`);

    // Step 2: Check User Plan and Usage Limit (from Firestore)
    const accessResult = await checkUserAccess(userEmail);
    if (!accessResult.allowed) {
      return res.status(403).json({
        error: accessResult.error || '無權限使用此功能',
        code: accessResult.isPro ? 'USAGE_LIMIT_EXCEEDED' : 'NOT_PRO_USER',
        usageCount: accessResult.usageCount,
        remainingUsage: accessResult.remainingUsage,
        limit: MONTHLY_AI_LIMIT,
      });
    }

    // Step 3: Process AI Request
    const POE_API_KEY = process.env.POE_API_KEY;
    if (!POE_API_KEY) {
      console.error('POE_API_KEY not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const { weights, metrics, query, language = 'zh-TW' } = req.body as PortfolioData;

    if (!weights || !metrics) {
      return res.status(400).json({ error: 'Missing portfolio data' });
    }

    const portfolioSummary = formatPortfolioData({ weights, metrics });
    const systemPrompt = generateSystemPrompt(language);

    const userMessage = `
分析對象 (投資組合數據):
${portfolioSummary}

用戶問題: "${query || "請根據以下結構分析此投資組合"}"
`.trim();

    console.log('Calling Poe API with model:', POE_MODEL);

    const response = await fetch(POE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: POE_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        // 開啟 Web Search 功能，讓 AI 可以搜索最新資料
        web_search: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Poe API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'AI service error',
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No response from AI';

    // Step 4: Update Usage Count in Firestore
    const newUsageCount = accessResult.usageCount + 1;
    await updateUsageCount(userEmail, newUsageCount);

    return res.status(200).json({
      success: true,
      analysis: aiResponse,
      model: POE_MODEL,
      usageCount: newUsageCount,
      remainingUsage: MONTHLY_AI_LIMIT - newUsageCount,
      limit: MONTHLY_AI_LIMIT,
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
