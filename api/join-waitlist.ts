// Vercel Serverless Function - 加入 Waitlist
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 設置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME = 'Users' } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // 1. 檢查用戶是否已存在
    const filterFormula = encodeURIComponent(`{Email}='${email}'`);
    const checkUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${filterFormula}`;

    const checkResponse = await fetch(checkUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!checkResponse.ok) {
      return res.status(500).json({ error: 'Failed to check user' });
    }

    const checkData = await checkResponse.json() as { records: Array<any> };

    if (checkData.records && checkData.records.length > 0) {
      const existingUser = checkData.records[0];
      const currentPlan = existingUser.fields.Plan;

      // 如果已經在 Waitlist，返回成功
      if (currentPlan === 'Waitlist') {
        return res.status(200).json({
          success: true,
          message: '您已在排隊名單中，我們會盡快通知您！',
          alreadyExists: true
        });
      }

      // 如果是其他狀態（Trial, Pro 等），告知用戶
      if (currentPlan) {
        return res.status(200).json({
          success: false,
          message: '此 Email 已有帳戶，請直接登入',
          alreadyExists: true
        });
      }
    }

    // 2. 新增用戶到 Waitlist
    const createResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          Email: email,
          Plan: 'Waitlist',
          Status: false // 未審批
        }
      }),
    });

    if (!createResponse.ok) {
      console.error('Failed to create waitlist user');
      return res.status(500).json({ error: 'Failed to join waitlist' });
    }

    return res.status(200).json({
      success: true,
      message: '成功加入排隊名單！我們會在 1-3 天內通知您。'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
