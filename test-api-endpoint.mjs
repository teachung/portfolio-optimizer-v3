import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const testEmail = 'teaxtea@gmail.com';

console.log('=== 测试 API 端点（模拟真实登录） ===\n');

// 测试本地 API（如果在开发环境）
const testLocalAPI = async () => {
  console.log('1️⃣ 测试本地 API (http://localhost:5173/api/check-user-status)');
  console.log('──────────────────────────────────────────────────');
  
  try {
    const url = `http://localhost:5173/api/check-user-status?email=${encodeURIComponent(testEmail)}&t=${Date.now()}`;
    console.log('请求 URL:', url);
    
    const response = await fetch(url);
    console.log('响应状态:', response.status);
    
    const data = await response.json();
    console.log('响应数据:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✓ API 调用成功');
      console.log(`  - 批准状态: ${data.approved}`);
      console.log(`  - 用户状态: ${data.status}`);
      if (data.message) {
        console.log(`  - 消息: ${data.message}`);
      }
    } else {
      console.log('✗ API 调用失败');
    }
  } catch (error) {
    console.log('✗ 无法连接到本地服务器');
    console.log('  错误:', error.message);
    console.log('  提示: 请确保运行 npm run dev');
  }
  
  console.log('\n');
};

// 测试 Vercel 生产环境 API
const testProductionAPI = async () => {
  console.log('2️⃣ 测试 Vercel 生产环境 API');
  console.log('──────────────────────────────────────────────────');
  
  // 从 package.json 或环境变量获取生产 URL
  const productionUrl = process.env.VITE_PRODUCTION_URL || 'https://portfolioblender.vercel.app';
  
  try {
    const url = `${productionUrl}/api/check-user-status?email=${encodeURIComponent(testEmail)}&t=${Date.now()}`;
    console.log('请求 URL:', url);
    
    const response = await fetch(url);
    console.log('响应状态:', response.status);
    
    const data = await response.json();
    console.log('响应数据:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✓ API 调用成功');
      console.log(`  - 批准状态: ${data.approved}`);
      console.log(`  - 用户状态: ${data.status}`);
      if (data.message) {
        console.log(`  - 消息: ${data.message}`);
      }
    } else {
      console.log('✗ API 调用失败');
    }
  } catch (error) {
    console.log('✗ 无法连接到生产服务器');
    console.log('  错误:', error.message);
  }
  
  console.log('\n');
};

// 直接测试 Airtable 查询
const testAirtableQuery = async () => {
  console.log('3️⃣ 直接测试 Airtable 查询');
  console.log('──────────────────────────────────────────────────');
  
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Users';
  
  const filterFormula = encodeURIComponent(`OR({Email}='${testEmail}',{email}='${testEmail}')`);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${filterFormula}`;
  
  console.log('查询 URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    console.log('响应状态:', response.status);
    const data = await response.json();
    console.log('响应数据:', JSON.stringify(data, null, 2));
    
    if (data.records && data.records.length > 0) {
      console.log(`✓ 找到用户: ${testEmail}`);
      const user = data.records[0].fields;
      console.log('  - Status 字段:', user.Status);
      console.log('  - Status 类型:', typeof user.Status);
    } else {
      console.log(`✗ 未找到用户: ${testEmail}`);
      console.log('  - 将触发自动注册');
    }
  } catch (error) {
    console.log('✗ Airtable 查询失败');
    console.log('  错误:', error.message);
  }
};

// 运行所有测试
(async () => {
  await testLocalAPI();
  await testProductionAPI();
  await testAirtableQuery();
})();
