import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useHealthStore } from '@/store/useHealthStore';

interface MemberSelectorProps {
  showAddButton?: boolean;
}

const MemberSelector: React.FC<MemberSelectorProps> = ({ showAddButton = true }) => {
  const { members, currentMemberId, setCurrentMember } = useHealthStore();

  const handleMemberClick = (memberId: string) => {
    setCurrentMember(memberId);
    Taro.showToast({ title: '已切换成员', icon: 'success' });
  };

  const handleAddMember = () => {
    Taro.navigateTo({ url: '/pages/members/index' });
  };

  return (
    <ScrollView scrollX className={styles.container} enableFlex>
      {members.map((member) => (
        <View
          key={member.id}
          className={classnames(styles.memberItem, member.id === currentMemberId && styles.active)}
          onClick={() => handleMemberClick(member.id)}
        >
          <View className={styles.avatarWrap}>
            <Text className={styles.avatar}>{member.avatar ? '' : member.name.charAt(0)}</Text>
            {member.id === currentMemberId && <View className={styles.activeBadge} />}
          </View>
          <Text className={styles.name}>{member.name}</Text>
          <Text className={styles.relation}>{member.relation}</Text>
        </View>
      ))}
      {showAddButton && (
        <View className={styles.addButton} onClick={handleAddMember}>
          <View className={styles.addIcon}>+</View>
          <Text className={styles.addText}>添加</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default MemberSelector;
