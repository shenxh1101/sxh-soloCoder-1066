import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import MemberSelector from '@/components/MemberSelector';
import HealthCard from '@/components/HealthCard';
import ProgressBar from '@/components/ProgressBar';
import CheckInItem from '@/components/CheckInItem';
import { useHealthStore } from '@/store/useHealthStore';
import {
  getStepsStatus,
  getWaterStatus,
  getSleepStatus,
  generateHealthSuggestions
} from '@/utils/healthUtils';

const TodayPage: React.FC = () => {
  const currentMemberId = useHealthStore((state) => state.currentMemberId);
  const getTarget = useHealthStore((state) => state.getTarget);
  const getTodayRecord = useHealthStore((state) => state.getTodayRecord);
  const getCheckInStreak = useHealthStore((state) => state.getCheckInStreak);
  const getAbnormalRecords = useHealthStore((state) => state.getAbnormalRecords);
  const checkIn = useHealthStore((state) => state.checkIn);
  const addWaterCup = useHealthStore((state) => state.addWaterCup);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const today = dayjs().format('YYYY-MM-DD');

  const { target, todayRecord, streak, abnormalRecords } = useMemo(() => {
    const t = getTarget(currentMemberId);
    const tr = getTodayRecord(currentMemberId) || {
      steps: 0,
      exerciseMinutes: 0,
      waterCups: 0,
      sleepHours: 0,
      checkInItems: []
    };
    const s = getCheckInStreak(currentMemberId);
    const ar = getAbnormalRecords(currentMemberId).slice(0, 3);
    return { target: t, todayRecord: tr, streak: s, abnormalRecords: ar };
  }, [currentMemberId, refreshKey, getTarget, getTodayRecord, getCheckInStreak, getAbnormalRecords]);

  const stepsStatus = getStepsStatus(todayRecord.steps, target.steps);
  const waterStatus = getWaterStatus(todayRecord.waterCups, target.waterCups);
  const sleepStatus = getSleepStatus(todayRecord.sleepHours);

  const suggestions = useMemo(() => generateHealthSuggestions({
    steps: todayRecord.steps,
    exerciseMinutes: todayRecord.exerciseMinutes,
    waterCups: todayRecord.waterCups,
    sleepHours: todayRecord.sleepHours,
    weightChange: 0
  }), [todayRecord]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
      Taro.showToast({ title: '刷新成功', icon: 'success' });
    }, 1000);
  }, []);

  useEffect(() => {
    Taro.onPullDownRefresh(handleRefresh);
    return () => {
      Taro.offPullDownRefresh(handleRefresh);
    };
  }, [handleRefresh]);

  useDidShow(() => {
    setRefreshKey((k) => k + 1);
    console.log('[TodayPage] Page showed, refresh data, memberId:', currentMemberId);
  });

  const handleCheckIn = (item: string) => {
    checkIn(today, currentMemberId, item);
    Taro.showToast({ title: '打卡成功', icon: 'success' });
    console.log('[TodayPage] Check in:', item);
  };

  const handleAddWater = () => {
    addWaterCup(today, currentMemberId);
    Taro.showToast({ title: '已记录 +1 杯', icon: 'success' });
    console.log('[TodayPage] Add water cup');
  };

  const handleGoToRecord = (type: string) => {
    Taro.navigateTo({ url: `/pages/record-form/index?type=${type}` });
    console.log('[TodayPage] Go to record form:', type);
  };

  const healthCards = [
    {
      icon: '👟',
      title: '今日步数',
      value: todayRecord.steps,
      unit: '步',
      status: stepsStatus.status,
      statusColor: stepsStatus.color,
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(74, 222, 128, 0.1) 100%)',
      onClick: () => handleGoToRecord('steps')
    },
    {
      icon: '🏃',
      title: '运动时长',
      value: todayRecord.exerciseMinutes,
      unit: '分钟',
      status: todayRecord.exerciseMinutes >= target.exerciseMinutes ? '达标' : '加油',
      statusColor: todayRecord.exerciseMinutes >= target.exerciseMinutes ? '#22c55e' : '#f59e0b',
      gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%)',
      onClick: () => handleGoToRecord('exercise')
    },
    {
      icon: '💧',
      title: '饮水杯数',
      value: todayRecord.waterCups,
      unit: '杯',
      status: waterStatus.status,
      statusColor: waterStatus.color,
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%)',
      onClick: handleAddWater
    },
    {
      icon: '😴',
      title: '睡眠时长',
      value: todayRecord.sleepHours,
      unit: '小时',
      status: sleepStatus.status,
      statusColor: sleepStatus.color,
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
      onClick: () => handleGoToRecord('sleep')
    }
  ];

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

  return (
    <ScrollView scrollY className={styles.pageContainer} refresher-enabled refreshing={refreshing} onRefresherRefresh={handleRefresh}>
      <MemberSelector />

      <View className={styles.streakCard}>
        <View className={styles.streakHeader}>
          <Text className={styles.streakTitle}>连续打卡</Text>
          <Text className={styles.streakIcon}>🔥</Text>
        </View>
        <View className={styles.streakContent}>
          <View className={styles.streakItem}>
            <Text className={styles.streakNumber}>{streak.current}</Text>
            <Text className={styles.streakLabel}>当前连续</Text>
          </View>
          <View className={styles.streakItem}>
            <Text className={styles.streakNumber}>{streak.longest}</Text>
            <Text className={styles.streakLabel}>最长连续</Text>
          </View>
          <View className={styles.streakItem}>
            <Text className={styles.streakNumber}>{streak.totalDays}</Text>
            <Text className={styles.streakLabel}>累计天数</Text>
          </View>
        </View>
      </View>

      <Text className={styles.sectionTitle}>健康概览</Text>
      <View className={styles.healthGrid}>
        {healthCards.map((card, index) => (
          <HealthCard key={index} {...card} />
        ))}
      </View>

      <Text className={styles.sectionTitle}>目标进度</Text>
      <View className={styles.progressSection}>
        <ProgressBar
          value={todayRecord.steps}
          target={target.steps}
          label="步数"
          color="#22c55e"
        />
        <ProgressBar
          value={todayRecord.exerciseMinutes}
          target={target.exerciseMinutes}
          label="运动时长"
          color="#f97316"
        />
        <ProgressBar
          value={todayRecord.waterCups}
          target={target.waterCups}
          label="饮水"
          color="#3b82f6"
        />
        <ProgressBar
          value={todayRecord.sleepHours}
          target={target.sleepHours}
          label="睡眠"
          color="#8b5cf6"
        />
      </View>

      <Text className={styles.sectionTitle}>快速打卡</Text>
      <View className={styles.checkInSection}>
        {checkInItems.map((item, index) => (
          <CheckInItem key={index} {...item} />
        ))}
      </View>

      {abnormalRecords.length > 0 && (
        <>
          <Text className={styles.sectionTitle}>异常提醒</Text>
          <View className={styles.alertCard}>
            <View className={styles.alertHeader}>
              <Text className={styles.alertIcon}>⚠️</Text>
              <Text className={styles.alertTitle}>异常指标提示</Text>
            </View>
            {abnormalRecords.map((record) =>
              record.abnormalItems.map((item, idx) => (
                <View key={`${record.id}-${idx}`} className={styles.alertItem}>
                  <View className={styles.alertDot} />
                  <Text className={styles.alertText}>
                    {record.date} {item}
                  </Text>
                </View>
              ))
            )}
          </View>
        </>
      )}

      <Text className={styles.sectionTitle}>健康建议</Text>
      <View className={styles.suggestionCard}>
        <View className={styles.suggestionHeader}>
          <Text className={styles.suggestionIcon}>💡</Text>
          <Text className={styles.suggestionTitle}>今日建议</Text>
        </View>
        {suggestions.slice(0, 3).map((suggestion, index) => (
          <View key={index} className={styles.suggestionItem}>
            <Text className={styles.suggestionText}>{suggestion}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default TodayPage;
