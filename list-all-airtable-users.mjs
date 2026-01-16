#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Users';

console.log('=== Airtable 配置信息 ===');
console.log(`Base ID: ${AIRTABLE_BASE_ID}`);
console.log(`Table Name: ${AIRTABLE_TABLE_NAME}`);
console.log(`API Key: ${AIRTABLE_API_KEY ? AIRTABLE_API_KEY.substring(0, 10) + '...' : '未设置'}`);

console.log('\n=== 列出所有用户记录 ===\n');

const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

try {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`✗ API 请求失败 (${response.status}):`, errorText);
    process.exit(1);
  }

  const data = await response.json();
  
  console.log(`找到 ${data.records.length} 条记录:\n`);
  
  data.records.forEach((record, index) => {
    console.log(`记录 ${index + 1}:`);
    console.log(`  - ID: ${record.id}`);
    console.log(`  - Email: ${record.fields.Email || '(空)'}`);
    console.log(`  - Status: ${record.fields.Status}`);
    console.log(`  - Status 类型: ${typeof record.fields.Status}`);
    console.log(`  - 所有字段:`, JSON.stringify(record.fields, null, 2));
    console.log('');
  });

  if (data.records.length === 0) {
    console.log('⚠ 表中没有任何记录！');
    console.log('\n可能的原因:');
    console.log('1. Base ID 或 Table Name 配置错误');
    console.log('2. 表确实是空的');
    console.log('\n请检查:');
    console.log('- Airtable Base URL 应该包含正确的 Base ID');
    console.log('- 表名称是否正确（区分大小写）');
  }
} catch (error) {
  console.error('✗ 请求失败:', error.message);
  console.error('\n请检查:');
  console.error('1. .env.local 文件中的 AIRTABLE_API_KEY 是否正确');
  console.error('2. AIRTABLE_BASE_ID 是否正确');
  console.error('3. AIRTABLE_TABLE_NAME 是否正确');
}
