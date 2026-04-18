import { useEffect, useState } from 'react';
import { Plus, Book, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');
    const [newCourseYear, setNewCourseYear] = useState('');
    const [newTeacherName, setNewTeacherName] = useState('');
    const navigate = useNavigate();

    const fetchModules = async () => {
        try {
            const token = localStorage.getItem('sara_token');
            if (!token) {
                navigate('/login');
                return;
            }

            const data = await apiRequest('/modules', { token });
            setCourses(data || []);
        } catch (err) {
            console.error('Error fetching modules', err);
            setError(err.message || 'Error al cargar los modulos.');

            if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
                localStorage.removeItem('sara_token');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchModules();
    }, [navigate]);

    const handleCreateCourse = () => {
        setShowCreateModal(true);
        setError(null);
    };

    const submitCreateCourse = async (e) => {
        e.preventDefault();
        if (!newCourseName.trim()) return;

        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('sara_token');

            await apiRequest('/modules', {
                method: 'POST',
                token,
                body: {
                    name: newCourseName.trim(),
                    academicYear: newCourseYear.trim(),
                    teacherName: newTeacherName.trim() || 'Pendiente de asignar',
                },
            });

            setToast('Modulo creado correctamente');
            setTimeout(() => setToast(null), 3000);
            setShowCreateModal(false);
            setNewCourseName('');
            setNewCourseYear('');
            setNewTeacherName('');
            fetchModules();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error al crear el modulo.');
            setToast(err.message || 'Error al crear el modulo');
            setTimeout(() => setToast(null), 3000);
            setLoading(false);
        }
    };

    const handleDeleteModule = async (e, id, name) => {
        e.stopPropagation();
        if (!window.confirm(`Estas seguro de que quieres eliminar el modulo "${name}" (${id}) y todos sus datos relacionados?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('sara_token');
            await apiRequest(`/modules/${id}`, { method: 'DELETE', token });
            setToast('Modulo eliminado correctamente');
            setTimeout(() => setToast(null), 3000);
            fetchModules();
        } catch (err) {
            console.error(err);
            setToast(err.message || 'Error al eliminar el modulo');
            setTimeout(() => setToast(null), 3000);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#9b1522]" />
                <span className="ml-3 text-lg font-medium text-gray-600">Cargando modulos...</span>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-slate-50">
            <div className="w-full bg-[#9b1522] text-white py-12 px-8 shadow-inner relative overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <h2 className="text-4xl font-light mb-2">Mis <span className="font-bold">Modulos</span></h2>
                    <p className="text-red-100 text-sm tracking-wide">Colegio Miralmonte Cartagena &gt; SARA Academico &gt; Dashboard</p>
                </div>
            </div>

            <div className="p-8 max-w-7xl mx-auto w-full flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                        <p className="text-gray-500 mt-1">Bienvenido a SARA. Gestiona tus modulos y resultados de aprendizaje.</p>
                    </div>
                    <button
                        onClick={handleCreateCourse}
                        className="bg-[#9b1522] hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        Crear nuevo curso
                    </button>
                </div>

                {error ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6 flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-3 shrink-0 mt-0.5" />
                        <p className="text-red-700">{error}</p>
                    </div>
                ) : courses.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                        <Book className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No hay modulos definidos</h3>
                        <p className="mt-2 text-sm text-gray-500">Crea tu primer modulo para comenzar a usar SARA.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow group cursor-pointer relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-[#b08d57] rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-[#9b1522]/10 text-[#9b1522] rounded-lg">
                                        <Book className="w-6 h-6" />
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteModule(e, course.id, course.name)}
                                        title="Eliminar modulo"
                                        className="text-gray-400 hover:text-red-500 p-1 transition-colors z-10"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate" title={course.name}>
                                    {course.name}
                                </h3>

                                <div className="flex gap-4 text-sm text-gray-500 mt-4 flex-col sm:flex-row">
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold text-gray-700">Prof:</span>
                                        <span className="truncate" title={course.teacherName}>{course.teacherName || 'No asignado'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold text-gray-700">Ano:</span> {course.academicYear}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {toast && (
                    <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-blue-500/20 text-blue-400 p-1 rounded-full">
                            <Book className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-medium">{toast}</p>
                    </div>
                )}

                {showCreateModal && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Crear nuevo modulo</h3>
                            <p className="text-gray-500 mb-6">Introduce los datos basicos del modulo para empezar a gestionarlo.</p>

                            <form onSubmit={submitCreateCourse} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del modulo</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCourseName}
                                        onChange={(e) => setNewCourseName(e.target.value)}
                                        className="w-full border-gray-300 border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#9b1522] focus:border-[#9b1522]"
                                        placeholder="Ej: Programacion Multimedia"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ano academico</label>
                                    <input
                                        type="text"
                                        value={newCourseYear}
                                        onChange={(e) => setNewCourseYear(e.target.value)}
                                        className="w-full border-gray-300 border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#9b1522] focus:border-[#9b1522]"
                                        placeholder="Ej: 2025-2026"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Profesor responsable</label>
                                    <input
                                        type="text"
                                        value={newTeacherName}
                                        onChange={(e) => setNewTeacherName(e.target.value)}
                                        className="w-full border-gray-300 border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#9b1522] focus:border-[#9b1522]"
                                        placeholder="Ej: Ana Docente"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-[#9b1522] text-white font-medium hover:bg-[#80101b] rounded-lg transition-colors shadow-sm"
                                    >
                                        Guardar modulo
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
