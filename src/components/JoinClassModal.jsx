import React, { useState } from 'react';
import { X, KeySquare } from 'lucide-react';
import { joinClassUser } from '../utils/userService';

const JoinClassModal = ({ userProfile, onClose, onJoinSuccess }) => {
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!code.trim() || !userProfile?.uid) return;

        setIsSubmitting(true);
        setError('');

        const result = await joinClassUser(userProfile.uid, code);

        if (result.success) {
            onJoinSuccess(result.message);
            onClose();
        } else {
            setError(result.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-gray-900 border border-emerald-500/30 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                    <div className="flex items-center gap-2">
                        <KeySquare className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-bold text-white tracking-wider">加入班級 / 小隊</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-gray-800 rounded p-1 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-gray-400 text-sm mb-4 text-center">
                        請輸入導師提供的 6 碼專屬代碼以同步您的任務紀錄
                    </p>

                    <div className="mb-4">
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="例如: NEON88"
                            maxLength={6}
                            required
                            className="w-full bg-gray-800 border-2 border-gray-700 text-white font-mono text-center text-3xl tracking-[0.2em] px-4 py-4 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors uppercase shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                            disabled={isSubmitting}
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm mb-4 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={!code.trim() || isSubmitting}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-xl transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:shadow-none tracking-widest text-lg"
                    >
                        {isSubmitting ? '驗證中...' : '確認加入'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JoinClassModal;
