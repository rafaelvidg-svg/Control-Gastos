import React from 'react';
import { 
  Wallet, 
  Receipt, 
  Layers, 
  PieChart, 
  Sliders, 
  LogOut, 
  LogIn, 
  User, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, onOpenAuth, onOpenLimit }) {
  const { user, logout, dailyLimit, dailySpent, alertInfo } = useAuth();

  const percentage = dailyLimit > 0 ? Math.min(Math.round((dailySpent / dailyLimit) * 100), 100) : 0;
  const isOver = dailySpent > dailyLimit;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo y Nombre */}
            <div 
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer select-none" 
              onClick={() => setActiveTab('gastos')}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-base sm:text-lg text-slate-800 tracking-tight block leading-tight truncate">
                  Control de Gastos
                </span>
                <span className="text-[11px] sm:text-xs text-indigo-600 font-medium hidden sm:block">
                  Finanzas Personales
                </span>
              </div>
            </div>

            {/* Navegación por Pestañas (Desktop) */}
            <nav className="hidden md:flex space-x-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('gastos')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeTab === 'gastos'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Gastos</span>
              </button>

              <button
                onClick={() => setActiveTab('categorias')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeTab === 'categorias'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Categorías</span>
              </button>

              <button
                onClick={() => setActiveTab('reportes')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeTab === 'reportes'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Reportes</span>
              </button>
            </nav>

            {/* Presupuesto diario y Acciones de Usuario */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              
              {/* Widget de Límite Diario */}
              <button
                onClick={onOpenLimit}
                className={`group flex items-center space-x-1.5 sm:space-x-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  isOver
                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    : 'bg-indigo-50/50 border-indigo-100 text-slate-700 hover:bg-indigo-50'
                }`}
                title="Configurar límite diario de gasto"
              >
                <div className="text-left">
                  <div className="hidden sm:flex items-center space-x-1 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    <span>Límite Diario</span>
                    <Sliders className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-1.5 font-bold text-xs">
                    <span className="sm:hidden text-[10px] text-slate-500 font-semibold uppercase">Hoy:</span>
                    <span>${dailySpent.toFixed(0)}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-600">${dailyLimit.toFixed(0)}</span>
                  </div>
                </div>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ml-0.5 shrink-0">
                  {isOver ? (
                    <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 animate-pulse" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  )}
                </div>
              </button>

              {/* Usuario / Auth */}
              {user ? (
                <div className="flex items-center space-x-1.5 sm:space-x-2 pl-1.5 sm:pl-2 border-l border-slate-200">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-semibold text-slate-800 block leading-tight">{user.nombre}</span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">{user.email}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm shadow-indigo-200"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="inline">Ingresar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation bar (Estilo App Nativa) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('gastos')}
          className={`flex flex-col items-center py-1 px-3 text-xs font-medium rounded-xl transition-colors ${
            activeTab === 'gastos' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Gastos</span>
        </button>

        <button
          onClick={() => setActiveTab('categorias')}
          className={`flex flex-col items-center py-1 px-3 text-xs font-medium rounded-xl transition-colors ${
            activeTab === 'categorias' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Categorías</span>
        </button>

        <button
          onClick={() => setActiveTab('reportes')}
          className={`flex flex-col items-center py-1 px-3 text-xs font-medium rounded-xl transition-colors ${
            activeTab === 'reportes' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieChart className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Reportes</span>
        </button>
      </nav>
    </>
  );
}
