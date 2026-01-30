// Vercel Serverless Function - 獲取試用名額
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 設置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID } = process.env;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('Missing Airtable configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // 1. 從 Settings 表獲取配置
    const settingsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Settings?maxRecords=1`;
    const settingsResponse = await fetch(settingsUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });

    let trialQuotaMax = 50; // 預設最大名額
    let trialQuotaOverride: number | null = null;

    if (settingsResponse.ok) {
      const settingsData = await settingsResponse.json() as {
        records: Array<{ fields: { trial_quota_max?: number; trial_quota_override?: number } }>
      };
      if (settingsData.records && settingsData.records.length > 0) {
        const settings = settingsData.records[0].fields;
        if (settings.trial_quota_max) {
          trialQuotaMax = settings.trial_quota_max;
        }
        if (settings.trial_quota_override !== undefined && settings.trial_quota_override !== null) {
          trialQuotaOverride = settings.trial_quota_override;
        }
      }
    }

    // 如果有手動覆蓋值，直接使用
    if (trialQuotaOverride !== null) {
      return res.status(200).json({
        remaining: trialQuotaOverride,
        total: trialQuotaMax,
        isOpen: trialQuotaOverride > 0
      });
    }

    // 2. 計算本月 Trial 用戶數量
    // 獲取本月第一天
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];

    // 查詢本月 Plan = "Trial" 的用戶
    const filterFormula = encodeURIComponent(
      `AND({Plan}='Trial', IS_AFTER(CREATED_TIME(), '${firstDayStr}'))`
    );
    const usersUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Users?filterByFormula=${filterFormula}`;

    const usersResponse = await fetch(usersUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });

    let trialCount = 0;
    if (usersResponse.ok) {
      const usersData = await usersResponse.json() as { records: Array<any> };
      trialCount = usersData.records?.length || 0;
    }

    const remaining = Math.max(0, trialQuotaMax - trialCount);

    return res.status(200).json({
      remaining,
      total: trialQuotaMax,
      isOpen: remaining > 0
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
