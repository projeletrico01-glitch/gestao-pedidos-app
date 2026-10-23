import React from 'react';
import { Order } from '../types';
import { formatDateBR, calculateRemainingDays, getOrderTotals } from '../utils/excel';
import { CalendarCheck, ChevronRight, Clock, MapPin, User } from 'lucide-react';

interface OrderCalendarProps {
  orders: Order[];
  onOpenOrder: (order: Order) => void;
}

export const OrderCalendar: React.FC<OrderCalendarProps> = ({
  orders,
  onOpenOrder
}) => {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
        <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <h4 className="text-sm font-semibold text-slate-600 mb-1">Nenhum cronograma para exibir</h4>
        <p className="text-xs text-slate-400">Não há pedidos cadastrados correspondentes aos filtros aplicados.</p>
      </div>
    );
  }

  // Group orders by deliveryDate
  const grouped: Record<string, Order[]> = {};
  orders.forEach(order => {
    const key = order.deliveryDate || 'Sem Data';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(order);
  });

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
            Cronograma de Entregas e Prazos
          </h3>
          <p className="text-xs text-slate-500">
            Pedidos agrupados cronologicamente pela data de entrega acordada com o cliente
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {sortedDates.length} data(s) agendada(s)
        </span>
      </div>

      <div className="space-y-4">
        {sortedDates.map(dateKey => {
          const list = grouped[dateKey];
          const remaining = calculateRemainingDays(dateKey);

          return (
            <div
              key={dateKey}
              className="border border-slate-200 rounded-xl overflow-hidden shadow-xs"
            >
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {formatDateBR(dateKey)}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({list.length} {list.length === 1 ? 'pedido' : 'pedidos'})
                  </span>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${remaining.badgeClass}`}>
                  {remaining.text}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {list.map(order => (
                  <div
                    key={order.id}
                    onClick={() => onOpenOrder(order)}
                    className="p-3.5 px-4 hover:bg-slate-50/80 transition flex items-center justify-between cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-blue-600 group-hover:underline">
                          {order.orderNumber}
                        </span>
                        <span className="font-semibold text-sm text-slate-800">
                          {order.customer}
                        </span>
                        {order.appSheet === 'SIM' && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded border border-blue-200">
                            APPSHEET
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {(() => {
                          const { totalEnvironments, totalMachines } = getOrderTotals(order);
                          return (
                            <span>
                              {totalEnvironments} amb • {totalMachines} máq
                            </span>
                          );
                        })()}
                        {order.notes && (
                          <span className="line-clamp-1 italic text-slate-400">
                            "{order.notes}"
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        order.status === 'Pendente'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : order.status === 'Entregue'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {order.status === 'Pronto' ? 'Em Andamento' : order.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
