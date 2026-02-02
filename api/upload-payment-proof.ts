// Vercel Serverless Function - 上傳付款證明（透過 Google Apps Script）
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

  const GOOGLE_SCRIPT_URL = process.env.VITE_GOOGLE_SCRIPT_URL;

  if (!GOOGLE_SCRIPT_URL) {
    console.error('Missing Google Script URL');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // 透過 Vercel 伺服器端調用 Google Apps Script（避免 CORS 問題）
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        imageData,
        fileName,
        contentType
      })
    });

    const responseText = await response.text();

    // 嘗試解析 JSON
    try {
      const data = JSON.parse(responseText);
      return res.status(200).json(data);
    } catch {
      // 如果不是 JSON，可能是錯誤
      console.error('Google Script response:', responseText);
      return res.status(500).json({
        error: 'Upload service error',
        details: responseText
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
