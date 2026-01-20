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
import { message, Modal } from '@gitcoffee/design-ui';
import { onActivated, onMounted, onUnmounted } from 'vue';
import { $t } from '../../locales';
import { useSettingsStore } from '../../stores';

// 导出用户信息（从 store 获取）
export const userInfo = () => useSettingsStore().userInfo;

// 导出用户是否登录（从 store 获取）
export const isLoggedIn = () => useSettingsStore().getIsLoggedIn;

// 导出加载用户信息函数（使用 store）
export const loadUserInfo = async () => {
  return await useSettingsStore().loadUserInfo();
};

// 导出登录函数（使用 store）
export const login = () => {
  useSettingsStore().login();
};

// 导出登录检查函数（使用 store）
export const checkLogin = () => {
  const settingsStore = useSettingsStore();
  if (!settingsStore.getIsLoggedIn) {
    Modal.confirm({
      title: $t('common.login.prompt'),
      content: $t('common.login.confirm'),
      onOk() {
        settingsStore.login();
      },
      onCancel() {
        // 用户取消登录
      },
    });
    return false;
  }
  return true;
};

// 导出登出函数（使用 store）
export const logout = async () => {
  try {
    await useSettingsStore().logout();
    message.success($t('common.logout.success'));
  } catch (error) {
    console.error('Failed to logout:', error);
    message.error($t('common.logout.error'));
  }
};

// 页面可见性变化时重新加载用户信息
export const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    useSettingsStore().loadUserInfo();
  }
};

// 设置用户信息的生命周期钩子
export const setupUserLifecycle = () => {
  onMounted(() => {
    // 初始加载用户信息
    useSettingsStore().loadUserInfo();

    // 添加页面可见性监听
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  // 当组件被激活时（用于keep-alive场景）
  onActivated(() => {
    // 组件激活时重新加载用户信息
    useSettingsStore().loadUserInfo();
  });

  onUnmounted(() => {
    // 移除页面可见性监听
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });
};
