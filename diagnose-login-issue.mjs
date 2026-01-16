#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env.local
dotenv.config({ path: join(__dirname, '.env.local') });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Users';

console.log('🔍 登录问题诊断工具\n');
console.log('=' .repeat(60));

// 检查环境变量
console.log('\n📋 步骤 1: 检查环境变量');
console.log('-'.repeat(60));
console.log(`✓ AIRTABLE_API_KEY: ${AIRTABLE_API_KEY ? '已设置 (' + AIRTABLE_API_KEY.substring(0, 10) + '...)' : '❌ 未设置'}`);
console.log(`✓ AIRTABLE_BASE_ID: ${AIRTABLE_BASE_ID || '❌ 未设置'}`);
console.log(`✓ AIRTABLE_TABLE_NAME: ${AIRTABLE_TABLE_NAME}`);

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('\n❌ 错误: 缺少必要的环境变量');
  process.exit(1);
}

// 获取所有用户
console.log('\n📋 步骤 2: 获取 Airtable 中的所有用户');
console.log('-'.repeat(60));

try {
  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    console.error(`❌ Airtable API 错误: ${response.status} ${response.statusText}`);
    const errorText = await response.text();
    console.error('错误详情:', errorText);
    process.exit(1);
  }

  const data = await response.json();
  
  console.log(`\n✅ 成功获取数据，共 ${data.records.length} 条记录\n`);
  
  if (data.records.length === 0) {
    console.log('⚠️  警告: Airtable 中没有任何用户记录');
  } else {
    console.log('用户列表:');
    console.log('='.repeat(60));
    
    data.records.forEach((record, index) => {
      const fields = record.fields;
      const email = fields.Email || fields.email || '(无邮箱)';
      const status = fields.Status;
      const statusText = status === true ? '✅ Approved' : status === false ? '⏳ Pending' : `❓ 未知 (${status})`;
      
      console.log(`\n${index + 1}. ${email}`);
      console.log(`   状态: ${statusText}`);
      console.log(`   Record ID: ${record.id}`);
      console.log(`   所有字段: ${JSON.stringify(fields, null, 2)}`);
    });
  }

  // 检查特定用户
  console.log('\n' + '='.repeat(60));
  console.log('📋 步骤 3: 检查特定用户 (teaxtea@gmail.com)');
  console.log('-'.repeat(60));
  
  const testEmail = 'teaxtea@gmail.com';
  const filterFormula = encodeURIComponent(`OR({Email}='${testEmail}',{email}='${testEmail}')`);
  const filterUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${filterFormula}`;
  
  console.log(`\n查询 URL: ${filterUrl}\n`);
  
  const filterResponse = await fetch(filterUrl, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
  });

  const filterData = await filterResponse.json();
  
  if (filterData.records && filterData.records.length > 0) {
    const user = filterData.records[0].fields;
    console.log(`✅ 找到用户: ${testEmail}`);
    console.log(`   状态字段值: ${user.Status}`);
    console.log(`   状态类型: ${typeof user.Status}`);
    console.log(`   是否已批准: ${user.Status === true ? '是' : '否'}`);
    console.log(`   完整字段: ${JSON.stringify(user, null, 2)}`);
  } else {
    console.log(`❌ 未找到用户: ${testEmail}`);
    console.log('   该用户需要先登录一次以触发自动注册');
  }

  // 测试 API 端点
  console.log('\n' + '='.repeat(60));
  console.log('📋 步骤 4: 测试本地 API 端点模拟');
  console.log('-'.repeat(60));
  
  console.log('\n模拟 API 调用结果:');
  if (filterData.records && filterData.records.length > 0) {
    const user = filterData.records[0].fields;
    const isApproved = user.Status === true;
    
    console.log(JSON.stringify({
      approved: isApproved,
      status: isApproved ? 'Approved' : 'Pending'
    }, null, 2));
  } else {
    console.log(JSON.stringify({
      approved: false,
      status: 'Pending',
      message: 'Account created. Awaiting admin approval.'
    }, null, 2));
  }

  // 诊断建议
  console.log('\n' + '='.repeat(60));
  console.log('💡 诊断建议');
  console.log('='.repeat(60));
  
  const userRecord = filterData.records && filterData.records.length > 0 ? filterData.records[0].fields : null;
  
  if (!userRecord) {
    console.log('\n⚠️  用户未在 Airtable 中注册');
    console.log('   解决方案:');
    console.log('   1. 用户需要访问 https://portfolioblender.vercel.app');
    console.log('   2. 使用 Google 账号登录');
    console.log('   3. 系统会自动创建 Pending 状态的记录');
    console.log('   4. 管理员在 Airtable 中勾选 Status 复选框批准用户');
  } else if (userRecord.Status === false) {
    console.log('\n⏳ 用户状态为 Pending (等待批准)');
    console.log('   解决方案:');
    console.log('   1. 前往 Airtable: https://airtable.com/');
    console.log(`   2. 打开 Base: ${AIRTABLE_BASE_ID}`);
    console.log(`   3. 找到用户: ${testEmail}`);
    console.log('   4. 勾选 Status 复选框 (checkbox) 以批准用户');
    console.log('   5. 用户刷新页面即可进入系统');
  } else if (userRecord.Status === true) {
    console.log('\n✅ 用户已批准，应该可以正常登录');
    console.log('   如果仍然卡在审批页面，请检查:');
    console.log('   1. 用户是否访问正确的 URL: https://portfolioblender.vercel.app');
    console.log('   2. 清除浏览器缓存 (Ctrl+Shift+Delete)');
    console.log('   3. 重新登录');
    console.log('   4. 检查浏览器控制台是否有错误信息');
  } else {
    console.log('\n❓ 状态字段值异常');
    console.log(`   当前值: ${userRecord.Status} (类型: ${typeof userRecord.Status})`);
    console.log('   解决方案:');
    console.log('   1. 确认 Airtable 中 Status 字段是 Checkbox 类型');
    console.log('   2. 不应该是 Single line text 或其他类型');
    console.log('   3. 如果字段类型错误，需要重新创建字段');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 诊断完成');
  console.log('='.repeat(60) + '\n');

} catch (error) {
  console.error('\n❌ 发生错误:', error.message);
  console.error('错误详情:', error);
  process.exit(1);
}
