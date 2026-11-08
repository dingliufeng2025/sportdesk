import type { FollowingItem } from '../types'

export const defaultFollowing: FollowingItem[] = [
  { id: 'pl', type: 'league', sport: 'football', name: '英超', meta: 'Premier League' },
  { id: 'll', type: 'league', sport: 'football', name: '西甲', meta: 'La Liga' },
  { id: 'sa', type: 'league', sport: 'football', name: '意甲', meta: 'Serie A' },
  { id: 'bl', type: 'league', sport: 'football', name: '德甲', meta: 'Bundesliga' },
  { id: 'fl1', type: 'league', sport: 'football', name: '法甲', meta: 'Ligue 1' },
  { id: 'nba', type: 'league', sport: 'nba', name: 'NBA', meta: '常规赛' },
  { id: 'chn', type: 'team', sport: 'china', name: '中国国家男足', meta: '世预赛' },
  { id: 'honor', type: 'note', sport: 'honor', name: '王者荣耀', meta: '仅关注与外链', externalUrl: 'https://pvp.qq.com/' }
]
