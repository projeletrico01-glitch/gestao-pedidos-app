import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Order, 
  CatalogItem, 
  ViewMode, 
  OrderStatus, 
  ToastMessage,
  LayoutMode,
  ThemeMode,
  DensityMode 
} from './types';
import { 
  initialCatalogData, 
  initialOrdersData, 
  getRelativeDate 
} from './data/initialData';
import { 
  calculateRemainingDays, 
  exportOrdersToExcel, 
  downloadOrdersTemplate, 
  readOrdersFromExcel 
} from './utils/excel';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OrderTable } from './components/OrderTable';
import { OrderKanban } from './components/OrderKanban';
import { OrderCalendar } from './components/OrderCalendar';
import { OrderDetailView } from './components/OrderDetailView';
import { CatalogModal } from './components/CatalogModal';
import { NewOrderModal } from './components/NewOrderModal';
import { PrintProductionSheet } from './components/PrintProductionSheet';
import { Toast } from './components/Toast';
import { TermoprolLogo } from './components/TermoprolLogo';
import { 
  Search, 
  ListOrdered, 
  Columns3, 
  Calendar, 
  Layers, 
  Plus, 
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet,
  LayoutGrid,
  Sun,
  Moon,
  Sliders,
  Settings2,
  BookMarked,
  Download,
  FileDown,
  Trash2
} from 'lucide-react';

export default function App() {
  // State for Catalog
  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    try {
      const saved = localStorage.getItem('orderflow_catalog_data');
      return saved ? JSON.parse(saved) : initialCatalogData;
    } catch {
      return initialCatalogData;
    }
  });

  // State for Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('orderflow_orders_data');
      return saved ? JSON.parse(saved) : initialOrdersData;
    } catch {
      return initialOrdersData;
    }
  });

  // Navigation & View mode
  const [currentView, setCurrentView] = useState<'dashboard' | 'detail'>('dashboard');
  const [dashboardTab, setDashboardTab] = useState<ViewMode>('table');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Layout & Theme Preferences (Persisted in localStorage)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    try {
      const saved = localStorage.getItem('orderflow_layout_mode');
      return (saved === 'topbar' || saved === 'sidebar') ? saved : 'sidebar';
    } catch {
      return 'sidebar';
    }
  });

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('orderflow_theme_mode');
      return (saved === 'dark' || saved === 'light') ? saved : 'light';
    } catch {
      return 'light';
    }
  });

  const [density, setDensity] = useState<DensityMode>(() => {
    try {
      const saved = localStorage.getItem('orderflow_density');
      return (saved === 'compact' || saved === 'comfortable') ? saved : 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [appSheetFilter, setAppSheetFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'urgency' | 'orderNumber' | 'customer' | 'newest'>('urgency');

  // Modals
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist Preferences
  useEffect(() => {
    localStorage.setItem('orderflow_layout_mode', layoutMode);
  }, [layoutMode]);

  useEffect(() => {
    localStorage.setItem('orderflow_theme_mode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('orderflow_density', density);
  }, [density]);

  // Persist Catalog
  useEffect(() => {
    localStorage.setItem('orderflow_catalog_data', JSON.stringify(catalog));
  }, [catalog]);

  // Persist Orders
  useEffect(() => {
    localStorage.setItem('orderflow_orders_data', JSON.stringify(orders));
  }, [orders]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toggleLayout = () => {
    setLayoutMode(prev => {
      const next = prev === 'sidebar' ? 'topbar' : 'sidebar';
      showToast(next === 'sidebar' ? 'Layout alterado para Barra Lateral (Sidebar ERP)' : 'Layout alterado para Cabeçalho Superior (Topbar)', 'info');
      return next;
    });
  };

  const toggleTheme = () => {
    setThemeMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      showToast(next === 'dark' ? 'Modo Escuro ativado' : 'Modo Claro ativado', 'info');
      return next;
    });
  };

  const toggleDensity = () => {
    setDensity(prev => {
      const next = prev === 'compact' ? 'comfortable' : 'compact';
      showToast(next === 'compact' ? 'Densidade compacta de engenharia ativada' : 'Densidade confortável ativada', 'info');
      return next;
    });
  };

  // Selected Order for Detail View
  const activeOrder = useMemo(() => {
    return orders.find(o => o.id === activeOrderId) || orders[0] || null;
  }, [orders, activeOrderId]);

  // Filtered & Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch = 
          !query ||
          order.orderNumber.toLowerCase().includes(query) ||
          order.customer.toLowerCase().includes(query) ||
          (order.notes && order.notes.toLowerCase().includes(query)) ||
          order.environments?.some(env => 
            env.name.toLowerCase().includes(query) ||
            env.machines?.some(m => m.name.toLowerCase().includes(query) || m.items?.some(i => i.code?.toLowerCase().includes(query) || i.name?.toLowerCase().includes(query))) ||
            env.panel?.items?.some(i => i.code?.toLowerCase().includes(query) || i.name?.toLowerCase().includes(query)) ||
            env.accessories?.some(a => a.code?.toLowerCase().includes(query) || a.name?.toLowerCase().includes(query))
          );

        const remaining = calculateRemainingDays(order.deliveryDate, order.status);
        let matchesStatus = true;
        if (statusFilter === 'Atrasado') {
          matchesStatus = remaining.isOverdue;
        } else if (statusFilter !== 'ALL') {
          matchesStatus = order.status === statusFilter;
        }

        let matchesAppSheet = true;
        if (appSheetFilter !== 'ALL') {
          matchesAppSheet = order.appSheet === appSheetFilter;
        }

        return matchesSearch && matchesStatus && matchesAppSheet;
      })
      .sort((a, b) => {
        if (sortBy === 'urgency') {
          const remA = calculateRemainingDays(a.deliveryDate, a.status).days;
          const remB = calculateRemainingDays(b.deliveryDate, b.status).days;
          return remA - remB;
        } else if (sortBy === 'orderNumber') {
          return a.orderNumber.localeCompare(b.orderNumber);
        } else if (sortBy === 'customer') {
          return a.customer.localeCompare(b.customer);
        } else if (sortBy === 'newest') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        return 0;
      });
  }, [orders, searchTerm, statusFilter, appSheetFilter, sortBy]);

  // Order Handlers
  const handleOpenOrder = (order: Order) => {
    setActiveOrderId(order.id);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    setActiveOrderId(newOrder.id);
    setCurrentView('detail');
    showToast(`Pedido ${newOrder.orderNumber} criado com sucesso!`, 'success');
  };

  const handleSaveOrder = useCallback((updatedOrder: Order) => {
    setOrders(prev => {
      const idx = prev.findIndex(o => o.id === updatedOrder.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedOrder;
        return copy;
      }
      return [updatedOrder, ...prev];
    });
  }, []);

  const handleDeleteOrder = (orderId: string) => {
    const target = orders.find(o => o.id === orderId);
    if (target) {
      setOrderToDelete(target);
    }
  };

  const confirmDeleteOrder = () => {
    if (!orderToDelete) return;
    const targetId = orderToDelete.id;
    const targetNumber = orderToDelete.orderNumber;
    setOrders(prev => prev.filter(o => o.id !== targetId));
    if (activeOrderId === targetId) {
      setCurrentView('dashboard');
      setActiveOrderId(null);
    }
    showToast(`Pedido ${targetNumber} excluído com sucesso.`, 'info');
    setOrderToDelete(null);
  };

  const handleDuplicateOrder = (sourceOrder: Order) => {
    const cloned: Order = JSON.parse(JSON.stringify(sourceOrder));
    cloned.id = 'ord-' + Date.now();
    cloned.orderNumber = `${sourceOrder.orderNumber}-COP`;
    cloned.customer = `${sourceOrder.customer} (Cópia)`;
    cloned.status = 'Pendente';
    cloned.createdAt = new Date().toISOString();

    setOrders(prev => [cloned, ...prev]);
    showToast(`Pedido ${cloned.orderNumber} duplicado!`, 'success');
  };

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    showToast(`Status atualizado para "${newStatus}"`, 'info');
  };

  const handlePrintOrder = (order: Order) => {
    setActiveOrderId(order.id);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Quick add item to catalog from order view
  const handleSaveItemToCatalog = (itemCode: string, itemName: string) => {
    const code = itemCode.trim().toUpperCase();
    const name = itemName.trim();
    if (!code || !name) return;

    setCatalog(prev => {
      const existing = prev.findIndex(c => c.code.toUpperCase() === code);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], name };
        return updated;
      }
      return [...prev, { code, name, category: 'Componentes', unit: 'UN' }];
    });
  };

  // Excel handlers
  const handleImportOrdersExcel = async (file: File) => {
    const result = await readOrdersFromExcel(file);
    if (result.error) {
      showToast(result.error, 'error');
      return;
    }

    if (!result.orders || result.orders.length === 0) {
      showToast('Nenhum pedido válido encontrado na planilha.', 'warning');
      return;
    }

    const newOrders: Order[] = result.orders.map((partial, idx) => ({
      id: partial.id || 'ord-' + Date.now() + '-' + idx,
      orderNumber: partial.orderNumber || `PV-IMP-${idx + 1}`,
      customer: partial.customer || 'Cliente Importado',
      appSheet: partial.appSheet || 'NÃO',
      status: partial.status || 'Pendente',
      deliveryDate: partial.deliveryDate || getRelativeDate(7),
      notes: partial.notes || 'Importado via planilha Excel',
      createdAt: new Date().toISOString(),
      environments: partial.environments || [
        {
          id: 'env-' + Date.now() + '-' + idx,
          name: 'Ambiente Padrão',
          machines: [],
          panel: { description: '', items: [] },
          accessories: []
        }
      ]
    }));

    setOrders(prev => [...newOrders, ...prev]);
    showToast(`${newOrders.length} pedido(s) importado(s) do Excel com sucesso!`, 'success');
  };

  const handleExportOrdersExcel = () => {
    if (orders.length === 0) {
      showToast('Não há pedidos cadastrados para exportar.', 'warning');
      return;
    }
    exportOrdersToExcel(orders);
    showToast('Planilha Excel de pedidos exportada com sucesso!', 'success');
  };

  const handleExportJsonBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      orders,
      catalog
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `backup_pedidos_confeccao_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Backup JSON completo exportado com sucesso!', 'success');
  };

  const handleResetData = () => {
    if (window.confirm('Deseja recarregar os dados de exemplo de demonstração? Isso substituirá os dados atuais.')) {
      setOrders(initialOrdersData);
      setCatalog(initialCatalogData);
      setCurrentView('dashboard');
      showToast('Dados de demonstração restaurados.', 'info');
    }
  };

  const appBackground = themeMode === 'dark' 
    ? 'bg-slate-950 text-slate-100' 
    : 'bg-slate-50 text-slate-800';

  return (
    <div className={`min-h-screen antialiased selection:bg-blue-100 selection:text-blue-900 ${appBackground} ${density === 'compact' ? 'text-xs' : 'text-sm'}`}>
      
      {/* Autocomplete Datalist for fast code typing anywhere in the app */}
      <datalist id="catalogDatalist">
        {catalog.map(item => (
          <option key={item.code} value={item.code}>
            {item.code} - {item.name} ({item.category})
          </option>
        ))}
      </datalist>

      {/* RENDER LAYOUT 1: SIDEBAR ERP PRO (When layoutMode === 'sidebar') */}
      {layoutMode === 'sidebar' ? (
        <div className="flex min-h-screen">
          <Sidebar
            orders={orders}
            catalogCount={catalog.length}
            currentView={currentView}
            dashboardTab={dashboardTab}
            statusFilter={statusFilter}
            isCollapsed={isSidebarCollapsed}
            themeMode={themeMode}
            layoutMode={layoutMode}
            density={density}
            onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
            onSelectTab={setDashboardTab}
            onSelectStatusFilter={setStatusFilter}
            onOpenCatalog={() => setIsCatalogModalOpen(true)}
            onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            onImportOrdersExcel={handleImportOrdersExcel}
            onExportOrdersExcel={handleExportOrdersExcel}
            onDownloadOrdersTemplate={downloadOrdersTemplate}
            onExportJsonBackup={handleExportJsonBackup}
            onToggleTheme={toggleTheme}
            onToggleLayout={toggleLayout}
            onToggleDensity={toggleDensity}
            onNavigateHome={() => setCurrentView('dashboard')}
          />

          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            {/* Sidebar ERP Top Bar */}
            <header className="h-16 px-6 border-b border-slate-200/80 bg-white shadow-xs flex items-center justify-between gap-4 no-print sticky top-0 z-20">
              <div className="flex items-center gap-3">
                {isSidebarCollapsed && (
                  <div onClick={() => setCurrentView('dashboard')} className="cursor-pointer mr-1">
                    <TermoprolLogo variant="icon" theme="light" size="sm" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    {currentView === 'dashboard' ? 'Painel de Produção & Pedidos' : `Pedido ${activeOrder?.orderNumber}`}
                  </span>
                  {statusFilter !== 'ALL' && currentView === 'dashboard' && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      Filtro: {statusFilter}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Layout Mode Button */}
                <button
                  type="button"
                  onClick={toggleLayout}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
                  title="Mudar para Layout Superior (Topbar Clássico)"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden md:inline">Layout: <strong>Topbar</strong></span>
                </button>

                {/* Density Toggle */}
                <button
                  type="button"
                  onClick={toggleDensity}
                  className="p-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition border border-slate-200"
                  title="Alternar Densidade (Compacto / Confortável)"
                >
                  <Sliders className="w-4 h-4 text-slate-600" />
                </button>

                {/* Quick Add Order */}
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm transition flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Pedido</span>
                </button>
              </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {currentView === 'dashboard' ? (
                <div className="space-y-6">
                  {/* Filter and Control Toolbar */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between no-print">
                    
                    {/* Search Bar */}
                    <div className="relative flex-grow max-w-md">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar pedido, cliente, máquina ou código..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Filters & Tabs */}
                    <div className="flex flex-wrap items-center gap-3 justify-between lg:justify-end">
                      {/* AppSheet Filter */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                          AppSheet:
                        </span>
                        <select
                          value={appSheetFilter}
                          onChange={e => setAppSheetFilter(e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ALL">Todos</option>
                          <option value="SIM">SIM</option>
                          <option value="NÃO">NÃO</option>
                        </select>
                      </div>

                      {/* Sort By */}
                      <div className="flex items-center gap-1.5">
                        <select
                          value={sortBy}
                          onChange={e => setSortBy(e.target.value as any)}
                          className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="urgency">Mais Urgentes</option>
                          <option value="orderNumber">Nº Pedido</option>
                          <option value="customer">Cliente</option>
                          <option value="newest">Mais Recentes</option>
                        </select>
                      </div>

                      {/* View Tabs */}
                      <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
                        <button
                          onClick={() => setDashboardTab('table')}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                            dashboardTab === 'table'
                              ? 'bg-white text-slate-900 font-bold shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <ListOrdered className="w-3.5 h-3.5" />
                          <span>Tabela</span>
                        </button>

                        <button
                          onClick={() => setDashboardTab('kanban')}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                            dashboardTab === 'kanban'
                              ? 'bg-white text-slate-900 font-bold shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <Columns3 className="w-3.5 h-3.5" />
                          <span>Kanban</span>
                        </button>

                        <button
                          onClick={() => setDashboardTab('calendar')}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                            dashboardTab === 'calendar'
                              ? 'bg-white text-slate-900 font-bold shadow-xs'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Agenda</span>
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Filter Status Summary & Reset */}
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1 no-print">
                    <span>
                      Exibindo <strong>{filteredOrders.length}</strong> de <strong>{orders.length}</strong> pedidos
                    </span>

                    <div className="flex items-center gap-3">
                      {(searchTerm || statusFilter !== 'ALL' || appSheetFilter !== 'ALL') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('ALL');
                            setAppSheetFilter('ALL');
                          }}
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Limpar filtros
                        </button>
                      )}

                      <button
                        onClick={handleResetData}
                        className="text-slate-400 hover:text-slate-700 transition flex items-center gap-1"
                        title="Restaurar dados de exemplo iniciais"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restaurar Demo</span>
                      </button>
                    </div>
                  </div>

                  {/* Tab Views */}
                  {dashboardTab === 'table' && (
                    <OrderTable
                      orders={filteredOrders}
                      onOpenOrder={handleOpenOrder}
                      onDeleteOrder={handleDeleteOrder}
                      onDuplicateOrder={handleDuplicateOrder}
                      onPrintOrder={handlePrintOrder}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  )}

                  {dashboardTab === 'kanban' && (
                    <OrderKanban
                      orders={filteredOrders}
                      onOpenOrder={handleOpenOrder}
                      onUpdateStatus={handleUpdateStatus}
                    />
                  )}

                  {dashboardTab === 'calendar' && (
                    <OrderCalendar
                      orders={filteredOrders}
                      onOpenOrder={handleOpenOrder}
                    />
                  )}
                </div>
              ) : (
                activeOrder && (
                  <OrderDetailView
                    order={activeOrder}
                    catalog={catalog}
                    onBack={() => setCurrentView('dashboard')}
                    onSaveOrder={handleSaveOrder}
                    onOpenCatalog={() => setIsCatalogModalOpen(true)}
                    onSaveItemToCatalog={handleSaveItemToCatalog}
                    onShowToast={showToast}
                  />
                )
              )}
            </main>
          </div>
        </div>
      ) : (
        /* RENDER LAYOUT 2: TOPBAR EXECUTIVO (When layoutMode === 'topbar') */
        <div className="min-h-screen flex flex-col">
          <Header
            orders={orders}
            catalogCount={catalog.length}
            layoutMode={layoutMode}
            themeMode={themeMode}
            density={density}
            onToggleLayout={toggleLayout}
            onToggleTheme={toggleTheme}
            onToggleDensity={toggleDensity}
            onOpenCatalog={() => setIsCatalogModalOpen(true)}
            onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
            onImportOrdersExcel={handleImportOrdersExcel}
            onExportOrdersExcel={handleExportOrdersExcel}
            onExportJsonBackup={handleExportJsonBackup}
            onDownloadOrdersTemplate={downloadOrdersTemplate}
            onNavigateHome={() => setCurrentView('dashboard')}
          />

          <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {currentView === 'dashboard' ? (
              <div className="space-y-6">
                
                {/* Filter and Control Toolbar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between no-print">
                  
                  {/* Search Bar */}
                  <div className="relative flex-grow max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Buscar pedido, cliente, máquina ou código..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Filters & View Switchers */}
                  <div className="flex flex-wrap items-center gap-3 justify-between lg:justify-end">
                    
                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                        Status:
                      </span>
                      <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ALL">Todos os Status</option>
                        <option value="Pendente">🟡 Pendente</option>
                        <option value="Pronto">🟢 Pronto</option>
                        <option value="Entregue">⚪ Entregue</option>
                        <option value="Atrasado">🔴 Atrasados</option>
                      </select>
                    </div>

                    {/* AppSheet Filter */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                        AppSheet:
                      </span>
                      <select
                        value={appSheetFilter}
                        onChange={e => setAppSheetFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ALL">Todos</option>
                        <option value="SIM">SIM</option>
                        <option value="NÃO">NÃO</option>
                      </select>
                    </div>

                    {/* Sort By */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="urgency">Ordenar: Mais Urgentes</option>
                        <option value="orderNumber">Ordenar: Nº Pedido</option>
                        <option value="customer">Ordenar: Cliente</option>
                        <option value="newest">Ordenar: Mais Recentes</option>
                      </select>
                    </div>

                    {/* View Mode Tabs (Tabela, Kanban, Agenda) */}
                    <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
                      <button
                        onClick={() => setDashboardTab('table')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                          dashboardTab === 'table'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                        <span>Tabela</span>
                      </button>

                      <button
                        onClick={() => setDashboardTab('kanban')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                          dashboardTab === 'kanban'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Columns3 className="w-3.5 h-3.5" />
                        <span>Kanban</span>
                      </button>

                      <button
                        onClick={() => setDashboardTab('calendar')}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                          dashboardTab === 'calendar'
                            ? 'bg-white text-slate-900 font-bold shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Agenda</span>
                      </button>
                    </div>

                  </div>

                </div>

                {/* Results Counter and Filter Reset */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1 no-print">
                  <span>
                    Exibindo <strong>{filteredOrders.length}</strong> de <strong>{orders.length}</strong> pedidos
                    {searchTerm && ` para "${searchTerm}"`}
                  </span>

                  <div className="flex items-center gap-3">
                    {(searchTerm || statusFilter !== 'ALL' || appSheetFilter !== 'ALL') && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('ALL');
                          setAppSheetFilter('ALL');
                        }}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Limpar filtros
                      </button>
                    )}

                    <button
                      onClick={handleResetData}
                      className="text-slate-400 hover:text-slate-700 transition flex items-center gap-1"
                      title="Restaurar dados de exemplo iniciais"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restaurar Demo</span>
                    </button>
                  </div>
                </div>

                {/* Tab Views */}
                {dashboardTab === 'table' && (
                  <OrderTable
                    orders={filteredOrders}
                    onOpenOrder={handleOpenOrder}
                    onDeleteOrder={handleDeleteOrder}
                    onDuplicateOrder={handleDuplicateOrder}
                    onPrintOrder={handlePrintOrder}
                    onUpdateStatus={handleUpdateStatus}
                  />
                )}

                {dashboardTab === 'kanban' && (
                  <OrderKanban
                    orders={filteredOrders}
                    onOpenOrder={handleOpenOrder}
                    onUpdateStatus={handleUpdateStatus}
                  />
                )}

                {dashboardTab === 'calendar' && (
                  <OrderCalendar
                    orders={filteredOrders}
                    onOpenOrder={handleOpenOrder}
                  />
                )}

              </div>
            ) : (
              activeOrder && (
                <OrderDetailView
                  order={activeOrder}
                  catalog={catalog}
                  onBack={() => setCurrentView('dashboard')}
                  onSaveOrder={handleSaveOrder}
                  onOpenCatalog={() => setIsCatalogModalOpen(true)}
                  onSaveItemToCatalog={handleSaveItemToCatalog}
                  onShowToast={showToast}
                />
              )
            )}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-center text-xs text-slate-400 no-print">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Controle de Pedidos & Confecção • Sistema Integrado de Montagem</span>
              <span>Suporta planilhas Excel (.xlsx, .xls, .csv) & Catálogo Dinâmico de Códigos</span>
            </div>
          </footer>
        </div>
      )}

      {/* Printable Sheet (Shown during window.print) */}
      {activeOrder && (
        <PrintProductionSheet order={activeOrder} />
      )}

      {/* Catalog Modal */}
      <CatalogModal
        isOpen={isCatalogModalOpen}
        catalog={catalog}
        onClose={() => setIsCatalogModalOpen(false)}
        onUpdateCatalog={setCatalog}
        onShowToast={showToast}
      />

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onCreateOrder={handleCreateOrder}
      />

      {/* Modal Confirmation for Order Deletion */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Excluir Pedido?</h4>
                <p className="text-xs text-slate-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Tem certeza de que deseja excluir o pedido <strong className="text-slate-900 font-bold">{orderToDelete.orderNumber}</strong> ({orderToDelete.customer})? 
              Todos os ambientes, máquinas e apontamentos deste pedido serão removidos.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteOrder}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-red-500/20 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Pedido</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

    </div>
  );
}
