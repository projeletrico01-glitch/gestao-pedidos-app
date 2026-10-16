import React from 'react';
import { 
  Edit3, 
  Trash2, 
  Copy, 
  Printer, 
  Calendar, 
  FolderOpen, 
  Layers, 
  Fan, 
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatDateBR, calculateRemainingDays } from '../utils/excel';

interface OrderTableProps {
  orders: Order[];
  onOpenOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onDuplicateOrder: (order: Order) => void;
  onPrintOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  onOpenOrder,
  onDeleteOrder,
  onDuplicateOrder,
  onPrintOrder,
  onUpdateStatus
}) => {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
        <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <h4 className="text-sm font-semibold text-slate-600 mb-1">Nenhum pedido encontrado</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Tente ajustar os filtros de busca ou crie um novo pedido / importe do Excel.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status: OrderStatus, isOverdue: boolean) => {
    if (isOverdue && status !== 'Entregue') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
          Atrasado ({status})
        </span>
      );
    }

    switch (status) {
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pendente
          </span>
        );
      case 'Pronto':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Pronto
          </span>
        );
      case 'Entregue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Entregue
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Pedido de Venda</th>
              <th className="py-3.5 px-4">Cliente / Razão Social</th>
              <th className="py-3.5 px-4 text-center">APPSHEET</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Data de Entrega</th>
              <th className="py-3.5 px-4 text-center">Dias Restantes</th>
              <th className="py-3.5 px-4 text-center">Ambientes</th>
              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {orders.map(order => {
              const remaining = calculateRemainingDays(order.deliveryDate, order.status);
              const envCount = order.environments?.length || 0;
              const machineCount = order.environments?.reduce((acc, e) => acc + (e.machines?.length || 0), 0) || 0;

              return (
                <tr
                  key={order.id}
                  onClick={() => onOpenOrder(order)}
                  className="hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  {/* Order Number */}
                  <td className="py-3.5 px-4 font-bold text-blue-600 group-hover:text-blue-700">
                    <div className="flex items-center gap-1.5">
                      <span>{order.orderNumber}</span>
                      <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition opacity-0 group-hover:opacity-100" />
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    <div>{order.customer}</div>
                    {order.notes && (
                      <p className="text-[11px] text-slate-400 font-normal line-clamp-1">
                        {order.notes}
                      </p>
                    )}
                  </td>

                  {/* AppSheet */}
                  <td className="py-3.5 px-4 text-center">
                    {order.appSheet === 'SIM' ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                        SIM
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                        NÃO
                      </span>
                    )}
                  </td>

                  {/* Status with quick change */}
                  <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                    <select
                      value={order.status}
                      onChange={e => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className="bg-transparent text-xs font-semibold cursor-pointer rounded-lg px-2 py-1 border border-transparent hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    >
                      <option value="Pendente">🟡 Pendente</option>
                      <option value="Pronto">🟢 Pronto</option>
                      <option value="Entregue">⚪ Entregue</option>
                    </select>
                  </td>

                  {/* Delivery Date */}
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateBR(order.deliveryDate)}</span>
                    </div>
                  </td>

                  {/* Remaining Days */}
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${remaining.badgeClass}`}>
                      {remaining.text}
                    </span>
                  </td>

                  {/* Environments & Machines Count */}
                  <td className="py-3.5 px-4 text-center">
                    <span 
                      className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-medium"
                      title={`${envCount} ambientes, ${machineCount} máquinas`}
                    >
                      <Layers className="w-3 h-3 text-slate-500" />
                      <span>{envCount} amb</span>
                      <span className="text-slate-400">/</span>
                      <Fan className="w-3 h-3 text-slate-500" />
                      <span>{machineCount} máq</span>
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onPrintOrder(order)}
                        title="Imprimir Ficha de Confecção / PDF"
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicateOrder(order)}
                        title="Duplicar Pedido"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenOrder(order)}
                        title="Editar e Especificar Confecção"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteOrder(order.id)}
                        title="Excluir Pedido"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
