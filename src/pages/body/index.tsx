import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import MemberSelector from '@/components/MemberSelector';
import DataChart from '@/components/DataChart';
import { useHealthStore } from '@/store/useHealthStore';
import { calculateBMI, getBMIStatus } from '@/utils/healthUtils';

const BodyPage: React.FC = () => {
  const currentMemberId = useHealthStore((state) => state.currentMemberId);
  const getCurrentMember = useHealthStore((state) => state.getCurrentMember);
  const getBodyRecords = useHealthStore((state) => state.getBodyRecords);
  const getLatestBodyRecord = useHealthStore((state) => state.getLatestBodyRecord);
  const getExamRecords = useHealthStore((state) => state.getExamRecords);
  const getAbnormalRecords = useHealthStore((state) => state.getAbnormalRecords);
  const getDailyRecords = useHealthStore((state) => state.getDailyRecords);

  const [refreshing, setRefreshing] = useState(false);

  const currentMember = getCurrentMember();
  const latestRecord = getLatestBodyRecord(currentMemberId);
  const bodyRecords = getBodyRecords(currentMemberId).slice(0, 5);
  const examRecords = getExamRecords(currentMemberId).slice(0, 3);
  const abnormalRecords = getAbnormalRecords(currentMemberId);
  const dailyRecords = getDailyRecords(currentMemberId, dayjs().subtract(7, 'day').format('YYYY-MM-DD'));

  const bmi = latestRecord && currentMember?.height
    ? calculateBMI(latestRecord.weight, currentMember.height)
    : 0;
  const bmiStatus = getBMIStatus(bmi);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  }, []);

  const handleGoToRecord = (type: string) => {
    Taro.navigateTo({ url: `/pages/record-form/index?type=${type}` });
    console.log('[BodyPage] Go to record form:', type);
  };

  const handleGoToHistory = () => {
    Taro.navigateTo({ url: '/pages/history-detail/index?type=body' });
    console.log('[BodyPage] Go to history detail');
  };

  const weightChartData = dailyRecords.slice(0, 7).reverse().map((record) => ({
    label: dayjs(record.date).format('MM/DD'),
    value: record.weight || 0
  }));

  const waistChartData = dailyRecords.slice(0, 7).reverse().map((record) => ({
    label: dayjs(record.date).format('MM/DD'),
    value: record.waistLine || 0
  }));

  return (
    <ScrollView scrollY className={styles.pageContainer} refresher-enabled refreshing={refreshing} onRefresherRefresh={handleRefresh}>
      <MemberSelector />

      <View className={styles.currentData}>
        <View className={styles.currentHeader}>
          <Text className={styles.currentTitle}>最新记录</Text>
          <Button className={styles.recordBtn} onClick={() => handleGoToRecord('weight')}>
            + 记录
          </Button>
        </View>
        <View className={styles.currentStats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{latestRecord?.weight || '--'}</Text>
            <Text className={styles.statUnit}>kg</Text>
            <Text className={styles.statStatus}>体重</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{latestRecord?.waistLine || '--'}</Text>
            <Text className={styles.statUnit}>cm</Text>
            <Text className={styles.statStatus}>腰围</Text>
          </View>
        </View>
        {bmi > 0 && (
          <View className={styles.bmiInfo}>
          <Text className={styles.bmiValue}>
            BMI: {bmi} <Text style={{ color: bmiStatus.color }}>({bmiStatus.status})</Text>
          </Text>
          <Text className={styles.bmiLabel}>
            {currentMember?.name} · 身高 {currentMember?.height}cm
          </Text>
        </View>
        )}
      </View>

      {abnormalRecords.length > 0 && (
        <>
          <Text className={styles.sectionTitle}>异常提醒</Text>
          <View className={styles.historyList}>
            {abnormalRecords.slice(0, 2).map((record) => (
              <View key={record.id} className={styles.historyItem}>
                <View className={styles.historyHeader}>
                  <Text className={styles.historyDate}>{record.date}</Text>
                  <Text className={styles.abnormalTag}>异常</Text>
                </View>
                <View className={styles.historyData}>
                  <View className={styles.historyDataItem}>
                    <Text className={styles.historyDataLabel}>体重</Text>
                    <Text className={styles.historyDataValue}>
                      {record.weight}
                      <Text className={styles.historyDataUnit}> kg</Text>
                    </Text>
                  </View>
                  <View className={styles.historyDataItem}>
                    <Text className={styles.historyDataLabel}>腰围</Text>
                    <Text className={styles.historyDataValue}>
                      {record.waistLine}
                      <Text className={styles.historyDataUnit}> cm</Text>
                    </Text>
                  </View>
                </View>
                <View className={styles.historyAbnormal}>
                  {record.abnormalItems.map((item, idx) => (
                    <Text key={idx} className={styles.abnormalItem}>
                      ⚠️ {item}
                    </Text>
                  ))}
                </View>
                {record.notes && (
                  <Text className={styles.historyNotes}>备注：{record.notes}</Text>
                )}
              </View>
            ))}
          </View>
        </>
      )}

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>体重趋势</Text>
        <Text className={styles.viewAllBtn} onClick={handleGoToHistory}>查看全部 ›</Text>
      </View>
      <DataChart
        title=""
        data={weightChartData}
        unit="kg"
        color="#22c55e"
      />

      <Text className={styles.sectionTitle}>腰围趋势</Text>
      <DataChart
        title=""
        data={waistChartData}
        unit="cm"
        color="#f97316"
      />

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>历史记录</Text>
        <Text className={styles.viewAllBtn} onClick={handleGoToHistory}>查看全部 ›</Text>
      </View>
      <View className={styles.historyList}>
        {bodyRecords.length === 0 ? (
          <View className={styles.emptyState}>暂无记录，点击上方按钮记录</View>
        ) : (
          bodyRecords.map((record) => (
            <View key={record.id} className={styles.historyItem}>
              <View className={styles.historyHeader}>
                <Text className={styles.historyDate}>{record.date}</Text>
                {record.isAbnormal && <Text className={styles.abnormalTag}>异常</Text>}
              </View>
              <View className={styles.historyData}>
                <View className={styles.historyDataItem}>
                  <Text className={styles.historyDataLabel}>体重</Text>
                  <Text className={styles.historyDataValue}>
                    {record.weight}
                    <Text className={styles.historyDataUnit}> kg</Text>
                  </Text>
                </View>
                <View className={styles.historyDataItem}>
                  <Text className={styles.historyDataLabel}>腰围</Text>
                  <Text className={styles.historyDataValue}>
                    {record.waistLine}
                    <Text className={styles.historyDataUnit}> cm</Text>
                  </Text>
                </View>
                {record.bmi && (
                  <View className={styles.historyDataItem}>
                    <Text className={styles.historyDataLabel}>BMI</Text>
                    <Text className={styles.historyDataValue}>
                      {record.bmi}
                    </Text>
                  </View>
                )}
              </View>
              {record.notes && (
                <Text className={styles.historyNotes}>备注：{record.notes}</Text>
              )}
            </View>
          ))
        )}
      </View>

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>体检记录</Text>
        <Text className={styles.viewAllBtn} onClick={() => handleGoToRecord('exam')}>+ 添加</Text>
      </View>
      <View className={styles.examList}>
        {examRecords.length === 0 ? (
          <View className={styles.emptyState}>暂无体检记录</View>
        ) : (
          examRecords.map((record) => {
            const abnormalCount = record.items.filter((i) => i.isAbnormal).length;
            return (
              <View key={record.id} className={styles.examItem}>
                <View className={styles.examHeader}>
                  <View>
                    <Text className={styles.examDate}>{record.date}</Text>
                    <Text className={styles.examHospital}>{record.hospital}</Text>
                  </View>
                  {abnormalCount > 0 && (
                    <Text className={styles.examAbnormalBadge}>
                      ⚠️ {abnormalCount}项异常
                    </Text>
                  )}
                </View>
                <View className={styles.examItemsDetail}>
                  {record.items.map((item, idx) => (
                    <View key={idx} className={styles.examItemDetail}>
                      <Text className={styles.examItemName}>{item.name}</Text>
                      <View className={styles.examItemValueWrap}>
                        <Text
                          className={classnames(
                            styles.examItemValue,
                            item.isAbnormal && styles.abnormalValue
                          )}
                        >
                          {item.value} {item.unit}
                        </Text>
                        {item.isAbnormal && (
                          <Text className={styles.examItemStatus}>
                            {item.status === 'high' ? '↑' : '↓'}
                          </Text>
                        )}
                      </View>
                      {item.normalRange && item.normalRange !== '-' && (
                        <Text className={styles.examItemRange}>参考: {item.normalRange}</Text>
                      )}
                    </View>
                  ))}
                </View>
                {record.notes && (
                  <View className={styles.examNotes}>
                    <Text className={styles.examNotesLabel}>💡 医生建议:</Text>
                    <Text className={styles.examNotesText}>{record.notes}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {latestRecord && (
        <>
          <Text className={styles.sectionTitle}>其他指标</Text>
          <View className={styles.otherMetrics}>
            {latestRecord.heartRate && (
              <View className={styles.metricCard}>
                <Text className={styles.metricLabel}>心率</Text>
                <Text className={styles.metricValue}>{latestRecord.heartRate}</Text>
                <Text className={styles.metricUnit}>次/分钟</Text>
              </View>
            )}
            {latestRecord.bloodPressure && (
              <View className={styles.metricCard}>
                <Text className={styles.metricLabel}>血压</Text>
                <Text className={styles.metricValue}>{latestRecord.bloodPressure}</Text>
                <Text className={styles.metricUnit}>mmHg</Text>
              </View>
            )}
            {latestRecord.bloodSugar && (
              <View className={styles.metricCard}>
                <Text className={styles.metricLabel}>血糖</Text>
                <Text className={styles.metricValue}>{latestRecord.bloodSugar}</Text>
                <Text className={styles.metricUnit}>mmol/L</Text>
              </View>
            )}
            {latestRecord.bmi && (
              <View className={styles.metricCard}>
                <Text className={styles.metricLabel}>BMI</Text>
                <Text className={styles.metricValue}>{latestRecord.bmi}</Text>
                <Text className={styles.metricUnit}>{bmiStatus.status}</Text>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default BodyPage;
