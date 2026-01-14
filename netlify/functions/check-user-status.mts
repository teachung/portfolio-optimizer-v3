import { Context } from "@netlify/functions";
import Airtable from "airtable";

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "Users";

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
  }

  const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
  const table = base(AIRTABLE_TABLE_NAME);

  try {
    // 1. 搜尋是否有此 Email 的用戶
    const records = await table.select({
      filterByFormula: `{Email} = '${email}'`,
      maxRecords: 1
    }).firstPage();

    if (records.length > 0) {
      // 2. 找到用戶，回傳其審核狀態
      const user = records[0];
      const statusValue = user.fields["Status"];
      // 支援 Checkbox (true) 或者 填入 "確定" 二字
      const isApproved = statusValue === true || statusValue === "確定" || statusValue === "确定";
      
      console.log(`User ${email} status:`, statusValue, "Approved:", isApproved);

      // 更新最後登入時間 (選用)
      await table.update(user.id, {
        "LastLogin": new Date().toISOString()
      });

      return new Response(JSON.stringify({ approved: isApproved }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      // 3. 沒找到用戶，自動新增一筆資料（待確認狀態）
      await table.create([
        {
          fields: {
            "Email": email,
            "Status": false, // 預設未開通
            "LastLogin": new Date().toISOString()
          }
        }
      ]);

      return new Response(JSON.stringify({ approved: false, message: "User created, pending approval" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error: any) {
    console.error("Airtable Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
