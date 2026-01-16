# 🚨 快速修复指南 - 登录卡住问题

## 问题
登录后一直显示"等待审批"，Airtable 没有正确更新。

## 原因
**Airtable Users 表缺少 `Status` 字段**

## 立即修复（3 步骤）

### ✅ 步骤 1：添加 Status 字段到 Airtable

1. 打开：https://airtable.com/app7BB9VmwXmVov5c
2. 进入 **Users** 表
3. 点击右边的 **"+"** 添加字段
4. 选择 **Checkbox** 类型
5. 命名为 **`Status`**
6. 保存

### ✅ 步骤 2：更新现有记录

在终端运行：
```bash
node fix-airtable-records.mjs
```

这会：
- 为 test@example.com 和 teaxtea@gmail.com 设置 Status = false (Pending)
- 清理空记录

### ✅ 步骤 3：批准用户

在 Airtable 中：
1. 找到 **teaxtea@gmail.com** 的记录
2. **勾选 Status 复选框** ✓
3. 完成！用户刷新页面即可进入系统

## 验证修复

运行测试：
```bash
node test-api-endpoint.mjs
```

应该看到：
```
✓ 找到用户: teaxtea@gmail.com
  - Status 字段: false  (不再是 undefined)
  - Status 类型: boolean
```

## 字段说明

| Status 复选框 | 含义 | 用户状态 |
|--------------|------|---------|
| ☐ 未勾选 | false | Pending（等待审批）|
| ☑️ 勾选 | true | Approved（已批准）|

## 完成后

用户 teaxtea@gmail.com 可以：
1. 刷新网页
2. 看到系统主界面
3. 开始使用投资组合优化器

---
**重要**：以后所有新用户登录时，系统会自动创建记录并设置 Status = false。
管理员只需在 Airtable 中勾选 Status 复选框即可批准用户。
