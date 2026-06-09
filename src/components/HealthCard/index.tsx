import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface HealthCardProps {
  icon: string;
  title: string;
  value: string | number;
  unit?: string;
  status?: string;
  statusColor?: string;
  onClick?: () => void;
  gradient?: string;
}

const HealthCard: React.FC<HealthCardProps> = ({
  icon,
  title,
  value,
  unit,
  status,
  statusColor,
  onClick,
  gradient
}) => {
  return (
    <View
      className={classnames(styles.card, onClick && styles.clickable)}
      style={gradient ? { background: gradient } : undefined}
      onClick={onClick}
    >
      <View className={styles.iconWrap}>
        <Text className={styles.icon}>{icon}</Text>
      </View>
      <View className={styles.content}>
        <Text className={styles.title}>{title}</Text>
        <View className={styles.valueRow}>
          <Text className={styles.value}>{value}</Text>
          {unit && <Text className={styles.unit}>{unit}</Text>}
        </View>
        {status && (
          <Text className={styles.status} style={{ color: statusColor }}>
            {status}
          </Text>
        )}
      </View>
    </View>
  );
};

export default HealthCard;
