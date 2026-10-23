import React, { useState, useEffect, useRef } from 'react';
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
  Minus,
  X,
  Thermometer,
  Ruler,
  SlidersHorizontal,
  Radio,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileCode,
  FileSpreadsheet,
  FileDown,
  Upload,
  Ban,
  ShieldAlert,
  CheckSquare,
  Square,
  Maximize2,
  Minimize2,
  Eye
} from 'lucide-react';
import { Order, OrderStatus, Environment, Machine, CodeItem, CatalogItem, ExcludedComponentItem } from '../types';
import { 
  calculateRemainingDays, 
  getRelativeDate, 
  getOrderTotals,
  readComponentsFromExcel,
  downloadComponentsTemplate,
  ImportedComponentItem
} from '../utils/excel';
import { NomenclatureDecoder } from './NomenclatureDecoder';

export interface PreviewImportItem extends ImportedComponentItem {
  selected: boolean;
  wasExcluded: boolean;
  excludedFrom?: string;
}
import { 
  getBlockedMemory, 
  saveBlockedMemory, 
  addToBlockedMemory, 
  removeFromBlockedMemory, 
  clearBlockedMemory, 
  checkIsBlocked 
} from '../utils/blockedMemory';
import { decodeMachineNomenclature, decodePanelNomenclature, NomenclatureResult } from '../utils/nomenclature';

interface OrderDetailViewProps {
  order: Order;
  catalog: CatalogItem[];
  onBack: () => void;
  onSaveOrder: (updatedOrder: Order) => void;
  onOpenCatalog: () => void;
  onSaveItemToCatalog?: (code: string, name: string) => void;
  onPrintOrder?: (order: Order) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  catalog,
  onBack,
  onSaveOrder,
  onOpenCatalog,
  onSaveItemToCatalog,
  onPrintOrder,
  onShowToast
}) => {
  // Local working copy of the order
  const [currentOrder, setCurrentOrder] = useState<Order>(() => JSON.parse(JSON.stringify(order)));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [envDisplayMode, setEnvDisplayMode] = useState<'tabs' | 'cards'>('tabs');
  const [activeEnvTab, setActiveEnvTab] = useState(0);

  // Focus mode state: when set to an environment ID, that environment occupies full view, hiding the other sections of the order
  const [focusedEnvId, setFocusedEnvId] = useState<string | null>(null);

  // Quick Add states for each section
  const [quickMachineCode, setQuickMachineCode] = useState<{ [machineId: string]: string }>({});
  const [quickMachineQty, setQuickMachineQty] = useState<{ [machineId: string]: number }>({});

  const [quickPanelCode, setQuickPanelCode] = useState<{ [envId: string]: string }>({});
  const [quickPanelQty, setQuickPanelQty] = useState<{ [envId: string]: number }>({});

  const [quickAccCode, setQuickAccCode] = useState<{ [envId: string]: string }>({});
  const [quickAccQty, setQuickAccQty] = useState<{ [envId: string]: number }>({});

  // Confirmation modal state for environment deletion
  const [envToDelete, setEnvToDelete] = useState<{ index: number; name: string } | null>(null);

  // Nomenclature decoder modal state
  const [isNomenclatureModalOpen, setIsNomenclatureModalOpen] = useState(false);

  // Collapsed states for Machines, Panels and Accessories (Minimize / Expand)
  const [collapsedMachines, setCollapsedMachines] = useState<{ [machineId: string]: boolean }>({});
  const [collapsedPanels, setCollapsedPanels] = useState<{ [envId: string]: boolean }>({});
  const [collapsedAccessories, setCollapsedAccessories] = useState<{ [envId: string]: boolean }>({});

  // Modal to view/manage excluded components & persistent memory
  const [isExcludedModalOpen, setIsExcludedModalOpen] = useState(false);
  const [newExcludedCode, setNewExcludedCode] = useState('');
  const [newExcludedName, setNewExcludedName] = useState('');
  const [blockedMemoryList, setBlockedMemoryList] = useState<ExcludedComponentItem[]>(getBlockedMemory);
  const [blockedSearchQuery, setBlockedSearchQuery] = useState('');

  // Machine & Panel Component Excel Import preview state
  const [componentImportPreview, setComponentImportPreview] = useState<{
    envIdx: number;
    mIdx?: number;
    isPanel?: boolean;
    targetTitle: string;
    items: PreviewImportItem[];
    filterTab: 'all' | 'ready' | 'excluded';
  } | null>(null);

  const machineFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const panelFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    setCurrentOrder(JSON.parse(JSON.stringify(order)));
    setHasUnsavedChanges(false);
    setActiveEnvTab(0);
    setFocusedEnvId(null);
  }, [order.id]);

  // Exit focus mode on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusedEnvId) {
        setFocusedEnvId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedEnvId]);

  const remaining = calculateRemainingDays(currentOrder.deliveryDate, currentOrder.status);

  // Technical Summary Calculations using shared getOrderTotals
  const { totalEnvironments, totalMachines, totalPanelItems, totalAccessories } = getOrderTotals(currentOrder);

  // Auto-sync order state to parent so that table, kanban and local storage always reflect real-time counts
  useEffect(() => {
    if (hasUnsavedChanges) {
      onSaveOrder(currentOrder);
    }
  }, [currentOrder, hasUnsavedChanges, onSaveOrder]);

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

  const handleBack = () => {
    if (hasUnsavedChanges) {
      onSaveOrder(currentOrder);
      setHasUnsavedChanges(false);
    }
    onBack();
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
      operatingTemperature: '',
      evaporatorDistance: '',
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

  const handlePromptRemoveEnvironment = (envIdx: number) => {
    const env = currentOrder.environments[envIdx];
    const name = env?.name?.trim() ? env.name : `Ambiente ${envIdx + 1}`;
    setEnvToDelete({ index: envIdx, name });
  };

  const handleConfirmDeleteEnvironment = () => {
    if (!envToDelete) return;
    const { index, name } = envToDelete;
    const updated = [...(currentOrder.environments || [])];
    if (index >= 0 && index < updated.length) {
      updated.splice(index, 1);
      setCurrentOrder(prev => ({ ...prev, environments: updated }));
      setActiveEnvTab(prev => {
        if (updated.length === 0) return 0;
        return Math.min(prev, updated.length - 1);
      });
      setHasUnsavedChanges(true);
      onShowToast(`Ambiente "${name}" excluído com sucesso!`, 'info');
    }
    setEnvToDelete(null);
  };

  const handleUpdateEnvName = (envIdx: number, val: string) => {
    const updated = [...currentOrder.environments];
    updated[envIdx].name = val;
    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateEnvField = (
    envIdx: number, 
    field: 'name' | 'operatingTemperature' | 'evaporatorDistance' | 'machineModelCode' | 'panelModelCode', 
    val: string
  ) => {
    const updated = [...currentOrder.environments];
    (updated[envIdx] as any)[field] = val;

    // Auto-detect parameters if typing/pasting nomenclature code
    if (field === 'machineModelCode' && val.trim()) {
      const decoded = decodeMachineNomenclature(val);
      if (decoded.detectedOperatingTemp && !updated[envIdx].operatingTemperature) {
        updated[envIdx].operatingTemperature = decoded.detectedOperatingTemp;
      }
      if (decoded.detectedDistance && !updated[envIdx].evaporatorDistance) {
        updated[envIdx].evaporatorDistance = decoded.detectedDistance;
      }
      if (decoded.detectedSupervisory && currentOrder.supervisory !== 'SIM') {
        setCurrentOrder(prev => ({ ...prev, supervisory: 'SIM' }));
      }
    } else if (field === 'panelModelCode' && val.trim()) {
      const decoded = decodePanelNomenclature(val);
      if (decoded.detectedSupervisory && currentOrder.supervisory !== 'SIM') {
        setCurrentOrder(prev => ({ ...prev, supervisory: 'SIM' }));
      }
    }

    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
  };

  const handleApplyMachineNomenclature = (envIdx: number, code: string, decoded: NomenclatureResult) => {
    const updated = [...currentOrder.environments];
    const env = updated[envIdx];
    if (!env) return;
    env.machineModelCode = code;

    // If machine name is empty or default, suggest friendly name
    if (env.machines && env.machines.length > 0 && (!env.machines[0].name || env.machines[0].name.startsWith('Ambiente') || env.machines[0].name.startsWith('Máquina'))) {
      const typeSeg = decoded.segments.find(s => s.key === 'CFG_003');
      const modelSeg = decoded.segments.find(s => s.key === 'CFG_004');
      env.machines[0].name = `${typeSeg?.description || 'Equipamento'} ${modelSeg?.description || code}`.trim();
    }

    if (decoded.detectedOperatingTemp && !env.operatingTemperature) {
      env.operatingTemperature = decoded.detectedOperatingTemp;
    }
    if (decoded.detectedDistance && !env.evaporatorDistance) {
      env.evaporatorDistance = decoded.detectedDistance;
    }
    if (decoded.detectedSupervisory && currentOrder.supervisory !== 'SIM') {
      setCurrentOrder(prev => ({ ...prev, supervisory: 'SIM' }));
    }

    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
    onShowToast(`Nomenclatura da máquina [${code}] aplicada com sucesso!`, 'success');
  };

  const handleApplyPanelNomenclature = (envIdx: number, code: string, decoded: NomenclatureResult) => {
    const updated = [...currentOrder.environments];
    const env = updated[envIdx];
    if (!env) return;
    env.panelModelCode = code;

    // Auto-update panel description if empty
    if (!env.panel?.description || env.panel.description.startsWith('Quadro de comando não especificado')) {
      env.panel = env.panel || { description: '', items: [] };
      env.panel.description = `${decoded.typeName} - ${code}`;
    }

    if (decoded.detectedSupervisory && currentOrder.supervisory !== 'SIM') {
      setCurrentOrder(prev => ({ ...prev, supervisory: 'SIM' }));
    }

    setCurrentOrder(prev => ({ ...prev, environments: updated }));
    setHasUnsavedChanges(true);
    onShowToast(`Nomenclatura do quadro [${code}] aplicada com sucesso!`, 'success');
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

  // Collapsed machines, panels and accessories toggles
  const toggleMachineCollapsed = (machineId: string) => {
    setCollapsedMachines(prev => ({
      ...prev,
      [machineId]: !prev[machineId]
    }));
  };

  const toggleAllMachines = (envIdx: number) => {
    const env = currentOrder.environments[envIdx];
    if (!env?.machines || env.machines.length === 0) return;
    const allCollapsed = env.machines.every(m => !!collapsedMachines[m.id]);
    const next = { ...collapsedMachines };
    env.machines.forEach(m => {
      next[m.id] = !allCollapsed;
    });
    setCollapsedMachines(next);
  };

  const togglePanelCollapsed = (envId: string) => {
    setCollapsedPanels(prev => ({
      ...prev,
      [envId]: !prev[envId]
    }));
  };

  const toggleAccessoryCollapsed = (envId: string) => {
    setCollapsedAccessories(prev => ({
      ...prev,
      [envId]: !prev[envId]
    }));
  };

  // Excluded items & blocked memory management
  const handleUnexcludeItem = (code: string, name: string) => {
    // 1. Remove from global persistent memory
    const updatedGlobal = removeFromBlockedMemory(code, name);
    setBlockedMemoryList(updatedGlobal);

    // 2. Remove from current order's list
    const normCode = (code || '').trim().toUpperCase();
    const normName = (name || '').trim().toLowerCase();
    const updatedOrder = (currentOrder.excludedComponents || []).filter(ex => {
      const exCode = (ex.code || '').trim().toUpperCase();
      const exName = (ex.name || '').trim().toLowerCase();
      if (normCode && exCode && normCode === exCode) return false;
      if (normName && exName && normName === exName) return false;
      return true;
    });
    setCurrentOrder(prev => ({ ...prev, excludedComponents: updatedOrder }));
    setHasUnsavedChanges(true);
    onShowToast(`Item [${code || name}] desbloqueado da memória! Poderá ser importado ou acrescentado novamente.`, 'success');
  };

  const handleClearAllExcluded = () => {
    clearBlockedMemory();
    setBlockedMemoryList([]);
    setCurrentOrder(prev => ({ ...prev, excludedComponents: [] }));
    setHasUnsavedChanges(true);
    onShowToast('Memória de bloqueados totalmente limpa. Todos os itens poderão ser importados.', 'info');
  };

  const handleManualAddExcluded = () => {
    const code = newExcludedCode.trim().toUpperCase();
    const name = newExcludedName.trim();
    if (!code && !name) {
      onShowToast('Informe o código ou descrição do item para bloquear.', 'warning');
      return;
    }
    const check = checkIsBlocked(code, name, currentOrder.excludedComponents);
    if (check.isBlocked) {
      onShowToast('Este item já está gravado na memória de bloqueados.', 'warning');
      return;
    }

    // Add to persistent global memory
    const updatedGlobal = addToBlockedMemory({
      code: code || '',
      name: name || lookupNameByCode(code) || '',
      from: 'Bloqueio Manual'
    });
    setBlockedMemoryList(updatedGlobal);

    // Add to order
    const updatedOrder: ExcludedComponentItem[] = [
      ...(currentOrder.excludedComponents || []),
      {
        code: code || '',
        name: name || lookupNameByCode(code) || '',
        from: 'Bloqueio Manual',
        excludedAt: new Date().toISOString()
      }
    ];
    setCurrentOrder(prev => ({ ...prev, excludedComponents: updatedOrder }));
    setHasUnsavedChanges(true);
    setNewExcludedCode('');
    setNewExcludedName('');
    onShowToast(`Item [${code || name}] gravado na memória de bloqueados!`, 'success');
  };

  // Individual Excel import for Machine Components
  const handleImportMachineExcel = async (envIdx: number, mIdx: number, machineTitle: string, file: File) => {
    const result = await readComponentsFromExcel(file);
    if (result.error || !result.items.length) {
      onShowToast?.(result.error || 'Nenhum componente válido encontrado na planilha.', 'error');
      return;
    }

    const previewItems: PreviewImportItem[] = result.items.map(it => {
      const check = checkIsBlocked(it.code, it.name, currentOrder.excludedComponents);
      return {
        ...it,
        selected: !check.isBlocked, // Blocked items are deselected by default
        wasExcluded: check.isBlocked,
        excludedFrom: check.isBlocked ? (check.blockedItem?.from || 'Memória de Bloqueados') : undefined
      };
    });

    setComponentImportPreview({
      envIdx,
      mIdx,
      isPanel: false,
      targetTitle: machineTitle || `Máquina ${mIdx + 1}`,
      items: previewItems,
      filterTab: 'all'
    });
  };

  // Individual Excel import for Panel Components
  const handleImportPanelExcel = async (envIdx: number, file: File) => {
    const result = await readComponentsFromExcel(file);
    if (result.error || !result.items.length) {
      onShowToast?.(result.error || 'Nenhum componente válido encontrado na planilha.', 'error');
      return;
    }

    const previewItems: PreviewImportItem[] = result.items.map(it => {
      const check = checkIsBlocked(it.code, it.name, currentOrder.excludedComponents);
      return {
        ...it,
        selected: !check.isBlocked,
        wasExcluded: check.isBlocked,
        excludedFrom: check.isBlocked ? (check.blockedItem?.from || 'Memória de Bloqueados') : undefined
      };
    });

    setComponentImportPreview({
      envIdx,
      isPanel: true,
      targetTitle: `Quadro de Comando (${currentOrder.environments[envIdx].name})`,
      items: previewItems,
      filterTab: 'all'
    });
  };

  // Apply imported items from Excel (Append or Replace)
  const applyImportedComponents = (
    envIdx: number,
    mIdx: number | undefined,
    isPanel: boolean | undefined,
    previewItems: PreviewImportItem[],
    replace: boolean
  ) => {
    const updated = [...currentOrder.environments];
    const env = updated[envIdx];
    if (!env) return;

    // Filter only selected items
    const selectedItems = previewItems.filter(it => it.selected);

    // Any items that were not selected in this import are registered into excludedComponents
    // AND into the persistent global blocked memory so they are remembered across orders/lists
    let newExcluded = [...(currentOrder.excludedComponents || [])];
    previewItems.forEach(it => {
      if (!it.selected) {
        const normCode = it.code?.trim().toUpperCase();
        const normName = it.name?.trim();
        if (normCode || normName) {
          addToBlockedMemory({
            code: normCode,
            name: normName,
            from: isPanel ? `Quadro (${env.name})` : `Máquina (${env.name})`
          });

          const already = newExcluded.some(ex => 
            (normCode && ex.code.toUpperCase() === normCode) ||
            (normName && ex.name.toLowerCase() === normName.toLowerCase())
          );
          if (!already) {
            newExcluded.push({
              code: normCode || '',
              name: normName || '',
              from: isPanel ? `Quadro (${env.name})` : `Máquina (${env.name})`,
              excludedAt: new Date().toISOString()
            });
          }
        }
      }
    });
    setBlockedMemoryList(getBlockedMemory());

    const formatted: CodeItem[] = selectedItems.map(it => ({
      code: it.code,
      name: it.name,
      quantity: it.quantity || 1
    }));

    if (isPanel) {
      if (!env.panel) env.panel = { description: '', items: [] };
      if (replace) {
        env.panel.items = formatted;
      } else {
        env.panel.items = [...(env.panel.items || []), ...formatted];
      }
    } else if (mIdx !== undefined && env.machines?.[mIdx]) {
      const machine = env.machines[mIdx];
      if (replace) {
        machine.items = formatted;
      } else {
        machine.items = [...(machine.items || []), ...formatted];
      }
    }

    const blockedCount = previewItems.length - selectedItems.length;
    setCurrentOrder(prev => ({ ...prev, environments: updated, excludedComponents: newExcluded }));
    setHasUnsavedChanges(true);
    setComponentImportPreview(null);

    if (blockedCount > 0) {
      onShowToast(
        `${selectedItems.length} componente(s) importado(s). ${blockedCount} item(ns) excluído(s) foram bloqueados e não entraram na lista.`,
        'success'
      );
    } else {
      onShowToast(`${selectedItems.length} componentes importados com sucesso!`, 'success');
    }
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

    // Impedir de acrescentar item bloqueado na memória
    const check = checkIsBlocked(upperCode, name, currentOrder.excludedComponents);
    if (check.isBlocked) {
      onShowToast(
        `🚫 Bloqueado: [${upperCode}] está na Memória de Bloqueados e não pode ser acrescentado. Desbloqueie-o na barra superior se desejar utilizá-lo.`,
        'error'
      );
      return;
    }

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
    const machine = updated[envIdx].machines[mIdx];
    const item = machine?.items?.[iIdx];
    if (!item) return;

    machine.items.splice(iIdx, 1);

    const code = item.code?.trim().toUpperCase();
    const name = item.name?.trim();

    // 1. Grava na Memória Global Persistente dos Bloqueados (impede futuras adições/importações)
    if (code || name) {
      addToBlockedMemory({
        code: code || '',
        name: name || '',
        from: `${machine.name || `Máquina ${mIdx + 1}`} (${updated[envIdx].name})`
      });
      setBlockedMemoryList(getBlockedMemory());
    }

    // 2. Grava na lista do pedido
    let newExcluded = [...(currentOrder.excludedComponents || [])];
    if (code || name) {
      const exists = newExcluded.some(ex => 
        (code && ex.code.toUpperCase() === code) ||
        (name && ex.name.toLowerCase() === name.toLowerCase())
      );
      if (!exists) {
        newExcluded.push({
          code: code || '',
          name: name || '',
          from: `${machine.name || `Máquina ${mIdx + 1}`} (${updated[envIdx].name})`,
          excludedAt: new Date().toISOString()
        });
      }
    }

    setCurrentOrder(prev => ({ ...prev, environments: updated, excludedComponents: newExcluded }));
    setHasUnsavedChanges(true);
    onShowToast(
      code 
        ? `Item [${code}] excluído e salvo na memória de bloqueados: impedido de ser importado ou acrescentado em outras listas.` 
        : 'Item excluído da lista.',
      'info'
    );
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

    // Impedir de acrescentar item bloqueado na memória
    const check = checkIsBlocked(upperCode, name, currentOrder.excludedComponents);
    if (check.isBlocked) {
      onShowToast(
        `🚫 Bloqueado: [${upperCode}] está na Memória de Bloqueados e não pode ser acrescentado ao quadro. Desbloqueie-o primeiro se desejar utilizá-lo.`,
        'error'
      );
      return;
    }

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
    const item = updated[envIdx].panel?.items?.[pIdx];
    if (!item) return;

    updated[envIdx].panel.items.splice(pIdx, 1);

    const code = item.code?.trim().toUpperCase();
    const name = item.name?.trim();

    // 1. Grava na Memória Global Persistente dos Bloqueados
    if (code || name) {
      addToBlockedMemory({
        code: code || '',
        name: name || '',
        from: `Quadro de Comando (${updated[envIdx].name})`
      });
      setBlockedMemoryList(getBlockedMemory());
    }

    // 2. Grava na lista do pedido
    let newExcluded = [...(currentOrder.excludedComponents || [])];
    if (code || name) {
      const exists = newExcluded.some(ex => 
        (code && ex.code.toUpperCase() === code) ||
        (name && ex.name.toLowerCase() === name.toLowerCase())
      );
      if (!exists) {
        newExcluded.push({
          code: code || '',
          name: name || '',
          from: `Quadro de Comando (${updated[envIdx].name})`,
          excludedAt: new Date().toISOString()
        });
      }
    }

    setCurrentOrder(prev => ({ ...prev, environments: updated, excludedComponents: newExcluded }));
    setHasUnsavedChanges(true);
    onShowToast(
      code 
        ? `Componente elétrico [${code}] excluído e salvo na memória de bloqueados.` 
        : 'Componente elétrico excluído.',
      'info'
    );
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

    // Impedir de acrescentar item bloqueado na memória
    const check = checkIsBlocked(upperCode, name, currentOrder.excludedComponents);
    if (check.isBlocked) {
      onShowToast(
        `🚫 Bloqueado: [${upperCode}] está na Memória de Bloqueados e não pode ser acrescentado. Desbloqueie-o se desejar utilizá-lo.`,
        'error'
      );
      return;
    }

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
    const item = updated[envIdx].accessories?.[aIdx];
    if (!item) return;

    updated[envIdx].accessories.splice(aIdx, 1);

    const code = item.code?.trim().toUpperCase();
    const name = item.name?.trim();

    // 1. Grava na Memória Global Persistente dos Bloqueados
    if (code || name) {
      addToBlockedMemory({
        code: code || '',
        name: name || '',
        from: `Acessórios (${updated[envIdx].name})`
      });
      setBlockedMemoryList(getBlockedMemory());
    }

    // 2. Grava na lista do pedido
    let newExcluded = [...(currentOrder.excludedComponents || [])];
    if (code || name) {
      const exists = newExcluded.some(ex => 
        (code && ex.code.toUpperCase() === code) ||
        (name && ex.name.toLowerCase() === name.toLowerCase())
      );
      if (!exists) {
        newExcluded.push({
          code: code || '',
          name: name || '',
          from: `Acessórios (${updated[envIdx].name})`,
          excludedAt: new Date().toISOString()
        });
      }
    }

    setCurrentOrder(prev => ({ ...prev, environments: updated, excludedComponents: newExcluded }));
    setHasUnsavedChanges(true);
    onShowToast(
      code ? `Acessório [${code}] excluído e salvo na memória de bloqueados.` : 'Acessório excluído.',
      'info'
    );
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-sm no-print sticky top-16 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
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
              {hasUnsavedChanges ? (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  ● Salvando...
                </span>
              ) : (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Sincronizado com a tabela
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
            onClick={() => setIsNomenclatureModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl border border-blue-200 transition flex items-center gap-1.5 shadow-xs"
            title="Abrir Decodificador de Nomenclaturas Termoprol (Linha T & QC/QF)"
          >
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Nomenclaturas (Linha T & QC)</span>
          </button>

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
            onClick={() => {
              setBlockedMemoryList(getBlockedMemory());
              setIsExcludedModalOpen(true);
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-xs ${
              blockedMemoryList.length > 0 || (currentOrder.excludedComponents || []).length > 0
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300 font-bold'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Abrir a Memória de Itens Bloqueados (impede que itens excluídos sejam importados ou acrescentados em outras listas)"
          >
            <Ban className="w-4 h-4 text-rose-600" />
            <span>Memória Bloqueados ({Math.max(blockedMemoryList.length, (currentOrder.excludedComponents || []).length)})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onPrintOrder) {
                onPrintOrder(currentOrder);
              } else {
                window.print();
              }
            }}
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

      {/* General Information & Order Configuration Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-blue-600" />
            <span>Configurações Gerais do Pedido</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Parâmetros principais, integração AppSheet e sistema supervisório
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-cyan-600" />
                Supervisório
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                currentOrder.supervisory === 'SIM'
                  ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {currentOrder.supervisory === 'SIM' ? 'ATIVO' : 'NÃO'}
              </span>
            </label>
            <select
              value={currentOrder.supervisory || 'NÃO'}
              onChange={e => handleFieldChange('supervisory', e.target.value as 'SIM' | 'NÃO')}
              className={`w-full border rounded-lg p-2 text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:outline-none transition ${
                currentOrder.supervisory === 'SIM'
                  ? 'border-cyan-400 bg-cyan-50/50 text-cyan-900'
                  : 'border-slate-300 bg-white text-slate-800'
              }`}
            >
              <option value="SIM">SIM (Com Supervisório)</option>
              <option value="NÃO">NÃO (Sem Supervisório)</option>
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
            <span className="text-[11px] text-slate-500 font-semibold uppercase block">Quadro de Comando</span>
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
              <div
                key={env.id || idx}
                onClick={() => setActiveEnvTab(idx)}
                role="button"
                tabIndex={0}
                className={`group px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 flex-shrink-0 border cursor-pointer select-none ${
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
                <span className="truncate max-w-[150px]">{env.name || `Ambiente ${idx + 1}`}</span>
                {env.operatingTemperature && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    activeEnvTab === idx ? 'bg-cyan-500/30 text-cyan-100' : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                  }`} title={`Temperatura de Operação: ${env.operatingTemperature}`}>
                    {env.operatingTemperature}
                  </span>
                )}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  activeEnvTab === idx ? 'bg-blue-500/60 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {env.machines?.length || 0} máq
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePromptRemoveEnvironment(idx);
                  }}
                  className={`p-1 rounded-md transition ${
                    activeEnvTab === idx 
                      ? 'text-blue-200 hover:text-white hover:bg-blue-700' 
                      : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={`Excluir ${env.name || `Ambiente ${idx + 1}`}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
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
                      onClick={() => handlePromptRemoveEnvironment(envIdx)}
                      className="px-2.5 py-1.5 text-xs text-red-300 hover:text-red-200 bg-red-950/40 hover:bg-red-900/50 rounded-lg transition flex items-center gap-1.5 border border-red-800/50 active:scale-95"
                      title="Excluir ambiente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>

                {/* Environment Technical Configuration Bar (Temperatura de Operação & Distância da Evaporadora para Condensadora) */}
                <div className="bg-slate-900 border-t border-slate-700/80 px-4 py-3.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Temperatura de Operação */}
                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wide">
                          <Thermometer className="w-4 h-4 text-cyan-400" />
                          <span>Temperatura de Operação</span>
                        </label>
                        {env.operatingTemperature && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                            {env.operatingTemperature}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={env.operatingTemperature || ''}
                          onChange={e => handleUpdateEnvField(envIdx, 'operatingTemperature', e.target.value)}
                          placeholder="Ex: -18°C, +2°C a +4°C, 24°C"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>

                      {/* Quick temperature presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Atalhos:</span>
                        {['-22°C', '-18°C', '0°C', '+2°C', '+18°C', '+24°C'].map(temp => (
                          <button
                            key={temp}
                            type="button"
                            onClick={() => handleUpdateEnvField(envIdx, 'operatingTemperature', temp)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition border ${
                              env.operatingTemperature === temp
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                            }`}
                          >
                            {temp}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Distância da Evaporadora para Condensadora */}
                    <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                          <Ruler className="w-4 h-4 text-amber-400" />
                          <span>Distância Evaporadora → Condensadora</span>
                        </label>
                        {env.evaporatorDistance && (
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/60">
                            {env.evaporatorDistance}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={env.evaporatorDistance || ''}
                          onChange={e => handleUpdateEnvField(envIdx, 'evaporatorDistance', e.target.value)}
                          placeholder="Ex: 15m, 25 metros, 8m"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      {/* Quick distance presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">Atalhos:</span>
                        {['5m', '10m', '15m', '20m', '30m', '50m'].map(dist => (
                          <button
                            key={dist}
                            type="button"
                            onClick={() => handleUpdateEnvField(envIdx, 'evaporatorDistance', dist)}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition border ${
                              env.evaporatorDistance === dist
                                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                            }`}
                          >
                            {dist}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Environment Sub-Sections */}
                <div className="p-5 space-y-6">
                  
                  {/* SECTION 1: MÁQUINAS */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Fan className="w-4 h-4 text-blue-600" />
                        <span>Máquinas & Componentes</span>
                      </h4>
                      <div className="flex items-center gap-2">
                        {env.machines && env.machines.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleAllMachines(envIdx)}
                            className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                            title="Minimizar ou expandir componentes de todas as máquinas deste ambiente"
                          >
                            {env.machines.every(m => !!collapsedMachines[m.id]) ? (
                              <>
                                <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                                <span>Expandir Todas</span>
                              </>
                            ) : (
                              <>
                                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                <span>Minimizar Todas</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAddMachine(envIdx)}
                          className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded-lg transition flex items-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Nova Máquina</span>
                        </button>
                      </div>
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

                              <div className="flex items-center gap-1.5 self-end sm:self-center">
                                {/* Component count badge */}
                                <div 
                                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-lg border border-blue-200"
                                  title="Quantidade de componentes cadastrados nesta máquina"
                                >
                                  <span>{machine.items?.length || 0} componentes</span>
                                </div>

                                {/* Minimize / Expand Toggle Button */}
                                <button
                                  type="button"
                                  onClick={() => toggleMachineCollapsed(machine.id)}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 shadow-xs ${
                                    collapsedMachines[machine.id]
                                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-500'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                  }`}
                                  title={collapsedMachines[machine.id] ? "Expandir lista de componentes" : "Minimizar componentes (deixar apenas o modelo da máquina visível)"}
                                >
                                  {collapsedMachines[machine.id] ? (
                                    <>
                                      <ChevronDown className="w-3.5 h-3.5" />
                                      <span>Expandir</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Minimizar</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveMachine(envIdx, mIdx)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Remover Máquina"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Collapsed State Bar (Only Machine Model Visible) */}
                            {collapsedMachines[machine.id] ? (
                              <div
                                onClick={() => toggleMachineCollapsed(machine.id)}
                                className="cursor-pointer text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50/50 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 transition flex items-center justify-between"
                                title="Clique para expandir e editar os componentes desta máquina"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="font-bold text-slate-800">Modelo: {machine.name || 'Sem especificação'}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-slate-500">{machine.items?.length || 0} componente(s) cadastrado(s) (minimizados)</span>
                                </div>
                                <span className="text-blue-600 font-bold flex items-center gap-1 text-xs">
                                  <span>Ver / Editar Componentes</span>
                                  <ChevronDown className="w-4 h-4" />
                                </span>
                              </div>
                            ) : (
                              /* Machine Components Sub-List */
                              <div className="pl-2 sm:pl-4 border-l-2 border-blue-400 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                    <span>Componentes da Máquina</span>
                                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                                      {machine.items?.length || 0} itens
                                    </span>
                                  </span>
                                  <span className="text-[11px] text-slate-500 block">
                                    Adicione cada peça manualmente ou importe via planilha Excel (Código e Descrição)
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                                  {/* Hidden file input for this machine */}
                                  <input
                                    type="file"
                                    ref={el => { machineFileInputRefs.current[machine.id] = el; }}
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                    onChange={e => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleImportMachineExcel(envIdx, mIdx, machine.name, file);
                                        e.target.value = '';
                                      }
                                    }}
                                  />

                                  <button
                                    type="button"
                                    onClick={() => machineFileInputRefs.current[machine.id]?.click()}
                                    className="text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                                    title="Importar planilha Excel individual com Código (Ref) e Descrição para esta máquina"
                                  >
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Importar Excel</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => downloadComponentsTemplate('maquina')}
                                    className="px-2 py-1 text-xs text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-medium transition flex items-center gap-1 shadow-xs"
                                    title="Baixar planilha modelo Excel (.xlsx) com colunas Código (Ref) e Descrição"
                                  >
                                    <FileDown className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="hidden md:inline">Modelo</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAddMachineItem(envIdx, mIdx)}
                                    className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ Linha</span>
                                  </button>
                                </div>
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
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: QUADRO DE COMANDO */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-amber-500" />
                        <span>Quadro de Comando do Ambiente</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full lowercase">
                          {env.panel?.items?.length || 0} componentes
                        </span>
                      </h4>

                      <button
                        type="button"
                        onClick={() => togglePanelCollapsed(env.id)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 shadow-xs ${
                          collapsedPanels[env.id]
                            ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-500'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                        title={collapsedPanels[env.id] ? "Expandir componentes do quadro de comando" : "Minimizar componentes do quadro de comando"}
                      >
                        {collapsedPanels[env.id] ? (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Expandir Quadro</span>
                          </>
                        ) : (
                          <>
                            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                            <span>Minimizar</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Collapsed State Bar (Only Quadro General Spec & Count Visible) */}
                    {collapsedPanels[env.id] ? (
                      <div
                        onClick={() => togglePanelCollapsed(env.id)}
                        className="cursor-pointer text-xs text-slate-600 hover:text-amber-800 hover:bg-amber-50/50 p-3 bg-white rounded-xl border border-dashed border-amber-300 transition flex items-center justify-between shadow-xs"
                        title="Clique para expandir e editar os componentes do quadro de comando"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                          <span className="font-bold text-slate-800">
                            Especificação: {env.panel?.description || 'Quadro Elétrico Padrão (Sem especificação descrita)'}
                          </span>
                          <span className="hidden sm:inline text-slate-300">•</span>
                          <span className="text-slate-500">
                            {env.panel?.items?.length || 0} componente(s) elétrico(s) (minimizados)
                          </span>
                        </div>
                        <span className="text-amber-700 font-bold flex items-center gap-1 text-xs flex-shrink-0">
                          <span>Ver / Editar Componentes</span>
                          <ChevronDown className="w-4 h-4" />
                        </span>
                      </div>
                    ) : (
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
                            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                              {/* Hidden file input for this panel */}
                              <input
                                type="file"
                                ref={el => { panelFileInputRefs.current[env.id] = el; }}
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImportPanelExcel(envIdx, file);
                                    e.target.value = '';
                                  }
                                }}
                              />

                              <button
                                type="button"
                                onClick={() => panelFileInputRefs.current[env.id]?.click()}
                                className="text-xs text-amber-850 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 text-amber-900"
                                title="Importar planilha Excel individual com Código (Ref) e Descrição para este quadro"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                                <span>Importar Excel</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => downloadComponentsTemplate('quadro')}
                                className="px-2 py-1 text-xs text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-medium transition flex items-center gap-1 shadow-xs"
                                title="Baixar planilha modelo Excel (.xlsx) com colunas Código (Ref) e Descrição"
                              >
                                <FileDown className="w-3.5 h-3.5 text-slate-500" />
                                <span className="hidden md:inline">Modelo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAddPanelItem(envIdx)}
                                className="text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Linha</span>
                              </button>
                            </div>
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
                    )}
                  </div>

                  {/* SECTION 3: ACESSÓRIOS */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Plug className="w-4 h-4 text-emerald-600" />
                        <span>Acessórios & Periféricos</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full lowercase">
                          {env.accessories?.length || 0} itens
                        </span>
                      </h4>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleAccessoryCollapsed(env.id)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition flex items-center gap-1.5 shadow-xs ${
                            collapsedAccessories[env.id]
                              ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                          title={collapsedAccessories[env.id] ? "Expandir lista de acessórios" : "Minimizar lista de acessórios"}
                        >
                          {collapsedAccessories[env.id] ? (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Expandir Acessórios</span>
                            </>
                          ) : (
                            <>
                              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                              <span>Minimizar</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddAccessory(envIdx)}
                          className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded-lg transition flex items-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Linha</span>
                        </button>
                      </div>
                    </div>

                    {/* Collapsed State Bar (Only Accessories Count Visible) */}
                    {collapsedAccessories[env.id] ? (
                      <div
                        onClick={() => toggleAccessoryCollapsed(env.id)}
                        className="cursor-pointer text-xs text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/50 p-3 bg-white rounded-xl border border-dashed border-emerald-300 transition flex items-center justify-between shadow-xs"
                        title="Clique para expandir e editar os acessórios deste ambiente"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-slate-800">
                            {env.accessories?.length || 0} acessório(s) / periférico(s) cadastrado(s) (minimizados)
                          </span>
                        </div>
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs flex-shrink-0">
                          <span>Ver / Editar Acessórios</span>
                          <ChevronDown className="w-4 h-4" />
                        </span>
                      </div>
                    ) : (
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
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Confirmation for Environment Deletion */}
      {envToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Excluir Ambiente?</h4>
                <p className="text-xs text-slate-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Tem certeza de que deseja remover o ambiente <strong className="text-slate-900 font-bold">"{envToDelete.name}"</strong>? 
              Todas as máquinas, quadro de comando e acessórios deste ambiente serão excluídos permanentemente.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEnvToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEnvironment}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-red-500/20 active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Ambiente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nomenclature Decoder Modal Dialog */}
      {isNomenclatureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>Decodificador de Nomenclatura Termoprol</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-mono">
                      Linha T (Rev-12) & QC/QF (Rev-07)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Preencha o modelo da máquina ou quadro de comando para inspecionar cada sigla ou aplicar ao ambiente selecionado
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {currentOrder.environments && currentOrder.environments.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400 font-medium">Ambiente Alvo:</span>
                    <select
                      value={activeEnvTab}
                      onChange={e => setActiveEnvTab(Number(e.target.value))}
                      className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                    >
                      {currentOrder.environments.map((env, eIdx) => (
                        <option key={env.id || eIdx} value={eIdx} className="bg-slate-900 text-white">
                          Ambiente {eIdx + 1}: {env.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsNomenclatureModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition text-base font-bold"
                  title="Fechar Decodificador"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <NomenclatureDecoder
                initialMachineCode={currentOrder.environments[activeEnvTab]?.machineModelCode || ''}
                initialPanelCode={currentOrder.environments[activeEnvTab]?.panelModelCode || ''}
                onApplyMachineCode={(code, decoded) => {
                  handleApplyMachineNomenclature(activeEnvTab, code, decoded);
                  setIsNomenclatureModalOpen(false);
                }}
                onApplyPanelCode={(code, decoded) => {
                  handleApplyPanelNomenclature(activeEnvTab, code, decoded);
                  setIsNomenclatureModalOpen(false);
                }}
                compact={false}
                hideHeader={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Component Import Preview Modal */}
      {componentImportPreview && (() => {
        const totalItems = componentImportPreview.items.length;
        const blockedCount = componentImportPreview.items.filter(it => it.wasExcluded).length;
        const selectedCount = componentImportPreview.items.filter(it => it.selected).length;

        const displayedItems = componentImportPreview.items.filter(it => {
          if (componentImportPreview.filterTab === 'ready') return it.selected;
          if (componentImportPreview.filterTab === 'excluded') return it.wasExcluded;
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Importação de Componentes via Excel
                    </h3>
                    <p className="text-xs text-slate-500">
                      Destino: <span className="font-semibold text-emerald-800">{componentImportPreview.targetTitle}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setComponentImportPreview(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* Warning if any items in this spreadsheet are in the blocked memory */}
                {blockedCount > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 flex items-start gap-2.5">
                    <Ban className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Proteção de Itens Bloqueados:</strong> Localizamos <strong>{blockedCount} componente(s)</strong> nesta planilha que foram excluídos anteriormente de outras listas e estão <strong>bloqueados para não serem importados</strong>.
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Total: <strong className="text-slate-900">{totalItems}</strong> itens encontrados | Selecionados para importar: <strong className="text-emerald-700">{selectedCount}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = componentImportPreview.items.map(it => ({ ...it, selected: !it.wasExcluded }));
                        setComponentImportPreview({ ...componentImportPreview, items: updated });
                      }}
                      className="text-[11px] font-bold text-blue-700 hover:underline"
                    >
                      Selecionar Não-Bloqueados
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = componentImportPreview.items.map(it => ({ ...it, selected: false }));
                        setComponentImportPreview({ ...componentImportPreview, items: updated });
                      }}
                      className="text-[11px] font-bold text-slate-600 hover:underline"
                    >
                      Desmarcar Todos
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-200 pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setComponentImportPreview({ ...componentImportPreview, filterTab: 'all' })}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      componentImportPreview.filterTab === 'all'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Todos ({totalItems})
                  </button>
                  <button
                    type="button"
                    onClick={() => setComponentImportPreview({ ...componentImportPreview, filterTab: 'ready' })}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      componentImportPreview.filterTab === 'ready'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-emerald-700'
                    }`}
                  >
                    A Importar ({selectedCount})
                  </button>
                  {blockedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setComponentImportPreview({ ...componentImportPreview, filterTab: 'excluded' })}
                      className={`px-3 py-1 rounded-lg font-bold transition ${
                        componentImportPreview.filterTab === 'excluded'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-rose-600 hover:text-rose-800'
                      }`}
                    >
                      Bloqueados ({blockedCount})
                    </button>
                  )}
                </div>

                {/* Items List Preview Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 w-10 text-center">Importar</th>
                          <th className="px-3 py-2 w-32">Código (Ref)</th>
                          <th className="px-3 py-2">Descrição</th>
                          <th className="px-3 py-2 w-16 text-center">Qtd</th>
                          <th className="px-3 py-2 w-32">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedItems.map((it, idx) => {
                          const originalIdx = componentImportPreview.items.findIndex(orig => orig === it);
                          return (
                            <tr
                              key={idx}
                              className={`transition ${
                                it.selected ? 'bg-white hover:bg-emerald-50/30' : 'bg-slate-50/80 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={it.selected}
                                  onChange={() => {
                                    const updated = [...componentImportPreview.items];
                                    updated[originalIdx].selected = !updated[originalIdx].selected;
                                    setComponentImportPreview({ ...componentImportPreview, items: updated });
                                  }}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-3 py-2 font-mono font-bold text-slate-800">
                                {it.code}
                              </td>
                              <td className="px-3 py-2 text-slate-700 font-medium">
                                {it.name}
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-slate-900">
                                {it.quantity}
                              </td>
                              <td className="px-3 py-2">
                                {it.wasExcluded ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                    <Ban className="w-3 h-3" />
                                    <span>Bloqueado</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    <span>Pronto</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                  <div className="font-bold text-amber-900 mt-0.5">Aviso:</div>
                  <div>
                    Você pode <strong>Adicionar</strong> os {selectedCount} itens selecionados aos já existentes ou <strong>Substituir</strong> a lista atual. Itens desmarcados serão memorizados como bloqueados para não entrarem em outras listas.
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setComponentImportPreview(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition self-stretch sm:self-auto text-center"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={selectedCount === 0}
                    onClick={() =>
                      applyImportedComponents(
                        componentImportPreview.envIdx,
                        componentImportPreview.mIdx,
                        componentImportPreview.isPanel,
                        componentImportPreview.items,
                        false
                      )
                    }
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicionar ({selectedCount}) aos Existentes</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedCount === 0}
                    onClick={() =>
                      applyImportedComponents(
                        componentImportPreview.envIdx,
                        componentImportPreview.mIdx,
                        componentImportPreview.isPanel,
                        componentImportPreview.items,
                        true
                      )
                    }
                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <span>⟳ Substituir com ({selectedCount})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Persistent Blocked Components Memory Modal */}
      {isExcludedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>Memória de Itens Bloqueados</span>
                    <span className="text-xs bg-rose-200/70 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                      {blockedMemoryList.length} item(ns)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Itens excluídos de qualquer máquina ou quadro ficam memorizados para não serem importados nem acrescentados em outras listas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExcludedModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Memória Permanente Ativa:</strong> Mesmo que uma máquina ou lista seja apagada deste pedido, estes itens <strong>não serão importados</strong> de planilhas Excel nem poderão ser acrescentados via Adicionar Rápido em outras listas.
                </div>
              </div>

              {/* Add manual block input */}
              <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-3 space-y-2">
                <span className="text-xs font-bold text-rose-900 uppercase tracking-wide block">
                  Adicionar Código / Descrição para Bloquear Manualmente:
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    list="catalogDatalist"
                    value={newExcludedCode}
                    onChange={e => setNewExcludedCode(e.target.value)}
                    placeholder="Código (ex: COMP-01, VALV-02)"
                    className="w-full sm:w-44 border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase text-rose-950 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <input
                    type="text"
                    value={newExcludedName}
                    onChange={e => setNewExcludedName(e.target.value)}
                    placeholder="Descrição opcional (ou busca automática)"
                    className="w-full sm:flex-grow border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleManualAddExcluded}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Bloquear Item</span>
                  </button>
                </div>
              </div>

              {/* Search in blocked items */}
              {blockedMemoryList.length > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={blockedSearchQuery}
                    onChange={e => setBlockedSearchQuery(e.target.value)}
                    placeholder="Filtrar itens bloqueados..."
                    className="w-full sm:w-64 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-500">
                    Exibindo {blockedMemoryList.filter(it => !blockedSearchQuery || it.code.toLowerCase().includes(blockedSearchQuery.toLowerCase()) || it.name.toLowerCase().includes(blockedSearchQuery.toLowerCase())).length} de {blockedMemoryList.length}
                  </span>
                </div>
              )}

              {/* Blocked Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5 w-10 text-center">#</th>
                        <th className="px-3 py-2.5 w-36">Código (Ref)</th>
                        <th className="px-3 py-2.5">Descrição</th>
                        <th className="px-3 py-2.5 w-44">Origem do Bloqueio</th>
                        <th className="px-3 py-2.5 w-24 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {blockedMemoryList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                            Nenhum item bloqueado na memória no momento. Quando você excluir componentes de qualquer lista, eles aparecerão aqui automaticamente.
                          </td>
                        </tr>
                      ) : (
                        blockedMemoryList
                          .filter(it => !blockedSearchQuery || it.code.toLowerCase().includes(blockedSearchQuery.toLowerCase()) || it.name.toLowerCase().includes(blockedSearchQuery.toLowerCase()))
                          .map((it, idx) => (
                            <tr key={idx} className="hover:bg-rose-50/40">
                              <td className="px-3 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2.5 font-mono font-bold text-rose-800">
                                {it.code || 'SEM CÓDIGO'}
                              </td>
                              <td className="px-3 py-2.5 text-slate-700 font-medium">
                                {it.name || 'Sem descrição'}
                              </td>
                              <td className="px-3 py-2.5 text-slate-500 text-[11px]">
                                {it.from || 'Lista excluída'}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleUnexcludeItem(it.code, it.name)}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 text-blue-700 hover:text-blue-900 border border-slate-200 rounded-lg text-[11px] font-bold transition shadow-xs"
                                  title="Desbloquear este item para permitir importá-lo ou adicioná-lo novamente"
                                >
                                  Desbloquear
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {blockedMemoryList.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Tem certeza de que deseja limpar toda a memória de itens bloqueados? Todos os itens poderão ser importados novamente.')) {
                      handleClearAllExcluded();
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                >
                  Limpar Toda a Memória
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setIsExcludedModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Concluído / Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
