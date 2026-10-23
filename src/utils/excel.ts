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
      badgeClass: 'bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 font-bold',
      text: 'Entregue',
      isOverdue: false
    };
  }

  if (diffDays < 0) {
    return {
      days: diffDays,
      badgeClass: 'bg-red-100 text-red-900 border border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-700 font-bold',
      text: `${Math.abs(diffDays)} dia(s) atrasado`,
      isOverdue: true
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      badgeClass: 'bg-amber-500 text-slate-950 font-bold animate-pulse shadow-sm',
      text: 'Entrega HOJE',
      isOverdue: false
    };
  } else if (diffDays <= 3) {
    return {
      days: diffDays,
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 font-bold',
      text: `${diffDays} dia(s) restante(s)`,
      isOverdue: false
    };
  } else {
    return {
      days: diffDays,
      badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700 font-bold',
      text: `${diffDays} dias restantes`,
      isOverdue: false
    };
  }
}

// Helper to calculate total environments, machines, panel items and accessories
export function getOrderTotals(order: Order) {
  const totalEnvironments = order.environments?.length || 0;
  const totalMachines = order.environments?.reduce((acc, env) => 
    acc + (env.machines?.reduce((mAcc, m) => mAcc + (Number(m.quantity) > 0 ? Number(m.quantity) : 1), 0) || 0), 0) || 0;
  const totalPanelItems = order.environments?.reduce((acc, env) => 
    acc + (env.panel?.items?.reduce((pAcc, p) => pAcc + (Number(p.quantity) > 0 ? Number(p.quantity) : 1), 0) || 0), 0) || 0;
  const totalAccessories = order.environments?.reduce((acc, env) => 
    acc + (env.accessories?.reduce((aAcc, a) => aAcc + (Number(a.quantity) > 0 ? Number(a.quantity) : 1), 0) || 0), 0) || 0;

  return {
    totalEnvironments,
    totalMachines,
    totalPanelItems,
    totalAccessories
  };
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
    const supervisoryCol = headerRow.findIndex((h: string) =>
      ['supervisor', 'supervisório', 'supervisorio', 'supervisory'].some(k => h.includes(k))
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

      let supervisoryVal: 'SIM' | 'NÃO' = 'NÃO';
      if (supervisoryCol !== -1) {
        const rawSup = String(row[supervisoryCol] || '').trim().toUpperCase();
        if (rawSup === 'SIM' || rawSup === 'S' || rawSup === 'YES' || rawSup === 'TRUE' || rawSup === '1') {
          supervisoryVal = 'SIM';
        }
      }

      let status: OrderStatus = 'Pendente';
      if (statusCol !== -1) {
        const rawStatus = String(row[statusCol] || '').trim().toLowerCase();
        if (rawStatus.includes('andamento') || rawStatus.includes('pronto')) status = 'Em Andamento';
        else if (rawStatus.includes('entreg')) status = 'Entregue';
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
        supervisory: supervisoryVal,
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
      'Supervisório': 'SIM',
      'Status': 'Pendente',
      'Data de Entrega': formatDateBR(getRelativeDate(5)),
      'Observações': 'Montagem prioritária para inauguração de filial'
    },
    {
      'Pedido de Venda': 'PV-2026-002',
      'Cliente': 'Indústria Alimentícia São Paulo',
      'AppSheet': 'NÃO',
      'Supervisório': 'NÃO',
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
    const { totalEnvironments, totalMachines } = getOrderTotals(ord);
    const remaining = calculateRemainingDays(ord.deliveryDate, ord.status);

    return {
      'Pedido de Venda': ord.orderNumber,
      'Cliente': ord.customer,
      'AppSheet': ord.appSheet,
      'Supervisório': ord.supervisory || 'NÃO',
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
          'Supervisório': ord.supervisory || 'NÃO',
          'Ambiente': env.name,
          'Temp. Operação': env.operatingTemperature || '',
          'Distância Evap/Cond': env.evaporatorDistance || '',
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
          'Supervisório': ord.supervisory || 'NÃO',
          'Ambiente': env.name,
          'Temp. Operação': env.operatingTemperature || '',
          'Distância Evap/Cond': env.evaporatorDistance || '',
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
          'Supervisório': ord.supervisory || 'NÃO',
          'Ambiente': env.name,
          'Temp. Operação': env.operatingTemperature || '',
          'Distância Evap/Cond': env.evaporatorDistance || '',
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

// -------------------------------------------------------------
// INDIVIDUAL MACHINE & PANEL COMPONENTS IMPORT / EXPORT
// -------------------------------------------------------------

export interface ImportedComponentItem {
  code: string;
  name: string;
  quantity: number;
}

/**
 * Reads an Excel file (.xlsx, .xls, .csv) and extracts items for machine or panel components.
 * Automatically identifies columns for Code (Ref), Description (Name), and Quantity.
 */
export async function readComponentsFromExcel(file: File): Promise<{ items: ImportedComponentItem[]; error?: string }> {
  try {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    if (!wb.SheetNames.length) {
      return { items: [], error: 'Arquivo Excel vazio ou sem planilhas.' };
    }

    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (!rawRows || rawRows.length === 0) {
      return { items: [], error: 'A planilha selecionada está vazia.' };
    }

    let headerRowIdx = -1;
    let codeCol = -1;
    let nameCol = -1;
    let qtyCol = -1;

    // Search header row among first 10 rows
    for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
      const row = rawRows[r];
      if (!Array.isArray(row)) continue;

      let foundCode = -1;
      let foundName = -1;
      let foundQty = -1;

      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] || '').trim().toLowerCase();
        if (cell) {
          if (foundCode === -1 && /^(c[oó]d|ref|c[oó]digo|refer[eê]ncia|item|part|pn|id|pe[çc]a\s*c[oó]d)/i.test(cell)) {
            foundCode = c;
          } else if (foundName === -1 && /(desc|nome|produto|pe[çc]a|material|especifica)/i.test(cell)) {
            foundName = c;
          } else if (foundQty === -1 && /^(q(uan)?t|qtd|qty|quant|quantidade|volume|unidades)/i.test(cell)) {
            foundQty = c;
          }
        }
      }

      if (foundCode !== -1 || foundName !== -1) {
        headerRowIdx = r;
        codeCol = foundCode;
        nameCol = foundName;
        qtyCol = foundQty;
        break;
      }
    }

    let startRow = 0;
    if (headerRowIdx !== -1) {
      startRow = headerRowIdx + 1;
      if (codeCol === -1 && nameCol !== -1) {
        codeCol = nameCol === 0 ? 1 : 0;
      } else if (nameCol === -1 && codeCol !== -1) {
        nameCol = codeCol === 0 ? 1 : 0;
      }
    } else {
      // Default fallback: Col 0 = Code, Col 1 = Name, Col 2 = Quantity
      codeCol = 0;
      nameCol = 1;
      qtyCol = 2;
      startRow = 0;
      const firstRowStr = (rawRows[0] || []).join(' ').toLowerCase();
      if (firstRowStr.includes('cod') || firstRowStr.includes('desc') || firstRowStr.includes('ref')) {
        startRow = 1;
      }
    }

    const items: ImportedComponentItem[] = [];

    for (let r = startRow; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      let code = codeCol !== -1 && row[codeCol] !== undefined ? String(row[codeCol]).trim() : '';
      let name = nameCol !== -1 && row[nameCol] !== undefined ? String(row[nameCol]).trim() : '';
      let quantity = 1;

      if (qtyCol !== -1 && row[qtyCol] !== undefined) {
        const rawQty = parseInt(String(row[qtyCol]).replace(/[^\d]/g, ''));
        if (!isNaN(rawQty) && rawQty > 0) {
          quantity = rawQty;
        }
      }

      // If user swapped columns (e.g. description in col 0 and short code in col 1)
      if (code.length > 30 && name.length > 0 && name.length <= 15 && !name.includes(' ')) {
        const tmp = code;
        code = name;
        name = tmp;
      }

      if (!code && !name) continue;

      code = code.toUpperCase();

      items.push({
        code,
        name: name || code,
        quantity: Math.max(1, quantity)
      });
    }

    if (items.length === 0) {
      return { items: [], error: 'Nenhum componente válido encontrado nas colunas da planilha.' };
    }

    return { items };
  } catch (err: any) {
    return { items: [], error: err.message || 'Erro ao processar arquivo Excel de componentes.' };
  }
}

/**
 * Downloads a pre-formatted Excel template for machine or panel components.
 */
export function downloadComponentsTemplate(type: 'maquina' | 'quadro' = 'maquina') {
  const isMachine = type === 'maquina';
  const templateData = isMachine
    ? [
        {
          'Código (Ref)': 'COMP-01',
          'Descrição do Componente': 'Compressor Scroll 5HP R410A 220V',
          'Quantidade': 1
        },
        {
          'Código (Ref)': 'VALV-EXP',
          'Descrição do Componente': 'Válvula de Expansão Eletrônica 3/8"',
          'Quantidade': 1
        },
        {
          'Código (Ref)': 'FILT-G4',
          'Descrição do Componente': 'Filtro de Ar Lavável G4 500x500mm',
          'Quantidade': 2
        },
        {
          'Código (Ref)': 'VENT-300',
          'Descrição do Componente': 'Microventilador Axial 300mm 220V',
          'Quantidade': 2
        }
      ]
    : [
        {
          'Código (Ref)': 'DISJ-32',
          'Descrição do Componente': 'Disjuntor Trifásico DIN 32A Curva C',
          'Quantidade': 1
        },
        {
          'Código (Ref)': 'CONT-32',
          'Descrição do Componente': 'Contator Trifásico 32A 220V (1NA+1NF)',
          'Quantidade': 2
        },
        {
          'Código (Ref)': 'RELE-TER',
          'Descrição do Componente': 'Relé Térmico de Sobrecarga 12-18A',
          'Quantidade': 1
        },
        {
          'Código (Ref)': 'CLP-01',
          'Descrição do Componente': 'Módulo CLP Siemens S7-1200 CPU 1214C',
          'Quantidade': 1
        }
      ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  ws['!cols'] = [{ wch: 18 }, { wch: 45 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isMachine ? 'Componentes Máquina' : 'Componentes Quadro');
  const fileName = isMachine ? 'Modelo_Componentes_Maquina.xlsx' : 'Modelo_Componentes_Quadro.xlsx';
  XLSX.writeFile(wb, fileName);
}
