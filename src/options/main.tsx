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
import { initStore } from '@gitcoffee/store';
import Setting from '../views/Setting.vue';
import { registerAntdvComponents } from '../components/antdv.register';
import { initApp as initGitCoffeeApp } from '@gitcoffee/app';
import router from '../router';
import { useSettingsStore } from '../stores';
import { APP_ID, BASE_URL } from '../config/config';

// 导入项目语言资源
import '../locales';

// 组件库国际化映射
const antdLocaleMap = {
  en: enUS,
  zh: zhCN,
};

// 使用通用应用初始化函数
const initApp = async () => {
  await initGitCoffeeApp({
    App: Setting,
    router,
    registerComponents: (app) => {
      registerAntdvComponents(app);
    },
    BASE_URL,
    APP_ID,
    useSettingsStore,
  });
};

initApp();
