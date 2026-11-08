import type { SportFilter } from '../types'

import premierLeague from '../../assets/logos/premier-league.svg'
import laLiga from '../../assets/logos/la-liga.svg'
import serieA from '../../assets/logos/serie-a.svg'
import bundesliga from '../../assets/logos/bundesliga.svg'
import ligue1 from '../../assets/logos/ligue-1.svg'
import nba from '../../assets/logos/nba.svg'
import chinaFootball from '../../assets/logos/china-football.svg'
import tennis from '../../assets/logos/tennis.svg'
import snooker from '../../assets/logos/snooker.svg'
import esports from '../../assets/logos/esports.svg'
import honor from '../../assets/logos/honor.svg'
import footballGeneric from '../../assets/logos/football-generic.svg'

const LEAGUE_NAME_MAP: Record<string, string> = {
  英超: premierLeague,
  西甲: laLiga,
  意甲: serieA,
  德甲: bundesliga,
  法甲: ligue1,
  NBA: nba,
  中国国家男足: chinaFootball,
  王者荣耀: honor
}

const FILTER_LOGO: Record<SportFilter, string> = {
  all: footballGeneric,
  football: footballGeneric,
  nba: nba,
  china: chinaFootball,
  tennis: tennis,
  snooker: snooker,
  lol: esports,
  honor: honor
}

const FOLLOWING_ID_LOGO: Record<string, string> = {
  pl: premierLeague,
  ll: laLiga,
  sa: serieA,
  bl: bundesliga,
  fl1: ligue1,
  nba: nba,
  chn: chinaFootball,
  honor: honor
}

/**
 * 按关注项 id / 名称解析联赛或球队 Logo URL（本地 assets）。
 */
export function logoForFollowing(id: string, name: string): string {
  if (FOLLOWING_ID_LOGO[id]) {
    return FOLLOWING_ID_LOGO[id]
  }
  return LEAGUE_NAME_MAP[name] ?? logoForSportFilter('football')
}

/**
 * 按运动筛选 Chip 返回 Logo。
 */
export function logoForSportFilter(filter: SportFilter): string {
  return FILTER_LOGO[filter] ?? footballGeneric
}

/**
 * 按联赛中文名（赛程卡）返回 Logo。
 */
export function logoForLeagueName(league: string): string {
  return LEAGUE_NAME_MAP[league] ?? footballGeneric
}
