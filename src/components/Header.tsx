import React, { useRef } from 'react';
import { 
  Settings2, 
  BookMarked, 
  FileSpreadsheet, 
  Download, 
  Plus, 
  Upload,
  Layers,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  FileDown,
  LayoutGrid,
  Sun,
  Moon,
  Sliders
} from 'lucide-react';
import { Order } from '../types';
import { calculateRemainingDays } from '../utils/excel';
import { TermoprolLogo } from './TermoprolLogo';

interface HeaderProps {
  orders: Order[];
  catalogCount: number;
  layoutMode?: 'sidebar' | 'topbar';
  themeMode?: 'light' | 'dark';
  density?: 'comfortable' | 'compact';
  onToggleLayout?: () => void;
  onToggleTheme?: () => void;
  onToggleDensity?: () => void;
  onOpenCatalog: () => void;
  onOpenNewOrder: () => void;
  onImportOrdersExcel: (file: File) => void;
  onExportOrdersExcel: () => void;
  onExportJsonBackup: () => void;
  onDownloadOrdersTemplate: () => void;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  orders,
  catalogCount,
  layoutMode = 'topbar',
  themeMode = 'light',
  density = 'comfortable',
  onToggleLayout,
  onToggleTheme,
  onToggleDensity,
  onOpenCatalog,
  onOpenNewOrder,
  onImportOrdersExcel,
  onExportOrdersExcel,
  onExportJsonBackup,
  onDownloadOrdersTemplate,
  onNavigateHome
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pendente').length;
  const readyOrders = orders.filter(o => o.status === 'Pronto').length;
  const deliveredOrders = orders.filter(o => o.status === 'Entregue').length;
  const overdueOrders = orders.filter(o => {
    const rem = calculateRemainingDays(o.deliveryDate, o.status);
    return rem.isOverdue;
  }).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportOrdersExcel(file);
      e.target.value = '';
    }
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30 no-print border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Brand */}
          <div 
            onClick={onNavigateHome}
            className="flex items-center gap-3 cursor-pointer group select-none flex-shrink-0"
          >
            <TermoprolLogo variant="horizontal" theme="dark" size="md" />
            <span className="hidden xl:inline-block ml-1 px-2.5 py-1 text-[10px] uppercase font-bold bg-blue-900/60 text-blue-200 rounded-lg border border-blue-700/50">
              Pedidos & Confecção
            </span>
          </div>

          {/* Quick Metrics Bar (Hidden on small screens) */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 px-2 text-slate-300" title="Total de Pedidos">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Total: <strong className="text-white">{totalOrders}</strong></span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5 px-2 text-amber-300" title="Pendentes de fabricação">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pendentes: <strong className="text-white">{pendingOrders}</strong></span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5 px-2 text-emerald-300" title="Prontos para expedição">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Prontos: <strong className="text-white">{readyOrders}</strong></span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1.5 px-2 text-slate-400" title="Entregues">
              <Truck className="w-3.5 h-3.5 text-slate-300" />
              <span>Entregues: <strong className="text-white">{deliveredOrders}</strong></span>
            </div>
            {overdueOrders > 0 && (
              <>
                <div className="h-3 w-px bg-slate-700" />
                <div className="flex items-center gap-1.5 px-2 text-red-300 animate-pulse font-bold" title="Pedidos com prazo estourado!">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>Atrasados: <strong className="text-red-200">{overdueOrders}</strong></span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Catalog Button */}
            <button
              onClick={onOpenCatalog}
              className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition border border-slate-700 flex items-center gap-2"
              title="Gerenciar Catálogo e Códigos de Peças"
            >
              <BookMarked className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Catálogo / Códigos</span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-amber-400/30">
                {catalogCount}
              </span>
            </button>

            {/* Excel Import button */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Importar Pedidos a partir de planilha Excel (.xlsx, .xls, .csv)"
              className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-emerald-800 hover:bg-emerald-700 text-emerald-100 rounded-lg transition shadow-sm border border-emerald-700/60 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">Importar Excel</span>
            </button>

            {/* Export Dropdown / Menu */}
            <div className="relative group">
              <button
                className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700 flex items-center gap-1.5"
                title="Exportações e Backups"
              >
                <Download className="w-4 h-4 text-slate-300" />
                <span className="hidden md:inline">Exportar</span>
              </button>

              <div className="absolute right-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 hidden group-hover:block hover:block z-50">
                <button
                  onClick={onExportOrdersExcel}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Exportar Pedidos (.xlsx)</span>
                </button>
                <button
                  onClick={onDownloadOrdersTemplate}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4 text-blue-400" />
                  <span>Baixar Modelo Excel (.xlsx)</span>
                </button>
                <div className="border-t border-slate-700 my-1" />
                <button
                  onClick={onExportJsonBackup}
                  className="w-full text-left px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Backup Completo (.json)</span>
                </button>
              </div>
            </div>

            {/* Layout Toggle Button */}
            {onToggleLayout && (
              <button
                type="button"
                onClick={onToggleLayout}
                className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg transition border border-slate-700 flex items-center gap-1.5"
                title="Mudar Layout (Alternar entre Cabeçalho Superior e Barra Lateral ERP)"
              >
                <LayoutGrid className="w-4 h-4 text-blue-400" />
                <span className="hidden lg:inline">Layout: Lateral ERP</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition border border-slate-700 flex items-center justify-center"
                title="Alternar Modo Escuro / Claro"
              >
                {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-300" />}
              </button>
            )}

            {/* New Order Button */}
            <button
              onClick={onOpenNewOrder}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm shadow-blue-600/30 transition flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Pedido</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
