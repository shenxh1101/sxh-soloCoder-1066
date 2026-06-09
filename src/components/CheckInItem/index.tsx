import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface CheckInItemProps {
  icon: string;
  title: string;
  value: string | number;
  target: string | number;
  unit?: string;
  checked: boolean;
  onCheck?: () => void;
  onRecord?: () => void;
  color?: string;
  showRecordButton?: boolean;
}

const CheckInItem: React.FC<CheckInItemProps> = ({
  icon,
  title,
  value,
  target,
  unit,
  checked,
  onCheck,
  onRecord,
  color,
  showRecordButton = true
}) => {
  return (
    <View className={styles.item}>
      <View className={styles.left}>
        <View
          className={classnames(styles.iconWrap, checked && styles.checked)}
          style={{ backgroundColor: checked ? color : undefined }}
        >
          <Text className={styles.icon}>{icon}</Text>
        </View>
        <View className={styles.info}>
          <Text className={styles.title}>{title}</Text>
          <View className={styles.progress}>
            <Text className={styles.value}>{value}</Text>
            <Text className={styles.separator}>/</Text>
            <Text className={styles.target}>{target}</Text>
            {unit && <Text className={styles.unit}>{unit}</Text>}
          </View>
        </View>
      </View>
      <View className={styles.right}>
        {showRecordButton && (
          <Button
            className={classnames(styles.recordBtn, checked && styles.checkedBtn)}
            style={{ borderColor: color, color: checked ? '#fff' : color }}
            onClick={onRecord}
          >
            记录
          </Button>
        )}
        <View
          className={classnames(styles.checkBox, checked && styles.checked)}
          style={{
            backgroundColor: checked ? color : undefined,
            borderColor: color
          }}
          onClick={onCheck}
        >
          {checked && <Text className={styles.checkIcon}>✓</Text>}
        </View>
      </View>
    </View>
  );
};

export default CheckInItem;
