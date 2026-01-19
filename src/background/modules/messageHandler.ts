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

// Chrome API 类型声明
declare const chrome: any;

// 处理获取平台请求
const handleGetPlatformsRequest = (
  request: any,
  sendResponse: (response: any) => void
) => {
  // 获取指定分类的平台
  const requestedCategories = request.categories || [];
  const result = requestedCategories.flatMap((category: string) =>
    getPlatformsByCategory(category)
  );

  sendResponse({ platforms: result });
  return true;
};

// 处理AI搜索重试请求
const handleRetrySearchRequest = (
  request: any,
  sendResponse: (response: any) => void
) => {
  // 处理AI搜索请求重试
  const { tabId, query, chatConfig, platformName } = request;

  // 检查是否已经处理过该查询
  const tabQueries = processedQueries.get(tabId) || new Set();
  const tabQueryKey = `${platformName}:${query.trim().toLowerCase()}`;

  // 严格限制：每个查询只允许处理一次，不允许重试
  // 这是防止多次填充和提交的关键改进
  if (tabQueries.has(tabQueryKey)) {
    console.warn(
      `标签页 ${tabId} 的 ${platformName} 搜索请求已经处理过，不再重试`
    );
    sendResponse({ success: false, message: '查询已经处理过，不允许重试' });
    return true;
  }

  // 只有在查询尚未处理时才添加到待处理列表
  console.log(
    `添加标签页 ${tabId} 的 ${platformName} 搜索请求到待处理列表:`,
    query
  );

  // 将请求添加到待处理列表
  chrome.storage.local.get(['pendingAiSearchRequests'], (result: any) => {
    const existingRequests = result.pendingAiSearchRequests || [];
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
      chrome.storage.local.set({
        pendingAiSearchRequests: existingRequests,
      });
      console.log(
        `已将标签页 ${tabId} 的 ${platformName} 搜索请求添加到待处理列表`
      );
    }
  });

  sendResponse({ success: true });
  return true;
};

// 处理AI搜索完成请求
const handleSearchCompletedRequest = (
  request: any,
  sendResponse: (response: any) => void
) => {
  // 处理AI搜索请求完成事件
  const { tabId, query, platformName } = request;
  console.log(
    `收到AI搜索请求完成通知: 标签页 ${tabId}, 平台 ${platformName}, 查询 ${query}`
  );

  // 生成唯一的查询处理标识符
  const queryKey = generateQueryKey(tabId, platformName, query);
  const tabQueryKey = `${platformName}:${query.trim().toLowerCase()}`;

  // 从待处理列表中移除该请求
  chrome.storage.local.get(['pendingAiSearchRequests'], (result: any) => {
    if (result.pendingAiSearchRequests) {
      const updatedRequests = result.pendingAiSearchRequests.filter(
        (req: any) =>
          !(
            req.tabId === tabId &&
            req.platformName === platformName &&
            req.query === query
          )
      );
      chrome.storage.local.set({
        pendingAiSearchRequests: updatedRequests,
      });
      console.log(
        `从待处理列表中移除标签页 ${tabId} 的 ${platformName} 搜索请求`
      );
    }
  });

  // 将查询标记为已处理
  const tabQueries = processedQueries.get(tabId) || new Set();
  tabQueries.add(tabQueryKey);
  processedQueries.set(tabId, tabQueries);

  sendResponse({ success: true });
  return true;
};

// 处理获取标签页请求
const handleGetTabsRequest = (sendResponse: (response: any) => void) => {
  // 获取当前窗口的所有标签页
  chrome.tabs.query({ currentWindow: true }, (tabs: any[]) => {
    sendResponse({ tabs: tabs });
  });
  return true;
};

// 处理分组搜索请求
const handleGroupingSearchRequest = (
  request: any,
  sendResponse: (response: any) => void
) => {
  handleSearchWithGroupingRequest(request)
    .then(() => {
      sendResponse({ success: true });
    })
    .catch((error) => {
      console.error('Grouped search failed:', error);
      sendResponse({ success: false, error: '分组搜索失败' });
    });

  return true;
};

// 处理标签页搜索请求
const handleTabsSearchRequest = (
  request: any,
  sendResponse: (response: any) => void
) => {
  // 处理标签页搜索请求
  handleTabSearchRequest(request)
    .then(() => {
      sendResponse({ success: true });
    })
    .catch((error) => {
      console.error('Tab search failed:', error);
      sendResponse({ success: false, error: '标签页搜索失败' });
    });

  return true;
};

// 初始化消息监听器
export const initializeMessageListener = () => {
  // 监听消息
  chrome.runtime.onMessage.addListener(
    (request: any, _sender: any, sendResponse: (response: any) => void) => {
      if (request.action === 'getPlatforms') {
        return handleGetPlatformsRequest(request, sendResponse);
      }

      if (request.action === 'retryAiSearchRequest') {
        return handleRetrySearchRequest(request, sendResponse);
      }

      if (request.action === 'aiSearchRequestCompleted') {
        return handleSearchCompletedRequest(request, sendResponse);
      }

      if (request.action === 'getTabs') {
        return handleGetTabsRequest(sendResponse);
      }

      if (request.action === 'searchWithGrouping') {
        return handleGroupingSearchRequest(request, sendResponse);
      }

      if (request.action === 'searchTabs') {
        return handleTabsSearchRequest(request, sendResponse);
      }

      return true;
    }
  );
};
