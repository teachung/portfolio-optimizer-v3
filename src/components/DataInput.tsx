
import React, { useState } from 'react';
import { StockData, PortfolioParams } from '../types';

interface DataInputProps {
  onDataParsed: (data: { stockData: StockData; params: PortfolioParams }) => void;
}

const DataInput: React.FC<DataInputProps> = ({ onDataParsed }) => {
  const [pasteData, setPasteData] = useState('');
  const [priorityTickerInput, setPriorityTickerInput] = useState(''); // New state for priority ticker

  // --- 部署檔案內容定義 ---
  const netlifyTomlContent = `[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200`;

  const securityFunctionContent = `import { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
    // 模擬返回安全係數 1.0
    return new Response(JSON.stringify({ factor: 1.0 }), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        status: 200
    });
};

export const config: Config = {
    path: "/.netlify/functions/get_security_factor"
};`;

  // --- 下載輔助函數 ---
  const downloadFile = (filename: string, content: string) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const parsePastedData = () => {
    if (!pasteData.trim()) {
      alert('請先貼上數據！');
      return;
    }

    try {
      const rawLines = pasteData.trim().split(/\r?\n/);
      const lines = rawLines.map(line => line.split('\t'));

      // 1. Identify Header Row (starts with "Date")
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(lines.length, 20); i++) {
          const firstCell = lines[i][0]?.trim().toLowerCase();
          if (firstCell === 'date' || firstCell === '"date"') {
              headerRowIndex = i;
              break;
          }
      }

      if (headerRowIndex === -1) {
          throw new Error("無法找到 'Date' 欄位。請確保數據包含標題列且首欄為 'Date'。");
      }

      // 2. Parse Parameters (if Header is not at index 0, assume previous row is params)
      const defaultParams: PortfolioParams = {
        maxStockCount: 10,
        maxSingleWeight: 0.40,
        minSingleWeight: 0.05,
        strictMode: false,
        cagrThreshold: 0,
        sharpeThreshold: 0.0,
        maxDDThreshold: 0.60,
        priorityTicker: priorityTickerInput.trim() || undefined // Pass the user input
      };

      let params: PortfolioParams = { ...defaultParams };

      if (headerRowIndex > 0) {
          const paramRow = lines[headerRowIndex - 1];
          // Heuristic to check if it's a valid param row (based on original strict index structure)
          // Row: [?, maxStockCount, ?, maxSingleWeight, ?, strictMode, ?, cagr, ?, sharpe, ?, maxDD]
          if (paramRow.length > 1) {
             const pMaxStock = parseInt(paramRow[1]);
             if (!isNaN(pMaxStock)) params.maxStockCount = pMaxStock;

             const pMaxWeight = parseFloat(paramRow[3]);
             if (!isNaN(pMaxWeight)) params.maxSingleWeight = pMaxWeight / 100;
             
             // paramRow[5] '1' or '0'
             if (paramRow[5]) params.strictMode = paramRow[5].trim() === '1';
             
             const pCagr = parseFloat(paramRow[7]);
             if (!isNaN(pCagr)) params.cagrThreshold = pCagr / 100;
             
             const pSharpe = parseFloat(paramRow[9]);
             if (!isNaN(pSharpe)) params.sharpeThreshold = pSharpe;

             const pMaxDD = parseFloat(paramRow[11]);
             if (!isNaN(pMaxDD)) params.maxDDThreshold = pMaxDD / 100;
          }
      }

      // 3. Extract Tickers
      const headerRow = lines[headerRowIndex];
      // Slice(1) to skip "Date" column
      const tickers = headerRow.slice(1).map(t => t.trim()).filter(t => t && t !== '');
      
      if (tickers.length === 0) throw new Error('未找到有效的股票代號 (Header row has no columns after Date)');

      // 4. Extract Data
      const dates: string[] = [];
      const priceData: Record<string, (number | null)[]> = {};
      tickers.forEach(t => priceData[t] = []);

      for (let i = headerRowIndex + 1; i < lines.length; i++) {
          const row = lines[i];
          if (!row || !row[0] || row[0].trim() === '') continue;
          
          dates.push(row[0].trim());
          
          tickers.forEach((ticker, idx) => {
              // ticker index in tickers array is idx
              // column in row is idx + 1
              let val: number | null = null;
              if (idx + 1 < row.length) {
                  const cell = row[idx + 1];
                  if (cell && cell.trim() !== '') {
                      // Remove commas
                      const num = parseFloat(cell.replace(/,/g, ''));
                      if (!isNaN(num)) val = num;
                  }
              }
              priceData[ticker].push(val);
          });
      }

      if (dates.length === 0) throw new Error("未找到價格數據");

      const stockData: StockData = { tickers, priceData, dates };
      onDataParsed({ stockData, params });

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`數據解析失敗：${message}`);
      console.error(error);
    }
  };
  
  const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6 animate-fade-in">
        <h2 className="text-xl font-bold text-teal-400 mb-4">{title}</h2>
        {children}
    </div>
  );

  return (
    <div>
      <Section title="📋 從 Google Sheets 貼上數據">
        <div className="bg-gray-900/50 p-4 rounded-md border border-sky-500/30 text-sky-200 text-sm mb-4">
          <strong>操作步驟：</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>在 Google Sheets 選擇所有數據（建議包含參數列，或至少包含標題列如 Date, Stock1...）。</li>
            <li>按 <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl+C</kbd> 複製。</li>
            <li>點擊下方文本框，按 <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Ctrl+V</kbd> 貼上。</li>
          </ol>
        </div>

        {/* --- 下載按鈕區域 --- */}
        <div className="mb-4 p-3 bg-gray-800 border border-gray-600 rounded-lg flex flex-wrap items-center gap-4 shadow-inner">
            <span className="text-sm font-bold text-gray-300 flex items-center">
                <i className="fas fa-download mr-2 text-teal-400"></i> 下載部署檔案:
            </span>
            <button 
                onClick={() => downloadFile('netlify.toml', netlifyTomlContent)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-md font-bold transition-colors flex items-center gap-2"
            >
                <i className="fas fa-file-code"></i> netlify.toml
            </button>
            <button 
                onClick={() => downloadFile('get_security_factor.mts', securityFunctionContent)}
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-md font-bold transition-colors flex items-center gap-2"
            >
                <i className="fas fa-file-shield"></i> get_security_factor.mts
            </button>
        </div>
        {/* ------------------- */}

        <textarea
          id="pasteArea"
          className="w-full h-48 bg-gray-900 border border-gray-600 rounded-md p-3 font-mono text-sm text-gray-300 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition"
          placeholder="在這裡貼上從 Google Sheets 複製的數據..."
          value={pasteData}
          onChange={(e) => setPasteData(e.target.value)}
        />

        {/* New Input for Priority Stock */}
        <div className="mt-4 mb-2">
            <label htmlFor="priorityTicker" className="block text-sm font-medium text-gray-300 mb-1">
                <i className="fas fa-star text-yellow-500 mr-1"></i> 預設優先股代號 (可選):
            </label>
            <div className="relative">
                <input
                    id="priorityTicker"
                    type="text"
                    className="w-full md:w-1/3 bg-gray-900 border border-gray-600 rounded-md p-2 text-sm text-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition placeholder-gray-600"
                    placeholder="例如: AAPL 或 2330"
                    value={priorityTickerInput}
                    onChange={(e) => setPriorityTickerInput(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">若輸入，系統將在參數設定中自動將此股票設為優先股。</p>
            </div>
        </div>

        <div className="mt-4 flex gap-4">
          <button onClick={parsePastedData} className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2">
            <i className="fas fa-cogs"></i> 解析數據
          </button>
          <button onClick={() => setPasteData('')} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2">
            <i className="fas fa-trash"></i> 清空
          </button>
        </div>
      </Section>
    </div>
  );
};

export default DataInput;
