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
  <SearchHome
    :app-name="APP_INFO.name"
    :official-website="APP_INFO.officialWebsite"
    :logo-url="iconUrl"
    :setting-data="settingData"
    :show-search-box="showSearchBox"
    :show-chat-bot-toggle="settingData.smartSearchEnabled && settingData.aiModeSearch"
    @language-change="handleLanguageChange"
    @open-setting="showSettingModal = true"
    @toggle-theme="toggleTheme"
    @toggle-search-mode="toggleSearchMode"
  >
    <!-- 搜索内容区域 - 条件渲染搜索框或ChatBot -->
    <template #search-content>
      <div v-if="showSearchBox" class="search-mode-content">
        <SearchBox />
      </div>
      <!-- ChatBot对话框 -->
      <div v-else class="chatbot-mode-content">
        <Chatbot :show-header="false" @send-message="handleChatbotMessage" ref="chatbotRef" />
      </div>
    </template>
  </SearchHome>

  <!-- 用户设置组件 -->
  <UserSetting v-model="showSettingModal" />
</template>

<script setup lang="ts">
// 导入插件管理器用于本地化
import { pluginManager } from '@gitcoffee/plugins';
import { SmartSearch, SearchHome } from '@gitcoffee/search-ui';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { setLanguage } from '@gitcoffee/i18n';
import { useCurrentLanguage } from '../locales';
import { Chatbot } from '@gitcoffee/chatbot-ui';
// 导入logo.svg资源
import iconUrl from '../../assets/logo.svg';
// 导入应用配置
import { APP_INFO } from '../config/config';

import SearchBox from './components/SearchBox.vue';
import UserSetting from './components/UserSetting.vue';

// 导入设置数据
import {
  saveSettingsToStorage,
  settingData,
} from '@gitcoffee/app';

import { useI18n } from '@gitcoffee/i18n';

// 响应式数据
const router = useRouter();
// 获取i18n实例和$t函数
const { t: $t } = useI18n();

const showSettingModal = ref(false); // 设置弹窗显示状态
// 创建Chatbot组件引用
const chatbotRef = ref<InstanceType<typeof Chatbot> | null>(null);

// 控制搜索框和ChatBot的切换
const showSearchBox = ref(true); // 默认显示搜索框
const toggleSearchMode = () => {
  showSearchBox.value = !showSearchBox.value;
};

// 默认显示搜索框，不监听设置中的默认搜索类型变化

// 主题切换功能 - 与settingData同步
const toggleTheme = () => {
  settingData.value.theme = settingData.value.theme === 'dark' ? 'light' : 'dark';
  // 保存设置到存储
  saveSettingsToStorage();
};

// 处理语言切换
const handleLanguageChange = (langCode: string) => {
  console.log('handleLanguageChange called with langCode:', langCode);
  if (langCode) {
    setLanguage(langCode);
  }
};

// 处理Chatbot发送消息
const handleChatbotMessage = async (data: { content: string; tags: string[] }) => {
  try {
    // 动态导入搜索功能
    const { executeSearch } = await import('@gitcoffee/search');
    // 执行搜索
    await executeSearch(data.content, []);
  } catch (error) {
    console.error('处理Chatbot消息失败:', error);
  } finally {
    // 重置Chatbot的发送状态
    chatbotRef.value?.resetSendState?.();
  }
};
</script>

<style scoped>
/* 应用特定的样式可以在这里添加 */
</style>