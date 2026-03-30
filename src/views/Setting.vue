/** * Copyright (c) 2025-2099 GitCoffee All Rights Reserved.
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
 * limitations under the License. */
<template>
  <SearchSetting
    :supported-languages="supportedLanguages"
    :app-info="APP_INFO"
  >
    <template #account-profile>
      <AccountProfile :user-info="userInfo" :login="login" :logout="logout" />
    </template>
    <template #plugin>
      <Plugin />
    </template>
  </SearchSetting>
</template>

<script setup lang="ts">
import { SearchSetting } from '@gitcoffee/search-ui';

import { AccountProfile } from '@gitcoffee/setting-ui';

import { supportedLanguages, useI18n } from '@gitcoffee/i18n';
import { authManager, useAuth } from '@gitcoffee/auth';
import Plugin from './Plugin.vue';
import { useSettingsStore } from '../stores';
import { onMounted, computed } from 'vue';
import { APP_INFO } from '../config/config';

// 初始化设置 store
const settingsStore = useSettingsStore();

// 获取i18n实例和$t函数
const { t: $t } = useI18n();

// 使用 useAuth 获取登录检查函数
const { checkLogin } = useAuth();

// 响应式计算属性
const userInfo = computed(() => settingsStore.userInfo);
const login = () => checkLogin();
const logout = () => settingsStore.logout();

// 加载用户信息
onMounted(async () => {
  await settingsStore.initialize();
  // 同步登录状态到 AuthManager
  authManager.setUserInfo(settingsStore.getIsLoggedIn ? settingsStore.userInfo : null);
  
  // 调试：检查 authManager 的配置
  console.log('[SeekFlow Setting] AuthManager isLoggedIn:', authManager.getState().isLoggedIn);
  console.log('[SeekFlow Setting] AuthManager userInfo:', authManager.getState().userInfo);
});
</script>