export const CAMPAIGN_LEVELS = [
    {
        id: '1-1',
        name: '系統喚醒 (System Wakeup)',
        story: [
            "Initializing system... OK",
            "Target: Mainframe Security Layer 1",
            "你的首要任務是證明自己的輸入能力。",
            "目標：擊破 10 個基礎字元。"
        ],
        objective: { type: 'WORDS', target: 10 },
        config: {
            speed: 1, // Base speed
            spawnInterval: 1500, // Ms between spawns
            boss: false
        }
    },
    {
        id: '1-2',
        name: '防火牆測試 (Firewall Probe)',
        story: [
            "第一層防護已突破。",
            "警告：偵測到主動式反擊程式。",
            "你必須在敵方攻勢下存活 30 秒，不要讓核心受損。",
            "目標：存活 30 秒。"
        ],
        objective: { type: 'SURVIVE', target: 30 },
        config: {
            speed: 1.5,
            spawnInterval: 1200,
            boss: false
        }
    },
    {
        id: '1-3',
        name: '精準攔截 (Precision Intercept)',
        story: [
            "敵方防火牆正在進行封包加密...",
            "系統要求最高精準度，任何失誤都會觸發警報。",
            "目標：完美擊破 15 個字元（不容許任何漏接或打錯）。"
        ],
        objective: { type: 'PERFECT_WORDS', target: 15 },
        config: {
            speed: 1.2,
            spawnInterval: 1400,
            boss: false
        }
    },
    {
        id: '1-boss',
        name: '核心守衛者 (Core Guardian)',
        story: [
            "CRITICAL WARNING...",
            "Encountered ICE (Intrusion Countermeasures Electronics).",
            "核心守衛者已啟動。",
            "準備迎接超高速資料流與長字串封包的攻擊！",
            "目標：擊敗 Boss（完成 10 個長單字）。"
        ],
        objective: { type: 'BOSS', target: 10 },
        config: {
            speed: 2.0, // Fast
            spawnInterval: 1000,
            boss: true // Will spawn longer words/phrases
        }
    }
];
