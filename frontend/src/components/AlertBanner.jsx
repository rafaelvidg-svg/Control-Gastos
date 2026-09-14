import React from 'react';
import { AlertOctagon, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AlertBanner({ onOpenLimit }) {
  const { alertInfo, setAlertInfo } = useAuth();

  if (!alertInfo) return null;

  const isExceeded = alertInfo.excedido;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-3 sm:mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div
        className={`rounded-2xl p-3.5 sm:p-4 shadow-sm border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isExceeded
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-start sm:items-center space-x-3 min-w-0 flex-1">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
              isExceeded ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            {isExceeded ? (
              <AlertOctagon className="w-5 h-5 animate-bounce" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs sm:text-sm leading-snug">
              {isExceeded
                ? '¡Atención! Has superado tu límite diario de gastos'
                : 'Aviso de presupuesto: Te estás acercando a tu límite diario'}
            </h4>
            <p className="text-xs opacity-90 mt-0.5 break-words">
              {isExceeded ? (
                <>
                  Has gastado <strong className="font-semibold">${alertInfo.gastado.toFixed(2)}</strong> hoy.
                  Excedes tu límite de <strong className="font-semibold">${alertInfo.limite.toFixed(2)}</strong> por{' '}
                  <span className="font-bold text-rose-700">+${alertInfo.diferencia.toFixed(2)}</span>.
                </>
              ) : (
                <>
                  Has consumido el 85% de tu presupuesto de hoy (${alertInfo.gastado.toFixed(2)} de $
                  {alertInfo.limite.toFixed(2)}). Te quedan ${alertInfo.diferencia.toFixed(2)}.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-stretch sm:self-center justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5">
          <button
            onClick={onOpenLimit}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
              isExceeded
                ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-200'
                : 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm shadow-amber-200'
            }`}
          >
            <span>Ajustar Límite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAlertInfo(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/5 transition"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
