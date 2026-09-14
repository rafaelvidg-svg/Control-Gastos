import React, { useState } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Tag, 
  Layers, 
  Check, 
  X, 
  Palette, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../services/api';

const PRESET_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#64748B', // Slate
];

export default function CategoriasView({ categorias = [], onCategoriasChange }) {
  const [nombre, setNombre] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estado para edición en línea
  const [editingId, setEditingId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editColor, setEditColor] = useState('');

  // Crear categoría
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('El nombre de la categoría es requerido');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await api.createCategoria({
        nombre: nombre.trim(),
        color: selectedColor,
      });

      setSuccessMsg('Categoría creada exitosamente');
      setNombre('');
      if (onCategoriasChange) onCategoriasChange();

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Error al crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  // Iniciar edición
  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditNombre(cat.nombre);
    setEditColor(cat.color || '#3B82F6');
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingId(null);
    setEditNombre('');
    setEditColor('');
  };

  // Guardar edición
  const handleUpdate = async (id) => {
    if (!editNombre.trim()) return;
    try {
      await api.updateCategoria(id, {
        nombre: editNombre.trim(),
        color: editColor,
      });
      setEditingId(null);
      if (onCategoriasChange) onCategoriasChange();
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    }
  };

  // Eliminar categoría
  const handleDelete = async (id, catNombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${catNombre}"? Los gastos asociados se conservarán como sin categoría.`)) {
      return;
    }
    try {
      await api.deleteCategoria(id);
      if (onCategoriasChange) onCategoriasChange();
    } catch (err) {
      alert('Error al eliminar categoría: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <span>Gestión de Categorías</span>
          <Layers className="w-5 h-5 text-indigo-500 shrink-0" />
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Crea, personaliza y organiza las etiquetas con las que agrupas tus gastos para análisis detallados.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Formulario de Creación (4 columnas) */}
        <div className="lg:col-span-4">
          <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-800">Nueva Categoría</h2>
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nombre de la Categoría <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={50}
                    required
                    placeholder="Ej. Gimnasio, Mascotas..."
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Selector de color */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Color Identificador
                </label>
                <div className="grid grid-cols-5 sm:flex sm:flex-wrap gap-2.5 max-w-[260px] sm:max-w-none">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        selectedColor === c ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60 text-sm"
              >
                <Plus className="w-5 h-5" />
                <span>{loading ? 'Creando...' : 'Crear Categoría'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Listado de Categorías (8 columnas) */}
        <div className="lg:col-span-8">
          <div className="glass-panel rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                Categorías Disponibles ({categorias.length})
              </h3>
            </div>

            {categorias.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2 px-4">
                <Palette className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
                <p className="text-sm font-medium">No hay categorías registradas.</p>
              </div>
            ) : (
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {categorias.map((cat) => {
                  const isEditing = editingId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white/80 hover:shadow-sm transition-all flex items-center justify-between gap-2"
                    >
                      {isEditing ? (
                        /* Modo Edición */
                        <div className="flex-1 flex items-center space-x-2 mr-1 min-w-0">
                          <input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent shrink-0"
                          />
                          <input
                            type="text"
                            value={editNombre}
                            onChange={(e) => setEditNombre(e.target.value)}
                            className="flex-1 min-w-0 px-2 py-1 border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => handleUpdate(cat.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg shrink-0"
                            title="Guardar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg shrink-0"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        /* Modo Visualización */
                        <>
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm text-sm shrink-0"
                              style={{ backgroundColor: cat.color || '#3B82F6' }}
                            >
                              {cat.nombre.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-800 text-sm truncate" title={cat.nombre}>{cat.nombre}</span>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => startEdit(cat)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Editar categoría"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id, cat.nombre)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Eliminar categoría"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
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
