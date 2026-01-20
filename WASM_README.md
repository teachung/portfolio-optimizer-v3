# 投資組合優化器 - 純 WASM 版本 v3.4

## 🔒 算法保護說明

此版本使用 **純 WebAssembly (WASM)** 運行所有核心優化算法，無 TypeScript 回退版本。

### 已保護的算法

| 算法 | 代碼 | 說明 |
|------|------|------|
| 🤖 超級AI優化 (終極多維度) | `super_ai` | Sharpe + Calmar + 平滑度加權 |
| 🤖 超級AI優化 v2.0 (六邊形戰士) | `super_ai_v2` | 自適應頻率 + 閘門淘汰 + 六邊形乘積 |
| 💎 極致穩定 v1 (類定存效果) | `ultra_smooth_v1` | 平滑度² × (1-回撤)² × 勝率 |
| 💎 極致穩定 v2 (雙向波動通道) | `ultra_smooth` | 對數回歸 + 雙向波動控制 |
| 💎 極致穩定 v3 (低位佈局) | `ultra_smooth_v3` | V2基礎 + Z-Score 位置獎懲 |

所有算法已編譯為二進位格式，**無法被逆向工程**。

## 🚀 本地開發

```bash
# 1. 安裝依賴
npm install

# 2. 編譯 WASM 並啟動開發服務器
npm run dev
```

## 📦 部署到 Vercel

### 自動部署（推薦）

1. 將項目推送到 GitHub
2. 在 Vercel 中導入項目
3. Vercel 會自動：
   - 執行 `npm run vercel-build`
   - 編譯 WASM
   - 設置正確的 HTTP 標頭

### 手動部署

```bash
# 1. 編譯 WASM
npm run build:wasm

# 2. 構建生產版本
npm run build

# 3. 部署 dist 文件夾
vercel --prod
```

## ⚠️ 重要注意事項

### WASM 文件位置
- WASM 編譯輸出：`public/algorithms.wasm`
- Vite 構建時自動複製到 `dist/algorithms.wasm`

### Vercel 配置
`vercel.json` 已設置：
- ✅ 正確的 MIME 類型 (`application/wasm`)
- ✅ CORS 標頭 (COOP/COEP)
- ✅ 長期快取

### 常見問題排解

**問題：WASM 載入失敗**
```
❌ WASM loading failed
```
解決方法：
1. 確保運行 `npm run build:wasm` 生成 WASM 文件
2. 檢查 `public/algorithms.wasm` 是否存在
3. 如果是 Vercel 部署，檢查部署日誌

**問題：Vercel 部署後算法不工作**
1. 確保 `vercel.json` 存在
2. 確保 AssemblyScript 依賴已安裝
3. 檢查 Vercel 構建日誌是否有錯誤

## 📁 項目結構

```
├── assembly/
│   └── index.ts          # AssemblyScript 源代碼 (不要公開!)
├── public/
│   └── algorithms.wasm   # 編譯後的 WASM (自動生成)
├── services/
│   └── wasm/
│       ├── wasmLoader.ts      # WASM 加載器
│       ├── algorithmService.ts # 純 WASM 算法服務
│       └── index.ts           # 導出
├── components/
│   └── ParamsSettings.tsx     # UI 設置
├── asconfig.json         # AssemblyScript 配置
├── vercel.json           # Vercel 部署配置
└── vite.config.ts        # Vite 構建配置
```

## 🔧 安全建議

### 生產環境部署

**不要**部署以下內容到生產環境：
- `assembly/` 目錄（AssemblyScript 源代碼）
- 任何 `.wat` 文件（WebAssembly 文本格式）

**只需要**部署：
- `dist/` 文件夾（包含編譯好的 WASM）

### .gitignore 建議

```
# 如果要保護源代碼，在推送到公開 repo 前移除
assembly/
```

## 📊 技術細節

### AssemblyScript
- TypeScript 嚴格子集，編譯為 WASM
- 優化級別：O3（最高）
- 壓縮級別：S2（最小體積）

### 記憶體配置
- 初始記憶體：64 頁 (4MB)
- 最大記憶體：256 頁 (16MB)
- 每次計算自動重置堆

### 瀏覽器支持
- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+
