// Vercel Serverless Function - 檢查用戶 Airtable 審批狀態
import { VercelRequest, VercelResponse } from '@vercel/node';

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

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME = 'Users' } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
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

    const data = await response.json() as { records: Array<{ id: string; fields: { Email?: string; Status?: boolean } }> };

    if (data.records && data.records.length > 0) {
      // 用戶已存在，檢查審批狀態
      const isApproved = data.records[0].fields.Status === true;
      return res.status(200).json({
        approved: isApproved,
        status: isApproved ? 'Approved' : 'Pending',
        message: isApproved ? '已通過審批' : '等待管理員審批'
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
        status: 'Pending',
        message: '已提交註冊申請，請等待管理員審批'
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
