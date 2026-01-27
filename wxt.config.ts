import { defineConfig } from 'wxt';
import { resolve } from 'path';

export default defineConfig({
  // 模块配置
  modules: ['@wxt-dev/module-vue', '@wxt-dev/auto-icons'],
  srcDir: 'src',
  autoIcons: {
    developmentIndicator: false
  },
  // 构建配置
  build: {
    outDir: '.output',
    rollupOptions: {
      external: ['wxt/browser'],
    }
  },
  // Vite 配置
  vite: (config) => {
    // 引入 vite.config.ts
    // const viteConfig = require('./vite.config.ts').default;
    const viteConfig = config;
    // 合并配置，保留 wxt/browser 别名，并覆盖 build.outDir 配置
    return {
      ...viteConfig,
      base: './',
      // build: {
      //   // 控制输出资产目录的名称
      //   assetsDir: 'assets',
      // },
      optimizeDeps: {
        exclude: []
      },
      // build: {
      //   ...viteConfig.build,
      //   // 覆盖 outDir 配置，使用 WXT 的默认输出目录
      //   // outDir: undefined
      //   outDir: '.output',
      // },
      resolve: {
        ...viteConfig.resolve,
        alias: {
          ...viteConfig.resolve?.alias,
          'wxt/browser': resolve(__dirname, 'node_modules/wxt/dist/browser.mjs')
        }
      }
    };
  },
  // Manifest 配置
  manifest: {
    // 扩展基本信息
    name: 'seekflow',
    version: '1.0.0',
    description: 'SeekFlow 智能探索助手',
    
    // 扩展图标
    // icons: {
    //   16: '~/assets/icon.png',
    //   32: '~/assets/icon.png',
    //   48: '~/assets/icon.png',
    //   128: '~/assets/icon.png'
    // },
    autoIcons: {
      baseIconPath: '~/assets/logo.svg'
    },
    
    // 扩展图标点击行为
    action: {
      // 移除默认弹窗，使用点击事件打开 index.html
      default_popup: ""
    },
    
    // 扩展权限
    permissions: [
      'storage',
      'activeTab',
      'tabs',
      'scripting',
      'tabGroups',
      'sidePanel'
    ],
    
    // 主机权限
    host_permissions: [
      'https://*/*',
      'http://127.0.0.1/*',
      'http://localhost/*'
    ],

    web_accessible_resources: [
        {
          resources: [
            'index.html',
            'assets/*'
          ],
          matches: [
            '<all_urls>'
          ]
        }
      ],
  }
});
