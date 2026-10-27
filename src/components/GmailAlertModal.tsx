import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  Bell, 
  RefreshCw, 
  Plus, 
  Trash2, 
  X, 
  ShieldCheck, 
  LogOut, 
  Volume2, 
  VolumeX,
  History,
  Search,
  FileText,
  ChevronDown,
  ChevronUp,
  Building2,
  Calendar,
  Hash,
  RotateCcw,
  Sparkles,
  Inbox
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  googleSignIn, 
  googleLogout, 
  getAccessToken, 
  getRegisteredSenders, 
  saveRegisteredSenders, 
  getAcknowledgedAlerts, 
  acknowledgeAlert, 
  fetchRecentEmailsFromSenders, 
  getProcessedEmailsHistory,
  saveProcessedEmailToHistory,
  clearProcessedHistory,
  GmailAlertItem,
  playAlertSound 
} from '../services/gmailService';

interface GmailAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserChange: (user: User | null) => void;
  activeAlert: GmailAlertItem | null;
  onAcknowledgeAlert: (alertId: string) => void;
  onStartOrderFromEmail?: (parsed: any, emailItem: GmailAlertItem) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const GmailAlertModal: React.FC<GmailAlertModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserChange,
  activeAlert,
  onAcknowledgeAlert,
  onStartOrderFromEmail,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'history'>('monitor');
  const [senders, setSenders] = useState<string[]>(getRegisteredSenders);
  const [newSenderInput, setNewSenderInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentEmails, setRecentEmails] = useState<GmailAlertItem[]>([]);
  const [emailHistory, setEmailHistory] = useState<GmailAlertItem[]>([]);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSenders(getRegisteredSenders());
      setEmailHistory(getProcessedEmailsHistory());
      // If there's an active alert, focus monitor tab, otherwise keep user selection
      if (activeAlert) {
        setActiveTab('monitor');
      }
    }
  }, [isOpen, activeAlert]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        onUserChange(res.user);
        onShowToast(`Conectado com sucesso como ${res.user.email}!`, 'success');
        // Initial scan
        handleCheckEmails(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Falha ao autenticar com Google Workspace', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await googleLogout();
      onUserChange(null);
      setRecentEmails([]);
      onShowToast('Conta desconectada do Gmail.', 'info');
    } catch (err: any) {
      onShowToast(err.message || 'Erro ao desconectar', 'error');
    }
  };

  const handleAddSender = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSenderInput.trim().toLowerCase();
    if (!clean) return;
    if (!clean.includes('@') || !clean.includes('.')) {
      onShowToast('Por favor, informe um endereço de e-mail válido.', 'warning');
      return;
    }
    if (senders.includes(clean)) {
      onShowToast('Este remetente já está cadastrado.', 'info');
      return;
    }

    const updated = [...senders, clean];
    setSenders(updated);
    saveRegisteredSenders(updated);
    setNewSenderInput('');
    onShowToast(`Remetente ${clean} cadastrado para alertas!`, 'success');
  };

  const handleRemoveSender = (target: string) => {
    const updated = senders.filter(s => s !== target);
    setSenders(updated);
    saveRegisteredSenders(updated);
    onShowToast(`Remetente ${target} removido.`, 'info');
  };

  const handleCheckEmails = async (tokenOverride?: string) => {
    const token = tokenOverride || await getAccessToken();
    if (!token) {
      onShowToast('Faça login com sua conta Google para verificar os e-mails.', 'warning');
      return;
    }

    if (senders.length === 0) {
      onShowToast('Cadastre ao menos um remetente para monitorar.', 'warning');
      return;
    }

    setIsChecking(true);
    try {
      const emails = await fetchRecentEmailsFromSenders(token, senders);
      setRecentEmails(emails);
      setEmailHistory(getProcessedEmailsHistory());

      const acked = getAcknowledgedAlerts();
      const unacked = emails.filter(e => !acked.includes(e.id));

      if (unacked.length > 0) {
        if (soundEnabled) {
          playAlertSound();
        }
        onShowToast(`Atenção: ${unacked.length} novo(s) e-mail(s) de remetente cadastrado!`, 'warning');
      } else {
        onShowToast('Verificação concluída: nenhum novo e-mail pendente.', 'info');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Erro ao consultar e-mails do Gmail', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Deseja realmente limpar o histórico de e-mails processados?')) {
      clearProcessedHistory();
      setEmailHistory([]);
      onShowToast('Histórico de e-mails limpo com sucesso.', 'info');
    }
  };

  const handleToggleExpandEmail = (id: string) => {
    setExpandedEmailId(prev => prev === id ? null : id);
  };

  // Filtered history (always restricted to up to 10 most recent)
  const filteredHistory = useMemo(() => {
    const list = emailHistory.slice(0, 10);
    if (!historySearchTerm.trim()) return list;

    const term = historySearchTerm.toLowerCase();
    return list.filter(item => {
      const pv = item.parsedOrder?.orderNumber?.toLowerCase() || '';
      const cli = item.parsedOrder?.customer?.toLowerCase() || '';
      const subj = item.subject?.toLowerCase() || '';
      const sndr = item.sender?.toLowerCase() || '';
      const dt = item.parsedOrder?.formattedDeliveryDate?.toLowerCase() || '';
      return pv.includes(term) || cli.includes(term) || subj.includes(term) || sndr.includes(term) || dt.includes(term);
    });
  }, [emailHistory, historySearchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Central de E-mails & Pedidos Gmail</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800">
                  Google Workspace
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Detecção automática de Pedidos de Venda (PV), Cliente e Prazo de Embarque
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/90 px-6 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('monitor')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 -mb-px cursor-pointer ${
              activeTab === 'monitor'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Monitor & Remetentes</span>
            {activeAlert && (
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              setEmailHistory(getProcessedEmailsHistory());
            }}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 border-b-2 -mb-px cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico de E-mails</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {emailHistory.length > 10 ? 10 : emailHistory.length}
            </span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* TAB 1: MONITOR & CONFIGURAÇÃO DE REMETENTES */}
          {activeTab === 'monitor' && (
            <div className="space-y-6">
              {/* Active Alert Highlight (if any active alert) */}
              {activeAlert && (
                <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white p-4 rounded-2xl shadow-lg border-2 border-amber-300 animate-pulse space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black uppercase text-xs tracking-wider">
                      <AlertTriangle className="w-5 h-5 text-amber-200 animate-bounce" />
                      <span>ALERTA VISUAL: E-MAIL RECEBIDO!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => playAlertSound()}
                      className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      title="Tocar som de teste"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Tocar Alarme</span>
                    </button>
                  </div>

                  <div className="bg-black/30 p-3 rounded-xl space-y-1.5 text-xs">
                    <div>
                      <strong className="text-amber-200">De:</strong> {activeAlert.sender}
                    </div>
                    <div>
                      <strong className="text-amber-200">Assunto:</strong> {activeAlert.subject}
                    </div>
                    {activeAlert.date && (
                      <div className="text-[11px] text-slate-300">
                        <strong>Data:</strong> {activeAlert.date}
                      </div>
                    )}
                    <div className="text-slate-100 italic pt-1 border-t border-white/10 text-[11px] line-clamp-2">
                      "{activeAlert.snippet}"
                    </div>

                    {/* Extracted Order Fields Badge */}
                    {activeAlert.parsedOrder && (
                      <div className="mt-2 pt-2 border-t border-white/20 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-black/40 p-2.5 rounded-lg text-xs">
                        <div>
                          <span className="text-[10px] text-amber-300 uppercase font-black block">Pedido de Venda (PV):</span>
                          <strong className="text-white text-xs font-mono">{activeAlert.parsedOrder.orderNumber}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-300 uppercase font-black block">Cliente:</span>
                          <strong className="text-white text-xs truncate block">{activeAlert.parsedOrder.customer}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-300 uppercase font-black block">Prazo de Embarque:</span>
                          <strong className="text-white text-xs font-mono">{activeAlert.parsedOrder.formattedDeliveryDate}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    {onStartOrderFromEmail && activeAlert.parsedOrder && (
                      <button
                        type="button"
                        onClick={() => {
                          onStartOrderFromEmail(activeAlert.parsedOrder, activeAlert);
                          onClose();
                        }}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                        title="Abrir formulário de criação de pedido pré-preenchido com PV, Cliente e Prazo de Embarque"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Iniciar Pedido com estes Dados</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onAcknowledgeAlert(activeAlert.id)}
                      className="px-4 py-2 bg-white text-red-900 hover:bg-red-50 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>PARAR ALERTA</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Account Connection Status */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-5 h-5 ${user ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {user ? 'Conta Google Conectada' : 'Conexão com Google Workspace'}
                    </span>
                  </div>

                  {user && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-2.5 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Desconectar</span>
                    </button>
                  )}
                </div>

                {user ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{user.displayName || 'Usuário Google'}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                          Autorizado
                        </span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {user.email}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCheckEmails()}
                        disabled={isChecking}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                        <span>{isChecking ? 'Verificando...' : 'Verificar Agora'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Conecte com sua conta <strong>projeletrico01@termoprol.com.br</strong> ou conta Google institucional para que o sistema monitore novos e-mails recebidos.
                    </p>
                    <button
                      type="button"
                      onClick={handleLogin}
                      disabled={isLoggingIn}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-xs hover:shadow-sm transition active:scale-95 disabled:opacity-60 cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                      <span>{isLoggingIn ? 'Conectando ao Google...' : 'Entrar com Google Workspace'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Registered Senders List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-blue-600" />
                      <span>Remetentes Cadastrados para Alerta</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Qualquer e-mail vindo destes endereços acionará o alerta visual na tela
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                        soundEnabled 
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300'
                      }`}
                      title={soundEnabled ? 'Alarme sonoro ativado' : 'Alarme sonoro desativado'}
                    >
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                      <span className="text-[10px] hidden sm:inline">{soundEnabled ? 'Som Ativo' : 'Mudo'}</span>
                    </button>
                  </div>
                </div>

                {/* Add sender form */}
                <form onSubmit={handleAddSender} className="flex gap-2">
                  <input
                    type="email"
                    value={newSenderInput}
                    onChange={e => setNewSenderInput(e.target.value)}
                    placeholder="Ex: cliente@empresa.com.br, compras@termoprol.com.br"
                    className="flex-grow border border-slate-300 dark:border-slate-700 dark:bg-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 flex-shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cadastrar</span>
                  </button>
                </form>

                {/* Senders tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {senders.map(s => (
                    <div 
                      key={s} 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 text-xs font-semibold"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSender(s)}
                        className="p-0.5 hover:text-red-600 rounded-md transition cursor-pointer"
                        title={`Remover ${s}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {senders.length === 0 && (
                    <p className="text-xs text-slate-400 italic">
                      Nenhum remetente cadastrado ainda. Adicione o e-mail acima.
                    </p>
                  )}
                </div>
              </div>

              {/* Scanned emails preview */}
              {recentEmails.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Últimos E-mails Escaneados ({recentEmails.length})
                    </h5>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('history');
                        setEmailHistory(getProcessedEmailsHistory());
                      }}
                      className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver Histórico Completo</span>
                      <History className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recentEmails.map(item => {
                      const isAcked = getAcknowledgedAlerts().includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                            isAcked 
                              ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70' 
                              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-950 dark:text-amber-100 font-semibold shadow-xs'
                          }`}
                        >
                          <div>
                            <div className="font-bold flex items-center gap-1.5">
                              <span>{item.subject}</span>
                              {!isAcked && (
                                <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-black">
                                  NOVO
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              De: {item.sender} &bull; {item.date}
                            </div>
                            {item.parsedOrder && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  PV: {item.parsedOrder.orderNumber}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                  {item.parsedOrder.customer}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  Embarque: {item.parsedOrder.formattedDeliveryDate}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                            {onStartOrderFromEmail && item.parsedOrder && (
                              <button
                                type="button"
                                onClick={() => {
                                  onStartOrderFromEmail(item.parsedOrder, item);
                                  onClose();
                                }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Iniciar Pedido</span>
                              </button>
                            )}
                            {!isAcked && (
                              <button
                                type="button"
                                onClick={() => {
                                  onAcknowledgeAlert(item.id);
                                  onShowToast('Alerta confirmado e parado!', 'success');
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Parar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTÓRICO DE E-MAILS PROCESSADOS (ÚLTIMOS 10) */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              
              {/* History Header & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Histórico dos Últimos 10 E-mails Processados</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Pedidos de venda filtrados e extraídos diretamente das mensagens recebidas
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailHistory(getProcessedEmailsHistory());
                      onShowToast('Histórico atualizado.', 'info');
                    }}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                    title="Atualizar lista do histórico"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  {emailHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearHistory}
                      className="px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition flex items-center gap-1 font-semibold cursor-pointer"
                      title="Limpar histórico de e-mails processados"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Search Bar for History */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={e => setHistorySearchTerm(e.target.value)}
                  placeholder="Buscar no histórico por PV, Cliente, data de embarque ou remetente..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                {historySearchTerm && (
                  <button
                    type="button"
                    onClick={() => setHistorySearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* History Cards List */}
              <div className="space-y-3">
                {filteredHistory.map((item, index) => {
                  const isAcked = getAcknowledgedAlerts().includes(item.id);
                  const isExpanded = expandedEmailId === item.id;

                  return (
                    <div 
                      key={item.id}
                      className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs hover:shadow-md transition space-y-3"
                    >
                      {/* Top metadata line */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
                            {item.sender}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.date || 'Data recente'}</span>
                          {isAcked ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Visualizado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              Pendente
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Subject and Email preview */}
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{item.subject}</span>
                        </h5>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 italic line-clamp-2 mt-1">
                          "{item.snippet}"
                        </p>
                      </div>

                      {/* Extracted Fields Highlight Container */}
                      {item.parsedOrder && (
                        <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/90 dark:border-slate-700/80 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              Dados Extraídos para Pedido de Venda
                            </span>
                            <span className="text-slate-400 font-normal lowercase">pronto para cadastro</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            {/* PV */}
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block flex items-center gap-1">
                                <Hash className="w-3 h-3 text-blue-500" />
                                Pedido de Venda (PV)
                              </span>
                              <strong className="text-slate-900 dark:text-white font-mono text-xs">
                                {item.parsedOrder.orderNumber || 'A definir'}
                              </strong>
                            </div>

                            {/* Cliente */}
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-emerald-500" />
                                Cliente / Razão Social
                              </span>
                              <strong className="text-slate-900 dark:text-white text-xs truncate block" title={item.parsedOrder.customer}>
                                {item.parsedOrder.customer || 'A definir'}
                              </strong>
                            </div>

                            {/* Prazo de Embarque */}
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-amber-500" />
                                Prazo de Embarque
                              </span>
                              <strong className="text-amber-700 dark:text-amber-300 font-bold text-xs font-mono">
                                {item.parsedOrder.formattedDeliveryDate || item.parsedOrder.deliveryDate || 'Sem prazo'}
                              </strong>
                            </div>
                          </div>

                          {/* Detected Environments tags if any */}
                          {item.parsedOrder.detectedEnvironments && item.parsedOrder.detectedEnvironments.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-slate-500 font-semibold">Ambientes identificados:</span>
                              {item.parsedOrder.detectedEnvironments.map(env => (
                                <span 
                                  key={env} 
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                                >
                                  {env}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expandable full body text */}
                      {isExpanded && item.bodyText && (
                        <div className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto border border-slate-700 animate-in fade-in duration-150">
                          {item.bodyText}
                        </div>
                      )}

                      {/* Action buttons row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleExpandEmail(item.id)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'Recolher Texto' : 'Ver Corpo Completo do E-mail'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <div className="flex items-center gap-2">
                          {!isAcked && (
                            <button
                              type="button"
                              onClick={() => {
                                onAcknowledgeAlert(item.id);
                                setEmailHistory(getProcessedEmailsHistory());
                                onShowToast('Alerta marcado como visto!', 'success');
                              }}
                              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition flex items-center gap-1 cursor-pointer font-semibold"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Marcar Lido</span>
                            </button>
                          )}

                          {onStartOrderFromEmail && item.parsedOrder && (
                            <button
                              type="button"
                              onClick={() => {
                                onStartOrderFromEmail(item.parsedOrder, item);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                              title="Preencher Novo Pedido com os dados extraídos deste e-mail histórico"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Iniciar Pedido</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}

                {/* Empty State in History */}
                {filteredHistory.length === 0 && (
                  <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <div className="max-w-xs mx-auto space-y-1">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {historySearchTerm ? 'Nenhum e-mail encontrado para a busca' : 'Nenhum e-mail no histórico'}
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        {historySearchTerm 
                          ? 'Tente buscar com outro termo como número de PV ou nome do cliente.'
                          : 'Quando o sistema verificar e-mails do Gmail ou receber alertas de remetentes cadastrados, eles serão listados aqui.'
                        }
                      </p>
                    </div>
                    {!historySearchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          const demo = getProcessedEmailsHistory();
                          setEmailHistory(demo);
                          onShowToast('Exemplos de e-mails de demonstração carregados.', 'info');
                        }}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Carregar Exemplos no Histórico</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Monitoramento automático ativo &bull; Últimos 10 e-mails persistidos</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
