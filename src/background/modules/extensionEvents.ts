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
// Chrome API 类型声明
declare const chrome: any;

// 监听扩展安装事件
export const handleExtensionInstalled = () => {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('SeekFlow 扩展已安装');

    // 初始化默认设置
    chrome.storage.sync.set({
      selectedCategories: [
        'AI对话',
        'AI搜索',
        '传统搜索',
        '社交媒体',
        'IT技术',
      ],
      displayMode: 'grid',
      setting_isBrowserTab: false,
    });
  });
};

// 备用方案：如果需要点击扩展图标时打开新标签页（显示 SeekFlow 界面）
export const handleActionClicked = () => {
  chrome.action.onClicked.addListener((_tab: any) => {
    // 在新标签页中打开SeekFlow界面
    chrome.tabs.create({
      url: chrome.runtime.getURL('index.html'),
    });
  });
};

// 初始化所有扩展事件监听器
export const initializeExtensionEvents = () => {
  handleExtensionInstalled();
  handleActionClicked();
};
