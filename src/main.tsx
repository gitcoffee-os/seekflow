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

import { createApp } from 'vue';
import 'ant-design-vue/dist/reset.css';
// 导入theme-ui AI主题
import '@gitcoffee/theme-ui/ai.css'; // 使用AI主题样式
import App from './App.vue';
// 先导入locales/index.ts，确保翻译资源被注册
import './locales';
import { i18nPlugin } from './locales';
// 导入并注册Ant Design Vue组件
import { registerAntdvComponents } from './components/antdv.register';
import router from './router';
// 导入i18n初始化函数
import { initI18n } from '@gitcoffee/i18n';

// 初始化i18n实例
initI18n().then((i18n) => {
  const app = createApp(App);

  // 注册Ant Design Vue组件
  registerAntdvComponents(app);

  // 注册i18n实例（关键步骤，解决NOT_INSTALLED错误）
  if (i18n) {
    app.use(i18n);
  }

  // 注册i18n插件
  app.use(i18nPlugin);

  // 注册路由
  app.use(router);

  // 挂载应用
  app.mount('#app');
});


