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
<template>
  <div class="app-container">
    <a-config-provider :locale="antdLocale" :theme="themeConfig">
      <router-view />
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ConfigProvider } from 'ant-design-vue';
// 静态导入Ant Design Vue国际化配置
import enUS from 'ant-design-vue/es/locale/en_US';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import zhTW from 'ant-design-vue/es/locale/zh_TW';
import { onMounted } from 'vue';
import { getCurrentLanguage } from './locales';
import { useSettingsStore } from './stores';
import { useTheme, useAppInitialization } from '@gitcoffee/app';
import { APP_SETTING } from './config/config';

// 初始化设置 store
const settingsStore = useSettingsStore();

// 使用优化后的 useTheme 组合式函数
const { themeConfig, setupThemeListener } = useTheme();

// 初始化应用，从config.ts加载默认配置
useAppInitialization({
  smartSearchDefault: APP_SETTING.smartSearch,
  aiModeSearchDefault: APP_SETTING.aiModeSearch
});

// 组件库国际化映射，使用静态导入的配置
const antdLocaleMap = {
  en: enUS,
  zh: zhCN,
  'zh-TW': zhTW,
};

// 直接获取当前语言对应的Ant Design Vue国际化配置
// 避免使用computed和useCurrentLanguage，以兼容扩展环境的CSP限制
const antdLocale = antdLocaleMap[getCurrentLanguage() as keyof typeof antdLocaleMap] || zhCN;

// 初始化配置
onMounted(async () => {
  // 初始化 settingsStore
  await settingsStore.initialize();
  setupThemeListener();
  console.log('App mounted');
});
</script>

<style>
/* 先导入主题样式，确保CSS变量先定义 */
@import '@gitcoffee/theme-ui/ai.css';
@import './styles/global.css';
</style>

