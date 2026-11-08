import * as fs from 'node:fs'
import glob from 'glob'

type GlobFs = typeof fs & {
  globSync?: (pattern: string, options?: { cwd?: string }) => string[]
}

/**
 * 为缺少 fs.globSync 的 Node 运行时（如 Electron 内置 Node 20）提供与 Node 22+ 兼容的实现。
 * 须在任意 @earendil-works/pi-coding-agent 模块加载之前执行。
 */
export function installFsGlobSyncPolyfill(): void {
  const fsApi = fs as GlobFs
  if (typeof fsApi.globSync === 'function') {
    return
  }
  const impl = (pattern: string, options?: { cwd?: string }): string[] => {
    const cwd = options?.cwd ?? process.cwd()
    return glob.sync(pattern, { cwd, nodir: false })
  }
  Object.defineProperty(fsApi, 'globSync', {
    value: impl,
    writable: true,
    configurable: true,
    enumerable: true
  })
}

installFsGlobSyncPolyfill()
