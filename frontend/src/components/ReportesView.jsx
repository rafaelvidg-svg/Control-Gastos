import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Hash, 
  Sparkles,
  Lock,
  LogIn
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ReportesView({ onOpenAuth }) {
  const { user } = useAuth();
  const [tipo, setTipo] = useState('mensual'); // diario | semanal | mensual | anual
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    if (!user) {
      setReportData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await api.getReportes(tipo);
      setReportData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al obtener los datos del reporte.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [tipo, user]);

  // Exportar a PDF usando jsPDF y autotable
  const exportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const now = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Encabezado estilizado
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, 210, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Control de Gastos Personales', 14, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reporte Financiero (${tipo.toUpperCase()}) - Generado: ${now}`, 14, 24);

    // Resumen de Métricas
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen General del Período', 14, 45);

    const resumenData = [
      ['Total Gastado', `$${reportData.resumen.total_general.toFixed(2)}`],
      ['Total de Transacciones', `${reportData.resumen.total_registros}`],
      ['Promedio por Gasto', `$${reportData.resumen.promedio_por_gasto.toFixed(2)}`],
      ['Gasto Máximo', `$${reportData.resumen.gasto_maximo.toFixed(2)}`],
      ['Límite Diario Configurado', `$${reportData.resumen.limite_diario.toFixed(2)}`],
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Métrica', 'Valor']],
      body: resumenData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    // Tabla de Desglose por Categoría
    const startDesgloseY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Desglose por Categoría', 14, startDesgloseY);

    const categoriasRows = (reportData.desglose_categorias || []).map((cat) => [
      cat.nombre,
      `$${cat.total.toFixed(2)}`,
      `${cat.porcentaje}%`,
      `${cat.cantidad}`,
    ]);

    autoTable(doc, {
      startY: startDesgloseY + 5,
      head: [['Categoría', 'Total ($)', 'Porcentaje', 'Cantidad']],
      body: categoriasRows.length > 0 ? categoriasRows : [['Sin datos', '$0.00', '0%', '0']],
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Tabla de Historial Detallado de Gastos
    if (reportData.gastos_detalle && reportData.gastos_detalle.length > 0) {
      const startGastosY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalle de Gastos del Período', 14, startGastosY);

      const detalleRows = reportData.gastos_detalle.map((g) => [
        new Date(g.fecha).toLocaleDateString('es-ES'),
        g.descripcion || 'Sin descripción',
        g.categoria_nombre || 'General',
        `$${parseFloat(g.monto).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: startGastosY + 5,
        head: [['Fecha', 'Descripción', 'Categoría', 'Monto ($)']],
        body: detalleRows,
        theme: 'plain',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    }

    doc.save(`reporte-gastos-${tipo}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Exportar a Excel con XLSX
  const exportExcel = () => {
    if (!reportData) return;

    // 1. Hoja de Resumen
    const resumenRows = [
      { Métrica: 'Tipo de Reporte', Valor: tipo.toUpperCase() },
      { Métrica: 'Fecha de Generación', Valor: new Date().toLocaleString('es-ES') },
      { Métrica: 'Total Gastado ($)', Valor: reportData.resumen.total_general },
      { Métrica: 'Total Registros', Valor: reportData.resumen.total_registros },
      { Métrica: 'Promedio por Gasto ($)', Valor: reportData.resumen.promedio_por_gasto },
      { Métrica: 'Gasto Mayor ($)', Valor: reportData.resumen.gasto_maximo },
      { Métrica: 'Límite Diario Configurado ($)', Valor: reportData.resumen.limite_diario },
    ];

    // 2. Hoja de Desglose por Categoría
    const desgloseRows = (reportData.desglose_categorias || []).map((c) => ({
      Categoría: c.nombre,
      'Total ($)': c.total,
      'Porcentaje (%)': parseFloat(c.porcentaje),
      Cantidad: c.cantidad,
    }));

    // 3. Hoja de Detalle de Gastos
    const detalleRows = (reportData.gastos_detalle || []).map((g) => ({
      ID: g.id,
      Fecha: new Date(g.fecha).toLocaleString('es-ES'),
      Descripción: g.descripcion,
      Categoría: g.categoria_nombre,
      'Monto ($)': parseFloat(g.monto),
    }));

    const workbook = XLSX.utils.book_new();

    const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
    XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');

    const wsDesglose = XLSX.utils.json_to_sheet(desgloseRows);
    XLSX.utils.book_append_sheet(workbook, wsDesglose, 'Desglose Categorías');

    if (detalleRows.length > 0) {
      const wsDetalle = XLSX.utils.json_to_sheet(detalleRows);
      XLSX.utils.book_append_sheet(workbook, wsDetalle, 'Detalle de Gastos');
    }

    XLSX.writeFile(
      workbook,
      `reporte-gastos-${tipo}-${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  // Configuración de Gráfica Doughnut (Categorías)
  const doughnutData = {
    labels: (reportData?.desglose_categorias || []).map((c) => c.nombre),
    datasets: [
      {
        data: (reportData?.desglose_categorias || []).map((c) => c.total),
        backgroundColor: (reportData?.desglose_categorias || []).map((c) => c.color || '#6366F1'),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: { size: 11, family: 'Inter' },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const val = context.raw || 0;
            return ` $${val.toFixed(2)}`;
          },
        },
      },
    },
    cutout: '70%',
  };

  // Configuración de Gráfica de Barras (Línea de tiempo)
  const barData = {
    labels: reportData?.timeline?.labels || [],
    datasets: [
      {
        label: 'Gasto ($)',
        data: reportData?.timeline?.data || [],
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(79, 70, 229, 1)',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Gasto: $${parseFloat(ctx.raw || 0).toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, family: 'Inter' } },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (val) => `$${val}`,
          font: { size: 11, family: 'Inter' },
        },
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Encabezado y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <span>Reportes y Analítica Financiera</span>
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </h1>
            {user && (
              <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md">
                {user.nombre}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Visualiza métricas agregadas, comparativas temporales y distribución porcentual de tus gastos.
          </p>
        </div>

        {/* Botones de Selección de Período y Exportación */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Selector de Período */}
          <div className="flex bg-slate-200/80 p-1 rounded-xl border border-slate-300/60 shadow-inner">
            {[
              { id: 'diario', label: 'Diario' },
              { id: 'semanal', label: 'Semanal' },
              { id: 'mensual', label: 'Mensual' },
              { id: 'anual', label: 'Anual' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setTipo(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tipo === p.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Botones de Exportar */}
          <button
            onClick={exportPDF}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-600 rounded-xl text-xs font-bold shadow-sm transition"
            title="Exportar reporte en formato PDF"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>PDF</span>
          </button>

          <button
            onClick={exportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-600 rounded-xl text-xs font-bold shadow-sm transition"
            title="Exportar reporte en formato Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {!user ? (
        <div className="py-20 text-center space-y-4 max-w-md mx-auto bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Inicia sesión para ver tus reportes</h3>
            <p className="text-xs text-slate-500 mt-1">
              Las estadísticas y gráficos financieros se calculan exclusivamente a partir de tus gastos personales.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-200 transition"
          >
            <LogIn className="w-4 h-4" />
            <span>Iniciar Sesión / Registrarme</span>
          </button>
        </div>
      ) : loading ? (
        <div className="py-24 text-center text-slate-400 font-medium text-sm">
          Generando estadísticas del período...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      ) : reportData ? (
        <div className="space-y-8">
          
          {/* Tarjetas KPI de Resumen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="glass-card rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Gastado
                </span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">
                  ${reportData.resumen.total_general.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Período {tipo}</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Transacciones
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Hash className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">
                  {reportData.resumen.total_registros}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Registros en el período</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Promedio por Gasto
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">
                  ${reportData.resumen.promedio_por_gasto.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Ticket promedio</p>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Gasto Mayor
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">
                  ${reportData.resumen.gasto_maximo.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Salida individual más alta</p>
            </div>
          </div>

          {/* Gráficas Chart.js */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Gráfico de Evolución Temporal (Barras - 7 columnas) */}
            <div className="lg:col-span-7 glass-panel rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Evolución de Gastos ({tipo.toUpperCase()})
                  </h3>
                </div>
              </div>

              <div className="h-72 w-full">
                {reportData.resumen.total_registros === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                    No hay suficientes datos para graficar este período.
                  </div>
                ) : (
                  <Bar data={barData} options={barOptions} />
                )}
              </div>
            </div>

            {/* Gráfico de Desglose por Categorías (Dona - 5 columnas) */}
            <div className="lg:col-span-5 glass-panel rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <PieIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Desglose por Categoría
                  </h3>
                </div>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                {reportData.desglose_categorias.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                    Sin gastos categorizados en este período.
                  </div>
                ) : (
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                )}
              </div>
            </div>
          </div>

          {/* Tabla de Desglose Detallado */}
          <div className="glass-panel rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Resumen Detallado por Categoría</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Categoría</th>
                    <th className="px-6 py-3">N° Gastos</th>
                    <th className="px-6 py-3">Total Acumulado</th>
                    <th className="px-6 py-3">Porcentaje</th>
                    <th className="px-6 py-3">Barra de Progreso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.desglose_categorias.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-400 text-xs">
                        No hay registros para calcular porcentajes en este período.
                      </td>
                    </tr>
                  ) : (
                    reportData.desglose_categorias.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="px-6 py-3.5 flex items-center space-x-2.5 font-bold text-slate-800">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color || '#6366F1' }}
                          />
                          <span>{cat.nombre}</span>
                        </td>
                        <td className="px-6 py-3.5">{cat.cantidad}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">
                          ${cat.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-indigo-600">
                          {cat.porcentaje}%
                        </td>
                        <td className="px-6 py-3.5 w-48">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${cat.porcentaje}%`,
                                backgroundColor: cat.color || '#6366F1',
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
