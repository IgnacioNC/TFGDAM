import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Loader2, Save, Trash2, Book } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Activities() {
    const [modules, setModules] = useState([]);
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    // Forms State
    const [raForm, setRaForm] = useState({ code: '', name: '', weightPercent: '' });
    const [utForm, setUtForm] = useState({ name: '', evaluationPeriod: '' });
    const [instForm, setInstForm] = useState({ name: '', weightPercent: '', utId: '' });

    // Initial load: Fetch modules
    useEffect(() => {
        const fetchModules = async () => {
            try {
                const token = localStorage.getItem('sara_token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const data = await apiRequest('/modules', { token });
                setModules(data || []);
            } catch (err) {
                console.error(err);
                if (err.message && err.message.includes('401')) {
                    navigate('/login');
                }
            }
        };
        fetchModules();
    }, [navigate]);

    const fetchModuleData = async (moduleId) => {
        if (!moduleId) {
            setPreviewData(null);
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('sara_token');
            const preview = await apiRequest(`/modules/${moduleId}/preview`, { token });
            setPreviewData(preview);
        } catch (err) {
            console.error(err);
            setToast('Error al cargar la estructura del módulo.');
            setTimeout(() => setToast(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModuleData(selectedModuleId);
    }, [selectedModuleId]);

    // Helpers to create entities
    const handleCreateRA = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('sara_token');
            await apiRequest(`/modules/${selectedModuleId}/ras`, {
                method: 'POST',
                token,
                body: { ...raForm, weightPercent: Number(raForm.weightPercent) }
            });
            setToast('RA creado correctamente.');
            setRaForm({ code: '', name: '', weightPercent: '' });
            fetchModuleData(selectedModuleId);
        } catch (err) {
            console.error(err);
            setToast('Error al crear el Resultado de Aprendizaje.');
        } finally {
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleCreateUT = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('sara_token');
            await apiRequest(`/modules/${selectedModuleId}/uts`, {
                method: 'POST',
                token,
                body: { ...utForm, evaluationPeriod: Number(utForm.evaluationPeriod) }
            });
            setToast('Unidad de Trabajo creada.');
            setUtForm({ name: '', evaluationPeriod: '' });
            fetchModuleData(selectedModuleId);
        } catch (err) {
            console.error(err);
            setToast('Error al crear la UT.');
        } finally {
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleCreateInstrument = async (e) => {
        e.preventDefault();
        if (!instForm.utId) {
            setToast('Selecciona una Unidad de Trabajo (UT) primero.');
            setTimeout(() => setToast(null), 3000);
            return;
        }
        try {
            const token = localStorage.getItem('sara_token');
            await apiRequest(`/uts/${instForm.utId}/instruments`, {
                method: 'POST',
                token,
                body: { name: instForm.name, weightPercent: Number(instForm.weightPercent) }
            });
            setToast('Instrumento creado e insertado en la UT.');
            setInstForm({ name: '', weightPercent: '', utId: '' });
            fetchModuleData(selectedModuleId);
        } catch (err) {
            console.error(err);
            setToast('Error al crear el instrumento.');
        } finally {
            setTimeout(() => setToast(null), 3000);
        }
    };

    // Derived states
    const ras = previewData?.ras || [];
    const uts = previewData?.uts || [];
    const instruments = previewData?.instruments || [];

    return (
        <div className="w-full h-full flex flex-col bg-slate-50">
            {/* Miralmonte Style Hero Banner */}
            <div className="w-full bg-[#9b1522] text-white py-12 px-8 shadow-inner relative overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <h2 className="text-4xl font-light mb-2">Gestión de <span className="font-bold">Actividades</span></h2>
                    <p className="text-red-100 text-sm tracking-wide">Colegio Miralmonte Cartagena &gt; SARA Académico &gt; Actividades</p>
                </div>
            </div>

            <div className="p-8 max-w-7xl mx-auto w-full flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-5">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Actividades y UTs</h2>
                        <p className="text-gray-500 mt-1">Configura manualmente Unidades de Trabajo, RAs e Instrumentos.</p>
                    </div>
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
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader2 className="w-10 h-10 text-[#9b1522] animate-spin mb-4" />
                        <p className="text-gray-500">Cargando datos estructurales del módulo...</p>
                    </div>
                ) : !selectedModuleId ? (
                    <div className="bg-white border-2 border-dashed text-center p-12 border-gray-300 rounded-xl mt-8">
                        <div className="bg-[#9b1522]/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-[#9b1522]">
                            <ClipboardList className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Módulo no seleccionado</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Por favor, elige un Módulo en el menú desplegable superior para poder configurar o añadir nuevas actividades manuales y ponderaciones.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* COL 1: RAs */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Resultados Aprendizaje (RAs)</h3>
                            <div className="flex-1 overflow-y-auto max-h-64 mb-6 space-y-2 pr-2">
                                {ras.length === 0 ? <p className="text-sm text-gray-400">Sin RAs</p> : ras.map(ra => (
                                    <div key={ra.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex justify-between items-center text-sm">
                                        <span className="font-semibold">{ra.code}</span>
                                        <span className="text-[#9b1522] font-bold">{ra.weightPercent}%</span>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleCreateRA} className="space-y-3 mt-auto bg-slate-50 p-4 rounded-xl">
                                <h4 className="font-semibold text-sm text-gray-700">Añadir RA Nuevo</h4>
                                <input type="text" placeholder="Código (ej. RA1)" required value={raForm.code} onChange={e => setRaForm({ ...raForm, code: e.target.value })} className="w-full text-sm border-gray-300 border rounded-md px-3 py-2" />
                                <input type="text" placeholder="Nombre descriptivo" required value={raForm.name} onChange={e => setRaForm({ ...raForm, name: e.target.value })} className="w-full text-sm border-gray-300 border rounded-md px-3 py-2" />
                                <input type="number" step="0.01" placeholder="Ponderación (%)" required value={raForm.weightPercent} onChange={e => setRaForm({ ...raForm, weightPercent: e.target.value })} className="w-full text-sm border-gray-300 border rounded-md px-3 py-2" />
                                <button type="submit" className="w-full bg-slate-800 text-white text-sm font-medium py-2 rounded-md hover:bg-slate-700">Crear RA</button>
                            </form>
                        </div>

                        {/* COL 2: UTs */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Unidades de Trabajo (UTs)</h3>
                            <div className="flex-1 overflow-y-auto max-h-64 mb-6 space-y-2 pr-2">
                                {uts.length === 0 ? <p className="text-sm text-gray-400">Sin UTs</p> : uts.map(ut => (
                                    <div key={ut.id} className="bg-[#9b1522]/10 p-3 rounded-lg border border-[#9b1522]/20 flex flex-col text-sm">
                                        <span className="font-bold text-[#9b1522]">{ut.name}</span>
                                        <span className="text-[#9b1522] text-xs mt-1">Eval: {ut.evaluationPeriod}</span>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleCreateUT} className="space-y-3 mt-auto bg-[#9b1522]/10 p-4 rounded-xl">
                                <h4 className="font-semibold text-sm text-[#9b1522]">Añadir UT Nueva</h4>
                                <input type="text" placeholder="Nombre (ej. UT1 Diseño Base)" required value={utForm.name} onChange={e => setUtForm({ ...utForm, name: e.target.value })} className="w-full text-sm border-[#9b1522]/30 border rounded-md px-3 py-2" />
                                <input type="number" placeholder="Periodo Eval. (1, 2 o 3)" required min="1" max="3" value={utForm.evaluationPeriod} onChange={e => setUtForm({ ...utForm, evaluationPeriod: e.target.value })} className="w-full text-sm border-[#9b1522]/30 border rounded-md px-3 py-2" />
                                <button type="submit" className="w-full bg-[#9b1522] text-white text-sm font-medium py-2 rounded-md hover:bg-[#80101b]">Crear UT</button>
                            </form>
                        </div>

                        {/* COL 3: Instruments */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Instrumentos (Actividades)</h3>
                            <div className="flex-1 overflow-y-auto max-h-64 mb-6 space-y-2 pr-2">
                                {instruments.length === 0 ? <p className="text-sm text-gray-400">Sin Instrumentos</p> : instruments.map(inst => (
                                    <div key={inst.id} className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex flex-col text-sm">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-orange-900">{inst.name}</span>
                                            <span className="text-orange-600 font-bold bg-orange-200 px-2 py-0.5 rounded text-xs">{inst.weightPercent}%</span>
                                        </div>
                                        <span className="text-orange-700 text-xs mt-1">UT Asignada: {uts.find(u => u.id === inst.utId)?.name || `UT #${inst.utId}`}</span>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleCreateInstrument} className="space-y-3 mt-auto bg-orange-50 p-4 rounded-xl border border-orange-100">
                                <h4 className="font-semibold text-sm text-orange-900">Añadir Actividad a una UT</h4>
                                <select required value={instForm.utId} onChange={e => setInstForm({ ...instForm, utId: e.target.value })} className="w-full text-sm border-orange-200 border rounded-md px-3 py-2 bg-white">
                                    <option value="">Selecciona UT Destino...</option>
                                    {uts.map(ut => <option key={ut.id} value={ut.id}>{ut.name}</option>)}
                                </select>
                                <input type="text" placeholder="Nombre (ej. Examen Parcial)" required value={instForm.name} onChange={e => setInstForm({ ...instForm, name: e.target.value })} className="w-full text-sm border-orange-200 border rounded-md px-3 py-2" />
                                <input type="number" step="0.01" placeholder="Ponderación Instrumental (%)" required value={instForm.weightPercent} onChange={e => setInstForm({ ...instForm, weightPercent: e.target.value })} className="w-full text-sm border-orange-200 border rounded-md px-3 py-2" />
                                <button type="submit" className="w-full bg-orange-500 text-white text-sm font-medium py-2 rounded-md hover:bg-orange-600">Crear Instrumento</button>
                            </form>
                        </div>
                    </div>
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
