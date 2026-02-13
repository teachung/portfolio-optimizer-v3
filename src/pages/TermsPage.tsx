import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/landing/Logo';
import { useTranslation } from '../contexts/LanguageContext';
import { ChevronDown, ChevronUp, Shield, FileText, Eye, CreditCard, Lock, Scale, Mail } from 'lucide-react';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<SectionProps> = ({ icon, title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-bold text-white">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-6 bg-slate-900/30 text-slate-300 text-sm leading-relaxed space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

const TermsPage: React.FC = () => {
  const { language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const isZH = language === 'zh-TW';

  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-slate-800">
        <a href="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-xl font-bold text-white">PortfolioBlender</span>
        </a>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh-TW' : 'en')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            {language === 'en' ? '繁中' : 'EN'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 text-sm font-medium">
              {isZH ? '法律文件' : 'Legal Document'}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {isZH ? '服務條款及免責聲明' : 'Terms of Service & Disclaimer'}
          </h1>
          <p className="text-slate-400">
            {isZH ? '最後更新：2026年2月' : 'Last Updated: February 2026'}
          </p>
        </div>

        {/* Important Notice Banner */}
        <div className="mb-8 p-5 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-amber-200 font-bold mb-1">
                {isZH ? '重要聲明' : 'Important Notice'}
              </h3>
              <p className="text-amber-300/80 text-sm">
                {isZH
                  ? '本平台是投資組合數據分析及優化計算工具，不構成任何形式的投資建議。投資涉及風險，過往表現並不代表將來回報。使用本平台前，請仔細閱讀以下條款。'
                  : 'This platform is a portfolio data analysis and optimization calculation tool and does not constitute any form of investment advice. Investment involves risk, and past performance is not indicative of future results. Please read the following terms carefully before using the platform.'}
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <CollapsibleSection
          icon={<FileText className="w-5 h-5 text-emerald-400" />}
          title={isZH ? '1. 服務性質' : '1. Nature of Service'}
          defaultOpen={true}
        >
          <h3 className="text-white font-semibold mb-2">
            {isZH ? '1.1 工具性質聲明' : '1.1 Tool Nature Declaration'}
          </h3>
          <p>
            {isZH
              ? 'PortfolioBlender（以下簡稱「本平台」）是一個投資組合數據分析及優化計算工具。本平台透過數學模型及算法，基於用戶提供的歷史數據進行回測及模擬運算。'
              : 'PortfolioBlender (hereinafter referred to as "the Platform") is a portfolio data analysis and optimization calculation tool. The Platform uses mathematical models and algorithms to perform backtesting and simulation calculations based on historical data provided by users.'}
          </p>

          <h3 className="text-white font-semibold mb-2 mt-4">
            {isZH ? '1.2 非投資建議聲明' : '1.2 Not Investment Advice'}
          </h3>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-red-300 font-semibold">
              {isZH
                ? '本平台不構成、亦不應被理解為任何形式的投資建議、證券推薦、買賣指引或財務規劃服務。'
                : 'The Platform does not constitute, and should not be construed as, any form of investment advice, securities recommendation, trading guidance, or financial planning service.'}
            </p>
          </div>
          <ul className="list-disc list-inside space-y-1 mt-3 text-slate-400">
            <li>{isZH ? '不會就任何證券的買入、賣出或持有提供個人化建議' : 'Does NOT provide personalized advice on buying, selling, or holding any securities'}</li>
            <li>{isZH ? '不會推薦任何特定的投資策略或投資組合' : 'Does NOT recommend any specific investment strategy or portfolio'}</li>
            <li>{isZH ? '不會保證任何投資回報或表現' : 'Does NOT guarantee any investment returns or performance'}</li>
            <li>{isZH ? '不會對用戶的投資決定承擔任何責任' : 'Does NOT assume any responsibility for users\' investment decisions'}</li>
          </ul>

          <h3 className="text-white font-semibold mb-2 mt-4">
            {isZH ? '1.3 牌照聲明' : '1.3 Licensing Declaration'}
          </h3>
          <p>
            {isZH
              ? '本平台並非香港證券及期貨事務監察委員會（證監會/SFC）持牌法團，不持有《證券及期貨條例》（第571章）下的任何牌照。本平台不從事受規管活動，包括但不限於：第1類（證券交易）、第4類（就證券提供意見）、第9類（提供資產管理）。'
              : 'The Platform is NOT a corporation licensed by the Securities and Futures Commission (SFC) of Hong Kong. The Platform does not engage in regulated activities including Type 1, Type 4, or Type 9.'}
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          icon={<Shield className="w-5 h-5 text-amber-400" />}
          title={isZH ? '2. 免責聲明' : '2. Disclaimer'}
        >
          <h3 className="text-white font-semibold mb-2">
            {isZH ? '2.1 投資風險' : '2.1 Investment Risk'}
          </h3>
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-300 font-semibold">
              {isZH
                ? '投資涉及風險，投資產品的價格可升亦可跌。過往的表現並不代表將來的回報。'
                : 'Investment involves risk. The price of investment products may go up or down. Past performance is not indicative of future results.'}
            </p>
          </div>
          <p className="mt-3">
            {isZH
              ? '用戶應在作出任何投資決定前，充分考慮自身的投資目標、財務狀況及風險承受能力，並在有需要時諮詢獨立的持牌理財顧問。'
              : 'Users should fully consider their own investment objectives, financial situation, and risk tolerance before making any investment decisions, and consult an independent licensed financial advisor when necessary.'}
          </p>

          <h3 className="text-white font-semibold mb-2 mt-4">
            {isZH ? '2.2 回測及模擬結果' : '2.2 Backtesting and Simulation Results'}
          </h3>
          <p>{isZH ? '本平台展示的所有回測結果、模擬數據、優化組合及相關統計指標：' : 'All backtesting results, simulation data, optimized portfolios displayed on the Platform:'}</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-slate-400">
            <li>{isZH ? '僅基於歷史數據，不代表未來表現' : 'Are based on historical data ONLY and do not represent future performance'}</li>
            <li>{isZH ? '存在固有局限性，包括：倖存者偏差、前瞻偏差、過度擬合等' : 'Have inherent limitations including: Survivorship Bias, Look-ahead Bias, Overfitting, etc.'}</li>
            <li>{isZH ? '不應被視為任何投資推薦或保證' : 'Should NOT be regarded as any investment recommendation or guarantee'}</li>
            <li>{isZH ? '實際投資結果可能與模擬結果有重大差異' : 'Actual investment results may differ significantly from simulated results'}</li>
          </ul>

          <h3 className="text-white font-semibold mb-2 mt-4">
            {isZH ? '2.3 組合資料庫 (Library)' : '2.3 Portfolio Library'}
          </h3>
          <p>
            {isZH
              ? '本平台的組合資料庫功能展示的所有投資組合僅為歷史回測的數學運算結果展示，用於教育及研究用途，不構成任何形式的投資推薦或買入建議。'
              : 'All portfolios displayed in the Platform\'s Portfolio Library feature are ONLY displays of historical backtesting results for educational and research purposes.'}
          </p>

          <h3 className="text-white font-semibold mb-2 mt-4">
            {isZH ? '2.4 AI 分析功能' : '2.4 AI Analysis Feature'}
          </h3>
          <p>
            {isZH
              ? '本平台的 AI 分析功能由第三方人工智能模型提供。AI 生成的分析內容僅供參考，不構成投資建議，可能包含錯誤、不準確或過時的資訊。'
              : 'The Platform\'s AI Analysis feature is powered by third-party AI models. AI-generated content is for reference only and may contain errors or inaccuracies.'}
          </p>

          <h3 className="text-white font-semibold mb-2 mt-4">
            {isZH ? '2.5 責任限制' : '2.5 Limitation of Liability'}
          </h3>
          <p>
            {isZH
              ? '在法律允許的最大範圍內，本平台及其營運者對用戶因使用本平台而作出的任何投資決定所導致的損失、因數據不準確或系統故障而造成的損失，以及因第三方服務問題而造成的損失，均不承擔任何責任。'
              : 'To the maximum extent permitted by law, the Platform shall not be liable for any losses resulting from investment decisions, data inaccuracies, system failures, or third-party service issues.'}
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          icon={<Eye className="w-5 h-5 text-sky-400" />}
          title={isZH ? '3. 用戶責任' : '3. User Responsibilities'}
        >
          <ul className="list-disc list-inside space-y-2">
            <li>{isZH ? '所有投資決定均由用戶自行作出，本平台不參與任何投資決策過程' : 'All investment decisions are made independently by users'}</li>
            <li>{isZH ? '用戶應根據自身情況獨立判斷，不應完全依賴本平台的任何輸出結果' : 'Users should make independent judgments based on their own circumstances'}</li>
            <li>{isZH ? '用戶應在需要時諮詢持牌專業人士' : 'Users should consult licensed professionals when necessary'}</li>
            <li>{isZH ? '用戶不得將本平台的輸出結果作為投資建議轉發給他人' : 'Users shall not redistribute the Platform\'s output as investment advice'}</li>
            <li>{isZH ? '用戶必須年滿 18 歲方可使用本平台的服務' : 'Users must be at least 18 years old to use the Platform'}</li>
          </ul>
        </CollapsibleSection>

        <CollapsibleSection
          icon={<CreditCard className="w-5 h-5 text-purple-400" />}
          title={isZH ? '4. 訂閱及付款' : '4. Subscription and Payment'}
        >
          <h3 className="text-white font-semibold mb-2">
            {isZH ? '4.1 訂閱計劃' : '4.1 Subscription Plans'}
          </h3>
          <p>
            {isZH
              ? '本平台提供不同級別的訂閱計劃。各計劃的功能及價格以網站上公佈的最新資訊為準。本平台保留隨時修改計劃內容及價格的權利。'
              : 'The Platform offers different subscription plans. Features and pricing are as indicated on the website.'}
          </p>

          <h3 className="text-white font-semibold mb-2 mt-4">
            {isZH ? '4.2 退款政策' : '4.2 Refund Policy'}
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>{isZH ? '首月訂閱：如用戶在訂閱後7天內未使用任何付費功能，可申請全額退款' : 'FirstMonth: Full refund available within 7 days if no paid features were used'}</li>
            <li>{isZH ? '續期訂閱：不設退款，用戶可在當前訂閱期結束前取消' : 'Pro renewal: No refunds. Users may cancel before current period ends'}</li>
          </ul>
        </CollapsibleSection>

        <CollapsibleSection
          icon={<Lock className="w-5 h-5 text-rose-400" />}
          title={isZH ? '5. 私隱政策' : '5. Privacy Policy'}
        >
          <h3 className="text-white font-semibold mb-2">
            {isZH ? '5.1 收集的資料' : '5.1 Information Collected'}
          </h3>
          <ul className="list-disc list-inside space-y-1">
            <li>{isZH ? '電郵地址（用於帳戶管理）' : 'Email address (for account management)'}</li>
            <li>{isZH ? '付款證明（用於訂閱驗證）' : 'Payment proof (for subscription verification)'}</li>
            <li>{isZH ? 'AI 分析使用記錄（用於計算使用次數）' : 'AI analysis usage records (for usage counting)'}</li>
          </ul>

          <h3 className="text-white font-semibold mb-2 mt-4">
            {isZH ? '5.2 資料使用承諾' : '5.2 Data Use Commitments'}
          </h3>
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <ul className="space-y-1 text-emerald-300">
              <li>✓ {isZH ? '不會出售用戶的個人資料給第三方' : 'Will NOT sell personal data to third parties'}</li>
              <li>✓ {isZH ? '不會將用戶上傳的投資數據用於除提供服務以外的任何目的' : 'Will NOT use uploaded data for purposes other than service provision'}</li>
              <li>✓ {isZH ? '遵守香港《個人資料（私隱）條例》（第486章）' : 'Complies with Personal Data (Privacy) Ordinance (Cap. 486)'}</li>
            </ul>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          icon={<Scale className="w-5 h-5 text-indigo-400" />}
          title={isZH ? '6. 適用法律' : '6. Governing Law'}
        >
          <p>
            {isZH
              ? '本條款受香港特別行政區法律管轄。任何因本條款或本平台服務引起的爭議，應首先嘗試通過友好協商解決。如協商不成，雙方同意提交香港法院管轄。'
              : 'These Terms shall be governed by the laws of the Hong Kong SAR. Any disputes shall first be attempted through amicable negotiation, and if unsuccessful, submitted to the jurisdiction of Hong Kong courts.'}
          </p>
        </CollapsibleSection>

        <CollapsibleSection
          icon={<Mail className="w-5 h-5 text-teal-400" />}
          title={isZH ? '7. 聯絡方式' : '7. Contact Information'}
        >
          <p>
            {isZH ? '如對本條款有任何疑問，請聯絡：' : 'For any questions regarding these Terms, please contact:'}
          </p>
          <p className="text-emerald-400 font-semibold mt-2">
            support@portfolioblender.com
          </p>
        </CollapsibleSection>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>© 2026 PortfolioBlender. All rights reserved.</p>
        </div>

        {/* Back Button */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-emerald-400 text-sm transition-colors"
          >
            ← {isZH ? '返回' : 'Go Back'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
