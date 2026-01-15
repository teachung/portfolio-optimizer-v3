// 测试 Airtable 写入权限
// 使用方法: node test-airtable-write.mjs

import { readFileSync } from 'fs';

// 手动加载 .env.local
try {
  const envConfig = readFileSync('.env.local', 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
} catch (e) {
  console.log('注意: 无法读取 .env.local，将使用系统环境变量');
}

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Users';

async function testAirtableWrite() {
  console.log('=== Airtable 写入权限测试 ===\n');
  
  console.log('配置检查:');
  console.log(`- API Key: ${AIRTABLE_API_KEY ? '✓ 已设置 (' + AIRTABLE_API_KEY.substring(0, 10) + '...)' : '✗ 未设置'}`);
  console.log(`- Base ID: ${AIRTABLE_BASE_ID || '✗ 未设置'}`);
  console.log(`- Table Name: ${AIRTABLE_TABLE_NAME}\n`);

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('错误: 缺少必要的环境变量');
    console.log('\n请确保 .env.local 文件包含:');
    console.log('AIRTABLE_API_KEY=your_key_here');
    console.log('AIRTABLE_BASE_ID=your_base_id_here');
    return;
  }

  const testEmail = `test-${Date.now()}@example.com`;
  
  try {
    console.log(`尝试创建测试用户: ${testEmail}`);
    
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Email: testEmail,
            Status: 'Pending',
          },
        }),
      }
    );

    const data = await response.json();
    
    console.log(`\n响应状态: ${response.status}`);
    console.log('响应数据:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✓ 成功! Airtable 写入权限正常');
      console.log(`创建的记录 ID: ${data.id}`);
      
      // 尝试删除测试记录
      console.log('\n尝试删除测试记录...');
      const deleteResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${data.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          },
        }
      );
      
      if (deleteResponse.ok) {
        console.log('✓ 测试记录已清理');
      }
    } else {
      console.log('\n✗ 失败! 可能的原因:');
      if (data.error?.type === 'INVALID_PERMISSIONS') {
        console.log('- API Key 没有写入权限');
        console.log('- 请在 Airtable 中检查 API Key 的权限设置');
        console.log('- 确保 API Key 有 "data.records:write" 权限');
      } else if (data.error?.type === 'INVALID_REQUEST_BODY') {
        console.log('- 字段名称不匹配');
        console.log('- 请检查 Airtable 表中是否有 "Email" 和 "Status" 字段');
      } else if (data.error?.type === 'TABLE_NOT_FOUND') {
        console.log('- 表名称错误或不存在');
        console.log(`- 当前使用的表名: ${AIRTABLE_TABLE_NAME}`);
      } else {
        console.log('- 未知错误，请查看上面的响应数据');
      }
    }
  } catch (error) {
    console.error('\n✗ 网络错误:', error.message);
  }
}

testAirtableWrite();
