export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
];

export const fingerMap = {
    'Q': 'left-pinky', 'A': 'left-pinky', 'Z': 'left-pinky',
    'W': 'left-ring', 'S': 'left-ring', 'X': 'left-ring',
    'E': 'left-middle', 'D': 'left-middle', 'C': 'left-middle',
    'R': 'left-index', 'F': 'left-index', 'V': 'left-index', 'T': 'left-index', 'G': 'left-index', 'B': 'left-index',
    'Y': 'right-index', 'H': 'right-index', 'N': 'right-index', 'U': 'right-index', 'J': 'right-index', 'M': 'right-index',
    'I': 'right-middle', 'K': 'right-middle',
    'O': 'right-ring', 'L': 'right-ring',
    'P': 'right-pinky',
};

export const VOCABULARY = [
    'APPLE', 'BOOK', 'CAT', 'DOG', 'EGG', 'FISH', 'GOOD', 'HAPPY', 'ICE', 'JUMP',
    'KITE', 'LION', 'MOON', 'NICE', 'OPEN', 'PINK', 'QUIET', 'RED', 'SUN', 'TREE',
    'UMBRELLA', 'VAN', 'WATER', 'XRAY', 'YELLOW', 'ZOO', 'BIRD', 'CAR', 'DUCK', 'FROG',
    'GIRL', 'HOUSE', 'JUICE', 'KING', 'LAMP', 'MOUSE', 'NOSE', 'PIG', 'QUEEN', 'ROSE',
    'STAR', 'TRAIN', 'UNCLE', 'VOICE', 'WATCH', 'YEAR', 'ZEBRA', 'BEAR', 'CAKED', 'DOOR'
];

export const ACHIEVEMENTS = [
    {
        id: 'first_blood',
        title: '初出茅廬',
        description: '成功擊破第一個字母',
        icon: '🎯'
    },
    {
        id: 'combo_10',
        title: '連擊好手',
        description: '達成 10 連擊',
        icon: '🔥'
    },
    {
        id: 'combo_50',
        title: '無影手',
        description: '達成 50 連擊',
        icon: '⚡'
    },
    {
        id: 'combo_100',
        title: '鍵盤之神',
        description: '達成 100 連擊',
        icon: '👑'
    },
    {
        id: 'survive_60s',
        title: '生存專家',
        description: '在無盡模式存活 60 秒',
        icon: '🛡️'
    },
    {
        id: 'boss_killer',
        title: 'BOSS 剋星',
        description: '擊敗一次首領',
        icon: '⚔️'
    },
    {
        id: 'word_master',
        title: '單字大師',
        description: '通關單字挑戰',
        icon: '📖'
    },
    {
        id: 'perfect_clear',
        title: '完美主義',
        description: '無失誤(Combo不斷)通關一般模式',
        icon: '✨'
    }
];

export const SHOP_ITEMS = [
    {
        id: 'theme_neon_pink',
        name: '櫻花霓虹網格',
        type: 'theme',
        price: 100,
        icon: '🌸',
        value: 'rgba(244, 114, 182, 0.2)'
    },
    {
        id: 'theme_matrix_green',
        name: '駭客任務綠',
        type: 'theme',
        price: 150,
        icon: '💻',
        value: 'rgba(74, 222, 128, 0.2)'
    },
    {
        id: 'theme_cyber_yellow',
        name: '賽博黃金',
        type: 'theme',
        price: 200,
        icon: '⚡',
        value: 'rgba(250, 204, 21, 0.2)'
    },
    {
        id: 'theme_blood_red',
        name: '腥紅之月',
        type: 'theme',
        price: 300,
        icon: '🩸',
        value: 'rgba(239, 68, 68, 0.2)'
    }
];
