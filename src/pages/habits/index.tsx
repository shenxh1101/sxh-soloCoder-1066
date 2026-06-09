import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import MemberSelector from '@/components/MemberSelector';
import CheckInItem from '@/components/CheckInItem';
import { useHealthStore } from '@/store/useHealthStore';
import { exerciseTypes } from '@/data/mockData';

const HabitsPage: React.FC = () => {
  const currentMemberId = useHealthStore((state) => state.currentMemberId);
  const getTarget = useHealthStore((state) => state.getTarget);
  const getTodayRecord = useHealthStore((state) => state.getTodayRecord);
  const getDailyRecords = useHealthStore((state) => state.getDailyRecords);
  const getCheckInStreak = useHealthStore((state) => state.getCheckInStreak);
  const checkIn = useHealthStore((state) => state.checkIn);
  const addWaterCup = useHealthStore((state) => state.addWaterCup);
  const updateDailyRecord = useHealthStore((state) => state.updateDailyRecord);

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [refreshing, setRefreshing] = useState(false);

  const target = getTarget(currentMemberId);
  const todayRecord = getTodayRecord(currentMemberId) || {
    steps: 0,
    exerciseMinutes: 0,
    waterCups: 0,
    sleepHours: 0,
    checkInItems: [],
    exerciseType: ''
  };
  const streak = getCheckInStreak(currentMemberId);
  const allRecords = getDailyRecords(currentMemberId);

  const today = dayjs().format('YYYY-MM-DD');

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  }, []);

  const handleCheckIn = (item: string) => {
    checkIn(today, currentMemberId, item);
    Taro.showToast({ title: '打卡成功', icon: 'success' });
    console.log('[HabitsPage] Check in:', item);
  };

  const handleAddWater = () => {
    addWaterCup(today, currentMemberId);
    Taro.showToast({ title: '已记录 +1 杯', icon: 'success' });
    console.log('[HabitsPage] Add water cup');
  };

  const handleGoToRecord = (type: string) => {
    Taro.navigateTo({ url: `/pages/record-form/index?type=${type}` });
    console.log('[HabitsPage] Go to record form:', type);
  };

  const handleGoToTarget = () => {
    Taro.navigateTo({ url: '/pages/target/index' });
    console.log('[HabitsPage] Go to target settings');
  };

  const handleQuickAdd = (type: string, minutes: number) => {
    updateDailyRecord(today, currentMemberId, {
      exerciseMinutes: (todayRecord.exerciseMinutes || 0) + minutes,
      exerciseType: type,
      checkInItems: [...new Set([...(todayRecord.checkInItems || []), 'exercise'])]
    });
    Taro.showToast({ title: `已记录${minutes}分钟`, icon: 'success' });
    console.log('[HabitsPage] Quick add exercise:', type, minutes);
  };

  const calendarData = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const endOfMonth = currentMonth.endOf('month');
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();

    const days: Array<{ day: number | null; date: string; checked: boolean; isToday: boolean }> = [];

    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, date: '', checked: false, isToday: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = currentMonth.date(i).format('YYYY-MM-DD');
      const record = allRecords.find((r) => r.date === date);
      const checked = record && record.checkInItems.length > 0;
      const isToday = date === today;
      days.push({ day: i, date, checked: !!checked, isToday });
    }

    return days;
  }, [currentMonth, allRecords, today]);

  const monthStats = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month').format('YYYY-MM-DD');
    const endOfMonth = currentMonth.endOf('month').format('YYYY-MM-DD');
    const monthRecords = allRecords.filter(
      (r) => r.date >= startOfMonth && r.date <= endOfMonth
    );

    const checkedDays = monthRecords.filter((r) => r.checkInItems.length > 0).length;
    const totalDays = currentMonth.daysInMonth();
    const checkInRate = Math.round((checkedDays / totalDays) * 100);

    return { checkedDays, totalDays, checkInRate };
  }, [currentMonth, allRecords]);

  const checkInItems = [
    {
      icon: '👟',
      title: '步数打卡',
      value: todayRecord.steps,
      target: target.steps,
      unit: '步',
      checked: todayRecord.checkInItems.includes('steps'),
      color: '#22c55e',
      onCheck: () => handleCheckIn('steps'),
      onRecord: () => handleGoToRecord('steps')
    },
    {
      icon: '🏃',
      title: '运动打卡',
      value: todayRecord.exerciseMinutes,
      target: target.exerciseMinutes,
      unit: '分钟',
      checked: todayRecord.checkInItems.includes('exercise'),
      color: '#f97316',
      onCheck: () => handleCheckIn('exercise'),
      onRecord: () => handleGoToRecord('exercise')
    },
    {
      icon: '💧',
      title: '饮水打卡',
      value: todayRecord.waterCups,
      target: target.waterCups,
      unit: '杯',
      checked: todayRecord.checkInItems.includes('water'),
      color: '#3b82f6',
      onCheck: () => handleCheckIn('water'),
      onRecord: handleAddWater
    },
    {
      icon: '😴',
      title: '睡眠打卡',
      value: todayRecord.sleepHours,
      target: target.sleepHours,
      unit: '小时',
      checked: todayRecord.checkInItems.includes('sleep'),
      color: '#8b5cf6',
      onCheck: () => handleCheckIn('sleep'),
      onRecord: () => handleGoToRecord('sleep')
    }
  ];

  const quickAddExercises = [
    { type: '快走', icon: '🚶', minutes: 30 },
    { type: '跑步', icon: '🏃', minutes: 30 },
    { type: '骑行', icon: '🚴', minutes: 45 },
    { type: '瑜伽', icon: '🧘', minutes: 60 }
  ];

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <ScrollView scrollY className={styles.pageContainer} refresher-enabled refreshing={refreshing} onRefresherRefresh={handleRefresh}>
      <MemberSelector />

      <View className={styles.header}>
        <View className={styles.dateInfo}>
          <Text className={styles.dateMain}>{dayjs().format('M月D日')}</Text>
          <Text className={styles.dateSub}>{dayjs().format('dddd')}</Text>
        </View>
        <Button className={styles.targetBtn} onClick={handleGoToTarget}>
          设置目标
        </Button>
      </View>

      <View className={styles.calendarSection}>
        <View className={styles.calendarHeader}>
          <Text className={styles.monthLabel}>{currentMonth.format('YYYY年M月')}</Text>
          <View className={styles.calendarNav}>
            <Button
              className={styles.navBtn}
              onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
            >
              ‹
            </Button>
            <Button
              className={styles.navBtn}
              onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
            >
              ›
            </Button>
          </View>
        </View>
        <View className={styles.weekDays}>
          {weekDays.map((day) => (
            <Text key={day} className={styles.weekDay}>
              {day}
            </Text>
          ))}
        </View>
        <View className={styles.daysGrid}>
          {calendarData.map((item, index) => (
            <View
              key={index}
              className={`${styles.dayItem} ${item.checked ? styles.checked : ''} ${item.isToday ? styles.today : ''} ${item.day === null ? styles.empty : ''}`}
            >
              {item.day !== null && (
                <>
                  <Text className={styles.dayNumber}>{item.day}</Text>
                  {item.checked && <Text className={styles.dayCheck}>✓</Text>}
                </>
              )}
            </View>
          ))}
        </View>
      </View>

      <Text className={styles.sectionTitle}>今日打卡</Text>
      <View className={styles.habitList}>
        {checkInItems.map((item, index) => (
          <CheckInItem key={index} {...item} />
        ))}
      </View>

      <Text className={styles.sectionTitle}>快速记录运动</Text>
      <View className={styles.quickAdd}>
        {quickAddExercises.map((item, index) => (
          <View
            key={index}
            className={styles.quickAddItem}
            onClick={() => handleQuickAdd(item.type, item.minutes)}
          >
            <Text className={styles.quickAddIcon}>{item.icon}</Text>
            <Text className={styles.quickAddText}>{item.type}{item.minutes}分钟</Text>
          </View>
        ))}
      </View>

      <Text className={styles.sectionTitle}>本月统计</Text>
      <View className={styles.statsSection}>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{streak.current}</Text>
            <Text className={styles.statLabel}>连续打卡</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{monthStats.checkedDays}</Text>
            <Text className={styles.statLabel}>本月打卡</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{monthStats.checkInRate}%</Text>
            <Text className={styles.statLabel}>完成率</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{streak.longest}</Text>
            <Text className={styles.statLabel}>最长连续</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HabitsPage;
