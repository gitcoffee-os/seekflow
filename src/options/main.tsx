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
import {
  ConfigProvider,
  message,
} from 'ant-design-vue';
import { createApp } from 'vue';
import 'ant-design-vue/dist/reset.css';
import '../styles/global.css';
import { initPluginSystem } from '@gitcoffee/plugins';
import enUS from 'ant-design-vue/es/locale/en_US';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import {
  createI18nInstance,
  setI18n,
  updateLocaleFromStorage,
} from '@gitcoffee/i18n';
import { initStore } from '@gitcoffee/store';
import Setting from '../views/Setting.vue';
import { registerAntdvComponents } from '../components/antdv.register';

const app = createApp(Setting);

// 配置全局属性
app.config.globalProperties.$message = message;

// 组件库国际化映射
const antdLocaleMap = {
  en: enUS,
  zh: zhCN,
};

// 初始化 i18n 并挂载应用
const initApp = async () => {
  // 初始化 Store - 必须在注册组件之前
  await initStore(app);

  // 注册Ant Design Vue组件
  registerAntdvComponents(app);

  const i18n = createI18nInstance();


  // 将 i18n 实例传递给 LocaleManager，以便在语言切换时更新全局 locale
  setI18n(i18n);

  // 初始化 Store
  await initStore(app);

  // 配置 Ant Design Vue 国际化
  app.use(ConfigProvider, {
    locale:
      antdLocaleMap[i18n.global.locale.value as keyof typeof antdLocaleMap] ||
      zhCN,
    // 不在这里设置主题算法，让组件级配置生效
  });

  app.use(i18n);

  // 初始化插件系统（在应用挂载之前）
  await initPluginSystem();

  // 挂载应用
  app.mount('#app');

  // 在Chrome扩展环境中，异步获取语言设置并更新i18n实例
  updateLocaleFromStorage(i18n);
};

initApp();
