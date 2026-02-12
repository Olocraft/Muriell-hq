
export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  rageMeter: number; // 0 to 100
  shamePoints: number;
  disciplineScore: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'focus' | 'habit' | 'discipline';
  status: 'pending' | 'completed' | 'overdue' | 'missed';
  stakeAmount?: number;
  // Fixed: Updated to string to support ISO format used in persistence and Gemini calls
  deadline: string;
  outcome: string;
}

export interface Habit {
  id: string;
  title: string;
  completed: boolean;
  streak: number;
  lastCompleted?: string; // ISO date
}

export interface HabitSection {
  id: string;
  title: string;
  icon: string;
  habits: Habit[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export enum MuriellMood {
  CALM = 'calm',
  SARCASTIC = 'sarcastic',
  ANNOYED = 'annoyed',
  DISAPPOINTED = 'disappointed',
  RAGE = 'rage',
  PROUD = 'proud'
}

export interface DomainUsage {
  domain: string;
  minutes: number;
  category: 'productive' | 'wasted' | 'neutral' | 'nsfw';
}

export interface InternetReport {
  usage: DomainUsage[];
  totalProductive: number;
  totalWasted: number;
  aiRoast: string;
}

export interface GuardianSettings {
  email: string;
  active: boolean;
}