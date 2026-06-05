export type HabitType = 'check' | 'quantitative' | 'frequency' | 'timed' | 'accumulative';

export interface HabitLog {
  date: string; // YYYY-MM-DD
  value: number;
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  icon: string; // Lucide icon identifier
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  type: HabitType;
  targetValue: number; // For quantitative (e.g., 300, 50, 3), timed (e.g., minutes: 120), accumulative (e.g., targets)
  currentValue: number; // Progress state
  completed: boolean;
  frequencyType: 'daily' | 'weekly' | 'monthly' | 'every-x-days';
  frequencyInterval?: number; // e.g., every 3 days
  timeOfDay?: string; // e.g. "06:00", used for automatic timeline mapping
  priority: 'high' | 'medium' | 'low';
  category: 'Execução' | 'Ritmo' | 'Energia' | 'Resultado';
  createdAt: string;
  logs: HabitLog[];
  lastResetDate?: string; // to track when it was last reset (e.g. daily reset)
  
  // Explicit Connections
  exigencia?: 'Leve' | 'Moderado' | 'Alto' | 'Extremo';
  connectedMacroId?: string; // Links to TargetGoal.id
  connectedTraitId?: string; // Links to IdentityCharacteristic.id
  // Outcomes tracking
  resultOutcome?: string; // Users daily typed outcome note for this habit
  todayPhoto?: string; // User's daily uploaded photo
}

export interface TimelineItem {
  id: string;
  time: string; // HH:MM
  title: string;
  habitId?: string; // associated habit, if any
  completed: boolean;
}

export interface OperationalScore {
  today: number; // percentage (0-100)
  week: number;  // percentage (0-100)
}

export interface MetricsReport {
  score: OperationalScore;
  volumes: {
    messages: number;
    calls: number;
    chips: number;
    water: number;
  };
  streakDays: number;
  weeklyTrend: { date: string; score: number }[]; // for github-style consistency visualizer or trends
  dailyExecutionHours: { hour: string; count: number }[]; // hours when operations are completed
  tendencyText: string; // e.g. "Você está reduzindo volume há 4 dias."
  bestTimeText: string; // e.g. "Você executa melhor entre 07h e 11h."
}

export interface SecurityStatus {
  online: boolean;
  modeGuerra: boolean;
}

export interface ServerState {
  habits: Habit[];
  timeline: TimelineItem[];
  notifications: string[];
}
