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
// 导入搜索元数据
import { getPlatformsByCategory } from '@gitcoffee/search';
// 导入AI对话处理函数
import {
  handleAISearchRequestCompleted,
  handleRetryAiSearchRequest,
} from './aiChatHandler';
// 导入搜索任务处理函数
import {
  handleSearchWithGroupingRequest,
  handleTabSearchRequest,
} from './searchTaskHandler';
// 导入状态
import { processedQueries } from './state';
// 导入工具函数
import { generateQueryKey } from './utils';
// 导入browser模块
import { storageGet, storageSet, registerMessageHandler, getTabs } from '@gitcoffee/browser';

// 处理获取平台请求
const handleGetPlatformsRequest = async (message: any) => {
  // 获取指定分类的平台
  const requestedCategories = message.categories || [];
  const result = requestedCategories.flatMap((category: string) =>
    getPlatformsByCategory(category)
  );

  return { platforms: result };
};

// 处理AI搜索重试请求
const handleRetrySearchRequest = async (message: any) => {
  // 处理AI搜索请求重试
  const { tabId, query, chatConfig, platformName } = message;

  // 检查是否已经处理过该查询
  const tabQueries = processedQueries.get(tabId) || new Set();
  const tabQueryKey = `${platformName}:${query.trim().toLowerCase()}`;

  // 严格限制：每个查询只允许处理一次，不允许重试
  // 这是防止多次填充和提交的关键改进
  if (tabQueries.has(tabQueryKey)) {
    console.warn(
      `标签页 ${tabId} 的 ${platformName} 搜索请求已经处理过，不再重试`
    );
    return { success: false, message: '查询已经处理过，不允许重试' };
  }

  // 只有在查询尚未处理时才添加到待处理列表
  console.log(
    `添加标签页 ${tabId} 的 ${platformName} 搜索请求到待处理列表:`,
    query
  );

  // 将请求添加到待处理列表
  const existingRequests = await storageGet('pendingAiSearchRequests') || [];
  // 检查是否已经存在该标签页的请求
  const existingRequest = existingRequests.find(
    (req: any) => req.tabId === tabId
  );
  if (!existingRequest) {
    existingRequests.push({
      tabId,
      query,
      chatConfig,
      platformName,
    });
    await storageSet('pendingAiSearchRequests', existingRequests);
    console.log(
      `已将标签页 ${tabId} 的 ${platformName} 搜索请求添加到待处理列表`
    );
  }

  return { success: true };
};

// 处理AI搜索完成请求
const handleSearchCompletedRequest = async (message: any) => {
  // 处理AI搜索请求完成事件
  const { tabId, query, platformName } = message;
  console.log(
    `收到AI搜索请求完成通知: 标签页 ${tabId}, 平台 ${platformName}, 查询 ${query}`
  );

  // 生成唯一的查询处理标识符
  const queryKey = generateQueryKey(tabId, platformName, query);
  const tabQueryKey = `${platformName}:${query.trim().toLowerCase()}`;

  // 从待处理列表中移除该请求
  const existingRequests = await storageGet('pendingAiSearchRequests') || [];
  if (existingRequests) {
    const updatedRequests = existingRequests.filter(
      (req: any) =>
        !(
          req.tabId === tabId &&
          req.platformName === platformName &&
          req.query === query
        )
    );
    await storageSet('pendingAiSearchRequests', updatedRequests);
    console.log(
      `从待处理列表中移除标签页 ${tabId} 的 ${platformName} 搜索请求`
    );
  }

  // 将查询标记为已处理
  const tabQueries = processedQueries.get(tabId) || new Set();
  tabQueries.add(tabQueryKey);
  processedQueries.set(tabId, tabQueries);

  return { success: true };
};

// 处理获取标签页请求
const handleGetTabsRequest = async () => {
  // 获取当前窗口的所有标签页
  const tabs = await getTabs();
  return { tabs: tabs };
};

// 处理分组搜索请求
const handleGroupingSearchRequest = async (message: any) => {
  try {
    await handleSearchWithGroupingRequest(message);
    return { success: true };
  } catch (error) {
    console.error('Grouped search failed:', error);
    return { success: false, error: '分组搜索失败' };
  }
};

// 处理标签页搜索请求
const handleTabsSearchRequest = async (message: any) => {
  try {
    await handleTabSearchRequest(message);
    return { success: true };
  } catch (error) {
    console.error('Tab search failed:', error);
    return { success: false, error: '标签页搜索失败' };
  }
};

// 初始化消息监听器
export const initializeMessageListener = async () => {
  // 注册消息处理器
  await registerMessageHandler('getPlatforms', handleGetPlatformsRequest);
  await registerMessageHandler('retryAiSearchRequest', handleRetrySearchRequest);
  await registerMessageHandler('aiSearchRequestCompleted', handleSearchCompletedRequest);
  await registerMessageHandler('getTabs', handleGetTabsRequest);
  await registerMessageHandler('searchWithGrouping', handleGroupingSearchRequest);
  await registerMessageHandler('searchTabs', handleTabsSearchRequest);
};
