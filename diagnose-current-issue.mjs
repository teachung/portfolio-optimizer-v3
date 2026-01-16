#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Users';

console.log('=== 当前登录问题诊断 ===\n');

// 1. 检查 teaxtea@gmail.com 的当前状态
console.log('1. 检查 teaxtea@gmail.com 在 Airtable 中的状态...');
const email = 'teaxtea@gmail.com';
const filterFormula = `{Email} = '${email}'`;
const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?filterByFormula=${encodeURIComponent(filterFormula)}`;

try {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  
  if (data.records && data.records.length > 0) {
    const user = data.records[0];
    console.log('✓ 找到用户记录:');
    console.log(`  - Record ID: ${user.id}`);
    console.log(`  - Email: ${user.fields.Email}`);
    console.log(`  - Status 字段值: ${user.fields.Status}`);
    console.log(`  - Status 类型: ${typeof user.fields.Status}`);
    console.log(`  - Status === true: ${user.fields.Status === true}`);
    console.log(`  - Status === false: ${user.fields.Status === false}`);
    console.log(`  - 所有字段:`, JSON.stringify(user.fields, null, 2));
    
    if (user.fields.Status === true) {
      console.log('\n✓ 用户已批准！Status = true');
    } else if (user.fields.Status === false) {
      console.log('\n⚠ 用户状态为 Pending！Status = false');
      console.log('  → 需要在 Airtable 中勾选 Status 复选框');
    } else {
      console.log('\n✗ Status 字段值异常！');
      console.log('  → Status 应该是 true 或 false，但当前是:', user.fields.Status);
    }
  } else {
    console.log('✗ 未找到用户记录');
  }
} catch (error) {
  console.error('✗ Airtable 查询失败:', error.message);
}

// 2. 测试 Vercel API
console.log('\n2. 测试 Vercel API 响应...');
const apiUrl = `https://portfolioblender.vercel.app/api/check-user-status?email=${encodeURIComponent(email)}&t=${Date.now()}`;

try {
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  console.log('API 响应:');
  console.log(`  - approved: ${data.approved}`);
  console.log(`  - status: ${data.status}`);
  console.log(`  - message: ${data.message}`);
  console.log('  - 完整响应:', JSON.stringify(data, null, 2));
  
  if (data.approved === true) {
    console.log('\n✓ API 返回用户已批准');
  } else {
    console.log('\n⚠ API 返回用户未批准');
  }
} catch (error) {
  console.error('✗ API 调用失败:', error.message);
}

// 3. 检查前端应该访问的 URL
console.log('\n3. 测试网址信息:');
console.log('  - 生产环境: https://portfolioblender.vercel.app');
console.log('  - 本地开发: http://localhost:5173');
console.log('\n  请确认你在正确的网址上测试！');

// 4. 提供解决步骤
console.log('\n=== 解决步骤 ===');
console.log('1. 确认在 Airtable 中 Status 字段已勾选（复选框打勾）');
console.log('2. 访问: https://portfolioblender.vercel.app');
console.log('3. 清除浏览器缓存（Ctrl+Shift+Delete）');
console.log('4. 重新登录 teaxtea@gmail.com');
console.log('5. 如果仍然卡住，检查浏览器控制台（F12）的错误信息');
