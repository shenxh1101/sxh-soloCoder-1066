export default defineAppConfig({
  pages: [
    'pages/today/index',
    'pages/habits/index',
    'pages/body/index',
    'pages/reminders/index',
    'pages/reports/index',
    'pages/target/index',
    'pages/record-form/index',
    'pages/history-detail/index',
    'pages/members/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#22c55e',
    navigationBarTitleText: '健康管理',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f0fdf4'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#22c55e',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/today/index',
        text: '今日状态'
      },
      {
        pagePath: 'pages/habits/index',
        text: '习惯打卡'
      },
      {
        pagePath: 'pages/body/index',
        text: '身体记录'
      },
      {
        pagePath: 'pages/reminders/index',
        text: '提醒中心'
      },
      {
        pagePath: 'pages/reports/index',
        text: '趋势报告'
      }
    ]
  }
})
