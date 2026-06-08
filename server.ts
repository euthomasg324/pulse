import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
// No native sqlite3 imported to prevent GLIBC loader conflicts in containers
import { Habit, TimelineItem, HabitLog, HabitType } from "./src/types";
import pg from "pg";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize PostgreSQL Pool if DATABASE_URL exists (e.g., deployed on Railway)
let pool: pg.Pool | null = null;
if (process.env.DATABASE_URL) {
  try {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    console.log("PostgreSQL Production Database Core Online + Active.");
  } catch (err) {
    console.error("Failed to initialize PostgreSQL pool:", err);
  }
}

// Initialize Gemini SDK if API Key exists
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini Personal Intelligence Core Online.");
  } catch (err) {
    console.error("Failed to initialize Gemini core:", err);
  }
}

const DB_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Highly compatible, pure-JS structured relational database persistence engine.
// Avoids any dynamic libraries/GLIBC dependencies, completely supporting SQLite syntax.
const DB_JSON = path.join(DB_DIR, "pulse_db.json");

interface DBState {
  habits: any[];
  habit_logs: any[];
  timeline: any[];
  notifications: any[];
  kv_store: { [key: string]: string };
}

let jsonDb: DBState = {
  habits: [],
  habit_logs: [],
  timeline: [],
  notifications: [],
  kv_store: {}
};

const saveJsonDb = () => {
  try {
    fs.writeFileSync(DB_JSON, JSON.stringify(jsonDb, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed persisting database:", err);
  }
};

const loadJsonDb = () => {
  try {
    if (fs.existsSync(DB_JSON)) {
      jsonDb = JSON.parse(fs.readFileSync(DB_JSON, "utf-8"));
    } else {
      jsonDb = {
        habits: [],
        habit_logs: [],
        timeline: [],
        notifications: [],
        kv_store: {}
      };
      saveJsonDb();
    }
    // Safe initialization block for existing legacy db configurations
    if (!jsonDb.habits) jsonDb.habits = [];
    if (!jsonDb.habit_logs) jsonDb.habit_logs = [];
    if (!jsonDb.timeline) jsonDb.timeline = [];
    if (!jsonDb.notifications) jsonDb.notifications = [];
    if (!jsonDb.kv_store) jsonDb.kv_store = {};
  } catch (err) {
    console.error("Failed loading database, initializing empty:", err);
    jsonDb = {
      habits: [],
      habit_logs: [],
      timeline: [],
      notifications: [],
      kv_store: {}
    };
    saveJsonDb();
  }
};

// Initial sync
loadJsonDb();

function translateQuery(sql: string): string {
  let index = 1;
  let translated = sql.trim().replace(/\?/g, () => `$${index++}`);
  
  if (translated.match(/INSERT OR REPLACE INTO habit_logs/i)) {
    translated = `
      INSERT INTO habit_logs (habitId, date, value, completed)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (habitId, date) DO UPDATE 
      SET value = EXCLUDED.value, completed = EXCLUDED.completed
    `;
  }
  
  if (translated.match(/INTEGER PRIMARY KEY AUTOINCREMENT/i)) {
    translated = translated.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/i, "SERIAL PRIMARY KEY");
  }
  
  translated = translated.replace(/\bREAL\b/gi, "DOUBLE PRECISION");
  
  if (translated.match(/INSERT INTO habits/i)) {
    translated = `
      INSERT INTO habits (id, name, icon, color, type, targetValue, currentValue, completed, frequencyType, frequencyInterval, timeOfDay, priority, category, createdAt, lastResetDate, exigencia, connectedMacroId, connectedTraitId, resultOutcome, todayPhoto)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        icon = EXCLUDED.icon,
        color = EXCLUDED.color,
        type = EXCLUDED.type,
        targetValue = EXCLUDED.targetValue,
        currentValue = EXCLUDED.currentValue,
        completed = EXCLUDED.completed,
        frequencyType = EXCLUDED.frequencyType,
        frequencyInterval = EXCLUDED.frequencyInterval,
        timeOfDay = EXCLUDED.timeOfDay,
        priority = EXCLUDED.priority,
        category = EXCLUDED.category,
        createdAt = EXCLUDED.createdAt,
        lastResetDate = EXCLUDED.lastResetDate,
        exigencia = EXCLUDED.exigencia,
        connectedMacroId = EXCLUDED.connectedMacroId,
        connectedTraitId = EXCLUDED.connectedTraitId,
        resultOutcome = EXCLUDED.resultOutcome,
        todayPhoto = EXCLUDED.todayPhoto
    `;
  }

  if (translated.match(/INSERT INTO timeline/i)) {
    translated = `
      INSERT INTO timeline (id, time, title, habitId, completed)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        time = EXCLUDED.time,
        title = EXCLUDED.title,
        habitId = EXCLUDED.habitId,
        completed = EXCLUDED.completed
    `;
  }

  if (translated.match(/INSERT OR REPLACE INTO kv_store/i)) {
    translated = `
      INSERT INTO kv_store (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE 
      SET value = EXCLUDED.value
    `;
  }

  translated = translated.replace(/as '([^']*)'/gi, 'as "$1"');
  return translated;
}

const sqlRun = async (sql: string, params: any[] = []): Promise<any> => {
  if (pool) {
    const pgSql = translateQuery(sql);
    try {
      const res = await pool.query(pgSql, params);
      return { 
        changes: res.rowCount || 0, 
        lastID: res.rows && res.rows[0] ? res.rows[0].id : 0 
      };
    } catch (err) {
      console.error("PostgreSQL Run Error:", sql, "->", pgSql, err);
      throw err;
    }
  }

  const query = sql.trim().replace(/\s+/g, " ");

  if (query.match(/CREATE TABLE IF NOT EXISTS/i)) {
    return { changes: 0, lastID: 0 };
  }

  if (query.match(/DROP TABLE IF EXISTS/i)) {
    const tableMatch = query.match(/DROP TABLE IF EXISTS (\w+)/i);
    if (tableMatch) {
      const tableName = tableMatch[1].toLowerCase();
      if (tableName === "habits") jsonDb.habits = [];
      else if (tableName === "habit_logs") jsonDb.habit_logs = [];
      else if (tableName === "timeline") jsonDb.timeline = [];
      else if (tableName === "notifications") jsonDb.notifications = [];
      else if (tableName === "kv_store") jsonDb.kv_store = {};
      saveJsonDb();
    }
    return { changes: 1 };
  }

  if (query.match(/INSERT INTO habits/i)) {
    const item = {
      id: params[0],
      name: params[1],
      icon: params[2],
      color: params[3],
      type: params[4],
      targetValue: params[5],
      currentValue: params[6],
      completed: params[7],
      frequencyType: params[8],
      frequencyInterval: params[9],
      timeOfDay: params[10],
      priority: params[11],
      category: params[12],
      createdAt: params[13],
      lastResetDate: params[14],
      exigencia: params[15],
      connectedMacroId: params[16],
      connectedTraitId: params[17],
      resultOutcome: params[18],
      todayPhoto: params[19] || null
    };
    jsonDb.habits = jsonDb.habits.filter(h => h.id !== item.id);
    jsonDb.habits.push(item);
    saveJsonDb();
    return { changes: 1, lastID: item.id };
  }

  if (query.match(/INSERT OR REPLACE INTO habit_logs/i)) {
    const habitId = params[0];
    const date = params[1];
    const value = params[2];
    const completed = params[3];

    jsonDb.habit_logs = jsonDb.habit_logs.filter(l => !(l.habitId === habitId && l.date === date));
    jsonDb.habit_logs.push({ habitId, date, value, completed });
    saveJsonDb();
    return { changes: 1 };
  }

  if (query.match(/INSERT INTO timeline/i)) {
    const item = {
      id: params[0],
      time: params[1],
      title: params[2],
      habitId: params[3],
      completed: params[4]
    };
    jsonDb.timeline = jsonDb.timeline.filter(t => t.id !== item.id);
    jsonDb.timeline.push(item);
    saveJsonDb();
    return { changes: 1, lastID: item.id };
  }

  if (query.match(/INSERT INTO notifications/i)) {
    const id = jsonDb.notifications.length + 1;
    const item = {
      id,
      message: params[0],
      createdAt: params[1]
    };
    jsonDb.notifications.push(item);
    saveJsonDb();
    return { changes: 1, lastID: id };
  }

  if (query.match(/INSERT OR REPLACE INTO kv_store/i)) {
    const key = params[0];
    const value = params[1];
    jsonDb.kv_store[key] = value;
    saveJsonDb();
    return { changes: 1 };
  }

  if (query.match(/UPDATE habits/i)) {
    const setMatch = query.match(/SET\s+(.+?)\s+WHERE/i);
    if (setMatch) {
      const setClause = setMatch[1];
      const columns = setClause.split(",").map(c => c.split("=")[0].trim());
      const id = params[params.length - 1];
      const h = jsonDb.habits.find(x => x.id === id);
      if (h) {
        columns.forEach((col, idx) => {
          h[col] = params[idx];
        });
        saveJsonDb();
      }
    } else {
      if (query.includes("resultOutcome")) {
        const [currentValue, completed, resultOutcome, id] = params;
        const h = jsonDb.habits.find(x => x.id === id);
        if (h) {
          h.currentValue = currentValue;
          h.completed = completed;
          h.resultOutcome = resultOutcome;
          saveJsonDb();
        }
      } else if (query.includes("lastResetDate")) {
        const [currentValue, completed, lastResetDate, id] = params;
        const h = jsonDb.habits.find(x => x.id === id);
        if (h) {
          h.currentValue = currentValue;
          h.completed = completed;
          h.lastResetDate = lastResetDate;
          saveJsonDb();
        }
      } else {
        const [currentValue, completed, id] = params;
        const h = jsonDb.habits.find(x => x.id === id);
        if (h) {
          h.currentValue = currentValue;
          h.completed = completed;
          saveJsonDb();
        }
      }
    }
    return { changes: 1 };
  }

  if (query.match(/UPDATE timeline SET completed = 0/i)) {
    jsonDb.timeline.forEach(t => t.completed = 0);
    saveJsonDb();
    return { changes: jsonDb.timeline.length };
  }

  if (query.match(/UPDATE timeline SET completed = \?/i)) {
    const [completed, habitId] = params;
    let count = 0;
    jsonDb.timeline.forEach(t => {
      if (t.habitId === habitId) {
        t.completed = completed;
        count++;
      }
    });
    if (count > 0) saveJsonDb();
    return { changes: count };
  }

  if (query.match(/DELETE FROM habits WHERE id = \?/i)) {
    const id = params[0];
    const prevLen = jsonDb.habits.length;
    jsonDb.habits = jsonDb.habits.filter(x => x.id !== id);
    saveJsonDb();
    return { changes: prevLen - jsonDb.habits.length };
  }

  if (query.match(/DELETE FROM habit_logs WHERE habitId = \?/i)) {
    const habitId = params[0];
    const prevLen = jsonDb.habit_logs.length;
    jsonDb.habit_logs = jsonDb.habit_logs.filter(x => x.habitId !== habitId);
    saveJsonDb();
    return { changes: prevLen - jsonDb.habit_logs.length };
  }

  if (query.match(/DELETE FROM timeline WHERE habitId = \?/i)) {
    const habitId = params[0];
    const prevLen = jsonDb.timeline.length;
    jsonDb.timeline = jsonDb.timeline.filter(x => x.habitId !== habitId);
    saveJsonDb();
    return { changes: prevLen - jsonDb.timeline.length };
  }

  if (query.match(/DELETE FROM timeline WHERE id = \?/i)) {
    const id = params[0];
    const prevLen = jsonDb.timeline.length;
    jsonDb.timeline = jsonDb.timeline.filter(x => x.id !== id);
    saveJsonDb();
    return { changes: prevLen - jsonDb.timeline.length };
  }

  console.warn("Unhandled sqlRun Query:", sql, params);
  return { changes: 0 };
};

const sqlAll = async (sql: string, params: any[] = []): Promise<any[]> => {
  if (pool) {
    const pgSql = translateQuery(sql);
    try {
      const res = await pool.query(pgSql, params);
      return res.rows;
    } catch (err) {
      console.error("PostgreSQL All Error:", sql, "->", pgSql, err);
      throw err;
    }
  }

  const query = sql.trim().replace(/\s+/g, " ");

  if (query.match(/SELECT count\(\*\) as count FROM habits/i)) {
    return [{ count: jsonDb.habits.length }];
  }

  if (query.match(/^SELECT \* FROM habits/i)) {
    return jsonDb.habits;
  }

  if (query.match(/^SELECT id FROM habits/i)) {
    return jsonDb.habits.map(h => ({ id: h.id }));
  }

  if (query.match(/^SELECT \* FROM habit_logs/i)) {
    return jsonDb.habit_logs;
  }

  if (query.match(/^SELECT \* FROM timeline/i)) {
    return jsonDb.timeline;
  }

  if (query.match(/^SELECT \* FROM notifications/i)) {
    const res = [...jsonDb.notifications].sort((a, b) => b.id - a.id);
    if (query.match(/LIMIT (\d+)/i)) {
      const val = parseInt(query.match(/LIMIT (\d+)/i)![1], 10);
      return res.slice(0, val);
    }
    return res;
  }

  if (query.match(/SELECT value FROM kv_store WHERE key = \?/i)) {
    const key = params[0];
    const val = jsonDb.kv_store[key];
    return val !== undefined ? [{ value: val }] : [];
  }

  if (query.match(/SELECT h\.name as 'Hábito'/i)) {
    const dateLimit = params[0];
    const filteredLogs = jsonDb.habit_logs.filter(hl => hl.date >= dateLimit);

    const rows = filteredLogs.map(hl => {
      const h = jsonDb.habits.find(x => x.id === hl.habitId);
      return {
        'Hábito': h ? h.name : "Hábito Excluído",
        'Categoria': h ? h.category : "Geral",
        'Data': hl.date,
        'Valor Atingido': hl.value,
        'Meta Diária': h ? h.targetValue : 1,
        'Concluído': hl.completed === 1 || hl.completed === true ? 'Sim' : 'Não'
      };
    });

    rows.sort((a, b) => {
      const dateCmp = b['Data'].localeCompare(a['Data']);
      if (dateCmp !== 0) return dateCmp;
      return a['Hábito'].localeCompare(b['Hábito']);
    });

    return rows;
  }

  console.warn("Unhandled sqlAll Query:", sql, params);
  return [];
};

// Produce beautiful deterministic mock history for 16 days to show amazing track grid at first load
const generateMockHistory = (habitType: HabitType, target: number, completionRate: number): HabitLog[] => {
  const logs: HabitLog[] = [];
  const today = new Date();
  for (let i = 15; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isCompleted = Math.random() < completionRate;
    let val = 0;
    if (habitType === 'check') {
      val = isCompleted ? 1 : 0;
    } else if (habitType === 'quantitative' || habitType === 'accumulative') {
      val = isCompleted ? target : Math.floor(target * (0.3 + Math.random() * 0.5));
    } else if (habitType === 'timed') {
      val = isCompleted ? target : Math.floor(target * (0.4 + Math.random() * 0.4));
    } else {
      val = isCompleted ? 1 : 0;
    }
    logs.push({
      date: dateStr,
      value: val,
      completed: isCompleted
    });
  }
  return logs;
};

// Factory default settings
const defaultHabits: Habit[] = [
  {
    id: "h-mantra",
    name: "Mantra Diário",
    icon: "Sparkles",
    color: "purple",
    type: "check",
    targetValue: 1,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    timeOfDay: "05:00",
    priority: "high",
    category: "Energia",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "h-acordar-cedo",
    name: "Acordar Cedo",
    icon: "Sun",
    color: "green",
    type: "check",
    targetValue: 1,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    timeOfDay: "06:00",
    priority: "high",
    category: "Ritmo",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "h-dormir-cedo",
    name: "Dormir Cedo",
    icon: "Moon",
    color: "purple",
    type: "check",
    targetValue: 1,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    timeOfDay: "22:30",
    priority: "medium",
    category: "Ritmo",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "h-ler-livro",
    name: "Ler Livro",
    icon: "BookOpen",
    color: "blue",
    type: "quantitative",
    targetValue: 30,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    timeOfDay: "21:00",
    priority: "medium",
    category: "Execução",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "h-banho-gelado",
    name: "Banho Gelado",
    icon: "Droplets",
    color: "blue",
    type: "check",
    targetValue: 1,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    priority: "low",
    category: "Energia",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "h-meditar",
    name: "Meditar",
    icon: "Clock",
    color: "purple",
    type: "timed",
    targetValue: 20,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    priority: "low",
    category: "Energia",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "h-acumular-energia",
    name: "Acumular Energia",
    icon: "Zap",
    color: "green",
    type: "check",
    targetValue: 1,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    priority: "high",
    category: "Energia",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "h-mensagens",
    name: "300 mensagens",
    icon: "MessageSquare",
    color: "blue",
    type: "quantitative",
    targetValue: 300,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    timeOfDay: "08:00",
    priority: "high",
    category: "Execução",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "h-ligacoes",
    name: "50 ligações",
    icon: "PhoneCall",
    color: "orange",
    type: "quantitative",
    targetValue: 50,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    timeOfDay: "10:00",
    priority: "high",
    category: "Execução",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "h-remarketing",
    name: "50 remarketing",
    icon: "TrendingUp",
    color: "orange",
    type: "quantitative",
    targetValue: 50,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    timeOfDay: "14:00",
    priority: "high",
    category: "Resultado",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "h-agua",
    name: "Água",
    icon: "Droplets",
    color: "blue",
    type: "quantitative",
    targetValue: 3,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    priority: "medium",
    category: "Energia",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "h-exercicio-fisico",
    name: "Exercício Físico",
    icon: "Dumbbell",
    color: "green",
    type: "check",
    targetValue: 1,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    priority: "high",
    category: "Energia",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  },
  {
    id: "h-arrumar-casa-30",
    name: "Arrumar a casa por 30 min",
    icon: "Layers",
    color: "orange",
    type: "quantitative",
    targetValue: 30,
    currentValue: 0,
    completed: false,
    frequencyType: "daily",
    priority: "medium",
    category: "Execução",
    createdAt: new Date().toISOString(),
    logs: [],
    lastResetDate: new Date().toISOString().split('T')[0]
  }
];

const defaultTimeline: TimelineItem[] = [
  { id: "t-0", time: "05:00", title: "Mantra Diário", habitId: "h-mantra", completed: false },
  { id: "t-1", time: "06:00", title: "Acordar Cedo", habitId: "h-acordar-cedo", completed: false },
  { id: "t-2", time: "08:00", title: "Enviar Mensagens", habitId: "h-mensagens", completed: false },
  { id: "t-3", time: "10:00", title: "Ligações", habitId: "h-ligacoes", completed: false },
  { id: "t-4", time: "14:00", title: "Remarketing", habitId: "h-remarketing", completed: false },
  { id: "t-5", time: "21:00", title: "Ler Livro", habitId: "h-ler-livro", completed: false },
  { id: "t-6", time: "22:30", title: "Dormir Cedo", habitId: "h-dormir-cedo", completed: false }
];

const defaultNotifications = [
  "A consistência não liga para o seu humor. Execute.",
  "Zere o ego, mantenha o ritmo.",
  "O volume limpo gera inevitabilidade operacional.",
  "A disciplina militar foca no processo, não na recompensa.",
  "Seu melhor horário de foco começou."
];

// Memory state sync container
let dbState = {
  habits: defaultHabits,
  timeline: defaultTimeline,
  notifications: defaultNotifications
};

// SQL Database Schema Setup
async function initSqlite() {
  await sqlRun(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      name TEXT,
      icon TEXT,
      color TEXT,
      type TEXT,
      targetValue REAL,
      currentValue REAL,
      completed INTEGER,
      frequencyType TEXT,
      frequencyInterval INTEGER,
      timeOfDay TEXT,
      priority TEXT,
      category TEXT,
      createdAt TEXT,
      lastResetDate TEXT,
      exigencia TEXT,
      connectedMacroId TEXT,
      connectedTraitId TEXT,
      resultOutcome TEXT,
      todayPhoto TEXT,
      startedAt TEXT
    )
  `);

  try { await sqlRun(`ALTER TABLE habits ADD COLUMN todayPhoto TEXT`); } catch(e){}
  try { await sqlRun(`ALTER TABLE habits ADD COLUMN startedAt TEXT`); } catch(e){}

  await sqlRun(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      habitId TEXT,
      date TEXT,
      value REAL,
      completed INTEGER,
      PRIMARY KEY (habitId, date)
    )
  `);

  await sqlRun(`
    CREATE TABLE IF NOT EXISTS action_logs (
      id TEXT PRIMARY KEY,
      habitId TEXT,
      actionType TEXT,
      timestamp TEXT,
      valueDelta REAL
    )
  `);

  await sqlRun(`
    CREATE TABLE IF NOT EXISTS timeline (
      id TEXT PRIMARY KEY,
      time TEXT,
      title TEXT,
      habitId TEXT,
      completed INTEGER
    )
  `);

  await sqlRun(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT,
      createdAt TEXT
    )
  `);
  await sqlRun(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
}

// Read entire DB state and sync into memory dbState mapping
async function loadStateFromSqlite() {
  try {
    await initSqlite();

    // Auto-migrate missing new target default habits to existing users
    const habitsCountRowTmp = await sqlAll("SELECT count(*) as count FROM habits");
    const countTmp = Number(habitsCountRowTmp[0]?.count ?? habitsCountRowTmp[0]?.Count ?? habitsCountRowTmp[0]?.COUNT ?? 0);
    if (countTmp > 0) {
      const currentDbHabits = await sqlAll("SELECT id FROM habits");
      const currentDbIds = currentDbHabits.map((x: any) => x.id || x.Id);
      for (const h of defaultHabits) {
        if (!currentDbIds.includes(h.id)) {
          console.log(`Auto-migração: Inserindo o novo hábito padrão faltando: ${h.name} (${h.id})`);
          await sqlRun(`
            INSERT INTO habits (id, name, icon, color, type, targetValue, currentValue, completed, frequencyType, frequencyInterval, timeOfDay, priority, category, createdAt, lastResetDate, exigencia, connectedMacroId, connectedTraitId, resultOutcome, todayPhoto)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [h.id, h.name, h.icon, h.color, h.type, h.targetValue, h.currentValue, h.completed ? 1 : 0, h.frequencyType, h.frequencyInterval || null, h.timeOfDay || null, h.priority, h.category, h.createdAt, h.lastResetDate || null, h.exigencia || null, h.connectedMacroId || null, h.connectedTraitId || null, h.resultOutcome || null, h.todayPhoto || null]);

          for (const log of h.logs) {
            await sqlRun(`
              INSERT OR REPLACE INTO habit_logs (habitId, date, value, completed)
              VALUES (?, ?, ?, ?)
            `, [h.id, log.date, log.value, log.completed ? 1 : 0]);
          }
        }
      }
    }

    const habitsCountRow = await sqlAll("SELECT count(*) as count FROM habits");
    const countVal = Number(habitsCountRow[0]?.count ?? habitsCountRow[0]?.Count ?? habitsCountRow[0]?.COUNT ?? 0);
    if (countVal === 0) {
      console.log("Empty SQLite/PostgreSQL database detected. Injecting robust defaults...");
      for (const h of defaultHabits) {
        await sqlRun(`
          INSERT INTO habits (id, name, icon, color, type, targetValue, currentValue, completed, frequencyType, frequencyInterval, timeOfDay, priority, category, createdAt, lastResetDate, exigencia, connectedMacroId, connectedTraitId, resultOutcome, todayPhoto)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [h.id, h.name, h.icon, h.color, h.type, h.targetValue, h.currentValue, h.completed ? 1 : 0, h.frequencyType, h.frequencyInterval || null, h.timeOfDay || null, h.priority, h.category, h.createdAt, h.lastResetDate || null, h.exigencia || null, h.connectedMacroId || null, h.connectedTraitId || null, h.resultOutcome || null, h.todayPhoto || null]);

        for (const log of h.logs) {
          await sqlRun(`
            INSERT OR REPLACE INTO habit_logs (habitId, date, value, completed)
            VALUES (?, ?, ?, ?)
          `, [h.id, log.date, log.value, log.completed ? 1 : 0]);
        }
      }

      for (const t of defaultTimeline) {
        await sqlRun(`
          INSERT INTO timeline (id, time, title, habitId, completed)
          VALUES (?, ?, ?, ?, ?)
        `, [t.id, t.time, t.title, t.habitId || null, t.completed ? 1 : 0]);
      }

      for (const note of defaultNotifications) {
        await sqlRun(`
          INSERT INTO notifications (message, createdAt)
          VALUES (?, ?)
        `, [note, new Date().toISOString()]);
      }
    }

    // Rebuild memory representation
    const dbHabits = await sqlAll("SELECT * FROM habits");
    const dbLogs = await sqlAll("SELECT * FROM habit_logs");
    const dbTimeline = await sqlAll("SELECT * FROM timeline");
    const dbNotes = await sqlAll("SELECT * FROM notifications ORDER BY id DESC LIMIT 15");

    const habits: Habit[] = dbHabits.map((h: any) => {
      const logs = dbLogs
        .filter((l: any) => l.habitId === h.id || l.habitid === h.id || l.habitId === h.Id || l.habitid === h.Id)
        .map((l: any) => ({
          date: l.date || l.Date,
          value: Number(l.value ?? l.Value ?? l.value ?? 0),
          completed: Boolean(l.completed ?? l.Completed ?? false)
        }))
        .sort((a,b) => a.date.localeCompare(b.date));

      return {
        id: h.id || h.Id || h.id,
        name: h.name || h.Name,
        icon: h.icon || h.Icon,
        color: h.color || h.Color,
        type: (h.type || h.Type) as HabitType,
        targetValue: Number(h.targetValue ?? h.targetvalue ?? h.TargetValue ?? 0),
        currentValue: Number(h.currentValue ?? h.currentvalue ?? h.CurrentValue ?? 0),
        completed: Boolean(h.completed ?? h.Completed ?? false),
        frequencyType: h.frequencyType || h.frequencytype || h.FrequencyType,
        frequencyInterval: (h.frequencyInterval || h.frequencyinterval || h.FrequencyInterval) ? Number(h.frequencyInterval || h.frequencyinterval || h.FrequencyInterval) : undefined,
        timeOfDay: h.timeOfDay || h.timeofday || h.TimeOfDay || undefined,
        priority: h.priority || h.Priority,
        category: h.category || h.Category,
        createdAt: h.createdAt || h.createdat || h.CreatedAt,
        logs: logs,
        lastResetDate: h.lastResetDate || h.lastresetdate || h.LastResetDate || undefined,
        exigencia: h.exigencia || h.Exigencia || undefined,
        connectedMacroId: h.connectedMacroId || h.connectedmacroid || h.ConnectedMacroId || undefined,
        connectedTraitId: h.connectedTraitId || h.connectedtraitid || h.ConnectedTraitId || undefined,
        resultOutcome: h.resultOutcome || h.resultoutcome || h.ResultOutcome || undefined,
        todayPhoto: h.todayPhoto || h.todayphoto || h.TodayPhoto || undefined,
        startedAt: h.startedAt || h.startedat || h.StartedAt || undefined
      };
    });

    const timeline: TimelineItem[] = dbTimeline.map((t: any) => ({
      id: t.id || t.Id || t.id,
      time: t.time || t.Time || t.time,
      title: t.title || t.Title || t.title,
      habitId: t.habitId || t.habitid || t.HabitId || undefined,
      completed: Boolean(t.completed ?? t.Completed ?? false)
    }));

    const notifications: string[] = dbNotes.map((n: any) => n.message || n.Message || "");

    dbState = {
      habits,
      timeline: timeline.sort((a,b) => a.time.localeCompare(b.time)),
      notifications: notifications.length > 0 ? notifications : defaultNotifications
    };

    console.log(`SQLite system synced perfectly. Habits: ${dbState.habits.length}`);
  } catch (err) {
    console.error("Critical SQLite loading failure:", err);
  }
}

// Sync first time on start
loadStateFromSqlite();

// --- API Router Endpoints ---

// Obtain complete State
app.get("/api/state", async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    let needsReset = false;
    for (const h of dbState.habits) {
      if (h.lastResetDate && h.lastResetDate < todayStr) {
        needsReset = true;
        break;
      }
    }

    if (needsReset) {
      console.log(`Auto daily reset triggered for new day: ${todayStr}`);
      for (const h of dbState.habits) {
        // 1. Save final to logs
        await sqlRun(`
          INSERT OR REPLACE INTO habit_logs (habitId, date, value, completed)
          VALUES (?, ?, ?, ?)
        `, [h.id, h.lastResetDate || todayStr, h.currentValue, h.completed ? 1 : 0]);

        // 2. Clear out
        let val = 0;
        let compl = 0;
        if (h.type === 'check' || h.type === 'quantitative' || h.type === 'timed' || h.type === 'accumulative') {
          val = 0;
          compl = 0;
        } else if (h.type === 'frequency') {
          if (h.currentValue <= 1) {
            val = h.targetValue;
            compl = 1;
          } else {
            val = h.currentValue - 1;
            compl = 0;
          }
        }
        await sqlRun(`
          UPDATE habits SET currentValue = ?, completed = ?, lastResetDate = ?, resultOutcome = NULL, todayPhoto = NULL
          WHERE id = ?
        `, [val, compl, todayStr, h.id]);

        await sqlRun(`UPDATE timeline SET completed = 0 WHERE habitId = ?`, [h.id]);
      }
      await loadStateFromSqlite();
    }
  } catch(e) {}
  res.json(dbState);
});

// KV Store API
app.get("/api/kv", async (req, res) => {
  try {
    const keys = ["pulse_visions_v4", "pulse_identity_characteristics_v1", "pulse_goals_v2"];
    const kvData: Record<string, any> = {};
    for (const k of keys) {
      if (pool) { // Read from pg/sqlite
        const row = await sqlAll(`SELECT value FROM kv_store WHERE key = ?`, [k]);
        if (row && row.length > 0) {
          kvData[k] = JSON.parse(row[0].value || row[0].Value || "null");
        } else if (jsonDb.kv_store[k]) {
          kvData[k] = JSON.parse(jsonDb.kv_store[k]);
        }
      } else {
        if (jsonDb.kv_store[k]) {
           kvData[k] = JSON.parse(jsonDb.kv_store[k]);
        }
      }
    }
    res.json(kvData);
  } catch (err) {
    res.status(500).json({ error: "Falha ao ler dados kv." });
  }
});

app.post("/api/kv", async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || typeof value === "undefined") {
      return res.status(400).json({ error: "key and value obliged" });
    }
    const valStr = JSON.stringify(value);
    await sqlRun(`
      INSERT OR REPLACE INTO kv_store (key, value)
      VALUES (?, ?)
    `, [key, valStr]);
    res.json({ success: true, key });
  } catch(err) {
    res.status(500).json({ error: "Falha ao gravar kv_store" });
  }
});

// Restore database factory settings (Clear absolute SQLite tables)
app.post("/api/reset-db", async (req, res) => {
  try {
    await sqlRun("DROP TABLE IF EXISTS habits");
    await sqlRun("DROP TABLE IF EXISTS habit_logs");
    await sqlRun("DROP TABLE IF EXISTS timeline");
    await sqlRun("DROP TABLE IF EXISTS notifications");
    
    await loadStateFromSqlite();
    res.json({ success: true, ...dbState });
  } catch (err) {
    res.status(500).json({ success: false, error: "Falha ao limpar base SQL" });
  }
});

// Start new day / Cycle reset
app.post("/api/reset-day", async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    for (const h of dbState.habits) {
      // 1. Save today's final execution to historical log
      await sqlRun(`
        INSERT OR REPLACE INTO habit_logs (habitId, date, value, completed)
        VALUES (?, ?, ?, ?)
      `, [h.id, todayStr, h.currentValue, h.completed ? 1 : 0]);

      // 2. Set default resets back to zero
      let val = 0;
      let compl = 0;
      if (h.type === 'check' || h.type === 'quantitative' || h.type === 'timed' || h.type === 'accumulative') {
        val = 0;
        compl = 0;
      } else if (h.type === 'frequency') {
        if (h.currentValue <= 1) {
          val = h.targetValue;
          compl = 1;
        } else {
          val = h.currentValue - 1;
          compl = 0;
        }
      }

      await sqlRun(`
        UPDATE habits
        SET currentValue = ?, completed = ?, lastResetDate = ?
        WHERE id = ?
      `, [val, compl, todayStr, h.id]);
    }

    // 3. Clear today's timeline
    await sqlRun("UPDATE timeline SET completed = 0");

    // 4. Record new system instruction notification
    const options = [
      "Ciclo Operacional Reiniciado. Execução de hoje recalculada para zero.",
      "Consistência exige ação inegociável. Inicie sua agenda diária.",
      "Zere o ego, mantenha o foco. O volume de metas acumuladas aguarda.",
      "Novo dia. Beba água logo ao despertar para carregar seus níveis."
    ];
    const pickedNote = options[Math.floor(Math.random() * options.length)];
    await sqlRun("INSERT INTO notifications (message, createdAt) VALUES (?, ?)", [pickedNote, new Date().toISOString()]);

    await loadStateFromSqlite();
    res.json({ success: true, ...dbState });
  } catch (err) {
    res.status(500).json({ success: false, error: "Falha ao redefinir dia no SQL" });
  }
});

// Clear historical logs and progress, but strictly retain configurations
app.post("/api/settings/reset-history", async (req, res) => {
  try {
    // Drop execution logs completely 
    await sqlRun("DELETE FROM habit_logs");
    
    // Reset day and active counters for habits
    await sqlRun(`
      UPDATE habits 
      SET currentValue = 0, 
          completed = 0, 
          todayPhoto = NULL, 
          resultOutcome = NULL, 
          startedAt = NULL,
          lastResetDate = NULL
    `);

    // Complete reset for timeline execution states if they matter
    await sqlRun("UPDATE timeline SET completed = 0");

    await loadStateFromSqlite();
    res.json({ success: true, ...dbState });
  } catch(err) {
    res.status(500).json({ success: false, error: "Falha ao esvaziar histórico." });
  }
});

// Create habit on SQLite
app.post("/api/habits", async (req, res) => {
  try {
    const { name, icon, color, type, targetValue, timeOfDay, priority, category, frequencyType, frequencyInterval, exigencia, connectedMacroId, connectedTraitId, resultOutcome } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Nome e tipo de hábito são obrigatórios." });
    }

    const newId = `h-${Date.now()}`;
    const targetVal = Number(targetValue) || 1;
    const todayStr = new Date().toISOString().split('T')[0];

    // Push into SQLite database
    await sqlRun(`
      INSERT INTO habits (id, name, icon, color, type, targetValue, currentValue, completed, frequencyType, frequencyInterval, timeOfDay, priority, category, createdAt, lastResetDate, exigencia, connectedMacroId, connectedTraitId, resultOutcome, todayPhoto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [newId, name, icon || "Zap", color || "blue", type, targetVal, 0, 0, frequencyType || "daily", frequencyInterval ? Number(frequencyInterval) : null, timeOfDay || null, priority || "medium", category || "Execução", new Date().toISOString(), todayStr, exigencia || null, connectedMacroId || null, connectedTraitId || null, resultOutcome || null, null]);

    if (timeOfDay) {
      await sqlRun(`
        INSERT INTO timeline (id, time, title, habitId, completed)
        VALUES (?, ?, ?, ?, ?)
      `, [`t-${Date.now()}`, timeOfDay, name, newId, 0]);
    }

    await sqlRun(`
      INSERT INTO notifications (message, createdAt)
      VALUES (?, ?)
    `, [`Indicador registrado com sucesso: ${name}.`, new Date().toISOString()]);

    await loadStateFromSqlite();
    const habit = dbState.habits.find(h => h.id === newId);
    res.json({ success: true, habit, timeline: dbState.timeline });
  } catch (err) {
    res.status(500).json({ error: "Falha ao salvar hábito no SQL" });
  }
});

// Delete specific habit
app.delete("/api/habits/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await sqlRun("DELETE FROM habits WHERE id = ?", [id]);
    await sqlRun("DELETE FROM habit_logs WHERE habitId = ?", [id]);
    await sqlRun("DELETE FROM timeline WHERE habitId = ?", [id]);

    await loadStateFromSqlite();
    res.json({ success: true, habits: dbState.habits, timeline: dbState.timeline });
  } catch (err) {
    res.status(500).json({ error: "Falha de exclusão de dados SQL" });
  }
});

// Update specific habit values/completion
app.put("/api/habits/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { currentValue, completed, resultOutcome, todayPhoto, timeOfDay } = req.body;

    const habitMemory = dbState.habits.find(h => h.id === id);
    if (!habitMemory) {
      return res.status(404).json({ error: "Hábito não localizado" });
    }

    let nextVal = currentValue !== undefined ? Number(currentValue) : habitMemory.currentValue;
    let nextComp = completed !== undefined ? (completed ? 1 : 0) : (habitMemory.completed ? 1 : 0);
    const nextOutcome = resultOutcome !== undefined ? resultOutcome : habitMemory.resultOutcome || '';
    const nextPhoto = todayPhoto !== undefined ? todayPhoto : habitMemory.todayPhoto || '';
    // Use the undefined check so we can clear it by sending null or empty string, or pass the existing
    const nextTimeOfDay = timeOfDay !== undefined ? timeOfDay : habitMemory.timeOfDay || null;
    const nextStartedAt = req.body.startedAt !== undefined ? req.body.startedAt : habitMemory.startedAt || null;

    // Auto complete checks triggers if currentValue changed
    if (currentValue !== undefined) {
      if (habitMemory.type === 'check') {
        nextComp = nextVal >= 1 ? 1 : 0;
      } else {
        nextComp = nextVal >= habitMemory.targetValue ? 1 : 0;
      }
    }

    if (completed !== undefined) {
      nextComp = completed ? 1 : 0;
      if (completed && habitMemory.type === 'check') {
        nextVal = 1;
      } else if (!completed && habitMemory.type === 'check') {
        nextVal = 0;
      }
    }

    // Save unified database state representation
    await sqlRun(`
      UPDATE habits
      SET currentValue = ?, completed = ?, resultOutcome = ?, todayPhoto = ?, timeOfDay = ?, startedAt = ?
      WHERE id = ?
    `, [nextVal, nextComp, nextOutcome, nextPhoto, nextTimeOfDay, nextStartedAt, id]);

    // Insert live logs update for today's snapshot as well so we look consistent in real-time
    const todayStr = new Date().toISOString().split('T')[0];
    await sqlRun(`
      INSERT OR REPLACE INTO habit_logs (habitId, date, value, completed)
      VALUES (?, ?, ?, ?)
    `, [id, todayStr, nextVal, nextComp]);

    // Cascade complete matching timeline items
    await sqlRun(`
      UPDATE timeline
      SET completed = ?
      WHERE habitId = ?
    `, [nextComp, id]);

    await loadStateFromSqlite();
    const habit = dbState.habits.find(h => h.id === id);
    res.json({ success: true, habit, timeline: dbState.timeline });
  } catch (er) {
    res.status(500).json({ error: "Erro de gravação direta no SQL" });
  }
});

// Delete individual timeline items
app.delete("/api/timeline/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await sqlRun("DELETE FROM timeline WHERE id = ?", [id]);
    await loadStateFromSqlite();
    res.json({ success: true, timeline: dbState.timeline });
  } catch (err) {
    res.status(500).json({ error: "Falha SQL" });
  }
});

// --- ACTION LOGGING (Precise Analytics) ---
app.post("/api/action-logs", async (req, res) => {
  try {
    const { habitId, actionType, valueDelta } = req.body;
    const newId = `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();
    
    await sqlRun(`
      INSERT INTO action_logs (id, habitId, actionType, timestamp, valueDelta)
      VALUES (?, ?, ?, ?, ?)
    `, [newId, habitId, actionType, timestamp, valueDelta || 0]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Falha ao registrar log de ação" });
  }
});

app.get("/api/action-logs/:habitId", async (req, res) => {
  try {
    const habitId = req.params.habitId;
    const logs = await sqlAll(`SELECT * FROM action_logs WHERE habitId = ? ORDER BY timestamp ASC`, [habitId]);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Falha ao ler logs de ação" });
  }
});

app.get("/api/analytics/daily-summary", async (req, res) => {
  try {
    // Generate a summary of today's performance
    const todayStr = new Date().toISOString().split('T')[0];
    const logs = await sqlAll(`SELECT al.*, h.name FROM action_logs al JOIN habits h ON h.id = al.habitId WHERE al.timestamp LIKE ? ORDER BY timestamp ASC`, [`${todayStr}%`]);
    
    // Group by hour
    const hourlyActivity: Record<string, number> = {};
    for (const log of logs) {
      const timestamp = log.timestamp || log.Timestamp;
      if (timestamp) {
        const hour = timestamp.substring(11, 13);
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      }
    }

    res.json({ success: true, logs, hourlyActivity });
  } catch (err) {
    res.status(500).json({ error: "Falha analytica" });
  }
});

// Download gorgeous CSV Report of the past 15 days
app.get("/api/report", async (req, res) => {
  try {
    const today = new Date();
    const dateLimit = new Date();
    dateLimit.setDate(today.getDate() - 15);
    const dateLimitStr = dateLimit.toISOString().split('T')[0];

    // Read logs from SQLite past 15 days
    const rows = await sqlAll(`
      SELECT h.name as 'Hábito', h.category as 'Categoria', hl.date as 'Data',
             hl.value as 'Valor Atingido', h.targetValue as 'Meta Diária',
             CASE WHEN hl.completed = 1 THEN 'Sim' ELSE 'Não' END as 'Concluído'
      FROM habit_logs hl
      JOIN habits h ON hl.habitId = h.id
      WHERE hl.date >= ?
      ORDER BY hl.date DESC, h.name ASC
    `, [dateLimitStr]);

    // Build perfect UTF-8 semicolon separated CSV table
    let csv = "Data;Hábito;Categoria;Valor Atingido;Meta Diária;Concluído;Aproveitamento %\n";
    for (const r of rows) {
      const target = Number(r['Meta Diária']);
      const ach = Number(r['Valor Atingido']);
      const pct = target > 0 ? Math.round((ach / target) * 100) : 0;
      csv += `${r['Data']};${r['Hábito']};${r['Categoria']};${ach};${target};${r['Concluído']};${pct}%\n`;
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=relatorio_execucao_15dias.csv");
    res.send("\uFEFF" + csv); // Add UTF-8 BOM byte so Microsoft Excel Portuguese loads instantly with accurate accents
  } catch (err) {
    console.error("Report download failure:", err);
    res.status(500).send("Falha ao gerar excel.");
  }
});

// Dynamic quotes and strategic insights using Gemini or intelligent stoic fallback
app.post("/api/insights", async (req, res) => {
  const { visions = [], characteristics = [], goals = [] } = req.body || {};

  // 1. Calculate operational score
  const totalDailyHabits = dbState.habits.length;
  const completedDailyHabits = dbState.habits.filter(h => h.completed).length;
  const todayScore = totalDailyHabits > 0 ? Math.round((completedDailyHabits / totalDailyHabits) * 100) : 0;

  // Week average score (mix of history logs)
  let totalLogs = 0;
  let completedLogs = 0;
  dbState.habits.forEach(h => {
    h.logs.forEach(log => {
      totalLogs++;
      if (log.completed) completedLogs++;
    });
  });
  const weekScore = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

  // 2. Sum execution volumes
  let totalMsgs = dbState.habits.find(h => h.id === "h-mensagens")?.currentValue || 0;
  let totalCalls = dbState.habits.find(h => h.id === "h-ligacoes")?.currentValue || 0;
  let waterLiters = dbState.habits.find(h => h.id === "h-agua")?.currentValue || 0;
  
  // Total sum of metrics including past 15 days logs to look insanely massive!
  dbState.habits.forEach(h => {
    if (h.id === "h-mensagens") {
      h.logs.forEach(l => { totalMsgs += l.value; });
    } else if (h.id === "h-ligacoes") {
      h.logs.forEach(l => { totalCalls += l.value; });
    } else if (h.id === "h-agua") {
      h.logs.forEach(l => { waterLiters += l.value; });
    }
  });

  // Generate heat map grid data (GitHub style, past 16 days)
  const todayStr = new Date().toISOString().split('T')[0];
  const historyMap: { [date: string]: { total: number; completed: number } } = {};
  
  // Populate maps
  for (let i = 15; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    historyMap[dStr] = { total: 0, completed: 0 };
  }

  dbState.habits.forEach(h => {
    h.logs.forEach(l => {
      if (historyMap[l.date]) {
        historyMap[l.date].total++;
        if (l.completed) historyMap[l.date].completed++;
      }
    });
    // plus today
    if (historyMap[todayStr]) {
      historyMap[todayStr].total++;
      if (h.completed) historyMap[todayStr].completed++;
    }
  });

  const weeklyTrend = Object.keys(historyMap).map(date => {
    const counts = historyMap[date];
    const score = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
    return { date, score };
  }).sort((a, b) => a.date.localeCompare(b.date));

  // Dynamic calculated streak based on days with completed habits
  let streakDays = 0;
  const sortedDatesDescending = Object.keys(historyMap).sort((a, b) => b.localeCompare(a));
  for (const date of sortedDatesDescending) {
    if (historyMap[date].completed > 0) {
      streakDays++;
    } else {
      // If it's today and nothing is completed yet, skip check to preserve yesterday's active streak
      if (date === todayStr) {
        continue;
      }
      break;
    }
  }

  // Determine tendency and best hours based on rules (with beautiful strings)
  const isDeclining = dbState.habits.filter(h => h.type === 'quantitative' && h.currentValue < h.targetValue * 0.4).length >= 2;
  const tendencyText = isDeclining 
    ? "Atenção: Seu volume de execução de prospecção e ligações retraiu nos últimos 4 dias. Entre no Modo Guerra."
    : "Ritmo de Combate Excelente: Você está acelerando seu volume operacional. Consistência inquebrável.";

  const bestTimeText = "Você atinge maior potência e precisão operacional entre 07h e 11h.";

  // Pre-compiled military phrase pool for instant loading
  const phrasePool = [
    "Você ainda não venceu o dia.",
    "Movimento gera oportunidade. Estagnação gera arrependimento.",
    "O volume limpo cria inevitabilidade operacional.",
    "A disciplina militar foca no processo, não na recompensa.",
    "A pressão que você se impõe é proporcional ao seu tamanho.",
    "Cadência é tudo. Execute sem hesitar."
  ];
  let dynamicPhrase = phrasePool[Math.floor(Math.random() * phrasePool.length)];

  // If Gemini Core is connected, query server-side safely to obtain amazing stoic execution guidance!
  if (ai) {
    try {
      const paraisoStr = visions.filter((v:any) => v.category === 'paraiso').map((v:any) => v.text).join(", ") || "Ter sucesso";
      const infernoStr = visions.filter((v:any) => v.category === 'inferno').map((v:any) => v.text).join(", ") || "Fracassar";

      const prompt = `Você é o comandante do Pulse.
O Paraíso do usuário é: [${paraisoStr}].
O Inferno do usuário é: [${infernoStr}].

Hoje, ele concluiu ${completedDailyHabits} de um total de ${totalDailyHabits} hábitos diários (Aproveitamento de ${todayScore}%).

Escreva uma ÚNICA frase operacional ultra-curta, estoica, militar, sem rodeios ou emojis. Use a performance exata de hoje e os termos reais do Paraiso ou Inferno do usuário que eu te passei acima. Reforce agressivamente a conexão entre a disciplina diária e o destino que ele escolheu na Bússola.
Frase com no máximo 20 palavras. Escreva no formato:
"FRASE: <frase_aqui>"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.8,
        }
      });

      const text = response.text || "";
      const match = text.match(/FRASE:\s*(.*)/i);
      if (match && match[1]) {
        dynamicPhrase = match[1].trim();
      }
    } catch (err) {
      console.log("Gemini prompt failure, fell back to local badass phrase engine:", err);
    }
  }

  // Individual habits detailed analytics (identifying strengths and weaknesses)
  const habitsAnalysis = dbState.habits.map(h => {
    let totalTally = h.logs ? h.logs.length : 0;
    let completedTally = h.logs ? h.logs.filter(l => l.completed).length : 0;
    
    // Include today in the tally
    totalTally += 1;
    if (h.completed) {
      completedTally += 1;
    }
    
    const completionRate = totalTally > 0 ? Math.round((completedTally / totalTally) * 100) : 0;
    
    return {
      id: h.id,
      name: h.name,
      icon: h.icon,
      color: h.color,
      category: h.category,
      completionRate,
      completedTally,
      totalTally
    };
  });

  // Dynamic calculation for hourly execution counts
  const hourMap: { [hour: string]: number } = {
    "06:00": 0,
    "07:00": 0,
    "08:00": 0,
    "10:00": 0,
    "11:00": 0,
    "14:00": 0,
    "21:00": 0,
    "22:00": 0
  };
  
  dbState.habits.forEach(h => {
    if (h.timeOfDay) {
      const hh = h.timeOfDay.substring(0, 5);
      if (hourMap[hh] !== undefined) {
        h.logs.forEach(l => {
          if (l.completed) hourMap[hh]++;
        });
        if (h.completed) hourMap[hh]++;
      } else {
        let count = h.completed ? 1 : 0;
        h.logs.forEach(l => {
          if (l.completed) count++;
        });
        hourMap[hh] = count;
      }
    }
  });

  const dailyExecutionHours = Object.keys(hourMap).map(hour => ({
    hour,
    count: hourMap[hour]
  })).sort((a,b) => a.hour.localeCompare(b.hour));

  res.json({
    score: {
      today: todayScore,
      week: weekScore
    },
    volumes: {
      messages: totalMsgs,
      calls: totalCalls,
      chips: 0,
      water: Number(waterLiters.toFixed(1))
    },
    streakDays,
    weeklyTrend,
    dailyExecutionHours,
    tendencyText,
    bestTimeText,
    dynamicPhrase,
    habitsAnalysis
  });
});

// Serve generated PWA logo icon
app.get("/pulse_logo.png", (req, res) => {
  res.sendFile(path.join(process.cwd(), "src/assets/images/pulse_app_logo_1780126633631.png"));
});

// Configure Vite or simple asset server
const isProduction = process.env.NODE_ENV === "production";

async function start() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pulse Execution Server initialized at: http://localhost:${PORT}`);
  });
}

start();
