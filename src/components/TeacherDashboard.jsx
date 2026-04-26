import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Users, RefreshCw, Copy, Check, QrCode, Download, SortAsc, SortDesc, ArrowUpDown, User as UserIcon, Trash2, RotateCcw, LayoutGrid, List } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getTeacherClasses, createClass, getClassStudents, removeStudentFromClass, resetUserStats } from '../utils/userService';
import { useGameStore } from '../store/gameStore';

const TeacherDashboard = ({ userProfile, onClose, onStatsReset }) => {
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [copiedCode, setCopiedCode] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [sortKey, setSortKey] = useState('name'); // Default sort by name
    const [sortOrder, setSortOrder] = useState('asc');
    const [isExporting, setIsExporting] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Custom Modal State
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'danger' // 'danger', 'info', 'warning'
    });

    const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, show: false }));

    const showConfirm = (title, message, onConfirm, type = 'danger') => {
        setConfirmModal({
            show: true,
            title,
            message,
            onConfirm: async () => {
                closeConfirmModal();
                await onConfirm();
            },
            type
        });
    };

    // ... (keep useEffects and other functions as they are)

    // Sorted students list
    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => {
            let valA, valB;

            if (sortKey === 'name') {
                valA = a.displayName || '';
                valB = b.displayName || '';
            } else if (sortKey === 'beginner') {
                valA = a.stats?.beginnerTime || 999;
                valB = b.stats?.beginnerTime || 999;
            } else if (sortKey === 'normal') {
                valA = a.stats?.normalTime || 999;
                valB = b.stats?.normalTime || 999;
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [students, sortKey, sortOrder]);

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    useEffect(() => {
        if (userProfile?.uid) {
            loadClasses();
        }
    }, [userProfile]);

    const handleRemoveStudent = (student) => {
        if (!selectedClass) return;

        showConfirm(
            '確認移除學生？',
            `⚠️ 確定要將「${student.displayName || '此學生'}」從班級中移除嗎？\n這將會清除該學生的班級綁定資料。`,
            async () => {
                setIsLoading(true);
                try {
                    const success = await removeStudentFromClass(student.uid, selectedClass.id);
                    if (success) {
                        setConfirmModal({
                            show: true,
                            title: '移除成功',
                            message: '已成功將學生從班級中移除。',
                            onConfirm: closeConfirmModal,
                            type: 'info'
                        });
                        // Refresh student list
                        await loadStudents(selectedClass.id);
                    } else {
                        alert('移除失敗，請稍後再試。');
                    }
                } catch (error) {
                    console.error("Error removing student:", error);
                    alert('移除發生錯誤。');
                } finally {
                    setIsLoading(false);
                }
            }
        );
    };

    const handleResetStats = (student) => {
        showConfirm(
            '確認重置紀錄？',
            `⚠️ 確定要重置學生 「${student.displayName}」 的遊戲紀錄嗎？\n這將會清除該學生在所有模式的最高分數，並將其從排行榜中移除。\n(此操作無法復原)`,
            async () => {
                setIsLoading(true);
                try {
                    const success = await resetUserStats(student.uid);
                    if (success) {
                        setConfirmModal({
                            show: true,
                            title: '重置成功',
                            message: '此學生的遊戲紀錄已成功重置。',
                            onConfirm: closeConfirmModal,
                            type: 'info'
                        });
                        if (selectedClass) await loadStudents(selectedClass.id);
                    } else {
                        alert('重置失敗，請稍後再試。');
                    }
                } catch (error) {
                    console.error("Error resetting stats:", error);
                    alert('重置發生錯誤。');
                } finally {
                    setIsLoading(false);
                }
            }
        );
    };

    const handleResetSelfStats = () => {
        showConfirm(
            '確認重置個人紀錄？',
            `⚠️ 確定要重置「您自己」的所有遊戲紀錄嗎？\n這將會清除您在所有模式的秒數、連擊與完成數，並將您從全球排行榜中移除。\n(此操作無法復原)`,
            async () => {
                setIsLoading(true);
                try {
                    const success = await resetUserStats(userProfile.uid);
                    if (success) {
                        // 1. Clear local storage to prevent syncStatsToCloud from merging old records back
                        localStorage.removeItem('typeEN_stats');

                        // 2. Update global state to reflect reset stats
                        const setUserProfile = useGameStore.getState().setUserProfile;
                        const defaultStats = {
                            beginnerTime: 999,
                            beginnerCombo: 0,
                            beginnerCompleted: 0,
                            advancedTime: 999,
                            advancedCombo: 0,
                            advancedCompleted: 0,
                            normalTime: 999,
                            normalCombo: 0,
                            normalCompleted: 0,
                            wordTime: 999,
                            wordCombo: 0,
                            wordCompleted: 0,
                            endlessTime: 0,
                            endlessCombo: 0,
                            endlessCompleted: 0,
                            playCount: 0,
                            totalPlayTime: 0,
                            totalWords: 0,
                            totalGames: 0
                        };

                        setUserProfile({
                            ...userProfile,
                            stats: defaultStats
                        });

                        setConfirmModal({
                            show: true,
                            title: '重置成功',
                            message: '您的遊戲紀錄已成功重置。',
                            onConfirm: () => {
                                closeConfirmModal();
                                if (onStatsReset) onStatsReset();
                            },
                            type: 'info'
                        });
                    } else {
                        alert('重置失敗，請稍後再試。');
                    }
                } catch (error) {
                    console.error("Error resetting self stats:", error);
                    alert('重置發生錯誤。');
                } finally {
                    setIsLoading(false);
                }
            }
        );
    };

    const loadClasses = async () => {
        setIsLoading(true);
        const data = await getTeacherClasses(userProfile.uid);
        setClasses(data);
        if (data.length > 0 && !selectedClass) {
            setSelectedClass(data[0]);
        }
        setIsLoading(false);
    };

    // Load student list when selected class changes
    useEffect(() => {
        if (selectedClass?.id) {
            loadStudents(selectedClass.id);
        }
    }, [selectedClass?.id]);

    // Initial load of classes
    useEffect(() => {
        if (userProfile?.uid && classes.length === 0) {
            const fetchClasses = async () => {
                setIsLoading(true);
                const userClasses = await getTeacherClasses(userProfile.uid);
                setClasses(userClasses);
                if (userClasses.length > 0 && !selectedClass) {
                    setSelectedClass(userClasses[0]);
                }
                setIsLoading(false);
            };
            fetchClasses();
        }
    }, [userProfile, classes.length, selectedClass]);

    const loadStudents = async (classId) => {
        setIsLoading(true);
        try {
            const data = await getClassStudents(classId);
            setStudents(data);
        } catch (error) {
            console.error("Error loading students:", error);
        } finally {
            setIsLoading(false);
        }
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

        const headers = ['學生姓名', 'Email', '初學者最佳(s)', '進階最佳(s)', '一般最佳(s)', '單字挑戰最佳(s)', '無盡生存(s)', '總遊玩次數', '總遊玩時長(s)', '成就數量'];

        const rows = students.map(student => [
            `"${student.displayName || '未命名'}"`,
            `"${student.email || ''}"`,
            student.stats?.beginnerTime === 999 ? 'N/A' : (student.stats?.beginnerTime || 'N/A'),
            student.stats?.advancedTime === 999 ? 'N/A' : (student.stats?.advancedTime || 'N/A'),
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-gray-950/95 backdrop-blur-md">
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
                        {/* Teacher Profile Section */}
                        <div className="p-4 border-b border-gray-800 bg-emerald-500/5">
                            <div className="flex items-center gap-3 mb-3">
                                {userProfile?.photoURL ? (
                                    <img src={userProfile.photoURL} alt="Teacher" className="w-10 h-10 rounded-full border border-emerald-500/50" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
                                        <UserIcon className="w-6 h-6 text-emerald-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-white truncate" title={userProfile?.displayName || '導師'}>{userProfile?.displayName || '導師'} (您)</div>
                                    <div className="text-[10px] text-emerald-400/70 truncate uppercase tracking-tighter">系統管理員數據</div>
                                </div>
                                <button
                                    onClick={handleResetSelfStats}
                                    className="p-2 text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all relative z-50 cursor-pointer pointer-events-auto"
                                    title="重置我的個人遊戲紀錄 (從排行榜移除自身數據)"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-['Orbitron']">
                                <div className="bg-gray-800/50 p-1.5 rounded border border-gray-700">
                                    <div className="text-gray-500 scale-90 origin-left">初學紀錄</div>
                                    <div className="text-emerald-400 font-bold">{userProfile?.stats?.beginnerTime === 999 ? '--' : `${userProfile?.stats?.beginnerTime}s`}</div>
                                </div>
                                <div className="bg-gray-800/50 p-1.5 rounded border border-gray-700">
                                    <div className="text-gray-500 scale-90 origin-left">一般紀錄</div>
                                    <div className="text-indigo-400 font-bold">{userProfile?.stats?.normalTime === 999 ? '--' : `${userProfile?.stats?.normalTime}s`}</div>
                                </div>
                            </div>
                        </div>

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
                        {/* CRT overlay for dashboard right side - set to z-[-1] to ensure it's behind content */}
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-[-1]" />

                        {selectedClass ? (
                            <>
                                <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row md:justify-between md:items-center bg-gray-900/50 gap-4 relative z-10">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <h3 className="text-xl font-bold text-white tracking-wide truncate" title={selectedClass.name}>
                                            {selectedClass.name} <span className="text-emerald-400 text-sm font-normal ml-1">({students.length} 名學生)</span>
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <div className="flex items-center bg-gray-800 rounded-lg p-1 mr-2 border border-gray-700">
                                            <span className="text-xs text-gray-500 px-2 flex items-center gap-1"><ArrowUpDown className="w-3 h-3" /> 排序:</span>
                                            <button onClick={() => toggleSort('name')} className={`px-2 py-1 text-xs rounded transition-colors ${sortKey === 'name' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'}`}>姓名</button>
                                            <button onClick={() => toggleSort('beginner')} className={`px-2 py-1 text-xs rounded transition-colors ${sortKey === 'beginner' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'}`}>初學</button>
                                        </div>

                                        <div className="flex items-center bg-gray-800 rounded-lg p-1 mr-2 border border-gray-700" title="切換顯示模式">
                                            <button
                                                onClick={() => setViewMode('grid')}
                                                className={`p-1 text-xs rounded transition-colors ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                <LayoutGrid className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setViewMode('list')}
                                                className={`p-1 text-xs rounded transition-colors ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                <List className="w-4 h-4" />
                                            </button>
                                        </div>
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
                                        <div className={viewMode === 'grid'
                                            ? "grid grid-cols-1 lg:grid-cols-2 gap-4"
                                            : "flex flex-col gap-3"}>
                                            {sortedStudents.map(student => (
                                                viewMode === 'grid' ? (
                                                    <div key={student.uid} className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all group overflow-hidden relative">
                                                        {/* Background Accent */}
                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>

                                                        {/* Action Buttons */}
                                                        <div className="absolute top-3 right-3 flex items-center gap-1 z-50 opacity-60 group-hover:opacity-100 transition-opacity pointer-events-auto">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleResetStats(student);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all cursor-pointer"
                                                                title="重置此學生的遊戲紀錄"
                                                            >
                                                                <RotateCcw className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRemoveStudent(student);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer"
                                                                title="將此學生移出班級"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-800 relative z-10 pr-16">
                                                            {student.photoURL ? (
                                                                <img src={student.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-700" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                                                                    <UserIcon className="w-6 h-6 text-gray-500" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors break-words" title={student.displayName || '未命名特工'}>
                                                                    {student.displayName || '未命名特工'}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 mt-0.5 truncate" title={student.email}>
                                                                    {student.email}
                                                                </div>
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
                                                                <span className="text-gray-400 font-sans">總遊玩次數:</span>
                                                                <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded transition-colors group-hover:bg-blue-500/20">{student.stats?.playCount || 0} 回</span>
                                                            </div>
                                                            <div className="flex justify-between items-center group">
                                                                <span className="text-gray-400 font-sans">總遊玩時長:</span>
                                                                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded transition-colors group-hover:bg-emerald-500/20">{Math.floor((student.stats?.totalPlayTime || 0) / 60)} 分</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div key={student.uid} className="bg-gray-900/40 border border-gray-800 rounded-lg p-3 hover:bg-gray-800/60 transition-all flex items-center gap-4 group">
                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                            {student.photoURL ? (
                                                                <img src={student.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-gray-700 hidden sm:block" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 hidden sm:block">
                                                                    <UserIcon className="w-4 h-4 text-gray-500" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate text-base" title={student.displayName}>
                                                                    {student.displayName || '未命名特工'}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 truncate hidden md:block" title={student.email}>
                                                                    {student.email}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 text-xs font-['Orbitron']">
                                                            <div className="hidden sm:flex flex-col items-end">
                                                                <span className="text-[9px] text-gray-500 font-sans">初學</span>
                                                                <span className="text-emerald-400 font-bold">{student.stats?.beginnerTime === 999 ? '--' : `${student.stats?.beginnerTime}s`}</span>
                                                            </div>
                                                            <div className="hidden sm:flex flex-col items-end">
                                                                <span className="text-[9px] text-gray-500 font-sans">一般</span>
                                                                <span className="text-indigo-400 font-bold">{student.stats?.normalTime === 999 ? '--' : `${student.stats?.normalTime}s`}</span>
                                                            </div>
                                                            <div className="flex flex-col items-end min-w-[50px]">
                                                                <span className="text-[9px] text-gray-500 font-sans">遊玩</span>
                                                                <span className="text-blue-400 font-bold">{student.stats?.playCount || 0}回</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity ml-2 z-50 pointer-events-auto">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleResetStats(student); }}
                                                                className="p-2 text-gray-500 hover:text-yellow-400 transition-all cursor-pointer"
                                                                title="重置紀錄"
                                                            >
                                                                <RotateCcw className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student); }}
                                                                className="p-2 text-gray-500 hover:text-red-400 transition-all cursor-pointer"
                                                                title="移除學生"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
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
            {/* Custom Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-0 max-w-sm w-full animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className={`p-4 ${confirmModal.type === 'danger' ? 'bg-red-500/10 border-b border-red-500/20' : 'bg-emerald-500/10 border-b border-emerald-500/20'}`}>
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${confirmModal.type === 'danger' ? 'text-red-400' : 'text-emerald-400'}`}>
                                {confirmModal.type === 'danger' ? <Trash2 className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                                {confirmModal.title}
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {confirmModal.message}
                            </p>
                            <div className="mt-8 flex gap-3">
                                {confirmModal.type === 'danger' ? (
                                    <>
                                        <button
                                            onClick={closeConfirmModal}
                                            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
                                        >
                                            取消
                                        </button>
                                        <button
                                            onClick={confirmModal.onConfirm}
                                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-lg shadow-red-900/20"
                                        >
                                            確認執行
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={confirmModal.onConfirm}
                                        className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
                                    >
                                        我知道了
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
