import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, Textarea } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useHealthStore } from '@/store/useHealthStore';
import { exerciseTypes } from '@/data/mockData';
import { calculateBMI, checkWeightAbnormal, calculateSleepHours } from '@/utils/healthUtils';
import type { RecordType, BodyRecord, ExamRecord, ExamItem } from '@/types/health';

const typeConfig = {
  steps: { label: '步数', icon: '👟', unit: '步' },
  exercise: { label: '运动', icon: '🏃', unit: '分钟' },
  water: { label: '饮水', icon: '💧', unit: '杯' },
  sleep: { label: '睡眠', icon: '😴', unit: '小时' },
  weight: { label: '体重腰围', icon: '⚖️', unit: 'kg' },
  exam: { label: '体检', icon: '🏥', unit: '' }
};

const RecordFormPage: React.FC = () => {
  const router = useRouter();
  const initialType = (router.params.type as RecordType) || 'steps';

  const currentMemberId = useHealthStore((state) => state.currentMemberId);
  const getCurrentMember = useHealthStore((state) => state.getCurrentMember);
  const getTarget = useHealthStore((state) => state.getTarget);
  const getTodayRecord = useHealthStore((state) => state.getTodayRecord);
  const getLatestBodyRecord = useHealthStore((state) => state.getLatestBodyRecord);
  const updateDailyRecord = useHealthStore((state) => state.updateDailyRecord);
  const addBodyRecord = useHealthStore((state) => state.addBodyRecord);
  const addExamRecord = useHealthStore((state) => state.addExamRecord);
  const checkIn = useHealthStore((state) => state.checkIn);

  const currentMember = getCurrentMember();
  const todayRecord = getTodayRecord(currentMemberId);
  const latestBodyRecord = getLatestBodyRecord(currentMemberId);
  const target = getTarget(currentMemberId);

  const [activeType, setActiveType] = useState<RecordType>(initialType);

  const [steps, setSteps] = useState(todayRecord?.steps?.toString() || '');
  const [exerciseMinutes, setExerciseMinutes] = useState(todayRecord?.exerciseMinutes?.toString() || '');
  const [exerciseType, setExerciseType] = useState(todayRecord?.exerciseType || '跑步');
  const [waterCups, setWaterCups] = useState(todayRecord?.waterCups?.toString() || '');
  const [sleepStartTime, setSleepStartTime] = useState(todayRecord?.sleepStartTime || '');
  const [sleepEndTime, setSleepEndTime] = useState(todayRecord?.sleepEndTime || '');
  const [weight, setWeight] = useState(latestBodyRecord?.weight?.toString() || '');
  const [waistLine, setWaistLine] = useState(latestBodyRecord?.waistLine?.toString() || '');
  const [heartRate, setHeartRate] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [examDate, setExamDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [examHospital, setExamHospital] = useState('');
  const [examItems, setExamItems] = useState<ExamItem[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (router.params.type) {
      setActiveType(router.params.type as RecordType);
    }
  }, [router.params.type]);

  useDidShow(() => {
    console.log('[RecordFormPage] Page showed, type:', activeType);
  });

  const handleSave = () => {
    const today = dayjs().format('YYYY-MM-DD');
    console.log('[RecordFormPage] Save record, type:', activeType);

    switch (activeType) {
      case 'steps':
      case 'exercise':
      case 'water':
      case 'sleep':
        const sleepHours = sleepStartTime && sleepEndTime
          ? calculateSleepHours(sleepStartTime, sleepEndTime)
          : todayRecord?.sleepHours || 0;

        updateDailyRecord(today, currentMemberId, {
          ...(activeType === 'steps' && { steps: Number(steps) }),
          ...(activeType === 'exercise' && {
            exerciseMinutes: Number(exerciseMinutes),
            exerciseType
          }),
          ...(activeType === 'water' && { waterCups: Number(waterCups) }),
          ...(activeType === 'sleep' && {
            sleepStartTime,
            sleepEndTime,
            sleepHours
          }),
          checkInItems: [...new Set([...(todayRecord?.checkInItems || []), activeType])]
        });

        checkIn(today, currentMemberId, activeType);
        break;

      case 'weight':
        const bmi = currentMember?.height ? calculateBMI(Number(weight), currentMember.height) : undefined;
        const isAbnormal = latestBodyRecord
          ? checkWeightAbnormal(Number(weight), latestBodyRecord.weight)
          : false;
        const abnormalItems: string[] = [];
        if (isAbnormal) abnormalItems.push('体重波动大');
        if (bmi && bmi >= 28) abnormalItems.push('BMI偏高');
        if (bloodPressure && bloodPressure.includes('/')) {
          const [systolic] = bloodPressure.split('/').map(Number);
          if (systolic > 140) abnormalItems.push('血压偏高');
        }
        if (Number(bloodSugar) > 6.1) abnormalItems.push('血糖偏高');

        const bodyRecord: BodyRecord = {
          id: Date.now().toString(),
          date: today,
          memberId: currentMemberId,
          weight: Number(weight),
          waistLine: Number(waistLine),
          heartRate: heartRate ? Number(heartRate) : undefined,
          bloodPressure: bloodPressure || undefined,
          bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
          bmi,
          isAbnormal: abnormalItems.length > 0,
          abnormalItems,
          notes
        };
        addBodyRecord(bodyRecord);
        updateDailyRecord(today, currentMemberId, {
          weight: Number(weight),
          waistLine: Number(waistLine)
        });
        console.log('[RecordFormPage] Add body record:', bodyRecord);
        break;

      case 'exam':
        const examRecord: ExamRecord = {
          id: Date.now().toString(),
          date: examDate,
          memberId: currentMemberId,
          hospital: examHospital,
          items: examItems,
          notes
        };
        addExamRecord(examRecord);
        console.log('[RecordFormPage] Add exam record:', examRecord);
        break;
    }

    Taro.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => {
      Taro.navigateBack();
    }, 1000);
  };

  const renderStepsForm = () => (
    <View className={styles.formSection}>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>👟</Text>
          今日步数
        </Text>
        <View className={styles.formInputRow}>
          <View className={styles.formInputWithUnit}>
            <Input
              className={styles.formInputInline}
              type="number"
              placeholder="请输入步数"
              value={steps}
              onInput={(e) => setSteps(e.detail.value)}
            />
            <Text className={styles.formUnit}>步</Text>
          </View>
        </View>
        <View className={styles.quickValues}>
          {[3000, 5000, 8000, 10000, 12000].map((val) => (
            <Button
              key={val}
              className={styles.quickValueBtn}
              onClick={() => setSteps(val.toString())}
            >
              {val}步
            </Button>
          ))}
        </View>
      </View>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>📝</Text>
          备注
        </Text>
        <Textarea
          className={styles.formTextarea}
          placeholder="可选：记录步行路线、感受等..."
          value={notes}
          onInput={(e) => setNotes(e.detail.value)}
        />
      </View>
    </View>
  );

  const renderExerciseForm = () => (
    <View className={styles.formSection}>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>🏃</Text>
          运动类型
        </Text>
        <View className={styles.exerciseTypes}>
          {exerciseTypes.map((type) => (
            <Button
              key={type.id}
              className={classnames(styles.exerciseTypeBtn, exerciseType === type.name && styles.active)}
              onClick={() => setExerciseType(type.name)}
            >
              <Text className={styles.exerciseTypeIcon}>{type.icon}</Text>
              <Text className={styles.exerciseTypeName}>{type.name}</Text>
            </Button>
          ))}
        </View>
      </View>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>⏱️</Text>
          运动时长
        </Text>
        <View className={styles.formInputRow}>
          <View className={styles.formInputWithUnit}>
            <Input
              className={styles.formInputInline}
              type="digit"
              placeholder="请输入运动时长"
              value={exerciseMinutes}
              onInput={(e) => setExerciseMinutes(e.detail.value)}
            />
            <Text className={styles.formUnit}>分钟</Text>
          </View>
        </View>
        <View className={styles.quickValues}>
          {[15, 30, 45, 60, 90].map((val) => (
            <Button
              key={val}
              className={styles.quickValueBtn}
              onClick={() => setExerciseMinutes(val.toString())}
            >
              {val}分钟
            </Button>
          ))}
        </View>
      </View>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>📝</Text>
          备注
        </Text>
        <Textarea
          className={styles.formTextarea}
          placeholder="可选：记录运动感受、消耗等..."
          value={notes}
          onInput={(e) => setNotes(e.detail.value)}
        />
      </View>
    </View>
  );

  const renderWaterForm = () => (
    <View className={styles.formSection}>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>💧</Text>
          今日饮水
        </Text>
        <View className={styles.formInputRow}>
          <View className={styles.formInputWithUnit}>
            <Input
              className={styles.formInputInline}
              type="digit"
              placeholder="请输入杯数"
              value={waterCups}
              onInput={(e) => setWaterCups(e.detail.value)}
            />
            <Text className={styles.formUnit}>杯</Text>
          </View>
        </View>
        <View className={styles.quickValues}>
          {[1, 2, 4, 6, 8].map((val) => (
            <Button
              key={val}
              className={styles.quickValueBtn}
              onClick={() => setWaterCups(val.toString())}
            >
              {val}杯
            </Button>
          ))}
        </View>
      </View>
      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>
          💡 健康建议
        </Text>
        <Text className={styles.tipContent}>
          建议每天饮用8杯水（约2000ml），少量多次，不要等到口渴才喝水。
        </Text>
      </View>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>📝</Text>
          备注
        </Text>
        <Textarea
          className={styles.formTextarea}
          placeholder="可选：记录喝水时间、类型等..."
          value={notes}
          onInput={(e) => setNotes(e.detail.value)}
        />
      </View>
    </View>
  );

  const renderSleepForm = () => (
    <View className={styles.formSection}>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>🌙</Text>
          入睡时间
        </Text>
        <Input
          className={styles.formInput}
          type="input"
          placeholder="例如：23:00"
          value={sleepStartTime}
          onInput={(e) => setSleepStartTime(e.detail.value)}
        />
      </View>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>☀️</Text>
          起床时间
        </Text>
        <Input
          className={styles.formInput}
          type="input"
          placeholder="例如：07:00"
          value={sleepEndTime}
          onInput={(e) => setSleepEndTime(e.detail.value)}
        />
      </View>
      {sleepStartTime && sleepEndTime && (
        <View className={styles.tipCard}>
          <Text className={styles.tipTitle}>
            😴 睡眠时长
          </Text>
          <Text className={styles.tipContent}>
            约 {calculateSleepHours(sleepStartTime, sleepEndTime)} 小时
          </Text>
        </View>
      )}
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>📝</Text>
          备注
        </Text>
        <Textarea
          className={styles.formTextarea}
          placeholder="可选：记录睡眠质量、是否做梦等..."
          value={notes}
          onInput={(e) => setNotes(e.detail.value)}
        />
      </View>
    </View>
  );

  const renderWeightForm = () => (
    <View className={styles.formSection}>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>⚖️</Text>
          体重
        </Text>
        <View className={styles.formInputRow}>
          <View className={styles.formInputWithUnit}>
            <Input
              className={styles.formInputInline}
              type="digit"
              placeholder="请输入体重"
              value={weight}
              onInput={(e) => setWeight(e.detail.value)}
            />
            <Text className={styles.formUnit}>kg</Text>
          </View>
        </View>
        <View className={styles.quickValues}>
          {[target.weight - 2, target.weight - 1, target.weight, target.weight + 1, target.weight + 2].map((val) => (
            <Button
              key={val}
              className={styles.quickValueBtn}
              onClick={() => setWeight(val.toFixed(1))}
            >
              {val.toFixed(1)}kg
            </Button>
          ))}
        </View>
      </View>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>📏</Text>
          腰围
        </Text>
        <View className={styles.formInputRow}>
          <View className={styles.formInputWithUnit}>
            <Input
              className={styles.formInputInline}
              type="digit"
              placeholder="请输入腰围"
              value={waistLine}
              onInput={(e) => setWaistLine(e.detail.value)}
            />
            <Text className={styles.formUnit}>cm</Text>
          </View>
        </View>
      </View>
      <View className={styles.timeInputRow}>
        <View className={styles.timeInputItem}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.formIcon}>❤️</Text>
              心率
            </Text>
            <View className={styles.formInputWithUnit}>
              <Input
                className={styles.formInputInline}
                type="digit"
                placeholder="可选"
                value={heartRate}
                onInput={(e) => setHeartRate(e.detail.value)}
              />
              <Text className={styles.formUnit}>次/分</Text>
            </View>
          </View>
        </View>
        <View className={styles.timeInputItem}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.formIcon}>🩸</Text>
              血糖
            </Text>
            <View className={styles.formInputWithUnit}>
              <Input
                className={styles.formInputInline}
                type="digit"
                placeholder="可选"
                value={bloodSugar}
                onInput={(e) => setBloodSugar(e.detail.value)}
              />
              <Text className={styles.formUnit}>mmol/L</Text>
            </View>
          </View>
        </View>
      </View>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>💓</Text>
          血压
        </Text>
        <View className={styles.formInputWithUnit}>
          <Input
            className={styles.formInputInline}
            type="input"
            placeholder="例如：120/80"
            value={bloodPressure}
            onInput={(e) => setBloodPressure(e.detail.value)}
          />
          <Text className={styles.formUnit}>mmHg</Text>
        </View>
      </View>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>📝</Text>
          备注
        </Text>
        <Textarea
          className={styles.formTextarea}
          placeholder="可选：记录身体状态、饮食情况等..."
          value={notes}
          onInput={(e) => setNotes(e.detail.value)}
        />
      </View>
    </View>
  );

  const handleAddExamItem = () => {
    const newItem: ExamItem = {
      name: '',
      value: '',
      unit: '',
      normalRange: '',
      status: 'normal',
      isAbnormal: false,
      notes: ''
    };
    setExamItems([...examItems, newItem]);
    console.log('[RecordFormPage] Add exam item');
  };

  const handleRemoveExamItem = (index: number) => {
    setExamItems(examItems.filter((_, i) => i !== index));
    console.log('[RecordFormPage] Remove exam item at index:', index);
  };

  const handleUpdateExamItem = (index: number, field: keyof ExamItem, value: string) => {
    const updated = [...examItems];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'value' && updated[index].normalRange) {
      const numValue = parseFloat(value);
      const range = updated[index].normalRange;
      const rangeMatch = range.match(/([\d.]+)\s*[-~]\s*([\d.]+)/);
      if (rangeMatch && !isNaN(numValue)) {
        const min = parseFloat(rangeMatch[1]);
        const max = parseFloat(rangeMatch[2]);
        if (numValue < min) {
          updated[index].status = 'low';
          updated[index].isAbnormal = true;
        } else if (numValue > max) {
          updated[index].status = 'high';
          updated[index].isAbnormal = true;
        } else {
          updated[index].status = 'normal';
          updated[index].isAbnormal = false;
        }
      }
    }
    
    setExamItems(updated);
  };

  const commonExamItems = [
    { name: '身高', unit: 'cm', normalRange: '' },
    { name: '体重', unit: 'kg', normalRange: '' },
    { name: 'BMI', unit: '', normalRange: '18.5-23.9' },
    { name: '收缩压', unit: 'mmHg', normalRange: '90-140' },
    { name: '舒张压', unit: 'mmHg', normalRange: '60-90' },
    { name: '心率', unit: '次/分', normalRange: '60-100' },
    { name: '空腹血糖', unit: 'mmol/L', normalRange: '3.9-6.1' },
    { name: '总胆固醇', unit: 'mmol/L', normalRange: '2.8-5.2' },
    { name: '甘油三酯', unit: 'mmol/L', normalRange: '0.4-1.7' },
    { name: '高密度脂蛋白', unit: 'mmol/L', normalRange: '>1.0' },
    { name: '低密度脂蛋白', unit: 'mmol/L', normalRange: '<3.4' },
    { name: '尿酸', unit: 'μmol/L', normalRange: '150-420' },
    { name: '谷丙转氨酶(ALT)', unit: 'U/L', normalRange: '0-40' },
    { name: '谷草转氨酶(AST)', unit: 'U/L', normalRange: '0-40' },
    { name: '血红蛋白', unit: 'g/L', normalRange: '120-160' }
  ];

  const handleQuickAddExamItem = (template: typeof commonExamItems[0]) => {
    const newItem: ExamItem = {
      name: template.name,
      value: '',
      unit: template.unit,
      normalRange: template.normalRange,
      status: 'normal',
      isAbnormal: false,
      notes: ''
    };
    setExamItems([...examItems, newItem]);
    console.log('[RecordFormPage] Quick add exam item:', template.name);
  };

  const renderExamForm = () => (
    <View className={styles.formSection}>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>📅</Text>
          体检日期
        </Text>
        <Input
          className={styles.formInput}
          type="input"
          placeholder="YYYY-MM-DD"
          value={examDate}
          onInput={(e) => setExamDate(e.detail.value)}
        />
      </View>
      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>🏥</Text>
          体检医院
        </Text>
        <Input
          className={styles.formInput}
          type="input"
          placeholder="请输入体检医院名称"
          value={examHospital}
          onInput={(e) => setExamHospital(e.detail.value)}
        />
      </View>

      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>�</Text>
          体检指标
        </Text>
        <Text className={styles.formHint}>点击下方常用指标快速添加，或手动添加自定义指标</Text>
        <View className={styles.quickExamItems}>
          {commonExamItems.slice(0, 8).map((item) => (
            <Button
              key={item.name}
              className={styles.quickExamItemBtn}
              onClick={() => handleQuickAddExamItem(item)}
            >
              + {item.name}
            </Button>
          ))}
        </View>
        <Button className={styles.addExamItemBtn} onClick={handleAddExamItem}>
          + 添加自定义指标
        </Button>
      </View>

      {examItems.length > 0 && (
        <View className={styles.examItemsList}>
          <Text className={styles.formLabel}>已添加指标（共 {examItems.length} 项）</Text>
          {examItems.map((item, index) => (
            <View key={index} className={styles.examItemCard}>
              <View className={styles.examItemHeader}>
                <Input
                  className={styles.examItemName}
                  placeholder="指标名称"
                  value={item.name}
                  onInput={(e) => handleUpdateExamItem(index, 'name', e.detail.value)}
                />
                <Text
                  className={classnames(
                    styles.examItemStatus,
                    item.isAbnormal && styles.abnormal
                  )}
                >
                  {item.status === 'normal' && '正常'}
                  {item.status === 'high' && '↑偏高'}
                  {item.status === 'low' && '↓偏低'}
                </Text>
                <Text
                  className={styles.removeExamItemBtn}
                  onClick={() => handleRemoveExamItem(index)}
                >
                  删除
                </Text>
              </View>
              <View className={styles.examItemRow}>
                <View className={styles.examItemInputWrap}>
                  <Text className={styles.examItemInputLabel}>结果值</Text>
                  <Input
                    className={styles.examItemInput}
                    placeholder="请输入结果"
                    value={item.value}
                    onInput={(e) => handleUpdateExamItem(index, 'value', e.detail.value)}
                  />
                  <Text className={styles.examItemUnit}>{item.unit}</Text>
                </View>
              </View>
              <View className={styles.examItemRow}>
                <View className={styles.examItemInputWrap}>
                  <Text className={styles.examItemInputLabel}>单位</Text>
                  <Input
                    className={styles.examItemInput}
                    placeholder="如: mmol/L"
                    value={item.unit}
                    onInput={(e) => handleUpdateExamItem(index, 'unit', e.detail.value)}
                  />
                </View>
                <View className={styles.examItemInputWrap}>
                  <Text className={styles.examItemInputLabel}>参考范围</Text>
                  <Input
                    className={styles.examItemInput}
                    placeholder="如: 3.9-6.1"
                    value={item.normalRange}
                    onInput={(e) => handleUpdateExamItem(index, 'normalRange', e.detail.value)}
                  />
                </View>
              </View>
              <View className={styles.examItemRow}>
                <View className={styles.examItemInputWrap} style={{ flex: 1 }}>
                  <Text className={styles.examItemInputLabel}>备注</Text>
                  <Input
                    className={styles.examItemInput}
                    placeholder="可选：标注测量条件、特殊说明等"
                    value={item.notes || ''}
                    onInput={(e) => handleUpdateExamItem(index, 'notes', e.detail.value)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <View className={styles.formItem}>
        <Text className={styles.formLabel}>
          <Text className={styles.formIcon}>��</Text>
          体检备注
        </Text>
        <Textarea
          className={styles.formTextarea}
          placeholder="记录体检结论、医生建议、注意事项等..."
          value={notes}
          onInput={(e) => setNotes(e.detail.value)}
        />
      </View>
    </View>
  );

  const typeTabs: Array<{ type: RecordType; label: string; icon: string }> = [
    { type: 'steps', label: '步数', icon: '👟' },
    { type: 'exercise', label: '运动', icon: '🏃' },
    { type: 'water', label: '饮水', icon: '💧' },
    { type: 'sleep', label: '睡眠', icon: '😴' },
    { type: 'weight', label: '体重', icon: '⚖️' },
    { type: 'exam', label: '体检', icon: '🏥' }
  ];

  const renderForm = () => {
    switch (activeType) {
      case 'steps': return renderStepsForm();
      case 'exercise': return renderExerciseForm();
      case 'water': return renderWaterForm();
      case 'sleep': return renderSleepForm();
      case 'weight': return renderWeightForm();
      case 'exam': return renderExamForm();
      default: return renderStepsForm();
    }
  };

  return (
    <View className={styles.pageContainer}>
      {currentMember && (
        <View className={styles.memberInfo}>
          <View className={styles.memberAvatar}>
            {currentMember.name.charAt(0)}
          </View>
          <View className={styles.memberDetails}>
            <Text className={styles.memberName}>{currentMember.name}</Text>
            <Text className={styles.memberDesc}>
              记录{typeConfig[activeType].label}数据 · {dayjs().format('M月D日')}
            </Text>
          </View>
        </View>
      )}

      <View className={styles.typeTabs}>
        {typeTabs.map((tab) => (
          <Button
            key={tab.type}
            className={classnames(styles.typeTab, activeType === tab.type && styles.active)}
            onClick={() => setActiveType(tab.type)}
          >
            {tab.icon} {tab.label}
          </Button>
        ))}
      </View>

      {renderForm()}

      <Button className={styles.saveBtn} onClick={handleSave}>
        保存记录
      </Button>
    </View>
  );
};

export default RecordFormPage;
