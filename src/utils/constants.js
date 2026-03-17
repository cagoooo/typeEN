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

export const rowMap = {
    'Q': 'top', 'W': 'top', 'E': 'top', 'R': 'top', 'T': 'top', 'Y': 'top', 'U': 'top', 'I': 'top', 'O': 'top', 'P': 'top',
    'A': 'home', 'S': 'home', 'D': 'home', 'F': 'home', 'G': 'home', 'H': 'home', 'J': 'home', 'K': 'home', 'L': 'home',
    'Z': 'bottom', 'X': 'bottom', 'C': 'bottom', 'V': 'bottom', 'B': 'bottom', 'N': 'bottom', 'M': 'bottom',
};

export const VOCABULARY = [
    'APPLE', 'BOOK', 'CAT', 'DOG', 'EGG', 'FISH', 'GOOD', 'HAPPY', 'ICE', 'JUMP',
    'KITE', 'LION', 'MOON', 'NICE', 'OPEN', 'PINK', 'QUIET', 'RED', 'SUN', 'TREE',
    'UMBRELLA', 'VAN', 'WATER', 'XRAY', 'YELLOW', 'ZOO', 'BIRD', 'CAR', 'DUCK', 'FROG',
    'GIRL', 'HOUSE', 'JUICE', 'KING', 'LAMP', 'MOUSE', 'NOSE', 'PIG', 'QUEEN', 'ROSE',
    'STAR', 'TRAIN', 'UNCLE', 'VOICE', 'WATCH', 'YEAR', 'ZEBRA', 'BEAR', 'CAKED', 'DOOR'
];

export const ACHIEVEMENTS = [
    { id: 'first_blood', title: '初出茅廬', description: '成功擊破第一個字母', icon: '🎯' },
    { id: 'combo_10', title: '連擊好手', description: '達成 10 連擊', icon: '🔥' },
    { id: 'combo_50', title: '無影手', description: '達成 50 連擊', icon: '⚡' },
    { id: 'combo_100', title: '鍵盤之神', description: '達成 100 連擊', icon: '👑' },
    { id: 'combo_200', title: '神乎其技', description: '達成 200 連擊', icon: '🌟' },
    { id: 'beginner_pro', title: '初學大師', description: '在初學者模式達到 100 連擊', icon: '🔰' },
    { id: 'survive_60s', title: '生存專家', description: '在無盡模式存活 60 秒', icon: '🛡️' },
    { id: 'boss_killer', title: 'BOSS 剋星', description: '擊敗一次首領', icon: '⚔️' },
    { id: 'word_master', title: '單字大師', description: '通關單字挑戰', icon: '📖' },
    { id: 'perfect_clear', title: '完美主義', description: '無失誤通關一般模式', icon: '✨' },
    { id: 'typewriter', title: '打字機', description: '歷史累積完成 1000 個字', icon: '⌨️' },
    { id: 'millionaire', title: '財富自由', description: '歷史累積獲得 2000 枚代幣', icon: '💰' },
    { id: 'shopaholic', title: '購物狂', description: '在商城購買 5 個商品', icon: '🛍️' }
];

export const SHOP_ITEMS = [
    {
        id: 'theme_neon_pink',
        name: '櫻花霓虹網格',
        type: 'theme',
        price: 100,
        icon: '🌸',
        value: 'rgba(244, 114, 182, 0.2)',
        description: '迷人的粉色氛圍',
        longDescription: '這款主題將網格背景切換為夢幻的櫻花粉色調，並帶有微妙的霓虹波動效果。適合喜好柔和、浪漫風格的挑戰者。'
    },
    {
        id: 'theme_matrix_green',
        name: '駭客任務綠',
        type: 'theme',
        price: 150,
        icon: '💻',
        value: 'rgba(74, 222, 128, 0.2)',
        description: '經典的數位代碼風',
        longDescription: '靈感來自於經典科幻電影，深色背景搭配螢光綠網格，讓你在打字時彷彿化身為穿梭於虛擬世界的頂尖駭客。'
    },
    {
        id: 'theme_cyber_yellow',
        name: '賽博黃金',
        type: 'theme',
        price: 200,
        icon: '⚡',
        value: 'rgba(250, 204, 21, 0.2)',
        description: '高能電力與黃金質感',
        longDescription: '極具視覺衝擊力的明黃色霓虹燈效，代表著無窮的力量與速度。裝備此主題，讓你的挑戰過程如同閃電般耀眼奪目。'
    },
    {
        id: 'theme_blood_red',
        name: '腥紅之月',
        type: 'theme',
        price: 300,
        icon: '🩸',
        value: 'rgba(239, 68, 68, 0.2)',
        description: '深沈的深紅神祕感',
        longDescription: '這是一份專屬於高難度挑戰者的榮譽之色。深沉的血紅色網格能讓你更加集中專注，展現出絕對壓制的氣場。'
    },
    {
        id: 'theme_cosmic_purple',
        name: '星空幽紫',
        type: 'theme',
        price: 150,
        icon: '🌌',
        value: 'rgba(168, 85, 247, 0.2)',
        description: '神祕廣闊的宇宙紫',
        longDescription: '彷彿置身於無垠的星系之中。深邃的紫色霓虹能有效減緩視覺疲勞，助你在長途單字挑戰中保持優雅的節奏。'
    },
    {
        id: 'theme_deep_sea',
        name: '深海湛藍',
        type: 'theme',
        price: 150,
        icon: '🌊',
        value: 'rgba(14, 165, 233, 0.2)',
        description: '冷靜沈穩的海藍色',
        longDescription: '平靜如水的湛藍色調。適合在需要極高準確度的「完美主義」挑戰中使用，讓你的思緒如深海般沉穩、敏銳。'
    },
    {
        id: 'effect_lightning',
        name: '閃電軌跡',
        type: 'effect',
        price: 200,
        icon: '⚡',
        description: '打字成功時噴發耀眼黃白閃電粒子',
        longDescription: '當你擊破字母時，會產生狂暴的閃電粒子噴發，展現極致的速度感！特別搭配「賽博黃金」主題效果更佳。'
    },
    {
        id: 'effect_cherry',
        name: '櫻花飄落',
        type: 'effect',
        price: 300,
        icon: '🌸',
        description: '打字成功時噴發夢幻櫻花粉粒子',
        longDescription: '每一次成功的敲擊都會在螢幕上綻放出溫柔的粉色粒子，彷彿落櫻紛飛。這是優雅打字者的不二之選。'
    },
    {
        id: 'effect_rainbow',
        name: '彩虹光譜',
        type: 'effect',
        price: 500,
        icon: '🌈',
        description: '打字成功時噴發七彩繽紛隨機粒子',
        longDescription: '商城中最昂貴的特效！匯聚了彩虹的所有色彩，字母擊破後的視覺饗宴能大幅提升你的打字樂趣與成就感。'
    }
];

export const BGM_CHOICES = [
    { id: 'bgm_auto', name: '隨機撥放 (Auto)', url: 'auto' },
    { id: 'bgm_reset', name: '賽博重置 (RESET)', url: './audio/bgm_1.mp3' },
    { id: 'bgm_glory', name: '史詩榮榮耀 (Glory)', url: './audio/bgm_2.mp3' },
    { id: 'bgm_noise', name: '賽博噪音 (Noise)', url: './audio/bgm_3.mp3' },
    { id: 'bgm_idra', name: '電子電玩 (IDRA)', url: './audio/bgm_4.mp3' },
    { id: 'bgm_push', name: '極限動力 (PUSH)', url: './audio/bgm_5.mp3' },
    { id: 'bgm_hammer', name: '重錘出擊 (Hammer)', url: './audio/bgm_6.mp3' },
    { id: 'bgm_gloves', name: '工業節奏 (Industrial)', url: './audio/bgm_7.mp3' },
    { id: 'bgm_turbo', name: '極速拉力 (Turbo)', url: './audio/bgm_8.mp3' },
    { id: 'bgm_shine', name: '科幻拋光 (SHINE)', url: './audio/bgm_10.mp3' },
    { id: 'bgm_enthusiast', name: '熱血狂想 (Enthusiast)', url: './audio/bgm_11.mp3' },
];
