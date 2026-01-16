import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Users';

console.log('=== 修复 Airtable 记录 ===\n');

// 1. 列出所有记录
const listAllRecords = async () => {
  console.log('1️⃣ 列出所有记录');
  console.log('──────────────────────────────────────────────────');
  
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
  });
  
  const data = await response.json();
  
  console.log(`找到 ${data.records.length} 条记录:\n`);
  
  const recordsToFix = [];
  
  data.records.forEach((record, index) => {
    console.log(`记录 ${index + 1}:`);
    console.log(`  ID: ${record.id}`);
    console.log(`  Email: ${record.fields.Email || '(未设置)'}`);
    console.log(`  Status: ${record.fields.Status !== undefined ? record.fields.Status : '(未设置)'}`);
    console.log(`  创建时间: ${record.createdTime}`);
    
    // 如果有 Email 但没有 Status，需要修复
    if (record.fields.Email && record.fields.Status === undefined) {
      recordsToFix.push({
        id: record.id,
        email: record.fields.Email
      });
      console.log(`  ⚠️ 需要修复：缺少 Status 字段`);
    }
    
    console.log('');
  });
  
  return recordsToFix;
};

// 2. 修复记录（添加 Status 字段）
const fixRecords = async (records) => {
  if (records.length === 0) {
    console.log('✓ 没有需要修复的记录\n');
    return;
  }
  
  console.log(`2️⃣ 修复 ${records.length} 条记录`);
  console.log('──────────────────────────────────────────────────');
  
  for (const record of records) {
    console.log(`修复记录: ${record.email} (${record.id})`);
    
    try {
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${record.id}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            Status: false  // false = Pending
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✓ 成功更新 Status 为: ${data.fields.Status}`);
      } else {
        const error = await response.json();
        console.log(`  ✗ 更新失败:`, error);
      }
    } catch (error) {
      console.log(`  ✗ 异常:`, error.message);
    }
    
    console.log('');
  }
};

// 3. 删除空记录
const deleteEmptyRecords = async () => {
  console.log('3️⃣ 查找并删除空记录');
  console.log('──────────────────────────────────────────────────');
  
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    },
  });
  
  const data = await response.json();
  
  const emptyRecords = data.records.filter(record => !record.fields.Email);
  
  if (emptyRecords.length === 0) {
    console.log('✓ 没有空记录\n');
    return;
  }
  
  console.log(`找到 ${emptyRecords.length} 条空记录，准备删除...\n`);
  
  for (const record of emptyRecords) {
    console.log(`删除空记录: ${record.id}`);
    
    try {
      const deleteUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${record.id}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      });
      
      if (response.ok) {
        console.log(`  ✓ 已删除`);
      } else {
        const error = await response.json();
        console.log(`  ✗ 删除失败:`, error);
      }
    } catch (error) {
      console.log(`  ✗ 异常:`, error.message);
    }
    
    console.log('');
  }
};

// 运行修复流程
(async () => {
  try {
    const recordsToFix = await listAllRecords();
    await fixRecords(recordsToFix);
    await deleteEmptyRecords();
    
    console.log('=== 修复完成 ===');
    console.log('请在 Airtable 中检查 Status 复选框字段是否存在');
    console.log('如果不存在，请手动添加一个 Checkbox 类型的字段，命名为 "Status"');
  } catch (error) {
    console.error('修复过程出错:', error);
  }
})();
