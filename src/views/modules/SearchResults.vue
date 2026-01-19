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
  <SearchResults :searchApiConfig="searchApiConfig" :iconUrl="iconUrl" v-model:showSettingModal="showSettingModal">
    <template #user-setting>
      <UserSetting v-model="showSettingModal" />
    </template>
  </SearchResults>
</template>

<script setup lang="ts">
import { SearchResults } from '@gitcoffee/search-ui';
import { message } from '@gitcoffee/design-ui';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import iconUrl from '../../../assets/icon.png';
import { SEARCH_API_CONFIG } from '../../config/config';
import { useCurrentLanguage, localeManager, $t } from '@gitcoffee/i18n';
import UserSetting from '../components/UserSetting.vue';
import { settingData } from '@gitcoffee/search';
import { useSettingsStore } from '../../stores';

// 获取当前语言的响应式引用，确保语言切换时组件自动更新
const currentLanguageRef = useCurrentLanguage();

// 路由和导航
const route = useRoute();
const router = useRouter();

// 搜索结果接口配置 - 使用配置文件中的值
const searchApiConfig = ref(SEARCH_API_CONFIG);

// 响应式数据
const showSettingModal = ref(false); // 设置弹窗显示状态

// Debug logging for locale changes
console.log('=== SearchResults.vue ===');
console.log('Initial locale value:', currentLanguageRef.value);
console.log('currentLanguageRef:', currentLanguageRef);
console.log('currentLanguageRef.value:', currentLanguageRef.value);
console.log('localeManager initialized:', localeManager.initialized);

// Watch currentLanguageRef changes
watch(currentLanguageRef, (newVal, oldVal) => {
  console.log('=== SearchResults.vue ===');
  console.log('currentLanguageRef changed from:', oldVal, 'to:', newVal);
  // 确保全局语言设置与currentLanguageRef保持同步
  localeManager.setLanguage(newVal);
});

// 从路由参数获取搜索查询
onMounted(() => {
  // 确保组件的语言与当前语言同步，解决从首页导航过来时语言不更新的问题
  localeManager.setLanguage(currentLanguageRef.value);

  const query = route.query.q as string;
  if (query) {
    // 组件内部会自动处理搜索查询
  } else {
    router.push('/');
    message.warning($t('searchResults.noQuery'));
  }
});
</script>

<style scoped>
/* 自定义样式 - 主要是针对用户设置组件的样式 */
.setting-button-wrapper {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.setting-button {
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #333;
  border: 1px solid #dfe1e5;
  border-radius: 4px;
  padding: 6px 12px;
  transition: all 0.3s ease;
}

.setting-button:hover {
  color: var(--primary-color);
  background: rgba(0, 0, 0, 0.05);
}

/* 深色主题样式 - 主要是针对用户设置按钮的深色模式 */
html.dark .setting-button {
  border-color: #5f6368;
  color: #e8eaed;
}
</style>