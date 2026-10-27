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
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatDateBR, calculateRemainingDays, getOrderTotals } from '../utils/excel';

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
          Atrasado ({status === 'Pronto' ? 'Em Andamento' : status})
        </span>
      );
    }

    switch (status) {
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Pendente
          </span>
        );
      case 'Em Andamento':
      case 'Pronto':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Em Andamento
          </span>
        );
      case 'Entregue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Entregue
          </span>
        );
    }
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Pendente':
        return 'bg-red-100 text-red-950 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-700';
      case 'Em Andamento':
      case 'Pronto':
        return 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700';
      case 'Entregue':
        return 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700';
      default:
        return 'bg-slate-100 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <th className="py-3 px-3 sm:py-3.5 sm:px-4 whitespace-nowrap">Pedido de Venda</th>
              <th className="py-3 px-3 sm:py-3.5 sm:px-4 min-w-[180px]">Cliente / Razão Social</th>
              <th className="py-3 px-3 sm:py-3.5 sm:px-4 text-center whitespace-nowrap">APPSHEET</th>
              <th className="py-3 px-3 sm:py-3.5 sm:px-4 text-center whitespace-nowrap">SUPERVISÓRIO</th>
              <th className="py-3 px-3 sm:py-3.5 sm:px-4 whitespace-nowrap">Status</th>
              <th className="py-3 px-3 sm:py-3.5 sm:px-4 whitespace-nowrap">Data de Entrega</th>
              <th className="py-3 px-3 sm:py-3.5 sm:px-4 text-center whitespace-nowrap">Dias Restantes</th>
              <th className="py-3 px-3 sm:py-3.5 sm:px-4 text-center whitespace-nowrap">Ambientes / Máquinas</th>
              <th className="py-3 px-3 sm:py-3.5 sm:px-4 text-right whitespace-nowrap">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {orders.map(order => {
              const remaining = calculateRemainingDays(order.deliveryDate, order.status);
              const { totalEnvironments, totalMachines } = getOrderTotals(order);

              return (
                <tr
                  key={order.id}
                  onClick={() => onOpenOrder(order)}
                  className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition cursor-pointer group"
                >
                  {/* Order Number */}
                  <td className="py-3 px-3 sm:py-3.5 sm:px-4 font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{order.orderNumber}</span>
                      <ExternalLink className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition opacity-0 group-hover:opacity-100" />
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-3 sm:py-3.5 sm:px-4 font-semibold text-slate-900 dark:text-slate-100">
                    <div>{order.customer}</div>
                    {order.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal line-clamp-1">
                        {order.notes}
                      </p>
                    )}
                  </td>

                  {/* AppSheet */}
                  <td className="py-3 px-3 sm:py-3.5 sm:px-4 text-center whitespace-nowrap">
                    {order.appSheet === 'SIM' ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-700">
                        SIM
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                        NÃO
                      </span>
                    )}
                  </td>

                  {/* Supervisório */}
                  <td className="py-3 px-3 sm:py-3.5 sm:px-4 text-center whitespace-nowrap">
                    {order.supervisory === 'SIM' ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-950 border border-cyan-300 dark:bg-cyan-950 dark:text-cyan-200 dark:border-cyan-700">
                        SIM
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                        NÃO
                      </span>
                    )}
                  </td>

                  {/* Status with quick change & high contrast */}
                  <td className="py-3 px-3 sm:py-3.5 sm:px-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <select
                      value={order.status === 'Pronto' ? 'Em Andamento' : order.status}
                      onChange={e => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className={`text-xs font-bold cursor-pointer rounded-lg px-2.5 py-1 border shadow-xs transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusBadgeStyle(order.status)}`}
                      title="Clique para alterar status rapidamente"
                    >
                      <option value="Pendente" className="bg-white text-red-700 dark:bg-slate-900 dark:text-red-400 font-bold">
                        🔴 Pendente
                      </option>
                      <option value="Em Andamento" className="bg-white text-amber-700 dark:bg-slate-900 dark:text-amber-400 font-bold">
                        🟡 Em Andamento
                      </option>
                      <option value="Entregue" className="bg-white text-emerald-700 dark:bg-slate-900 dark:text-emerald-400 font-bold">
                        🟢 Entregue
                      </option>
                    </select>
                  </td>

                  {/* Delivery Date */}
                  <td className="py-3 px-3 sm:py-3.5 sm:px-4 text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{formatDateBR(order.deliveryDate)}</span>
                    </div>
                  </td>

                  {/* Remaining Days */}
                  <td className="py-3 px-3 sm:py-3.5 sm:px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 justify-center">
                      {remaining.isUnder15Days && (
                        <span 
                          className="inline-flex items-center justify-center p-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/40 animate-pulse" 
                          title="Atenção: Prazo de entrega inferior a 15 dias!"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs ${remaining.badgeClass}`}>
                        {remaining.text}
                      </span>
                    </div>
                  </td>

                  {/* Environments & Machines Count */}
                  <td className="py-3 px-3 sm:py-3.5 sm:px-4 text-center whitespace-nowrap">
                    <div 
                      className="inline-flex items-center gap-1.5 justify-center"
                      title={`${totalEnvironments} ambiente(s) e ${totalMachines} máquina(s) no total`}
                    >
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                        <Layers className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>{totalEnvironments} amb</span>
                      </span>
                      <span className="text-slate-300 dark:text-slate-600 font-bold">/</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <Fan className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{totalMachines} máq</span>
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 sm:py-3.5 sm:px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onPrintOrder(order)}
                        title="Imprimir Ficha de Confecção / PDF"
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicateOrder(order)}
                        title="Duplicar Pedido"
                        className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenOrder(order)}
                        title="Editar e Especificar Confecção"
                        className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteOrder(order.id)}
                        title="Excluir Pedido"
                        className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
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
