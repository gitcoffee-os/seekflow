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
// 从子模块导入功能
import {
  cleanupSearchTask,
  getSearchTask,
  updateSearchTaskLoadedState,
} from './searchTask';
import type { SearchTask } from './searchTask';
import { createSearchResultGroup } from './tabGroupManager';
import { createSearchTask } from './taskCreator';

// 搜索任务处理模块 - 统一导出搜索任务相关功能

// Chrome API 类型声明
declare const chrome: any;

// 处理带分组的搜索请求
export const handleSearchWithGroupingRequest = async (
  request: any
): Promise<void> => {
  const { query, platformNames: selectedPlatformNames, searchDelay } = request;
  await createSearchTask(query, selectedPlatformNames, searchDelay);
};

// 处理标签页搜索请求
export const handleTabSearchRequest = async (request: any): Promise<void> => {
  const { query, tabIds } = request;

  if (!query || typeof query !== 'string') {
    throw new Error('搜索关键词不能为空');
  }

  try {
    // 如果没有提供标签页ID，则搜索所有标签页
    if (!tabIds || !Array.isArray(tabIds) || tabIds.length === 0) {
      // 获取当前窗口的所有标签页
      const tabs = await chrome.tabs.query({ currentWindow: true });

      // 过滤出标题或URL包含搜索关键词的标签页
      const matchedTabs = tabs.filter(
        (tab: any) =>
          (tab.title &&
            tab.title.toLowerCase().includes(query.toLowerCase())) ||
          (tab.url && tab.url.toLowerCase().includes(query.toLowerCase()))
      );

      // 将匹配的标签页分组
      if (matchedTabs.length > 1 && matchedTabs.every((tab: any) => tab.id)) {
        const tabIdsToGroup = matchedTabs.map((tab: any) => tab.id!);
        await createSearchResultGroup(tabIdsToGroup, query, true);
      }
    } else {
      // 将指定的标签页分组
      if (tabIds.length > 1) {
        await createSearchResultGroup(tabIds, query, false);
      }
    }
  } catch (error) {
    console.error('Error handling tab search request:', error);
    throw error;
  }
};

// 重新导出子模块的功能，保持向后兼容性
export type { SearchTask } from './searchTask';
export {
  createSearchTask,
  cleanupSearchTask,
  getSearchTask,
  updateSearchTaskLoadedState,
} from './searchTask';
