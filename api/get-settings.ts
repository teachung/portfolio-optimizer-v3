import type { VercelRequest, VercelResponse } from '@vercel/node';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

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

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'Missing key parameter' });
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const filterFormula = encodeURIComponent(`{Key}='${key}'`);
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Settings?filterByFormula=${filterFormula}`;

    const response = await fetch(airtableUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.records && data.records.length > 0) {
      const record = data.records[0];
      return res.status(200).json({
        key: record.fields.Key,
        value: record.fields.Value,
        description: record.fields.Description || null,
      });
    }

    return res.status(404).json({ error: 'Setting not found' });
  } catch (error) {
    console.error('Error fetching setting:', error);
    return res.status(500).json({ error: 'Failed to fetch setting' });
  }
}
