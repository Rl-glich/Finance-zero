import React, { useState, useRef, useEffect } from 'react';
import { Account, CategoryBudget, SavingsGoal, Transaction } from '../types/finance';
import { Sparkles, Send, X, ArrowRightLeft, Check, AlertCircle, Bot, User as UserIcon, PlusCircle, Sliders } from 'lucide-react';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  categories: CategoryBudget[];
  goals: SavingsGoal[];
  onApplyTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onApplyTransfer: (fromAccountId: string, toAccountId: string, amount: number, description?: string) => void;
  onApplyAccountCreate: (acc: Omit<Account, 'id'>) => void;
  onApplyBudgetAdjust: (categoryName: string, newLimit: number) => void;
  onApplySavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  actions?: { name: string; args: any; status?: 'pending' | 'executed' | 'cancelled' }[];
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  categories,
  goals,
  onApplyTransaction,
  onApplyTransfer,
  onApplyAccountCreate,
  onApplyBudgetAdjust,
  onApplySavingsGoal,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '¡Hola! Soy KuroAI, tu asistente financiero de soporte. Puedo registrar gastos, mover fondos entre tus cuentas, crear nuevas cuentas, ajustar presupuestos o darte recomendaciones para ahorrar. ¿En qué te ayudo hoy?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputValue('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          accounts: accounts.map((a) => ({ id: a.id, name: a.name, balance: a.balance, type: a.type })),
          recentTransactions: transactions.slice(0, 10).map((t) => ({
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.category,
            date: t.date,
          })),
          categories: categories.map((c) => ({ name: c.name, monthlyLimit: c.monthlyLimit, spent: c.spent })),
          savingsGoals: goals.map((g) => ({ name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount })),
          history,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al conectar con KuroAI');
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        text: data.reply || 'Entendido. He preparado la acción para tu confirmación.',
        actions: (data.actions || []).map((a: any) => ({ ...a, status: 'pending' })),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'Lo siento, hubo un problema al procesar la solicitud. Por favor intenta de nuevo.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute action proposed by KuroAI
  const handleExecuteAction = (msgId: string, actionIndex: number) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.actions) return m;
        const targetAction = m.actions[actionIndex];
        if (!targetAction) return m;

        // Perform the real change
        const { name, args } = targetAction;

        if (name === 'transfer_funds') {
          // Find matching from and to account ids
          const fromAcc =
            accounts.find((a) => a.name.toLowerCase().includes(args.fromAccount?.toLowerCase())) || accounts[0];
          const toAcc =
            accounts.find((a) => a.name.toLowerCase().includes(args.toAccount?.toLowerCase())) ||
            accounts.find((a) => a.id !== fromAcc.id) ||
            accounts[0];

          if (fromAcc && toAcc) {
            onApplyTransfer(fromAcc.id, toAcc.id, Number(args.amount), args.description);
          }
        } else if (name === 'create_transaction') {
          const acc =
            accounts.find((a) => a.name.toLowerCase().includes(args.accountName?.toLowerCase())) || accounts[0];
          onApplyTransaction({
            accountId: acc.id,
            type: args.type === 'income' ? 'income' : 'expense',
            amount: Number(args.amount),
            category: args.category || 'Otros',
            description: args.description || 'Movimiento asistente',
            date: args.date || new Date().toISOString().split('T')[0],
          });
        } else if (name === 'create_account') {
          onApplyAccountCreate({
            name: args.name,
            type: (args.type as any) || 'savings',
            balance: Number(args.initialBalance) || 0,
            currency: args.currency || 'USD',
            bankName: args.name,
            bankCode: 'custom',
            accountNumberMasked: '•••• ' + Math.floor(1000 + Math.random() * 9000),
            color: '#3B82F6',
            isSynced: false,
            e2eEncrypted: true,
          });
        } else if (name === 'adjust_budget') {
          onApplyBudgetAdjust(args.category, Number(args.monthlyLimit));
        } else if (name === 'add_savings_goal') {
          onApplySavingsGoal({
            name: args.name,
            targetAmount: Number(args.targetAmount),
            currentAmount: 0,
            deadline: args.deadline,
            color: '#10B981',
            iconName: 'TrendingUp',
          });
        }

        const updatedActions = [...m.actions];
        updatedActions[actionIndex] = { ...targetAction, status: 'executed' };
        return { ...m, actions: updatedActions };
      })
    );
  };

  const handleCancelAction = (msgId: string, actionIndex: number) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.actions) return m;
        const updatedActions = [...m.actions];
        updatedActions[actionIndex] = { ...updatedActions[actionIndex], status: 'cancelled' };
        return { ...m, actions: updatedActions };
      })
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-slideLeft">
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-zinc-950 shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
              <span>KuroAI Asistente</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-400 border border-zinc-700">
                PRO
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">Controla cuentas, gastos y transferencias</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts Chips */}
      <div className="p-2.5 bg-zinc-900/50 border-b border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
        <button
          onClick={() => handleSendMessage('Transfiere $200 de Scotiabank a mi cuenta de Cooperativa Coopsano')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 whitespace-nowrap transition-colors"
        >
          🔁 Mover $200 de Scotiabank a Coopsano
        </button>
        <button
          onClick={() => handleSendMessage('Registra un gasto de $45 en supermercado con Tarjeta Nu')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 whitespace-nowrap transition-colors"
        >
          🛒 Gasto $45 en Súper
        </button>
        <button
          onClick={() => handleSendMessage('¿Cómo puedo optimizar mis gastos este mes para ahorrar más?')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 whitespace-nowrap transition-colors"
        >
          💡 Consejos de ahorro
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-start gap-2 max-w-[90%]">
              {msg.role === 'model' && (
                <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>

            {/* Action Cards (Tool Call confirmations) */}
            {msg.actions && msg.actions.length > 0 && (
              <div className="mt-2 w-full pl-8 space-y-2">
                {msg.actions.map((act, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-700/80 shadow-md text-xs space-y-2"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>
                        {act.name === 'transfer_funds' && 'Transferencia de Fondos'}
                        {act.name === 'create_transaction' && 'Nuevo Movimiento'}
                        {act.name === 'create_account' && 'Crear Nueva Cuenta'}
                        {act.name === 'adjust_budget' && 'Ajustar Presupuesto'}
                        {act.name === 'add_savings_goal' && 'Nueva Meta de Ahorro'}
                      </span>
                    </div>

                    <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300">
                      {act.name === 'transfer_funds' && (
                        <div>
                          De: <span className="text-zinc-100">{act.args.fromAccount}</span> ➔ A:{' '}
                          <span className="text-zinc-100">{act.args.toAccount}</span>
                          <br />
                          Monto: <span className="text-emerald-400 font-bold">${act.args.amount}</span>
                        </div>
                      )}
                      {act.name === 'create_transaction' && (
                        <div>
                          Tipo: {act.args.type === 'income' ? 'Ingreso' : 'Gasto'} | Cuenta:{' '}
                          {act.args.accountName}
                          <br />
                          Monto: ${act.args.amount} ({act.args.category})<br />
                          Concepto: {act.args.description}
                        </div>
                      )}
                      {act.name === 'create_account' && (
                        <div>
                          Nombre: {act.args.name} ({act.args.type})
                          <br />
                          Saldo Inicial: ${act.args.initialBalance} {act.args.currency || 'USD'}
                        </div>
                      )}
                      {act.name === 'adjust_budget' && (
                        <div>
                          Categoría: {act.args.category}
                          <br />
                          Nuevo Límite: ${act.args.monthlyLimit}/mes
                        </div>
                      )}
                      {act.name === 'add_savings_goal' && (
                        <div>
                          Meta: {act.args.name}
                          <br />
                          Objetivo: ${act.args.targetAmount}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {act.status === 'pending' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleCancelAction(msg.id, i)}
                          className="flex-1 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleExecuteAction(msg.id, i)}
                          className="flex-1 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm"
                        >
                          <Check className="w-3 h-3" />
                          <span>Aplicar Cambio</span>
                        </button>
                      </div>
                    )}

                    {act.status === 'executed' && (
                      <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[11px] text-center font-medium">
                        ✓ Acción ejecutada exitosamente
                      </div>
                    )}

                    {act.status === 'cancelled' && (
                      <div className="p-1 rounded-lg text-zinc-500 text-[11px] text-center">
                        Acción descartada
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <div className="w-5 h-5 rounded-full bg-zinc-800 animate-pulse flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
            </div>
            <span>KuroAI está procesando tus movimientos...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Escribe una instrucción financiera..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
