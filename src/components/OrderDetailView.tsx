import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Printer, 
  BookMarked, 
  Plus, 
  Trash2, 
  Copy, 
  Fan, 
  Cpu, 
  Plug, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Info,
  Calendar,
  Sparkles,
  LayoutGrid,
  ListOrdered
} from 'lucide-react';
import { Order, OrderStatus, Environment, Machine, CodeItem, CatalogItem } from '../types';
import { calculateRemainingDays, getRelativeDate } from '../utils/excel';

interface OrderDetailViewProps {
  order: Order;
  catalog: CatalogItem[];
  onBack: () => void;
  onSaveOrder: (updatedOrder: Order) => void;
  onOpenCatalog: () => void;
  onSaveItemToCatalog?: (code: string, name: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  catalog,
  onBack,
  onSaveOrder,
  onOpenCatalog,
  onSaveItemToCatalog,
  onShowToast
}) => {
  // Local working copy of the order
  const [currentOrder, setCurrentOrder] = useState<Order>(() => JSON.parse(JSON.stringify(order)));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [envDisplayMode, setEnvDisplayMode] = useState<'tabs' | 'cards'>('tabs');
  const [activeEnvTab, setActiveEnvTab] = useState(0);

  useEffect(() => {
    setCurrentOrder(JSON.parse(JSON.stringify(order)));
    setHasUnsavedChanges(false);
    setActiveEnvTab(0);
  }, [order.id]);

  const remaining = calculateRemainingDays(currentOrder.deliveryDate, currentOrder.status);

  // Technical Summary Calculations
  const totalEnvironments = currentOrder.environments?.length || 0;
  const totalMachines = currentOrder.environments?.reduce((acc, env) => 
    acc + (env.machines?.reduce((mAcc, m) => mAcc + (m.quantity || 1), 0) || 0), 0) || 0;
  const totalPanelItems = currentOrder.environments?.reduce((acc, env) => 
    acc + (env.panel?.items?.length || 0), 0) || 0;
  const totalAccessories = currentOrder.environments?.reduce((acc, env) => 
    acc + (env.accessories?.length || 0), 0) || 0;

  // Auto lookup helper: returns item name if code matches in catalog
  const lookupNameByCode = (code: string): string | null => {
    if (!code) return null;
    const match = catalog.find(c => c.code.trim().toUpperCase() === code.trim().toUpperCase());
    return match ? match.name : null;
  };

  const handleFieldChange = (field: keyof Order, value: any) => {
    setCurrentOrder(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!currentOrder.orderNumber.trim() || !currentOrder.customer.trim()) {
      onShowToast('Preencha o Número do Pedido e o Nome do Cliente.', 'warning');
      return;
    }
    onSaveOrder(currentOrder);
    setHasUnsavedChanges(false);
    onShowToast(`Pedido ${currentOrder.orderNumber} salvo com sucesso!`, 'success');
  };

  // Environment operations
  const handleAddEnvironment = () => {
    const newIdx = currentOrder.environments?.length || 0;
    const newEnv: Environment = {
      id: 'env-' + Date.now(),
      name: `Ambiente ${newIdx + 1}`,
      machines: [
        {
          id: 'm-' + Date.now(),
          name: '',
          quantity: 1,
          items: [{ code: '', name: '' }]
        }
      ],
      panel: {
        description: '',
        items: [{ code: '', name: '' }]
      },
      accessories: [{ code: '', name: '' }]
    };

    setCurrentOrder(prev => ({
      ...prev,
      environments: [...(prev.environments || []), newEnv]
    }));
    setActiveEnvTab(newIdx);
    setHasUnsavedChanges(true);
  };

  const handleDuplicateEnvironment = (envIdx: number) => {
    const sourceEnv = currentOrder.environments[envIdx];
    if (!sourceEnv) return;

    const clonedEnv: Environment = JSON.parse(JSON.stringify(sourceEnv));
    clonedEnv.id = 'env-' + Date.now();
    clonedEnv.name = `${sourceEnv.name} (Cópia)`;

    // Assign new IDs to machines
    clonedEnv.machines = (clonedEnv.machines || []).map(m => ({
      ...m,
      id: 'm-' + Math.random().toString(36).substring(2, 9)
    }));

    const updated = [...currentOrder.environments];
    updated.splice(envIdx + 1, 0, clonedEnv);

    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setActiveEnvTab(envIdx + 1);
    setHasUnsavedChanges(true);
    onShowToast('Ambiente duplicado com sucesso!', 'info');
  };

  const handleRemoveEnvironment = (envIdx: number) => {
    if (window.confirm('Tem certeza de que deseja remover este ambiente e todas as suas configurações?')) {
      const updated = [...currentOrder.environments];
      updated.splice(envIdx, 1);
      setCurrentOrder(prev => ({ ...prev, environments: updated }));
      setActiveEnvTab(prev => Math.max(0, Math.min(prev, updated.length - 1)));
      setHasUnsavedChanges(true);
    }
  };

  const handleUpdateEnvName = (envIdx: number, val: string) => {
    const updated = [...currentOrder.environments];
    updated[envIdx].name = val;
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  // Machine operations
  const handleAddMachine = (envIdx: number) => {
    const updated = [...currentOrder.environments];
    if (!updated[envIdx].machines) updated[envIdx].machines = [];
    updated[envIdx].machines.push({
      id: 'm-' + Date.now(),
      name: '',
      quantity: 1,
      items: [{ code: '', name: '' }]
    });
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleRemoveMachine = (envIdx: number, mIdx: number) => {
    const updated = [...currentOrder.environments];
    updated[envIdx].machines.splice(mIdx, 1);
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateMachine = (envIdx: number, mIdx: number, field: keyof Machine, val: any) => {
    const updated = [...currentOrder.environments];
    (updated[envIdx].machines[mIdx] as any)[field] = val;
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleAddMachineItem = (envIdx: number, mIdx: number) => {
    const updated = [...currentOrder.environments];
    if (!updated[envIdx].machines[mIdx].items) updated[envIdx].machines[mIdx].items = [];
    updated[envIdx].machines[mIdx].items.push({ code: '', name: '' });
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleRemoveMachineItem = (envIdx: number, mIdx: number, iIdx: number) => {
    const updated = [...currentOrder.environments];
    updated[envIdx].machines[mIdx].items.splice(iIdx, 1);
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleMachineItemCodeChange = (envIdx: number, mIdx: number, iIdx: number, rawCode: string) => {
    const updated = [...currentOrder.environments];
    const item = updated[envIdx].machines[mIdx].items[iIdx];
    const upperCode = rawCode.toUpperCase();
    item.code = upperCode;

    // Auto lookup name in catalog
    const autoName = lookupNameByCode(upperCode);
    if (autoName) {
      item.name = autoName;
    }

    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleMachineItemNameChange = (envIdx: number, mIdx: number, iIdx: number, name: string) => {
    const updated = [...currentOrder.environments];
    updated[envIdx].machines[mIdx].items[iIdx].name = name;
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  // Panel operations
  const handleUpdatePanelDesc = (envIdx: number, desc: string) => {
    const updated = [...currentOrder.environments];
    if (!updated[envIdx].panel) updated[envIdx].panel = { description: '', items: [] };
    updated[envIdx].panel.description = desc;
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleAddPanelItem = (envIdx: number) => {
    const updated = [...currentOrder.environments];
    if (!updated[envIdx].panel) updated[envIdx].panel = { description: '', items: [] };
    if (!updated[envIdx].panel.items) updated[envIdx].panel.items = [];
    updated[envIdx].panel.items.push({ code: '', name: '' });
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleRemovePanelItem = (envIdx: number, pIdx: number) => {
    const updated = [...currentOrder.environments];
    updated[envIdx].panel.items.splice(pIdx, 1);
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handlePanelItemCodeChange = (envIdx: number, pIdx: number, rawCode: string) => {
    const updated = [...currentOrder.environments];
    const item = updated[envIdx].panel.items[pIdx];
    const upperCode = rawCode.toUpperCase();
    item.code = upperCode;

    const autoName = lookupNameByCode(upperCode);
    if (autoName) {
      item.name = autoName;
    }

    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handlePanelItemNameChange = (envIdx: number, pIdx: number, name: string) => {
    const updated = [...currentOrder.environments];
    updated[envIdx].panel.items[pIdx].name = name;
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  // Accessories operations
  const handleAddAccessory = (envIdx: number) => {
    const updated = [...currentOrder.environments];
    if (!updated[envIdx].accessories) updated[envIdx].accessories = [];
    updated[envIdx].accessories.push({ code: '', name: '' });
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleRemoveAccessory = (envIdx: number, aIdx: number) => {
    const updated = [...currentOrder.environments];
    updated[envIdx].accessories.splice(aIdx, 1);
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleAccessoryCodeChange = (envIdx: number, aIdx: number, rawCode: string) => {
    const updated = [...currentOrder.environments];
    const item = updated[envIdx].accessories[aIdx];
    const upperCode = rawCode.toUpperCase();
    item.code = upperCode;

    const autoName = lookupNameByCode(upperCode);
    if (autoName) {
      item.name = autoName;
    }

    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleAccessoryNameChange = (envIdx: number, aIdx: number, name: string) => {
    const updated = [...currentOrder.environments];
    updated[envIdx].accessories[aIdx].name = name;
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  // Quick save item into catalog if it's new
  const handleQuickSaveCatalog = (code: string, name: string) => {
    if (!code || !name) return;
    if (onSaveItemToCatalog) {
      onSaveItemToCatalog(code, name);
      onShowToast(`Item [${code}] cadastrado no catálogo!`, 'success');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print sticky top-20 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition flex items-center justify-center border border-slate-200"
            title="Voltar para a Lista de Pedidos"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Pedido {currentOrder.orderNumber}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${remaining.badgeClass}`}>
                {currentOrder.status} ({remaining.text})
              </span>
              {hasUnsavedChanges && (
                <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  ● Alterações não salvas
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Cliente: {currentOrder.customer || 'Não informado'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenCatalog}
            className="px-3 py-2 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-200 transition flex items-center gap-1.5 shadow-xs"
            title="Abrir Catálogo / Códigos"
          >
            <BookMarked className="w-4 h-4 text-amber-600" />
            <span>Ver Catálogo</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5 shadow-xs border border-slate-200"
            title="Imprimir Ficha de Confecção / PDF"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm shadow-blue-500/20 transition flex items-center gap-1.5 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {/* General Information Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Informações Gerais do Pedido</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pedido de Venda *
            </label>
            <input
              type="text"
              required
              value={currentOrder.orderNumber}
              onChange={e => handleFieldChange('orderNumber', e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cliente / Razão Social *
            </label>
            <input
              type="text"
              required
              value={currentOrder.customer}
              onChange={e => handleFieldChange('customer', e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              AppSheet
            </label>
            <select
              value={currentOrder.appSheet}
              onChange={e => handleFieldChange('appSheet', e.target.value as 'SIM' | 'NÃO')}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="SIM">SIM (Integrado)</option>
              <option value="NÃO">NÃO (Convencional)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status do Pedido
            </label>
            <select
              value={currentOrder.status}
              onChange={e => handleFieldChange('status', e.target.value as OrderStatus)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="Pendente">🟡 Pendente</option>
              <option value="Pronto">🟢 Pronto</option>
              <option value="Entregue">⚪ Entregue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Data de Entrega *
            </label>
            <input
              type="date"
              required
              value={currentOrder.deliveryDate}
              onChange={e => handleFieldChange('deliveryDate', e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-1.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Date presets */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Ajuste de prazo rápido:</span>
          {[3, 7, 15, 30].map(days => (
            <button
              key={days}
              type="button"
              onClick={() => handleFieldChange('deliveryDate', getRelativeDate(days))}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition font-medium text-[11px]"
            >
              +{days} dias ({getRelativeDate(days).split('-').reverse().join('/')})
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Observações Gerais & Instruções Especiais
          </label>
          <textarea
            rows={2}
            value={currentOrder.notes || ''}
            onChange={e => handleFieldChange('notes', e.target.value)}
            placeholder="Instruções de confecção, transporte, detalhes elétricos..."
            className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Technical Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">Ambientes</span>
            <strong className="text-base font-bold text-slate-900">{totalEnvironments}</strong>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
            <Fan className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">Máquinas Totais</span>
            <strong className="text-base font-bold text-slate-900">{totalMachines}</strong>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">Peças de Painel</span>
            <strong className="text-base font-bold text-slate-900">{totalPanelItems}</strong>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Plug className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">Acessórios</span>
            <strong className="text-base font-bold text-slate-900">{totalAccessories}</strong>
          </div>
        </div>
      </div>

      {/* Technical Specifications Section */}
      <div className="space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Especificações Técnicas por Ambiente
            </h3>
            <p className="text-xs text-slate-500">
              Digite o código da peça para preencher automaticamente com os dados do catálogo
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Environment Layout Mode Switcher */}
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEnvDisplayMode('tabs')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  envDisplayMode === 'tabs'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Visualizar um ambiente por vez em abas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Abas por Ambiente</span>
              </button>

              <button
                type="button"
                onClick={() => setEnvDisplayMode('cards')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                  envDisplayMode === 'cards'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Visualizar todos os ambientes empilhados"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Lista Completa</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddEnvironment}
              className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Ambiente</span>
            </button>
          </div>
        </div>

        {/* Tabs Bar when envDisplayMode is 'tabs' */}
        {envDisplayMode === 'tabs' && currentOrder.environments && currentOrder.environments.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {currentOrder.environments.map((env, idx) => (
              <button
                key={env.id || idx}
                type="button"
                onClick={() => setActiveEnvTab(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2.5 flex-shrink-0 border ${
                  activeEnvTab === idx
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                  activeEnvTab === idx ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {idx + 1}
                </span>
                <span>{env.name || `Ambiente ${idx + 1}`}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  activeEnvTab === idx ? 'bg-blue-500/60 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {env.machines?.length || 0} máq
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={handleAddEnvironment}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition flex items-center gap-1.5 flex-shrink-0"
              title="Adicionar Novo Ambiente"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo</span>
            </button>
          </div>
        )}

        {/* Environments Container */}
        {(!currentOrder.environments || currentOrder.environments.length === 0) ? (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
            <Layers className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Nenhum ambiente adicionado a este pedido.</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Ambientes agrupam as máquinas, quadros de comando e acessórios necessários.
            </p>
            <button
              type="button"
              onClick={handleAddEnvironment}
              className="px-4 py-2 bg-blue-50 text-blue-600 font-semibold text-xs rounded-xl hover:bg-blue-100 transition inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Adicionar Primeiro Ambiente
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {(envDisplayMode === 'tabs'
              ? (currentOrder.environments[activeEnvTab] 
                  ? [{ env: currentOrder.environments[activeEnvTab], envIdx: activeEnvTab }] 
                  : (currentOrder.environments[0] ? [{ env: currentOrder.environments[0], envIdx: 0 }] : []))
              : currentOrder.environments.map((env, envIdx) => ({ env, envIdx }))
            ).map(({ env, envIdx }) => (
              <div
                key={env.id || envIdx}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Environment Bar Header */}
                <div className="bg-slate-800 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-grow">
                    <span className="bg-slate-700 text-blue-300 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border border-slate-600">
                      {envIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={env.name}
                      onChange={e => handleUpdateEnvName(envIdx, e.target.value)}
                      placeholder="Nome / Identificação do Ambiente (ex: Recepção, Câmara Fria)"
                      className="bg-slate-900 border border-slate-700 text-white font-semibold text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-80"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDuplicateEnvironment(envIdx)}
                      className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg transition flex items-center gap-1.5 border border-slate-600"
                      title="Duplicar este ambiente completo"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveEnvironment(envIdx)}
                      className="px-2.5 py-1.5 text-xs text-red-300 hover:text-red-200 bg-red-950/40 hover:bg-red-900/50 rounded-lg transition flex items-center gap-1.5 border border-red-800/50"
                      title="Excluir ambiente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>

                {/* Environment Sub-Sections */}
                <div className="p-5 space-y-6">
                  
                  {/* SECTION 1: MÁQUINAS */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Fan className="w-4 h-4 text-blue-600" />
                        <span>Máquinas & Quantidades</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleAddMachine(envIdx)}
                        className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded-lg transition flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Máquina</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(!env.machines || env.machines.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">Nenhuma máquina cadastrada neste ambiente.</p>
                      ) : (
                        env.machines.map((machine, mIdx) => (
                          <div
                            key={machine.id || mIdx}
                            className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                              <div className="flex items-center gap-1 w-full sm:w-auto">
                                <span className="text-[11px] font-semibold text-slate-500 uppercase sm:hidden">Qtd:</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={machine.quantity || 1}
                                  onChange={e => handleUpdateMachine(envIdx, mIdx, 'quantity', parseInt(e.target.value) || 1)}
                                  title="Quantidade de máquinas deste modelo"
                                  className="w-20 border border-slate-300 rounded-lg p-1.5 text-sm font-bold text-center focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <input
                                type="text"
                                value={machine.name}
                                onChange={e => handleUpdateMachine(envIdx, mIdx, 'name', e.target.value)}
                                placeholder="Modelo / Descrição da Máquina (ex: Chiller 5TR, Evaporador Teto)"
                                className="flex-grow border border-slate-300 rounded-lg p-1.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 w-full"
                              />

                              <button
                                type="button"
                                onClick={() => handleRemoveMachine(envIdx, mIdx)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Remover Máquina"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Machine Components Sub-List */}
                            <div className="pl-3 sm:pl-4 border-l-2 border-blue-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">
                                  Componentes da Máquina (Código / Descrição):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAddMachineItem(envIdx, mIdx)}
                                  className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Item</span>
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(machine.items || []).map((item, iIdx) => {
                                  const isInCatalog = catalog.some(c => c.code.toUpperCase() === (item.code || '').trim().toUpperCase());

                                  return (
                                    <div
                                      key={iIdx}
                                      className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-lg"
                                    >
                                      {/* Code Input */}
                                      <div className="w-36 sm:w-44 flex-shrink-0">
                                        <input
                                          type="text"
                                          list="catalogDatalist"
                                          value={item.code}
                                          onChange={e => handleMachineItemCodeChange(envIdx, mIdx, iIdx, e.target.value)}
                                          placeholder="Código (ex: COMP-01)"
                                          className="w-full border border-slate-300 rounded p-1 text-xs font-bold uppercase text-blue-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                      </div>

                                      {/* Description Input */}
                                      <div className="flex-grow">
                                        <input
                                          type="text"
                                          value={item.name}
                                          onChange={e => handleMachineItemNameChange(envIdx, mIdx, iIdx, e.target.value)}
                                          placeholder="Descrição da peça ou componente"
                                          className="w-full border border-slate-200 bg-white rounded p-1 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                      </div>

                                      {/* Quick Save to Catalog button if code exists and is not yet in catalog */}
                                      {item.code && item.name && !isInCatalog && (
                                        <button
                                          type="button"
                                          onClick={() => handleQuickSaveCatalog(item.code, item.name)}
                                          className="px-2 py-0.5 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold transition flex items-center gap-1 flex-shrink-0"
                                          title="Salvar este código e nome no catálogo geral"
                                        >
                                          <Sparkles className="w-3 h-3 text-amber-600" />
                                          <span className="hidden sm:inline">+ Catálogo</span>
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveMachineItem(envIdx, mIdx, iIdx)}
                                        className="p-1 text-slate-400 hover:text-red-500 rounded transition flex-shrink-0"
                                        title="Remover Item"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: QUADRO DE COMANDO */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                      <Cpu className="w-4 h-4 text-amber-500" />
                      <span>Quadro de Comando do Ambiente</span>
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Especificação Geral do Quadro
                        </label>
                        <input
                          type="text"
                          value={env.panel?.description || ''}
                          onChange={e => handleUpdatePanelDesc(envIdx, e.target.value)}
                          placeholder="Ex: Quadro Trifásico 380V c/ Partida Direta + Módulo CLP Siemens"
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div className="bg-white border border-slate-200 p-3.5 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600 uppercase">
                            Componentes do Quadro (Código / Descrição):
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddPanelItem(envIdx)}
                            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Componente</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {(env.panel?.items || []).map((pItem, pIdx) => {
                            const isInCatalog = catalog.some(c => c.code.toUpperCase() === (pItem.code || '').trim().toUpperCase());

                            return (
                              <div
                                key={pIdx}
                                className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-lg"
                              >
                                <div className="w-36 sm:w-44 flex-shrink-0">
                                  <input
                                    type="text"
                                    list="catalogDatalist"
                                    value={pItem.code}
                                    onChange={e => handlePanelItemCodeChange(envIdx, pIdx, e.target.value)}
                                    placeholder="Código (ex: DISJ-32)"
                                    className="w-full border border-slate-300 rounded p-1 text-xs font-bold uppercase text-amber-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                  />
                                </div>

                                <div className="flex-grow">
                                  <input
                                    type="text"
                                    value={pItem.name}
                                    onChange={e => handlePanelItemNameChange(envIdx, pIdx, e.target.value)}
                                    placeholder="Descrição do componente elétrico"
                                    className="w-full border border-slate-200 bg-white rounded p-1 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                  />
                                </div>

                                {pItem.code && pItem.name && !isInCatalog && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickSaveCatalog(pItem.code, pItem.name)}
                                    className="px-2 py-0.5 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold transition flex items-center gap-1 flex-shrink-0"
                                    title="Salvar este código e nome no catálogo geral"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-600" />
                                    <span className="hidden sm:inline">+ Catálogo</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleRemovePanelItem(envIdx, pIdx)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded transition flex-shrink-0"
                                  title="Remover Componente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: ACESSÓRIOS */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Plug className="w-4 h-4 text-emerald-600" />
                        <span>Acessórios & Periféricos</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleAddAccessory(envIdx)}
                        className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded-lg transition flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Acessório</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(env.accessories || []).map((acc, aIdx) => {
                        const isInCatalog = catalog.some(c => c.code.toUpperCase() === (acc.code || '').trim().toUpperCase());

                        return (
                          <div
                            key={aIdx}
                            className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-lg"
                          >
                            <div className="w-36 sm:w-44 flex-shrink-0">
                              <input
                                type="text"
                                list="catalogDatalist"
                                value={acc.code}
                                onChange={e => handleAccessoryCodeChange(envIdx, aIdx, e.target.value)}
                                placeholder="Código (ex: SENS-NTC)"
                                className="w-full border border-slate-300 rounded p-1 text-xs font-bold uppercase text-emerald-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                            </div>

                            <div className="flex-grow">
                              <input
                                type="text"
                                value={acc.name}
                                onChange={e => handleAccessoryNameChange(envIdx, aIdx, e.target.value)}
                                placeholder="Descrição do acessório ou periférico"
                                className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded p-1 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                            </div>

                            {acc.code && acc.name && !isInCatalog && (
                              <button
                                type="button"
                                onClick={() => handleQuickSaveCatalog(acc.code, acc.name)}
                                className="px-2 py-0.5 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold transition flex items-center gap-1 flex-shrink-0"
                                title="Salvar este código e nome no catálogo geral"
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span className="hidden sm:inline">+ Catálogo</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveAccessory(envIdx, aIdx)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded transition flex-shrink-0"
                              title="Remover Acessório"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
