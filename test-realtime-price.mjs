// 测试即时股价 API 的可用性
import fetch from 'node-fetch';

const testTickers = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA'];

console.log('=== 测试即时股价 API ===\n');

async function testProxy(proxyName, proxyUrl, ticker) {
    try {
        console.log(`\n[${proxyName}] 测试 ${ticker}...`);
        const startTime = Date.now();
        
        const res = await fetch(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const elapsed = Date.now() - startTime;
        console.log(`  状态码: ${res.status} (${elapsed}ms)`);
        
        if (res.ok) {
            const json = await res.json();
            
            // 处理 AllOrigins 的特殊格式
            let parsedData = json;
            if (json && typeof json.contents === 'string') {
                try {
                    parsedData = JSON.parse(json.contents);
                } catch (e) {
                    console.log('  ❌ AllOrigins 解析失败');
                    return false;
                }
            }
            
            const meta = parsedData?.chart?.result?.[0]?.meta;
            
            if (meta) {
                console.log(`  ✅ 成功获取数据:`);
                console.log(`     价格: ${meta.regularMarketPrice} ${meta.currency}`);
                console.log(`     前收: ${meta.chartPreviousClose}`);
                console.log(`     涨跌: ${(meta.regularMarketPrice - meta.chartPreviousClose).toFixed(2)}`);
                return true;
            } else {
                console.log(`  ❌ 响应格式错误`);
                console.log(`  响应结构:`, JSON.stringify(parsedData).substring(0, 200));
                return false;
            }
        } else {
            const text = await res.text();
            console.log(`  ❌ 请求失败: ${text.substring(0, 100)}`);
            return false;
        }
    } catch (e) {
        console.log(`  ❌ 错误: ${e.message}`);
        return false;
    }
}

async function testAllProxies() {
    const results = {
        codetabs: { success: 0, fail: 0 },
        allorigins: { success: 0, fail: 0 },
        corsproxy: { success: 0, fail: 0 }
    };
    
    for (const ticker of testTickers) {
        const symbol = ticker.toUpperCase().replace(/\./g, '-');
        const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`测试股票: ${ticker}`);
        console.log(`${'='.repeat(60)}`);
        
        // 1. CodeTabs
        const codetabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
        const r1 = await testProxy('CodeTabs', codetabsUrl, ticker);
        if (r1) results.codetabs.success++; else results.codetabs.fail++;
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // 避免限流
        
        // 2. AllOrigins
        const alloriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        const r2 = await testProxy('AllOrigins', alloriginsUrl, ticker);
        if (r2) results.allorigins.success++; else results.allorigins.fail++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 3. CorsProxy
        const corsproxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        const r3 = await testProxy('CorsProxy', corsproxyUrl, ticker);
        if (r3) results.corsproxy.success++; else results.corsproxy.fail++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('测试总结:');
    console.log(`${'='.repeat(60)}`);
    console.log(`CodeTabs:   成功 ${results.codetabs.success}/${testTickers.length}, 失败 ${results.codetabs.fail}`);
    console.log(`AllOrigins: 成功 ${results.allorigins.success}/${testTickers.length}, 失败 ${results.allorigins.fail}`);
    console.log(`CorsProxy:  成功 ${results.corsproxy.success}/${testTickers.length}, 失败 ${results.corsproxy.fail}`);
    
    console.log(`\n建议:`);
    if (results.codetabs.success === testTickers.length) {
        console.log('✅ CodeTabs 工作正常，优先使用');
    } else if (results.allorigins.success === testTickers.length) {
        console.log('✅ AllOrigins 工作正常，建议使用');
    } else if (results.corsproxy.success === testTickers.length) {
        console.log('✅ CorsProxy 工作正常，建议使用');
    } else {
        console.log('❌ 所有代理服务都不稳定，建议:');
        console.log('   1. 考虑使用后端代理（Vercel Serverless Function）');
        console.log('   2. 使用付费 API 服务（如 Alpha Vantage, Finnhub）');
        console.log('   3. 添加请求频率限制和重试机制');
    }
}

testAllProxies().catch(console.error);
