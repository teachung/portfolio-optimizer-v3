// Vercel Serverless Function - 檢查用戶 Airtable 審批狀態（含 Blacklist 檢查）
import { VercelRequest, VercelResponse } from '@vercel/node';

// 檢查用戶是否在黑名單中
async function checkBlacklist(email: string, apiKey: string, baseId: string, blacklistTable: string): Promise<{ blocked: boolean; reason: string | null }> {
  try {
    const filterFormula = encodeURIComponent(`LOWER({Email})=LOWER('${email}')`);
    const url = `https://api.airtable.com/v0/${baseId}/${blacklistTable}?filterByFormula=${filterFormula}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      console.log('Blacklist check failed, allowing access by default');
      return { blocked: false, reason: null };
    }

    const data = await response.json() as {
      records: Array<{
        id: string;
        fields: { Email?: string; Reason?: string; BlockedDate?: string }
      }>
    };

    if (data.records && data.records.length > 0) {
      const reason = data.records[0].fields.Reason || '違反使用條款';
      console.log(`Email ${email} is blacklisted: ${reason}`);
      return { blocked: true, reason };
    }

    return { blocked: false, reason: null };

  } catch (error) {
    console.error('Error checking blacklist:', error);
    // 如果檢查失敗，預設允許（避免誤封）
    return { blocked: false, reason: null };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 設置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const email = req.query.email as string;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_NAME = 'Users',
    AIRTABLE_BLACKLIST_TABLE = 'Blacklist'  // 新增：Blacklist 表名
  } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // ===== 新增：先檢查 Blacklist =====
    const blacklistCheck = await checkBlacklist(email, AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_BLACKLIST_TABLE);

    if (blacklistCheck.blocked) {
      console.log(`Blocked user attempted login: ${email}`);
      return res.status(200).json({
        approved: false,
        blocked: true,
        blockReason: blacklistCheck.reason,
        status: 'Blocked',
        message: '您的帳戶已被停用',
        plan: null,
        paymentCount: 0
      });
    }

    // 查詢用戶是否存在
    const filterFormula = encodeURIComponent(`{Email}='${email}'`);
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${filterFormula}`;

    const response = await fetch(airtableUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!response.ok) {
      console.error('Airtable API error:', response.status);
      return res.status(500).json({ error: 'Failed to query Airtable' });
    }

    const data = await response.json() as {
      records: Array<{
        id: string;
        fields: {
          Email?: string;
          Status?: boolean;
          Plan?: string;
          PaymentCount?: number
        }
      }>
    };

    if (data.records && data.records.length > 0) {
      // 用戶已存在，檢查審批狀態
      const userFields = data.records[0].fields;
      const isApproved = userFields.Status === true;
      const plan = userFields.Plan || null;
      const paymentCount = userFields.PaymentCount || 0;

      return res.status(200).json({
        approved: isApproved,
        blocked: false,
        status: isApproved ? 'Approved' : 'Pending',
        message: isApproved ? '已通過審批' : '等待管理員審批',
        plan: plan,
        paymentCount: paymentCount
      });
    } else {
      // 用戶不存在，自動註冊（狀態為 Pending）
      const createResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            Email: email,
            Status: false
          }
        }),
      });

      if (!createResponse.ok) {
        console.error('Failed to create user in Airtable');
        return res.status(500).json({ error: 'Failed to register user' });
      }

      return res.status(200).json({
        approved: false,
        blocked: false,
        status: 'Pending',
        message: '已提交註冊申請，請等待管理員審批',
        plan: null,
        paymentCount: 0
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
