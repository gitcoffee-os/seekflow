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
// 搜索任务基础模块 - 定义接口和基本状态管理

// Chrome API 类型声明
declare const chrome: any;

// 搜索任务信息接口，用于跟踪标签页加载状态
export interface SearchTask {
  query: string;
  expectedTabs: number;
  loadedTabs: number;
  tabIds: number[];
  loadedTabIds: Set<number>; // 已加载的标签页ID集合，确保每个标签页只被计数一次
  platformNames: string[];
  aiChatPlatforms: Array<{
    tabId: number;
    chatConfig: any;
    platformName: string;
  }>;
  startTime: number;
}

// 存储活跃的搜索任务
export const activeSearchTasks = new Map<string, SearchTask>();

/**
 * 获取搜索任务
 * @param taskId 任务ID
 * @returns 搜索任务对象或undefined
 */
export const getSearchTask = (taskId: string): SearchTask | undefined => {
  return activeSearchTasks.get(taskId);
};

/**
 * 清理搜索任务
 * @param taskId 任务ID
 */
export const cleanupSearchTask = (taskId: string): void => {
  activeSearchTasks.delete(taskId);
};

/**
 * 更新搜索任务加载状态
 * @param taskId 任务ID
 * @param tabId 标签页ID
 */
export const updateSearchTaskLoadedState = (
  taskId: string,
  tabId: number
): void => {
  const searchTask = activeSearchTasks.get(taskId);
  if (searchTask) {
    // 检查该标签页是否已经被计数过
    if (!searchTask.loadedTabIds.has(tabId)) {
      searchTask.loadedTabIds.add(tabId);
      searchTask.loadedTabs = searchTask.loadedTabIds.size;
      console.log(
        `搜索任务 ${taskId} 标签页 ${tabId} 加载完成，已加载 ${searchTask.loadedTabs}/${searchTask.expectedTabs}`
      );

      // 如果所有预期的标签页都已加载完成，清理任务
      if (searchTask.loadedTabs >= searchTask.expectedTabs) {
        console.log(`搜索任务 ${taskId} 所有标签页加载完成，清理任务`);
        activeSearchTasks.delete(taskId);
      }
    }
  }
};
