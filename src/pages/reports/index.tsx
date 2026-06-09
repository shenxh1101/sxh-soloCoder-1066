import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import MemberSelector from '@/components/MemberSelector';
import DataChart from '@/components/DataChart';
import { useHealthStore } from '@/store/useHealthStore';
import { getTrendColor, calculateSleepHours } from '@/utils/healthUtils';
import type { WeeklyReport, DailyRecord, BodyRecord } from '@/types/health';

const ReportsPage: React.FC = () => {
  const currentMemberId = useHealthStore((state) => state.currentMemberId);
  const getWeeklyReports = useHealthStore((state) => state.getWeeklyReports);
  const getDailyRecords = useHealthStore((state) => state.getDailyRecords);
  const getCheckInStreak = useHealthStore((state) => state.getCheckInStreak);
  const getMember = useHealthStore((state) => state.getMember);
  const getBodyRecords = useHealthStore((state) => state.getBodyRecords);
  const members = useHealthStore((state) => state.members);

  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showQueryResults, setShowQueryResults] = useState(false);
  const [queryDays, setQueryDays] = useState<7 | 30 | 90>(7);
  const [queryMemberId, setQueryMemberId] = useState(currentMemberId);
  const [queryStartDate, setQueryStartDate] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [queryEndDate, setQueryEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [reportType, setReportType] = useState<'week' | 'month'>('week');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [refreshKey, setRefreshKey] = useState(0);

  const weeklyReports = getWeeklyReports(currentMemberId);
  const currentReport: WeeklyReport | undefined = weeklyReports[currentWeekIndex];
  const queryMember = getMember(queryMemberId);

  useDidShow(() => {
    console.log('[ReportsPage] Page showed, memberId:', currentMemberId);
    setQueryMemberId(currentMemberId);
    setRefreshKey((k) => k + 1);
  });

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  }, []);

  const handleSelectDateRange = (days: 7 | 30 | 90) => {
    const today = dayjs();
    const startDate = today.subtract(days - 1, 'day').format('YYYY-MM-DD');
    const endDate = today.format('YYYY-MM-DD');
    setQueryDays(days);
    setQueryStartDate(startDate);
    setQueryEndDate(endDate);
    console.log('[ReportsPage] Select date range:', days, 'days, from', startDate, 'to', endDate);
  };

  const handleQueryMemberChange = (memberId: string) => {
    setQueryMemberId(memberId);
    console.log('[ReportsPage] Query member changed to:', memberId);
  };

  const queryResults = useMemo(() => {
    const records = getDailyRecords(queryMemberId, queryStartDate, queryEndDate);
    const bodyRecords = getBodyRecords(queryMemberId);
    
    const start = dayjs(queryStartDate);
    const end = dayjs(queryEndDate);
    const totalDays = end.diff(start, 'day') + 1;
    
    const dayStats = [];
    for (let i = 0; i < totalDays; i++) {
      const date = start.add(i, 'day').format('YYYY-MM-DD');
      const record = records.find((r: DailyRecord) => r.date === date);
      const bodyRecord = bodyRecords.find((b: BodyRecord) => b.date === date);
      
      if (record) {
        const sleepHours = record.sleepStartTime && record.sleepEndTime
          ? calculateSleepHours(record.sleepStartTime, record.sleepEndTime)
          : record.sleepHours;
        
        dayStats.push({
          date: record.date,
          displayDate: dayjs(record.date).format('M/D'),
          weekday: dayjs(record.date).format('dd'),
          steps: record.steps,
          waterCups: record.waterCups,
          sleepHours: sleepHours,
          weight: bodyRecord?.weight || null,
          waistLine: bodyRecord?.waistLine || null,
          hasWeight: !!bodyRecord,
          hasRecord: true,
          checkInCount: record.checkInItems?.length || 0,
          checkInItems: record.checkInItems || [],
          isAbnormal: bodyRecord?.isAbnormal || false,
          abnormalItems: bodyRecord?.abnormalItems || []
        });
      } else {
        dayStats.push({
          date,
          displayDate: dayjs(date).format('M/D'),
          weekday: dayjs(date).format('dd'),
          steps: 0,
          waterCups: 0,
          sleepHours: 0,
          weight: null,
          waistLine: null,
          hasWeight: false,
          hasRecord: false,
          checkInCount: 0,
          checkInItems: [],
          isAbnormal: false,
          abnormalItems: []
        });
      }
    }

    const daysWithRecord = dayStats.filter(d => d.hasRecord);
    const summary = {
      totalDays: dayStats.length,
      avgSteps: daysWithRecord.length > 0 ? Math.round(daysWithRecord.reduce((sum, d) => sum + d.steps, 0) / daysWithRecord.length) : 0,
      totalWater: dayStats.reduce((sum, d) => sum + d.waterCups, 0),
      avgWater: daysWithRecord.length > 0 ? (daysWithRecord.reduce((sum, d) => sum + d.waterCups, 0) / daysWithRecord.length).toFixed(1) : '0',
      avgSleep: daysWithRecord.length > 0 ? (daysWithRecord.reduce((sum, d) => sum + d.sleepHours, 0) / daysWithRecord.length).toFixed(1) : '0',
      weightRecords: dayStats.filter(d => d.hasWeight).length,
      avgWeight: dayStats.filter(d => d.hasWeight).length > 0
        ? (dayStats.filter(d => d.hasWeight).reduce((sum, d) => sum + (d.weight || 0), 0) / dayStats.filter(d => d.hasWeight).length).toFixed(1)
        : '0',
      perfectDays: dayStats.filter(d => d.checkInCount >= 4).length,
      recordDays: daysWithRecord.length
    };

    const chartData = dayStats.map(d => ({
      label: d.displayDate,
      value: d.steps / 1000,
      target: 8
    }));

    return { dayStats, summary, chartData };
  }, [getDailyRecords, getBodyRecords, queryMemberId, queryStartDate, queryEndDate, refreshKey]);

  const monthlyReport = useMemo(() => {
    const monthStart = selectedMonth.startOf('month').format('YYYY-MM-DD');
    const monthEnd = selectedMonth.endOf('month').format('YYYY-MM-DD');
    const records = getDailyRecords(queryMemberId, monthStart, monthEnd);
    const bodyRecords = getBodyRecords(queryMemberId);
    const target = useHealthStore.getState().getTarget(queryMemberId);
    const streakData = useHealthStore.getState().getCheckInStreak(queryMemberId);

    const start = dayjs(monthStart);
    const end = dayjs(monthEnd);
    const totalDays = end.diff(start, 'day') + 1;
    
    const dayStats = [];
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    let prevDate: dayjs.Dayjs | null = null;

    for (let i = 0; i < totalDays; i++) {
      const date = start.add(i, 'day').format('YYYY-MM-DD');
      const record = records.find((r: DailyRecord) => r.date === date);
      const bodyRecord = bodyRecords.find((b: BodyRecord) => b.date === date);
      
      let hasCheckIn = false;
      let checkInCount = 0;
      if (record && record.checkInItems && record.checkInItems.length > 0) {
        hasCheckIn = true;
        checkInCount = record.checkInItems.length;
      }

      if (hasCheckIn) {
        if (prevDate === null) {
          tempStreak = 1;
        } else {
          const diff = dayjs(date).diff(prevDate, 'day');
          if (diff === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        if (tempStreak > maxStreak) maxStreak = tempStreak;
        prevDate = dayjs(date);
      } else {
        tempStreak = 0;
      }

      const sleepHours = record?.sleepStartTime && record?.sleepEndTime
        ? calculateSleepHours(record.sleepStartTime, record.sleepEndTime)
        : record?.sleepHours || 0;

      const isPerfectDay = checkInCount >= 4;
      const isStepsTarget = record?.steps >= target.steps;
      const isWaterTarget = record?.waterCups >= target.waterCups;
      const isSleepTarget = sleepHours >= target.sleepHours;
      const isExerciseTarget = record?.exerciseMinutes >= target.exerciseMinutes;

      dayStats.push({
        date,
        displayDate: start.add(i, 'day').format('M/D'),
        weekday: start.add(i, 'day').format('dd'),
        hasCheckIn,
        checkInCount,
        streak: tempStreak,
        isPerfectDay,
        isStepsTarget,
        isWaterTarget,
        isSleepTarget,
        isExerciseTarget,
        weight: bodyRecord?.weight || null,
        waistLine: bodyRecord?.waistLine || null,
        hasWeight: !!bodyRecord,
        isAbnormal: bodyRecord?.isAbnormal || false,
        abnormalItems: bodyRecord?.abnormalItems || []
      });
    }

    const daysWithRecord = records.length;
    const perfectDays = dayStats.filter(d => d.isPerfectDay).length;
    const abnormalDays = dayStats.filter(d => d.isAbnormal).length;
    const abnormalItemsList: string[] = [];
    dayStats.forEach(d => {
      if (d.abnormalItems && d.abnormalItems.length > 0) {
        d.abnormalItems.forEach(item => {
          if (!abnormalItemsList.includes(item)) {
            abnormalItemsList.push(item);
          }
        });
      }
    });

    const weightTrendData = dayStats
      .filter(d => d.hasWeight && d.weight)
      .map(d => ({ label: d.displayDate, value: d.weight as number }));

    const waistTrendData = dayStats
      .filter(d => d.waistLine)
      .map(d => ({ label: d.displayDate, value: d.waistLine as number }));

    const streakChartData = dayStats.map(d => ({
      label: d.displayDate,
      value: d.streak,
      target: 7
    }));

    return {
      month: selectedMonth.format('YYYY年M月'),
      totalDays,
      daysWithRecord,
      perfectDays,
      abnormalDays,
      abnormalItems: abnormalItemsList,
      currentStreak: streakData.current,
      maxStreakInMonth: maxStreak,
      avgStreak: streakData.current > 0 ? Math.round(records.length / totalDays * 100) : 0,
      weightTrendData,
      waistTrendData,
      streakChartData,
      dayStats,
      target
    };
  }, [getDailyRecords, getBodyRecords, queryMemberId, selectedMonth, refreshKey]);

  const handleQuery = () => {
    setShowQueryResults(true);
    console.log('[ReportsPage] Show query results for:', queryDays, 'days, member:', queryMemberId);
  };

  const handleViewDayDetail = (date: string) => {
    Taro.navigateTo({
      url: `/pages/history-detail/index?date=${date}&memberId=${queryMemberId}`
    });
    console.log('[ReportsPage] View day detail:', date, 'member:', queryMemberId);
  };

  const handleExport = () => {
    Taro.showToast({ title: '报告已生成', icon: 'success' });
    console.log('[ReportsPage] Export report');
  };

  const handleHistoryReportClick = (index: number) => {
    setCurrentWeekIndex(index);
    console.log('[ReportsPage] View report:', index);
  };

  const handlePrevMonth = () => {
    setSelectedMonth(selectedMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    const nextMonth = selectedMonth.add(1, 'month');
    if (nextMonth.isBefore(dayjs()) || nextMonth.isSame(dayjs(), 'month')) {
      setSelectedMonth(nextMonth);
    }
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

      <View className={styles.reportTypeTabs}>
        <Button
          className={classnames(styles.reportTypeTab, reportType === 'week' && styles.active)}
          onClick={() => setReportType('week')}
        >
          周报
        </Button>
        <Button
          className={classnames(styles.reportTypeTab, reportType === 'month' && styles.active)}
          onClick={() => setReportType('month')}
        >
          月报
        </Button>
      </View>

      {reportType === 'week' ? (
        <>
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
        </>
      ) : (
        <>
          <View className={styles.monthSelector}>
            <Button
              className={styles.monthNavBtn}
              onClick={handlePrevMonth}
            >
              ‹
            </Button>
            <Text className={styles.monthLabel}>{monthlyReport.month}</Text>
            <Button
              className={styles.monthNavBtn}
              onClick={handleNextMonth}
              disabled={selectedMonth.isSame(dayjs(), 'month')}
            >
              ›
            </Button>
          </View>

          <View className={styles.monthlyReportCard}>
            <View className={styles.reportHeader}>
              <Text className={styles.reportTitle}>健康月报</Text>
              <Text className={styles.reportDate}>{queryMember?.name || '成员'} · 月度汇总</Text>
            </View>

            <View className={styles.monthlyStats}>
              <View className={styles.monthlyStatItem}>
                <Text className={styles.monthlyStatValue}>{monthlyReport.totalDays}</Text>
                <Text className={styles.monthlyStatLabel}>总天数</Text>
              </View>
              <View className={styles.monthlyStatItem}>
                <Text className={styles.monthlyStatValue}>{monthlyReport.daysWithRecord}</Text>
                <Text className={styles.monthlyStatLabel}>记录天数</Text>
              </View>
              <View className={styles.monthlyStatItem}>
                <Text className={styles.monthlyStatValue}>{monthlyReport.perfectDays}</Text>
                <Text className={styles.monthlyStatLabel}>全勤天数</Text>
              </View>
              <View className={styles.monthlyStatItem}>
                <Text className={classnames(styles.monthlyStatValue, monthlyReport.abnormalDays > 0 && styles.danger)}>
                  {monthlyReport.abnormalDays}
                </Text>
                <Text className={styles.monthlyStatLabel}>异常天数</Text>
              </View>
            </View>

            <View className={styles.streakSummary}>
              <View className={styles.streakSummaryItem}>
                <Text className={styles.streakSummaryIcon}>🔥</Text>
                <View>
                  <Text className={styles.streakSummaryValue}>{monthlyReport.currentStreak}</Text>
                  <Text className={styles.streakSummaryLabel}>当前连续</Text>
                </View>
              </View>
              <View className={styles.streakSummaryItem}>
                <Text className={styles.streakSummaryIcon}>🏆</Text>
                <View>
                  <Text className={styles.streakSummaryValue}>{monthlyReport.maxStreakInMonth}</Text>
                  <Text className={styles.streakSummaryLabel}>本月最长</Text>
                </View>
              </View>
              <View className={styles.streakSummaryItem}>
                <Text className={styles.streakSummaryIcon}>📈</Text>
                <View>
                  <Text className={styles.streakSummaryValue}>{monthlyReport.avgStreak}%</Text>
                  <Text className={styles.streakSummaryLabel}>打卡率</Text>
                </View>
              </View>
            </View>

            <DataChart
              title="连续打卡走势"
              data={monthlyReport.streakChartData.slice(-14)}
              color="#22c55e"
              showTargetLine
            />

            {monthlyReport.weightTrendData.length > 0 && (
              <DataChart
                title="体重趋势 (kg)"
                data={monthlyReport.weightTrendData}
                color="#22c55e"
              />
            )}

            {monthlyReport.waistTrendData.length > 0 && (
              <DataChart
                title="腰围趋势 (cm)"
                data={monthlyReport.waistTrendData}
                color="#f97316"
              />
            )}

            {monthlyReport.abnormalItems.length > 0 && (
              <View className={styles.abnormalSummary}>
                <Text className={styles.sectionSubtitle}>⚠️ 异常指标汇总</Text>
                <View className={styles.abnormalItemList}>
                  {monthlyReport.abnormalItems.map((item, index) => (
                    <Text key={index} className={styles.abnormalItemTag}>
                      {item}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            <Text className={styles.sectionSubtitle}>📅 每日打卡详情</Text>
            <View className={styles.monthlyDayList}>
              {monthlyReport.dayStats.slice().reverse().map((day) => (
                <View
                  key={day.date}
                  className={classnames(
                    styles.monthlyDayItem,
                    !day.hasCheckIn && styles.noRecord
                  )}
                  onClick={() => day.hasCheckIn && handleViewDayDetail(day.date)}
                >
                  <View className={styles.monthlyDayHeader}>
                    <Text className={styles.monthlyDayDate}>
                      {day.displayDate} {day.weekday}
                      {!day.hasCheckIn && ' · 未打卡'}
                    </Text>
                    {day.isPerfectDay && (
                      <Text className={styles.perfectBadge}>全勤</Text>
                    )}
                  </View>
                  {day.hasCheckIn && (
                    <View className={styles.monthlyDayCheckin}>
                      {['steps', 'water', 'exercise', 'sleep'].map((type) => (
                        <Text
                          key={type}
                          className={classnames(
                            styles.checkinDot,
                            day[`is${type.charAt(0).toUpperCase() + type.slice(1)}Target`] && styles.completed
                          )}
                        >
                          {type === 'steps' && '👟'}
                          {type === 'water' && '💧'}
                          {type === 'exercise' && '🏃'}
                          {type === 'sleep' && '😴'}
                        </Text>
                      ))}
                    </View>
                  )}
                  {day.hasCheckIn && (
                    <View className={styles.monthlyDayStats}>
                      {day.weight && (
                        <Text className={styles.monthlyDayStat}>⚖️ {day.weight}kg</Text>
                      )}
                      {day.waistLine && (
                        <Text className={styles.monthlyDayStat}>📏 {day.waistLine}cm</Text>
                      )}
                      {day.isAbnormal && (
                        <Text className={styles.monthlyDayAbnormal}>⚠️ 异常</Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      <Text className={styles.sectionTitle}>历史数据查询</Text>
      <View className={styles.querySection}>
        <Text className={styles.querySubtitle}>选择成员</Text>
        <View className={styles.queryMemberSelector}>
          {members.map((member) => (
            <Button
              key={member.id}
              className={classnames(styles.queryMemberBtn, queryMemberId === member.id && styles.active)}
              onClick={() => handleQueryMemberChange(member.id)}
            >
              <Text className={styles.queryMemberAvatar}>{member.name.charAt(0)}</Text>
              <Text className={styles.queryMemberName}>{member.name}</Text>
            </Button>
          ))}
        </View>

        <Text className={styles.querySubtitle}>选择时间范围</Text>
        <View className={styles.dateRangeTabs}>
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              className={classnames(styles.dateRangeTab, queryDays === days && styles.active)}
              onClick={() => handleSelectDateRange(days as 7 | 30 | 90)}
            >
              最近{days}天
            </Button>
          ))}
        </View>

        <View className={styles.queryDateInfo}>
          <Text className={styles.queryDateText}>
            {queryStartDate} 至 {queryEndDate}
          </Text>
          <Text className={styles.queryDateHint}>共 {queryResults.summary.totalDays} 天数据</Text>
        </View>

        <Button className={styles.queryBtn} onClick={handleQuery}>
          {showQueryResults ? '刷新查询结果' : '查询历史记录'}
        </Button>
      </View>

      {showQueryResults && (
        <View className={styles.queryResults}>
          <View className={styles.queryResultsHeader}>
            <Text className={styles.queryResultsTitle}>
              {queryMember?.name} · 最近{queryDays}天数据
            </Text>
            <Text className={styles.queryResultsSubtitle}>
              {queryStartDate} ~ {queryEndDate}
            </Text>
          </View>

          <View className={styles.querySummary}>
            <View className={styles.querySummaryItem}>
              <Text className={styles.querySummaryValue}>{(queryResults.summary.avgSteps / 1000).toFixed(1)}k</Text>
              <Text className={styles.querySummaryLabel}>日均步数</Text>
            </View>
            <View className={styles.querySummaryItem}>
              <Text className={styles.querySummaryValue}>{queryResults.summary.avgWater}</Text>
              <Text className={styles.querySummaryLabel}>日均饮水(杯)</Text>
            </View>
            <View className={styles.querySummaryItem}>
              <Text className={styles.querySummaryValue}>{queryResults.summary.avgSleep}h</Text>
              <Text className={styles.querySummaryLabel}>日均睡眠</Text>
            </View>
            <View className={styles.querySummaryItem}>
              <Text className={styles.querySummaryValue}>{queryResults.summary.perfectDays}</Text>
              <Text className={styles.querySummaryLabel}>全勤天数</Text>
            </View>
          </View>

          <DataChart
            title={`最近${queryDays}天步数趋势`}
            data={queryResults.chartData.slice(-Math.min(queryDays, 14))}
            color="#22c55e"
            showTargetLine
          />

          <Text className={styles.sectionSubtitle}>每日详情</Text>
          <View className={styles.dailyDetailList}>
            {queryResults.dayStats.slice().reverse().map((day) => (
              <View
                key={day.date}
                className={classnames(
                  styles.dailyDetailItem,
                  !day.hasRecord && styles.noRecord
                )}
                onClick={() => day.hasRecord && handleViewDayDetail(day.date)}
              >
                <View className={styles.dailyDetailHeader}>
                  <Text className={classnames(
                    styles.dailyDetailDate,
                    !day.hasRecord && styles.noRecordText
                  )}>
                    {day.displayDate} {day.weekday}
                    {!day.hasRecord && ' · 暂无记录'}
                  </Text>
                  {day.hasRecord && (
                    <View className={styles.dailyDetailCheckin}>
                      {['steps', 'water', 'exercise', 'sleep'].map((type) => (
                        <Text
                          key={type}
                          className={classnames(
                            styles.checkinDot,
                            day.checkInItems.includes(type) && styles.completed
                          )}
                        >
                          {type === 'steps' && '👟'}
                          {type === 'water' && '💧'}
                          {type === 'exercise' && '🏃'}
                          {type === 'sleep' && '😴'}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
                {day.hasRecord ? (
                  <View className={styles.dailyDetailStats}>
                    <View className={styles.dailyStat}>
                      <Text className={styles.dailyStatIcon}>👟</Text>
                      <Text className={styles.dailyStatValue}>{day.steps.toLocaleString()} 步</Text>
                    </View>
                    <View className={styles.dailyStat}>
                      <Text className={styles.dailyStatIcon}>💧</Text>
                      <Text className={styles.dailyStatValue}>{day.waterCups} 杯</Text>
                    </View>
                    <View className={styles.dailyStat}>
                      <Text className={styles.dailyStatIcon}>😴</Text>
                      <Text className={styles.dailyStatValue}>{day.sleepHours}h</Text>
                    </View>
                    {day.hasWeight && day.weight && (
                      <View className={styles.dailyStat}>
                        <Text className={styles.dailyStatIcon}>⚖️</Text>
                        <Text className={styles.dailyStatValue}>{day.weight}kg</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View className={styles.emptyDay}>
                    <Text className={styles.emptyDayText}>当天未记录任何数据</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ReportsPage;
