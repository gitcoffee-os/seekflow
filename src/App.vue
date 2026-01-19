/** * Copyright (c) 2025-2099 GitCoffee All Rights Reserved. * * Licensed under
the Apache License, Version 2.0 (the "License"); * you may not use this file
except in compliance with the License. * You may obtain a copy of the License at
* * http://www.apache.org/licenses/LICENSE-2.0 * * Unless required by applicable
law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
either express or implied. * See the License for the specific language governing
permissions and * limitations under the License. */
<template>
  <div class="app-container">
    <a-config-provider :locale="antdLocale" :theme="themeConfig">
      <router-view />
    </a-config-provider>
  </div>
</template>

<style>
/* 先导入主题样式，确保CSS变量先定义 */
@import '@gitcoffee/theme-ui/ai.css';
@import './styles/global.css';
</style>

<script setup lang="ts">
import { onMounted } from 'vue';
// 导入登录检查相关
import { useSettingsStore } from './stores';
// 导入应用默认设置
import { APP_SETTING } from './config/config';
// 导入通用模块
import { 
  useTheme, 
  useAntdLocale, 
  useAppInitialization,
  useLoginGuard 
} from '@gitcoffee/app';

// 初始化设置 store
const settingsStore = useSettingsStore();

// 使用通用主题管理模块
const { themeConfig, setTheme, setupThemeListener } = useTheme();

// 使用通用国际化配置模块
const { antdLocale } = useAntdLocale();

// 使用通用应用初始化模块
const { isInitialized } = useAppInitialization({
  smartSearchDefault: APP_SETTING.smartSearch,
  aiModeSearchDefault: APP_SETTING.aiModeSearch,
  settingsStore,
  onInitialized: () => {
    // 加载完成后重新设置主题，确保主题设置生效
    setTheme();
  }
});

// 使用通用登录检查模块
useLoginGuard({
  isInitialized,
  settingsStore
});

// 初始化配置
onMounted(() => {
  setTheme();
  setupThemeListener();
});
</script>
