import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  Bell, 
  BellOff, 
  RefreshCw, 
  Plus, 
  Trash2, 
  X, 
  ShieldCheck, 
  LogOut, 
  ExternalLink,
  Volume2,
  VolumeX,
  Volume1
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
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const GmailAlertModal: React.FC<GmailAlertModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserChange,
  activeAlert,
  onAcknowledgeAlert,
  onShowToast
}) => {
  const [senders, setSenders] = useState<string[]>(getRegisteredSenders);
  const [newSenderInput, setNewSenderInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentEmails, setRecentEmails] = useState<GmailAlertItem[]>([]);

  useEffect(() => {
    setSenders(getRegisteredSenders());
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Integração Gmail & Monitor de Remetentes</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800">
                  Google Workspace
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Alerta visual automático e confirmação ao receber e-mails de remetentes cadastrados
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
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
                  className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1"
                  title="Tocar som de teste"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Tocar Alarme</span>
                </button>
              </div>

              <div className="bg-black/30 p-3 rounded-xl space-y-1 text-xs">
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
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => onAcknowledgeAlert(activeAlert.id)}
                  className="px-4 py-2 bg-white text-red-900 hover:bg-red-50 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>CONFIRMAR LEITURA / PARAR ALERTA</span>
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
                  className="px-2.5 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition flex items-center gap-1 font-semibold"
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
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-60"
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
                {/* Official Material Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 shadow-xs hover:shadow-sm transition active:scale-95 disabled:opacity-60"
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
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
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
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 flex-shrink-0"
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
                    className="p-0.5 hover:text-red-600 rounded-md transition"
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

          {/* Recent scanned emails */}
          {recentEmails.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                E-mails Recentes Encontrados ({recentEmails.length})
              </h5>
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
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 italic mt-0.5">
                          "{item.snippet}"
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!isAcked ? (
                          <button
                            type="button"
                            onClick={() => {
                              onAcknowledgeAlert(item.id);
                              onShowToast('Alerta confirmado e parado!', 'success');
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmar / Parar</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmado</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>O monitoramento automático roda a cada 45 segundos quando conectado.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
