import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, FunctionDeclaration, Tool } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Shared Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Explicitly typed Tools declarations for Gemini Financial Assistant
const createTransactionDeclaration: FunctionDeclaration = {
  name: 'create_transaction',
  description: 'Registra un nuevo gasto o ingreso en una cuenta específica.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        description: "Tipo de movimiento: 'expense' (gasto) o 'income' (ingreso).",
      },
      amount: {
        type: Type.NUMBER,
        description: 'Monto del movimiento en números positivos.',
      },
      category: {
        type: Type.STRING,
        description: 'Categoría (ej: Alimentación, Transporte, Servicios, Entretenimiento, Salud, Sueldo, Inversión, Otros).',
      },
      accountName: {
        type: Type.STRING,
        description: 'Nombre o tipo de la cuenta de origen/destino (ej: Cuenta Corriente, Tarjeta de Crédito, Ahorros, Efectivo).',
      },
      description: {
        type: Type.STRING,
        description: 'Descripción breve del movimiento (ej: Supermercado, Pago de Luz, Almuerzo).',
      },
      date: {
        type: Type.STRING,
        description: 'Fecha en formato YYYY-MM-DD (opcional, por defecto hoy).',
      },
    },
    required: ['type', 'amount', 'category', 'accountName', 'description'],
  },
};

const transferFundsDeclaration: FunctionDeclaration = {
  name: 'transfer_funds',
  description: 'Transfiere dinero de una cuenta a otra cuenta del usuario.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      fromAccount: {
        type: Type.STRING,
        description: 'Nombre de la cuenta de origen (ej: Cuenta Corriente, Banco Santander).',
      },
      toAccount: {
        type: Type.STRING,
        description: 'Nombre de la cuenta destino (ej: Fondo de Ahorros, Efectivo).',
      },
      amount: {
        type: Type.NUMBER,
        description: 'Monto a transferir.',
      },
      description: {
        type: Type.STRING,
        description: 'Motivo o detalle de la transferencia (opcional).',
      },
    },
    required: ['fromAccount', 'toAccount', 'amount'],
  },
};

const createAccountDeclaration: FunctionDeclaration = {
  name: 'create_account',
  description: 'Crea una nueva cuenta financiera para el usuario.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'Nombre de la cuenta (ej: Nu Débito, Fondo Vacaciones, Cuenta Dólares).',
      },
      type: {
        type: Type.STRING,
        description: "Tipo de cuenta: 'checking' (corriente), 'savings' (ahorros), 'credit' (tarjeta de crédito), 'cash' (efectivo), o 'investment' (inversión).",
      },
      initialBalance: {
        type: Type.NUMBER,
        description: 'Saldo inicial de la cuenta.',
      },
      currency: {
        type: Type.STRING,
        description: 'Código de moneda, por ejemplo USD, MXN, COP, CLP, EUR, etc.',
      },
    },
    required: ['name', 'type', 'initialBalance'],
  },
};

const adjustBudgetDeclaration: FunctionDeclaration = {
  name: 'adjust_budget',
  description: 'Ajusta el límite mensual de presupuesto para una categoría de gastos.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: {
        type: Type.STRING,
        description: 'Nombre de la categoría (ej: Alimentación, Restaurantes, Entretenimiento, Transporte, Compras).',
      },
      monthlyLimit: {
        type: Type.NUMBER,
        description: 'Nuevo límite mensual sugerido o asignado.',
      },
    },
    required: ['category', 'monthlyLimit'],
  },
};

const addSavingsGoalDeclaration: FunctionDeclaration = {
  name: 'add_savings_goal',
  description: 'Crea una meta de ahorro con monto objetivo.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'Nombre de la meta (ej: Fondo de Emergencia, Viaje a Japón, Enganche Auto).',
      },
      targetAmount: {
        type: Type.NUMBER,
        description: 'Monto total objetivo a alcanzar.',
      },
      deadline: {
        type: Type.STRING,
        description: 'Fecha límite tentativa en formato YYYY-MM-DD.',
      },
    },
    required: ['name', 'targetAmount'],
  },
};

const financialTools: Tool[] = [
  {
    functionDeclarations: [
      createTransactionDeclaration,
      transferFundsDeclaration,
      createAccountDeclaration,
      adjustBudgetDeclaration,
      addSavingsGoalDeclaration,
    ],
  },
];

// POST /api/assistant/chat
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { message, accounts, recentTransactions, categories, savingsGoals, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'El mensaje es requerido' });
    }

    const systemPrompt = `Eres KuroAI, un asistente financiero personal inteligente, empático, proactivo y altamente preciso integrado en la aplicación de finanzas personales.
Tu objetivo es ayudar al usuario a gestionar sus cuentas bancarias y cooperativas de ahorro y crédito (como Scotiabank, Cooperativa Coopsano, etc.), controlar gastos, optimizar presupuestos, hacer transferencias entre cuentas y alcanzar sus metas de ahorro.
Hablas en español de manera profesional, clara y concisa.

ESTADO ACTUAL DE LAS FINANZAS DEL USUARIO:
- Cuentas e instituciones existentes (bancos y cooperativas): ${JSON.stringify(accounts || [])}
- Presupuestos por categoría y límites: ${JSON.stringify(categories || [])}
- Metas de ahorro actuales: ${JSON.stringify(savingsGoals || [])}
- Últimos movimientos registrados: ${JSON.stringify((recentTransactions || []).slice(0, 8))}

CAPACIDADES Y REGLAS:
1. Si el usuario te pide registrar un gasto o ingreso, transferir fondos entre cuentas (ej: entre Scotiabank y Coopsano), crear una nueva cuenta o cooperativa, modificar un presupuesto o crear una meta de ahorro, DEBES usar la función correspondiente (tool call).
2. Si los nombres de las cuentas dadas por el usuario se parecen a las existentes (ej: "scotiabank", "coopsano", "cuenta corriente", "ahorros", "tarjeta"), asócialas a la cuenta más lógica de la lista.
3. Brinda consejos de ahorro inteligentes si detectas que una categoría tiene gastos altos respecto al presupuesto.
4. Explica siempre qué acción realizaste o recomendaste de forma amable.`;

    const chatContents: any[] = [];
    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        chatContents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text || '' }],
        });
      }
    }
    chatContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
        tools: financialTools,
      },
    });

    const candidate = response.candidates?.[0];
    const text = response.text || candidate?.content?.parts?.find((p: any) => p.text)?.text || '';
    const functionCalls = response.functionCalls || [];

    return res.json({
      reply: text,
      actions: functionCalls.map((fc: any) => ({
        name: fc.name,
        args: fc.args,
      })),
    });
  } catch (error: any) {
    console.error('Error in /api/assistant/chat:', error);
    return res.status(500).json({
      error: 'Error al procesar la solicitud con el asistente de IA.',
      details: error.message || String(error),
    });
  }
});

// POST /api/parse-email-transactions
app.post('/api/parse-email-transactions', async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'No se enviaron correos para analizar.' });
    }

    const prompt = `Analiza los siguientes correos electrónicos de bancos, servicios y tiendas recibidos por el usuario.
Extrae cualquier transacción bancaria, cobro, transferencia recibida o realizada, pago con tarjeta o recibo.
Si un correo NO es una transacción financiera (ej: newsletter, spam, bienvenida), ignóralo.

Correos a analizar:
${JSON.stringify(emails.slice(0, 10))}

Retorna un arreglo JSON estricto con las transacciones detectadas.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sourceEmailId: { type: Type.STRING, description: 'ID del correo analizado' },
              description: { type: Type.STRING, description: 'Comercio o concepto (ej: Uber, Starbucks, Nómina)' },
              amount: { type: Type.NUMBER, description: 'Monto numérico positivo' },
              currency: { type: Type.STRING, description: 'Moneda detectada (ej: USD, MXN, COP, EUR)' },
              type: { type: Type.STRING, description: "'expense' si es gasto/cobro, 'income' si es abono/ingreso" },
              category: { type: Type.STRING, description: 'Categoría sugerida (Alimentación, Transporte, Servicios, Compras, etc.)' },
              date: { type: Type.STRING, description: 'Fecha detectada YYYY-MM-DD' },
              accountHint: { type: Type.STRING, description: 'Indicio de cuenta ej: Débito terminación 4921 o Tarjeta Crédito' },
              bankName: { type: Type.STRING, description: 'Nombre del banco o entidad remitente' },
            },
            required: ['description', 'amount', 'type', 'category', 'date'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    return res.json({ transactions: parsed });
  } catch (error: any) {
    console.error('Error in /api/parse-email-transactions:', error);
    return res.status(500).json({
      error: 'Error al analizar correos de transacciones.',
      details: error.message || String(error),
    });
  }
});

// Vite middleware in dev or static files in prod
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KuroFinance server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
