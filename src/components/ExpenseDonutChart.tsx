import React, { useState } from 'react';
import { CategoryBudget, Transaction } from '../types/finance';

interface ExpenseDonutChartProps {
  transactions: Transaction[];
  categories: CategoryBudget[];
  currency?: string;
}

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({
  transactions,
  categories,
  currency = 'USD',
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Filter only expenses
  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const categoryTotals: Record<string, { name: string; amount: number; color: string }> = {};

  for (const cat of categories) {
    categoryTotals[cat.name] = { name: cat.name, amount: 0, color: cat.color };
  }

  for (const tx of expenses) {
    if (!categoryTotals[tx.category]) {
      categoryTotals[tx.category] = { name: tx.category, amount: 0, color: '#9CA3AF' };
    }
    categoryTotals[tx.category].amount += tx.amount;
  }

  const items = Object.values(categoryTotals)
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Donut geometry
  const radius = 70;
  const strokeWidth = 24;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const activeItem = hoveredCategory
    ? items.find((i) => i.name === hoveredCategory)
    : items[0];

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <span>Distribución de Gastos</span>
          </h3>
          <p className="text-xs text-zinc-400">Por categoría en el periodo actual</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-zinc-400 block">Total Gastado</span>
          <span className="text-lg font-bold font-mono tabular-nums text-rose-400">
            ${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
          </span>
        </div>
      </div>

      {totalExpense === 0 ? (
        <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
          No hay gastos registrados en este periodo.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* SVG Donut */}
          <div className="sm:col-span-5 flex justify-center relative">
            <svg viewBox="0 0 200 200" className="w-48 h-48 -rotate-90">
              <circle
                cx={center}
                cy={center}
                r={radius}
                className="text-zinc-800"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {items.map((item) => {
                const percent = item.amount / totalExpense;
                const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
                const strokeDashoffset = -circumference * accumulatedPercent;
                accumulatedPercent += percent;

                const isHovered = hoveredCategory === item.name;

                return (
                  <circle
                    key={item.name}
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={item.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    fill="transparent"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredCategory(item.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    style={{
                      opacity: hoveredCategory && !isHovered ? 0.35 : 1,
                      filter: isHovered ? 'drop-shadow(0 0 6px currentColor)' : 'none',
                    }}
                  />
                );
              })}
            </svg>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider truncate max-w-[110px]">
                {activeItem ? activeItem.name : 'Total'}
              </span>
              <span className="text-base font-bold font-mono text-zinc-100">
                ${activeItem ? activeItem.amount.toFixed(0) : totalExpense.toFixed(0)}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {activeItem ? `${((activeItem.amount / totalExpense) * 100).toFixed(1)}%` : '100%'}
              </span>
            </div>
          </div>

          {/* Legend list */}
          <div className="sm:col-span-7 space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
            {items.map((item) => {
              const percent = ((item.amount / totalExpense) * 100).toFixed(1);
              const isHovered = hoveredCategory === item.name;

              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setHoveredCategory(item.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                    isHovered ? 'bg-zinc-800/80 ring-1 ring-zinc-700' : 'hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 transition-transform"
                      style={{
                        backgroundColor: item.color,
                        transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                      }}
                    />
                    <span className="text-xs font-medium text-zinc-200 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right flex-shrink-0">
                    <span className="text-xs font-mono tabular-nums text-zinc-100 font-semibold">
                      ${item.amount.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 w-11 text-right">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
