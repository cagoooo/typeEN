import React, { useState, useEffect } from 'react';
import { X, Plus, Users, RefreshCw, Copy, Check, QrCode, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getTeacherClasses, createClass, getClassStudents } from '../utils/userService';

const TeacherDashboard = ({ userProfile, onClose }) => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [copiedCode, setCopiedCode] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);

    useEffect(() => {
        if (userProfile?.uid) {
            loadClasses();
        }
    }, [userProfile]);

    const loadClasses = async () => {
        setIsLoading(true);
        const data = await getTeacherClasses(userProfile.uid);
        setClasses(data);
        if (data.length > 0 && !selectedClass) {
            setSelectedClass(data[0]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (selectedClass) {
            loadStudents(selectedClass.id);
        }
    }, [selectedClass]);

    const loadStudents = async (classId) => {
        setIsLoading(true);
        const data = await getClassStudents(classId);
        setStudents(data);
        setIsLoading(false);
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        if (!newClassName.trim()) return;
        setIsCreating(true);
        const newClass = await createClass(userProfile.uid, newClassName);
        if (newClass) {
            setNewClassName('');
            await loadClasses();
            setSelectedClass(newClass);
        }
        setIsCreating(false);
    };

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleExportCSV = () => {
        if (!selectedClass || !students.length) return;

        const headers = ['學生姓名', 'Email', '初學者最佳(s)', '一般最佳(s)', '單字挑戰最佳(s)', '無盡生存(s)', '總遊玩次數', '總遊玩時長(s)', '成就數量'];

        const rows = students.map(student => [
            `"${student.displayName || '未命名'}"`,
            `"${student.email || ''}"`,
            student.stats?.beginnerTime === 999 ? 'N/A' : (student.stats?.beginnerTime || 'N/A'),
            student.stats?.normalTime === 999 ? 'N/A' : (student.stats?.normalTime || 'N/A'),
            student.stats?.wordTime === 999 ? 'N/A' : (student.stats?.wordTime || 'N/A'),
            student.stats?.endlessTime || 0,
            student.stats?.playCount || 0,
            student.stats?.totalPlayTime || 0,
            student.achievements?.length || 0
        ]);

        // Add BOM for correct Excel UTF-8 display
        const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${selectedClass.name}_成績匯出_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-gray-950/90 backdrop-blur-md">
            <div className="w-full max-w-6xl h-full max-h-[90vh] bg-gray-900 border border-emerald-500/30 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.2)] flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-emerald-500/30 bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                            <Users className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white font-sans tracking-wide">導師專屬後台</h2>
                            <p className="text-emerald-400 text-sm mt-1">班級與學生成績管理 (Teacher Dashboard)</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-emerald-500/30 rounded-lg transition-colors border border-transparent hover:border-emerald-500/50"
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Left Panel: Class List */}
                    <div className="w-full md:w-1/3 border-r border-emerald-500/30 bg-gray-900/30 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-800">
                            <form onSubmit={handleCreateClass} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    placeholder="輸入新班級名稱..."
                                    className="flex-1 bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    disabled={isCreating}
                                />
                                <button
                                    type="submit"
                                    disabled={!newClassName.trim() || isCreating}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg flex items-center justify-center transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                    title="建立班級"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {classes.length === 0 && !isLoading && (
                                <div className="text-center text-gray-500 mt-10">
                                    <p>尚未建立任何班級</p>
                                    <p className="text-sm">請在上方的輸入框建立新班級</p>
                                </div>
                            )}

                            {classes.map(cls => (
                                <div
                                    key={cls.id}
                                    onClick={() => setSelectedClass(cls)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedClass?.id === cls.id ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-emerald-500/50'}`}
                                >
                                    <div className="font-bold text-white text-lg">{cls.name}</div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">代碼:</span>
                                            <span className="font-mono text-emerald-400 font-bold bg-gray-900 px-2 py-1 border border-emerald-500/30 rounded shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">{cls.code}</span>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); copyCode(cls.code); }}
                                            className="text-gray-400 hover:text-emerald-400 transition-colors p-1"
                                            title="複製代碼"
                                        >
                                            {copiedCode === cls.code ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Student List */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-gray-950/80 relative">
                        {/* CRT overlay for dashboard right side */}
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-0" />

                        {selectedClass ? (
                            <>
                                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-white tracking-wide">{selectedClass.name} <span className="text-emerald-400 text-sm font-normal">({students.length} 名學生)</span></h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleExportCSV}
                                            disabled={students.length === 0}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors border border-blue-700 hover:border-blue-500/50"
                                            title="匯出全班成績與努力紀錄 CSV"
                                        >
                                            <Download className="w-4 h-4" />
                                            匯出 CSV
                                        </button>
                                        <button
                                            onClick={() => setShowQrModal(true)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-emerald-900/30 text-emerald-400 rounded-lg text-sm transition-colors border border-gray-700 hover:border-emerald-500/50"
                                            title="顯示加入班級 QR Code"
                                        >
                                            <QrCode className="w-4 h-4" />
                                            QRCode
                                        </button>
                                        <button
                                            onClick={() => loadStudents(selectedClass.id)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-emerald-900/30 text-emerald-400 rounded-lg text-sm transition-colors border border-gray-700 hover:border-emerald-500/50"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                            重新整理
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto p-4 sm:p-6 relative z-10">
                                    {isLoading ? (
                                        <div className="flex justify-center items-center h-40">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                                        </div>
                                    ) : students.length === 0 ? (
                                        <div className="text-center text-gray-500 mt-20">
                                            <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                            <p className="text-xl font-bold mb-2">目前沒有學生</p>
                                            <p>請將班級代碼 <span className="font-mono text-emerald-400 font-bold bg-gray-800 px-2 py-1 rounded mx-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">{selectedClass.code}</span> 提供給學生</p>
                                            <p className="text-sm mt-2 text-gray-600">學生可在首頁成就選單旁點擊「加入班級」輸入此代碼</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {students.map(student => (
                                                <div key={student.uid} className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all">
                                                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-800">
                                                        {student.photoURL ? (
                                                            <img src={student.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-700" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                                                                <UserIcon className="w-6 h-6 text-gray-500" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="font-bold text-white truncate text-lg">{student.displayName || '未命名特工'}</div>
                                                            <div className="text-xs text-gray-500 truncate">{student.email}</div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 text-sm font-['Orbitron']">
                                                        <div className="flex justify-between items-center group">
                                                            <span className="text-gray-400 font-sans">初學者模式:</span>
                                                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded transition-colors group-hover:bg-emerald-500/20">{student.stats?.beginnerTime === 999 ? '--' : `${student.stats?.beginnerTime}s`}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center group">
                                                            <span className="text-gray-400 font-sans">一般模式:</span>
                                                            <span className="text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded transition-colors group-hover:bg-indigo-500/20">{student.stats?.normalTime === 999 ? '--' : `${student.stats?.normalTime}s`}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center group">
                                                            <span className="text-gray-400 font-sans">單字挑戰:</span>
                                                            <span className="text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded transition-colors group-hover:bg-yellow-500/20">{student.stats?.wordTime === 999 ? '--' : `${student.stats?.wordTime}s`}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center group">
                                                            <span className="text-gray-400 font-sans">無盡生存:</span>
                                                            <span className="text-fuchsia-400 font-bold bg-fuchsia-500/10 px-2 py-0.5 rounded transition-colors group-hover:bg-fuchsia-500/20">{student.stats?.endlessTime || 0}s</span>
                                                        </div>
                                                        <div className="flex justify-between items-center group pt-2 border-t border-gray-800 mt-2">
                                                            <span className="text-gray-400 font-sans">總遊玩次數:</span>
                                                            <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded transition-colors group-hover:bg-blue-500/20">{student.stats?.playCount || 0} 回</span>
                                                        </div>
                                                        <div className="flex justify-between items-center group">
                                                            <span className="text-gray-400 font-sans">總遊玩時長:</span>
                                                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded transition-colors group-hover:bg-emerald-500/20">{Math.floor((student.stats?.totalPlayTime || 0) / 60)} 分 {(student.stats?.totalPlayTime || 0) % 60} 秒</span>
                                                        </div>
                                                        <div className="flex justify-between items-center pt-2 border-t border-gray-800 mt-2">
                                                            <span className="text-gray-400 font-sans">成就獎章:</span>
                                                            <span className="text-orange-400 font-bold drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]">🏆 {student.achievements?.length || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center relative z-10">
                                <div className="p-6 bg-gray-900/50 rounded-full mb-6 border border-gray-800 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                                    <Users className="w-20 h-20 opacity-30 text-emerald-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-gray-300">班級資料中心</h3>
                                <p className="text-gray-500">請從左側選擇或建立一個新班級</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* QR Code Modal */}
            {showQrModal && selectedClass && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
                    <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.2)] p-8 max-w-sm w-full animate-in fade-in zoom-in duration-300 relative">
                        <button
                            onClick={() => setShowQrModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-white tracking-wide mb-2">{selectedClass.name}</h3>
                            <p className="text-emerald-400">掃描 QR Code 或點擊連結加入</p>
                        </div>

                        <div className="flex justify-center bg-white p-4 rounded-xl mb-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <QRCodeSVG
                                value={`${window.location.origin}${window.location.pathname}?classCode=${selectedClass.code}`}
                                size={200}
                                level="H"
                                includeMargin={false}
                            />
                        </div>

                        <div className="text-center">
                            <p className="text-gray-400 text-sm mb-2">班級代碼</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="font-mono text-3xl font-bold tracking-widest text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
                                    {selectedClass.code}
                                </span>
                                <button
                                    onClick={() => copyCode(selectedClass.code)}
                                    className="p-2 text-gray-400 hover:text-emerald-400 transition-colors bg-gray-800 rounded-lg border border-gray-700 hover:border-emerald-500/50"
                                    title="複製代碼"
                                >
                                    {copiedCode === selectedClass.code ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
