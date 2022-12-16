import { PrettyError } from '../errors'
import { Plugin } from '../plugin'
import { localRequire } from '../utils'

export const es5 = (): Plugin => {
  let enabled = false
  return {
    name: 'es5-target',

    esbuildOptions(options) {
      if (options.target === 'es5') {
        options.target = 'es2020'
        enabled = true
      }
    },

    async renderChunk(code, info) {
      if (!enabled || !/\.(cjs|js)$/.test(info.path)) {
        return
      }
      const swc: typeof import('@swc/core') = localRequire('@swc/core')

      if (!swc) {
        throw new PrettyError(
          '@swc/core is required for es5 target. Please install it with `npm install @swc/core -D`'
        )
      }

      const result = await swc.transform(code, {
        filename: info.path,
        sourceMaps: this.options.sourcemap,
        minify: Boolean(this.options.minify),
        jsc: {
          target: 'es5',
          parser: {
            syntax: 'ecmascript',
          },
          /**
           * 1. 目前 target 为 es 5 的时候，压缩完全交给 swc 来做
           * 2. 关闭 reserved 的 globalName 配置，因为这么做会导致压缩的代码报错，后续找一下问题原因，好在现在 globalName 都用不到
           */
          // minify: this.options.minify ? {
          //   compress: false,
          //   // mangle: {
          //   //   reserved: this.options.globalName ? [this.options.globalName] : []
          //   // },
          // } : undefined,
        },
      })
      return {
        code: result.code,
        map: result.map,
      }
    },
  }
}
