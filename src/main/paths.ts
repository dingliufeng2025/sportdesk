import { homedir } from 'os'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

/**
 * 返回 SportDesk 用户数据根目录（Windows: %USERPROFILE%\.sportdesk）
 */
export function getSportDeskHome(): string {
  return join(homedir(), '.sportdesk')
}

/**
 * 确保目录存在，不存在则创建。
 */
export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true })
  }
}

/**
 * 常用路径快捷访问。
 */
export const SportDeskPaths = {
  home: () => getSportDeskHome(),
  config: () => join(getSportDeskHome(), 'config.json'),
  cache: () => join(getSportDeskHome(), 'cache'),
  secrets: () => join(getSportDeskHome(), 'secrets.json')
}
