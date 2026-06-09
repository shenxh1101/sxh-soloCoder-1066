import dayjs from 'dayjs';

export const calculateBMI = (weight: number, height: number): number => {
  if (!weight || !height) return 0;
  const heightInM = height / 100;
  return Number((weight / (heightInM * heightInM)).toFixed(1));
};

export const getBMIStatus = (bmi: number): { label: string; level: 'underweight' | 'normal' | 'overweight' | 'obese'; color: string } => {
  if (bmi < 18.5) return { label: '偏瘦', level: 'underweight', color: '#3b82f6' };
  if (bmi < 24) return { label: '正常', level: 'normal', color: '#22c55e' };
  if (bmi < 28) return { label: '偏胖', level: 'overweight', color: '#f59e0b' };
  return { label: '肥胖', level: 'obese', color: '#ef4444' };
};

export const calculateSleepHours = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;

  const parseTime = (timeStr: string): dayjs.Dayjs => {
    if (timeStr.includes(' ')) {
      return dayjs(timeStr);
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    return dayjs().hour(hours).minute(minutes).second(0);
  };

  const start = parseTime(startTime);
  const end = parseTime(endTime);
  let hours = end.diff(start, 'minute') / 60;
  if (hours < 0) hours += 24;
  return Number(hours.toFixed(1));
};

export const getSleepStatus = (hours: number): { status: string; color: string } => {
  if (hours < 6) return { status: '不足', color: '#ef4444' };
  if (hours < 7) return { status: '偏少', color: '#f59e0b' };
  if (hours <= 9) return { status: '充足', color: '#22c55e' };
  return { status: '过多', color: '#f59e0b' };
};

export const getWaterStatus = (cups: number, target: number): { status: string; color: string } => {
  const percent = cups / target;
  if (percent < 0.5) return { status: '偏少', color: '#ef4444' };
  if (percent < 0.8) return { status: '一般', color: '#f59e0b' };
  return { status: '达标', color: '#22c55e' };
};

export const getStepsStatus = (steps: number, target: number): { status: string; color: string } => {
  const percent = steps / target;
  if (percent < 0.5) return { status: '偏少', color: '#ef4444' };
  if (percent < 0.8) return { status: '一般', color: '#f59e0b' };
  return { status: '达标', color: '#22c55e' };
};

export const calculateStreak = (recordsOrDates: any[]): { current: number; longest: number; totalDays: number } => {
  if (!recordsOrDates || recordsOrDates.length === 0) {
    return { current: 0, longest: 0, totalDays: 0 };
  }

  const dates = recordsOrDates.map((item) => {
    if (typeof item === 'string') return item;
    if (item && item.date) {
      const checkInItems = item.checkInItems || [];
      if (checkInItems.length > 0) {
        return item.date;
      }
    }
    return null;
  }).filter(Boolean) as string[];

  if (dates.length === 0) {
    return { current: 0, longest: 0, totalDays: 0 };
  }

  const uniqueDates = [...new Set(dates)].sort();
  const totalDays = uniqueDates.length;

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: dayjs.Dayjs | null = null;

  for (let i = 0; i < uniqueDates.length; i++) {
    const date = dayjs(uniqueDates[i]);
    if (prevDate === null) {
      tempStreak = 1;
    } else {
      const diffDays = date.diff(prevDate, 'day');
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = date;
  }

  const lastDate = dayjs(uniqueDates[uniqueDates.length - 1]);
  const today = dayjs().startOf('day');
  const daysSinceLast = today.diff(lastDate, 'day');

  if (daysSinceLast <= 1) {
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  return {
    current: currentStreak,
    longest: longestStreak,
    totalDays: totalDays
  };
};

export const calculateCompletionRate = (records: any[], days: number = 30): number => {
  if (!records.length) return 0;
  const recentRecords = records.slice(0, days);
  const completedDays = recentRecords.filter((r) => {
    const checkInItems = r.checkInItems || [];
    return checkInItems.length >= 2;
  }).length;
  return Math.round((completedDays / Math.min(records.length, days)) * 100);
};

export const checkWeightAbnormal = (
  currentWeight: number,
  previousWeight: number,
  threshold: number = 2
): boolean => {
  if (!currentWeight || !previousWeight) return false;
  return Math.abs(currentWeight - previousWeight) >= threshold;
};

export const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up':
      return '#ef4444';
    case 'down':
      return '#22c55e';
    default:
      return '#86909c';
  }
};

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const getWeekDates = (): { start: string; end: string } => {
  const start = dayjs().startOf('week').format('YYYY-MM-DD');
  const end = dayjs().endOf('week').format('YYYY-MM-DD');
  return { start, end };
};

export const getDaysInRange = (start: string, end: string): string[] => {
  const days: string[] = [];
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  let current = startDate;

  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    days.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }

  return days;
};

export const generateHealthSuggestions = (data: {
  steps: number;
  exerciseMinutes: number;
  waterCups: number;
  sleepHours: number;
  weightChange: number;
}): string[] => {
  const suggestions: string[] = [];

  if (data.steps < 6000) {
    suggestions.push('今日步数较少，建议饭后散步30分钟');
  }
  if (data.exerciseMinutes < 30) {
    suggestions.push('本周运动时长不足，建议增加有氧运动');
  }
  if (data.waterCups < 6) {
    suggestions.push('饮水量偏少，请记得每天喝够8杯水');
  }
  if (data.sleepHours < 7) {
    suggestions.push('睡眠不足，建议23点前入睡，保证7-8小时睡眠');
  }
  if (data.weightChange > 1) {
    suggestions.push('体重上升较快，请注意控制饮食');
  } else if (data.weightChange < -1) {
    suggestions.push('体重下降较快，建议关注身体健康');
  }
  if (suggestions.length === 0) {
    suggestions.push('各项指标正常，继续保持健康的生活方式！');
  }

  return suggestions;
};
