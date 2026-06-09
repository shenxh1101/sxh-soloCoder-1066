import type { Member, DailyRecord, BodyRecord, ExamRecord, Reminder, WeeklyReport, HealthTarget } from '@/types/health';
import dayjs from 'dayjs';

export const mockMembers: Member[] = [
  {
    id: '1',
    name: '我',
    avatar: '',
    relation: '本人',
    gender: 'male',
    age: 35,
    height: 175,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    name: '爸爸',
    avatar: '',
    relation: '父亲',
    gender: 'male',
    age: 60,
    height: 172,
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: '3',
    name: '妈妈',
    avatar: '',
    relation: '母亲',
    gender: 'female',
    age: 57,
    height: 160,
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];

export const mockDefaultTarget: HealthTarget = {
  steps: 8000,
  exerciseMinutes: 60,
  waterCups: 8,
  sleepHours: 8,
  weight: 65,
  waistLine: 80
};

const generateDailyRecords = (memberId: string, days: number): DailyRecord[] => {
  const records: DailyRecord[] = [];
  const today = dayjs();

  for (let i = 0; i < days; i++) {
    const date = today.subtract(i, 'day').format('YYYY-MM-DD');
    const sleepStart = '23:00';
    const sleepEnd = '07:00';

    records.push({
      date,
      memberId,
      steps: Math.floor(Math.random() * 5000) + 5000,
      exerciseMinutes: Math.floor(Math.random() * 60) + 20,
      exerciseType: ['跑步', '快走', '瑜伽', '骑行'][Math.floor(Math.random() * 4)],
      waterCups: Math.floor(Math.random() * 4) + 5,
      sleepStartTime: sleepStart,
      sleepEndTime: sleepEnd,
      sleepHours: 8,
      weight: Number((65 + Math.random() * 2 - 1).toFixed(1)),
      waistLine: Math.floor(Math.random() * 6) + 78,
      checkInItems: ['water', 'steps', 'sleep'].slice(0, Math.floor(Math.random() * 3) + 1),
      notes: ''
    });
  }

  return records;
};

export const mockDailyRecords: DailyRecord[] = [
  ...generateDailyRecords('1', 30),
  ...generateDailyRecords('2', 30),
  ...generateDailyRecords('3', 30)
];

export const mockBodyRecords: BodyRecord[] = [
  {
    id: '1',
    date: dayjs().format('YYYY-MM-DD'),
    memberId: '1',
    weight: 65.5,
    waistLine: 80,
    heartRate: 72,
    bloodPressure: '120/80',
    bloodSugar: 5.2,
    bmi: 21.4,
    isAbnormal: false,
    abnormalItems: [],
    notes: '感觉良好'
  },
  {
    id: '2',
    date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    memberId: '1',
    weight: 65.2,
    waistLine: 79,
    heartRate: 75,
    bloodPressure: '118/78',
    isAbnormal: false,
    abnormalItems: [],
    notes: ''
  },
  {
    id: '3',
    date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
    memberId: '1',
    weight: 67.5,
    waistLine: 82,
    heartRate: 85,
    bloodPressure: '135/90',
    isAbnormal: true,
    abnormalItems: ['血压偏高', '体重波动大'],
    notes: '近期聚会较多，饮食不规律'
  }
];

export const mockExamRecords: ExamRecord[] = [
  {
    id: '1',
    date: '2026-05-15',
    memberId: '1',
    hospital: '市第一人民医院',
    items: [
      { name: '血常规', value: '正常', normalRange: '-', isAbnormal: false },
      { name: '肝功能', value: '正常', normalRange: '-', isAbnormal: false },
      { name: '肾功能', value: '正常', normalRange: '-', isAbnormal: false },
      { name: '血糖', value: '5.6', normalRange: '3.9-6.1', isAbnormal: false },
      { name: '血脂', value: '偏高', normalRange: '-', isAbnormal: true },
      { name: '心电图', value: '正常', normalRange: '-', isAbnormal: false }
    ],
    notes: '血脂偏高，建议清淡饮食，增加运动'
  },
  {
    id: '2',
    date: '2025-11-20',
    memberId: '2',
    hospital: '中心医院',
    items: [
      { name: '血压', value: '145/95', normalRange: '90-140/60-90', isAbnormal: true },
      { name: '血糖', value: '7.2', normalRange: '3.9-6.1', isAbnormal: true },
      { name: '心电图', value: '正常', normalRange: '-', isAbnormal: false }
    ],
    notes: '高血压、糖尿病，定期服药'
  }
];

export const mockReminders: Reminder[] = [
  {
    id: '1',
    memberId: '1',
    type: 'water',
    title: '喝水提醒',
    time: '09:00',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    notes: '每小时喝一杯水'
  },
  {
    id: '2',
    memberId: '1',
    type: 'exercise',
    title: '运动提醒',
    time: '18:30',
    repeatDays: [1, 3, 5],
    enabled: true,
    notes: '跑步30分钟'
  },
  {
    id: '3',
    memberId: '1',
    type: 'sleep',
    title: '睡眠提醒',
    time: '22:30',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    notes: '准备入睡'
  },
  {
    id: '4',
    memberId: '2',
    type: 'medicine',
    title: '降压药',
    time: '08:00',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    notes: '饭后服用'
  },
  {
    id: '5',
    memberId: '2',
    type: 'medicine',
    title: '降糖药',
    time: '12:00',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    notes: '饭前服用'
  },
  {
    id: '6',
    memberId: '1',
    type: 'exam',
    title: '年度体检',
    time: '08:00',
    repeatDays: [],
    enabled: true,
    notes: '空腹体检'
  }
];

export const mockWeeklyReport: WeeklyReport = {
  weekStart: dayjs().startOf('week').format('YYYY-MM-DD'),
  weekEnd: dayjs().endOf('week').format('YYYY-MM-DD'),
  memberId: '1',
  avgSteps: 7850,
  totalExerciseMinutes: 240,
  avgWaterCups: 6.5,
  avgSleepHours: 7.2,
  weightTrend: 'stable',
  checkInRate: 85,
  suggestions: [
    '本周运动表现良好，继续保持',
    '饮水量略低于目标，建议每天增加1-2杯水',
    '睡眠时长基本达标，可以适当提前入睡时间'
  ],
  achievements: [
    '连续打卡7天',
    '本周3天运动时长超过60分钟',
    '体重保持稳定'
  ]
};

export const mockWeeklyReports: WeeklyReport[] = [
  mockWeeklyReport,
  {
    ...mockWeeklyReport,
    weekStart: dayjs().subtract(1, 'week').startOf('week').format('YYYY-MM-DD'),
    weekEnd: dayjs().subtract(1, 'week').endOf('week').format('YYYY-MM-DD'),
    avgSteps: 7200,
    totalExerciseMinutes: 180,
    avgWaterCups: 5.8,
    avgSleepHours: 6.8,
    weightTrend: 'down',
    checkInRate: 75,
    suggestions: [
      '增加饮水量',
      '保证充足睡眠'
    ],
    achievements: [
      '连续打卡5天'
    ]
  },
  {
    ...mockWeeklyReport,
    weekStart: dayjs().subtract(2, 'week').startOf('week').format('YYYY-MM-DD'),
    weekEnd: dayjs().subtract(2, 'week').endOf('week').format('YYYY-MM-DD'),
    avgSteps: 8500,
    totalExerciseMinutes: 300,
    avgWaterCups: 7.5,
    avgSleepHours: 7.5,
    weightTrend: 'stable',
    checkInRate: 92,
    suggestions: [
      '保持良好的健康习惯'
    ],
    achievements: [
      '连续打卡7天',
      '所有指标均达标'
    ]
  }
];

export const exerciseTypes = [
  { id: 'running', name: '跑步', icon: '🏃' },
  { id: 'walking', name: '快走', icon: '🚶' },
  { id: 'cycling', name: '骑行', icon: '🚴' },
  { id: 'swimming', name: '游泳', icon: '🏊' },
  { id: 'yoga', name: '瑜伽', icon: '🧘' },
  { id: 'gym', name: '健身', icon: '🏋️' },
  { id: 'basketball', name: '篮球', icon: '🏀' },
  { id: 'badminton', name: '羽毛球', icon: '🏸' }
];
