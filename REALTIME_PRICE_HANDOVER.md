# 即时股价功能交接文档 (Real-Time Price Feature Handover)

## 📋 问题概述

**当前状态：** 即时股价功能已实现，但可能存在稳定性问题
**位置：** `src/components/ResultsDisplay.tsx` - `RealTimePriceChecker` 组件
**用户报告：** 登录后卡在审批状态（已解决），但需要继续优化即时股价功能

---

## 🎯 功能说明

### 1. 功能目的
- 显示投资组合中前 20 只股票的实时价格
- 计算每只股票的涨跌幅和变化百分比
- 根据用户输入的总投资金额，自动计算每只股票应购买的数量
- 生成 TradingView 公式，方便用户在 TradingView 查看组合走势

### 2. 技术实现
**文件位置：** `src/components/ResultsDisplay.tsx` (第 200-350 行左右)

**核心逻辑：**
```typescript
const RealTimePriceChecker: React.FC<{ weights: Record<string, number> }> = ({ weights }) => {
    // 限制为前 20 只股票，避免 API 请求过多
    const activeTickers = useMemo(() => 
        Object.keys(weights)
            .filter(t => weights[t] > 0.001)
            .sort((a,b) => weights[b] - weights[a])
            .slice(0, 20)
    , [weights]);
    
    // ... 状态管理
    
    const fetchAllPrices = async () => {
        // 使用多代理回退系统
        const proxies = [
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
            `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
        ];
        
        // 依次尝试每个代理，直到成功
        for (const proxy of proxies) {
            try {
                const res = await fetch(proxy);
                if (res.ok) {
                    // 处理响应...
                    break;
                }
            } catch (e) {
                continue; // 失败则尝试下一个代理
            }
        }
    };
};
```

---

## 🔧 当前实现细节

### 1. 多代理回退系统
为了绕过 CORS 和 Yahoo Finance 的限制，系统使用三个代理服务：

| 代理服务 | URL | 特点 |
|---------|-----|------|
| **CodeTabs** | `https://api.codetabs.com/v1/proxy` | 第一选择，速度快 |
| **AllOrigins** | `https://api.allorigins.win/get` | 备用，返回格式特殊 |
| **CorsProxy** | `https://corsproxy.io/` | 最后备选 |

**重要：** AllOrigins 返回的数据格式不同，需要特殊处理：
```typescript
// allorigins 返回 content 作为字符串，需要解析
if (json && typeof json.contents === 'string') {
    try {
        parsedData = JSON.parse(json.contents);
    } catch (parseErr) {
        console.warn("Failed to parse allorigins contents", parseErr);
    }
}
```

### 2. 数据源
- **Yahoo Finance API:** `https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?interval=1m&range=1d`
- **数据字段：**
  - `regularMarketPrice`: 当前价格
  - `chartPreviousClose`: 前一日收盘价
  - `regularMarketTime`: 价格更新时间
  - `currency`: 货币单位

### 3. 限制和优化
- **股票数量限制：** 只显示前 20 只持仓股票（按权重排序）
- **原因：** 避免过多 API 请求导致浏览器阻塞或代理服务限流
- **批量请求：** 使用 `Promise.all()` 并发请求所有股票数据

---

## ⚠️ 已知问题和挑战

### 1. 代理服务不稳定
**问题：** 免费代理服务可能随时失效或被限流
**影响：** 部分或全部股票价格无法获取
**当前处理：** 显示"数据获取失败"，不影响其他功能

### 2. Yahoo Finance 限制
**问题：** Yahoo Finance 可能阻止频繁请求
**影响：** 短时间内多次刷新可能导致所有请求失败
**建议：** 添加请求频率限制（如 30 秒内只能刷新一次）

### 3. 股票代码格式问题
**问题：** 不同市场的股票代码格式不同
**当前处理：** 
```typescript
const symbol = ticker.toUpperCase().replace(/\./g, '-');
```
**已知问题：** 
- 港股代码（如 `0700.HK`）需要转换为 Yahoo 格式
- 部分 ETF 或特殊代码可能无法识别

### 4. 货币单位不统一
**问题：** 不同市场返回不同货币（USD, HKD, CNY 等）
**当前处理：** 显示货币单位，但不进行汇率转换
**建议：** 添加汇率转换功能或统一为 USD

---

## 🛠️ 调试指南

### 1. 检查网络请求
打开浏览器开发者工具 (F12) -> Network 标签：
- 查找以 `codetabs.com`、`allorigins.win` 或 `corsproxy.io` 开头的请求
- 检查请求状态码（200 = 成功，429 = 限流，403 = 被阻止）
- 查看响应内容，确认数据格式是否正确

### 2. 控制台日志
代码中已添加错误日志：
```typescript
console.error(`Error fetching ${ticker}`, e);
```
在浏览器控制台 (F12 -> Console) 查看具体错误信息。

### 3. 测试单个股票
在浏览器控制台直接测试：
```javascript
// 测试 CodeTabs 代理
fetch('https://api.codetabs.com/v1/proxy?quest=https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1m&range=1d')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e));

// 测试 AllOrigins 代理
fetch('https://api.allorigins.win/get?url=https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1m&range=1d')
  .then(r => r.json())
  .then(d => console.log(JSON.parse(d.contents)))
  .catch(e => console.error(e));
```

### 4. 常见错误代码
| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `CORS error` | 代理失效 | 尝试其他代理或更换代理服务 |
| `429 Too Many Requests` | 请求过于频繁 | 添加请求间隔限制 |
| `404 Not Found` | 股票代码错误 | 检查代码格式转换逻辑 |
| `Network Error` | 网络连接问题 | 检查用户网络或代理服务状态 |

---

## 💡 改进建议

### 1. 短期改进（1-2 天）
- [ ] **添加请求频率限制**
  ```typescript
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  const fetchAllPrices = async () => {
      const now = Date.now();
      if (now - lastFetchTime < 30000) { // 30 秒限制
          alert('請等待 30 秒後再刷新');
          return;
      }
      setLastFetchTime(now);
      // ... 原有逻辑
  };
  ```

- [ ] **改进错误提示**
  - 显示具体失败原因（网络错误、代理失效、股票代码错误等）
  - 添加重试按钮，只重试失败的股票

- [ ] **添加加载状态**
  - 显示正在加载的股票数量（如 "加载中... 5/20"）
  - 使用进度条显示整体进度

### 2. 中期改进（3-7 天）
- [ ] **使用付费 API 服务**
  - 考虑使用 [Finnhub](https://finnhub.io/)、[Alpha Vantage](https://www.alphavantage.co/) 等稳定的付费 API
  - 优点：更稳定、更快、支持更多市场
  - 缺点：需要 API Key 和费用

- [ ] **实现后端代理**
  - 在 Vercel Functions 中创建代理端点
  - 优点：绕过浏览器 CORS 限制，更好的错误处理
  - 示例：
    ```typescript
    // api/fetch-stock-price.ts
    export default async function handler(req, res) {
        const { symbol } = req.query;
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`);
        const data = await response.json();
        res.json(data);
    }
    ```

- [ ] **添加缓存机制**
  - 使用 localStorage 缓存价格数据（5-10 分钟有效期）
  - 减少不必要的 API 请求

### 3. 长期改进（1-2 周）
- [ ] **WebSocket 实时推送**
  - 使用 WebSocket 连接获取真正的实时数据
  - 无需手动刷新，价格自动更新

- [ ] **多市场支持**
  - 自动识别股票所属市场（美股、港股、A股等）
  - 使用对应市场的 API 和代码格式

- [ ] **汇率转换**
  - 集成汇率 API（如 [ExchangeRate-API](https://www.exchangerate-api.com/)）
  - 统一显示为用户选择的货币

---

## 📁 相关文件

### 核心文件
- **`src/components/ResultsDisplay.tsx`** (第 200-350 行)
  - `RealTimePriceChecker` 组件
  - 价格获取逻辑
  - UI 渲染

### 类型定义
- **`src/types.ts`**
  ```typescript
  interface PriceInfo {
      price: number;
      change: number;
      changePercent: number;
      time: string;
      currency: string;
      error?: boolean;
  }
  ```

### 环境配置
- **`.env.local`** (如果使用付费 API)
  ```
  VITE_FINNHUB_API_KEY=your_api_key_here
  VITE_ALPHA_VANTAGE_KEY=your_api_key_here
  ```

---

## 🔗 有用的资源

### API 文档
- [Yahoo Finance API (非官方)](https://github.com/ranaroussi/yfinance)
- [Finnhub API](https://finnhub.io/docs/api)
- [Alpha Vantage API](https://www.alphavantage.co/documentation/)

### 代理服务
- [CodeTabs Proxy](https://codetabs.com/)
- [AllOrigins](https://allorigins.win/)
- [CORS Anywhere](https://github.com/Rob--W/cors-anywhere)

### 相关技术
- [Chart.js 文档](https://www.chartjs.org/docs/latest/)
- [React useMemo Hook](https://react.dev/reference/react/useMemo)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---

## 🚀 快速开始测试

### 1. 本地测试
```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
# 登录后运行优化，查看即时股价功能
```

### 2. 测试步骤
1. 登录系统（使用已批准的账号）
2. 上传股票数据并运行优化
3. 在结果页面找到"组合成分股 即时报价与下单计算"部分
4. 点击"刷新报价"按钮
5. 观察：
   - 是否所有股票都成功获取价格？
   - 是否有错误提示？
   - 加载时间是否合理（< 5 秒）？

### 3. 压力测试
- 连续点击"刷新报价" 5 次，观察是否被限流
- 测试不同市场的股票（美股、港股、ETF）
- 测试网络较慢的情况

---

## 📞 联系和支持

如果遇到问题，请检查：
1. **浏览器控制台** (F12 -> Console) 的错误日志
2. **网络请求** (F12 -> Network) 的状态码
3. **HANDOVER_NOTES.md** 中的其他相关信息

**重要提示：** 
- 即时股价功能是独立模块，不影响核心优化功能
- 如果代理服务完全失效，可以暂时隐藏此功能
- 建议优先考虑使用后端代理或付费 API 以提高稳定性

---

*文档创建时间：2026-01-15*  
*最后更新：2026-01-15*  
*创建者：Cline (AI Assistant)*
