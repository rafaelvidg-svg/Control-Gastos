import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Calendar, 
  Tag, 
  FileText, 
  DollarSign, 
  Filter, 
  RotateCcw, 
  ArrowDownCircle, 
  Clock, 
  Sparkles,
  Lock,
  LogIn,
  User
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function GastosView({ categorias = [], onGastoChange, onOpenAuth }) {
  const { user, checkDailyLimitAlert, dailyLimit } = useAuth();

  // Helper para obtener fecha local en formato YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Estados del formulario de registro de gastos
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    categoria_id: '',
    fecha: getTodayString(), // Llenado automático con fecha actual
  });

  // Estados de listado y filtros
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtros por rango de fechas
  const [filtros, setFiltros] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    categoria_id: '',
  });

  // Cargar gastos del usuario logeado
  const loadGastos = async () => {
    if (!user) {
      setGastos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const data = await api.getGastos(filtros);
      setGastos(data);

      // Calcular gastos del día actual para verificar contra el límite (en hora local)
      const today = new Date();
      const gastosHoy = data.filter((g) => {
        const d = new Date(g.fecha);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      });
      const totalHoy = gastosHoy.reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0);
      checkDailyLimitAlert(totalHoy, dailyLimit);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'No se pudieron cargar los gastos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGastos();
  }, [filtros, user]);

  // Manejar envío del formulario de registro
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setErrorMsg('Debes iniciar sesión para que el gasto quede guardado en tu cuenta.');
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      setErrorMsg('Por favor introduce un monto válido mayor a 0');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      // Construir la fecha exacta en hora local del usuario para evitar desfases UTC
      let fechaEnvio;
      if (formData.fecha) {
        // formData.fecha es 'YYYY-MM-DD'
        const [y, m, d] = formData.fecha.split('-').map(Number);
        const now = new Date();
        // Crear fecha local manteniendo la hora actual
        const fechaLocal = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
        fechaEnvio = fechaLocal.toISOString();
      } else {
        fechaEnvio = new Date().toISOString();
      }

      const response = await api.createGasto({
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion,
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id, 10) : null,
        fecha: fechaEnvio,
      });

      setSuccessMsg(`¡Gasto registrado exitosamente para ${user.nombre}!`);

      // Actualizar alerta con la respuesta del backend si el límite fue superado
      if (response.alerta_limite) {
        checkDailyLimitAlert(response.alerta_limite.total_gastado_hoy, response.alerta_limite.limite_diario);
      }

      // Limpiar formulario y mantener la fecha actual automática
      setFormData({
        monto: '',
        descripcion: '',
        categoria_id: '',
        fecha: getTodayString(),
      });

      // Recargar lista y avisar al padre para reportes
      await loadGastos();
      if (onGastoChange) onGastoChange();

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar el gasto');
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar gasto
  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este gasto?')) return;
    try {
      await api.deleteGasto(id);
      await loadGastos();
      if (onGastoChange) onGastoChange();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  // Resetear filtros
  const handleResetFilters = () => {
    setFiltros({
      fecha_inicio: '',
      fecha_fin: '',
      categoria_id: '',
    });
  };

  const totalFiltrado = gastos.reduce((acc, g) => acc + parseFloat(g.monto || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Registro y Control de Gastos</span>
            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ingresa tus transacciones diarias y mantén una trazabilidad organizada de tus salidas de dinero.
          </p>
        </div>
      </div>

      {/* Pantalla de Login Requerido (si no hay sesión) */}
      {!user ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 space-y-4 sm:space-y-6 px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-sm">
            <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Acceso Personal Requerido</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              Tus gastos son privados y personales. Inicia sesión con tu cuenta para registrar y ver tu historial.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="inline-flex items-center space-x-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all hover:scale-105 text-sm"
          >
            <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Iniciar Sesión / Registrarme</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Formulario de Registro (4 columnas en pantallas grandes) */}
        <div className="lg:col-span-4">
          <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-sm lg:sticky lg:top-24 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-slate-800">Nuevo Gasto</h2>
              </div>
              {user && (
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold max-w-[120px] truncate" title={user.nombre}>
                  {user.nombre}
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Campo Monto */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Monto ($) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Campo Categoría */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Categoría
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  >
                    <option value="">Selecciona una categoría (Opcional)</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campo Descripción */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Descripción
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <textarea
                    rows="2"
                    placeholder="Ej. Despensa mensual en el supermercado..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
                  />
                </div>
              </div>

              {/* Campo Fecha (Autollenada con la fecha actual) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Fecha del Gasto
                  </label>
                  <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md">
                    Automática
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 text-white font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60 text-sm"
              >
                <PlusCircle className="w-5 h-5" />
                <span>{submitting ? 'Registrando...' : 'Registrar Gasto'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Listado y Filtros (8 columnas) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Barra de Filtros por Rango de Fechas */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-slate-700 font-bold text-sm">
                <Filter className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Filtros por Fecha y Categoría</span>
              </div>
              {(filtros.fecha_inicio || filtros.fecha_fin || filtros.categoria_id) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-medium transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 font-semibold mb-1">Fecha Desde</label>
                <input
                  type="date"
                  value={filtros.fecha_inicio}
                  onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-semibold mb-1">Fecha Hasta</label>
                <input
                  type="date"
                  value={filtros.fecha_fin}
                  onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 font-semibold mb-1">Categoría</label>
                <select
                  value={filtros.categoria_id}
                  onChange={(e) => setFiltros({ ...filtros, categoria_id: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Todas las Categorías</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Resumen del total filtrado */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-600">
              <span>
                Mostrando <strong className="text-slate-800 font-bold">{gastos.length}</strong> registro(s)
              </span>
              <span>
                Total del rango:{' '}
                <strong className="text-indigo-600 font-bold text-sm">
                  ${totalFiltrado.toFixed(2)}
                </strong>
              </span>
            </div>
          </div>

          {/* Tabla / Lista de Gastos */}
          <div className="glass-panel rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2">
              <h3 className="font-bold text-slate-800 text-sm">Historial de Transacciones</h3>
              {user && (
                <span className="text-[10px] sm:text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md truncate max-w-[130px]">
                  Gastos de {user.nombre}
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Cargando registros...</div>
            ) : gastos.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3 px-4">
                <ArrowDownCircle className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
                <p className="text-sm font-medium">No tienes gastos registrados para el período seleccionado.</p>
                <p className="text-xs text-slate-400">¡Registra un nuevo gasto desde el formulario a la izquierda!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
                {gastos.map((gasto) => {
                  const fechaObj = new Date(gasto.fecha);
                  const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const horaFormateada = fechaObj.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={gasto.id}
                      className="px-3.5 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 transition-colors group"
                    >
                      <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1">
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 text-sm"
                          style={{ backgroundColor: gasto.categoria_color || '#6366F1' }}
                        >
                          {gasto.categoria_nombre ? gasto.categoria_nombre.charAt(0).toUpperCase() : '$'}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-slate-800 text-sm truncate block" title={gasto.descripcion || 'Sin descripción'}>
                              {gasto.descripcion || 'Sin descripción'}
                            </span>
                            <span
                              className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded text-slate-700 bg-slate-100 shrink-0 whitespace-nowrap"
                              style={{
                                borderLeft: `3px solid ${gasto.categoria_color || '#6366F1'}`,
                              }}
                            >
                              {gasto.categoria_nombre || 'General'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-[11px] sm:text-xs text-slate-400 mt-0.5">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span className="truncate">{fechaFormateada}</span>
                            <Clock className="w-3 h-3 shrink-0 ml-0.5" />
                            <span className="shrink-0">{horaFormateada}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 sm:space-x-4 shrink-0 text-right">
                        <span className="font-extrabold text-sm sm:text-base text-rose-600 shrink-0">
                          -${parseFloat(gasto.monto).toFixed(2)}
                        </span>

                        <button
                          onClick={() => handleDelete(gasto.id)}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition opacity-70 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
