import { parseExcelDate, formatDateBR } from './excel';
import { getRelativeDate } from '../data/initialData';

export interface ParsedOrderFromEmail {
  orderNumber: string;
  customer: string;
  deliveryDate: string;
  formattedDeliveryDate: string;
  detectedEnvironments: string[];
  notes: string;
  confidence: {
    hasOrderNumber: boolean;
    hasCustomer: boolean;
    hasDeliveryDate: boolean;
  };
  rawMatches: {
    pvText?: string;
    customerText?: string;
    shippingDateText?: string;
  };
}

/**
 * Standardize dates in DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
 */
export function normalizeDateToISO(dateStr: string): string {
  if (!dateStr) return getRelativeDate(15);
  const clean = dateStr.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const brMatch = clean.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    let year = brMatch[3];
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${month}-${day}`;
  }

  return parseExcelDate(clean);
}

/**
 * Parses email subject, body text, and snippet to intelligently extract:
 * 1. Pedido de Venda (PV)
 * 2. Cliente / Razão Social
 * 3. Prazo de Embarque / Data de Entrega
 * 4. Ambientes mencionados (Câmaras, Desossa, etc.)
 */
export function parseOrderInfoFromEmail(
  subject: string = '',
  bodyText: string = '',
  snippet: string = ''
): ParsedOrderFromEmail {
  const fullText = `${subject}\n\n${bodyText}\n\n${snippet}`;
  const lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let rawPv: string | null = null;
  let rawCustomer: string | null = null;
  let rawDate: string | null = null;

  // -------------------------------------------------------------
  // 1. EXTRAIR PEDIDO DE VENDA (PV)
  // -------------------------------------------------------------
  // Priority 1: Direct PV patterns like "PV: 12345", "PV 12345", "PV-12345", "Pedido de Venda: 12345"
  const pvPatterns = [
    /(?:PEDIDO\s+DE\s+VENDA|P\.V\.|PV)[\s:.-]*([A-Z0-9\/-]{3,20})/i,
    /(?:PEDIDO\s+N[º°]?|PEDIDO)[\s:.-]*([A-Z0-9\/-]{3,20})/i,
    /#\s*([0-9]{4,8})/i
  ];

  for (const pattern of pvPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Avoid false positives like "PV de teste" or words
      if (/\d/.test(candidate)) {
        rawPv = candidate;
        break;
      }
    }
  }

  // Format PV cleanly (e.g. ensure starts with PV-)
  let orderNumber = '';
  let hasOrderNumber = false;
  if (rawPv) {
    hasOrderNumber = true;
    const cleanPv = rawPv.toUpperCase().replace(/^PV[\s_:-]*/i, '');
    orderNumber = `PV-${cleanPv}`;
  } else {
    // Generate fallback PV placeholder
    orderNumber = `PV-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // -------------------------------------------------------------
  // 2. EXTRAIR CLIENTE / RAZÃO SOCIAL
  // -------------------------------------------------------------
  const customerPatterns = [
    /(?:CLIENTE\s*\/\s*RAZ[ÃA]O\s+SOCIAL|RAZ[ÃA]O\s+SOCIAL|CLIENTE|EMPRESA|DESTINAT[ÁA]RIO)[\s:.-]+([^\n\r\t;,]{3,70})/i,
    /(?:FATURAR\s+PARA|EM\s+NOME\s+DE)[\s:.-]+([^\n\r\t;,]{3,70})/i
  ];

  for (const pattern of customerPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Clean up common prefixes or trailing punctuation
      const cleanCandidate = candidate
        .replace(/^[-–—:\s]+/, '')
        .replace(/[-–—:\s]+$/, '');
      if (cleanCandidate.length >= 3) {
        rawCustomer = cleanCandidate;
        break;
      }
    }
  }

  // Fallback for Customer from Subject line patterns like "PV 12345 - CLIENTE XYZ"
  if (!rawCustomer && subject) {
    const subjectDelimMatch = subject.match(/(?:PV|PEDIDO)[^\w\d]*[\w\d]+[^\w\d]*[-–—|/][^\w\d]*([^\n\r-–—|]{3,60})/i);
    if (subjectDelimMatch && subjectDelimMatch[1]) {
      rawCustomer = subjectDelimMatch[1].trim();
    }
  }

  let customer = rawCustomer || '';
  const hasCustomer = !!rawCustomer;
  if (!customer) {
    customer = 'Cliente a Definir';
  }

  // -------------------------------------------------------------
  // 3. EXTRAIR PRAZO DE EMBARQUE / DATA DE ENTREGA
  // -------------------------------------------------------------
  const shippingPatterns = [
    /(?:PRAZO\s+(?:DE\s+)?EMBARQUE|DATA\s+(?:DE\s+)?EMBARQUE|PREVIS[ÃA]O\s+(?:DE\s+)?EMBARQUE|EMBARQUE\s+PREVISTO|EMBARQUE)[\s:.-]*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i,
    /(?:PRAZO\s+(?:DE\s+)?ENTREGA|DATA\s+(?:DE\s+)?ENTREGA|PREVIS[ÃA]O\s+(?:DE\s+)?ENTREGA|ENTREGA\s+PREVISTA|ENTREGA)[\s:.-]*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i,
    /(?:PRAZO\s+FATURAMENTO|PREVIS[ÃA]O)[\s:.-]*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{2,4})/i
  ];

  for (const pattern of shippingPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      rawDate = match[1].trim();
      break;
    }
  }

  // Fallback: search for any Brazilian date in text if not explicitly tagged
  if (!rawDate) {
    const genericDateMatch = fullText.match(/\b([0-3]?[0-9][\/\.-][0-1]?[0-9][\/\.-]202[4-9])\b/);
    if (genericDateMatch && genericDateMatch[1]) {
      rawDate = genericDateMatch[1];
    }
  }

  const hasDeliveryDate = !!rawDate;
  const deliveryDate = rawDate ? normalizeDateToISO(rawDate) : getRelativeDate(15);
  const formattedDeliveryDate = formatDateBR(deliveryDate);

  // -------------------------------------------------------------
  // 4. DETECTAR AMBIENTES MENCIONADOS NO E-MAIL
  // -------------------------------------------------------------
  const environmentKeywords = [
    'Câmara Fria',
    'Câmara de Congelados',
    'Câmara de Resfriados',
    'Recepção',
    'Desossa',
    'Embalagem',
    'Túnel de Congelamento',
    'Ante-câmara',
    'Sala de Máquinas',
    'Estocagem',
    'Girofreezer'
  ];

  const detectedEnvironments: string[] = [];
  for (const envName of environmentKeywords) {
    const regex = new RegExp(`\\b${envName.replace(/-/g, '\\s*')}\\b`, 'i');
    if (regex.test(fullText)) {
      if (!detectedEnvironments.includes(envName)) {
        detectedEnvironments.push(envName);
      }
    }
  }

  if (detectedEnvironments.length === 0) {
    detectedEnvironments.push('Ambiente Principal');
  }

  // -------------------------------------------------------------
  // 5. OBSERVAÇÕES GERADAS A PARTIR DO E-MAIL
  // -------------------------------------------------------------
  const previewSnippet = snippet || lines.slice(0, 3).join(' ');
  const notes = `Importado do Gmail - Assunto: "${subject}". Trecho: ${previewSnippet.slice(0, 150)}...`;

  return {
    orderNumber,
    customer,
    deliveryDate,
    formattedDeliveryDate,
    detectedEnvironments,
    notes,
    confidence: {
      hasOrderNumber,
      hasCustomer,
      hasDeliveryDate
    },
    rawMatches: {
      pvText: rawPv || undefined,
      customerText: rawCustomer || undefined,
      shippingDateText: rawDate || undefined
    }
  };
}
