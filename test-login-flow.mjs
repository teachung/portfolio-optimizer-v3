import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Users';

console.log('=== 测试登录流程和 Airtable 更新 ===\n');
console.log('配置检查:');
console.log('- API Key:', AIRTABLE_API_KEY ? '✓ 已设置' : '✗ 未设置');
console.log('- Base ID:', AIRTABLE_BASE_ID);
console.log('- Table Name:', AIRTABLE_TABLE_NAME);
console.log('');

// 测试邮箱
const testEmail = 'test@example.com';

async function testFlow() {
  try {
    console.log(`\n1️⃣ 测试查询用户: ${testEmail}`);
    console.log('─'.repeat(50));
    
    // 模拟 API 调用
    const filterFormula = encodeURIComponent(`OR({Email}='${testEmail}',{email}='${testEmail}')`);
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${filterFormula}`;
    
    console.log('查询 URL:', airtableUrl);
    
    const response = await fetch(airtableUrl, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    console.log('响应状态:', response.status);
    
    const data = await response.json();
    console.log('响应数据:', JSON.stringify(data, null, 2));

    if (data.records && data.records.length > 0) {
      console.log('\n✓ 用户已存在');
      console.log('状态:', data.records[0].fields.Status);
      console.log('邮箱字段:', data.records[0].fields.Email || data.records[0].fields.email);
    } else {
      console.log('\n✗ 用户不存在，尝试自动注册...');
      
      console.log('\n2️⃣ 测试自动注册');
      console.log('─'.repeat(50));
      
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
              Email: testEmail,
              Status: false, // false = Pending, true = Approved
            },
          }),
        }
      );

      console.log('创建响应状态:', createResponse.status);
      const createData = await createResponse.json();
      console.log('创建响应数据:', JSON.stringify(createData, null, 2));

      if (createResponse.ok) {
        console.log('\n✓ 自动注册成功！');
        console.log('记录 ID:', createData.id);
      } else {
        console.log('\n✗ 自动注册失败');
        if (createData.error) {
          console.log('错误类型:', createData.error.type);
          console.log('错误信息:', createData.error.message);
        }
      }
    }

    console.log('\n3️⃣ 列出所有用户记录');
    console.log('─'.repeat(50));
    
    const listResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    const listData = await listResponse.json();
    console.log(`找到 ${listData.records?.length || 0} 条记录:\n`);
    
    if (listData.records) {
      listData.records.forEach((record, index) => {
        console.log(`记录 ${index + 1}:`);
        console.log('  ID:', record.id);
        console.log('  Email:', record.fields.Email || record.fields.email || '(未设置)');
        console.log('  Status:', record.fields.Status || '(未设置)');
        console.log('  所有字段:', Object.keys(record.fields).join(', '));
        console.log('');
      });
    }

  } catch (error) {
    console.error('\n❌ 发生错误:', error.message);
    console.error('详细信息:', error);
  }
}

testFlow();
