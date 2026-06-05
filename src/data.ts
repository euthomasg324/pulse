import { 
  MessageSquare, 
  PhoneCall, 
  Droplets, 
  Moon, 
  Sun, 
  Cpu, 
  Zap, 
  TrendingUp, 
  Dumbbell, 
  BookOpen, 
  Activity, 
  Award, 
  Clock, 
  ShieldAlert, 
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";

// Lucide icon mapping to safely render icons from database config
export const iconMap: { [key: string]: any } = {
  MessageSquare,
  PhoneCall,
  Droplets,
  Moon,
  Sun,
  Cpu,
  Zap,
  TrendingUp,
  Dumbbell,
  BookOpen,
  Activity,
  Award,
  Clock,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles
};

// Premium colors for our military Apple-like design system
export const colorPresets = {
  blue: {
    bg: "rgba(59, 130, 246, 0.1)",
    border: "rgba(59, 130, 246, 0.2)",
    text: "text-blue-400",
    fill: "bg-blue-500",
    glow: "shadow-blue-500/20",
    hex: "#3b82f6"
  },
  green: {
    bg: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.2)",
    text: "text-green-400",
    fill: "bg-green-500",
    glow: "shadow-green-500/20",
    hex: "#10b981"
  },
  orange: {
    bg: "rgba(249, 115, 22, 0.1)",
    border: "rgba(249, 115, 22, 0.2)",
    text: "text-orange-400",
    fill: "bg-orange-500",
    glow: "shadow-orange-500/20",
    hex: "#f97316"
  },
  purple: {
    bg: "rgba(139, 92, 246, 0.1)",
    border: "rgba(139, 92, 246, 0.2)",
    text: "text-purple-400",
    fill: "bg-purple-500",
    glow: "shadow-purple-500/20",
    hex: "#8b5cf6"
  },
  red: {
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.2)",
    text: "text-red-400",
    fill: "bg-red-500",
    glow: "shadow-red-500/20",
    hex: "#ef4444"
  }
};

// Tactical quotes pool used when server hasn't finished loading or process.env.GEMINI_API_KEY lacks.
export const militaryQuotes = [
  "O dia ainda não foi vencido. Discipline-se.",
  "Volume operacional gera inevitabilidade comercial.",
  "Cadência de combate: execute no silêncio e sem rodeios.",
  "A consistência não liga para o seu humor hoje.",
  "Você está reduzindo o volume operacional? Retome o controle.",
  "A disciplina é a defesa suprema contra o cansaço mental.",
  "A energia de hoje constrói o império de amanhã.",
  "Movimento gera oportunidade física.",
  "Não existem hacks. Existe apenas volume intencional de alta potência.",
  "Zere o ego, controle a sua execução no nível sniper.",
  "O fracasso é garantido para quem hesita em silêncio."
];
