import { useState, useEffect, useMemo } from 'react';
import { Download, Save, AlertCircle, Loader2, Book, Calculator, LayoutGrid } from 'lucide-react';
import { apiRequest, apiDownload } from '../lib/api';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Helper to safely parse localized decimal inputs
const parseGradeInput = (value) => {
    const text = String(value ?? '').trim();
    if (!text) return null;
    const num = Number(text.replace(',', '.'));
    return Number.isFinite(num) ? num : null;
};

export default function Gradebook() {
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    // Data States
    const [modules, setModules] = useState([]);
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [finalReport, setFinalReport] = useState(null);

    // UI States
    const [activeTab, setActiveTab] = useState('grades'); // 'grades' or 'reports'
    const [localGrades, setLocalGrades] = useState({}); // { "studentId-instrumentId": value }

    // Initial load: Fetch modules
    useEffect(() => {
        const fetchModules = async () => {
            try {
                const token = localStorage.getItem('sara_token');
                const data = await apiRequest('/modules', { token });
                setModules(data || []);
            } catch (err) {
                console.error("Error fetching modules", err);
                if (err.message?.includes('401')) {
                    navigate('/login');
                }
            }
        };
        fetchModules();
    }, [navigate]);

    // Load Preview & Reports when Module changes
    useEffect(() => {
        if (!selectedModuleId) {
            setPreviewData(null);
            setFinalReport(null);
            setLocalGrades({});
            return;
        }

        const fetchModuleData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('sara_token');

                // 1. Fetch Preview (Instruments, Students, Grades...)
                const preview = await apiRequest(`/modules/${selectedModuleId}/preview`, { token });
                setPreviewData(preview);

                // Initialize local grades state to allow live editing
                const initialGrades = {};
                (preview.grades || []).forEach(g => {
                    initialGrades[`${g.studentId}-${g.instrumentId}`] = g.gradeValue !== null && g.gradeValue !== undefined ? String(g.gradeValue) : '';
                });
                setLocalGrades(initialGrades);

                // 2. Fetch Final Report (if the backend calculates it)
                try {
                    const finalRes = await apiRequest(`/modules/${selectedModuleId}/reports/final`, { token });
                    setFinalReport(finalRes);
                } catch (e) {
                    console.warn("Could not fetch final report currently");
                    setFinalReport(null);
                }

            } catch (err) {
                console.error("Error loading module data", err);
                setToast("Error al cargar los datos del módulo.");
                setTimeout(() => setToast(null), 3000);
            } finally {
                setLoading(false);
            }
        };

        fetchModuleData();
    }, [selectedModuleId]);

    // Derived states for rendering
    const students = useMemo(() => {
        return [...(previewData?.students || [])].sort((a, b) => a.studentCode.localeCompare(b.studentCode));
    }, [previewData]);

    const instruments = useMemo(() => {
        return [...(previewData?.instruments || [])].sort((a, b) => a.name.localeCompare(b.name));
    }, [previewData]);

    // Handlers
    const handleGradeChange = (studentId, instrumentId, val) => {
        // Allow typing (so we don't block commas or empty strings midway)
        setLocalGrades(prev => ({
            ...prev,
            [`${studentId}-${instrumentId}`]: val
        }));
    };

    const handleGradeBlur = (studentId, instrumentId) => {
        // Format string on blur safely between 0-10
        const key = `${studentId}-${instrumentId}`;
        const rawVal = localGrades[key];
        const num = parseGradeInput(rawVal);
        let finalVal = '';
        if (num !== null) {
            finalVal = String(Math.max(0, Math.min(10, num)));
        }
        setLocalGrades(prev => ({ ...prev, [key]: finalVal }));
    };

    const handleSave = async () => {
        if (!previewData || !selectedModuleId) return;

        const payload = [];

        students.forEach(student => {
            instruments.forEach(inst => {
                const key = `${student.id}-${inst.id}`;
                const val = parseGradeInput(localGrades[key]);

                if (val !== null) {
                    // Check if different from persisted
                    const persistedGrade = previewData.grades?.find(g => g.studentId === student.id && g.instrumentId === inst.id);
                    // For now, save them all if there's a typed value, backend can diff or upsert easily.
                    payload.push({
                        studentId: student.id,
                        instrumentId: inst.id,
                        gradeValue: val,
                        exerciseGrades: [] // ignoring sub-exercises for simplicity in this general view
                    });
                }
            });
        });

        if (payload.length === 0) {
            setToast('No hay notas para guardar.');
            setTimeout(() => setToast(null), 3000);
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('sara_token');
            await apiRequest('/grades', {
                method: 'POST',
                token,
                body: payload
            });

            setToast('Notas guardadas correctamente.');
            // Refresh Final Reports after save
            try {
                const finalRes = await apiRequest(`/modules/${selectedModuleId}/reports/final`, { token });
                setFinalReport(finalRes);
            } catch (e) { }

        } catch (err) {
            console.error(err);
            setToast('Error al guardar las notas.');
        } finally {
            setSaving(false);
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleExportExcel = async () => {
        if (!selectedModuleId) return;
        try {
            const token = localStorage.getItem('sara_token');
            const { blob, filename } = await apiDownload(`/modules/${selectedModuleId}/export/excel`, { token });
            const downloadName = filename || `modulo_${selectedModuleId}_export.xlsx`;

            const blobUrl = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = blobUrl;
            anchor.download = downloadName;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(blobUrl);

            setToast('Excel exportado correctamente.');
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            console.error("Export error", err);
            setToast('Error al exportar el documento.');
            setTimeout(() => setToast(null), 3000);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Miralmonte Style Hero Banner */}
            <div className="w-full bg-[#9b1522] text-white py-12 px-8 shadow-inner relative overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="max-w-7xl mx-auto relative z-10 w-full">
                    <h2 className="text-4xl font-light mb-2">Cuaderno del <span className="font-bold">Profesor</span></h2>
                    <p className="text-red-100 text-sm tracking-wide">Colegio Miralmonte Cartagena &gt; SARA Académico &gt; Cuaderno</p>
                </div>
            </div>

            <div className="p-8 max-w-full mx-auto w-full flex-1 overflow-y-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-5">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 hidden">Cuaderno del Profesor</h2>
                        <p className="text-gray-500 mt-2">Introduce las calificaciones por instrumento o consulta los reportes finales autocalculados.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="w-full sm:w-64">
                            <select
                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 shadow-sm focus:ring-2 focus:ring-[#9b1522] focus:border-[#9b1522] text-gray-700 font-medium"
                                value={selectedModuleId}
                                onChange={(e) => setSelectedModuleId(e.target.value)}
                            >
                                <option value="">-- Seleccionar Módulo --</option>
                                {modules.map(mod => (
                                    <option key={mod.id} value={String(mod.id)}>
                                        {mod.name} ({mod.academicYear})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleExportExcel}
                            disabled={!selectedModuleId || loading}
                            className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-sm transition-colors disabled:opacity-50"
                        >
                            <Download className="w-5 h-5" />
                            Exportar Excel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedModuleId || loading || saving}
                            className="w-full sm:w-auto bg-[#9b1522] hover:bg-[#80101b] text-white px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold shadow-sm transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Guardar Cambios
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader2 className="w-10 h-10 text-[#9b1522] animate-spin mb-4" />
                        <p className="text-gray-500 text-lg">Cargando datos del módulo...</p>
                    </div>
                ) : !selectedModuleId ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-16 text-center mt-8">
                        <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-500">Ningún módulo seleccionado</h3>
                        <p className="text-gray-500 mt-2">Despliega el menú superior y escoge un curso para visualizar el cuaderno.</p>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex gap-4 mb-6 mt-4 border-b border-gray-200">
                            <button
                                onClick={() => setActiveTab('grades')}
                                className={cn(
                                    "pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors",
                                    activeTab === 'grades' ? "border-indigo-600 text-[#9b1522]" : "border-transparent text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <LayoutGrid className="w-5 h-5" />
                                Calificaciones por Instrumento
                            </button>
                            <button
                                onClick={() => setActiveTab('reports')}
                                className={cn(
                                    "pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors",
                                    activeTab === 'reports' ? "border-indigo-600 text-[#9b1522]" : "border-transparent text-gray-500 hover:text-gray-700"
                                )}
                            >
                                <Calculator className="w-5 h-5" />
                                Reportes Finales Automáticos
                            </button>
                        </div>

                        {/* Tab Content: Grades */}
                        {activeTab === 'grades' && (
                            <div className="bg-white shadow-md border border-gray-200 rounded-xl overflow-hidden">
                                {students.length === 0 || instruments.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">No hay instrumentos o estudiantes definidos en este módulo.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-100 border-b border-gray-200">
                                                    <th className="p-4 border-r font-bold text-slate-800 min-w-[250px] sticky left-0 bg-slate-100 z-10 shadow-[1px_0_0_0_#e5e7eb]">
                                                        Listado de Alumnos
                                                    </th>
                                                    {instruments.map(inst => (
                                                        <th key={inst.id} className="p-3 border-r text-center align-bottom min-w-[120px]">
                                                            <div className="font-semibold text-slate-700 text-sm mb-1" title={inst.name}>
                                                                <span className="line-clamp-2">{inst.name}</span>
                                                            </div>
                                                            <div className="text-xs text-[#9b1522] font-bold bg-[#9b1522]/10 inline-block px-2 py-1 rounded">
                                                                {Number(inst.weightPercent).toFixed(1)}%
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map((student, idx) => (
                                                    <tr key={student.id} className={cn(
                                                        "border-b border-gray-100 hover:bg-[#9b1522]/5 transition-colors",
                                                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                                                    )}>
                                                        <td className="p-3 border-r font-medium text-gray-800 flex items-center gap-3 sticky left-0 bg-inherit shadow-[1px_0_0_0_#e5e7eb] z-10">
                                                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                                {student.studentCode || '?'}
                                                            </div>
                                                            <div className="truncate" title={student.fullName}>
                                                                {student.fullName}
                                                            </div>
                                                        </td>

                                                        {instruments.map(inst => {
                                                            const key = `${student.id}-${inst.id}`;
                                                            return (
                                                                <td key={key} className="p-0 border-r relative group">
                                                                    <input
                                                                        type="text"
                                                                        value={localGrades[key] || ''}
                                                                        onChange={(e) => handleGradeChange(student.id, inst.id, e.target.value)}
                                                                        onBlur={() => handleGradeBlur(student.id, inst.id)}
                                                                        placeholder="-"
                                                                        className="w-full h-full p-4 text-center bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-[#9b1522] font-mono text-slate-700 outline-none transition-all placeholder:text-slate-300"
                                                                    />
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab Content: Final Reports */}
                        {activeTab === 'reports' && (
                            <div className="bg-white shadow-md border border-gray-200 rounded-xl overflow-hidden p-6 animate-in fade-in">
                                {!finalReport ? (
                                    <div className="text-center p-8">
                                        <AlertCircle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                                        <h4 className="text-lg font-bold text-gray-800">Cálculo no disponible aún</h4>
                                        <p className="text-gray-500">Es posible que el backend no haya calculado el reporte final. Asegúrate de guardar notas primero.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <h3 className="text-xl font-bold text-[#9b1522] mb-4 border-b pb-2">Evaluación Final del Módulo</h3>
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#9b1522]/10 text-[#9b1522] border-b border-[#9b1522]/20">
                                                    <th className="p-3 font-bold">Código</th>
                                                    <th className="p-3 font-bold">Alumno</th>
                                                    <th className="p-3 font-bold text-center">Nota Final</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {finalReport.students?.map((row, idx) => {
                                                    const grade = Number(row.finalGrade);
                                                    const isPassed = grade >= 5;
                                                    return (
                                                        <tr key={row.studentId} className={cn("border-b border-gray-100 hover:bg-slate-50", idx % 2 === 0 ? "bg-white" : "bg-slate-50/50")}>
                                                            <td className="p-3 font-mono text-slate-500">{row.studentCode}</td>
                                                            <td className="p-3 font-semibold text-slate-700">{row.studentName}</td>
                                                            <td className="p-3 text-center">
                                                                <div className={cn(
                                                                    "inline-flex font-black px-4 py-1 rounded-full text-lg",
                                                                    isPassed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                                )}>
                                                                    {grade.toFixed(2)}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {toast && (
                    <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
                        <div className="bg-white/20 text-white p-1.5 rounded-full">
                            <Save className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-semibold">{toast}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
