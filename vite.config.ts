/**
 * Copyright (c) 2025-2099 GitCoffee All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { copyFileSync, mkdirSync, existsSync, writeFileSync } from 'fs'
import { globSync } from 'glob'
import { execSync } from 'child_process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isFastBuild = mode === 'fast'
  
  return {
    plugins: [
      vue(),
      // 构建完成后复制插件目录
      {
        name: 'copy-plugins',
        writeBundle() {
          // 只在生产构建时复制插件
          if (process.env.NODE_ENV === 'production') {
            const pluginFiles = globSync('plugins/**/*.js')
            const distPluginDir = resolve(__dirname, 'dist/plugins')
            
            // 创建目标目录
            if (!existsSync(distPluginDir)) {
              mkdirSync(distPluginDir, { recursive: true })
            }
            
            // 复制所有插件文件
            pluginFiles.forEach(file => {
              const dest = resolve(distPluginDir, file.replace('plugins/', ''))
              // 确保目标目录存在
              const destDir = dirname(dest)
              if (!existsSync(destDir)) {
                mkdirSync(destDir, { recursive: true })
              }
              copyFileSync(file, dest)
            })
          }
        }
      },
      // 开发模式下的编译文件输出插件
      // {
      //   name: 'dev-build-output',
      //   buildStart() {
      //     console.log('🚀 Starting dev-build-output plugin')
      //   },
      //   transform(code, id) {
      //     // 只在开发模式下启用
      //     if (process.env.NODE_ENV === 'development') {
      //       console.log(`🔄 Processing file: ${id}`)
      //       const devOutputDir = resolve(__dirname, 'dist')
      //       
      //       // 确保开发输出目录存在
      //       if (!existsSync(devOutputDir)) {
      //         console.log(`📁 Creating dev output directory: ${devOutputDir}`)
      //         mkdirSync(devOutputDir, { recursive: true })
      //       }
      //       
      //       // 处理背景脚本
      //       if (id.includes('background')) {
      //         const outputPath = resolve(devOutputDir, 'assets', 'background-dev.js')
      //         mkdirSync(dirname(outputPath), { recursive: true })
      //         writeFileSync(outputPath, code)
      //         console.log(`✅ Written background script to: ${outputPath}`)
      //       }
      //       
      //       // 处理内容脚本
      //       if (id.includes('content')) {
      //         const outputPath = resolve(devOutputDir, 'assets', 'content-dev.js')
      //         mkdirSync(dirname(outputPath), { recursive: true })
      //         writeFileSync(outputPath, code)
      //         console.log(`✅ Written content script to: ${outputPath}`)
      //       }
      //       
      //       // 处理侧边栏脚本
      //       if (id.includes('sidepanel')) {
      //         const outputPath = resolve(devOutputDir, 'assets', 'sidepanel-dev.js')
      //         mkdirSync(dirname(outputPath), { recursive: true })
      //         writeFileSync(outputPath, code)
      //         console.log(`✅ Written sidepanel script to: ${outputPath}`)
      //       }
      //       
      //       // 处理主脚本 main.tsx
      //       if (id.includes('main.tsx')) {
      //         const outputPath = resolve(devOutputDir, 'assets', 'main-dev.js')
      //         mkdirSync(dirname(outputPath), { recursive: true })
      //         writeFileSync(outputPath, code)
      //         console.log(`✅ Written main script to: ${outputPath}`)
      //       }
      //     }
      //     return code
      //   }
      // },

      // 开发模式下的热更新插件
      {
        name: 'vite-to-plasmo-hot-reload',
        configureServer(server) {
          // 只在开发模式下启用
          if (process.env.NODE_ENV === 'development') {
            // 监听文件变化
            server.watcher.on('change', (file) => {
              // 忽略 node_modules、dist、build 和 .plasmo 目录
              if (file.includes('node_modules') || file.includes('dist') || file.includes('build') || file.includes('.plasmo')) {
                return
              }
              
              // 只处理 TypeScript、JavaScript、Vue、HTML 文件
              if (/(ts|js|vue|html)$/.test(file)) {
                console.log(`\n🔄 File changed: ${file}`)
                try {
                  // 执行 vite-to-plasmo.js 脚本
                  execSync('node scripts/vite-to-plasmo.js --dev', { 
                    stdio: 'inherit',
                    cwd: resolve(__dirname)
                  })
                  console.log('✅ Plasmo hot reload triggered')
                } catch (error) {
                  console.error('❌ Failed to trigger plasmo hot reload:', error.message)
                }
              }
            })
            
            // 监听 workspace 中其他包的文件变化
            const workspacePackages = ['packages/ui/search-ui', 'packages/core/i18n']
            workspacePackages.forEach(packagePath => {
              const fullPath = resolve(__dirname, '..', '..', packagePath)
              server.watcher.add(fullPath)
              console.log(`✅ Added watcher for workspace package: ${packagePath}`)
            })
          }
        }
      }
    ],
    resolve: {
      alias: {
        '~': resolve(__dirname, 'src'),
        '~/*': resolve(__dirname, 'src/*'),
        'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js',
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // 启用多线程构建
      minify: isFastBuild ? false : 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          // 禁用可能导致 async 关键字被移除的优化
          unused: false,
          dead_code: false
        },
        // 保持类和方法的结构
        keep_classnames: true,
        keep_fnames: true
      },
      // 启用 gzip 压缩
      reportCompressedSize: true,
      // 配置缓存
      cacheDir: './node_modules/.vite-cache',
      // 快速构建模式下禁用源映射
      sourcemap: !isFastBuild,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          options: resolve(__dirname, 'src/options/index.html'),
          sidepanel: resolve(__dirname, 'src/sidepanel/index.vue'),
          background: resolve(__dirname, 'src/background/index.ts'),
          content: resolve(__dirname, 'src/content/index.ts')
        },
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: (chunkInfo) => {
            // 为 background 脚本使用 CommonJS 格式
            if (chunkInfo.name === 'background') {
              return 'assets/[name]-[hash].cjs'
            }
            return 'assets/[name]-[hash].js'
          },
          format: 'es', // 使用ES模块格式
          inlineDynamicImports: false,
          // 配置代码分割
          manualChunks: isFastBuild ? undefined : {
            // 将第三方依赖打包到单独的 chunk
            vendor: ['vue', 'vue-router', 'ant-design-vue'],
            // 将国际化相关代码打包到单独的 chunk
            i18n: ['vue-i18n'],
            // 将 UI 组件打包到单独的 chunk
            ui: ['@gitcoffee/search-ui', '@gitcoffee/chatbot-ui']
          }
        }
      },
      assetsDir: 'assets',
      base: './'
    },
    server: {
      port: 5173,
      open: false,
      // 开发服务器优化
      fs: {
        strict: false
      },
      watch: {
        ignored: ['**/node_modules/**', '**/dist/**']
      },
      proxy: {
        // 配置 code.exmay.com 搜索 API 的代理
        '/api/search': {
          target: 'https://code.exmay.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/search/, '/exmay/api/ugc/article/search'),
          secure: false
        }
      }
    }
  }
})
