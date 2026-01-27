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
@import '../styles/global.css';
</style>

<script setup lang="ts">
// 导入通用模块
import { useAntdLocale, useAppInitialization, useTheme } from '@gitcoffee/app';
import { onMounted } from 'vue';
// 导入应用默认设置
import { APP_SETTING } from '../config/config';
// 导入登录检查相关
import { useSettingsStore } from '../stores';

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
  },
});

// 初始化配置
onMounted(() => {
  setTheme();
  setupThemeListener();
});
</script>

<script lang="ts">
import { initApp } from '@gitcoffee/app';
import { App } from 'vue';
import AppComponent from '../App.vue';
import router from '../router';
import { registerAntdvComponents } from '../components/antdv.register';
import { APP_ID, BASE_URL } from '../config/config';
import { useSettingsStore } from '../stores';

// Use regular script block to export Plasmo-specific functions
export default {
  // Plasmo will call this function to configure the app instance
  async prepare(app: App) {
    // 使用与主应用相同的初始化逻辑
    await initApp({
      App: AppComponent,
      router,
      registerComponents: (app) => {
        registerAntdvComponents(app);
      },
      BASE_URL,
      APP_ID,
      useSettingsStore,
      app, // 使用 Plasmo 提供的应用实例
    });
  },
};
</script>
