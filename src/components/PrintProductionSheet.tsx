import React from 'react';
import { Printer, Download, X, FileText, CheckCircle2, ExternalLink } from 'lucide-react';
import { Order } from '../types';
import { formatDateBR, calculateRemainingDays } from '../utils/excel';
import { TermoprolLogo } from './TermoprolLogo';

export interface PrintProductionSheetProps {
  order: Order;
  isOpen?: boolean;
  onClose?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

// Generates a self-contained, clean HTML printable document
export function generateStandaloneSheetHtml(order: Order): string {
  const remaining = calculateRemainingDays(order.deliveryDate, order.status);
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ficha de Confecção - ${order.orderNumber}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111; line-height: 1.4; margin: 0; padding: 20px; font-size: 11pt; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
    .brand { font-size: 22pt; font-weight: 900; color: #0284c7; letter-spacing: -0.5px; }
    .brand span { color: #0f172a; }
    .order-title { text-align: right; }
    .order-title .sub { font-size: 9pt; text-transform: uppercase; font-weight: bold; color: #64748b; }
    .order-title .num { font-size: 20pt; font-weight: 900; color: #1e3a8a; }
    .info-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 24px; font-size: 10pt; }
    .info-item .label { font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
    .info-item .val { font-weight: bold; color: #0f172a; }
    .notes-box { grid-column: span 5; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 4px; font-size: 9.5pt; color: #334155; }
    .env-card { border: 1.5px solid #94a3b8; border-radius: 8px; margin-bottom: 20px; page-break-inside: avoid; }
    .env-header { background: #f1f5f9; padding: 10px 14px; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; }
    .env-name { font-weight: 800; font-size: 11pt; text-transform: uppercase; color: #0f172a; }
    .env-meta { display: flex; gap: 16px; font-size: 9.5pt; color: #334155; background: #e2e8f0; padding: 4px 10px; border-radius: 4px; }
    .env-body { padding: 14px; }
    .section-title { font-size: 9.5pt; font-weight: 800; text-transform: uppercase; color: #1e293b; margin-top: 10px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
    .item-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px dashed #e2e8f0; font-size: 10pt; }
    .item-qty { display: inline-block; background: #e2e8f0; font-weight: bold; padding: 1px 6px; border-radius: 3px; margin-right: 6px; font-size: 9pt; }
    .item-code { font-family: monospace; font-weight: bold; color: #1e3a8a; margin-right: 6px; }
    .chk { font-family: monospace; color: #94a3b8; font-size: 9pt; }
    .signatures { margin-top: 40px; padding-top: 20px; border-top: 2px solid #94a3b8; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; font-size: 9pt; page-break-inside: avoid; }
    .sig-line { border-bottom: 1px solid #000; height: 35px; margin-bottom: 6px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">TERMO<span>PROL</span></div>
    <div class="order-title">
      <div class="sub">Ordem de Produção & Confecção</div>
      <div class="num">${order.orderNumber}</div>
      <div style="font-size: 8.5pt; color: #64748b;">Emitido em: ${new Date().toLocaleDateString('pt-BR')}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <div class="label">Cliente / Razão Social:</div>
      <div class="val">${order.customer}</div>
    </div>
    <div class="info-item">
      <div class="label">AppSheet:</div>
      <div class="val">${order.appSheet}</div>
    </div>
    <div class="info-item">
      <div class="label">Supervisório:</div>
      <div class="val" style="color: ${order.supervisory === 'SIM' ? '#0369a1' : '#334155'}; font-weight: ${order.supervisory === 'SIM' ? '900' : 'bold'};">${order.supervisory || 'NÃO'}</div>
    </div>
    <div class="info-item">
      <div class="label">Status:</div>
      <div class="val">${order.status}</div>
    </div>
    <div class="info-item">
      <div class="label">Data de Entrega:</div>
      <div class="val">${formatDateBR(order.deliveryDate)} (${remaining.text})</div>
    </div>
    ${order.notes ? `<div class="notes-box"><strong>Observações:</strong> ${order.notes}</div>` : ''}
  </div>

  <h3 style="font-size: 11pt; text-transform: uppercase; font-weight: 800; border-bottom: 2px solid #0f172a; padding-bottom: 4px; margin-bottom: 14px;">
    Detalhamento Técnico por Ambiente (${order.environments?.length || 0} ambientes)
  </h3>

  ${(order.environments || []).map((env, idx) => `
    <div class="env-card">
      <div class="env-header">
        <span class="env-name">Ambiente ${idx + 1}: ${env.name}</span>
        <div class="env-meta">
          <span><strong>Temp:</strong> ${env.operatingTemperature || 'Não informada'}</span>
          <span><strong>Distância:</strong> ${env.evaporatorDistance || 'Não informada'}</span>
        </div>
      </div>
      <div class="env-body">
        <div class="section-title">Máquinas & Equipamentos (${env.machines?.length || 0})</div>
        ${(env.machines || []).map(m => `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-bottom: 8px;">
            <div style="font-weight: 800; display: flex; justify-content: space-between;">
              <span>${m.quantity || 1}x ${m.name || 'Máquina'}</span>
              <span class="chk">[ ] Conferido</span>
            </div>
            ${(m.items || []).map(it => `
              <div class="item-row" style="margin-left: 12px; font-size: 9.5pt;">
                <span>
                  <span class="item-qty">${it.quantity || 1}x</span>
                  ${it.code ? `<span class="item-code">[${it.code}]</span>` : ''}
                  ${it.name}
                </span>
                <span class="chk">[ ]</span>
              </div>
            `).join('')}
          </div>
        `).join('')}

        <div class="section-title">Quadro de Comando</div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-bottom: 8px;">
          <div style="font-weight: 800; display: flex; justify-content: space-between;">
            <span>${env.panel?.description || 'Quadro de comando não especificado'}</span>
            <span class="chk">[ ] Conferido</span>
          </div>
          ${(env.panel?.items || []).map(p => `
            <div class="item-row" style="margin-left: 12px; font-size: 9.5pt;">
              <span>
                <span class="item-qty">${p.quantity || 1}x</span>
                ${p.code ? `<span class="item-code">[${p.code}]</span>` : ''}
                ${p.name}
              </span>
              <span class="chk">[ ]</span>
            </div>
          `).join('')}
        </div>

        ${env.accessories && env.accessories.length > 0 ? `
          <div class="section-title">Acessórios & Periféricos</div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px;">
            ${env.accessories.map(acc => `
              <div class="item-row">
                <span>
                  <span class="item-qty">${acc.quantity || 1}x</span>
                  ${acc.code ? `<span class="item-code">[${acc.code}]</span>` : ''}
                  ${acc.name}
                </span>
                <span class="chk">[ ]</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `).join('')}

  <div class="signatures">
    <div>
      <div class="sig-line"></div>
      <strong>Responsável Técnico / Projetista</strong>
    </div>
    <div>
      <div class="sig-line"></div>
      <strong>Montador / Líder de Produção</strong>
    </div>
    <div>
      <div class="sig-line"></div>
      <strong>Controle de Qualidade / Expedição</strong>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 350);
    };
  </script>
</body>
</html>`;
}

// Generates and downloads a self-contained, clean HTML printable document
export function downloadStandaloneSheetHtml(order: Order) {
  const htmlContent = generateStandaloneSheetHtml(order);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ficha_Producao_${order.orderNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const PrintProductionSheet: React.FC<PrintProductionSheetProps> = ({ 
  order, 
  isOpen = false, 
  onClose,
  onShowToast
}) => {
  const remaining = calculateRemainingDays(order.deliveryDate, order.status);

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      handlePrintInNewWindow();
    }
  };

  const handlePrintInNewWindow = () => {
    try {
      const htmlContent = generateStandaloneSheetHtml(order);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 350);
      } else {
        downloadStandaloneSheetHtml(order);
        onShowToast?.('Janela pop-up bloqueada. A ficha foi baixada em HTML para impressão.', 'info');
      }
    } catch {
      downloadStandaloneSheetHtml(order);
      onShowToast?.('A ficha foi baixada em HTML para impressão.', 'info');
    }
  };

  const handleDownloadHtml = () => {
    downloadStandaloneSheetHtml(order);
    onShowToast?.(`Ficha do pedido ${order.orderNumber} baixada!`, 'success');
  };

  const renderSheetContent = () => (
    <>
      {/* Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-center">
        <div>
          <TermoprolLogo variant="horizontal" theme="light" size="lg" />
        </div>
        <div className="text-right">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-500">Ordem de Produção & Confecção</div>
          <div className="text-2xl font-black text-blue-900 leading-tight">{order.orderNumber}</div>
          <div className="text-[11px] text-gray-500">Emitido em: {new Date().toLocaleDateString('pt-BR')}</div>
        </div>
      </div>

      {/* Order Info Summary */}
      <div className="border border-gray-300 rounded p-4 mb-6 bg-gray-50 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div>
          <span className="block font-bold text-gray-500 uppercase">Cliente / Empresa:</span>
          <span className="font-bold text-sm text-black">{order.customer}</span>
        </div>
        <div>
          <span className="block font-bold text-gray-500 uppercase">AppSheet:</span>
          <span className="font-bold text-sm">{order.appSheet}</span>
        </div>
        <div>
          <span className="block font-bold text-gray-500 uppercase">Supervisório:</span>
          <span className={`font-bold text-sm ${order.supervisory === 'SIM' ? 'text-blue-900 font-black' : 'text-gray-700'}`}>
            {order.supervisory || 'NÃO'}
          </span>
        </div>
        <div>
          <span className="block font-bold text-gray-500 uppercase">Status Atual:</span>
          <span className="font-bold text-sm uppercase">{order.status}</span>
        </div>
        <div>
          <span className="block font-bold text-gray-500 uppercase">Data de Entrega:</span>
          <span className="font-bold text-sm text-black">{formatDateBR(order.deliveryDate)} ({remaining.text})</span>
        </div>
        {order.notes && (
          <div className="col-span-2 sm:col-span-5 pt-2 border-t border-gray-200 mt-2">
            <span className="font-bold text-gray-600">Observações: </span>
            <span>{order.notes}</span>
          </div>
        )}
      </div>

      {/* Environments breakdown */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-400 pb-1">
          Detalhamento Técnico por Ambiente ({order.environments?.length || 0} ambientes)
        </h2>

        {(!order.environments || order.environments.length === 0) ? (
          <p className="text-xs text-gray-500 italic">Nenhum ambiente especificado para este pedido.</p>
        ) : (
          order.environments.map((env, envIdx) => {
            const envMachineCount = env.machines?.reduce((acc, m) => acc + (Number(m.quantity) > 0 ? Number(m.quantity) : 1), 0) || 0;
            return (
              <div key={env.id} className="border border-gray-400 rounded-md p-4 print-break-inside-avoid">
                <div className="bg-gray-100 p-2.5 -m-4 mb-3 border-b border-gray-300">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs uppercase tracking-wide text-black">
                      Ambiente {envIdx + 1}: {env.name}
                    </span>
                    <span className="text-[10px] text-gray-700 font-bold bg-white px-2 py-0.5 rounded border border-gray-300">
                      {envMachineCount} {envMachineCount === 1 ? 'máquina' : 'máquinas'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-700 pt-1 border-t border-gray-200">
                    <span>
                      <strong>Temp. de Operação: </strong>
                      <span className="font-mono font-bold text-blue-900">{env.operatingTemperature || 'Não informada'}</span>
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Distância Evap → Cond: </strong>
                      <span className="font-mono font-bold text-amber-900">{env.evaporatorDistance || 'Não informada'}</span>
                    </span>
                  </div>
                </div>

                {/* Machines */}
                <div className="mb-4">
                  <h4 className="text-[11px] font-bold text-gray-800 uppercase mb-2">Máquinas & Equipamentos:</h4>
                  {(!env.machines || env.machines.length === 0) ? (
                    <p className="text-[10px] text-gray-400 italic">Nenhuma máquina cadastrada.</p>
                  ) : (
                    <div className="space-y-2">
                      {env.machines.map((m, mIdx) => (
                        <div key={m.id || mIdx} className="bg-white border border-gray-200 rounded p-2 text-xs">
                          <div className="font-bold text-black flex items-center justify-between">
                            <span>{m.quantity}x {m.name || 'Máquina sem modelo'}</span>
                            <span className="border border-gray-400 rounded px-1 text-[10px] uppercase">Conferido [ ]</span>
                          </div>
                          {m.items && m.items.length > 0 && (
                            <div className="mt-1.5 pl-3 border-l-2 border-gray-300 space-y-1">
                              <span className="text-[10px] font-semibold text-gray-500 block uppercase">Componentes da Máquina:</span>
                              {m.items.map((it, iIdx) => (
                                <div key={iIdx} className="text-[11px] flex items-center justify-between">
                                  <span>
                                    <span className="inline-block bg-gray-100 border border-gray-300 font-bold px-1.5 py-0.5 rounded text-[10px] mr-1.5">
                                      {it.quantity || 1}x
                                    </span>
                                    {it.code ? <strong className="font-mono text-blue-900 mr-1.5">[{it.code}]</strong> : null}
                                    {it.name || 'Componente não especificado'}
                                  </span>
                                  <span className="text-gray-400 text-[10px]">[ ]</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Panel */}
                <div className="mb-4">
                  <h4 className="text-[11px] font-bold text-gray-800 uppercase mb-1">Quadro de Comando:</h4>
                  <div className="bg-white border border-gray-200 rounded p-2 text-xs">
                    <div className="font-semibold text-gray-900 mb-1 flex justify-between">
                      <span>{env.panel?.description || 'Quadro elétrico não especificado'}</span>
                      <span className="border border-gray-400 rounded px-1 text-[10px] uppercase">Conferido [ ]</span>
                    </div>
                    {env.panel?.items && env.panel.items.length > 0 && (
                      <div className="mt-1 pl-3 border-l-2 border-gray-300 space-y-1">
                        <span className="text-[10px] font-semibold text-gray-500 block uppercase">Componentes do Quadro:</span>
                        {env.panel.items.map((pItem, pIdx) => (
                          <div key={pIdx} className="text-[11px] flex items-center justify-between">
                            <span>
                              <span className="inline-block bg-gray-100 border border-gray-300 font-bold px-1.5 py-0.5 rounded text-[10px] mr-1.5">
                                {pItem.quantity || 1}x
                              </span>
                              {pItem.code ? <strong className="font-mono text-blue-900 mr-1.5">[{pItem.code}]</strong> : null}
                              {pItem.name || 'Item'}
                            </span>
                            <span className="text-gray-400 text-[10px]">[ ]</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Accessories */}
                <div>
                  <h4 className="text-[11px] font-bold text-gray-800 uppercase mb-1">Acessórios & Periféricos:</h4>
                  {(!env.accessories || env.accessories.length === 0) ? (
                    <p className="text-[10px] text-gray-400 italic">Nenhum acessório adicional.</p>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded p-2 text-xs space-y-1">
                      {env.accessories.map((acc, aIdx) => (
                        <div key={aIdx} className="text-[11px] flex items-center justify-between">
                          <span>
                            <span className="inline-block bg-gray-100 border border-gray-300 font-bold px-1.5 py-0.5 rounded text-[10px] mr-1.5">
                              {acc.quantity || 1}x
                            </span>
                            {acc.code ? <strong className="font-mono text-blue-900 mr-1.5">[{acc.code}]</strong> : null}
                            {acc.name || 'Acessório'}
                          </span>
                          <span className="text-gray-400 text-[10px]">[ ]</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Signatures & Release */}
      <div className="mt-12 pt-6 border-t-2 border-gray-300 grid grid-cols-3 gap-6 text-center text-xs print-break-inside-avoid">
        <div>
          <div className="border-b border-black mb-1 h-10" />
          <span className="font-bold">Responsável Técnico / Projetista</span>
        </div>
        <div>
          <div className="border-b border-black mb-1 h-10" />
          <span className="font-bold">Montador / Líder de Produção</span>
        </div>
        <div>
          <div className="border-b border-black mb-1 h-10" />
          <span className="font-bold">Controle de Qualidade / Expedição</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Interactive Modal for Preview, Direct Print and Standalone Download */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col p-2 sm:p-4 no-print overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 max-w-5xl w-full mx-auto rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
            
            {/* Modal Header Toolbar */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white flex-shrink-0 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Ficha de Confecção & Ordem de Produção
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pedido {order.orderNumber} • {order.customer}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm transition flex items-center gap-1.5 active:scale-95"
                  title="Abrir diálogo de impressão do navegador"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintInNewWindow}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition flex items-center gap-1.5 active:scale-95"
                  title="Abrir ficha limpa em nova janela para impressão"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Nova Janela</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition flex items-center gap-1.5 active:scale-95"
                  title="Baixar arquivo HTML com formatação de impressão"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Ficha</span>
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition ml-1"
                    title="Fechar visualização"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Scrollable Sheet Preview */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-slate-100 dark:bg-slate-950">
              <div className="bg-white text-black font-sans max-w-4xl mx-auto p-6 sm:p-8 rounded-xl shadow-md border border-slate-300">
                {renderSheetContent()}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Hidden container for native browser print (window.print) */}
      <div className="hidden print:block print-only p-8 bg-white text-black font-sans max-w-4xl mx-auto">
        {renderSheetContent()}
      </div>
    </>
  );
};
