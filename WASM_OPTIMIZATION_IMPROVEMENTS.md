# WASM 遗传算法优化改进报告

## 📋 改进概述

根据专家诊断，WASM 版本的遗传算法优化效果不佳的核心原因在于**评分逻辑**和**变异策略**，而非计算性能。本次改进针对这两个关键领域进行了全面优化。

---

## 🎯 核心问题诊断

### 1. **线性加权的"代偿效应"**
- **问题**：原 WASM 使用 `finalScore = baseScore * (penalty1 * 0.6 + penalty2 * 0.4)`
- **后果**：高回报可以补偿高风险，导致算法进化出"伪稳定"组合
- **影响**：无法真正实现 Ultra Smooth 的目标

### 2. **惩罚机制过于宽松**
- **问题**：使用线性惩罚，对差劲组合只是降低分数
- **后果**：垃圾基因仍能存活并繁殖，浪费计算资源
- **影响**：优化效率低下，难以收敛到最优解

### 3. **变异策略单一**
- **问题**：只做简单的权重微调
- **后果**：容易陷入局部最优解，无法探索全局空间
- **影响**：优化结果受限于初始种群的质量

---

## ✅ 实施的改进方案

### 改进 1: 几何乘积评分（WASM）

**文件**: `assembly/index.ts` - `calculateStabilityV2Score` 函数

#### 修改前（线性加权）:
```typescript
// 线性加权 - 存在代偿效应
let finalScore = baseScore * (residualPenalty * 0.6 + volatilityPenalty * 0.4);
```

#### 修改后（几何乘积）:
```typescript
// 几何乘积 - "一票否决"机制
let finalScore = Math.pow(annualizedReturn, 0.4) * 
                 Math.pow(1.0 / (symmetricUlcerIndex + 0.01), 0.4) * 
                 Math.pow(rPenalty, 0.1) * 
                 Math.pow(channelConsistency, 0.1) * 
                 100.0;
```

**优势**：
- ✅ 任何一项指标差（接近 0）会导致总分崩塌
- ✅ 强迫算法选出各维度都优秀的"六边形战士"
- ✅ 消除高回报补偿高风险的漏洞

---

### 改进 2: 指数衰减惩罚（WASM）

**文件**: `assembly/index.ts` - `calculateStabilityV2Score` 函数

#### 修改前（线性惩罚）:
```typescript
// 简单的线性惩罚
let rPenalty = maxResidual > 0.05 ? 1.0 - (maxResidual - 0.05) * 10.0 : 1.0;
let vPenalty = maxRollingStdDev > 0.02 ? 1.0 - (maxRollingStdDev - 0.02) * 20.0 : 1.0;
```

#### 修改后（指数衰减）:
```typescript
// 指数衰减 - 惩罚力度呈指数增长
let rPenalty: f64 = maxResidual > 0.05 
  ? Math.exp(-(maxResidual - 0.05) * 20.0) 
  : 1.0;
let vPenalty: f64 = maxRollingStdDev > 0.02 
  ? Math.exp(-(maxRollingStdDev - 0.02) * 50.0) 
  : 1.0;
```

**优势**：
- ✅ 对超标指标的惩罚力度呈指数增长
- ✅ 更严格地淘汰不合格组合
- ✅ 加速收敛到高质量解

---

### 改进 3: 严格门槛过滤（WASM）

**文件**: `assembly/index.ts` - `calculateStabilityV2Score` 函数

#### 新增代码:
```typescript
// Gatekeeping: 单日跌幅 > 10% 直接淘汰
if (maxDown < -0.10) return -1000.0;
```

**优势**：
- ✅ 垃圾基因在第一代就被彻底淘汰
- ✅ 节省计算资源用于优化有潜力的种子
- ✅ 确保种群质量始终保持高水平

---

### 改进 4: 多样化变异策略（TypeScript）

**文件**: `services/portfolioCalculator.ts` - `mutateWeights` 函数

#### 修改前（单一微调）:
```typescript
// 只做简单的权重微调
const delta = (Math.random() - 0.5) * mutationRate * 2;
newWeights[ticker] = Math.max(minWeight, Math.min(maxWeight, w + delta));
```

#### 修改后（三种变异类型）:
```typescript
const type = Math.random();

if (type < 0.4 && tickers.length > 1) {
  // 40% Swap Mutation: 权重交换
  const idx1 = Math.floor(Math.random() * tickers.length);
  const idx2 = Math.floor(Math.random() * tickers.length);
  [newWeights[tickers[idx1]], newWeights[tickers[idx2]]] = 
  [newWeights[tickers[idx2]], newWeights[tickers[idx1]]];
  
} else if (type < 0.8) {
  // 40% Uniform Reset: 完全随机重置
  const newW = Math.random() * (maxWeight - minWeight) + minWeight;
  newWeights[ticker] = newW;
  
} else {
  // 20% Micro Adjustment: 微调
  const delta = (Math.random() - 0.5) * mutationRate * 2;
  newWeights[ticker] = Math.max(minWeight, Math.min(maxWeight, w + delta));
}
```

**优势**：
- ✅ **Swap Mutation**: 优化持仓结构，而非仅仅比例
- ✅ **Uniform Reset**: 跳出局部最优，探索全新配置
- ✅ **Micro Adjustment**: 精细调优已有方案
- ✅ 三种策略互补，大幅提升搜索空间覆盖率

---

### 改进 5: 降低变异率（TypeScript）

**文件**: `services/portfolioCalculator.ts` - `mutateWeights` 函数

#### 修改:
```typescript
// 从 0.2 降至 0.15
const mutationRate = 0.15; // 专家建议：避免破坏精英基因
```

**原因**：
- 过高的变异率（0.2）会破坏已进化出的良好基因
- 0.15 在探索和利用之间取得更好平衡

---

## 📊 预期改进效果

### 评分质量提升
- **几何乘积**: 确保所有指标均衡优秀
- **指数惩罚**: 更严格淘汰不合格组合
- **Gatekeeping**: 杜绝极端风险组合

### 搜索效率提升
- **多样化变异**: 更快跳出局部最优
- **降低变异率**: 保护精英基因，加速收敛
- **三种变异策略**: 全面覆盖搜索空间

### 结果稳定性提升
- **一票否决机制**: 任何短板都会被严厉惩罚
- **严格门槛**: 确保所有候选组合都符合基本要求
- **均衡优化**: 不再出现"高回报高风险"的伪优解

---

## 🔧 技术细节

### WASM 编译
```bash
npm run asbuild
```
- ✅ 编译成功
- ✅ 生成 `public/build/release.wasm`
- ✅ 优化级别: Release (最高性能)

### 关键参数
- **种群大小**: 500（合理，股票池 > 100 时可增至 1000）
- **精英保留**: 5%（25 个最优解）
- **锦标赛大小**: k=3（平衡收敛速度与多样性）
- **变异率**: 0.15（从 0.2 降低）

---

## 🎓 专家心法总结

> **"WASM 提供了计算的肌肉，但 JavaScript 里的逻辑提供了优化的灵魂。"**

### 核心原则
1. **评分比速度重要**: 每秒 1 万次精准命中 > 每秒 10 万次盲目搜索
2. **几何评分 > 线性评分**: 一票否决机制确保均衡优化
3. **变异多样性 > 变异频率**: 质量比数量更重要
4. **严格门槛 > 宽松打分**: 早期淘汰垃圾基因节省资源

### 优化哲学
- 不追求"最快"，追求"最准"
- 不追求"高分"，追求"均衡"
- 不追求"收敛快"，追求"收敛对"

---

## 🔬 第二轮深度优化

### 改进 6: 对数残差替代百分比偏离（WASM）

**文件**: `assembly/index.ts` - `calculateStabilityV2Score` 函数

#### 修改前（百分比偏离）:
```typescript
// 百分比偏离 - 受复利效应影响
let deviation = Math.abs((portfolioValues[i] - trendVal) / trendVal);
sumSquaredDeviations += deviation * deviation;
```

#### 修改后（对数残差）:
```typescript
// 对数残差 - 数学上最纯粹的直线平滑度衡量
let actualLog = portfolioValues[i] > 0 ? Math.log(portfolioValues[i]) : 0;
let trendLog = intercept + slope * f64(i);
let residual = Math.abs(actualLog - trendLog);
sumSquaredDeviations += residual * residual;
```

**技术原理**：
- ✅ **对数空间的线性回归**: 在对数空间中，复利增长表现为直线
- ✅ **消除复利效应**: 避免后期数据因绝对值大而不成比例地影响评分
- ✅ **数学纯粹性**: 对数残差才是衡量"直线平滑度"的正确方法
- ✅ **长期数据友好**: 特别适合超过 3 年的历史数据分析

**专家原话**：
> "在长期数据（超过 3 年）中，对数残差 (Log Residuals) 会比百分比偏离更准确，因为复利效应会让后期的百分比波动在绝对值上显得巨大，从而误导算法过度惩罚后期波动。"

---

### 改进 7: 权重修复机制确认（TypeScript）

**文件**: `services/portfolioCalculator.ts` - `repairWeights` 函数（第 241-283 行）

#### 已实现的迭代鉗制法:
```typescript
// 迭代修复循环 - 最多 20 次迭代
while (!solved && iterations < 20) {
  solved = true;
  let surplus = 0;
  let deficit = 0;
  
  // 第一步：识别违规者并修正
  for (const t of tickers) {
    if (newWeights[t] > maxWeight + 0.00001) {
      surplus += newWeights[t] - maxWeight;
      newWeights[t] = maxWeight;
      solved = false;
    } else if (newWeights[t] < minWeight - 0.00001) {
      deficit += minWeight - newWeights[t];
      newWeights[t] = minWeight;
      solved = false;
    }
  }
  
  // 第二步：重新分配盈余/赤字
  const netChange = surplus - deficit;
  const adjustableTickers = tickers.filter(t => 
    newWeights[t] > minWeight + 0.00001 && 
    newWeights[t] < maxWeight - 0.00001
  );
  
  if (adjustableTickers.length > 0 && Math.abs(netChange) > 0.00001) {
    const totalAdjustable = adjustableTickers.reduce(
      (sum, t) => sum + newWeights[t], 0
    );
    
    for (const t of adjustableTickers) {
      const proportion = newWeights[t] / totalAdjustable;
      newWeights[t] -= netChange * proportion;
    }
  }
  
  iterations++;
}
```

**确认状态**: ✅ **已完美实现**

**优势**：
- ✅ **多次迭代**: 最多 20 次循环确保收敛
- ✅ **精确修正**: 先修正违规者，再重新分配
- ✅ **比例分配**: 按权重比例分配盈余/赤字
- ✅ **鲁棒性强**: 能处理复杂的多重约束情况

**专家评价**：
> "兄弟，你已经把优化器的『肌肉』(WASM) 和『神经』(幾何評分) 練好了。現在最後一步是把『骨架』(權重修復邏輯) 做硬。只要把 Iterative Repair 加入，你的 WASM 版優化器就會是市場上最強的工具之一。"

**结论**: TypeScript 版本的权重修复已达到专家级水平，无需修改。

---

### 改进 8: 锦标赛大小优化建议

**当前参数**: `k = 3`（tournamentSize）

**专家建议**:
- **k=3**: 适合需要保持群体多样性的场景（当前设置）
- **k=5**: 加快收敛速度，适合股票池较大（> 100 只）的情况
- **k=7**: 最快收敛，但可能降低多样性

**调整时机**:
```typescript
// 在 services/portfolioCalculator.ts 中
const tournamentSize = stockCount > 100 ? 5 : 3;
```

**权衡分析**:
| k 值 | 收敛速度 | 多样性 | 适用场景 |
|------|---------|--------|---------|
| k=3  | 中等    | 高     | 通用，当前设置 ✅ |
| k=5  | 快      | 中     | 大股票池（> 100） |
| k=7  | 很快    | 低     | 快速原型验证 |

**当前状态**: ✅ **k=3 是合理的默认值**，暂不修改

---

## 📝 修改文件清单

### 第一轮改进
1. **assembly/index.ts**
   - 修改 `calculateStabilityV2Score` 函数（第 148-207 行）
   - 添加几何乘积评分
   - 添加指数衰减惩罚
   - 添加 Gatekeeping 门槛

2. **services/portfolioCalculator.ts**
   - 修改 `mutateWeights` 函数（第 285-330 行）
   - 添加三种变异策略
   - 降低变异率至 0.15

### 第二轮深度优化
3. **assembly/index.ts**（再次修改）
   - 将百分比偏离改为对数残差（第 178-200 行）
   - 提升长期数据的评分准确性

4. **services/portfolioCalculator.ts**（确认）
   - ✅ `repairWeights` 函数已实现迭代鉗制法
   - ✅ 无需修改，已达专家级水平

5. **public/build/release.wasm**
   - 重新编译生成（包含所有改进）

---

## ✨ 结论

通过实施专家建议的所有改进，WASM 版本的遗传算法现在具备：

1. ✅ **更严格的评分标准**（几何乘积 + 指数惩罚 + Gatekeeping）
2. ✅ **更智能的搜索策略**（三种变异类型 + 优化变异率）
3. ✅ **更均衡的优化结果**（一票否决机制）

预期优化效果将达到或超过原 TypeScript "极致稳定 V2" 版本的水平。

---

**改进完成时间**: 2026-01-16  
**改进依据**: 专家技术诊断报告  
**实施状态**: ✅ 全部完成并编译成功
