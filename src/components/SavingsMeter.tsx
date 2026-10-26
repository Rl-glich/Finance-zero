import React, { useState } from 'react';
import { SavingsGoal, CategoryBudget } from '../types/finance';
import { ShieldCheck, Plane, Car, Plus, TrendingUp, AlertTriangle } from 'lucide-react';

interface SavingsMeterProps {
  goals: SavingsGoal[];
  categories: CategoryBudget[];
  onAddFunds: (goalId: string, amount: number) => void;
  onNewGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
}

export const SavingsMeter: React.FC<SavingsMeterProps> = ({
  goals,
  categories,
  onAddFunds,
  onNewGoal,
}) => {
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');

  // Overbudget categories
  const overbudgetCategories = categories.filter(
    (c) => c.monthlyLimit > 0 && c.spent > c.monthlyLimit
  );

  const getGoalIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'Plane':
        return <Plane className="w-5 h-5 text-indigo-400" />;
      case 'Car':
        return <Car className="w-5 h-5 text-amber-400" />;
      default:
        return <TrendingUp className="w-5 h-5 text-cyan-400" />;
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newGoalTarget);
    if (!newGoalName || isNaN(target) || target <= 0) return;

    onNewGoal({
      name: newGoalName,
      targetAmount: target,
      currentAmount: 0,
      deadline: newGoalDeadline || undefined,
      color: '#10B981',
      iconName: 'TrendingUp',
    });

    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalDeadline('');
    setShowNewGoalModal(false);
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <span>Metas de Ahorro & Alertas</span>
          </h3>
          <p className="text-xs text-zinc-400">Progreso hacia tus objetivos financieros</p>
        </div>
        <button
          onClick={() => setShowNewGoalModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Meta</span>
        </button>
      </div>

      {/* Overbudget warnings if any */}
      {overbudgetCategories.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Atención con tus presupuestos:</span>
            {overbudgetCategories.map((c) => (
              <span key={c.id} className="block text-[11px] text-rose-300/90">
                • {c.name}: Has gastado ${c.spent.toFixed(0)} de tu límite de ${c.monthlyLimit} (+
                ${(c.spent - c.monthlyLimit).toFixed(0)} excedido)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Goals list */}
      <div className="space-y-4">
        {goals.map((goal) => {
          const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);

          return (
            <div
              key={goal.id}
              className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    {getGoalIcon(goal.iconName)}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-zinc-200">{goal.name}</h4>
                    {goal.deadline && (
                      <p className="text-[11px] text-zinc-400">Meta: {goal.deadline}</p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-zinc-100 tabular-nums">
                    ${goal.currentAmount.toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-mono block text-emerald-400 font-semibold">
                    {percent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800/90 rounded-full h-2 overflow-hidden mb-2.5">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: goal.color || '#10B981',
                  }}
                />
              </div>

              {/* Quick deposit button */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => onAddFunds(goal.id, 50)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 font-mono transition-colors"
                >
                  +$50
                </button>
                <button
                  onClick={() => onAddFunds(goal.id, 100)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 font-mono transition-colors"
                >
                  +$100
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Goal Modal */}
      {showNewGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-base font-semibold text-zinc-100 mb-3">Crear Nueva Meta de Ahorro</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nombre de la Meta</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Fondo para Auto Nuevo"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Monto Objetivo ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="3000"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Fecha Límite (Opcional)</label>
                <input
                  type="date"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewGoalModal(false)}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors"
                >
                  Guardar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
