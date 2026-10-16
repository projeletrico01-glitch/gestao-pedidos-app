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
  ListOrdered,
  Minus
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

  // Quick Add states for each section
  const [quickMachineCode, setQuickMachineCode] = useState<{ [machineId: string]: string }>({});
  const [quickMachineQty, setQuickMachineQty] = useState<{ [machineId: string]: number }>({});

  const [quickPanelCode, setQuickPanelCode] = useState<{ [envId: string]: string }>({});
  const [quickPanelQty, setQuickPanelQty] = useState<{ [envId: string]: number }>({});

  const [quickAccCode, setQuickAccCode] = useState<{ [envId: string]: string }>({});
  const [quickAccQty, setQuickAccQty] = useState<{ [envId: string]: number }>({});

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
    acc + (env.panel?.items?.reduce((pAcc, p) => pAcc + (p.quantity || 1), 0) || 0), 0) || 0;
  const totalAccessories = currentOrder.environments?.reduce((acc, env) => 
    acc + (env.accessories?.reduce((aAcc, a) => aAcc + (a.quantity || 1), 0) || 0), 0) || 0;

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
          items: [{ code: '', name: '', quantity: 1 }]
        }
      ],
      panel: {
        description: '',
        items: [{ code: '', name: '', quantity: 1 }]
      },
      accessories: [{ code: '', name: '', quantity: 1 }]
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
      items: [{ code: '', name: '', quantity: 1 }]
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

  // Machine Items (Components) operations
  const handleAddMachineItem = (envIdx: number, mIdx: number, defaultQty: number = 1) => {
    const updated = [...currentOrder.environments];
    if (!updated[envIdx].machines[mIdx].items) updated[envIdx].machines[mIdx].items = [];
    updated[envIdx].machines[mIdx].items.push({ code: '', name: '', quantity: defaultQty });
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleQuickAddMachineItem = (envIdx: number, mIdx: number, machineId: string) => {
    const rawCode = (quickMachineCode[machineId] || '').trim();
    const qty = quickMachineQty[machineId] || 1;
    if (!rawCode) {
      onShowToast('Digite ou selecione o código do item para adicionar.', 'warning');
      return;
    }
    const upperCode = rawCode.toUpperCase();
    const name = lookupNameByCode(upperCode) || '';

    const updated = [...currentOrder.environments];
    if (!updated[envIdx].machines[mIdx].items) updated[envIdx].machines[mIdx].items = [];
    updated[envIdx].machines[mIdx].items.push({
      code: upperCode,
      name: name,
      quantity: Math.max(1, qty)
    });

    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
    setQuickMachineCode(prev => ({ ...prev, [machineId]: '' }));
    setQuickMachineQty(prev => ({ ...prev, [machineId]: 1 }));
    onShowToast(`Adicionado: ${qty}x [${upperCode}] ${name || 'item'}`, 'success');
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

  const handleMachineItemQtyChange = (envIdx: number, mIdx: number, iIdx: number, qty: number) => {
    const updated = [...currentOrder.environments];
    updated[envIdx].machines[mIdx].items[iIdx].quantity = Math.max(1, qty || 1);
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

  const handleAddPanelItem = (envIdx: number, defaultQty: number = 1) => {
    const updated = [...currentOrder.environments];
    if (!updated[envIdx].panel) updated[envIdx].panel = { description: '', items: [] };
    if (!updated[envIdx].panel.items) updated[envIdx].panel.items = [];
    updated[envIdx].panel.items.push({ code: '', name: '', quantity: defaultQty });
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleQuickAddPanelItem = (envIdx: number, envId: string) => {
    const rawCode = (quickPanelCode[envId] || '').trim();
    const qty = quickPanelQty[envId] || 1;
    if (!rawCode) {
      onShowToast('Digite ou selecione o código do componente do quadro.', 'warning');
      return;
    }
    const upperCode = rawCode.toUpperCase();
    const name = lookupNameByCode(upperCode) || '';

    const updated = [...currentOrder.environments];
    if (!updated[envIdx].panel) updated[envIdx].panel = { description: '', items: [] };
    if (!updated[envIdx].panel.items) updated[envIdx].panel.items = [];
    updated[envIdx].panel.items.push({
      code: upperCode,
      name: name,
      quantity: Math.max(1, qty)
    });

    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
    setQuickPanelCode(prev => ({ ...prev, [envId]: '' }));
    setQuickPanelQty(prev => ({ ...prev, [envId]: 1 }));
    onShowToast(`Adicionado ao Quadro: ${qty}x [${upperCode}] ${name || 'item'}`, 'success');
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

  const handlePanelItemQtyChange = (envIdx: number, pIdx: number, qty: number) => {
    const updated = [...currentOrder.environments];
    updated[envIdx].panel.items[pIdx].quantity = Math.max(1, qty || 1);
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  // Accessories operations
  const handleAddAccessory = (envIdx: number, defaultQty: number = 1) => {
    const updated = [...currentOrder.environments];
    if (!updated[envIdx].accessories) updated[envIdx].accessories = [];
    updated[envIdx].accessories.push({ code: '', name: '', quantity: defaultQty });
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleQuickAddAccessory = (envIdx: number, envId: string) => {
    const rawCode = (quickAccCode[envId] || '').trim();
    const qty = quickAccQty[envId] || 1;
    if (!rawCode) {
      onShowToast('Digite ou selecione o código do acessório.', 'warning');
      return;
    }
    const upperCode = rawCode.toUpperCase();
    const name = lookupNameByCode(upperCode) || '';

    const updated = [...currentOrder.environments];
    if (!updated[envIdx].accessories) updated[envIdx].accessories = [];
    updated[envIdx].accessories.push({
      code: upperCode,
      name: name,
      quantity: Math.max(1, qty)
    });

    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
    setQuickAccCode(prev => ({ ...prev, [envId]: '' }));
    setQuickAccQty(prev => ({ ...prev, [envId]: 1 }));
    onShowToast(`Adicionado aos Acessórios: ${qty}x [${upperCode}] ${name || 'item'}`, 'success');
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

  const handleAccessoryQtyChange = (envIdx: number, aIdx: number, qty: number) => {
    const updated = [...currentOrder.environments];
    updated[envIdx].accessories[aIdx].quantity = Math.max(1, qty || 1);
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
              Cadastre e configure máquinas, quadro de comando e acessórios com suas respectivas quantidades
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
                        <span>Máquinas & Componentes</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleAddMachine(envIdx)}
                        className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded-lg transition flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Nova Máquina</span>
                      </button>
                    </div>

                    <div className="space-y-5">
                      {(!env.machines || env.machines.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">Nenhuma máquina cadastrada neste ambiente.</p>
                      ) : (
                        env.machines.map((machine, mIdx) => (
                          <div
                            key={machine.id || mIdx}
                            className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs space-y-4"
                          >
                            {/* Machine Header Row: Model & Machine Quantity */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">Qtd Máquinas:</span>
                                <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-xs">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMachine(envIdx, mIdx, 'quantity', Math.max(1, (machine.quantity || 1) - 1))}
                                    className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
                                    title="Diminuir quantidade de máquinas"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={machine.quantity || 1}
                                    onChange={e => handleUpdateMachine(envIdx, mIdx, 'quantity', parseInt(e.target.value) || 1)}
                                    title="Quantidade de máquinas deste modelo"
                                    className="w-12 border-x border-slate-200 p-1 text-sm font-bold text-center text-slate-900 focus:outline-none focus:bg-blue-50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateMachine(envIdx, mIdx, 'quantity', (machine.quantity || 1) + 1)}
                                    className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold transition"
                                    title="Aumentar quantidade de máquinas"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex-grow w-full">
                                <input
                                  type="text"
                                  value={machine.name}
                                  onChange={e => handleUpdateMachine(envIdx, mIdx, 'name', e.target.value)}
                                  placeholder="Modelo / Descrição da Máquina (ex: Chiller 5TR, Evaporador Teto)"
                                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveMachine(envIdx, mIdx)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition self-end sm:self-center"
                                title="Remover Máquina"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Machine Components Sub-List */}
                            <div className="pl-2 sm:pl-4 border-l-2 border-blue-400 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                    Componentes da Máquina
                                  </span>
                                  <span className="text-[11px] text-slate-500 block">
                                    Adicione cada peça com sua quantidade específica por máquina
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddMachineItem(envIdx, mIdx)}
                                  className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 self-start sm:self-auto"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Linha de Componente</span>
                                </button>
                              </div>

                              {/* Quick Add Bar with Quantity for Machine */}
                              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-2.5 flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-bold text-blue-900 uppercase">Adicionar Rápido:</span>
                                
                                <div className="w-40 sm:w-48 flex-grow">
                                  <input
                                    type="text"
                                    list="catalogDatalist"
                                    value={quickMachineCode[machine.id] || ''}
                                    onChange={e => setQuickMachineCode(prev => ({ ...prev, [machine.id]: e.target.value }))}
                                    placeholder="Código (ex: COMP-01)"
                                    className="w-full border border-blue-300 rounded-lg px-2.5 py-1 text-xs font-bold uppercase text-blue-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>

                                <div className="flex items-center gap-1">
                                  <span className="text-[11px] font-bold text-blue-900">Qtd:</span>
                                  <div className="flex items-center border border-blue-300 rounded-lg bg-white overflow-hidden shadow-xs">
                                    <button
                                      type="button"
                                      onClick={() => setQuickMachineQty(prev => ({ ...prev, [machine.id]: Math.max(1, (prev[machine.id] || 1) - 1) }))}
                                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      value={quickMachineQty[machine.id] ?? 1}
                                      onChange={e => setQuickMachineQty(prev => ({ ...prev, [machine.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                                      className="w-10 border-x border-blue-200 py-0.5 text-xs font-bold text-center text-slate-900 focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setQuickMachineQty(prev => ({ ...prev, [machine.id]: (prev[machine.id] || 1) + 1 }))}
                                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleQuickAddMachineItem(envIdx, mIdx, machine.id)}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Adicionar</span>
                                </button>
                              </div>

                              {/* Components Table Headers */}
                              {machine.items && machine.items.length > 0 && (
                                <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  <div className="col-span-3">Código (Ref)</div>
                                  <div className="col-span-5">Descrição do Componente</div>
                                  <div className="col-span-3 text-center">Quantidade (Qtd)</div>
                                  <div className="col-span-1 text-right">Ação</div>
                                </div>
                              )}

                              {/* Components Rows */}
                              <div className="space-y-2">
                                {(!machine.items || machine.items.length === 0) ? (
                                  <p className="text-xs text-slate-400 italic py-1">Nenhum componente cadastrado para esta máquina.</p>
                                ) : (
                                  machine.items.map((item, iIdx) => {
                                    const isInCatalog = catalog.some(c => c.code.toUpperCase() === (item.code || '').trim().toUpperCase());

                                    return (
                                      <div
                                        key={iIdx}
                                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50/90 border border-slate-200 p-2 rounded-xl transition hover:border-slate-300"
                                      >
                                        {/* Code Input */}
                                        <div className="w-full sm:w-36 md:w-44 flex-shrink-0">
                                          <input
                                            type="text"
                                            list="catalogDatalist"
                                            value={item.code}
                                            onChange={e => handleMachineItemCodeChange(envIdx, mIdx, iIdx, e.target.value)}
                                            placeholder="Código (ex: COMP-01)"
                                            className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold uppercase text-blue-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                          />
                                        </div>

                                        {/* Description Input */}
                                        <div className="flex-grow">
                                          <input
                                            type="text"
                                            value={item.name}
                                            onChange={e => handleMachineItemNameChange(envIdx, mIdx, iIdx, e.target.value)}
                                            placeholder="Descrição da peça ou componente"
                                            className="w-full border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                          />
                                        </div>

                                        {/* Quantity Stepper Input */}
                                        <div className="flex items-center justify-between sm:justify-start gap-1.5 flex-shrink-0">
                                          <span className="text-[10px] font-bold text-slate-500 uppercase sm:hidden">Qtd:</span>
                                          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-xs">
                                            <button
                                              type="button"
                                              onClick={() => handleMachineItemQtyChange(envIdx, mIdx, iIdx, Math.max(1, (item.quantity || 1) - 1))}
                                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold transition select-none"
                                              title="Diminuir quantidade"
                                            >
                                              <Minus className="w-3 h-3" />
                                            </button>
                                            <input
                                              type="number"
                                              min="1"
                                              value={item.quantity ?? 1}
                                              onChange={e => handleMachineItemQtyChange(envIdx, mIdx, iIdx, parseInt(e.target.value) || 1)}
                                              title="Quantidade do componente"
                                              className="w-12 text-center text-xs font-bold text-slate-900 border-x border-slate-200 py-1 focus:outline-none focus:bg-blue-50"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleMachineItemQtyChange(envIdx, mIdx, iIdx, (item.quantity || 1) + 1)}
                                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold transition select-none"
                                              title="Aumentar quantidade"
                                            >
                                              <Plus className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 justify-end flex-shrink-0">
                                          {item.code && item.name && !isInCatalog && (
                                            <button
                                              type="button"
                                              onClick={() => handleQuickSaveCatalog(item.code, item.name)}
                                              className="px-2 py-1 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-semibold transition flex items-center gap-1 flex-shrink-0"
                                              title="Salvar este código e nome no catálogo geral"
                                            >
                                              <Sparkles className="w-3 h-3 text-amber-600" />
                                              <span className="hidden md:inline">+ Catálogo</span>
                                            </button>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() => handleRemoveMachineItem(envIdx, mIdx, iIdx)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Remover Item"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
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

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
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

                      <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                              Componentes do Quadro
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Disjuntores, contatores, relés, CLP, bornes com suas quantidades
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddPanelItem(envIdx)}
                            className="text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 self-start sm:self-auto"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Linha de Componente</span>
                          </button>
                        </div>

                        {/* Quick Add Bar with Quantity for Panel */}
                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-amber-900 uppercase">Adicionar Rápido:</span>
                          
                          <div className="w-40 sm:w-48 flex-grow">
                            <input
                              type="text"
                              list="catalogDatalist"
                              value={quickPanelCode[env.id] || ''}
                              onChange={e => setQuickPanelCode(prev => ({ ...prev, [env.id]: e.target.value }))}
                              placeholder="Código (ex: DISJ-32)"
                              className="w-full border border-amber-300 rounded-lg px-2.5 py-1 text-xs font-bold uppercase text-amber-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-bold text-amber-900">Qtd:</span>
                            <div className="flex items-center border border-amber-300 rounded-lg bg-white overflow-hidden shadow-xs">
                              <button
                                type="button"
                                onClick={() => setQuickPanelQty(prev => ({ ...prev, [env.id]: Math.max(1, (prev[env.id] || 1) - 1) }))}
                                className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={quickPanelQty[env.id] ?? 1}
                                onChange={e => setQuickPanelQty(prev => ({ ...prev, [env.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                                className="w-10 border-x border-amber-200 py-0.5 text-xs font-bold text-center text-slate-900 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => setQuickPanelQty(prev => ({ ...prev, [env.id]: (prev[env.id] || 1) + 1 }))}
                                className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleQuickAddPanelItem(envIdx, env.id)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar ao Quadro</span>
                          </button>
                        </div>

                        {/* Panel Table Headers */}
                        {env.panel?.items && env.panel.items.length > 0 && (
                          <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <div className="col-span-3">Código (Ref)</div>
                            <div className="col-span-5">Descrição do Componente Elétrico</div>
                            <div className="col-span-3 text-center">Quantidade (Qtd)</div>
                            <div className="col-span-1 text-right">Ação</div>
                          </div>
                        )}

                        {/* Panel Items Rows */}
                        <div className="space-y-2">
                          {(!env.panel?.items || env.panel.items.length === 0) ? (
                            <p className="text-xs text-slate-400 italic py-1">Nenhum componente elétrico cadastrado para este quadro.</p>
                          ) : (
                            env.panel.items.map((pItem, pIdx) => {
                              const isInCatalog = catalog.some(c => c.code.toUpperCase() === (pItem.code || '').trim().toUpperCase());

                              return (
                                <div
                                  key={pIdx}
                                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50/90 border border-slate-200 p-2 rounded-xl transition hover:border-slate-300"
                                >
                                  {/* Code Input */}
                                  <div className="w-full sm:w-36 md:w-44 flex-shrink-0">
                                    <input
                                      type="text"
                                      list="catalogDatalist"
                                      value={pItem.code}
                                      onChange={e => handlePanelItemCodeChange(envIdx, pIdx, e.target.value)}
                                      placeholder="Código (ex: DISJ-32)"
                                      className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold uppercase text-amber-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                  </div>

                                  {/* Description Input */}
                                  <div className="flex-grow">
                                    <input
                                      type="text"
                                      value={pItem.name}
                                      onChange={e => handlePanelItemNameChange(envIdx, pIdx, e.target.value)}
                                      placeholder="Descrição do componente elétrico"
                                      className="w-full border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                  </div>

                                  {/* Quantity Stepper Input */}
                                  <div className="flex items-center justify-between sm:justify-start gap-1.5 flex-shrink-0">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase sm:hidden">Qtd:</span>
                                    <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-xs">
                                      <button
                                        type="button"
                                        onClick={() => handlePanelItemQtyChange(envIdx, pIdx, Math.max(1, (pItem.quantity || 1) - 1))}
                                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold transition select-none"
                                        title="Diminuir quantidade"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <input
                                        type="number"
                                        min="1"
                                        value={pItem.quantity ?? 1}
                                        onChange={e => handlePanelItemQtyChange(envIdx, pIdx, parseInt(e.target.value) || 1)}
                                        title="Quantidade do componente"
                                        className="w-12 text-center text-xs font-bold text-slate-900 border-x border-slate-200 py-1 focus:outline-none focus:bg-amber-50"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handlePanelItemQtyChange(envIdx, pIdx, (pItem.quantity || 1) + 1)}
                                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold transition select-none"
                                        title="Aumentar quantidade"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 justify-end flex-shrink-0">
                                    {pItem.code && pItem.name && !isInCatalog && (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickSaveCatalog(pItem.code, pItem.name)}
                                        className="px-2 py-1 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-semibold transition flex items-center gap-1 flex-shrink-0"
                                        title="Salvar este código e nome no catálogo geral"
                                      >
                                        <Sparkles className="w-3 h-3 text-amber-600" />
                                        <span className="hidden md:inline">+ Catálogo</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleRemovePanelItem(envIdx, pIdx)}
                                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                      title="Remover Componente"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
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
                        <span>+ Linha de Acessório</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Quick Add Bar with Quantity for Accessories */}
                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-emerald-900 uppercase">Adicionar Rápido:</span>
                        
                        <div className="w-40 sm:w-48 flex-grow">
                          <input
                            type="text"
                            list="catalogDatalist"
                            value={quickAccCode[env.id] || ''}
                            onChange={e => setQuickAccCode(prev => ({ ...prev, [env.id]: e.target.value }))}
                            placeholder="Código (ex: SENS-NTC)"
                            className="w-full border border-emerald-300 rounded-lg px-2.5 py-1 text-xs font-bold uppercase text-emerald-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-bold text-emerald-900">Qtd:</span>
                          <div className="flex items-center border border-emerald-300 rounded-lg bg-white overflow-hidden shadow-xs">
                            <button
                              type="button"
                              onClick={() => setQuickAccQty(prev => ({ ...prev, [env.id]: Math.max(1, (prev[env.id] || 1) - 1) }))}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={quickAccQty[env.id] ?? 1}
                              onChange={e => setQuickAccQty(prev => ({ ...prev, [env.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                              className="w-10 border-x border-emerald-200 py-0.5 text-xs font-bold text-center text-slate-900 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setQuickAccQty(prev => ({ ...prev, [env.id]: (prev[env.id] || 1) + 1 }))}
                              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleQuickAddAccessory(envIdx, env.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar Acessório</span>
                        </button>
                      </div>

                      {/* Accessories Table Headers */}
                      {env.accessories && env.accessories.length > 0 && (
                        <div className="hidden sm:grid grid-cols-12 gap-2 px-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <div className="col-span-3">Código (Ref)</div>
                          <div className="col-span-5">Descrição do Acessório / Periférico</div>
                          <div className="col-span-3 text-center">Quantidade (Qtd)</div>
                          <div className="col-span-1 text-right">Ação</div>
                        </div>
                      )}

                      {/* Accessories Rows */}
                      <div className="space-y-2">
                        {(!env.accessories || env.accessories.length === 0) ? (
                          <p className="text-xs text-slate-400 italic py-1">Nenhum acessório adicional cadastrado para este ambiente.</p>
                        ) : (
                          env.accessories.map((acc, aIdx) => {
                            const isInCatalog = catalog.some(c => c.code.toUpperCase() === (acc.code || '').trim().toUpperCase());

                            return (
                              <div
                                key={aIdx}
                                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl transition hover:border-slate-300"
                              >
                                {/* Code Input */}
                                <div className="w-full sm:w-36 md:w-44 flex-shrink-0">
                                  <input
                                    type="text"
                                    list="catalogDatalist"
                                    value={acc.code}
                                    onChange={e => handleAccessoryCodeChange(envIdx, aIdx, e.target.value)}
                                    placeholder="Código (ex: SENS-NTC)"
                                    className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold uppercase text-emerald-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                  />
                                </div>

                                {/* Description Input */}
                                <div className="flex-grow">
                                  <input
                                    type="text"
                                    value={acc.name}
                                    onChange={e => handleAccessoryNameChange(envIdx, aIdx, e.target.value)}
                                    placeholder="Descrição do acessório ou periférico"
                                    className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                  />
                                </div>

                                {/* Quantity Stepper Input */}
                                <div className="flex items-center justify-between sm:justify-start gap-1.5 flex-shrink-0">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase sm:hidden">Qtd:</span>
                                  <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-xs">
                                    <button
                                      type="button"
                                      onClick={() => handleAccessoryQtyChange(envIdx, aIdx, Math.max(1, (acc.quantity || 1) - 1))}
                                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold transition select-none"
                                      title="Diminuir quantidade"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      value={acc.quantity ?? 1}
                                      onChange={e => handleAccessoryQtyChange(envIdx, aIdx, parseInt(e.target.value) || 1)}
                                      title="Quantidade do acessório"
                                      className="w-12 text-center text-xs font-bold text-slate-900 border-x border-slate-200 py-1 focus:outline-none focus:bg-emerald-50"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAccessoryQtyChange(envIdx, aIdx, (acc.quantity || 1) + 1)}
                                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs font-bold transition select-none"
                                      title="Aumentar quantidade"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 justify-end flex-shrink-0">
                                  {acc.code && acc.name && !isInCatalog && (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickSaveCatalog(acc.code, acc.name)}
                                      className="px-2 py-1 text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-semibold transition flex items-center gap-1 flex-shrink-0"
                                      title="Salvar este código e nome no catálogo geral"
                                    >
                                      <Sparkles className="w-3 h-3 text-amber-600" />
                                      <span className="hidden md:inline">+ Catálogo</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAccessory(envIdx, aIdx)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                    title="Remover Acessório"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Datalist for autocomplete on all code inputs */}
      <datalist id="catalogDatalist">
        {catalog.map((c, idx) => (
          <option key={`${c.code}-${idx}`} value={c.code}>
            {c.name} ({c.category || 'Geral'})
          </option>
        ))}
      </datalist>

    </div>
  );
};
