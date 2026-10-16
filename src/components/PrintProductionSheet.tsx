import React from 'react';
import { Order } from '../types';
import { formatDateBR, calculateRemainingDays } from '../utils/excel';
import { TermoprolLogo } from './TermoprolLogo';

interface PrintProductionSheetProps {
  order: Order;
}

export const PrintProductionSheet: React.FC<PrintProductionSheetProps> = ({ order }) => {
  const remaining = calculateRemainingDays(order.deliveryDate, order.status);

  return (
    <div className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto">
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
      <div className="border border-gray-300 rounded p-4 mb-6 bg-gray-50 grid grid-cols-5 gap-3 text-xs">
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
          <span className={`font-bold text-sm ${order.supervisory === 'SIM' ? 'text-blue-900' : 'text-gray-700'}`}>
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
          <div className="col-span-5 pt-2 border-t border-gray-200 mt-2">
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
                  <div className="flex items-center gap-4 text-[11px] text-gray-700 pt-1 border-t border-gray-200">
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
    </div>
  );
};
