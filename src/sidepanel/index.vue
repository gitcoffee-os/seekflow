/** * Copyright (c) 2025-2099 GitCoffee All Rights Reserved. * * Licensed under
the Apache License, Version 2.0 (the "License"); * you may not use this file
except in compliance with the License. * You may obtain a copy of the License at
* * http://www.apache.org/licenses/LICENSE-2.0 * * Unless required by applicable
law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
either express or implied. * See the License for the specific language governing
permissions and * limitations under the License. */
<template>
  <SearchSetting :app-info="APP_INFO" />
</template>

<script setup lang="ts">
import { SearchSetting } from '@gitcoffee/search-ui';
import { APP_INFO } from '../config/config';

</script>

<style>
@import '../styles/global.css';
</style>

<script lang="ts">
import { initPluginSystem } from '@gitcoffee/plugins';
import { initStore } from '@gitcoffee/store';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  ConfigProvider,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Layout,
  Menu,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Slider,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
} from '@gitcoffee/design-ui';
import { enUS, zhCN } from '@gitcoffee/design-ui';
import { App } from 'vue';
import { createI18nInstance, setI18n } from '@gitcoffee/i18n';

// 组件库国际化映射
const antdLocaleMap = {
  en: enUS,
  zh: zhCN,
};

// Use regular script block to export Plasmo-specific functions
export default {
  // Plasmo will call this function to configure the app instance
  async prepare(app: App) {
    // 初始化 Store
    await initStore(app);

    // 注册 Ant Design Vue 组件
    app.use(Button);
    app.use(Input);
    app.use(Layout);
    app.use(Card);
    app.use(Tag);
    app.use(Spin);
    app.use(Empty);
    app.use(Checkbox);
    app.use(Radio);
    app.use(Slider);
    app.use(Space);
    app.use(Modal);
    app.use(Drawer);
    app.use(Row);
    app.use(Col);
    app.use(Tabs);
    app.use(Switch);
    app.use(Collapse);
    app.use(Avatar);
    app.use(Select);
    app.use(Dropdown);
    app.use(Menu);

    // 配置全局属性
    app.config.globalProperties.$message = message;

    // 初始化 i18n
    const i18n = createI18nInstance();

    // 将 i18n 实例传递给 LocaleManager，以便在语言切换时更新全局 locale
    setI18n(i18n);

    // 配置 Ant Design Vue 国际化
    app.use(ConfigProvider, {
      locale:
        antdLocaleMap[i18n.global.locale.value as keyof typeof antdLocaleMap] ||
        zhCN,
      // 不在这里设置主题算法，让组件级配置生效
    });

    app.use(i18n);

    // 初始化插件系统
    await initPluginSystem();
  },
};
</script>
