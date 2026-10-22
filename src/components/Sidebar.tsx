import React, { useRef } from 'react';
import { 
  Settings2, 
  BookMarked, 
  FileSpreadsheet, 
  Download, 
  Plus, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertTriangle,
  ListOrdered,
  Columns3,
  Calendar,
  LayoutGrid,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Sliders,
  FileDown
} from 'lucide-react';
import { Order, ViewMode, LayoutMode, ThemeMode, DensityMode } from '../types';
import { calculateRemainingDays } from '../utils/excel';
import { TermoprolLogo } from './TermoprolLogo';

interface SidebarProps {
  orders: Order[];
  catalogCount: number;
  currentView: 'dashboard' | 'detail';
  dashboardTab: ViewMode;
  statusFilter: string;
  isCollapsed: boolean;
  themeMode: ThemeMode;
  layoutMode: LayoutMode;
  density: DensityMode;
  onToggleCollapse: () => void;
  onSelectTab: (tab: ViewMode) => void;
  onSelectStatusFilter: (status: string) => void;
  onOpenCatalog: () => void;
  onOpenNomenclature?: () => void;
  onOpenNewOrder: () => void;
  onImportOrdersExcel: (file: File) => void;
  onExportOrdersExcel: () => void;
  onDownloadOrdersTemplate: () => void;
  onExportJsonBackup: () => void;
  onToggleTheme: () => void;
  onToggleLayout: () => void;
  onToggleDensity: () => void;
  onNavigateHome: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  orders,
  catalogCount,
  currentView,
  dashboardTab,
  statusFilter,
  isCollapsed,
  themeMode,
  layoutMode,
  density,
  onToggleCollapse,
  onSelectTab,
  onSelectStatusFilter,
  onOpenCatalog,
  onOpenNomenclature,
  onOpenNewOrder,
  onImportOrdersExcel,
  onExportOrdersExcel,
  onDownloadOrdersTemplate,
  onExportJsonBackup,
  onToggleTheme,
  onToggleLayout,
  onToggleDensity,
  onNavigateHome
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pendente').length;
  const readyOrders = orders.filter(o => o.status === 'Pronto').length;
  const deliveredOrders = orders.filter(o => o.status === 'Entregue').length;
  const overdueOrders = orders.filter(o => calculateRemainingDays(o.deliveryDate, o.status).isOverdue).length;

  const completionPercent = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportOrdersExcel(file);
      e.target.value = '';
    }
  };

  return (
    <aside 
      className={`no-print flex-shrink-0 transition-all duration-300 ease-in-out border-r z-30 flex flex-col ${
        themeMode === 'dark' 
          ? 'bg-slate-900 border-slate-800 text-slate-200' 
          : 'bg-slate-900 border-slate-800 text-slate-100'
      } ${isCollapsed ? 'w-20' : 'w-64 lg:w-72'} h-screen sticky top-0 overflow-y-auto flex flex-col`}
    >
      {/* Brand & Collapse Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div 
          onClick={onNavigateHome}
          className="cursor-pointer group overflow-hidden select-none flex-grow flex items-center"
        >
          {isCollapsed ? (
            <TermoprolLogo variant="icon" theme="dark" size="sm" />
          ) : (
            <TermoprolLogo variant="horizontal" theme="dark" size="md" />
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition flex-shrink-0"
          title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Action: New Order */}
      <div className="p-3 border-b border-slate-800/80">
        <button
          onClick={onOpenNewOrder}
          className={`w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="Criar Novo Pedido de Venda"
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span>Novo Pedido</span>}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-grow overflow-y-auto p-3 space-y-6">
        
        {/* Section 1: Dashboard View Mode */}
        <div>
          {!isCollapsed && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1.5">
              Visualização
            </span>
          )}
          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigateHome();
                onSelectTab('table');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                currentView === 'dashboard' && dashboardTab === 'table'
                  ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Visualização em Tabela"
            >
              <ListOrdered className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Tabela de Pedidos</span>}
            </button>

            <button
              onClick={() => {
                onNavigateHome();
                onSelectTab('kanban');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                currentView === 'dashboard' && dashboardTab === 'kanban'
                  ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Quadro Kanban"
            >
              <Columns3 className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Quadro Kanban</span>}
            </button>

            <button
              onClick={() => {
                onNavigateHome();
                onSelectTab('calendar');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                currentView === 'dashboard' && dashboardTab === 'calendar'
                  ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Cronograma de Entregas"
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Cronograma / Agenda</span>}
            </button>
          </div>
        </div>

        {/* Section 2: Quick Status Filters */}
        <div>
          {!isCollapsed && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1.5">
              Filtrar por Status
            </span>
          )}
          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigateHome();
                onSelectStatusFilter('ALL');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Todos os Pedidos"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400 flex-shrink-0" />
                {!isCollapsed && <span>Todos</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {totalOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onNavigateHome();
                onSelectStatusFilter('Pendente');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                statusFilter === 'Pendente'
                  ? 'bg-amber-950/40 text-amber-300 font-semibold border border-amber-800/50'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Pedidos Pendentes"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                {!isCollapsed && <span>Pendentes</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/50">
                  {pendingOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onNavigateHome();
                onSelectStatusFilter('Pronto');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                statusFilter === 'Pronto'
                  ? 'bg-emerald-950/40 text-emerald-300 font-semibold border border-emerald-800/50'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Pedidos Prontos"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {!isCollapsed && <span>Prontos</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                  {readyOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onNavigateHome();
                onSelectStatusFilter('Entregue');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                statusFilter === 'Entregue'
                  ? 'bg-slate-800 text-slate-200 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Pedidos Entregues"
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                {!isCollapsed && <span>Entregues</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  {deliveredOrders}
                </span>
              )}
            </button>

            {overdueOrders > 0 && (
              <button
                onClick={() => {
                  onNavigateHome();
                  onSelectStatusFilter('Atrasado');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                  statusFilter === 'Atrasado'
                    ? 'bg-red-950 text-red-200 font-bold border border-red-800 animate-pulse'
                    : 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title="Pedidos com prazo atrasado"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  {!isCollapsed && <span>Atrasados</span>}
                </div>
                {!isCollapsed && (
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-red-900 text-red-200 border border-red-700">
                    {overdueOrders}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Section 3: Tools & Excel Integration */}
        <div>
          {!isCollapsed && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1.5">
              Ferramentas & Integrações
            </span>
          )}
          <div className="space-y-1">
            <button
              onClick={onOpenCatalog}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-amber-300 hover:bg-slate-800 transition border border-amber-500/20 ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Catálogo de Peças & Códigos"
            >
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-amber-400 flex-shrink-0" />
                {!isCollapsed && <span>Catálogo / Códigos</span>}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
                  {catalogCount}
                </span>
              )}
            </button>

            {onOpenNomenclature && (
              <button
                onClick={onOpenNomenclature}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-blue-300 hover:bg-slate-800 transition border border-blue-500/20 ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
                title="Consultar Nomenclaturas Termoprol (Linha T & QC/QF)"
              >
                <Sliders className="w-4 h-4 text-blue-400 flex-shrink-0" />
                {!isCollapsed && <span>Nomenclaturas (Linha T & QC)</span>}
              </button>
            )}

            {/* Hidden Input for Excel Orders */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-emerald-300 hover:bg-slate-800 transition ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Importar Pedidos do Excel (.xlsx, .xls)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              {!isCollapsed && <span>Importar do Excel</span>}
            </button>

            <button
              onClick={onExportOrdersExcel}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Exportar Pedidos e Ambientes para Excel"
            >
              <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {!isCollapsed && <span>Exportar Excel (.xlsx)</span>}
            </button>

            <button
              onClick={onDownloadOrdersTemplate}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Baixar Modelo de Planilha de Pedidos"
            >
              <FileDown className="w-4 h-4 text-blue-400 flex-shrink-0" />
              {!isCollapsed && <span>Modelo de Planilha</span>}
            </button>

            <button
              onClick={onExportJsonBackup}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition ${
                isCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Exportar Backup Completo JSON"
            >
              <Download className="w-4 h-4 text-amber-400/80 flex-shrink-0" />
              {!isCollapsed && <span>Backup JSON</span>}
            </button>
          </div>
        </div>

        {/* Progress Card (When not collapsed) */}
        {!isCollapsed && (
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Taxa de Conclusão:</span>
              <strong className="text-white">{completionPercent}%</strong>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              {deliveredOrders} de {totalOrders} pedidos entregues
            </p>
          </div>
        )}

      </div>

      {/* Footer Controls: Layout, Theme & Density */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex flex-col gap-2">
        
        {/* Layout Switcher Button */}
        <button
          onClick={onToggleLayout}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition ${
            layoutMode === 'sidebar'
              ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50'
              : 'text-slate-300 hover:bg-slate-800'
          } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
          title="Alternar entre Layout Lateral (Sidebar ERP) e Layout Superior (Topbar)"
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-blue-400 flex-shrink-0" />
            {!isCollapsed && <span>Layout: <strong>Lateral ERP</strong></span>}
          </div>
          {!isCollapsed && <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Trocar</span>}
        </button>

        {/* Quick Density & Theme Toggles */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
            <button
              onClick={onToggleDensity}
              className="hover:text-white flex items-center gap-1 p-1 rounded hover:bg-slate-800 transition"
              title="Alternar densidade de dados"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{density === 'compact' ? 'Compacto' : 'Confortável'}</span>
            </button>

            <button
              onClick={onToggleTheme}
              className="hover:text-white flex items-center gap-1 p-1 rounded hover:bg-slate-800 transition"
              title="Alternar Modo Escuro / Claro"
            >
              {themeMode === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-300" />
                  <span>Escuro</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Alternar Tema"
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-300" />}
            </button>
          </div>
        )}

      </div>
    </aside>
  );
};
