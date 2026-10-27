import React, { useRef } from 'react';
import { 
  BookMarked, 
  FileSpreadsheet, 
  Download, 
  Plus, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Truck, 
  AlertTriangle, 
  FileDown, 
  LayoutGrid, 
  Sun, 
  Sliders, 
  Mail 
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
  gmailAlertCount?: number;
  onOpenGmailModal?: () => void;
  onToggleLayout?: () => void;
  onToggleTheme?: () => void;
  onToggleDensity?: () => void;
  onOpenCatalog: () => void;
  onOpenNomenclature?: () => void;
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
  gmailAlertCount = 0,
  onOpenGmailModal,
  onToggleLayout,
  onToggleTheme,
  onToggleDensity,
  onOpenCatalog,
  onOpenNomenclature,
  onOpenNewOrder,
  onImportOrdersExcel,
  onExportOrdersExcel,
  onExportJsonBackup,
  onDownloadOrdersTemplate,
  onNavigateHome
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = themeMode === 'dark';

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pendente').length;
  const inProgressOrders = orders.filter(o => o.status === 'Em Andamento' || (o.status as any) === 'Pronto').length;
  const deliveredOrders = orders.filter(o => o.status === 'Entregue').length;
  const overdueOrders = orders.filter(o => {
    const rem = calculateRemainingDays(o.deliveryDate, o.status);
    return rem.isOverdue;
  }).length;
  const under15DaysOrders = orders.filter(o => {
    const rem = calculateRemainingDays(o.deliveryDate, o.status);
    return rem.isUnder15Days;
  }).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportOrdersExcel(file);
      e.target.value = '';
    }
  };

  return (
    <header className={`sticky top-0 z-30 no-print border-b transition-colors shadow-xs ${
      isDark 
        ? 'bg-slate-900 text-white border-slate-800' 
        : 'bg-white text-slate-950 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo & Brand */}
          <div 
            onClick={onNavigateHome}
            className="flex items-center gap-3 cursor-pointer group select-none flex-shrink-0"
          >
            <TermoprolLogo variant="horizontal" theme={isDark ? 'dark' : 'light'} size="md" />
            <span className={`hidden xl:inline-block ml-1 px-2.5 py-1 text-[10px] uppercase font-black rounded-lg border ${
              isDark 
                ? 'bg-blue-900/60 text-blue-200 border-blue-700/50' 
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}>
              Pedidos & Confecção
            </span>
          </div>

          {/* Quick Metrics Bar (Hidden on small screens) */}
          <div className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
            isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center gap-1.5 px-2 font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`} title="Total de Pedidos">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Total: <strong className={isDark ? 'text-white' : 'text-slate-950 font-black'}>{totalOrders}</strong></span>
            </div>
            <div className={`h-3 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
            <div className={`flex items-center gap-1.5 px-2 font-bold ${isDark ? 'text-red-300' : 'text-red-900'}`} title="Pendentes de confecção">
              <Clock className="w-3.5 h-3.5 text-red-600" />
              <span>Pendentes: <strong className={isDark ? 'text-white' : 'text-red-950 font-black'}>{pendingOrders}</strong></span>
            </div>
            <div className={`h-3 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
            <div className={`flex items-center gap-1.5 px-2 font-bold ${isDark ? 'text-amber-300' : 'text-amber-900'}`} title="Em andamento / testes">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Em Andamento: <strong className={isDark ? 'text-white' : 'text-amber-950 font-black'}>{inProgressOrders}</strong></span>
            </div>
            <div className={`h-3 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
            <div className={`flex items-center gap-1.5 px-2 font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`} title="Entregues / Expedidos">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Entregues: <strong className={isDark ? 'text-white' : 'text-emerald-950 font-black'}>{deliveredOrders}</strong></span>
            </div>
            {under15DaysOrders > 0 && (
              <>
                <div className={`h-3 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                <div className={`flex items-center gap-1.5 px-2 font-black py-0.5 rounded-lg border ${
                  isDark ? 'text-amber-300 bg-amber-950/50 border-amber-800/60' : 'text-amber-950 bg-amber-100 border-amber-300'
                }`} title="Pedidos com data de entrega inferior a 15 dias">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>&lt; 15 dias: <strong>{under15DaysOrders}</strong></span>
                </div>
              </>
            )}
            {overdueOrders > 0 && (
              <>
                <div className={`h-3 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
                <div className={`flex items-center gap-1.5 px-2 animate-pulse font-black ${
                  isDark ? 'text-red-300' : 'text-red-900'
                }`} title="Pedidos com prazo estourado!">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Atrasados: <strong>{overdueOrders}</strong></span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Gmail Monitor Button */}
            {onOpenGmailModal && (
              <button
                type="button"
                onClick={onOpenGmailModal}
                className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition border flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer ${
                  gmailAlertCount > 0
                    ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 animate-pulse ring-2 ring-red-400 shadow-md shadow-red-600/30'
                    : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200'
                }`}
                title="Monitor de E-mails do Gmail para Remetentes Cadastrados"
              >
                <Mail className={`w-4 h-4 ${gmailAlertCount > 0 ? 'text-white' : 'text-red-600'}`} />
                <span className="hidden md:inline">Gmail</span>
                {gmailAlertCount > 0 && (
                  <span className="bg-white text-red-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {gmailAlertCount}
                  </span>
                )}
              </button>
            )}

            {/* Catalog Button */}
            <button
              onClick={onOpenCatalog}
              className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition border flex items-center gap-2 cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' 
                  : 'bg-slate-100 hover:bg-amber-50 text-slate-900 border-slate-200'
              }`}
              title="Gerenciar Catálogo e Códigos de Peças"
            >
              <BookMarked className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline">Catálogo</span>
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                isDark ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-amber-200 text-amber-950'
              }`}>
                {catalogCount}
              </span>
            </button>

            {/* Nomenclature Consultation Button */}
            {onOpenNomenclature && (
              <button
                onClick={onOpenNomenclature}
                className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition border flex items-center gap-1.5 cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-blue-300 border-slate-700' 
                    : 'bg-slate-100 hover:bg-blue-50 text-slate-900 border-slate-200'
                }`}
                title="Consultar Nomenclaturas Termoprol (Linha T & QC/QF)"
              >
                <Sliders className="w-4 h-4 text-blue-600" />
                <span className="hidden md:inline">Nomenclaturas</span>
              </button>
            )}

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
              className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Importar Excel</span>
            </button>

            {/* Export Dropdown / Menu */}
            <div className="relative group">
              <button
                className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition border flex items-center gap-1.5 cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                }`}
                title="Exportações e Backups"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span className="hidden md:inline">Exportar</span>
              </button>

              <div className={`absolute right-0 mt-1 w-56 rounded-2xl shadow-2xl py-1 hidden group-hover:block hover:block z-50 border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
              }`}>
                <button
                  onClick={onExportOrdersExcel}
                  className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer ${
                    isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Exportar Pedidos (.xlsx)</span>
                </button>
                <button
                  onClick={onDownloadOrdersTemplate}
                  className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer ${
                    isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <FileDown className="w-4 h-4 text-blue-600" />
                  <span>Baixar Modelo Excel (.xlsx)</span>
                </button>
                <div className={`border-t my-1 ${isDark ? 'border-slate-700' : 'border-slate-100'}`} />
                <button
                  onClick={onExportJsonBackup}
                  className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer ${
                    isDark ? 'hover:bg-slate-700 text-slate-200' : 'hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <Download className="w-4 h-4 text-amber-500" />
                  <span>Backup Completo (.json)</span>
                </button>
              </div>
            </div>

            {/* Layout Toggle Button */}
            {onToggleLayout && (
              <button
                type="button"
                onClick={onToggleLayout}
                className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition border flex items-center gap-1.5 cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 text-blue-300 border-slate-700' 
                    : 'bg-slate-100 hover:bg-blue-50 text-slate-800 border-slate-200'
                }`}
                title="Mudar Layout (Alternar entre Cabeçalho Superior e Barra Lateral ERP)"
              >
                <LayoutGrid className="w-4 h-4 text-blue-600" />
                <span className="hidden lg:inline">Layout: Lateral ERP</span>
              </button>
            )}

            {/* High-Contrast Theme Toggle Button */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className={`px-2.5 py-1.5 text-xs font-black rounded-xl transition border flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
                }`}
                title="Alternar Tema Claro (Escrita Escura) / Escuro"
              >
                <Sun className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                <span className="hidden sm:inline">{isDark ? 'Modo Claro' : 'Layout Claro'}</span>
              </button>
            )}

            {/* New Order Button */}
            <button
              onClick={onOpenNewOrder}
              className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
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
