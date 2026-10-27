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

// Storage keys for registered senders and acknowledged alerts
const REGISTERED_SENDERS_KEY = 'termoprol_registered_gmail_senders';
const ACKNOWLEDGED_ALERTS_KEY = 'termoprol_acknowledged_gmail_alerts';

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

  // Fetch details for up to 5 newest messages
  const items: GmailAlertItem[] = [];
  const subset = messages.slice(0, 5);

  for (const m of subset) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
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

      items.push({
        id: m.id,
        threadId: m.threadId,
        sender: fromHeader,
        senderEmail,
        subject: subjectHeader,
        date: dateHeader,
        snippet: detail.snippet || '',
        timestamp: Number(detail.internalDate) || Date.now()
      });
    } catch {
      // ignore single message fetch error
    }
  }

  return items;
};
