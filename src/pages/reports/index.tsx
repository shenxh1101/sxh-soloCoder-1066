import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import MemberSelector from '@/components/MemberSelector';
import DataChart from '@/components/DataChart';
import { useHealthStore } from '@/store/useHealthStore';
import { getTrendColor } from '@/utils/healthUtils';
import type { WeeklyReport } from '@/types/health';

const ReportsPage: React.FC = () => {
  const currentMemberId = useHealthStore((state) => state.currentMemberId);
  const getWeeklyReports = useHealthStore((state) => state.getWeeklyReports);
  const getDailyRecords = useHealthStore((state) => state.getDailyRecords);
  const getCheckInStreak = useHealthStore((state) => state.getCheckInStreak);

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [queryStartDate, setQueryStartDate] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [queryEndDate, setQueryEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  const weeklyReports = getWeeklyReports(currentMemberId);
  const streak = getCheckInStreak(currentMemberId);

  const currentReport: WeeklyReport | undefined = weeklyReports[currentWeekIndex];

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  }, []);

  const handleSelectDate = (field: 'start' | 'end') => {
    Taro.showActionSheet({
      itemList: ['最近7天', '最近30天', '最近90天', '自定义'],
      success: (res) => {
        const today = dayjs();
        let startDate = queryStartDate;
        let endDate = queryEndDate;

        switch (res.tapIndex) {
          case 0:
            startDate = today.subtract(7, 'day').format('YYYY-MM-DD');
            endDate = today.format('YYYY-MM-DD');
            break;
          case 1:
            startDate = today.subtract(30, 'day').format('YYYY-MM-DD');
            endDate = today.format('YYYY-MM-DD');
            break;
          case 2:
            startDate = today.subtract(90, 'day').format('YYYY-MM-DD');
            endDate = today.format('YYYY-MM-DD');
            break;
          default:
            Taro.showToast({ title: '请在历史记录中选择', icon: 'none' });
            return;
        }

        if (field === 'start') setQueryStartDate(startDate);
        else setQueryEndDate(endDate);

        console.log('[ReportsPage] Date range:', startDate, endDate);
      }
    });
  };

  const handleQuery = () => {
    Taro.navigateTo({
      url: `/pages/history-detail/index?startDate=${queryStartDate}&endDate=${queryEndDate}`
    });
    console.log('[ReportsPage] Query history:', queryStartDate, queryEndDate);
  };

  const handleExport = () => {
    Taro.showToast({ title: '报告已生成', icon: 'success' });
    console.log('[ReportsPage] Export report');
  };

  const handleHistoryReportClick = (index: number) => {
    setCurrentWeekIndex(index);
    console.log('[ReportsPage] View report:', index);
  };

  const trendText = {
    up: '上升',
    down: '下降',
    stable: '平稳'
  };

  const weekRangeText = currentReport
    ? `${dayjs(currentReport.weekStart).format('M月D日')} - ${dayjs(currentReport.weekEnd).format('M月D日')}`
    : '';

  const chartData = useMemo(() => {
    if (!currentReport) return [];
    return [
      { label: '步数', value: Math.round(currentReport.avgSteps / 1000), target: 8 },
      { label: '运动', value: Math.round(currentReport.totalExerciseMinutes / 60), target: 5 },
      { label: '饮水', value: currentReport.avgWaterCups, target: 8 },
      { label: '睡眠', value: currentReport.avgSleepHours, target: 8 }
    ];
  }, [currentReport]);

  const weekListText = useMemo(() => {
    if (currentWeekIndex === 0) return '本周';
    if (currentWeekIndex === 1) return '上周';
    return `${dayjs(weeklyReports[currentWeekIndex]?.weekStart).format('M月D日')}周`;
  }, [currentWeekIndex, weeklyReports]);

  return (
    <ScrollView scrollY className={styles.pageContainer} refresher-enabled refreshing={refreshing} onRefresherRefresh={handleRefresh}>
      <MemberSelector />

      <View className={styles.weekSelector}>
        <Button
          className={styles.weekNavBtn}
          onClick={() => setCurrentWeekIndex(Math.min(currentWeekIndex + 1, weeklyReports.length - 1))}
          disabled={currentWeekIndex >= weeklyReports.length - 1}
        >
          ‹
        </Button>
        <Text className={styles.weekLabel}>{weekListText}</Text>
        <Button
          className={styles.weekNavBtn}
          onClick={() => setCurrentWeekIndex(Math.max(currentWeekIndex - 1, 0))}
          disabled={currentWeekIndex <= 0}
        >
          ›
        </Button>
      </View>

      {currentReport ? (
        <View className={styles.reportCard}>
          <View className={styles.reportHeader}>
            <Text className={styles.reportTitle}>健康周报</Text>
            <Text className={styles.reportDate}>{weekRangeText}</Text>
          </View>

          <View className={styles.checkInRate}>
            <Text className={styles.checkInRateValue}>{currentReport.checkInRate}%</Text>
            <Text className={styles.checkInRateLabel}>本周打卡完成率</Text>
          </View>

          <View className={styles.reportStats}>
            <View className={styles.reportStat}>
              <Text className={styles.reportStatValue}>{(currentReport.avgSteps / 1000).toFixed(1)}k</Text>
              <Text className={styles.reportStatLabel}>日均步数</Text>
            </View>
            <View className={styles.reportStat}>
              <Text className={styles.reportStatValue}>{Math.round(currentReport.totalExerciseMinutes / 60)}h</Text>
              <Text className={styles.reportStatLabel}>总运动时长</Text>
            </View>
            <View className={styles.reportStat}>
              <Text className={styles.reportStatValue}>{currentReport.avgWaterCups.toFixed(1)}</Text>
              <Text className={styles.reportStatLabel}>日均饮水(杯)</Text>
            </View>
            <View className={styles.reportStat}>
              <Text className={styles.reportStatValue}>{currentReport.avgSleepHours.toFixed(1)}h</Text>
              <Text className={styles.reportStatLabel}>日均睡眠</Text>
            </View>
          </View>

          <DataChart
            title="周数据对比"
            data={chartData}
            color="#22c55e"
            showTargetLine
          />

          <View className={styles.suggestionsSection}>
            <Text className={styles.sectionSubtitle}>
              体重趋势
              <Text
                className={classnames(styles.trendIndicator, currentReport.weightTrend)}
                style={{ color: getTrendColor(currentReport.weightTrend) }}
              >
                {currentReport.weightTrend === 'up' && '↑'}
                {currentReport.weightTrend === 'down' && '↓'}
                {currentReport.weightTrend === 'stable' && '→'}
                {trendText[currentReport.weightTrend]}
              </Text>
            </Text>
          </View>

          <View className={styles.suggestionsSection}>
            <Text className={styles.sectionSubtitle}>💡 健康建议</Text>
            {currentReport.suggestions.map((suggestion, index) => (
              <View key={index} className={styles.suggestionItem}>
                <Text className={styles.suggestionIcon}>•</Text>
                <Text className={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </View>

          <View className={styles.achievementsSection}>
            <Text className={styles.sectionSubtitle}>🏆 本周成就</Text>
            {currentReport.achievements.map((achievement, index) => (
              <View key={index} className={styles.achievementItem}>
                <Text className={styles.achievementIcon}>✓</Text>
                <Text className={styles.achievementText}>{achievement}</Text>
              </View>
            ))}
          </View>

          <Button className={styles.exportBtn} onClick={handleExport}>
            导出完整报告
          </Button>
        </View>
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📊</Text>
          <Text className={styles.emptyText}>暂无周报数据</Text>
        </View>
      )}

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>历史周报</Text>
      </View>
      <View className={styles.historyReports}>
        {weeklyReports.slice(0, 5).map((report, index) => (
          <View
            key={index}
            className={styles.historyReportItem}
            onClick={() => handleHistoryReportClick(index)}
          >
            <View className={styles.historyReportHeader}>
              <Text className={styles.historyReportTitle}>
                {index === 0 ? '本周' : index === 1 ? '上周' : `第${weeklyReports.length - index}周`}
              </Text>
              <Text className={styles.historyReportRate}>{report.checkInRate}%</Text>
            </View>
            <Text className={styles.historyReportDate}>
              {dayjs(report.weekStart).format('M月D日')} - {dayjs(report.weekEnd).format('M月D日')}
            </Text>
          </View>
        ))}
      </View>

      <Text className={styles.sectionTitle}>历史数据查询</Text>
      <View className={styles.querySection}>
        <View className={styles.queryRow}>
          <View className={styles.queryItem}>
            <Text className={styles.queryLabel}>开始日期</Text>
            <Button className={styles.queryValue} onClick={() => handleSelectDate('start')}>
              {queryStartDate}
            </Button>
          </View>
          <View className={styles.queryItem}>
            <Text className={styles.queryLabel}>结束日期</Text>
            <Button className={styles.queryValue} onClick={() => handleSelectDate('end')}>
              {queryEndDate}
            </Button>
          </View>
        </View>
        <Button className={styles.queryBtn} onClick={handleQuery}>
          查询历史记录
        </Button>
      </View>
    </ScrollView>
  );
};

export default ReportsPage;
