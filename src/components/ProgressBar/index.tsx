import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface ProgressBarProps {
  value: number;
  target: number;
  label: string;
  color?: string;
  showPercent?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  target,
  label,
  color,
  showPercent = true,
  size = 'medium'
}) => {
  const percent = target > 0 ? Math.min((value / target) * 100, 100) : 0;

  return (
    <View className={classnames(styles.progressBar, styles[size])}>
      <View className={styles.header}>
        <Text className={styles.label}>{label}</Text>
        <View className={styles.values}>
          <Text className={styles.value}>{value}</Text>
          <Text className={styles.separator}>/</Text>
          <Text className={styles.target}>{target}</Text>
          {showPercent && (
            <Text className={styles.percent}>{Math.round(percent)}%</Text>
          )}
        </View>
      </View>
      <View className={styles.barContainer}>
        <View
          className={styles.barFill}
          style={{
            width: `${percent}%`,
            backgroundColor: color || 'var(--color-primary, #22c55e)'
          }}
        />
      </View>
    </View>
  );
};

export default ProgressBar;
