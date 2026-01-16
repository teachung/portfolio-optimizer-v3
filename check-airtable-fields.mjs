import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

console.log('=== 检查 Airtable Base 结构 ===\n');

// 使用 Airtable Meta API 获取 base schema
const checkBaseSchema = async () => {
  console.log('1️⃣ 获取 Base Schema');
  console.log('──────────────────────────────────────────────────');
  
  const url = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      console.log('✗ 无法获取 schema，状态码:', response.status);
      const error = await response.text();
      console.log('错误信息:', error);
      return;
    }
    
    const data = await response.json();
    
    console.log(`找到 ${data.tables.length} 个表:\n`);
    
    data.tables.forEach(table => {
      console.log(`表名: ${table.name} (ID: ${table.id})`);
      console.log(`字段数量: ${table.fields.length}`);
      console.log('字段列表:');
      
      table.fields.forEach(field => {
        console.log(`  - ${field.name} (${field.type})`);
        if (field.options) {
          console.log(`    选项:`, JSON.stringify(field.options, null, 2));
        }
      });
      
      console.log('');
    });
  } catch (error) {
    console.log('✗ 请求失败:', error.message);
  }
};

// 运行检查
(async () => {
  await checkBaseSchema();
  
  console.log('\n=== 诊断结果 ===');
  console.log('如果上面没有显示 "Status" 字段，说明需要在 Airtable 中手动添加。');
  console.log('\n添加步骤：');
  console.log('1. 打开 Airtable: https://airtable.com/app7BB9VmwXmVov5c');
  console.log('2. 找到 "Users" 表');
  console.log('3. 点击最右边的 "+" 添加新字段');
  console.log('4. 选择字段类型: Checkbox');
  console.log('5. 字段名称: Status');
  console.log('6. 保存');
  console.log('\n完成后，重新运行 fix-airtable-records.mjs 来更新现有记录。');
})();
