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

import { defineStore } from '@gitcoffee/store';
import { getItem, setItem, removeItem } from '@gitcoffee/storage';
import { search } from '@gitcoffee/api';
import { createTab } from '@gitcoffee/browser';

export interface UserInfo {
  nickname: string;
  credits: number;
}

export interface AppSettings {
  language: string;
  theme: string;
  trustedDomains: string[];
  smartSearch?: boolean;
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // 用户信息
    userInfo: {
      nickname: '',
      credits: 0,
    } as UserInfo,
    // 应用设置
    appSettings: {
      language: 'zh',
      theme: 'light',
      trustedDomains: [],
      smartSearch: true,
    } as AppSettings,
    // 加载状态
    isLoading: false,
    isLoggedIn: false,
  }),
  
  getters: {
    // 计算用户是否登录
    getIsLoggedIn: (state) => !!state.userInfo.nickname,
    // 获取用户信息
    getUserInfo: (state) => state.userInfo,
    // 获取应用设置
    getAppSettings: (state) => state.appSettings,
    // 获取受信任域名
    getTrustedDomains: (state) => state.appSettings.trustedDomains,
  },
  
  actions: {
    // 初始化设置
    async initialize() {
      this.isLoading = true;
      try {
        // 加载用户信息
        await this.loadUserInfo();
        // 加载应用设置
        await this.loadAppSettings();
      } catch (error) {
        console.error('Failed to initialize settings:', error);
      } finally {
        this.isLoading = false;
      }
    },
    
    // 加载用户信息
    async loadUserInfo() {
      try {
        // 从API获取用户信息
        const res = await search.user.userInfoApi({});
        if (res && res.data) {
          const data = res.data;
          this.userInfo = data;
          this.isLoggedIn = !!data.nickname;
          // 保存到本地存储
          await setItem('user', JSON.stringify(data));
          return data;
        }
      } catch (error) {
        console.error('Failed to load user info:', error);
      }
      // 尝试从本地存储加载（API调用失败或返回undefined时）
      const savedUser = await getItem('user');
      if (savedUser) {
        this.userInfo = JSON.parse(savedUser);
        this.isLoggedIn = !!this.userInfo.nickname;
      }
      return null;
    },
    
    // 保存用户信息
    async saveUserInfo(userData: UserInfo) {
      this.userInfo = userData;
      this.isLoggedIn = !!userData.nickname;
      await setItem('user', JSON.stringify(userData));
    },
    
    // 登录
    async login() {
      try {
        // 使用统一的 createTab 函数创建标签页
        await createTab('https://seekflow.exmay.com/exmay/seekflow/center/home', { active: true });
      } catch (error) {
        // 降级处理：如果 createTab 失败，使用 window.open
        if (typeof window !== 'undefined' && window.open) {
          window.open('https://seekflow.exmay.com/exmay/seekflow/center/home', '_blank');
        }
      }
    },
    
    // 登出
    async logout() {
      try {
        await search.account.logoutApi({});
        // 清除用户信息
        this.userInfo = {
          nickname: '',
          credits: 0,
        };
        this.isLoggedIn = false;
        // 移除本地存储
        await removeItem('user');
        return true;
      } catch (error) {
        console.error('Failed to logout:', error);
        return false;
      }
    },
    
    // 加载应用设置
    async loadAppSettings() {
      try {
        // 从本地存储加载应用设置
        const savedSettings = await getItem('appSettings');
        if (savedSettings) {
          // 检查savedSettings的类型
          if (typeof savedSettings === 'string') {
            try {
              this.appSettings = { ...this.appSettings, ...JSON.parse(savedSettings) };
            } catch (parseError) {
              console.error('Failed to parse app settings:', parseError);
              // 解析失败时，重置为默认设置
              this.appSettings = {
                language: 'zh',
                theme: 'light',
                trustedDomains: [],
                smartSearch: true,
              };
              // 保存默认设置
              await this.saveAppSettings(this.appSettings);
            }
          } else if (typeof savedSettings === 'object') {
            // 如果直接返回了对象，直接使用
            this.appSettings = { ...this.appSettings, ...savedSettings };
          }
        }
      } catch (error) {
      console.error('Failed to load app settings:', error);
      // 加载失败时，重置为默认设置
      this.appSettings = {
        language: 'zh',
        theme: 'light',
        trustedDomains: [],
        smartSearch: true,
      };
    }
    },
    
    // 保存应用设置
    async saveAppSettings(settings: Partial<AppSettings>) {
      this.appSettings = { ...this.appSettings, ...settings };
      await setItem('appSettings', JSON.stringify(this.appSettings));
    },
    
    // 保存受信任域名
    async saveTrustedDomains(domains: string[]) {
      this.appSettings.trustedDomains = domains;
      await this.saveAppSettings(this.appSettings);
    },
    
    // 切换语言
    async changeLanguage(language: string) {
      await this.saveAppSettings({ language });
    },
    
    // 切换主题
    async changeTheme(theme: string) {
      await this.saveAppSettings({ theme });
      // 同时更新 settingData 中的主题设置，确保两处数据同步
      try {
        const { settingData, useTheme } = await import('@gitcoffee/app');
        if (settingData.value) {
          settingData.value.theme = theme;
        }
        // 应用主题
        const { setTheme } = useTheme();
        setTheme();
      } catch (error) {
        console.error('Error applying theme:', error);
      }
    },
  },
});