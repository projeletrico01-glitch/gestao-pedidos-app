import * as XLSX from 'xlsx';
import { CatalogItem, Order, OrderStatus } from '../types';
import { getRelativeDate } from '../data/initialData';
export { getRelativeDate };

// Parse Excel serial dates, formatted strings (DD/MM/YYYY, YYYY-MM-DD), or timestamps
export function parseExcelDate(val: any): string {
  if (!val) return getRelativeDate(7);

  if (typeof val === 'number') {
    const dateObj = XLSX.SSF.parse_date_code(val);
    if (dateObj) {
      const y = dateObj.y;
      const m = String(dateObj.m).padStart(2, '0');
      const d = String(dateObj.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const dateStr = String(val).trim();
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      let y = parts[2];
      if (y.length === 2) y = '20' + y;
      return `${y}-${m}-${d}`;
    }
  }

  if (dateStr.includes('-') && dateStr.length === 10) {
    return dateStr;
  }

  return getRelativeDate(7);
}

// Format YYYY-MM-DD to DD/MM/YYYY
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Calculate delivery status & remaining days
export function calculateRemainingDays(deliveryDateStr: string, status?: OrderStatus) {
  if (!deliveryDateStr) {
    return {
      days: 0,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      text: 'Sem data',
      isOverdue: false
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = deliveryDateStr.split('-');
  const delivery = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  delivery.setHours(0, 0, 0, 0);

  const diffTime = delivery.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (status === 'Entregue') {
    return {
      days: diffDays,
      badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
      text: 'Entregue',
      isOverdue: false
    };
  }

  if (diffDays < 0) {
    return {
      days: diffDays,
      badgeClass: 'bg-red-50 text-red-700 border border-red-200 font-bold',
      text: `${Math.abs(diffDays)} dia(s) atrasado`,
      isOverdue: true
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      badgeClass: 'bg-amber-500 text-white font-bold animate-pulse shadow-sm',
      text: 'Entrega HOJE',
      isOverdue: false
    };
  } else if (diffDays <= 3) {
    return {
      days: diffDays,
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-300 font-semibold',
      text: `${diffDays} dia(s) restante(s)`,
      isOverdue: false
    };
  } else {
    return {
      days: diffDays,
      badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      text: `${diffDays} dias restantes`,
      isOverdue: false
    };
  }
}

// Parse Catalog Excel file
export async function readCatalogFromExcel(file: File): Promise<{ items: CatalogItem[]; error?: string }> {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    if (rows.length < 2) {
      return { items: [], error: 'A planilha selecionada está vazia ou não contém dados suficientes.' };
    }

    const headerRow = (rows[0] || []).map((h: any) => String(h || '').toLowerCase().trim());

    const codeColIdx = headerRow.findIndex((h: string) =>
      ['código', 'codigo', 'cod', 'code', 'id', 'referência', 'referencia'].some(k => h.includes(k))
    );
    const nameColIdx = headerRow.findIndex((h: string) =>
      ['nome', 'descrição', 'descricao', 'item', 'produto', 'description', 'nome do item'].some(k => h.includes(k))
    );
    const categoryColIdx = headerRow.findIndex((h: string) =>
      ['categoria', 'grupo', 'tipo', 'category'].some(k => h.includes(k))
    );
    const unitColIdx = headerRow.findIndex((h: string) =>
      ['unidade', 'un', 'unid', 'unit'].some(k => h.includes(k))
    );
    const priceColIdx = headerRow.findIndex((h: string) =>
      ['preço', 'preco', 'valor', 'price'].some(k => h.includes(k))
    );

    if (codeColIdx === -1 || nameColIdx === -1) {
      return {
        items: [],
        error: 'Colunas obrigatórias não encontradas. Certifique-se de que a planilha contenha "Código" e "Nome / Descrição".'
      };
    }

    const items: CatalogItem[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const rawCode = String(row[codeColIdx] || '').trim().toUpperCase();
      const rawName = String(row[nameColIdx] || '').trim();
      const rawCat = categoryColIdx !== -1 ? String(row[categoryColIdx] || 'Geral').trim() : 'Geral';
      const rawUnit = unitColIdx !== -1 ? String(row[unitColIdx] || 'UN').trim().toUpperCase() : 'UN';
      const rawPrice = priceColIdx !== -1 && !isNaN(Number(row[priceColIdx])) ? Number(row[priceColIdx]) : undefined;

      if (!rawCode || !rawName) continue;

      items.push({
        code: rawCode,
        name: rawName,
        category: rawCat || 'Geral',
        unit: rawUnit || 'UN',
        price: rawPrice
      });
    }

    return { items };
  } catch (err: any) {
    return { items: [], error: err.message || 'Erro ao processar o arquivo Excel.' };
  }
}

// Download Catalog Template Excel
export function downloadCatalogTemplate() {
  const templateData = [
    {
      'Código': 'COMP-01',
      'Nome / Descrição': 'Compressor Scroll 5HP R410A 220V',
      'Categoria': 'Máquinas',
      'Unidade': 'UN',
      'Preço Estimado': 3450.00
    },
    {
      'Código': 'DISJ-32',
      'Nome / Descrição': 'Disjuntor Trifásico DIN 32A Curva C',
      'Categoria': 'Quadros',
      'Unidade': 'UN',
      'Preço Estimado': 65.50
    },
    {
      'Código': 'CONT-32',
      'Nome / Descrição': 'Contator Trifásico 32A 220V',
      'Categoria': 'Componentes',
      'Unidade': 'UN',
      'Preço Estimado': 120.00
    },
    {
      'Código': 'SENS-NTC',
      'Nome / Descrição': 'Sensor de Temperatura NTC 10k 1.5m Inox',
      'Categoria': 'Acessórios',
      'Unidade': 'UN',
      'Preço Estimado': 42.00
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Catálogo');
  XLSX.writeFile(wb, 'Modelo_Importacao_Catalogo.xlsx');
}

// Export Catalog to Excel
export function exportCatalogToExcel(catalog: CatalogItem[]) {
  const exportData = catalog.map(item => ({
    'Código': item.code,
    'Nome / Descrição': item.name,
    'Categoria': item.category,
    'Unidade': item.unit || 'UN',
    'Preço Estimado': item.price || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Itens Cadastrados');
  XLSX.writeFile(wb, `Catalogo_Itens_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Parse Orders Excel file
export async function readOrdersFromExcel(file: File): Promise<{ orders: Partial<Order>[]; error?: string }> {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    if (rows.length < 2) {
      return { orders: [], error: 'A planilha está vazia.' };
    }

    const headerRow = (rows[0] || []).map((h: any) => String(h || '').toLowerCase().trim());
    const orderNumCol = headerRow.findIndex((h: string) =>
      ['pedido', 'pv', 'numero', 'número', 'order', 'codigo'].some(k => h.includes(k))
    );
    const customerCol = headerRow.findIndex((h: string) =>
      ['cliente', 'razão', 'razao', 'customer', 'empresa'].some(k => h.includes(k))
    );
    const appSheetCol = headerRow.findIndex((h: string) =>
      ['appsheet', 'app sheet', 'app_sheet'].some(k => h.includes(k))
    );
    const statusCol = headerRow.findIndex((h: string) =>
      ['status', 'situação', 'situacao', 'estado'].some(k => h.includes(k))
    );
    const dateCol = headerRow.findIndex((h: string) =>
      ['data', 'entrega', 'prazo', 'delivery', 'previsão'].some(k => h.includes(k))
    );
    const notesCol = headerRow.findIndex((h: string) =>
      ['observação', 'observacao', 'obs', 'notas', 'notes'].some(k => h.includes(k))
    );

    if (orderNumCol === -1 || customerCol === -1) {
      return {
        orders: [],
        error: 'A planilha precisa conter pelo menos as colunas "Pedido" (ou "PV") e "Cliente".'
      };
    }

    const ordersList: Partial<Order>[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const orderNum = String(row[orderNumCol] || '').trim();
      const customer = String(row[customerCol] || '').trim();
      let appSheetVal: 'SIM' | 'NÃO' = 'NÃO';
      if (appSheetCol !== -1) {
        const rawApp = String(row[appSheetCol] || '').trim().toUpperCase();
        if (rawApp === 'SIM' || rawApp === 'S' || rawApp === 'YES' || rawApp === 'TRUE' || rawApp === '1') {
          appSheetVal = 'SIM';
        }
      }

      let status: OrderStatus = 'Pendente';
      if (statusCol !== -1) {
        const rawStatus = String(row[statusCol] || '').trim();
        if (rawStatus.toLowerCase().includes('pronto')) status = 'Pronto';
        else if (rawStatus.toLowerCase().includes('entregue')) status = 'Entregue';
        else status = 'Pendente';
      }

      const deliveryDate = dateCol !== -1 ? parseExcelDate(row[dateCol]) : getRelativeDate(7);
      const notes = notesCol !== -1 ? String(row[notesCol] || '').trim() : '';

      if (!orderNum || !customer) continue;

      ordersList.push({
        id: 'ord-' + Date.now() + '-' + i,
        orderNumber: orderNum,
        customer: customer,
        appSheet: appSheetVal,
        status: status,
        deliveryDate: deliveryDate,
        notes: notes,
        createdAt: new Date().toISOString(),
        environments: []
      });
    }

    return { orders: ordersList };
  } catch (err: any) {
    return { orders: [], error: err.message || 'Erro ao importar pedidos do Excel.' };
  }
}

// Download Orders Template Excel
export function downloadOrdersTemplate() {
  const templateData = [
    {
      'Pedido de Venda': 'PV-2026-001',
      'Cliente': 'Refrigeração Modelo S/A',
      'AppSheet': 'SIM',
      'Status': 'Pendente',
      'Data de Entrega': formatDateBR(getRelativeDate(5)),
      'Observações': 'Montagem prioritária para inauguração de filial'
    },
    {
      'Pedido de Venda': 'PV-2026-002',
      'Cliente': 'Indústria Alimentícia São Paulo',
      'AppSheet': 'NÃO',
      'Status': 'Pendente',
      'Data de Entrega': formatDateBR(getRelativeDate(10)),
      'Observações': 'Entregar com manual elétrico impresso'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Modelo Pedidos');
  XLSX.writeFile(wb, 'Modelo_Importacao_Pedidos.xlsx');
}

// Export Orders to Excel
export function exportOrdersToExcel(orders: Order[]) {
  const rows = orders.map(ord => {
    const totalEnvironments = ord.environments?.length || 0;
    const totalMachines = ord.environments?.reduce((acc, env) => acc + (env.machines?.length || 0), 0) || 0;
    const remaining = calculateRemainingDays(ord.deliveryDate, ord.status);

    return {
      'Pedido de Venda': ord.orderNumber,
      'Cliente': ord.customer,
      'AppSheet': ord.appSheet,
      'Status': ord.status,
      'Data de Entrega': formatDateBR(ord.deliveryDate),
      'Prazo / Dias': remaining.text,
      'Qtd Ambientes': totalEnvironments,
      'Qtd Máquinas': totalMachines,
      'Observações': ord.notes || '',
      'Criado em': formatDateBR(ord.createdAt?.split('T')[0] || '')
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pedidos de Venda');

  // Also include a sheet with technical breakdown of all environments
  const breakdownRows: any[] = [];
  orders.forEach(ord => {
    ord.environments?.forEach(env => {
      // Machines
      env.machines?.forEach(m => {
        breakdownRows.push({
          'Pedido': ord.orderNumber,
          'Cliente': ord.customer,
          'Ambiente': env.name,
          'Seção': 'Máquina',
          'Identificação / Item': `${m.quantity}x ${m.name}`,
          'Código': '',
          'Quantidade': m.quantity || 1,
          'Descrição Componente': m.items?.map(i => `${i.quantity ? `${i.quantity}x ` : '1x '}${i.code ? `[${i.code}] ` : ''}${i.name}`).join('; ') || ''
        });
      });

      // Panel
      if (env.panel && (env.panel.description || env.panel.items?.length)) {
        breakdownRows.push({
          'Pedido': ord.orderNumber,
          'Cliente': ord.customer,
          'Ambiente': env.name,
          'Seção': 'Quadro de Comando',
          'Identificação / Item': env.panel.description || 'Quadro elétrico',
          'Código': '',
          'Quantidade': 1,
          'Descrição Componente': env.panel.items?.map(i => `${i.quantity ? `${i.quantity}x ` : '1x '}${i.code ? `[${i.code}] ` : ''}${i.name}`).join('; ') || ''
        });
      }

      // Accessories
      env.accessories?.forEach(acc => {
        breakdownRows.push({
          'Pedido': ord.orderNumber,
          'Cliente': ord.customer,
          'Ambiente': env.name,
          'Seção': 'Acessório',
          'Identificação / Item': 'Acessório Periférico',
          'Código': acc.code || '',
          'Quantidade': acc.quantity || 1,
          'Descrição Componente': `${acc.quantity ? `${acc.quantity}x ` : '1x '}${acc.name || ''}`
        });
      });
    });
  });

  if (breakdownRows.length > 0) {
    const wsBreakdown = XLSX.utils.json_to_sheet(breakdownRows);
    XLSX.utils.book_append_sheet(wb, wsBreakdown, 'Detalhamento Técnico');
  }

  XLSX.writeFile(wb, `Relatorio_Pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
}
