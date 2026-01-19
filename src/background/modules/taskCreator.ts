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
import { allPlatforms } from '@gitcoffee/search';
import { handleRetryAiSearchRequest } from './aiChatHandler';
import { activeSearchTasks, SearchTask } from './searchTask';
import { createTabGroup } from './tabGroupManager';
import { generateTaskId } from './utils';

// 搜索任务创建模块 - 处理搜索任务的创建和标签页创建

// Chrome API 类型声明
declare const chrome: any;

/**
 * 创建搜索任务
 * @param query 搜索关键词
 * @param selectedPlatformNames 选中的平台名称数组
 * @param searchDelay 平台间的延迟时间
 * @returns Promise<void>
 */
export const createSearchTask = (
  query: string,
  selectedPlatformNames: string[],
  searchDelay: number
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!query || typeof query !== 'string') {
        throw new Error('搜索关键词不能为空');
      }

      if (
        !selectedPlatformNames ||
        !Array.isArray(selectedPlatformNames) ||
        selectedPlatformNames.length === 0
      ) {
        throw new Error('请至少选择一个搜索平台');
      }

      // 从全局平台数据中获取完整的平台对象
      console.log('Received selectedPlatformNames:', selectedPlatformNames);
      console.log(
        'selectedPlatformNames length:',
        selectedPlatformNames.length
      );

      const selectedPlatforms = allPlatforms.filter((platform) =>
        selectedPlatformNames.some(
          (selectedName) =>
            selectedName.toLowerCase() === platform.name.toLowerCase()
        )
      );

      console.log(
        'Filtered selectedPlatforms:',
        selectedPlatforms.map((p) => p.name)
      );

      if (selectedPlatforms.length === 0) {
        throw new Error('未找到有效的搜索平台');
      }

      // 获取当前窗口
      const currentWindow = await chrome.windows.getCurrent();

      // 生成唯一任务ID
      const taskId = generateTaskId();

      // 初始化搜索任务
      const searchTask: SearchTask = {
        query,
        expectedTabs: selectedPlatforms.length,
        loadedTabs: 0,
        tabIds: [],
        loadedTabIds: new Set<number>(), // 初始化已加载标签页ID集合
        platformNames: selectedPlatformNames,
        aiChatPlatforms: [],
        startTime: Date.now(),
      };

      activeSearchTasks.set(taskId, searchTask);

      // 存储需要处理的AI对话平台信息
      const aiChatPlatforms: Array<{
        tabId: number;
        chatConfig: any;
        platformName: string;
      }> = [];

      // 创建所有标签页的ID数组，用于后续创建标签组
      const createdTabIds: number[] = [];

      console.log('Starting to create tabs for all platforms...');
      console.log('Total platforms to process:', selectedPlatforms.length);

      // 处理所有平台，创建标签页
      for (let i = 0; i < selectedPlatforms.length; i++) {
        console.log(
          `Processing platform index ${i}: ${selectedPlatforms[i].name}`
        );

        const platform = selectedPlatforms[i];

        try {
          // 确保 platform.searchUrl 是一个函数
          if (typeof platform.searchUrl !== 'function') {
            console.error('平台', platform.name, '的 searchUrl 不是一个函数');
            searchTask.expectedTabs--;
            continue;
          }

          const searchUrl = platform.searchUrl(query);
          console.log(
            `Creating tab for platform ${platform.name}, URL: ${searchUrl}`
          );

          // 创建新标签页
          const tab = await chrome.tabs.create({
            url: searchUrl,
            active: selectedPlatforms.length === 1 && i === 0, // 只选择一个平台时激活第一个标签页
            windowId: currentWindow.id,
          });

          console.log(
            `Created tab for platform ${platform.name}, tabId: ${tab.id}`
          );

          if (tab.id) {
            createdTabIds.push(tab.id);
            searchTask.tabIds.push(tab.id);
            console.log(`Added tabId ${tab.id} to searchTask.tabIds`);

            // 短暂激活标签页，让浏览器渲染页面
            if (selectedPlatforms.length > 1) {
              // 只在创建多个标签页时执行
              await chrome.tabs.update(tab.id, { active: true });
              // 短暂延迟，让浏览器有时间渲染页面
              await new Promise((resolve) => setTimeout(resolve, 100));
              // 恢复激活状态
              if (i > 0) {
                await chrome.tabs.update(createdTabIds[0], { active: true });
              }
            }

            // 如果是AI对话平台，记录需要处理的平台信息
            if (platform.category === 'AI对话' && platform.aiChatConfig) {
              aiChatPlatforms.push({
                tabId: tab.id!,
                chatConfig: platform.aiChatConfig,
                platformName: platform.name,
              });

              // 对于所有AI对话平台，都添加到待处理请求中，以便在页面重定向或重新加载时自动处理
              chrome.storage.local.get(
                ['pendingAiSearchRequests'],
                async (result: any) => {
                  const existingRequests = result.pendingAiSearchRequests || [];
                  // 检查是否已经存在该标签页的请求
                  const existingRequest = existingRequests.find(
                    (req: any) => req.tabId === tab.id
                  );
                  if (!existingRequest) {
                    existingRequests.push({
                      tabId: tab.id!,
                      query,
                      chatConfig: platform.aiChatConfig,
                      platformName: platform.name,
                    });
                    await chrome.storage.local.set({
                      pendingAiSearchRequests: existingRequests,
                    });
                    console.log(
                      `已将${platform.name}添加到待处理请求列表，等待页面加载完成后处理`
                    );
                  }
                }
              );
            }
          } else {
            console.warn(
              `Tab creation failed for platform ${platform.name}, no tabId returned`
            );
            searchTask.expectedTabs--;
          }

          // 添加延迟，避免浏览器限制
          if (i < selectedPlatforms.length - 1 && searchDelay > 0) {
            console.log(
              `Adding delay of ${searchDelay}ms before next tab creation`
            );
            await new Promise((resolve) => setTimeout(resolve, searchDelay));
          }
        } catch (error) {
          console.error(
            `Error creating tab for platform ${platform.name}:`,
            error
          );
          searchTask.expectedTabs--;
        }
      }

      console.log('Finished creating tabs for all platforms');
      console.log('Final createdTabIds:', createdTabIds);
      console.log('Final searchTask.tabIds:', searchTask.tabIds);
      console.log('Final searchTask.tabIds length:', searchTask.tabIds.length);

      // 创建标签页分组
      if (createdTabIds.length > 0) {
        await createTabGroup(createdTabIds, query);
      }

      // 更新搜索任务的AI平台信息
      searchTask.aiChatPlatforms = aiChatPlatforms;

      // 如果预期标签页数量为0，直接清理任务
      if (searchTask.expectedTabs === 0) {
        activeSearchTasks.delete(taskId);
        resolve();
        return;
      }

      // 为每个创建的标签页添加标识，用于跟踪加载状态
      for (const tabId of searchTask.tabIds) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (taskId: string) => {
              window.seekflowSearchTaskId = taskId;
            },
            args: [taskId],
          });
        } catch (error) {
          console.warn(`为标签页 ${tabId} 添加标识失败:`, error);
        }
      }

      // 设置超时清理，防止任务永远挂起
      setTimeout(() => {
        if (activeSearchTasks.has(taskId)) {
          console.warn(`搜索任务 ${taskId} 超时，清理任务`);
          activeSearchTasks.delete(taskId);
        }
      }, 30000); // 30秒超时

      resolve();
    } catch (error) {
      console.error('Error creating search task:', error);
      reject(error);
    }
  });
};
