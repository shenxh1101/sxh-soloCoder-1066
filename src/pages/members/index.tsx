import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, Button, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useHealthStore } from '@/store/useHealthStore';
import { calculateStreak, calculateCompletionRate } from '@/utils/healthUtils';
import type { Member } from '@/types/health';

const avatarColors = ['primary', 'orange', 'purple', 'blue'];
const relationOptions = ['本人', '配偶', '父亲', '母亲', '儿子', '女儿', '其他'];

const MembersPage: React.FC = () => {
  const members = useHealthStore((state) => state.members);
  const currentMemberId = useHealthStore((state) => state.currentMemberId);
  const getDailyRecordsByMember = useHealthStore((state) => state.getDailyRecordsByMember);
  const setCurrentMember = useHealthStore((state) => state.setCurrentMember);
  const addMember = useHealthStore((state) => state.addMember);
  const deleteMember = useHealthStore((state) => state.deleteMember);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [newAge, setNewAge] = useState('');
  const [newHeight, setNewHeight] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useDidShow(() => {
    setRefreshKey((k) => k + 1);
    console.log('[MembersPage] Page showed, refresh data, members count:', members.length);
  });

  const getMemberStats = useCallback((memberId: string) => {
    const records = getDailyRecordsByMember(memberId);
    const streak = calculateStreak(records);
    const completionRate = calculateCompletionRate(records, 30);
    return { streak, completionRate };
  }, [getDailyRecordsByMember, refreshKey]);

  const handleSelectMember = (memberId: string) => {
    setCurrentMember(memberId);
    Taro.showToast({ title: '已切换', icon: 'success' });
    console.log('[MembersPage] Switch to member:', memberId);
    setTimeout(() => {
      Taro.navigateBack();
    }, 1000);
  };

  const handleDeleteMember = (e: React.MouseEvent, member: Member) => {
    e.stopPropagation();
    if (member.id === currentMemberId) {
      Taro.showToast({ title: '不能删除当前成员', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '删除成员',
      content: `确定删除「${member.name}」及其所有数据吗？此操作不可恢复。`,
      confirmColor: '#ef4444',
      success: (res) => {
        if (res.confirm) {
          deleteMember(member.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
          console.log('[MembersPage] Delete member:', member.id);
        }
      }
    });
  };

  const handleAddMember = () => {
    if (!newName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!newHeight || Number(newHeight) < 50 || Number(newHeight) > 250) {
      Taro.showToast({ title: '请输入有效身高', icon: 'none' });
      return;
    }

    const newMember: Member = {
      id: Date.now().toString(),
      name: newName.trim(),
      gender: newGender,
      age: Number(newAge) || 30,
      height: Number(newHeight),
      relation: newRelation || '其他',
      avatar: '',
      createdAt: new Date().toISOString()
    };

    addMember(newMember);
    console.log('[MembersPage] Add new member:', newMember);
    Taro.showToast({ title: '添加成功', icon: 'success' });
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewName('');
    setNewGender('male');
    setNewAge('');
    setNewHeight('');
    setNewRelation('');
  };

  return (
    <View className={styles.pageContainer}>
      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>
          👨‍👩‍👧‍👦 家庭成员
        </Text>
        <Text className={styles.tipContent}>
          切换成员查看不同家人的健康数据，支持添加多位家庭成员共同管理。
        </Text>
      </View>

      <Text className={styles.sectionTitle}>已添加成员</Text>
      <View className={styles.memberList}>
        {members.map((member, index) => {
          const stats = getMemberStats(member.id);
          return (
            <View
              key={member.id}
              className={classnames(
                styles.memberCard,
                member.id === currentMemberId && styles.active
              )}
              onClick={() => handleSelectMember(member.id)}
            >
              {member.id === currentMemberId && (
                <Text className={styles.activeBadge}>当前</Text>
              )}
              <View className={classnames(styles.memberAvatar, styles[avatarColors[index % avatarColors.length]])}>
                {member.name.charAt(0)}
              </View>
              <View className={styles.memberInfo}>
                <Text className={styles.memberName}>{member.name}</Text>
                <Text className={styles.memberDesc}>
                  {member.relation} · {member.gender === 'male' ? '男' : '女'} · {member.age}岁 · {member.height}cm
                </Text>
                <View className={styles.memberStats}>
                  <Text className={styles.memberStatItem}>
                    🔥 连续打卡 {stats.streak.current} 天
                  </Text>
                  <Text className={styles.memberStatItem}>
                    🏆 最长 {stats.streak.longest} 天
                  </Text>
                  <Text className={styles.memberStatItem}>
                    ✅ 完成率 {stats.completionRate}%
                  </Text>
                </View>
              </View>
              <View className={styles.memberActions}>
                {member.id !== currentMemberId && (
                  <Button
                    className={classnames(styles.actionBtn, styles.primary)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectMember(member.id);
                    }}
                  >
                    切换
                  </Button>
                )}
                {members.length > 1 && (
                  <Button
                    className={classnames(styles.actionBtn, styles.danger)}
                    onClick={(e) => handleDeleteMember(e, member)}
                  >
                    删除
                  </Button>
                )}
              </View>
            </View>
          );
        })}

        <Button
          className={styles.addCard}
          onClick={() => setShowAddModal(true)}
        >
          <Text className={styles.addIcon}>+</Text>
          <Text className={styles.addText}>添加新成员</Text>
        </Button>
      </View>

      {showAddModal && (
        <View className={styles.modalOverlay} onClick={handleCloseModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>添加新成员</Text>
            <View className={styles.modalForm}>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>姓名</Text>
                <Input
                  className={styles.formInput}
                  placeholder="请输入姓名"
                  value={newName}
                  onInput={(e) => setNewName(e.detail.value)}
                  maxlength={10}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>性别</Text>
                <View className={styles.genderOptions}>
                  <Button
                    className={classnames(styles.genderOption, newGender === 'male' && styles.active)}
                    onClick={() => setNewGender('male')}
                  >
                    男
                  </Button>
                  <Button
                    className={classnames(styles.genderOption, newGender === 'female' && styles.active)}
                    onClick={() => setNewGender('female')}
                  >
                    女
                  </Button>
                </View>
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>年龄</Text>
                <Input
                  className={styles.formInput}
                  type="number"
                  placeholder="请输入年龄"
                  value={newAge}
                  onInput={(e) => setNewAge(e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>身高（cm）</Text>
                <Input
                  className={styles.formInput}
                  type="digit"
                  placeholder="请输入身高"
                  value={newHeight}
                  onInput={(e) => setNewHeight(e.detail.value)}
                />
              </View>
              <View className={styles.formItem}>
                <Text className={styles.formLabel}>与本人关系</Text>
                <View className={styles.relationOptions}>
                  {relationOptions.map((rel) => (
                    <Button
                      key={rel}
                      className={classnames(styles.relationOption, newRelation === rel && styles.active)}
                      onClick={() => setNewRelation(rel)}
                    >
                      {rel}
                    </Button>
                  ))}
                </View>
              </View>
            </View>
            <View className={styles.modalButtons}>
              <Button
                className={classnames(styles.modalBtn, styles.cancel)}
                onClick={handleCloseModal}
              >
                取消
              </Button>
              <Button
                className={classnames(styles.modalBtn, styles.confirm)}
                onClick={handleAddMember}
              >
                添加
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default MembersPage;
