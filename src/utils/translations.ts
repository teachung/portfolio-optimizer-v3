
export type Language = 'en' | 'zh-TW';

export const translations = {
  'en': {
    nav: {
      core: "Features",
      library: "Strategy Library",
      lab: "Pricing",
      pricing: "Reviews",
      launch: "Start Now",
      login: "Login",
      logout: "Logout",
      app: "Launch App"
    },
    hero: {
      badge: "Live Market Simulation",
      title_line1: "Let your assets undergo",
      title_line2: "100,000 virtual",
      title_line3: "bull & bear market tests",
      desc_sub: "The world's first web-based quantitative system combining <strong>Genetic Algorithms</strong> and <strong>Geometric AI Scoring</strong>.",
      cta_start: "Try for HK$1",
      cta_demo: "View Features",
      stat_sims: "Simulations/sec",
      stat_accuracy: "Logic Accuracy",
      stat_latency: "Response Time",
      chart_header: "Efficiency Frontier",
      chart_live: "Calculating",
      chart_legend: "Color (Sharpe): Blue=Low → Red=High",
      chart_best: "Best (★)",
      chart_sim: "Simulated"
    },
    redbox: {
      badge: "The Professional's Choice",
      title_main: "Red Box Function: <span class=\"text-fuchsia-500\">Hexagon Warrior Grade AI Optimization</span>",
      desc: "Using genetic algorithms and geometric scoring, we filter out 'noise' and 'mutation' in simulation to automatically select the strongest genes.",
      cards: {
        super_ai: { title: "Super AI Optimization", tag: "Final Dimension", desc: "AI automatically balances risk and return to find the best landing point on the efficiency frontier." },
        super_ai_v2: { title: "Super AI v2.0", tag: "Hexagon Warrior", desc: "Built-in strict elimination mechanism, specializing in mining professional portfolios with high winning rates, high Sharpe, and extreme resistance." },
        extreme_stab_v2: { title: "Extreme Stability v2", tag: "Bi-directional Volatility Filter", desc: "Industry-leading noise reduction algorithm filtering normal fluctuations, designed for large capital users seeking 'Sleep-Well Wealth'." },
        extreme_stab_v1: { title: "Extreme Stability v1", tag: "Lock-in Effect", desc: "For conservative investors, locking drawdown in a small range to simulate steady cash flow growth." },
        preferred_asset: { title: "Preferred Asset Injection", tag: "Core Holding Lock", desc: "While AI optimizes, it enforces core holdings (e.g. 40% QQQ), letting AI optimize around your core views." },
        market_timing: { title: "Market Timing Hedging", tag: "Dynamic Hedging", desc: "When the market trend weakens, AI automatically simulates switching to cash positions to protect principal." }
      },
      chart_1_title: "Yield Curve Comparison",
      chart_2_title: "Max Drawdown Comparison",
      cta: "Upgrade to Professional"
    },
    library: {
      title: "AlphaGenius Strategy Library",
      subtitle: "Coming Soon",
      desc: "We are preparing professional investment strategies for you. AI-discovered 'Golden Combinations' verified across different market cycles.",
      coming_soon: {
        title: "Strategy Library Coming Soon",
        desc: "We are curating the best AI-discovered portfolios for you. Stay tuned!",
        notify: "Notify Me"
      }
    },
    pricing: {
      title: "Choose Your Plan",
      subtitle: "Transparent Pricing",
      desc: "We believe in transparent pricing. Choose the plan that suits your investment needs.",
      trial: {
        title: "Trial",
        tier: "NEW USER",
        price: "HK$1",
        period: "30 days",
        subtitle: "Full features, zero risk",
        features: [
          "All 5 AI optimization algorithms",
          "100,000 Monte Carlo simulations",
          "Real-time stock quotes",
          "Multi-dimensional analysis reports",
          "Asset allocation charts",
          "Drawdown curve analysis",
          "Quarterly rebalancing simulation"
        ],
        cta: "Start for $1"
      },
      pro: {
        title: "Flagship",
        tier: "MOST POPULAR",
        price: "HK$1,000",
        period: "/month",
        subtitle: "First month 50% off: HK$500",
        features: [
          "All Trial features",
          "Unlimited usage",
          "Priority customer support",
          "Early access to new algorithms",
          "Full strategy library access",
          "Email notification service",
          "Data privacy protection"
        ],
        cta: "Subscribe Now"
      },
      enterprise: {
        title: "Enterprise",
        tier: "TEAMS",
        price: "Contact Us",
        period: "",
        subtitle: "Tailored for your team",
        features: [
          "All Flagship features",
          "Team collaboration",
          "Dedicated account manager",
          "Priority technical support",
          "Custom integration options",
          "Volume discounts available"
        ],
        cta: "Contact Us"
      }
    },
    testimonials: {
      title: "Real User Testimonials",
      subtitle: "Feedback from professional investors and institutions",
      users: [
        {
          name: "Kelvin Cheung",
          role: "Senior Trader, Private Fund",
          quote: "PortfolioBlender's Super AI v2.0 completely changed my investment method. My portfolio Sharpe ratio increased from 1.2 to 2.8, and Max Drawdown dropped to -14%. This isn't just a tool, it's like having a 24/7 quantitative analyst."
        },
        {
          name: "Tiffany Lee",
          role: "Wealth Management Consultant",
          quote: "As a conservative investor, the Extreme Stability v1 function let me find the ideal investment plan. Controlling drawdown within -8% while achieving 12% annualized return. This steady growth is exactly what I've been looking for."
        },
        {
          name: "David Wong",
          role: "Independent Investor",
          quote: "The Market Timing Hedging System saved me during last year's market volatility. When the market started to weaken, the system automatically simulated switching to cash, letting me avoid a -25% drop. This smart protection mechanism is worth every penny."
        }
      ],
      stats: {
        users: "Active Users",
        sims: "Simulations",
        rating: "User Rating",
        satisfaction: "Satisfaction"
      },
      cta_btn: "View More Cases"
    },
    footer: {
      connect: "Stay Updated",
      desc: "Subscribe for the latest strategy updates and product news.",
      email_placeholder: "Your email",
      subscribe: "Subscribe",
      quick_links: "Quick Links",
      contact: "Contact Us",
      legal: "Legal",
      rights: "2025 PortfolioBlender. All rights reserved."
    },
    login: {
      title: "Welcome to PortfolioBlender",
      subtitle: "Login to access your portfolio optimization tools",
      google_btn: "Sign in with Google",
      pending: "Your account is pending approval. Please wait for admin review.",
      error: "Login failed. Please try again."
    },
    app: {
      welcome: "Welcome back",
      logout: "Logout"
    }
  },
  'zh-TW': {
    nav: {
      core: "產品功能",
      library: "精選策略庫",
      lab: "定價方案",
      pricing: "用戶見證",
      launch: "立即開始",
      login: "登入",
      logout: "登出",
      app: "進入應用"
    },
    hero: {
      badge: "實時市場模擬",
      title_line1: "讓您的資產",
      title_line2: "經歷 100,000 次",
      title_line3: "虛擬牛熊的考驗",
      desc_sub: "全球首款結合<strong>遺傳演算法</strong>與<strong>幾何級數 AI 評分</strong>的網頁端量化系統",
      cta_start: "HK$1 開始體驗",
      cta_demo: "查看功能介紹",
      stat_sims: "模擬次數/秒",
      stat_accuracy: "運算準確度",
      stat_latency: "響應時間",
      chart_header: "效率前緣",
      chart_live: "即時運算",
      chart_legend: "顏色 (夏普比率): 藍=差 → 紅=好",
      chart_best: "最佳組合 (★)",
      chart_sim: "模擬組合"
    },
    redbox: {
      badge: "專業投資者之選",
      title_main: "紅框功能：<span class=\"text-fuchsia-500\">六邊形戰士級 AI 優化</span>",
      desc: "採用遺傳演算法與幾何級數評分系統，讓投資組合在模擬中不斷「雜交」與「變異」，自動篩選出最強基因",
      cards: {
        super_ai: { title: "超級 AI 優化", tag: "終極維度", desc: "由 AI 自動權衡回報與風險，尋找效率前緣的最佳平衡點" },
        super_ai_v2: { title: "超級 AI v2.0", tag: "六邊形戰士", desc: "內建嚴格淘汰機制，專門挖掘具備高勝率、高夏普、且極度抗跌的專業級組合" },
        extreme_stab_v2: { title: "極致穩度 v2", tag: "雙向波動過濾", desc: "全球領先的降噪算法，過濾異常波動，專為追求「睡得著的財富」的大資金用戶設計" },
        extreme_stab_v1: { title: "極致穩定 v1", tag: "鎖定存效果", desc: "針對保守型投資者，將回調控制在極小範圍內，模擬類現金流的穩健增長" },
        preferred_asset: { title: "優先股指定注入", tag: "核心持倉鎖定", desc: "在 AI 優化的同時，強制指定核心持倉（如 40% QQQ），讓 AI 繞著您的核心觀點進行慣性優化" },
        market_timing: { title: "市場擇時避險系統", tag: "動能避險", desc: "當大盤走勢轉弱，AI 會自動模擬切換至現金倉位，保護本金" }
      },
      chart_1_title: "收益曲線對比",
      chart_2_title: "最大回撤對比",
      cta: "升級至專業版"
    },
    library: {
      title: "AlphaGenius 策略庫",
      subtitle: "敬請期待",
      desc: "我們正在為您準備專業的投資策略。經過數百萬次模擬後篩選出的「黃金配置」，針對不同的市場週期進行驗證。",
      coming_soon: {
        title: "精選策略即將推出",
        desc: "我們正在為您策劃最優質的 AI 發現組合，敬請期待！",
        notify: "通知我"
      }
    },
    pricing: {
      title: "選擇適合您的方案",
      subtitle: "透明定價",
      desc: "我們相信透明定價，選擇最適合您投資需求的方案。",
      trial: {
        title: "試用版",
        tier: "新手體驗",
        price: "HK$1",
        period: "30天",
        subtitle: "完整功能，零風險體驗",
        features: [
          "全部 5 種 AI 優化算法",
          "100,000 次蒙特卡洛模擬",
          "即時股票報價",
          "多維度分析報告",
          "資產配置圖表",
          "回撤曲線分析",
          "季度重新平衡模擬"
        ],
        cta: "$1 開始體驗"
      },
      pro: {
        title: "旗艦版",
        tier: "最受歡迎",
        price: "HK$1,000",
        period: "/月",
        subtitle: "首月半價 HK$500",
        features: [
          "試用版全部功能",
          "無限期持續使用",
          "優先客戶支援",
          "新算法優先體驗",
          "策略庫完整訪問",
          "電郵通知服務",
          "數據隱私保護"
        ],
        cta: "立即訂閱"
      },
      enterprise: {
        title: "企業版",
        tier: "企業專屬",
        price: "聯繫我們",
        period: "",
        subtitle: "為團隊量身定制",
        features: [
          "旗艦版全部功能",
          "團隊協作功能",
          "專屬客戶經理",
          "優先技術支援",
          "客製化整合方案",
          "批量優惠價格"
        ],
        cta: "聯繫我們"
      }
    },
    testimonials: {
      title: "用戶真實見證",
      subtitle: "來自專業投資者與機構的真實反饋",
      users: [
        {
          name: "Kelvin Cheung",
          role: "資深代操交易員",
          quote: "PortfolioBlender 的超級 AI v2.0 徹底改變了我的投資方式。我的組合夏普比率從 1.2 提升到 2.8，而最大回撤從 -32% 降低到 -14%。這不僅僅是工具，更像是擁有了一位 24/7 在線的量化分析師。"
        },
        {
          name: "Tiffany Lee",
          role: "財富管理顧問",
          quote: "作為保守型投資者，極致穩定 v1 功能讓我找到了理想的投資方案。回撤控制在 -8% 以內，年化收益卻能達到 12%，這種穩定增長正是我一直在尋找的。"
        },
        {
          name: "David Wong",
          role: "獨立投資人",
          quote: "市場擇時避險系統在去年的市場動盪中救了我。當大盤開始走弱時，系統自動模擬切換至現金倉位，讓我避開了 -25% 的跌幅。這種智能保護機制值得每一分錢。"
        }
      ],
      stats: {
        users: "活躍用戶",
        sims: "模擬次數",
        rating: "用戶評分",
        satisfaction: "滿意度"
      },
      cta_btn: "查看更多案例"
    },
    footer: {
      connect: "保持聯繫",
      desc: "訂閱以獲取最新策略更新和產品資訊。",
      email_placeholder: "您的電郵",
      subscribe: "訂閱",
      quick_links: "快速連結",
      contact: "聯繫我們",
      legal: "法律條款",
      rights: "2025 PortfolioBlender. All rights reserved."
    },
    login: {
      title: "歡迎使用 PortfolioBlender",
      subtitle: "登入以使用投資組合優化工具",
      google_btn: "使用 Google 登入",
      pending: "您的帳戶正在等待審批，請耐心等候管理員審核。",
      error: "登入失敗，請重試。"
    },
    app: {
      welcome: "歡迎回來",
      logout: "登出"
    }
  }
};
