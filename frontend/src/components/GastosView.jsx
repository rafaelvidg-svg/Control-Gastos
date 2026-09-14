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

      // Calcular gastos del día actual para verificar contra el límite
      const todayStr = getTodayString();
      const gastosHoy = data.filter((g) => {
        const gDate = new Date(g.fecha).toISOString().split('T')[0];
        return gDate === todayStr;
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

      const response = await api.createGasto({
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion,
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id, 10) : null,
        fecha: formData.fecha || new Date().toISOString(),
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>Registro y Control de Gastos</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ingresa tus transacciones diarias y mantén una trazabilidad organizada de tus salidas de dinero.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulario de Registro (4 columnas en pantallas grandes) */}
        <div className="lg:col-span-4">
          <div className="glass-card rounded-2xl p-6 shadow-sm sticky top-24 border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
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

              {!user && (
                <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-800 flex items-center justify-between gap-2">
                  <span>Debes iniciar sesión para que el gasto quede en tu cuenta.</span>
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="font-bold underline text-indigo-600 hover:text-indigo-800 shrink-0"
                  >
                    Ingresar
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full mt-2 py-3 px-4 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 ${
                  user
                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-lg'
                    : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200'
                }`}
              >
                {user ? (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    <span>{submitting ? 'Registrando...' : 'Registrar Gasto'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Iniciar Sesión para Registrar</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Listado y Filtros (8 columnas) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Barra de Filtros por Rango de Fechas */}
          <div className="glass-panel rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-slate-700 font-bold text-sm">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span>Filtros por Fecha y Categoría</span>
              </div>
              {(filtros.fecha_inicio || filtros.fecha_fin || filtros.categoria_id) && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-medium transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar Filtros</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
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
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Historial de Transacciones</h3>
              {user && (
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md">
                  Gastos de {user.nombre}
                </span>
              )}
            </div>

            {!user ? (
              <div className="py-16 text-center space-y-4 px-6">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">Inicia sesión para ver tus gastos</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Tus gastos son personales y privados. Ingresa con tu cuenta personal para ver tu historial de gastos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión / Registrarme</span>
                </button>
              </div>
            ) : loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Cargando registros...</div>
            ) : gastos.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
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
                      className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0"
                          style={{ backgroundColor: gasto.categoria_color || '#6366F1' }}
                        >
                          {gasto.categoria_nombre ? gasto.categoria_nombre.charAt(0).toUpperCase() : '$'}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 text-sm">
                              {gasto.descripcion || 'Sin descripción'}
                            </span>
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-slate-700 bg-slate-100"
                              style={{
                                borderLeft: `3px solid ${gasto.categoria_color || '#6366F1'}`,
                              }}
                            >
                              {gasto.categoria_nombre || 'General'}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span>{fechaFormateada}</span>
                            <Clock className="w-3 h-3 ml-1" />
                            <span>{horaFormateada}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="font-extrabold text-base text-rose-600">
                          -${parseFloat(gasto.monto).toFixed(2)}
                        </span>

                        <button
                          onClick={() => handleDelete(gasto.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
    </div>
  );
}
