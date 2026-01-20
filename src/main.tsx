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

import { initStore } from '@gitcoffee/store';
import { createApp } from 'vue';
import 'ant-design-vue/dist/reset.css';
// 导入theme-ui AI主题
import '@gitcoffee/theme-ui/ai.css'; // 使用AI主题样式
// 导入应用默认设置
import { APP_SETTING } from './config/config';
// 导入并注册Ant Design Vue组件
import { registerAntdvComponents } from './components/antdv.register';

// 使用通用应用初始化函数
const startApp = async () => {
  try {
    // 动态导入依赖，确保store初始化后再创建组件
    const { useSettingsStore } = await import('./stores');
    const router = await import('./router').then(m => m.default);
    const { APP_ID, BASE_URL } = await import('./config/config');
    const { initApp } = await import('@gitcoffee/app');
    
    // 创建临时应用实例
    const tempApp = createApp({});
    
    // 初始化Store
    await initStore(tempApp);
    
    // 现在导入locales和App组件
    await import('./locales');
    const { default: App } = await import('./App.vue');
    
    // 创建实际应用实例
    const app = createApp(App);
    
    // 初始化Store again for the actual app
    await initStore(app);

    // 现在初始化应用
    await initApp({
      App,
      router,
      registerComponents: (app) => {
        registerAntdvComponents(app);
      },
      BASE_URL,
      APP_ID,
      useSettingsStore,
      app // 传递现有应用实例
    });
  } catch (error) {
    console.error('Failed to start app:', error);
  }
};

startApp();

