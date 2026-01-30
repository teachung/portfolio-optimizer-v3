// Vercel Serverless Function - 上傳付款證明到 Airtable
import { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

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

  const { email, imageData, fileName, contentType } = req.body;

  if (!email || !imageData) {
    return res.status(400).json({ error: 'Email and image data are required' });
  }

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME = 'Users' } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // 1. 找到用戶記錄
    const filterFormula = encodeURIComponent(`{Email}='${email}'`);
    const checkUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${filterFormula}`;

    const checkResponse = await fetch(checkUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });

    if (!checkResponse.ok) {
      return res.status(500).json({ error: 'Failed to find user' });
    }

    const checkData = await checkResponse.json() as { records: Array<{ id: string; fields: any }> };

    if (!checkData.records || checkData.records.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRecordId = checkData.records[0].id;

    // 2. 上傳圖片到 Airtable
    // Airtable 需要一個公開可訪問的 URL 來添加附件
    // 我們需要先將 base64 圖片上傳到某個服務，或者使用 Airtable 的上傳 API

    // 方法：使用 Airtable 的 attachment URL 方式
    // 我們需要將 base64 轉換為可訪問的 URL
    // 使用 data URI 作為臨時解決方案（Airtable 支持 data URI）

    const dataUri = `data:${contentType || 'image/png'};base64,${imageData}`;

    // 更新用戶記錄，添加 PaymentProof 附件
    const updateResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${userRecordId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          PaymentProof: [
            {
              url: dataUri,
              filename: fileName || `payment_proof_${Date.now()}.png`
            }
          ]
        }
      }),
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('Airtable update error:', errorData);

      // 如果 data URI 不支持，嘗試使用免費圖片上傳服務
      // 這裡我們返回錯誤讓前端知道
      return res.status(500).json({
        error: 'Failed to upload payment proof',
        details: 'Please try again with a smaller image'
      });
    }

    return res.status(200).json({
      success: true,
      message: '付款證明已上傳！我們會在 1-2 個工作天內審核。'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
