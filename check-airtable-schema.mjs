// 检查 Airtable 表结构
// 使用方法: node check-airtable-schema.mjs

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
  console.log('注意: 无法读取 .env.local');
}

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Users';

async function checkSchema() {
  console.log('=== 检查 Airtable 表结构 ===\n');
  
  try {
    // 获取表的元数据（需要使用 Meta API）
    const metaUrl = `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`;
    
    const metaResponse = await fetch(metaUrl, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      const table = metaData.tables.find(t => t.name === AIRTABLE_TABLE_NAME);
      
      if (table) {
        console.log(`表名: ${table.name}`);
        console.log(`表 ID: ${table.id}\n`);
        console.log('字段列表:');
        
        table.fields.forEach(field => {
          console.log(`\n- ${field.name}`);
          console.log(`  类型: ${field.type}`);
          
          if (field.type === 'singleSelect' && field.options?.choices) {
            console.log(`  允许的选项:`);
            field.options.choices.forEach(choice => {
              console.log(`    - "${choice.name}"`);
            });
          }
        });
      } else {
        console.log(`未找到表: ${AIRTABLE_TABLE_NAME}`);
      }
    } else {
      console.log('无法获取表元数据（可能需要更高权限）');
      console.log('尝试读取现有记录来推断结构...\n');
      
      // 备用方案：读取一条记录
      const recordsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?maxRecords=1`;
      const recordsResponse = await fetch(recordsUrl, {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      });
      
      const recordsData = await recordsResponse.json();
      
      if (recordsData.records && recordsData.records.length > 0) {
        const sample = recordsData.records[0].fields;
        console.log('示例记录字段:');
        Object.keys(sample).forEach(key => {
          console.log(`- ${key}: ${JSON.stringify(sample[key])}`);
        });
      } else {
        console.log('表中没有记录，无法推断结构');
      }
    }
  } catch (error) {
    console.error('错误:', error.message);
  }
}

checkSchema();
