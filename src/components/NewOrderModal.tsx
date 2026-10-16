import React, { useState } from 'react';
import { FilePlus, X, Calendar, User, Hash, FileText } from 'lucide-react';
import { Order } from '../types';
import { getRelativeDate } from '../data/initialData';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateOrder: (order: Order) => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onCreateOrder
}) => {
  const [orderNumber, setOrderNumber] = useState(`PV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [customer, setCustomer] = useState('');
  const [appSheet, setAppSheet] = useState<'SIM' | 'NÃO'>('NÃO');
  const [deliveryDate, setDeliveryDate] = useState(getRelativeDate(7));
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !customer.trim()) return;

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber: orderNumber.trim(),
      customer: customer.trim(),
      appSheet,
      status: 'Pendente',
      deliveryDate,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      environments: [
        {
          id: 'env-' + Date.now(),
          name: 'Ambiente Principal',
          machines: [],
          panel: { description: '', items: [] },
          accessories: []
        }
      ]
    };

    onCreateOrder(newOrder);
    onClose();
  };

  const handleSetQuickDate = (days: number) => {
    setDeliveryDate(getRelativeDate(days));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/30 rounded-lg text-blue-400 border border-blue-500/30">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Criar Novo Pedido</h3>
              <p className="text-xs text-slate-400">Inicie a ficha de confecção e montagem</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              Pedido de Venda (Número / Código) *
            </label>
            <input
              type="text"
              required
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="Ex: PV-2026-004"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Cliente / Razão Social *
            </label>
            <input
              type="text"
              required
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              placeholder="Ex: Indústria Clima Total Ltda"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                AppSheet
              </label>
              <select
                value={appSheet}
                onChange={e => setAppSheet(e.target.value as 'SIM' | 'NÃO')}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="SIM">SIM (Integrado)</option>
                <option value="NÃO">NÃO (Convencional)</option>
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
                value={deliveryDate}
                onChange={e => setDeliveryDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Date Shortcuts */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-slate-500 font-medium">Prazo rápido:</span>
            {[3, 7, 15, 30].map(d => (
              <button
                key={d}
                type="button"
                onClick={() => handleSetQuickDate(d)}
                className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition font-medium"
              >
                +{d}d
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Observações Gerais (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Instruções de confecção, logística, detalhes técnicos..."
              className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition active:scale-95"
            >
              Criar e Detalhar
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
