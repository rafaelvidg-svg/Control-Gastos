import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AlertBanner from './components/AlertBanner';
import GastosView from './components/GastosView';
import CategoriasView from './components/CategoriasView';
import ReportesView from './components/ReportesView';
import AuthModal from './components/AuthModal';
import LimiteModal from './components/LimiteModal';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';

export default function App() {
  const [activeTab, setActiveTab] = useState('gastos'); // gastos | categorias | reportes
  const [categorias, setCategorias] = useState([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLimitOpen, setIsLimitOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { user } = useAuth();

  // Cargar categorías disponibles
  const loadCategorias = async () => {
    try {
      const data = await api.getCategorias();
      setCategorias(data);
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  };

  useEffect(() => {
    loadCategorias();
  }, [user, refreshKey]);

  const handleCategoriasChange = () => {
    loadCategorias();
    setRefreshKey((prev) => prev + 1);
  };

  const handleGastoChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Barra de Navegación */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenLimit={() => setIsLimitOpen(true)}
      />

      {/* Alerta de Límite Diario Superado */}
      <AlertBanner onOpenLimit={() => setIsLimitOpen(true)} />

      {/* Contenido Principal según Pestaña */}
      <main className="flex-1">
        {activeTab === 'gastos' && (
          <GastosView
            categorias={categorias}
            onGastoChange={handleGastoChange}
          />
        )}

        {activeTab === 'categorias' && (
          <CategoriasView
            categorias={categorias}
            onCategoriasChange={handleCategoriasChange}
          />
        )}

        {activeTab === 'reportes' && (
          <ReportesView key={refreshKey} />
        )}
      </main>

      {/* Modales */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <LimiteModal
        isOpen={isLimitOpen}
        onClose={() => setIsLimitOpen(false)}
      />

      {/* Pie de página */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Control de Gastos Personales &copy; {new Date().getFullYear()}</span>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-600">Sistema Conectado</span>
            </span>
            <span>React + Tailwind + Express + PostgreSQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
