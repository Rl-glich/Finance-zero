import React from 'react';
import { SavingsNotification } from '../types/finance';
import { Bell, AlertTriangle, CheckCircle, Lightbulb, X, CheckCheck } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: SavingsNotification[];
  onMarkAllRead: () => void;
  onDismiss: (id: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onDismiss,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: SavingsNotification['type']) => {
    switch (type) {
      case 'warning':
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'tip':
      default:
        return <Lightbulb className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-5 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-between mb-4 pr-6">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-zinc-100">Notificaciones para Ahorrar</h3>
          </div>
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar leídas</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No tienes alertas o notificaciones pendientes de ahorro.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  n.isRead
                    ? 'bg-zinc-950/40 border-zinc-800/60 opacity-75'
                    : 'bg-zinc-950 border-zinc-700/80 shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                      {getIcon(n.type)}
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-100">{n.title}</h4>
                  </div>
                  <button
                    onClick={() => onDismiss(n.id)}
                    className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
                    title="Descartar"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-zinc-300 pl-7 leading-relaxed">{n.message}</p>
                <div className="mt-2 pl-7 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{n.date}</span>
                  {n.category && <span className="text-emerald-400 font-medium">{n.category}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-zinc-800 mt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
