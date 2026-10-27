import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { parseOrderInfoFromEmail, ParsedOrderFromEmail } from '../utils/emailOrderParser';

// Initialize Firebase App instance safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

const provider = new GoogleAuthProvider();
provider.addScope(GMAIL_SCOPE);
provider.setCustomParameters({
  prompt: 'select_account'
});

// Cache the access token strictly in memory (per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface GmailAlertItem {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  date: string;
  snippet: string;
  bodyText: string;
  parsedOrder: ParsedOrderFromEmail;
  timestamp: number;
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Falha ao obter token de acesso do Google Workspace / Gmail');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erro de autenticação Google Workspace:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Storage keys for registered senders, acknowledged alerts and processed emails history
const REGISTERED_SENDERS_KEY = 'termoprol_registered_gmail_senders';
const ACKNOWLEDGED_ALERTS_KEY = 'termoprol_acknowledged_gmail_alerts';
const PROCESSED_EMAILS_HISTORY_KEY = 'termoprol_gmail_processed_history';

// Realistic initial history items for Termoprol to illustrate extracted emails
const defaultHistoryItems: GmailAlertItem[] = [
  {
    id: 'demo-gmail-msg-01',
    threadId: 'demo-thread-01',
    sender: 'Carlos Silva <compras@frigorificobf.com.br>',
    senderEmail: 'compras@frigorificobf.com.br',
    subject: 'Novo Pedido de Venda PV-10482 - Frigorífico Boi Forte',
    date: 'Ontem às 14:32',
    snippet: 'Boa tarde equipe Termoprol, segue confirmação do pedido PV-10482 para a nova câmara fria com prazo de embarque para 25/11/2026...',
    bodyText: 'Boa tarde equipe Termoprol,\n\nSegue confirmação de compra:\nPedido de Venda: PV-10482\nCliente: Frigorífico Boi Forte Ltda\nPrazo de Embarque: 25/11/2026\nAmbientes: Câmara Fria e Desossa\n\nFavor acusar recebimento.\nAtt, Carlos Silva - Compras',
    parsedOrder: {
      orderNumber: 'PV-10482',
      customer: 'Frigorífico Boi Forte Ltda',
      deliveryDate: '2026-11-25',
      formattedDeliveryDate: '25/11/2026',
      notes: 'Importado de e-mail: Novo Pedido de Venda PV-10482 - Frigorífico Boi Forte. Remetente: compras@frigorificobf.com.br. Setores identificados: Câmara Fria, Desossa.',
      detectedEnvironments: ['Câmara Fria', 'Desossa'],
      confidence: {
        hasOrderNumber: true,
        hasCustomer: true,
        hasDeliveryDate: true
      },
      rawMatches: {
        pvText: 'PV-10482',
        customerText: 'Frigorífico Boi Forte Ltda',
        shippingDateText: '25/11/2026'
      }
    },
    timestamp: Date.now() - 86400000
  },
  {
    id: 'demo-gmail-msg-02',
    threadId: 'demo-thread-02',
    sender: 'Mariana Souza <suprimentos@laticiniosestrela.com.br>',
    senderEmail: 'suprimentos@laticiniosestrela.com.br',
    subject: 'Aprovação PV-10519 - Laticínios Estrela do Vale',
    date: 'Hoje às 09:15',
    snippet: 'Prezados, estamos formalizando o PV-10519. Cliente: Laticínios Estrela do Vale. Data de embarque acordada para 12/12/2026...',
    bodyText: 'Prezados,\n\nEstamos formalizando o pedido:\nPV: 10519\nCliente: Laticínios Estrela do Vale S/A\nData de embarque: 12/12/2026\nSetores: Sala de Pasteurização e Recepção de Leite\n\nAtt,\nMariana Souza',
    parsedOrder: {
      orderNumber: 'PV-10519',
      customer: 'Laticínios Estrela do Vale S/A',
      deliveryDate: '2026-12-12',
      formattedDeliveryDate: '12/12/2026',
      notes: 'Importado de e-mail: Aprovação PV-10519 - Laticínios Estrela do Vale. Remetente: suprimentos@laticiniosestrela.com.br. Setores identificados: Sala de Pasteurização, Recepção de Leite.',
      detectedEnvironments: ['Sala de Pasteurização', 'Recepção de Leite'],
      confidence: {
        hasOrderNumber: true,
        hasCustomer: true,
        hasDeliveryDate: true
      },
      rawMatches: {
        pvText: 'PV: 10519',
        customerText: 'Laticínios Estrela do Vale S/A',
        shippingDateText: '12/12/2026'
      }
    },
    timestamp: Date.now() - 14400000
  }
];

export const getProcessedEmailsHistory = (): GmailAlertItem[] => {
  try {
    const raw = localStorage.getItem(PROCESSED_EMAILS_HISTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return defaultHistoryItems;
};

export const saveProcessedEmailToHistory = (newItems: GmailAlertItem[]): GmailAlertItem[] => {
  try {
    const current = getProcessedEmailsHistory();
    const map = new Map<string, GmailAlertItem>();
    current.forEach(item => map.set(item.id, item));
    newItems.forEach(item => map.set(item.id, item));

    const sorted = Array.from(map.values())
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 10); // Exibe e mantém os últimos 10 e-mails processados

    localStorage.setItem(PROCESSED_EMAILS_HISTORY_KEY, JSON.stringify(sorted));
    return sorted;
  } catch (err) {
    console.warn('Erro ao salvar histórico de e-mails processados:', err);
    return [];
  }
};

export const clearProcessedHistory = () => {
  localStorage.setItem(PROCESSED_EMAILS_HISTORY_KEY, JSON.stringify([]));
};

export const getRegisteredSenders = (): string[] => {
  try {
    const raw = localStorage.getItem(REGISTERED_SENDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  // Default suggestion with user's email
  return ['projeletrico01@termoprol.com.br'];
};

export const saveRegisteredSenders = (senders: string[]) => {
  localStorage.setItem(REGISTERED_SENDERS_KEY, JSON.stringify(senders.map(s => s.trim().toLowerCase()).filter(Boolean)));
};

export const getAcknowledgedAlerts = (): string[] => {
  try {
    const raw = localStorage.getItem(ACKNOWLEDGED_ALERTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const acknowledgeAlert = (messageId: string) => {
  const current = getAcknowledgedAlerts();
  if (!current.includes(messageId)) {
    const updated = [...current, messageId];
    // Keep max 500 ids
    if (updated.length > 500) updated.shift();
    localStorage.setItem(ACKNOWLEDGED_ALERTS_KEY, JSON.stringify(updated));
  }
};

export const clearAllAcknowledged = () => {
  localStorage.removeItem(ACKNOWLEDGED_ALERTS_KEY);
};

// Play pleasant multi-tone alert sound using browser Web Audio API
export const playAlertSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Chime pattern: 3 rising notes repeated
    playTone(587.33, 0, 0.2);     // D5
    playTone(739.99, 0.15, 0.2);  // F#5
    playTone(880.00, 0.3, 0.4);   // A5
    playTone(1174.66, 0.55, 0.5); // D6
  } catch (err) {
    console.warn('Audio alert not allowed by browser autoplay policy:', err);
  }
};

// Query Gmail API for messages matching registered senders
export const fetchRecentEmailsFromSenders = async (
  token: string, 
  senders: string[]
): Promise<GmailAlertItem[]> => {
  if (!token || senders.length === 0) return [];

  // Build query: from:(email1 OR email2)
  const fromQuery = senders.map(s => `from:${s}`).join(' OR ');
  const query = `(${fromQuery})`;

  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`;
  const res = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('Sessão do Gmail expirada. Faça login novamente.');
    }
    throw new Error(`Erro ao consultar Gmail (${res.status})`);
  }

  const data = await res.json();
  const messages: { id: string; threadId: string }[] = data.messages || [];

  if (messages.length === 0) return [];

  // Helper to decode Gmail's web-safe base64
  const decodeBase64Utf8 = (base64Str: string): string => {
    try {
      const base64 = base64Str.replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch {
      return '';
    }
  };

  // Helper to extract plain text recursively from message payload
  const extractBodyText = (payload: any): string => {
    if (!payload) return '';
    let result = '';

    if (payload.body?.data) {
      result += decodeBase64Utf8(payload.body.data) + ' ';
    }

    if (payload.parts && Array.isArray(payload.parts)) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          result += decodeBase64Utf8(part.body.data) + ' ';
        } else if (part.mimeType === 'text/html' && part.body?.data && !result.trim()) {
          const html = decodeBase64Utf8(part.body.data);
          result += html.replace(/<[^>]+>/g, ' ') + ' ';
        }
        if (part.parts) {
          result += extractBodyText(part) + ' ';
        }
      }
    }

    return result.replace(/\s+/g, ' ').trim();
  };

  // Fetch details for up to 10 newest messages
  const items: GmailAlertItem[] = [];
  const subset = messages.slice(0, 10);

  for (const m of subset) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!msgRes.ok) continue;

      const detail = await msgRes.json();
      const headers: { name: string; value: string }[] = detail.payload?.headers || [];

      const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Remetente Desconhecido';
      const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(Sem Assunto)';
      const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';

      // Extract raw email from From header (e.g. "Name <email@domain.com>")
      const emailMatch = fromHeader.match(/<([^>]+)>/);
      const senderEmail = emailMatch ? emailMatch[1].toLowerCase() : fromHeader.toLowerCase();

      // Extract full body text and snippet
      const bodyText = extractBodyText(detail.payload);
      const snippet = detail.snippet || '';

      // Filter and extract PV, Cliente and Prazo de Embarque from email content
      const parsedOrder = parseOrderInfoFromEmail(subjectHeader, bodyText, snippet);

      items.push({
        id: m.id,
        threadId: m.threadId,
        sender: fromHeader,
        senderEmail,
        subject: subjectHeader,
        date: dateHeader,
        snippet,
        bodyText,
        parsedOrder,
        timestamp: Number(detail.internalDate) || Date.now()
      });
    } catch (err) {
      console.warn('Erro ao processar mensagem do Gmail:', err);
    }
  }

  // Automatically save to the 10 processed emails history
  if (items.length > 0) {
    saveProcessedEmailToHistory(items);
  }

  return items;
};
