import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const email = req.query.email as string;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Users';

  // 使用 console.error 確保日誌在 Vercel 級別更高，更容易被看到
  console.error(`[Debug] Checking status for: ${email}`);
  console.error(`[Debug] Config check: KEY=${!!AIRTABLE_API_KEY}, BASE=${!!AIRTABLE_BASE_ID}, TABLE=${AIRTABLE_TABLE_NAME}`);

  try {
    // 1. 增加對 Email 欄位名稱的容錯，並對 email 進行編碼以防特殊字符
    const encodedEmail = encodeURIComponent(email);
    const filterFormula = encodeURIComponent(`OR({Email}='${email}',{email}='${email}')`);
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${filterFormula}`;
    
    console.error(`[Debug] Target Email: ${email}`);
    console.error(`[Debug] Full Airtable URL: ${airtableUrl}`);

    const response = await fetch(airtableUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    const data = await response.json() as any;
    console.error(`[Debug] Airtable Status: ${response.status}`);
    console.error(`[Debug] Airtable Raw Data: ${JSON.stringify(data)}`);

    if (data.records && data.records.length > 0) {
      const user = data.records[0].fields;
      console.error(`[Debug] User found in Airtable. Status: "${user.Status}"`);
      
      const isApproved = String(user.Status).trim().toLowerCase() === 'approved';
      
      return res.status(200).json({
        approved: isApproved,
        status: user.Status
      });
    } else {
      // 用户不在 Airtable 中，自动创建记录（状态为 Pending）
      console.error(`[Debug] User not found in Airtable. Auto-registering: ${email}`);
      
      try {
        const createResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fields: {
                Email: email,
                Status: 'Pending',
              },
            }),
          }
        );

        const createData = await createResponse.json();
        console.error(`[Debug] Auto-registration result: ${JSON.stringify(createData)}`);

        if (createResponse.ok) {
          return res.status(200).json({
            approved: false,
            status: 'Pending',
            message: 'Account created. Awaiting admin approval.'
          });
        } else {
          console.error(`[Error] Failed to create user in Airtable: ${JSON.stringify(createData)}`);
          return res.status(200).json({
            approved: false,
            status: 'Error',
            message: 'Failed to create account. Please contact admin.'
          });
        }
      } catch (createError) {
        console.error(`[Error] Exception during auto-registration:`, createError);
        return res.status(200).json({
          approved: false,
          status: 'Not Found',
          message: 'User not found and auto-registration failed.'
        });
      }
    }
  } catch (error) {
    console.error('Error fetching user status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
