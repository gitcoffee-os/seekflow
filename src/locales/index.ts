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

// 导入核心i18n包的功能
import {
  t as coreT,
  localeManager,
  registerLanguageChangeCallback,
  registerProjectMessages,
  getCurrentLanguage
} from '@gitcoffee/i18n';
import { App, ref } from 'vue';
// 导入seekflow项目特定的语言资源
import enCommon from './en/common.json';
import enHome from './en/home.json';
import enSearch from './en/search.json';
import enSearchResults from './en/searchResults.json';
import enSetting from './en/setting.json';
import enAiChat from './en/aiChat.json';
import enChatbot from './en/chatbot.json';
import zhTwCommon from './zh-TW/common.json';
import zhTwHome from './zh-TW/home.json';
import zhTwSearch from './zh-TW/search.json';
import zhTwSearchResults from './zh-TW/searchResults.json';
import zhTwSetting from './zh-TW/setting.json';
import zhTwAiChat from './zh-TW/aiChat.json';
import zhTwChatbot from './zh-TW/chatbot.json';
import zhCommon from './zh/common.json';
import zhHome from './zh/home.json';
import zhSearch from './zh/search.json';
import zhSearchResults from './zh/searchResults.json';
import zhSetting from './zh/setting.json';
import zhAiChat from './zh/aiChat.json';
import zhChatbot from './zh/chatbot.json';

// 注册seekflow项目特定的语言消息到核心i18n
// 英文消息
registerProjectMessages('seekflow', 'en', {
  home: enHome,
  common: enCommon,
  search: enSearch,
  searchResults: enSearchResults,
  setting: enSetting,
  aiChat: enAiChat,
  chatbot: enChatbot
});

// 中文简体消息
registerProjectMessages('seekflow', 'zh', {
  home: zhHome,
  common: zhCommon,
  search: zhSearch,
  searchResults: zhSearchResults,
  setting: zhSetting,
  aiChat: zhAiChat,
  chatbot: zhChatbot
});

// 中文繁体消息
registerProjectMessages('seekflow', 'zh-TW', {
  home: zhTwHome,
  common: zhTwCommon,
  search: zhTwSearch,
  searchResults: zhTwSearchResults,
  setting: zhTwSetting,
  aiChat: zhTwAiChat,
  chatbot: zhTwChatbot
});

/**
 * 创建应用本地的当前语言响应式引用
 * 这样可以确保应用内的响应式系统能够正确追踪语言变化
 */
export const currentLanguage = ref(getCurrentLanguage());

/**
 * 注册语言变化回调，当核心包的语言变化时，更新本地响应式引用
 * 这是实现跨包响应式的关键桥梁
 */
registerLanguageChangeCallback((lang) => {
  console.log('Language changed to:', lang);
  currentLanguage.value = lang;
});

/**
 * Vue插件配置
 * 用于全局注入翻译函数
 */
export const i18nPlugin = {
  install(app: App) {
    // 全局注入$t函数，使用类型断言解决类型不匹配问题
    (app.config.globalProperties as any).$t = coreT;

    // 提供全局注入，支持Composition API
    app.provide('$t', coreT);
  },
};

/**
 * 响应式翻译函数
 * 使用Vue的computed属性确保翻译结果是响应式的
 */
export const useTranslation = () => {
  // 使用本地的currentLanguage引用，确保响应式
  const currentLanguageRef = currentLanguage;

  // 返回一个响应式翻译函数
  const translate = (key: string, params?: any): string => {
    // 访问currentLanguageRef.value建立响应式依赖
    currentLanguageRef.value;
    // 直接使用核心翻译函数
    return coreT(key, params);
  };

  return translate;
};

/**
 * 响应式翻译函数实例
 * 直接使用时会自动建立响应式依赖
 */
export const $t = useTranslation();

/**
 * 自定义的useCurrentLanguage钩子
 * 返回应用本地的currentLanguage响应式引用
 */
export const useCurrentLanguage = () => {
  return currentLanguage;
};

/**
 * 导出统一的API接口
 */
// 语言变化回调注册
export { registerLanguageChangeCallback };
// 核心管理器
export { localeManager };

// 导出核心i18n的所有功能，方便使用
export * from '@gitcoffee/i18n';
