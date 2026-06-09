import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useHealthStore } from '@/store/useHealthStore';
import { getBMIStatus, calculateSleepHours } from '@/utils/healthUtils';
import HealthCard from '@/components/HealthCard';
import type { DailyRecord, BodyRecord } from '@/types/health';

const HistoryDetailPage: React.FC = () => {
  const router = useRouter();
  const initialDate = router.params.date || dayjs().format('YYYY-MM-DD');
  const initialMemberId = router.params.memberId;

  const currentMemberId = useHealthStore((state) => state.currentMemberId);
  const getMember = useHealthStore((state) => state.getMember);
  const getDailyRecordByDate = useHealthStore((state) => state.getDailyRecordByDate);
  const getBodyRecordsByMember = useHealthStore((state) => state.getBodyRecordsByMember);
  const getExamRecordsByMember = useHealthStore((state) => state.getExamRecordsByMember);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const memberId = initialMemberId || currentMemberId;

  const member = getMember(memberId);
  const dailyRecord = getDailyRecordByDate(selectedDate, memberId);
  const bodyRecords = getBodyRecordsByMember(memberId);
  const examRecords = getExamRecordsByMember(memberId);

  const dayBodyRecord = useMemo(() => {
    return bodyRecords.find((r: BodyRecord) => r.date === selectedDate);
  }, [bodyRecords, selectedDate]);

  const dayExamRecords = useMemo(() => {
    return examRecords.filter((r) => r.date === selectedDate);
  }, [examRecords, selectedDate]);

  useDidShow(() => {
    console.log('[HistoryDetailPage] Page showed, date:', selectedDate, 'memberId:', memberId);
  });

  const handlePrevDay = () => {
    const prev = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD');
    if (dayjs(prev).isAfter(dayjs().subtract(90, 'day'))) {
      setSelectedDate(prev);
    }
  };

  const handleNextDay = () => {
    const next = dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD');
    if (dayjs(next).isBefore(dayjs().add(1, 'day'))) {
      setSelectedDate(next);
    }
  };

  const checkInItems = [
    { type: 'steps', label: '步数', icon: '👟', key: 'steps', unit: '步', className: 'steps' },
    { type: 'exercise', label: '运动', icon: '🏃', key: 'exerciseMinutes', unit: '分钟', className: 'exercise' },
    { type: 'water', label: '饮水', icon: '💧', key: 'waterCups', unit: '杯', className: 'water' },
    { type: 'sleep', label: '睡眠', icon: '😴', key: 'sleepHours', unit: '小时', className: 'sleep' }
  ];

  const isCompleted = (type: string) => {
    return dailyRecord?.checkInItems?.includes(type as any);
  };

  const getValue = (key: string) => {
    if (!dailyRecord) return '-';
    if (key === 'sleepHours' && dailyRecord.sleepStartTime && dailyRecord.sleepEndTime) {
      return calculateSleepHours(dailyRecord.sleepStartTime, dailyRecord.sleepEndTime);
    }
    return dailyRecord[key as keyof DailyRecord] ?? '-';
  };

  const formatValue = (value: any, unit: string) => {
    if (value === '-' || value === null || value === undefined) return '-';
    return `${value}${unit}`;
  };

  const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const bmiStatus = dayBodyRecord?.bmi ? getBMIStatus(dayBodyRecord.bmi) : null;

  return (
    <View className={styles.pageContainer}>
      {member && (
        <View className={styles.memberInfo}>
          <View className={styles.memberAvatar}>
            {member.name.charAt(0)}
          </View>
          <View className={styles.memberDetails}>
            <Text className={styles.memberName}>{member.name}</Text>
            <Text className={styles.memberDesc}>
              {member.relation} · {member.gender === 'male' ? '男' : '女'} · {member.height}cm
            </Text>
          </View>
        </View>
      )}

      <View className={styles.dateSection}>
        <Button
          className={classnames(
            styles.dateNavBtn,
            dayjs(selectedDate).isSame(dayjs().subtract(90, 'day'), 'day') && styles.disabled
          )}
          onClick={handlePrevDay}
        >
          ‹
        </Button>
        <View className={styles.dateInfo}>
          <Text className={styles.dateText}>
            {dayjs(selectedDate).format('YYYY年M月D日')}
          </Text>
          <Text className={styles.weekdayText}>
            {weekdayMap[dayjs(selectedDate).day()]}
            {dayjs(selectedDate).isSame(dayjs(), 'day') && ' · 今天'}
            {dayjs(selectedDate).isSame(dayjs().subtract(1, 'day'), 'day') && ' · 昨天'}
          </Text>
        </View>
        <Button
          className={classnames(
            styles.dateNavBtn,
            dayjs(selectedDate).isSame(dayjs(), 'day') && styles.disabled
          )}
          onClick={handleNextDay}
        >
          ›
        </Button>
      </View>

      {!dailyRecord && !dayBodyRecord ? (
        <View className={styles.noData}>
          <Text className={styles.noDataIcon}>📭</Text>
          <Text>该日期暂无记录</Text>
        </View>
      ) : (
        <>
          <Text className={styles.sectionTitle}>健康概览</Text>
          <View className={styles.healthGrid4}>
            <HealthCard
              icon="👟"
              title="步数"
              value={getValue('steps') || '0'}
              unit="步"
              color="#22c55e"
              status={dailyRecord?.steps && dailyRecord.steps > 8000 ? 'excellent' : 'normal'}
            />
            <HealthCard
              icon="🏃"
              title="运动"
              value={getValue('exerciseMinutes') || '0'}
              unit="分钟"
              color="#f97316"
              status={dailyRecord?.exerciseMinutes && dailyRecord.exerciseMinutes > 30 ? 'excellent' : 'normal'}
            />
            <HealthCard
              icon="💧"
              title="饮水"
              value={getValue('waterCups') || '0'}
              unit="杯"
              color="#3b82f6"
              status={dailyRecord?.waterCups && dailyRecord.waterCups >= 8 ? 'excellent' : 'normal'}
            />
            <HealthCard
              icon="😴"
              title="睡眠"
              value={getValue('sleepHours') || '0'}
              unit="小时"
              color="#8b5cf6"
              status={dailyRecord?.sleepHours && dailyRecord.sleepHours >= 7 ? 'excellent' : 'normal'}
            />
          </View>

          <Text className={styles.sectionTitle}>打卡记录</Text>
          <View className={styles.checkInSection}>
            <View className={styles.checkInList}>
              {checkInItems.map((item) => (
                <View key={item.type} className={styles.checkInRow}>
                  <View className={styles.checkInInfo}>
                    <View className={classnames(styles.checkInIcon, styles[item.className])}>
                      {item.icon}
                    </View>
                    <View className={styles.checkInText}>
                      <Text className={styles.checkInLabel}>{item.label}</Text>
                      <Text className={styles.checkInValue}>
                        {item.type === 'sleep' && dailyRecord?.sleepStartTime
                          ? `${dailyRecord.sleepStartTime} - ${dailyRecord.sleepEndTime || '-'}`
                          : item.type === 'exercise' && dailyRecord?.exerciseType
                          ? `${dailyRecord.exerciseType} · ${formatValue(getValue(item.key), item.unit)}`
                          : formatValue(getValue(item.key), item.unit)
                        }
                      </Text>
                    </View>
                  </View>
                  <Text className={classnames(
                    styles.checkInStatus,
                    isCompleted(item.type) ? styles.completed : styles.missed
                  )}>
                    {isCompleted(item.type) ? '✓ 已完成' : '未打卡'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {dayBodyRecord && (
            <>
              <Text className={styles.sectionTitle}>身体记录</Text>
              <View className={styles.bodySection}>
                <View className={styles.bodyRow}>
                  <Text className={styles.bodyLabel}>
                    <Text className={styles.bodyIcon}>⚖️</Text>
                    体重
                  </Text>
                  <Text className={styles.bodyValue}>
                    {dayBodyRecord.weight} kg
                    {dayBodyRecord.isAbnormal && (
                      <Text className={styles.abnormalTag}>⚠️ 异常</Text>
                    )}
                  </Text>
                </View>
                <View className={styles.bodyRow}>
                  <Text className={styles.bodyLabel}>
                    <Text className={styles.bodyIcon}>📏</Text>
                    腰围
                  </Text>
                  <Text className={styles.bodyValue}>{dayBodyRecord.waistLine} cm</Text>
                </View>
                {dayBodyRecord.bmi && (
                  <View className={styles.bodyRow}>
                    <Text className={styles.bodyLabel}>
                      <Text className={styles.bodyIcon}>📊</Text>
                      BMI
                    </Text>
                    <Text className={styles.bodyValue}>
                      {dayBodyRecord.bmi.toFixed(1)}
                      {bmiStatus && (
                        <Text className={classnames(
                          styles.abnormalTag,
                          bmiStatus.level !== 'normal' && styles.abnormalTag
                        )}>
                          {bmiStatus.label}
                        </Text>
                      )}
                    </Text>
                  </View>
                )}
                {dayBodyRecord.heartRate && (
                  <View className={styles.bodyRow}>
                    <Text className={styles.bodyLabel}>
                      <Text className={styles.bodyIcon}>❤️</Text>
                      心率
                    </Text>
                    <Text className={styles.bodyValue}>{dayBodyRecord.heartRate} 次/分</Text>
                  </View>
                )}
                {dayBodyRecord.bloodPressure && (
                  <View className={styles.bodyRow}>
                    <Text className={styles.bodyLabel}>
                      <Text className={styles.bodyIcon}>💓</Text>
                      血压
                    </Text>
                    <Text className={styles.bodyValue}>{dayBodyRecord.bloodPressure} mmHg</Text>
                  </View>
                )}
                {dayBodyRecord.bloodSugar && (
                  <View className={styles.bodyRow}>
                    <Text className={styles.bodyLabel}>
                      <Text className={styles.bodyIcon}>🩸</Text>
                      血糖
                    </Text>
                    <Text className={styles.bodyValue}>{dayBodyRecord.bloodSugar} mmol/L</Text>
                  </View>
                )}
                {dayBodyRecord.notes && (
                  <View className={styles.notesSection}>
                    <Text className={styles.notesTitle}>
                      <Text className={styles.bodyIcon}>📝</Text>
                      备注
                    </Text>
                    <Text className={styles.notesContent}>{dayBodyRecord.notes}</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {dayExamRecords.length > 0 && (
            <>
              <Text className={styles.sectionTitle}>体检记录</Text>
              {dayExamRecords.map((record) => {
                const items = record.items || [];
                const abnormalCount = items.filter((i) => i && i.isAbnormal).length;
                return (
                  <View key={record.id} className={styles.bodySection}>
                    <View className={styles.bodyRow}>
                      <Text className={styles.bodyLabel}>
                        <Text className={styles.bodyIcon}>🏥</Text>
                        体检医院
                      </Text>
                      <View style={{ display: 'flex', alignItems: 'center', gap: '8rpx' }}>
                        <Text className={styles.bodyValue}>{record.hospital || '-'}</Text>
                        {abnormalCount > 0 && (
                          <Text className={styles.abnormalTag}>⚠️ {abnormalCount}项异常</Text>
                        )}
                      </View>
                    </View>
                    {items.length > 0 && (
                      <View className={styles.examItemsDetail}>
                        {items.map((item, idx) => {
                          if (!item) return null;
                          return (
                            <View key={idx} className={styles.examItemDetail}>
                              <View style={{ flex: 1 }}>
                                <View style={{ display: 'flex', alignItems: 'center', gap: '8rpx', marginBottom: '4rpx' }}>
                                  <Text className={styles.examItemName}>{item.name || '-'}</Text>
                                  <View style={{ display: 'flex', alignItems: 'center', gap: '8rpx' }}>
                                    <Text
                                      className={classnames(
                                        styles.bodyValue,
                                        item.isAbnormal && styles.abnormalValue
                                      )}
                                    >
                                      {item.value || '-'} {item.unit || ''}
                                    </Text>
                                    {item.isAbnormal && (
                                      <Text className={styles.examItemStatus}>
                                        {item.status === 'high' ? '↑' : item.status === 'low' ? '↓' : ''}
                                      </Text>
                                    )}
                                  </View>
                                  {item.normalRange && item.normalRange !== '-' && (
                                    <Text className={styles.examItemRange}>参考: {item.normalRange}</Text>
                                  )}
                                </View>
                                {item.notes && (
                                  <Text className={styles.examItemNotes}>💬 {item.notes}</Text>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                    {record.notes && (
                      <View className={styles.notesSection}>
                        <Text className={styles.notesTitle}>
                          <Text className={styles.bodyIcon}>💡</Text>
                          医生建议
                        </Text>
                        <Text className={styles.notesContent}>{record.notes}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </>
      )}
    </View>
  );
};

export default HistoryDetailPage;
