import { create } from 'zustand';
import type { Member, DailyRecord, BodyRecord, ExamRecord, Reminder, WeeklyReport, HealthTarget } from '@/types/health';
import {
  mockMembers,
  mockDefaultTarget,
  mockDailyRecords,
  mockBodyRecords,
  mockExamRecords,
  mockReminders,
  mockWeeklyReports
} from '@/data/mockData';
import { calculateStreak, calculateBMI } from '@/utils/healthUtils';

interface HealthState {
  currentMemberId: string;
  members: Member[];
  targets: Record<string, HealthTarget>;
  dailyRecords: DailyRecord[];
  bodyRecords: BodyRecord[];
  examRecords: ExamRecord[];
  reminders: Reminder[];
  weeklyReports: WeeklyReport[];

  setCurrentMember: (memberId: string) => void;
  addMember: (member: Member) => void;
  updateMember: (member: Member) => void;
  removeMember: (memberId: string) => void;

  getCurrentMember: () => Member | undefined;
  getTarget: (memberId: string) => HealthTarget;
  setTarget: (memberId: string, target: Partial<HealthTarget>) => void;

  getTodayRecord: (memberId: string) => DailyRecord | undefined;
  getDailyRecords: (memberId: string, startDate?: string, endDate?: string) => DailyRecord[];
  addDailyRecord: (record: DailyRecord) => void;
  updateDailyRecord: (date: string, memberId: string, updates: Partial<DailyRecord>) => void;
  checkIn: (date: string, memberId: string, item: string) => void;
  addWaterCup: (date: string, memberId: string) => void;

  getBodyRecords: (memberId: string) => BodyRecord[];
  addBodyRecord: (record: BodyRecord) => void;
  getLatestBodyRecord: (memberId: string) => BodyRecord | undefined;

  getExamRecords: (memberId: string) => ExamRecord[];
  addExamRecord: (record: ExamRecord) => void;

  getReminders: (memberId: string) => Reminder[];
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;

  getWeeklyReports: (memberId: string) => WeeklyReport[];
  getCheckInStreak: (memberId: string) => { current: number; longest: number; totalDays: number };
  getAbnormalRecords: (memberId: string) => BodyRecord[];

  getMember: (memberId: string) => Member | undefined;
  getDailyRecordsByMember: (memberId: string) => DailyRecord[];
  getBodyRecordsByMember: (memberId: string) => BodyRecord[];
  getExamRecordsByMember: (memberId: string) => ExamRecord[];
  getDailyRecordByDate: (date: string, memberId: string) => DailyRecord | undefined;
  deleteMember: (memberId: string) => void;
}

export const useHealthStore = create<HealthState>((set, get) => ({
  currentMemberId: '1',
  members: mockMembers,
  targets: {
    '1': { ...mockDefaultTarget },
    '2': { ...mockDefaultTarget, weight: 70, waistLine: 85 },
    '3': { ...mockDefaultTarget, weight: 55, waistLine: 70, steps: 6000 }
  },
  dailyRecords: mockDailyRecords,
  bodyRecords: mockBodyRecords,
  examRecords: mockExamRecords,
  reminders: mockReminders,
  weeklyReports: mockWeeklyReports,

  setCurrentMember: (memberId: string) => set({ currentMemberId: memberId }),

  addMember: (member: Member) =>
    set((state) => ({
      members: [...state.members, member],
      targets: { ...state.targets, [member.id]: { ...mockDefaultTarget } }
    })),

  updateMember: (member: Member) =>
    set((state) => ({
      members: state.members.map((m) => (m.id === member.id ? member : m))
    })),

  removeMember: (memberId: string) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== memberId),
      currentMemberId: state.currentMemberId === memberId ? state.members[0]?.id || '' : state.currentMemberId
    })),

  getCurrentMember: () => {
    const state = get();
    return state.members.find((m) => m.id === state.currentMemberId);
  },

  getTarget: (memberId: string) => {
    const state = get();
    return state.targets[memberId] || { ...mockDefaultTarget };
  },

  setTarget: (memberId: string, target: Partial<HealthTarget>) =>
    set((state) => ({
      targets: {
        ...state.targets,
        [memberId]: { ...state.targets[memberId], ...target }
      }
    })),

  getTodayRecord: (memberId: string) => {
    const state = get();
    const today = new Date().toISOString().split('T')[0];
    return state.dailyRecords.find((r) => r.date === today && r.memberId === memberId);
  },

  getDailyRecords: (memberId: string, startDate?: string, endDate?: string) => {
    const state = get();
    let records = state.dailyRecords.filter((r) => r.memberId === memberId);
    if (startDate) records = records.filter((r) => r.date >= startDate);
    if (endDate) records = records.filter((r) => r.date <= endDate);
    return records.sort((a, b) => b.date.localeCompare(a.date));
  },

  addDailyRecord: (record: DailyRecord) =>
    set((state) => ({
      dailyRecords: [...state.dailyRecords, record]
    })),

  updateDailyRecord: (date: string, memberId: string, updates: Partial<DailyRecord>) =>
    set((state) => {
      const existing = state.dailyRecords.find((r) => r.date === date && r.memberId === memberId);
      if (existing) {
        return {
          dailyRecords: state.dailyRecords.map((r) =>
            r.date === date && r.memberId === memberId ? { ...r, ...updates } : r
          )
        };
      } else {
        const newRecord: DailyRecord = {
          date,
          memberId,
          steps: 0,
          exerciseMinutes: 0,
          exerciseType: '',
          waterCups: 0,
          sleepStartTime: '',
          sleepEndTime: '',
          sleepHours: 0,
          weight: 0,
          waistLine: 0,
          checkInItems: [],
          notes: '',
          ...updates
        };
        return { dailyRecords: [...state.dailyRecords, newRecord] };
      }
    }),

  checkIn: (date: string, memberId: string, item: string) =>
    set((state) => {
      const existing = state.dailyRecords.find((r) => r.date === date && r.memberId === memberId);
      if (existing) {
        const newCheckInItems = existing.checkInItems.includes(item)
          ? existing.checkInItems
          : [...existing.checkInItems, item];
        return {
          dailyRecords: state.dailyRecords.map((r) =>
            r.date === date && r.memberId === memberId ? { ...r, checkInItems: newCheckInItems } : r
          )
        };
      } else {
        const newRecord: DailyRecord = {
          date,
          memberId,
          steps: 0,
          exerciseMinutes: 0,
          exerciseType: '',
          waterCups: 0,
          sleepStartTime: '',
          sleepEndTime: '',
          sleepHours: 0,
          weight: 0,
          waistLine: 0,
          checkInItems: [item],
          notes: ''
        };
        return { dailyRecords: [...state.dailyRecords, newRecord] };
      }
    }),

  addWaterCup: (date: string, memberId: string) =>
    set((state) => {
      const existing = state.dailyRecords.find((r) => r.date === date && r.memberId === memberId);
      if (existing) {
        return {
          dailyRecords: state.dailyRecords.map((r) =>
            r.date === date && r.memberId === memberId
              ? { ...r, waterCups: r.waterCups + 1, checkInItems: [...new Set([...r.checkInItems, 'water'])] }
              : r
          )
        };
      } else {
        const newRecord: DailyRecord = {
          date,
          memberId,
          steps: 0,
          exerciseMinutes: 0,
          exerciseType: '',
          waterCups: 1,
          sleepStartTime: '',
          sleepEndTime: '',
          sleepHours: 0,
          weight: 0,
          waistLine: 0,
          checkInItems: ['water'],
          notes: ''
        };
        return { dailyRecords: [...state.dailyRecords, newRecord] };
      }
    }),

  getBodyRecords: (memberId: string) => {
    const state = get();
    return state.bodyRecords
      .filter((r) => r.memberId === memberId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  addBodyRecord: (record: BodyRecord) =>
    set((state) => {
      const member = state.members.find((m) => m.id === record.memberId);
      const bmi = member ? calculateBMI(record.weight, member.height) : undefined;
      return {
        bodyRecords: [...state.bodyRecords, { ...record, bmi }]
      };
    }),

  getLatestBodyRecord: (memberId: string) => {
    const state = get();
    return state.bodyRecords
      .filter((r) => r.memberId === memberId)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  },

  getExamRecords: (memberId: string) => {
    const state = get();
    return state.examRecords
      .filter((r) => r.memberId === memberId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  addExamRecord: (record: ExamRecord) =>
    set((state) => ({
      examRecords: [...state.examRecords, record]
    })),

  getReminders: (memberId: string) => {
    const state = get();
    return state.reminders.filter((r) => r.memberId === memberId);
  },

  addReminder: (reminder: Reminder) =>
    set((state) => ({
      reminders: [...state.reminders, reminder]
    })),

  updateReminder: (id: string, updates: Partial<Reminder>) =>
    set((state) => ({
      reminders: state.reminders.map((r) => (r.id === id ? { ...r, ...updates } : r))
    })),

  toggleReminder: (id: string) =>
    set((state) => ({
      reminders: state.reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    })),

  deleteReminder: (id: string) =>
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id)
    })),

  getWeeklyReports: (memberId: string) => {
    const state = get();
    return state.weeklyReports
      .filter((r) => r.memberId === memberId)
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  },

  getCheckInStreak: (memberId: string) => {
    const state = get();
    const records = state.dailyRecords
      .filter((r) => r.memberId === memberId && r.checkInItems.length > 0)
      .map((r) => r.date);
    const current = calculateStreak(records);
    return {
      current,
      longest: Math.max(current, 7),
      totalDays: records.length
    };
  },

  getAbnormalRecords: (memberId: string) => {
    const state = get();
    return state.bodyRecords
      .filter((r) => r.memberId === memberId && r.isAbnormal)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  getMember: (memberId: string) => {
    const state = get();
    return state.members.find((m) => m.id === memberId);
  },

  getDailyRecordsByMember: (memberId: string) => {
    const state = get();
    return state.dailyRecords
      .filter((r) => r.memberId === memberId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  getBodyRecordsByMember: (memberId: string) => {
    const state = get();
    return state.bodyRecords
      .filter((r) => r.memberId === memberId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  getExamRecordsByMember: (memberId: string) => {
    const state = get();
    return state.examRecords
      .filter((r) => r.memberId === memberId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  getDailyRecordByDate: (date: string, memberId: string) => {
    const state = get();
    return state.dailyRecords.find((r) => r.date === date && r.memberId === memberId);
  },

  deleteMember: (memberId: string) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== memberId),
      currentMemberId: state.currentMemberId === memberId ? state.members[0]?.id || '' : state.currentMemberId,
      dailyRecords: state.dailyRecords.filter((r) => r.memberId !== memberId),
      bodyRecords: state.bodyRecords.filter((r) => r.memberId !== memberId),
      examRecords: state.examRecords.filter((r) => r.memberId !== memberId)
    }))
}));
