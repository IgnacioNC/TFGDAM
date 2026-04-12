import { NavLink, Outlet } from 'react-router-dom';
import { Home, Settings, ClipboardList, BookOpen, LogOut, Menu, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const NAVIGATION = [
    { name: 'Dashboard', to: '/dashboard', icon: Home },
    { name: 'Configuración', to: '/course-config', icon: Settings },
    { name: 'Actividades', to: '/activities', icon: ClipboardList },
    { name: 'Cuaderno', to: '/gradebook', icon: BookOpen },
];

export default function MainLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-sans">
            {/* Top Red Strip */}
            <div className="w-full bg-[#9b1522] text-white text-xs md:text-sm py-2 px-6 flex justify-between items-center z-30 relative shadow-md">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">968 330 703</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">info@colegiomiralmonte.com</span>
                    </div>
                </div>
                <div className="flex items-center">
                    <button className="bg-[#e4ddc8] text-[#9b1522] font-bold px-4 py-1 text-xs hover:bg-white transition-colors">
                        SARA ACADÉMICO
                    </button>
                    <button
                        onClick={() => {
                            localStorage.removeItem('sara_token');
                            window.location.href = '/login';
                        }}
                        className="flex items-center gap-2 ml-4 hover:text-gray-200 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Cerrar Sesión</span>
                    </button>
                </div>
            </div>

            {/* Main White Navbar */}
            <header className="w-full bg-white border-b border-gray-200 shadow-sm z-20 relative px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="flex items-center">
                        <img
                            src="/logo-miralmonte.png"
                            alt="Colegio Miralmonte Logo"
                            className="h-10 w-auto object-contain"
                        />
                    </div>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex flex-1 justify-center items-center gap-8">
                    {NAVIGATION.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-2 text-[15px] font-medium transition-colors pb-1 border-b-2",
                                    isActive
                                        ? "text-[#9b1522] border-[#9b1522]"
                                        : "text-gray-600 border-transparent hover:text-[#9b1522] hover:border-[#9b1522]/30"
                                )
                            }
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="md:hidden">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-[#9b1522]">
                        <Menu className="w-7 h-7" />
                    </button>
                </div>
            </header>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-[110px] left-0 w-full bg-white shadow-lg border-b border-gray-200 z-40 flex flex-col p-4 animate-in slide-in-from-top-2">
                    {NAVIGATION.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.to}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-4 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-red-50 text-[#9b1522]"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-[#9b1522]"
                                )
                            }
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            {item.name}
                        </NavLink>
                    ))}
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-slate-50 relative w-full">
                <Outlet />
            </main>
        </div>
    );
}
