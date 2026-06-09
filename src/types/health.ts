export interface Member {
  id: string;
  name: string;
  avatar: string;
  relation: string;
  gender: 'male' | 'female';
  age: number;
  height: number;
  createdAt: string;
}

export interface HealthTarget {
  steps: number;
  exerciseMinutes: number;
  waterCups: number;
  sleepHours: number;
  weight: number;
  waistLine: number;
}

export interface DailyRecord {
  date: string;
  memberId: string;
  steps: number;
  exerciseMinutes: number;
  exerciseType: string;
  waterCups: number;
  sleepStartTime: string;
  sleepEndTime: string;
  sleepHours: number;
  weight: number;
  waistLine: number;
  checkInItems: string[];
  notes: string;
}

export interface BodyRecord {
  id: string;
  date: string;
  memberId: string;
  weight: number;
  waistLine: number;
  heartRate?: number;
  bloodPressure?: string;
  bloodSugar?: number;
  bmi?: number;
  isAbnormal: boolean;
  abnormalItems: string[];
  notes: string;
}

export interface ExamRecord {
  id: string;
  date: string;
  memberId: string;
  hospital: string;
  items: ExamItem[];
  notes: string;
}

export interface ExamItem {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  status: 'normal' | 'high' | 'low';
  isAbnormal: boolean;
}

export interface Reminder {
  id: string;
  memberId: string;
  type: 'medicine' | 'water' | 'exercise' | 'sleep' | 'exam';
  title: string;
  medicineName?: string;
  time: string;
  repeatDays: number[];
  enabled: boolean;
  notes: string;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  memberId: string;
  avgSteps: number;
  totalExerciseMinutes: number;
  avgWaterCups: number;
  avgSleepHours: number;
  weightTrend: 'up' | 'down' | 'stable';
  checkInRate: number;
  suggestions: string[];
  achievements: string[];
}

export interface CheckInStreak {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  thisMonthDays: number;
}

export interface HistoryQuery {
  startDate: string;
  endDate: string;
  memberId: string;
  dataType: 'all' | 'steps' | 'exercise' | 'water' | 'sleep' | 'weight';
}

export type RecordType = 'steps' | 'exercise' | 'water' | 'sleep' | 'weight' | 'waistLine' | 'exam';
