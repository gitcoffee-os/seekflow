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

import 'ant-design-vue/dist/reset.css';
// 导入theme-ui AI主题
import '@gitcoffee/theme-ui/ai.css'; // 使用AI主题样式
import App from './App.vue';
// 先导入locales/index.ts，确保翻译资源被注册
import './locales';
import { useSettingsStore } from './stores';
import router from './router';
import { APP_ID, BASE_URL } from './config/config';
// 导入通用应用初始化函数
import { initApp } from '@gitcoffee/app';

// 导入并注册Ant Design Vue组件
import { registerAntdvComponents } from './components/antdv.register';
// 导入应用默认设置
import { APP_SETTING } from './config/config';

// 使用通用应用初始化函数
initApp({
  App,
  router,
  registerComponents: (app) => {
    registerAntdvComponents(app);
  },
  BASE_URL,
  APP_ID,
  useSettingsStore,
  smartSearchDefault: APP_SETTING.smartSearch,
  aiModeSearchDefault: APP_SETTING.aiModeSearch
});

