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
import { executeAIChatFill } from './aiChatHandler';
import {
  aiChatProcessingTabs,
  currentlyProcessingQueries,
  processedQueries,
  processingTabs,
  tabUrlHistory,
} from './state';
import { generateQueryKey } from './utils';
import { storageGet, storageSet, getExtensionURL, updateTab, onTabCreated, onTabRemoved, onTabActivated, onTabUpdated, executeScript } from '@gitcoffee/browser';

// 监听标签页创建事件
export const handleTabCreated = async () => {
  await onTabCreated(async (tab) => {
    // 检查是否为主页（新标签页）
    // 只处理真正的新标签页，不处理带有特定URL的标签页

    console.log('标签页创建事件数据:', JSON.stringify(tab, null, 2));

    // 核心逻辑：只对pendingUrl为chrome://newtab/的标签页进行重定向
    // 这是判断是否真正的新标签页的最可靠指标
    if (tab.pendingUrl === 'chrome://newtab/') {
      console.log('检测到真正的新标签页，将进行重定向');
      // 获取用户设置
      const isBrowserTab = await storageGet('setting_isBrowserTab') || false;

      if (isBrowserTab) {
        try {
          // 获取扩展的index.html页面URL
          const extensionIndexUrl = getExtensionURL('index.html');

          // 将新标签页重定向到扩展页面
          await updateTab(tab.id, {
            url: extensionIndexUrl,
          });
        } catch (error) {
          const homepageUrl = 'https://seekflow.exmay.com/';

          // 将新标签页重定向到本地首页
          await updateTab(tab.id, {
            url: homepageUrl,
          });
        }
      }
    } else {
      // 如果pendingUrl不是chrome://newtab/（或不存在），说明是通过超链接或其他方式打开的
      // 不进行重定向，让标签页正常导航到目标URL
      console.log('非真正的新标签页，不进行重定向:', {
        pendingUrl: tab.pendingUrl,
        url: tab.url,
        openerTabId: tab.openerTabId,
      });
    }
  });
};

// 监听标签页关闭事件，清理URL历史和已处理查询
export const handleTabRemoved = async () => {
  await onTabRemoved((tabId: number) => {
    tabUrlHistory.delete(tabId);
    processingTabs.delete(tabId);
    processedQueries.delete(tabId);
    aiChatProcessingTabs.delete(tabId); // 清理AI对话处理状态
    console.log(`清理标签页 ${tabId} 的历史记录`);
  });
};

// 监听标签页激活事件，重新尝试填充内容
export const handleTabActivated = async () => {
  await onTabActivated(async (activeInfo: any) => {
    const tabId = activeInfo.tabId;
    console.log(`标签页 ${tabId} 已激活，检查是否需要重新填充内容`);

    // 检查是否有未处理的AI搜索请求
    const pendingAiSearchRequests = await storageGet('pendingAiSearchRequests') || [];
    
    if (pendingAiSearchRequests && pendingAiSearchRequests.length > 0) {
      // 查找当前标签页的待处理请求
      const pendingRequest = pendingAiSearchRequests.find(
        (req: any) => req.tabId === tabId
      );

      if (pendingRequest) {
        const { query, chatConfig, platformName } = pendingRequest;
        console.log(
          `检测到标签页 ${tabId} 有待处理请求，重新尝试填充 ${platformName} 的内容:`,
          query
        );

        // 使用导入的executeAIChatFill函数来执行填充
        executeAIChatFill(tabId, query, chatConfig, platformName);
      }
    }
  });
};

// 监听标签页更新事件，跟踪标签页加载状态
export const handleTabUpdated = async () => {
  await onTabUpdated(async (tabId: number, changeInfo: any, tab: any) => {
    if (changeInfo.status === 'complete' && tab.url) {
      // 更新URL历史
      const previousUrl = tabUrlHistory.get(tabId);
      const currentUrl = tab.url;
      tabUrlHistory.set(tabId, currentUrl);

      // 检测URL是否发生变化（页面重定向或重新加载）
      const urlChanged = previousUrl && previousUrl !== currentUrl;

      if (urlChanged) {
        console.log(
          `检测到标签页 ${tabId} URL变化: ${previousUrl} -> ${currentUrl}`
        );
      } else if (!previousUrl) {
        // 首次记录URL
        console.log(`标签页 ${tabId} 首次加载: ${currentUrl}`);
      }

      // 检查是否有未处理的AI搜索请求（无论URL是否变化，页面加载完成就检查）
      const result = await storageGet('pendingAiSearchRequests');
      const pendingAiSearchRequests = result.pendingAiSearchRequests || [];
      
      if (pendingAiSearchRequests && pendingAiSearchRequests.length > 0) {
        // 查找当前标签页的待处理请求
        const pendingRequest = pendingAiSearchRequests.find(
          (req: any) => req.tabId === tabId
        );

        if (pendingRequest) {
          const { query, chatConfig, platformName } = pendingRequest;

          // 生成唯一的查询处理标识符
          const queryKey = generateQueryKey(tabId, platformName, query);
          const tabQueryKey = `${platformName}:${query.trim().toLowerCase()}`;

          // 严格的防重检查：确保每个标签页同一时间只处理一个AI对话请求

          // 1. 检查当前查询是否已经处理过（历史防重）
          let tabQueries = processedQueries.get(tabId);
          if (!tabQueries) {
            tabQueries = new Set<string>();
            processedQueries.set(tabId, tabQueries);
          }

          if (tabQueries.has(tabQueryKey)) {
            console.warn(
              `标签页 ${tabId} 已经处理过${platformName}的搜索请求:`,
              query
            );
            // 立即从待处理列表中移除，防止重复处理
            const updatedRequests = pendingAiSearchRequests.filter(
              (req: any) => req.tabId !== tabId
            );
            await storageSet('pendingAiSearchRequests', updatedRequests);
            return;
          }

          // 2. 检查标签页是否正在处理AI对话请求
          if (aiChatProcessingTabs.has(tabId)) {
            console.warn(
              `标签页 ${tabId} 正在处理AI对话请求，跳过重复处理`
            );
            // 立即从待处理列表中移除，防止重复处理
            const updatedRequests = pendingAiSearchRequests.filter(
              (req: any) => req.tabId !== tabId
            );
            await storageSet('pendingAiSearchRequests', updatedRequests);
            return;
          }

          // 3. 检查当前查询是否正在处理中（实时防重）
          if (currentlyProcessingQueries.has(queryKey)) {
            console.warn(
              `标签页 ${tabId} 正在处理${platformName}的搜索请求:`,
              query
            );
            // 立即从待处理列表中移除，防止重复处理
            const updatedRequests = pendingAiSearchRequests.filter(
              (req: any) => req.tabId !== tabId
            );
            await storageSet('pendingAiSearchRequests', updatedRequests);
            return;
          }

          // 4. 检查标签页是否正在处理中
          if (processingTabs.has(tabId)) {
            console.warn(`标签页 ${tabId} 正在处理中，跳过重复处理`);
            // 立即从待处理列表中移除，防止重复处理
            const updatedRequests = pendingAiSearchRequests.filter(
              (req: any) => req.tabId !== tabId
            );
            await storageSet('pendingAiSearchRequests', updatedRequests);
            return;
          }

          // 如果URL变化了，说明发生了重定向，需要重新填充
          if (urlChanged) {
            console.log(
              `检测到页面重定向，重新处理${platformName}的搜索请求:`,
              query
            );
          } else {
            console.log(
              `页面加载完成，处理${platformName}的搜索请求:`,
              query
            );
          }

          // 标记为正在处理
          processingTabs.add(tabId);
          currentlyProcessingQueries.set(queryKey, true);

          // 立即从待处理列表中移除，防止重复处理
          const updatedRequests = pendingAiSearchRequests.filter(
            (req: any) => req.tabId !== tabId
          );
          await storageSet('pendingAiSearchRequests', updatedRequests);

          // 将当前查询标记为已处理
          tabQueries.add(tabQueryKey);
          processedQueries.set(tabId, tabQueries);

          // 注入内容填充脚本
          await executeScript({
            target: { tabId },
            func: (
              searchQuery: string,
              config: any,
              _platformName: string
            ) => {
              // 增强的页面状态检测：检查是否有登录弹窗（改进版，避免误判）
              const hasLoginModal = () => {
                // 检测常见的登录弹窗，但增加更严格的过滤条件
                const loginModals = document.querySelectorAll(
                  '[class*="login"][class*="modal"], [class*="modal"][class*="login"], [class*="signin"][class*="modal"], [class*="modal"][class*="signin"], [role="dialog"] [class*="login"], [role="dialog"] [class*="signin"]'
                );

                return Array.from(loginModals).some((modal) => {
                  const modalEl = modal as HTMLElement;
                  // 检查是否是可见元素
                  const style = window.getComputedStyle(modalEl);
                  if (
                    style.display === 'none' ||
                    style.visibility === 'hidden' ||
                    style.opacity === '0'
                  ) {
                    return false;
                  }
                  // 检查尺寸是否有效
                  if (
                    modalEl.offsetWidth === 0 ||
                    modalEl.offsetHeight === 0
                  ) {
                    return false;
                  }
                  // 检查是否在视口中
                  const rect = modalEl.getBoundingClientRect();
                  if (
                    rect.bottom <= 0 ||
                    rect.right <= 0 ||
                    rect.left >= window.innerWidth ||
                    rect.top >= window.innerHeight
                  ) {
                    return false;
                  }
                  return true;
                });
              };

              // 获取当前AI对话状态
              const trimmedQuery = searchQuery.trim();
              const aiChatState = {
                lastFilledQuery:
                  (window as any).seekflowLastFilledQuery || null,
                lastSubmitTimestamp:
                  (window as any).seekflowLastSubmitTimestamp || 0,
                isSubmitted: (window as any).seekflowIsSubmitted || false,
                isGeneratingReply:
                  (window as any).seekflowIsGeneratingReply || false,
                retryCount: (window as any).seekflowRetryCount || 0,
                isFillingInProgress:
                  (window as any).seekflowFillingInProgress || false,
              };

              console.log('当前AI对话状态:', aiChatState);

              // 严格的防重检查：只允许填充和提交一次
              if (aiChatState.isFillingInProgress) {
                console.warn('检测到填充正在进行中，跳过重复填充');
                return;
              }

              if (aiChatState.isSubmitted) {
                console.warn('检测到查询已经提交过，跳过重复提交');
                return;
              }

              if (aiChatState.isGeneratingReply) {
                console.warn('检测到AI正在生成回复，跳过重复提交');
                return;
              }

              // 检查是否已经处理过这个查询
              const processedQueries =
                (window as any).seekflowProcessedQueries || [];
              if (processedQueries.includes(trimmedQuery)) {
                console.warn('检测到该查询已经处理过，跳过重复填充');
                return;
              }

              // 检查是否在短时间内重复提交（5秒内）
              const currentTime = Date.now();
              if (
                aiChatState.lastSubmitTimestamp > 0 &&
                currentTime - aiChatState.lastSubmitTimestamp < 5000
              ) {
                console.warn('检测到短时间内重复提交，跳过此次提交');
                return;
              }

              // 检查是否已经填充过相同查询
              if (aiChatState.lastFilledQuery === trimmedQuery) {
                console.warn('检测到相同查询已经填充过，跳过重复填充');
                return;
              }

              // 检查是否有登录弹窗
              if (hasLoginModal()) {
                console.warn('检测到登录弹窗，跳过重复填充');
                return;
              }
            },
            args: [query, chatConfig, platformName],
          });
        }
      }
    }
  });
};

// 初始化所有标签页事件监听器
export const initializeTabListeners = async () => {
  await handleTabCreated();
  await handleTabRemoved();
  await handleTabActivated();
  await handleTabUpdated();
};
