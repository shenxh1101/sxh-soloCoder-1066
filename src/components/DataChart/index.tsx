import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface DataPoint {
  label: string;
  value: number;
  target?: number;
}

interface DataChartProps {
  title: string;
  data: DataPoint[];
  unit?: string;
  color?: string;
  showTargetLine?: boolean;
}

const DataChart: React.FC<DataChartProps> = ({
  title,
  data,
  unit = '',
  color = '#22c55e',
  showTargetLine = false
}) => {
  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.target || 0)), 10);
  const chartHeight = 200;

  return (
    <View className={styles.chartContainer}>
      <Text className={styles.title}>{title}</Text>
      <View className={styles.chart}>
        {data.map((point, index) => {
          const height = (point.value / maxValue) * chartHeight;
          const targetHeight = point.target ? (point.target / maxValue) * chartHeight : 0;

          return (
            <View key={index} className={styles.barGroup}>
              <View className={styles.bars}>
                {showTargetLine && point.target && (
                  <View
                    className={styles.targetLine}
                    style={{ bottom: `${targetHeight}rpx` }}
                  />
                )}
                <View
                  className={styles.bar}
                  style={{
                    height: `${height}rpx`,
                    backgroundColor: color
                  }}
                />
              </View>
              <Text className={styles.valueLabel}>
                {point.value}
                {unit}
              </Text>
              <Text className={styles.xLabel}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default DataChart;
