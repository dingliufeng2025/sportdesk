import type { FixtureItem } from '../types'

export const sampleFixtures: FixtureItem[] = [
  {
    id: 'fx1',
    sport: 'football',
    league: '英超',
    home: '阿森纳',
    away: '切尔西',
    homeScore: 2,
    awayScore: 1,
    status: 'live',
    kickoff: '2026-11-08T20:00:00+08:00',
    minute: 67
  },
  {
    id: 'fx2',
    sport: 'football',
    league: '西甲',
    home: '皇马',
    away: '巴萨',
    status: 'scheduled',
    kickoff: '2026-11-08T22:15:00+08:00'
  },
  {
    id: 'fx3',
    sport: 'football',
    league: '意甲',
    home: '国米',
    away: '尤文',
    homeScore: 1,
    awayScore: 1,
    status: 'live',
    kickoff: '2026-11-08T19:45:00+08:00',
    minute: 38
  },
  {
    id: 'fx4',
    sport: 'football',
    league: '德甲',
    home: '拜仁',
    away: '多特',
    homeScore: 3,
    awayScore: 0,
    status: 'finished',
    kickoff: '2026-11-08T17:30:00+08:00'
  },
  {
    id: 'fx5',
    sport: 'football',
    league: '法甲',
    home: '巴黎',
    away: '马赛',
    status: 'scheduled',
    kickoff: '2026-11-09T03:45:00+08:00'
  },
  {
    id: 'nba1',
    sport: 'nba',
    league: 'NBA',
    home: '湖人',
    away: '勇士',
    homeScore: 98,
    awayScore: 102,
    status: 'live',
    kickoff: '2026-11-08T11:00:00+08:00',
    minute: 4
  },
  {
    id: 'nba2',
    sport: 'nba',
    league: 'NBA',
    home: '凯尔特人',
    away: '雄鹿',
    status: 'scheduled',
    kickoff: '2026-11-09T08:30:00+08:00'
  },
  {
    id: 'chn1',
    sport: 'china',
    league: '世预赛',
    home: '中国',
    away: '泰国',
    status: 'scheduled',
    kickoff: '2026-11-15T20:00:00+08:00'
  },
  {
    id: 'ten1',
    sport: 'tennis',
    league: 'ATP 总决赛',
    home: '辛纳',
    away: '阿尔卡拉斯',
    status: 'scheduled',
    kickoff: '2026-11-09T21:00:00+08:00'
  },
  {
    id: 'snk1',
    sport: 'snooker',
    league: '英锦赛',
    home: '丁俊晖',
    away: '奥沙利文',
    status: 'scheduled',
    kickoff: '2026-11-10T19:00:00+08:00'
  },
  {
    id: 'lol1',
    sport: 'lol',
    league: 'LPL',
    home: 'BLG',
    away: 'JDG',
    homeScore: 1,
    awayScore: 0,
    status: 'live',
    kickoff: '2026-11-08T18:00:00+08:00',
    minute: 2
  }
]
