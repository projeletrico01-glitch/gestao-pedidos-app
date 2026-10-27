import React, { useRef } from 'react';
import { 
  ListOrdered, 
  Columns3, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Truck, 
  AlertTriangle, 
  Plus, 
  BookMarked, 
  FileSpreadsheet, 
  Download, 
  FileDown, 
  LayoutGrid, 
  Sun, 
  Moon, 
  Sliders, 
  PanelLeftClose, 
  PanelLeft,
  Mail
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { calculateRemainingDays } from '../utils/excel';
import { TermoprolLogo } from './TermoprolLogo';

interface SidebarProps {
  orders: Order[];
  catalogCount: number;
  currentView: 'dashboard' | 'detail';
  dashboardTab: 'table' | 'kanban' | 'calendar';
  statusFilter: string;
  isCollapsed: boolean;
  themeMode?: 'light' | 'dark';
  layoutMode?: 'sidebar' | 'topbar';
  density?: 'comfortable' | 'compact';
  gmailAlertCount?: number;
  onOpenGmailModal?: () => void;
  onToggleCollapse: () => void;
  onSelectTab: (tab: 'table' | 'kanban' | 'calendar') => void;
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
  themeMode = 'light',
  layoutMode = 'sidebar',
  density = 'comfortable',
  gmailAlertCount = 0,
  onOpenGmailModal,
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
  const isDark = themeMode === 'dark';

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pendente').length;
  const inProgressOrders = orders.filter(o => o.status === 'Em Andamento' || (o.status as any) === 'Pronto').length;
  const deliveredOrders = orders.filter(o => o.status === 'Entregue').length;
  const overdueOrders = orders.filter(o => calculateRemainingDays(o.deliveryDate, o.status).isOverdue).length;
  const under15DaysOrders = orders.filter(o => calculateRemainingDays(o.deliveryDate, o.status).isUnder15Days).length;

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
        isDark 
          ? 'bg-slate-900 border-slate-800 text-slate-200' 
          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
      } ${isCollapsed ? 'w-20' : 'w-64 lg:w-72'} h-screen sticky top-0 overflow-y-auto flex flex-col`}
    >
      {/* Brand & Collapse Header */}
      <div className={`h-16 flex items-center justify-between px-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div 
          onClick={onNavigateHome}
          className="cursor-pointer group overflow-hidden select-none flex-grow flex items-center"
        >
          {isCollapsed ? (
            <TermoprolLogo variant="icon" theme={isDark ? 'dark' : 'light'} size="sm" />
          ) : (
            <TermoprolLogo variant="horizontal" theme={isDark ? 'dark' : 'light'} size="md" />
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className={`p-1.5 ml-1 rounded-lg transition flex-shrink-0 cursor-pointer ${
            isDark 
              ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
          }`}
          title={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Action: New Order */}
      <div className={`p-3 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
        <button
          onClick={onOpenNewOrder}
          className={`w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
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
            <span className={`text-[10px] uppercase font-black tracking-wider px-2 block mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Visualização
            </span>
          )}
          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigateHome();
                onSelectTab('table');
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentView === 'dashboard' && dashboardTab === 'table'
                  ? isDark 
                    ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30'
                    : 'bg-blue-50 text-blue-800 font-extrabold border border-blue-200 shadow-xs'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950'
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
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentView === 'dashboard' && dashboardTab === 'kanban'
                  ? isDark 
                    ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30'
                    : 'bg-blue-50 text-blue-800 font-extrabold border border-blue-200 shadow-xs'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950'
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
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentView === 'dashboard' && dashboardTab === 'calendar'
                  ? isDark 
                    ? 'bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30'
                    : 'bg-blue-50 text-blue-800 font-extrabold border border-blue-200 shadow-xs'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950'
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
            <span className={`text-[10px] uppercase font-black tracking-wider px-2 block mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Filtrar por Status
            </span>
          )}
          <div className="space-y-1">
            <button
              onClick={() => {
                onNavigateHome();
                onSelectStatusFilter('ALL');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? isDark
                    ? 'bg-slate-800 text-white font-bold'
                    : 'bg-slate-100 text-slate-950 font-extrabold border border-slate-300 shadow-xs'
                  : isDark
                    ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Todos os Pedidos"
            >
              <div className="flex items-center gap-2 font-bold">
                <Layers className="w-4 h-4 text-blue-600 flex-shrink-0" />
                {!isCollapsed && <span>Todos</span>}
              </div>
              {!isCollapsed && (
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-900'
                }`}>
                  {totalOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onNavigateHome();
                onSelectStatusFilter('Pendente');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                statusFilter === 'Pendente'
                  ? isDark
                    ? 'bg-red-950/50 text-red-300 font-bold border border-red-800/60 shadow-xs'
                    : 'bg-red-100 text-red-950 font-black border border-red-300 shadow-xs'
                  : isDark
                    ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    : 'text-slate-800 hover:bg-red-50 hover:text-red-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Pedidos Pendentes (Vermelho)"
            >
              <div className="flex items-center gap-2 font-bold">
                <Clock className="w-4 h-4 text-red-600 flex-shrink-0" />
                {!isCollapsed && <span>Pendentes</span>}
              </div>
              {!isCollapsed && (
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                  isDark ? 'bg-red-950 text-red-300 border border-red-800/60' : 'bg-red-200 text-red-950'
                }`}>
                  {pendingOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onNavigateHome();
                onSelectStatusFilter('Em Andamento');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                statusFilter === 'Em Andamento' || statusFilter === 'Pronto'
                  ? isDark
                    ? 'bg-amber-950/50 text-amber-300 font-bold border border-amber-800/60 shadow-xs'
                    : 'bg-amber-100 text-amber-950 font-black border border-amber-300 shadow-xs'
                  : isDark
                    ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    : 'text-slate-800 hover:bg-amber-50 hover:text-amber-950'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Pedidos Em Andamento (Amarelo)"
            >
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
                {!isCollapsed && <span>Em Andamento</span>}
              </div>
              {!isCollapsed && (
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                  isDark ? 'bg-amber-950 text-amber-300 border border-amber-800/60' : 'bg-amber-200 text-amber-950'
                }`}>
                  {inProgressOrders}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                onNavigateHome();
                onSelectStatusFilter('Entregue');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                statusFilter === 'Entregue'
                  ? isDark
                    ? 'bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-800/60 shadow-xs'
                    : 'bg-emerald-100 text-emerald-950 font-black border border-emerald-300 shadow-xs'
                  : isDark
                    ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    : 'text-slate-800 hover:bg-emerald-50 hover:text-emerald-950'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Pedidos Entregues (Verde)"
            >
              <div className="flex items-center gap-2 font-bold">
                <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                {!isCollapsed && <span>Entregues</span>}
              </div>
              {!isCollapsed && (
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                  isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-emerald-200 text-emerald-950'
                }`}>
                  {deliveredOrders}
                </span>
              )}
            </button>

            {under15DaysOrders > 0 && (
              <button
                onClick={() => {
                  onNavigateHome();
                  onSelectStatusFilter('Under15Days');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                  statusFilter === 'Under15Days'
                    ? isDark
                      ? 'bg-amber-950 text-amber-200 font-black border border-amber-700 shadow-sm'
                      : 'bg-amber-100 text-amber-950 font-black border-2 border-amber-400 shadow-xs'
                    : isDark
                      ? 'text-amber-400 hover:bg-amber-950/40 hover:text-amber-300'
                      : 'text-amber-900 bg-amber-50/80 hover:bg-amber-100 font-bold'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title="Pedidos com prazo de entrega inferior a 15 dias"
              >
                <div className="flex items-center gap-2 font-black">
                  <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse flex-shrink-0" />
                  {!isCollapsed && <span>&lt; 15 Dias</span>}
                </div>
                {!isCollapsed && (
                  <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                    isDark ? 'bg-amber-900 text-amber-200 border border-amber-700 animate-pulse' : 'bg-amber-300 text-slate-950 border border-amber-500'
                  }`}>
                    {under15DaysOrders}
                  </span>
                )}
              </button>
            )}

            {overdueOrders > 0 && (
              <button
                onClick={() => {
                  onNavigateHome();
                  onSelectStatusFilter('Atrasado');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                  statusFilter === 'Atrasado'
                    ? isDark
                      ? 'bg-red-950 text-red-200 font-black border border-red-800 animate-pulse'
                      : 'bg-red-100 text-red-950 font-black border-2 border-red-400 shadow-xs'
                    : isDark
                      ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
                      : 'text-red-900 bg-red-50 hover:bg-red-100 font-bold'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title="Pedidos com prazo atrasado"
              >
                <div className="flex items-center gap-2 font-black">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  {!isCollapsed && <span>Atrasados</span>}
                </div>
                {!isCollapsed && (
                  <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
                    isDark ? 'bg-red-900 text-red-200 border border-red-700' : 'bg-red-200 text-red-950'
                  }`}>
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
            <span className={`text-[10px] uppercase font-black tracking-wider px-2 block mb-1.5 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Ferramentas & Integrações
            </span>
          )}
          <div className="space-y-1">
            {onOpenGmailModal && (
              <button
                onClick={onOpenGmailModal}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition border cursor-pointer ${
                  gmailAlertCount > 0
                    ? 'bg-red-600 text-white font-black border-red-500 animate-pulse shadow-md shadow-red-600/30'
                    : isDark
                      ? 'text-slate-200 hover:bg-slate-800 border-slate-700/60 font-semibold'
                      : 'text-slate-800 hover:bg-slate-100 border-slate-200 font-bold'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title="Monitor de E-mails do Gmail para Remetentes Cadastrados"
              >
                <div className="flex items-center gap-2">
                  <Mail className={`w-4 h-4 flex-shrink-0 ${gmailAlertCount > 0 ? 'text-white' : 'text-red-600'}`} />
                  {!isCollapsed && <span>Monitor Gmail</span>}
                </div>
                {!isCollapsed && gmailAlertCount > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-white text-red-700">
                    {gmailAlertCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={onOpenCatalog}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition border cursor-pointer ${
                isDark
                  ? 'text-amber-300 hover:bg-slate-800 border-amber-500/20 font-semibold'
                  : 'text-slate-900 hover:bg-amber-50/60 border-slate-200 font-bold'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Catálogo de Peças & Códigos"
            >
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-amber-500 flex-shrink-0" />
                {!isCollapsed && <span>Catálogo / Códigos</span>}
              </div>
              {!isCollapsed && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  isDark ? 'bg-amber-400/20 text-amber-300' : 'bg-amber-100 text-amber-900'
                }`}>
                  {catalogCount}
                </span>
              )}
            </button>

            {onOpenNomenclature && (
              <button
                onClick={onOpenNomenclature}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition border cursor-pointer ${
                  isDark
                    ? 'text-blue-300 hover:bg-slate-800 border-blue-500/20 font-semibold'
                    : 'text-slate-900 hover:bg-blue-50/60 border-slate-200 font-bold'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title="Consultar Nomenclaturas Termoprol (Linha T & QC/QF)"
              >
                <Sliders className="w-4 h-4 text-blue-600 flex-shrink-0" />
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
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                isDark 
                  ? 'text-emerald-300 hover:bg-slate-800 font-semibold' 
                  : 'text-emerald-900 hover:bg-emerald-50 font-bold'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Importar Pedidos do Excel (.xlsx, .xls)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {!isCollapsed && <span>Importar do Excel</span>}
            </button>

            <button
              onClick={onExportOrdersExcel}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                isDark 
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white font-semibold' 
                  : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-bold'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Exportar Pedidos e Ambientes para Excel"
            >
              <Download className="w-4 h-4 text-slate-500 flex-shrink-0" />
              {!isCollapsed && <span>Exportar Excel (.xlsx)</span>}
            </button>

            <button
              onClick={onDownloadOrdersTemplate}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                isDark 
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white font-semibold' 
                  : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-bold'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Baixar Modelo de Planilha de Pedidos"
            >
              <FileDown className="w-4 h-4 text-blue-600 flex-shrink-0" />
              {!isCollapsed && <span>Modelo de Planilha</span>}
            </button>

            <button
              onClick={onExportJsonBackup}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                isDark 
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' 
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Exportar Backup Completo JSON"
            >
              <Download className="w-4 h-4 text-amber-500 flex-shrink-0" />
              {!isCollapsed && <span>Backup JSON</span>}
            </button>
          </div>
        </div>

        {/* Progress Card (When not collapsed) */}
        {!isCollapsed && (
          <div className={`rounded-xl p-3 space-y-2 border ${
            isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-slate-50 border-slate-200 shadow-xs'
          }`}>
            <div className={`flex items-center justify-between text-[11px] font-bold ${
              isDark ? 'text-slate-300' : 'text-slate-800'
            }`}>
              <span>Taxa de Conclusão:</span>
              <strong className={isDark ? 'text-white' : 'text-slate-950 font-black'}>{completionPercent}%</strong>
            </div>
            <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
              {deliveredOrders} de {totalOrders} pedidos entregues
            </p>
          </div>
        )}

      </div>

      {/* Footer Controls: Layout, Theme & Density */}
      <div className={`p-3 border-t flex flex-col gap-2 ${
        isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50'
      }`}>
        
        {/* Layout Switcher Button */}
        <button
          onClick={onToggleLayout}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
            layoutMode === 'sidebar'
              ? isDark 
                ? 'bg-blue-900/40 text-blue-300 border-blue-700/50' 
                : 'bg-blue-50 text-blue-900 border-blue-200'
              : isDark 
                ? 'text-slate-300 hover:bg-slate-800 border-transparent' 
                : 'text-slate-800 hover:bg-slate-200 border-transparent'
          } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
          title="Alternar entre Layout Lateral (Sidebar ERP) e Layout Superior (Topbar)"
        >
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-blue-600 flex-shrink-0" />
            {!isCollapsed && <span>Layout: <strong>Lateral ERP</strong></span>}
          </div>
          {!isCollapsed && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
              isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-800'
            }`}>
              Trocar
            </span>
          )}
        </button>

        {/* Quick Density & Theme Toggles */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              onClick={onToggleDensity}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition cursor-pointer font-bold ${
                isDark 
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'text-slate-800 hover:text-slate-950 hover:bg-slate-200'
              }`}
              title="Alternar densidade de dados"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{density === 'compact' ? 'Compacto' : 'Confortável'}</span>
            </button>

            {/* High Contrast Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-black transition cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200'
              }`}
              title="Alternar Modo Claro (Escrita Escura) / Escuro"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-600" />
                  <span>Layout Claro</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onToggleTheme}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isDark 
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                  : 'text-slate-800 hover:text-slate-950 hover:bg-slate-200'
              }`}
              title="Alternar Tema Claro / Escuro"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-600" />}
            </button>
          </div>
        )}

      </div>
    </aside>
  );
};
