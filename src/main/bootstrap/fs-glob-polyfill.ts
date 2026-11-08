import * as fs from 'node:fs'
import glob from 'glob'

type GlobFs = typeof fs & {
  globSync?: (pattern: string, options?: { cwd?: string }) => string[]
}

/**
 * 使用 glob 包实现 fs.globSync 兼容层。
 */
function createGlobSyncImpl(): (pattern: string, options?: { cwd?: string }) => string[] {
  return (pattern: string, options?: { cwd?: string }): string[] => {
    const cwd = options?.cwd ?? process.cwd()
    return glob.sync(pattern, { cwd, nodir: false })
  }
}

/**
 * 为缺少可用 fs.globSync 的运行时（Electron 内置 Node 20 等）尝试注入实现。
 * Electron 可能已存在不可重新定义的 globSync 占位属性，此时不抛错，改由 postinstall 补丁 Pi SDK。
 */
export function installFsGlobSyncPolyfill(): void {
  const fsApi = fs as GlobFs
  if (typeof fsApi.globSync === 'function') {
    return
  }

  const impl = createGlobSyncImpl()
  const desc = Object.getOwnPropertyDescriptor(fsApi, 'globSync')

  if (!desc) {
    try {
      Object.defineProperty(fsApi, 'globSync', {
        value: impl,
        writable: true,
        configurable: true,
        enumerable: true
      })
    } catch {
      /* Electron / 部分运行时无法扩展 fs 命名空间，依赖 Pi SDK 文件补丁 */
    }
    return
  }

  if (desc.writable) {
    try {
      fsApi.globSync = impl
    } catch {
      /* 同上 */
    }
  }
}

installFsGlobSyncPolyfill()
