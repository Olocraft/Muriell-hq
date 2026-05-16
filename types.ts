
export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  rageMeter: number; // 0 to 100
  shamePoints: number;
  disciplineScore: number;
  consistencyScore: number; // 0 to 100
  performanceAudit?: string;
  roastIntensity: 'Mild' | 'Standard' | 'Aggressive';
  photoURL?: string;
  readingHistory?: { title: string, timestamp: string }[];
  consistencyHistory?: { date: string, score: number }[];
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'focus' | 'habit' | 'discipline';
  status: 'pending' | 'completed' | 'overdue' | 'missed';
  stakeAmount?: number;
  deadline: string; // ISO string with date and time
  outcome: string;
  alarmTriggered?: boolean;
  deadlinePassedTriggered?: boolean;
}

export interface Habit {
  id: string;
  title: string;
  completed: boolean;
  streak: number;
  lastCompleted?: string; // ISO date
  frequency?: 'daily' | 'weekly';
  time?: string; // HH:mm format for daily routines
  alarmTriggered?: boolean;
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

export interface ProTutorStep {
  title: string;
  description: string;
}

export interface ProTutorSession {
  topic: string;
  scheme: ProTutorStep[];
  currentStepIndex: number;
  status: 'planning' | 'teaching' | 'testing' | 'completed';
}
