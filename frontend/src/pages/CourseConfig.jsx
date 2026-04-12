import { useState, useRef, useEffect } from 'react';
import { Settings, FileText, Download, Upload, AlertCircle, Loader2, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { apiRequest, apiDownload } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function CourseConfig() {
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [modules, setModules] = useState([]);
    const [selectedModuleId, setSelectedModuleId] = useState('');
    const excelInputRef = useRef(null);
    const pdfInputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const token = localStorage.getItem('sara_token');
                if (token) {
                    const data = await apiRequest('/modules', { token });
                    setModules(data || []);
                }
            } catch (err) {
                console.error("No se pudieron cargar los módulos para el dropdown", err);
            }
        };
        fetchModules();
    }, []);

    const showToast = (message, isError = false) => {
        if (isError) setError(message);
        else setSuccessMessage(message);
        setTimeout(() => {
            setError(null);
            setSuccessMessage(null);
        }, 5000);
    };

    const handleDownloadTemplate = async (type) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('sara_token');
            const url = type === 'base'
                ? '/modules/export/template/base'
                : '/modules/export/template/filled?variant=1';

            const { blob, filename } = await apiDownload(url, { token });
            const downloadName = filename || `plantilla_sara_${type}.xlsx`;

            const blobUrl = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = blobUrl;
            anchor.download = downloadName;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(blobUrl);

            setToast(`Plantilla ${type === 'base' ? 'vacía' : 'de ejemplo'} descargada con éxito.`);
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            console.error(err);
            showToast('No se pudo descargar la plantilla.', true);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);
            const token = localStorage.getItem('sara_token');
            const formData = new FormData();
            formData.append('file', file);

            if (type === 'excel') {
                const response = await apiRequest('/imports/excel-file', {
                    method: 'POST',
                    token,
                    body: formData,
                });
                showToast(`¡Módulo creado con éxito! Se importaron ${response.raCount} RAs y ${response.studentCount} alumnos.`);
                setTimeout(() => navigate('/dashboard'), 3000);
            } else if (type === 'pdf') {
                if (!selectedModuleId) {
                    showToast('Debes seleccionar un módulo destino antes de subir el PDF.', true);
                    if (pdfInputRef.current) pdfInputRef.current.value = '';
                    setLoading(false);
                    return;
                }

                // For a query parameter (Spring Boot @RequestParam), we can append it to the URL or FormData 
                // However, Vite proxy or fetch can be tricky with multipart and query params. 
                // API uses @RequestParam, usually Spring resolves it from URI /imports/ra?moduleId=...
                // or FormData part "moduleId". 
                formData.append('moduleId', selectedModuleId);

                await apiRequest(`/imports/ra?moduleId=${selectedModuleId}`, {
                    method: 'POST',
                    token,
                    body: formData,
                });
                showToast('Normativa PDF importada con éxito.');
            }
        } catch (err) {
            console.error(err);
            showToast(err.message || `Error al importar el archivo ${type.toUpperCase()}.`, true);
        } finally {
            setLoading(false);
            if (excelInputRef.current) excelInputRef.current.value = '';
            if (pdfInputRef.current) pdfInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-50">
            {/* Miralmonte Style Hero Banner */}
            <div className="w-full bg-[#9b1522] text-white py-12 px-8 shadow-inner relative overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <h2 className="text-4xl font-light mb-2">Configuración e <span className="font-bold">Importación</span></h2>
                    <p className="text-red-100 text-sm tracking-wide">Colegio Miralmonte Cartagena &gt; SARA Académico &gt; Configuración</p>
                </div>
            </div>

            <div className="p-8 max-w-7xl mx-auto w-full flex-1">
                <div className="mb-8">
                    <p className="text-gray-500 mt-2 text-lg">
                        Descarga plantillas oficiales, sube tus hojas de cálculo o importa normativa en PDF para generar tu curso automáticamente.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6 flex items-start animate-in fade-in">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-6 flex items-start animate-in fade-in">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 shrink-0 mt-0.5" />
                        <p className="text-green-700">{successMessage}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Section 1: Templates */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-[#b08d57]/10 p-3 rounded-xl text-[#b08d57]">
                                <Download className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">1. Descargar Plantillas</h3>
                        </div>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Para generar un nuevo curso en SARA de forma automática, debes rellenar la plantilla Excel oficial con tus Resultados de Aprendizaje, Unidades de Trabajo y listado de alumnos.
                        </p>
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => handleDownloadTemplate('base')}
                                disabled={loading}
                                className="w-full flex items-center justify-between bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-[#b08d57]/10 text-gray-700 px-6 py-4 rounded-xl transition-all group disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="w-6 h-6 text-gray-400 group-hover:text-[#b08d57]" />
                                    <div className="text-left">
                                        <span className="block font-semibold">Plantilla Vacía Oficial</span>
                                        <span className="text-sm text-gray-500">Documento base para rellenar desde cero</span>
                                    </div>
                                </div>
                                <Download className="w-5 h-5 text-gray-400 group-hover:text-[#b08d57]" />
                            </button>

                            <button
                                onClick={() => handleDownloadTemplate('filled')}
                                disabled={loading}
                                className="w-full flex items-center justify-between bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-[#b08d57]/10 text-gray-700 px-6 py-4 rounded-xl transition-all group disabled:opacity-50"
                            >
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="w-6 h-6 text-gray-400 group-hover:text-[#b08d57]" />
                                    <div className="text-left">
                                        <span className="block font-semibold">Plantilla de Ejemplo</span>
                                        <span className="text-sm text-gray-500">Versión con datos pre-rellenados para guiarte</span>
                                    </div>
                                </div>
                                <Download className="w-5 h-5 text-gray-400 group-hover:text-[#b08d57]" />
                            </button>
                        </div>
                    </div>

                    {/* Section 2: Upload */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-[#9b1522]/10 p-3 rounded-xl text-[#9b1522]">
                                <Upload className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">2. Importar Datos</h3>
                        </div>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Sube tu plantilla Excel rellenada para crear el curso o importa un documento PDF oficial con la normativa para extraer los RAs mediante Inteligencia Artificial.
                        </p>

                        <div className="flex flex-col gap-6">
                            {/* Excel Upload Box */}
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    ref={excelInputRef}
                                    onChange={(e) => handleFileUpload(e, 'excel')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                                    disabled={loading}
                                />
                                <div className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-all
                                ${loading ? 'border-gray-200 bg-gray-50' : 'border-indigo-200 bg-[#9b1522]/10/50 group-hover:bg-[#9b1522]/10 group-hover:border-indigo-400'}`}>
                                    <FileSpreadsheet className={`w-10 h-10 mx-auto mb-3 ${loading ? 'text-gray-300' : 'text-[#9b1522]'}`} />
                                    <span className={`block font-semibold mb-1 ${loading ? 'text-gray-400' : 'text-[#9b1522]'}`}>
                                        Subir Excel Rellenado
                                    </span>
                                    <span className="text-sm text-gray-500">Haz clic o arrastra un archivo .xlsx aquí</span>
                                </div>
                            </div>

                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">o extraer RAs desde</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            {/* PDF Upload Box */}
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                <h4 className="font-semibold text-gray-800 mb-3 text-sm">3. Extraer RAs mediante IA</h4>
                                <p className="text-xs text-gray-500 mb-4">
                                    Si ya tienes el módulo creado y quieres importar los Resultados de Aprendizaje extrayéndolos automáticamente del PDF oficial de la normativa, selecciona tu módulo y sube el archivo.
                                </p>

                                <select
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm shadow-sm mb-4 focus:ring-2 focus:ring-[#9b1522] focus:border-[#9b1522] text-gray-700"
                                    value={selectedModuleId}
                                    onChange={(e) => setSelectedModuleId(e.target.value)}
                                >
                                    <option value="">-- Seleccionar Módulo Destino --</option>
                                    {modules.map(mod => (
                                        <option key={mod.id} value={String(mod.id)}>
                                            {mod.name} ({mod.academicYear})
                                        </option>
                                    ))}
                                </select>

                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        ref={pdfInputRef}
                                        onChange={(e) => handleFileUpload(e, 'pdf')}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                                        disabled={loading || modules.length === 0}
                                        title={!selectedModuleId ? "Selecciona un módulo primero" : "Subir PDF"}
                                    />
                                    <div className={`w-full border-2 border-dashed rounded-xl p-4 text-center transition-all ${!selectedModuleId ? 'border-gray-200 bg-gray-100 opacity-60' :
                                        loading ? 'border-gray-200 bg-gray-50' : 'border-gray-300 bg-white group-hover:bg-gray-50 group-hover:border-gray-400'}`}>
                                        <FileText className={`w-8 h-8 mx-auto mb-2 ${loading || !selectedModuleId ? 'text-gray-300' : 'text-gray-600'}`} />
                                        <span className={`block font-medium text-sm ${loading || !selectedModuleId ? 'text-gray-400' : 'text-gray-700'}`}>
                                            Subir Normativa (PDF)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                        <div className="bg-white p-6 justify-center items-center flex flex-col rounded-2xl shadow-2xl border border-gray-100">
                            <Loader2 className="w-12 h-12 text-[#9b1522] animate-spin mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Procesando archivo...</h3>
                            <p className="text-gray-500 mt-2 text-center max-w-sm">
                                Esto puede tardar unos segundos dependiendo del tamaño y la complejidad de los datos (la Inteligencia Artificial está leyendo el documento).
                            </p>
                        </div>
                    </div>
                )}

                {toast && (
                    <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50">
                        <div className="bg-white/20 text-white p-1 rounded-full">
                            <Settings className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-medium">{toast}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
