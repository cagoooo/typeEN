// v1.3.1：網站頁尾（品牌區・三個重點・作者署名）— 只在開始畫面顯示，遊戲中不出現
const POINTS = [
    { icon: '🖐️', title: '手指位置提示', desc: '跟著提示用正確手指按鍵' },
    { icon: '🗺️', title: '闖關＋每日任務', desc: '一關一關練，天天有目標' },
    { icon: '🏆', title: '成就與排行榜', desc: '收集徽章，跟同學比一比' },
];

export default function SiteFooter() {
    return (
        <footer className="relative z-10 w-full max-w-4xl mt-10 rounded-3xl border border-indigo-500/30 bg-gray-950/80 shadow-[0_0_40px_rgba(99,102,241,0.15)] overflow-hidden">
            {/* 頂飾：霓虹漸層線 */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" aria-hidden="true" />

            <div className="p-6 md:p-8 grid gap-5">
                {/* 品牌區 */}
                <div className="flex items-center gap-4 text-left">
                    <img
                        src={`${import.meta.env.BASE_URL}favicon.png`}
                        alt=""
                        width="48"
                        height="48"
                        loading="lazy"
                        className="w-12 h-12 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0"
                    />
                    <div>
                        <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-pink-300">
                            NEON TYPER 霓虹打字
                        </p>
                        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                            國小英打指法練習遊戲
                        </p>
                    </div>
                </div>

                {/* 三個重點 */}
                <ul className="grid gap-3 sm:grid-cols-3">
                    {POINTS.map(p => (
                        <li
                            key={p.title}
                            className="flex items-start gap-3 rounded-2xl border border-indigo-500/20 bg-gray-900/70 px-4 py-3 text-left"
                        >
                            <span className="text-xl leading-none mt-0.5" aria-hidden="true">{p.icon}</span>
                            <span>
                                <span className="block text-sm font-bold text-gray-100">{p.title}</span>
                                <span className="block text-xs text-gray-400 mt-1 leading-relaxed">{p.desc}</span>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 署名列 */}
            <div className="border-t border-indigo-500/20 px-6 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
                <p className="text-center sm:text-left leading-relaxed">
                    Made with <span aria-label="愛心" className="inline-block mx-0.5">❤️</span> by{' '}
                    <a
                        href="https://cagoooo.github.io/Akai/"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="阿凱老師教育科技創新專區"
                        className="font-bold text-indigo-300 border-b border-dotted border-indigo-300/70 hover:text-pink-300 hover:border-pink-300 transition-colors"
                    >
                        阿凱老師
                    </a>
                    <span className="hidden sm:inline" aria-hidden="true"> ・</span>
                    <span className="block sm:inline">桃園市龍潭區石門國民小學</span>
                </p>
                <span className="text-xs font-bold text-indigo-300 rounded-full border border-indigo-500/40 bg-gray-900/80 px-3 py-1">
                    v{__APP_VERSION__}
                </span>
            </div>
        </footer>
    );
}
