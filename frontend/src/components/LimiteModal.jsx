import React, { useState } from 'react';
import { Sliders, X, DollarSign, Check, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LimiteModal({ isOpen, onClose }) {
  const { dailyLimit, updateLimit, dailySpent, user } = useAuth();
  const [val, setVal] = useState(dailyLimit.toString());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // Si no hay sesión, mostrar mensaje de inicio de sesión requerido
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 border border-slate-200 relative max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Límite Diario</h3>
              <p className="text-xs text-slate-500">Requiere inicio de sesión</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 text-center py-4">
            Debes iniciar sesión para configurar y guardar tu límite diario de gastos.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Por favor introduce un límite diario válido mayor a 0');
      return;
    }

    try {
      setLoading(true);
      await updateLimit(parsed);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      alert(err.message || 'Error al actualizar límite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 sm:p-6 border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Configurar Límite Diario</h3>
            <p className="text-xs text-slate-500">
              Define tu presupuesto máximo de gastos por día.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Tope Máximo Diario ($)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start space-x-2.5 text-xs text-indigo-900">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              Actualmente has gastado <strong>${dailySpent.toFixed(2)}</strong> hoy. Si el total supera los $
              {val || '0'}, el sistema activará alertas visuales automáticas.
            </span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition flex items-center space-x-1.5 disabled:opacity-60"
            >
              {success ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <span>{loading ? 'Guardando...' : 'Guardar Límite'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
