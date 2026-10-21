import React from 'react';
import { 
  Order, 
  OrderStatus 
} from '../types';
import { calculateRemainingDays, formatDateBR, getOrderTotals } from '../utils/excel';
import { 
  Clock, 
  CheckCircle2, 
  Truck, 
  Layers, 
  Fan,
  Calendar, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

interface OrderKanbanProps {
  orders: Order[];
  onOpenOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const OrderKanban: React.FC<OrderKanbanProps> = ({
  orders,
  onOpenOrder,
  onUpdateStatus
}) => {
  const columns: { status: OrderStatus; label: string; icon: any; dotColor: string; bgBadge: string }[] = [
    {
      status: 'Pendente',
      label: 'Pendentes de Confecção',
      icon: Clock,
      dotColor: 'bg-amber-400',
      bgBadge: 'bg-amber-100 text-amber-800'
    },
    {
      status: 'Pronto',
      label: 'Prontos / Testados',
      icon: CheckCircle2,
      dotColor: 'bg-emerald-500',
      bgBadge: 'bg-emerald-100 text-emerald-800'
    },
    {
      status: 'Entregue',
      label: 'Entregues / Expedidos',
      icon: Truck,
      dotColor: 'bg-slate-400',
      bgBadge: 'bg-slate-100 text-slate-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map(col => {
        const colOrders = orders.filter(o => o.status === col.status);
        const Icon = col.icon;

        return (
          <div
            key={col.status}
            className="bg-slate-100/90 dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {col.label}
                </h3>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm ${col.bgBadge}`}>
                {colOrders.length}
              </span>
            </div>

            {/* Orders list in column */}
            <div className="space-y-3 flex-grow overflow-y-auto pr-1">
              {colOrders.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/40 dark:bg-slate-800/20">
                  <Icon className="w-6 h-6 mb-1 text-slate-300 dark:text-slate-600" />
                  <p className="text-xs">Nenhum pedido nesta etapa</p>
                </div>
              ) : (
                colOrders.map(order => {
                  const remaining = calculateRemainingDays(order.deliveryDate, order.status);
                  const { totalEnvironments, totalMachines } = getOrderTotals(order);

                  return (
                    <div
                      key={order.id}
                      onClick={() => onOpenOrder(order)}
                      className="bg-white dark:bg-slate-800/90 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-bold text-sm text-blue-600 dark:text-blue-400 group-hover:underline">
                          {order.orderNumber}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${remaining.badgeClass}`}>
                          {remaining.text}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5 line-clamp-1">
                        {order.customer}
                      </h4>

                      {/* Integration Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        {order.supervisory === 'SIM' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-950 border border-cyan-300 dark:bg-cyan-950 dark:text-cyan-200 dark:border-cyan-700">
                            📡 Supervisório
                          </span>
                        )}
                        {order.appSheet === 'SIM' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-700">
                            AppSheet
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <Layers className="w-3.5 h-3.5" />
                            {totalEnvironments} amb
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">/</span>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Fan className="w-3.5 h-3.5" />
                            {totalMachines} máq
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {formatDateBR(order.deliveryDate)}
                        </span>
                      </div>

                      {/* Quick Move Status Buttons */}
                      <div 
                        className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60" 
                        onClick={e => e.stopPropagation()}
                      >
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Mover:</span>
                        <div className="flex items-center gap-1.5">
                          {col.status !== 'Pendente' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(order.id, 'Pendente')}
                              className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 dark:bg-slate-700 dark:hover:bg-amber-950 dark:text-slate-300 dark:hover:text-amber-200 rounded transition font-medium"
                              title="Retornar para Pendente"
                            >
                              Pendente
                            </button>
                          )}

                          {col.status !== 'Pronto' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(order.id, 'Pronto')}
                              className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 dark:bg-slate-700 dark:hover:bg-emerald-950 dark:text-slate-300 dark:hover:text-emerald-200 rounded transition font-medium"
                              title="Marcar como Pronto"
                            >
                              Pronto
                            </button>
                          )}

                          {col.status !== 'Entregue' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(order.id, 'Entregue')}
                              className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 dark:hover:text-white rounded transition font-medium"
                              title="Marcar como Entregue"
                            >
                              Entregue
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
