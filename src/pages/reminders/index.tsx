import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Button, Input, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import MemberSelector from '@/components/MemberSelector';
import { useHealthStore } from '@/store/useHealthStore';
import type { Reminder } from '@/types/health';

type ReminderType = 'all' | 'medicine' | 'water' | 'exercise' | 'sleep' | 'exam';

const typeConfig = {
  medicine: { icon: '💊', label: '用药', color: 'rgba(239, 68, 68, 0.1)', textColor: '#ef4444' },
  water: { icon: '💧', label: '喝水', color: 'rgba(59, 130, 246, 0.1)', textColor: '#3b82f6' },
  exercise: { icon: '🏃', label: '运动', color: 'rgba(249, 115, 22, 0.1)', textColor: '#f97316' },
  sleep: { icon: '😴', label: '睡眠', color: 'rgba(139, 92, 246, 0.1)', textColor: '#8b5cf6' },
  exam: { icon: '🏥', label: '体检', color: 'rgba(34, 197, 94, 0.1)', textColor: '#22c55e' }
};

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const RemindersPage: React.FC = () => {
  const currentMemberId = useHealthStore((state) => state.currentMemberId);
  const getReminders = useHealthStore((state) => state.getReminders);
  const addReminder = useHealthStore((state) => state.addReminder);
  const toggleReminder = useHealthStore((state) => state.toggleReminder);
  const deleteReminder = useHealthStore((state) => state.deleteReminder);

  const [activeType, setActiveType] = useState<ReminderType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<Reminder['type']>('medicine');
  const [newTitle, setNewTitle] = useState('');
  const [newMedicineName, setNewMedicineName] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newRepeatDays, setNewRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [newNotes, setNewNotes] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const reminders = useMemo(() => {
    return getReminders(currentMemberId);
  }, [currentMemberId, refreshKey, getReminders]);

  useDidShow(() => {
    setRefreshKey((k) => k + 1);
    console.log('[RemindersPage] Page showed, refresh data, memberId:', currentMemberId);
  });

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Taro.stopPullDownRefresh();
    }, 1000);
  }, []);

  const handleAddReminder = () => {
    Taro.showActionSheet({
      itemList: ['用药提醒', '喝水提醒', '运动提醒', '睡眠提醒', '体检提醒'],
      success: (res) => {
        const types: Reminder['type'][] = ['medicine', 'water', 'exercise', 'sleep', 'exam'];
        const type = types[res.tapIndex];
        console.log('[RemindersPage] Add reminder type:', type);
        setAddType(type);
        setNewTitle(typeConfig[type].label + '提醒');
        setNewMedicineName('');
        setNewTime(type === 'medicine' ? '08:00' : type === 'sleep' ? '22:30' : '09:00');
        setNewRepeatDays(type === 'exam' ? [] : [0, 1, 2, 3, 4, 5, 6]);
        setNewNotes('');
        setShowAddModal(true);
      }
    });
  };

  const handleToggle = (id: string) => {
    toggleReminder(id);
    setRefreshKey((k) => k + 1);
    console.log('[RemindersPage] Toggle reminder:', id);
  };

  const handleDelete = (id: string, title: string) => {
    Taro.showModal({
      title: '删除提醒',
      content: `确定删除"${title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          deleteReminder(id);
          setRefreshKey((k) => k + 1);
          Taro.showToast({ title: '已删除', icon: 'success' });
          console.log('[RemindersPage] Delete reminder:', id);
        }
      }
    });
  };

  const handleQuickAdd = (type: Reminder['type']) => {
    const defaults = {
      medicine: { title: '吃药提醒', time: '08:00' },
      water: { title: '喝水提醒', time: '09:00' },
      exercise: { title: '运动提醒', time: '18:00' },
      sleep: { title: '睡觉提醒', time: '22:30' },
      exam: { title: '体检提醒', time: '08:00' }
    };

    const newReminder: Reminder = {
      id: Date.now().toString(),
      memberId: currentMemberId,
      type,
      title: defaults[type].title,
      time: defaults[type].time,
      repeatDays: type === 'exam' ? [] : [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      notes: ''
    };

    addReminder(newReminder);
    setRefreshKey((k) => k + 1);
    Taro.showToast({ title: '已添加提醒', icon: 'success' });
    console.log('[RemindersPage] Quick add reminder:', newReminder);
  };

  const handleToggleRepeatDay = (day: number) => {
    setNewRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveReminder = () => {
    if (!newTitle.trim()) {
      Taro.showToast({ title: '请输入提醒标题', icon: 'none' });
      return;
    }
    if (!newTime) {
      Taro.showToast({ title: '请选择提醒时间', icon: 'none' });
      return;
    }

    const newReminder: Reminder = {
      id: Date.now().toString(),
      memberId: currentMemberId,
      type: addType,
      title: newTitle.trim(),
      medicineName: addType === 'medicine' ? newMedicineName.trim() || undefined : undefined,
      time: newTime,
      repeatDays: [...newRepeatDays],
      enabled: true,
      notes: newNotes.trim()
    };

    addReminder(newReminder);
    setRefreshKey((k) => k + 1);
    console.log('[RemindersPage] Save reminder:', newReminder);
    Taro.showToast({ title: '添加成功', icon: 'success' });
    setShowAddModal(false);
  };

  const filteredReminders = useMemo(() => {
    if (activeType === 'all') return reminders;
    return reminders.filter((r) => r.type === activeType);
  }, [reminders, activeType]);

  const sortedReminders = useMemo(() => {
    return [...filteredReminders].sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredReminders]);

  const getRepeatText = (repeatDays: number[]) => {
    if (repeatDays.length === 0) return '仅一次';
    if (repeatDays.length === 7) return '每天';
    if (repeatDays.length === 5 && repeatDays.every((d) => d >= 1 && d <= 5)) return '工作日';
    return repeatDays.map((d) => weekDays[d]).join('、');
  };

  const tabs: Array<{ type: ReminderType; label: string }> = [
    { type: 'all', label: '全部' },
    { type: 'medicine', label: '用药' },
    { type: 'water', label: '喝水' },
    { type: 'exercise', label: '运动' },
    { type: 'sleep', label: '睡眠' },
    { type: 'exam', label: '体检' }
  ];

  const quickAddItems = [
    { type: 'medicine' as const, icon: '💊', text: '吃药提醒' },
    { type: 'water' as const, icon: '💧', text: '喝水提醒' },
    { type: 'exercise' as const, icon: '🏃', text: '运动提醒' },
    { type: 'sleep' as const, icon: '😴', text: '睡觉提醒' }
  ];

  return (
    <ScrollView scrollY className={styles.pageContainer} refresher-enabled refreshing={refreshing} onRefresherRefresh={handleRefresh}>
      <MemberSelector />

      <Button className={styles.addBtn} onClick={handleAddReminder}>
        + 添加提醒
      </Button>

      <Text className={styles.sectionTitle}>快速添加</Text>
      <View className={styles.quickAdd}>
        {quickAddItems.map((item, index) => (
          <View
            key={index}
            className={styles.quickAddItem}
            onClick={() => handleQuickAdd(item.type)}
          >
            <Text className={styles.quickAddIcon}>{item.icon}</Text>
            <Text className={styles.quickAddText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <View className={styles.typeTabs}>
        {tabs.map((tab) => (
          <Button
            key={tab.type}
            className={classnames(styles.typeTab, activeType === tab.type && styles.active)}
            onClick={() => setActiveType(tab.type)}
          >
            {tab.label}
          </Button>
        ))}
      </View>

      <Text className={styles.sectionTitle}>
        我的提醒 ({sortedReminders.length})
      </Text>

      {sortedReminders.length === 0 ? (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🔔</Text>
          <Text className={styles.emptyText}>暂无提醒</Text>
          <Button className={styles.addBtn} onClick={handleAddReminder}>
            添加第一个提醒
          </Button>
        </View>
      ) : (
        <View className={styles.reminderList}>
          {sortedReminders.map((reminder) => {
            const config = typeConfig[reminder.type];
            return (
              <View key={reminder.id} className={styles.reminderItem}>
                <View
                  className={styles.reminderIconWrap}
                  style={{ backgroundColor: config.color }}
                >
                  <Text className={styles.reminderIcon}>{config.icon}</Text>
                </View>
                <View className={styles.reminderContent}>
                  <View className={styles.reminderHeader}>
                    <Text className={styles.reminderTitle}>{reminder.title}</Text>
                    <Text className={styles.reminderTime}>{reminder.time}</Text>
                  </View>
                  <View className={styles.reminderMeta}>
                    <Text
                      className={styles.reminderType}
                      style={{ backgroundColor: config.color, color: config.textColor }}
                    >
                      {config.label}
                    </Text>
                    <Text className={styles.reminderRepeat}>
                      {getRepeatText(reminder.repeatDays)}
                    </Text>
                  </View>
                  {reminder.medicineName && (
                    <Text className={styles.reminderMedicine}>💊 {reminder.medicineName}</Text>
                  )}
                  {reminder.notes && (
                    <Text className={styles.reminderNotes}>{reminder.notes}</Text>
                  )}
                </View>
                <View className={styles.reminderActions}>
                  <View
                    className={classnames(styles.switch, reminder.enabled && styles.active)}
                    onClick={() => handleToggle(reminder.id)}
                  >
                    <View className={styles.switchHandle} />
                  </View>
                  <Text
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(reminder.id, reminder.title)}
                  >
                    删除
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {sortedReminders.filter((r) => r.type === 'medicine').length > 0 && (
        <>
          <Text className={styles.sectionTitle}>用药提醒</Text>
          <View className={styles.reminderList}>
            {sortedReminders
              .filter((r) => r.type === 'medicine')
              .map((reminder) => {
                const config = typeConfig[reminder.type];
                return (
                  <View key={reminder.id} className={styles.reminderItem}>
                    <View
                      className={styles.reminderIconWrap}
                      style={{ backgroundColor: config.color }}
                    >
                      <Text className={styles.reminderIcon}>{config.icon}</Text>
                    </View>
                    <View className={styles.reminderContent}>
                      <View className={styles.reminderHeader}>
                        <Text className={styles.reminderTitle}>{reminder.title}</Text>
                        <Text className={styles.reminderTime}>{reminder.time}</Text>
                      </View>
                      <View className={styles.reminderMeta}>
                        <Text
                          className={styles.reminderType}
                          style={{ backgroundColor: config.color, color: config.textColor }}
                        >
                          {config.label}
                        </Text>
                        <Text className={styles.reminderRepeat}>
                          {getRepeatText(reminder.repeatDays)}
                        </Text>
                      </View>
                      {reminder.medicineName && (
                        <Text className={styles.reminderMedicine}>💊 {reminder.medicineName}</Text>
                      )}
                      {reminder.notes && (
                        <Text className={styles.reminderNotes}>{reminder.notes}</Text>
                      )}
                    </View>
                    <View className={styles.reminderActions}>
                      <View
                        className={classnames(styles.switch, reminder.enabled && styles.active)}
                        onClick={() => handleToggle(reminder.id)}
                      >
                        <View className={styles.switchHandle} />
                      </View>
                      <Text
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(reminder.id, reminder.title)}
                      >
                        删除
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        </>
      )}

      {showAddModal && (
        <View className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>添加{typeConfig[addType].label}提醒</Text>
            <View className={styles.modalForm}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>提醒标题</Text>
                <Input
                  className={styles.formInput}
                  placeholder="请输入提醒标题"
                  value={newTitle}
                  onInput={(e) => setNewTitle(e.detail.value)}
                  maxlength={20}
                />
              </View>
              {addType === 'medicine' && (
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>药品名称</Text>
                  <Input
                    className={styles.formInput}
                    placeholder="请输入药品名称（可选）"
                    value={newMedicineName}
                    onInput={(e) => setNewMedicineName(e.detail.value)}
                    maxlength={30}
                  />
                </View>
              )}
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>提醒时间</Text>
                <Input
                  className={styles.formInput}
                  placeholder="例如：08:00"
                  value={newTime}
                  onInput={(e) => setNewTime(e.detail.value)}
                />
              </View>
              {addType !== 'exam' && (
                <View className={styles.formItem}>
                  <Text className={styles.formLabel}>重复日期</Text>
                  <View className={styles.weekDaySelect}>
                    {weekDays.map((day, index) => (
                      <Button
                        key={index}
                        className={classnames(
                          styles.weekDayBtn,
                          newRepeatDays.includes(index) && styles.active
                        )}
                        onClick={() => handleToggleRepeatDay(index)}
                      >
                        {day}
                      </Button>
                    ))}
                  </View>
                </View>
              )}
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>备注</Text>
                <Textarea
                  className={styles.formTextarea}
                  placeholder="可选：填写剂量、注意事项等..."
                  value={newNotes}
                  onInput={(e) => setNewNotes(e.detail.value)}
                />
              </View>
            </View>
            <View className={styles.modalButtons}>
              <Button
                className={classnames(styles.modalBtn, styles.cancel)}
                onClick={() => setShowAddModal(false)}
              >
                取消
              </Button>
              <Button
                className={classnames(styles.modalBtn, styles.confirm)}
                onClick={handleSaveReminder}
              >
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default RemindersPage;
