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
import {
  aiChatProcessingTabs,
  AIChatState,
  currentlyProcessingQueries,
  processedQueries,
  processingTabs,
} from './state';
import { generateQueryKey } from './utils';

// AI对话处理模块 - 处理与AI对话相关的功能

// Chrome API 类型声明
declare const chrome: any;

// 检查页面是否准备好填充内容的函数
const isPageReadyForFilling = (): boolean => {
  // 检查是否在浏览器上下文（有document）
  if (typeof document === 'undefined') {
    return false;
  }
  
  // 基本状态检查
  const isReadyState =
    document.readyState === 'complete' || document.readyState === 'interactive';
  if (!isReadyState) {
    console.log('页面尚未完全就绪，当前状态:', document.readyState);
    return false;
  }

  return true;
};

// 填充对话内容并提交的函数
const fillAndSubmitChat = (
  chatConfig: any,
  searchQuery: string,
  platformName: string,
  tabId: number
): boolean | undefined => {
  console.log('尝试填充对话内容...');

  // 严格的防重检查：确保每次调用都进行检查
  const aiChatState = {
    lastFilledQuery: (window as any).seekflowLastFilledQuery || null,
    lastSubmitTimestamp: (window as any).seekflowLastSubmitTimestamp || 0,
    isSubmitted: (window as any).seekflowIsSubmitted || false,
    isGeneratingReply: (window as any).seekflowIsGeneratingReply || false,
    retryCount: (window as any).seekflowRetryCount || 0,
    isFillingInProgress: (window as any).seekflowFillingInProgress || false,
  };

  console.log('fillAndSubmitChat内部防重检查:', aiChatState);

  // 严格的防重检查：只允许填充和提交一次
  if (aiChatState.isSubmitted) {
    console.warn('检测到查询已经提交过，跳过重复提交');
    return true; // 返回成功表示已处理
  }

  if (aiChatState.isGeneratingReply) {
    console.warn('检测到AI正在生成回复，跳过重复提交');
    return true; // 返回成功表示已处理
  }

  // 检查是否在短时间内重复提交（5秒内）
  const currentTime = Date.now();
  if (
    aiChatState.lastSubmitTimestamp > 0 &&
    currentTime - aiChatState.lastSubmitTimestamp < 5000
  ) {
    console.warn('检测到短时间内重复提交，跳过此次提交');
    return true; // 返回成功表示已处理
  }

  // 检查页面是否可见（处理标签页未激活情况）
  if (document.visibilityState !== 'visible') {
    console.warn('当前标签页未激活，页面可能未完全加载，等待重试...');
    return false; // 返回false让系统继续重试
  }

  // 查找输入框 - 使用多个选择器确保找到
  const inputSelectors = [
    chatConfig.inputSelector,
    'textarea[placeholder*="输入你的问题"]',
    'div[contenteditable="true"]',
    'textarea',
    'textarea[placeholder]',
    'div[role="textbox"]',
    'input[placeholder*="输入"]',
    'input[type="text"][placeholder]',
  ];

  let inputElement: Element | null = null;
  for (const selector of inputSelectors) {
    inputElement = document.querySelector(selector);
    if (inputElement) break;
  }

  if (!inputElement) {
    console.error('未找到输入框');
    return false;
  }

  // 检查输入框是否可编辑
  if (
    inputElement instanceof HTMLInputElement ||
    inputElement instanceof HTMLTextAreaElement
  ) {
    if (inputElement.disabled || inputElement.readOnly) {
      console.error('输入框被禁用或只读');
      return false;
    }
  }

  // 检查是否正在生成回复或发送按钮状态异常
  const isGeneratingReply = () => {
    // 1. 检查生成中的指示器
    const generatingIndicators = [
      '.loading',
      '.spinner',
      '.typing',
      '[aria-busy="true"]',
      '.generating',
      '.processing',
      '.thinking',
      '.responding',
    ];

    for (const indicator of generatingIndicators) {
      const elements = document.querySelectorAll(indicator);
      if (elements.length > 0) {
        return true;
      }
    }

    // 2. 检查发送按钮状态
    const sendButtonSelectors = [
      chatConfig.sendButtonSelector,
      'button[type="submit"]',
      'div.enter-icon-container',
      'button[class*="send"]',
      'button[class*="Submit"]',
      'button[aria-label*="发送"]',
    ];

    for (const selector of sendButtonSelectors) {
      const sendButton = document.querySelector(selector) as HTMLButtonElement;
      if (sendButton) {
        // 检查按钮是否禁用
        if (sendButton.disabled || sendButton.hasAttribute('disabled')) {
          return true;
        }

        // 检查按钮文本或图标是否表示正在生成
        const buttonText = sendButton.textContent?.toLowerCase() || '';
        const buttonClass = sendButton.className.toLowerCase();
        const buttonAriaLabel =
          sendButton.getAttribute('aria-label')?.toLowerCase() || '';

        if (
          buttonText.includes('停止') ||
          buttonText.includes('cancel') ||
          buttonText.includes('stop') ||
          buttonText.includes('generating') ||
          buttonClass.includes('stop') ||
          buttonClass.includes('cancel') ||
          buttonClass.includes('generating') ||
          buttonAriaLabel.includes('停止') ||
          buttonAriaLabel.includes('cancel') ||
          buttonAriaLabel.includes('stop')
        ) {
          return true;
        }
      }
    }

    return false;
  };

  if (isGeneratingReply()) {
    console.warn('检测到AI正在生成回复或发送按钮状态异常，跳过重复提交');
    return true; // 返回true表示已处理，避免继续重试
  }

  // 填充内容
  let contentFilled = false;
  const inputHTMLElement = inputElement;

  if (
    inputHTMLElement.tagName === 'TEXTAREA' ||
    inputHTMLElement.tagName === 'INPUT'
  ) {
    // 普通输入框
    const textInput = inputHTMLElement as
      | HTMLInputElement
      | HTMLTextAreaElement;
    textInput.value = searchQuery;
    // 触发输入事件
    textInput.dispatchEvent(new Event('input', { bubbles: true }));
    textInput.dispatchEvent(new Event('change', { bubbles: true }));

    // 滚动到底部
    if (inputHTMLElement.tagName === 'TEXTAREA') {
      textInput.scrollTop = textInput.scrollHeight;
    }

    contentFilled = true;
  } else {
    // contenteditable div（如文心一言、ChatGPT）
    try {
      // 1. 先清空内容，防止内容拼接
      if ('textContent' in inputHTMLElement) {
        inputHTMLElement.textContent = '';
      } else if ('innerHTML' in inputHTMLElement) {
        inputHTMLElement.innerHTML = '';
      }

      // 2. 聚焦并设置光标位置
      inputHTMLElement.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      if (selection) {
        range.selectNodeContents(inputHTMLElement);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      // 3. 使用ClipboardEvent方法模拟粘贴
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', searchQuery);
      dataTransfer.setData('text/html', `<div>${searchQuery}</div>`);

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer,
        composed: true,
      });

      inputHTMLElement.dispatchEvent(pasteEvent);

      // 4. 强制触发DOM更新
      if ('style' in inputHTMLElement) {
        inputHTMLElement.style.display = 'none';
        inputHTMLElement.offsetHeight;
        inputHTMLElement.style.display = '';
      }

      // 5. 额外触发input和change事件确保检测
      inputHTMLElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputHTMLElement.dispatchEvent(new Event('change', { bubbles: true }));

      // 6. 验证内容是否填充成功
      setTimeout(() => {
        // 检查当前内容
        let finalContent = '';
        if (
          inputHTMLElement.tagName === 'TEXTAREA' ||
          inputHTMLElement.tagName === 'INPUT'
        ) {
          finalContent = (
            inputHTMLElement as HTMLTextAreaElement | HTMLInputElement
          ).value;
        } else if ('textContent' in inputHTMLElement) {
          finalContent = inputHTMLElement.textContent || '';
        } else if ('innerHTML' in inputHTMLElement) {
          finalContent = inputHTMLElement.innerHTML || '';
        }

        const trimmedContent = finalContent.trim();
        const trimmedQuery = searchQuery.trim();

        // 增强的内容验证：
        // 1. 如果内容为空，尝试备选填充
        // 2. 如果内容已经包含查询，跳过（防止重复）
        // 3. 如果内容是查询的重复拼接，清空后重新填充
        if (!trimmedContent) {
          console.warn('ClipboardEvent填充后内容为空，尝试innerHTML方式');
          // 使用innerHTML方式填充（兼容ChatGPT）
          try {
            // 先清空再填充
            if ('innerHTML' in inputHTMLElement) {
              inputHTMLElement.innerHTML = searchQuery;
              inputHTMLElement.dispatchEvent(
                new Event('input', { bubbles: true })
              );
              inputHTMLElement.dispatchEvent(
                new Event('change', { bubbles: true })
              );
              console.log('使用innerHTML成功填充内容');
            }
          } catch (innerHtmlError) {
            console.error('innerHTML填充也失败:', innerHtmlError);
          }
        } else if (
          trimmedContent.includes(trimmedQuery) &&
          trimmedContent !== trimmedQuery
        ) {
          // 检测到重复内容，清空后重新填充
          console.warn('检测到重复填充内容，重新填充...');
          try {
            // 先彻底清空
            if ('textContent' in inputHTMLElement) {
              inputHTMLElement.textContent = '';
            } else if ('innerHTML' in inputHTMLElement) {
              inputHTMLElement.innerHTML = '';
            }

            // 重新填充
            if ('innerHTML' in inputHTMLElement) {
              inputHTMLElement.innerHTML = searchQuery;
              inputHTMLElement.dispatchEvent(
                new Event('input', { bubbles: true })
              );
              inputHTMLElement.dispatchEvent(
                new Event('change', { bubbles: true })
              );
              console.log('重新填充内容成功');
            }
          } catch (error) {
            console.error('重新填充失败:', error);
          }
        }
      }, 200); // 延长延迟到200ms，确保DOM更新完成

      contentFilled = true;
      console.log('使用ClipboardEvent成功填充内容');
    } catch (error) {
      console.error('使用ClipboardEvent填充失败，尝试直接设置内容:', error);

      // 备选方案1：直接设置textContent
      try {
        if ('textContent' in inputHTMLElement) {
          // 先清空再填充
          inputHTMLElement.textContent = searchQuery;
          inputHTMLElement.dispatchEvent(new Event('input', { bubbles: true }));
          contentFilled = true;
          console.log('使用textContent成功填充内容');
        }
      } catch (textContentError) {
        console.error('textContent填充失败:', textContentError);

        // 备选方案2：使用innerHTML（兼容ChatGPT）
        try {
          if ('innerHTML' in inputHTMLElement) {
            // 先清空再填充
            inputHTMLElement.innerHTML = searchQuery;
            inputHTMLElement.dispatchEvent(
              new Event('input', { bubbles: true })
            );
            inputHTMLElement.dispatchEvent(
              new Event('change', { bubbles: true })
            );
            contentFilled = true;
            console.log('使用innerHTML成功填充内容');
          }
        } catch (innerHtmlError) {
          console.error('innerHTML填充也失败:', innerHtmlError);
        }
      }
    }
  }

  if (!contentFilled) {
    console.error('无法填充内容，尝试备选方案...');
    return false;
  }

  // 模拟真实用户行为：填充内容后延迟再提交
  // 等待1500ms让内容完全变更并触发相关事件，同时让发送按钮有时间显示出来
  setTimeout(() => {
    // 再次确认内容已正确填充
    let finalContent = '';
    let hasValidContent = false;

    // 检查实际文本内容
    if (
      inputHTMLElement.tagName === 'TEXTAREA' ||
      inputHTMLElement.tagName === 'INPUT'
    ) {
      const textInput = inputHTMLElement as
        | HTMLTextAreaElement
        | HTMLInputElement;
      finalContent = textInput.value;
      hasValidContent = finalContent.trim() === searchQuery.trim();
    } else {
      // 对于contenteditable元素，先检查textContent
      if ('textContent' in inputHTMLElement) {
        const textContent = inputHTMLElement.textContent || '';
        if (textContent.trim() === searchQuery.trim()) {
          finalContent = textContent;
          hasValidContent = true;
        }
      }

      // 如果textContent没有匹配到实际查询内容，检查innerHTML
      if (!hasValidContent && 'innerHTML' in inputHTMLElement) {
        const innerHTML = inputHTMLElement.innerHTML || '';
        // 检查innerHTML是否包含实际查询内容，而不仅仅是空标签
        if (innerHTML.includes(searchQuery)) {
          finalContent = innerHTML;
          hasValidContent = true;
        } else if (innerHTML.trim() === '') {
          // 内容为空，标记为无效
          hasValidContent = false;
        } else {
          // 内容不为空但也不是查询内容，可能是平台默认标签，标记为无效
          hasValidContent = false;
        }
      }
    }

    // 如果没有有效的查询内容，立即重新填充
    if (!hasValidContent) {
      console.warn('内容验证失败，填充的不是实际查询内容，重新尝试填充');
      // 重新填充实际查询内容
      try {
        // 先强制清空
        if ('textContent' in inputHTMLElement) {
          inputHTMLElement.textContent = '';
        }
        if ('innerHTML' in inputHTMLElement) {
          inputHTMLElement.innerHTML = '';
        }

        // 直接使用innerHTML填充实际查询内容
        inputHTMLElement.innerHTML = searchQuery;
        inputHTMLElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputHTMLElement.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('重新使用innerHTML成功填充实际查询内容');

        // 重新获取内容
        finalContent = inputHTMLElement.innerHTML || '';
        hasValidContent = true;
      } catch (innerHtmlError) {
        console.error('重新填充失败:', innerHtmlError);
      }
    }

    if (finalContent.trim()) {
      console.log(
        '内容已确认填充，准备提交:',
        finalContent.slice(0, 20) + '...'
      );

      // 轮询查找发送按钮，兼容填充内容后才显示发送按钮的平台（如ChatGPT）
      let attempts = 0;
      const maxAttempts = 10;
      const interval = 1000;

      const findAndClickSendButton = () => {
        attempts++;
        console.log(`第 ${attempts} 次尝试查找发送按钮...`);

        // 查找发送按钮 - 使用多个选择器确保找到
        const sendSelectors = [
          chatConfig.sendButtonSelector,
          'button[type="submit"]',
          'div.enter-icon-container',
          'button[class*="send"]',
          'button[class*="Submit"]',
          'button[aria-label*="发送"]',
        ];

        let sendButton: HTMLButtonElement | null = null;
        for (const selector of sendSelectors) {
          sendButton = document.querySelector(selector) as HTMLButtonElement;
          if (sendButton) break;
        }

        if (sendButton) {
          // 检查发送按钮是否可点击
          if (sendButton.disabled || sendButton.hasAttribute('disabled')) {
            console.warn('发送按钮被禁用，等待启用...');
            if (attempts < maxAttempts) {
              setTimeout(findAndClickSendButton, interval);
              return;
            } else {
              console.error('发送按钮始终被禁用，无法提交');
              // 清除填充进行中标记
              (window as any).seekflowFillingInProgress = false;
              return;
            }
          }

          console.log('找到发送按钮，准备提交...');

          // 触发发送按钮点击 - 使用真实鼠标事件序列确保冒泡
          const mouseDownEvent = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
          });
          const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
          });
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          });

          // 保存输入元素引用，用于后续检查
          const originalInputElement = inputHTMLElement;
          const originalQuery = searchQuery;

          // 依次触发事件，模拟真实点击
          sendButton.dispatchEvent(mouseDownEvent);
          sendButton.dispatchEvent(mouseUpEvent);
          sendButton.dispatchEvent(clickEvent);

          console.log('对话已提交');

          // 1秒后检查提交是否成功
          setTimeout(() => {
            console.log('检查提交是否成功...');

            // 检查输入框内容是否被清空
            let currentContent = '';
            if (
              originalInputElement.tagName === 'TEXTAREA' ||
              originalInputElement.tagName === 'INPUT'
            ) {
              currentContent = (
                originalInputElement as HTMLTextAreaElement | HTMLInputElement
              ).value;
            } else if ('textContent' in originalInputElement) {
              currentContent = originalInputElement.textContent || '';
            } else if ('innerHTML' in originalInputElement) {
              currentContent = originalInputElement.innerHTML || '';
            }

            const trimmedContent = currentContent.trim();
            const trimmedQuery = originalQuery.trim();

            console.log('当前输入框内容:', trimmedContent);
            console.log('原始查询:', trimmedQuery);

            // 如果内容没有变化，说明提交可能失败
            if (
              trimmedContent === trimmedQuery ||
              trimmedContent.includes(trimmedQuery)
            ) {
              console.warn(
                '检测到提交后内容未清空，可能提交失败，重新尝试提交...'
              );

              // 重新触发点击事件
              try {
                sendButton.dispatchEvent(mouseDownEvent);
                sendButton.dispatchEvent(mouseUpEvent);
                sendButton.dispatchEvent(clickEvent);
                console.log('重新提交对话');
              } catch (retryError) {
                console.error('重新提交失败:', retryError);
              }
            } else {
              console.log('提交成功，输入框内容已清空或改变');
            }
          }, 1000); // 1秒后检查

          // 更新AI对话状态：提交成功
          (window as any).seekflowLastSubmitTimestamp = Date.now();
          (window as any).seekflowIsSubmitted = true;
          (window as any).seekflowIsGeneratingReply = true; // 提交后AI开始生成回复
          (window as any).seekflowRetryCount = 0;

          // 清除填充进行中标记
          (window as any).seekflowFillingInProgress = false;
        } else if (attempts < maxAttempts) {
          // 继续尝试查找发送按钮
          setTimeout(findAndClickSendButton, interval);
        } else {
          console.error(`超过最大尝试次数(${maxAttempts})，未找到发送按钮`);
          // 更新AI对话状态：提交失败，允许重试
          (window as any).seekflowIsGeneratingReply = false;
          (window as any).seekflowRetryCount =
            (window as any).seekflowRetryCount + 1 || 1;
          (window as any).seekflowFillingInProgress = false;
        }
      };

      // 开始查找发送按钮
      findAndClickSendButton();
    } else {
      console.error('内容未正确填充，提交失败');
      // 清除填充进行中标记
      (window as any).seekflowFillingInProgress = false;
    }
  }, 1500); // 1500ms延迟，模拟真实用户操作

  // 填充内容成功，返回true表示填充过程已完成
  // 实际提交是异步的，由findAndClickSendButton处理
  return true;
};

// 尝试填充对话内容的函数
const attemptFill = (
  chatConfig: any,
  searchQuery: string,
  platformName: string,
  tabId: number
): boolean => {
  try {
    // 1. 增强的页面状态检查
    if (!isPageReadyForFilling()) {
      return false;
    }

    // 2. 尝试填充内容
    return (
      fillAndSubmitChat(chatConfig, searchQuery, platformName, tabId) ?? false
    );
  } catch (error) {
    console.error('填充失败:', error);
    return false;
  }
};

// 处理AI搜索请求重试
export const handleRetryAiSearchRequest = (request: any): void => {
  const { tabId, query, chatConfig, platformName } = request;

  // 检查是否已经处理过该查询
  const tabQueries = processedQueries.get(tabId) || new Set();
  const tabQueryKey = `${platformName}:${query.trim().toLowerCase()}`;

  // 严格限制：每个查询只允许处理一次，不允许重试
  if (tabQueries.has(tabQueryKey)) {
    console.warn(
      `标签页 ${tabId} 的 ${platformName} 搜索请求已经处理过，不再重试`
    );
    chrome.runtime.sendMessage({
      action: 'aiSearchRequestCompleted',
      tabId,
      query,
      platformName,
    });
    return;
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
};

// 处理AI搜索请求完成事件
export const handleAISearchRequestCompleted = (request: any): void => {
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

  // 清除处理标记
  currentlyProcessingQueries.delete(queryKey);

  // 标记该标签页的查询为已处理
  console.log(`标签页 ${tabId} 的 ${platformName} 搜索请求已完成处理`);
};

// 执行AI对话填充的函数
export const executeAIChatFill = (
  tabId: number,
  query: string,
  chatConfig: any,
  platformName: string
): void => {
  // 生成唯一的查询处理标识符
  const queryKey = generateQueryKey(tabId, platformName, query);
  const tabQueryKey = `${platformName}:${query.trim().toLowerCase()}`;

  // 检查当前查询是否正在处理中（实时防重）
  if (currentlyProcessingQueries.has(queryKey)) {
    console.warn(`标签页 ${tabId} 正在处理${platformName}的搜索请求:`, query);
    return;
  }

  // 检查标签页是否正在处理中
  if (processingTabs.has(tabId)) {
    console.warn(`标签页 ${tabId} 正在处理中，跳过重复处理`);
    return;
  }

  // 标记为正在处理
  processingTabs.add(tabId);
  aiChatProcessingTabs.add(tabId); // 标记为正在处理AI对话请求
  currentlyProcessingQueries.set(queryKey, true);

  // 注入内容填充脚本
  chrome.scripting.executeScript(
    {
      target: { tabId },
      func: function (
        chatConfig: any,
        searchQuery: string,
        platformName: string,
        tabId: number
      ) {
        // 存储标签页ID，用于通知背景脚本
        window.seekflowTabId = tabId;

        // 立即尝试填充，如果失败则轮询尝试
        let success = false;
        let attempts = 0;
        const maxAttempts = 10;
        let interval = 1000;

        // 检查页面是否准备好填充内容
        const isPageReadyForFilling = () => {
          // 基本状态检查
          const isReadyState =
            document.readyState === 'complete' ||
            document.readyState === 'interactive';
          if (!isReadyState) {
            console.log('页面尚未完全就绪，当前状态:', document.readyState);
            return false;
          }

          return true;
        };

        // 填充对话内容并提交的函数
        const fillAndSubmitChat = () => {
          console.log('尝试填充对话内容...');

          // 严格的防重检查：确保每次调用都进行检查
          const aiChatState = {
            lastFilledQuery: (window as any).seekflowLastFilledQuery || null,
            lastSubmitTimestamp:
              (window as any).seekflowLastSubmitTimestamp || 0,
            isSubmitted: (window as any).seekflowIsSubmitted || false,
            isGeneratingReply:
              (window as any).seekflowIsGeneratingReply || false,
            retryCount: (window as any).seekflowRetryCount || 0,
            isFillingInProgress:
              (window as any).seekflowFillingInProgress || false,
          };

          console.log('fillAndSubmitChat内部防重检查:', aiChatState);

          // 严格的防重检查：只允许填充和提交一次
          if (aiChatState.isSubmitted) {
            console.warn('检测到查询已经提交过，跳过重复提交');
            return true; // 返回成功表示已处理
          }

          if (aiChatState.isGeneratingReply) {
            console.warn('检测到AI正在生成回复，跳过重复提交');
            return true; // 返回成功表示已处理
          }

          // 检查是否在短时间内重复提交（5秒内）
          const currentTime = Date.now();
          if (
            aiChatState.lastSubmitTimestamp > 0 &&
            currentTime - aiChatState.lastSubmitTimestamp < 5000
          ) {
            console.warn('检测到短时间内重复提交，跳过此次提交');
            return true; // 返回成功表示已处理
          }

          // 检查页面是否可见（处理标签页未激活情况）
          if (document.visibilityState !== 'visible') {
            console.warn('当前标签页未激活，页面可能未完全加载，等待重试...');
            return false; // 返回false让系统继续重试
          }

          // 查找输入框 - 使用多个选择器确保找到
          const inputSelectors = [
            chatConfig.inputSelector,
            'textarea[placeholder*="输入你的问题"]',
            'div[contenteditable="true"]',
            'textarea',
            'textarea[placeholder]',
            'div[role="textbox"]',
            'input[placeholder*="输入"]',
            'input[type="text"][placeholder]',
          ];

          let inputElement: Element | null = null;
          for (const selector of inputSelectors) {
            inputElement = document.querySelector(selector);
            if (inputElement) break;
          }

          if (!inputElement) {
            console.error('未找到输入框');
            return false;
          }

          // 检查输入框是否可编辑
          if (
            inputElement instanceof HTMLInputElement ||
            inputElement instanceof HTMLTextAreaElement
          ) {
            if (inputElement.disabled || inputElement.readOnly) {
              console.error('输入框被禁用或只读');
              return false;
            }
          }

          // 检查是否正在生成回复或发送按钮状态异常
          const isGeneratingReply = () => {
            // 1. 检查生成中的指示器
            const generatingIndicators = [
              '.loading',
              '.spinner',
              '.typing',
              '[aria-busy="true"]',
              '.generating',
              '.processing',
              '.thinking',
              '.responding',
            ];

            for (const indicator of generatingIndicators) {
              const elements = document.querySelectorAll(indicator);
              if (elements.length > 0) {
                return true;
              }
            }

            // 2. 检查发送按钮状态
            const sendButtonSelectors = [
              chatConfig.sendButtonSelector,
              'button[type="submit"]',
              'div.enter-icon-container',
              'button[class*="send"]',
              'button[class*="Submit"]',
              'button[aria-label*="发送"]',
            ];

            for (const selector of sendButtonSelectors) {
              const sendButton = document.querySelector(
                selector
              ) as HTMLButtonElement;
              if (sendButton) {
                // 检查按钮是否禁用
                if (
                  sendButton.disabled ||
                  sendButton.hasAttribute('disabled')
                ) {
                  return true;
                }

                // 检查按钮文本或图标是否表示正在生成
                const buttonText = sendButton.textContent?.toLowerCase() || '';
                const buttonClass = sendButton.className.toLowerCase();
                const buttonAriaLabel =
                  sendButton.getAttribute('aria-label')?.toLowerCase() || '';

                if (
                  buttonText.includes('停止') ||
                  buttonText.includes('cancel') ||
                  buttonText.includes('stop') ||
                  buttonText.includes('generating') ||
                  buttonClass.includes('stop') ||
                  buttonClass.includes('cancel') ||
                  buttonClass.includes('generating') ||
                  buttonAriaLabel.includes('停止') ||
                  buttonAriaLabel.includes('cancel') ||
                  buttonAriaLabel.includes('stop')
                ) {
                  return true;
                }
              }
            }

            return false;
          };

          if (isGeneratingReply()) {
            console.warn(
              '检测到AI正在生成回复或发送按钮状态异常，跳过重复提交'
            );
            return true; // 返回true表示已处理，避免继续重试
          }

          // 填充内容
          let contentFilled = false;
          const inputHTMLElement = inputElement;

          if (
            inputHTMLElement.tagName === 'TEXTAREA' ||
            inputHTMLElement.tagName === 'INPUT'
          ) {
            // 普通输入框
            const textInput = inputHTMLElement as
              | HTMLInputElement
              | HTMLTextAreaElement;
            textInput.value = searchQuery;
            // 触发输入事件
            textInput.dispatchEvent(new Event('input', { bubbles: true }));
            textInput.dispatchEvent(new Event('change', { bubbles: true }));

            // 滚动到底部
            if (inputHTMLElement.tagName === 'TEXTAREA') {
              textInput.scrollTop = textInput.scrollHeight;
            }

            contentFilled = true;
          } else {
            // contenteditable div（如文心一言、ChatGPT）
            try {
              // 1. 先清空内容，防止内容拼接
              if ('textContent' in inputHTMLElement) {
                inputHTMLElement.textContent = '';
              } else if ('innerHTML' in inputHTMLElement) {
                inputHTMLElement.innerHTML = '';
              }

              // 2. 聚焦并设置光标位置
              inputHTMLElement.focus();
              const range = document.createRange();
              const selection = window.getSelection();
              if (selection) {
                range.selectNodeContents(inputHTMLElement);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
              }

              // 3. 使用ClipboardEvent方法模拟粘贴
              const dataTransfer = new DataTransfer();
              dataTransfer.setData('text/plain', searchQuery);
              dataTransfer.setData('text/html', `<div>${searchQuery}</div>`);

              const pasteEvent = new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData: dataTransfer,
                composed: true,
              });

              inputHTMLElement.dispatchEvent(pasteEvent);

              // 4. 强制触发DOM更新
              if ('style' in inputHTMLElement) {
                inputHTMLElement.style.display = 'none';
                inputHTMLElement.offsetHeight;
                inputHTMLElement.style.display = '';
              }

              // 5. 额外触发input和change事件确保检测
              inputHTMLElement.dispatchEvent(
                new Event('input', { bubbles: true })
              );
              inputHTMLElement.dispatchEvent(
                new Event('change', { bubbles: true })
              );

              // 6. 验证内容是否填充成功
              setTimeout(() => {
                // 检查当前内容
                let finalContent = '';
                if (
                  inputHTMLElement.tagName === 'TEXTAREA' ||
                  inputHTMLElement.tagName === 'INPUT'
                ) {
                  finalContent = (
                    inputHTMLElement as HTMLTextAreaElement | HTMLInputElement
                  ).value;
                } else if ('textContent' in inputHTMLElement) {
                  finalContent = inputHTMLElement.textContent || '';
                } else if ('innerHTML' in inputHTMLElement) {
                  finalContent = inputHTMLElement.innerHTML || '';
                }

                const trimmedContent = finalContent.trim();
                const trimmedQuery = searchQuery.trim();

                // 增强的内容验证：
                // 1. 如果内容为空，尝试备选填充
                // 2. 如果内容已经包含查询，跳过（防止重复）
                // 3. 如果内容是查询的重复拼接，清空后重新填充
                if (!trimmedContent) {
                  console.warn(
                    'ClipboardEvent填充后内容为空，尝试innerHTML方式'
                  );
                  // 使用innerHTML方式填充（兼容ChatGPT）
                  try {
                    // 先清空再填充
                    if ('innerHTML' in inputHTMLElement) {
                      inputHTMLElement.innerHTML = searchQuery;
                      inputHTMLElement.dispatchEvent(
                        new Event('input', { bubbles: true })
                      );
                      inputHTMLElement.dispatchEvent(
                        new Event('change', { bubbles: true })
                      );
                      console.log('使用innerHTML成功填充内容');
                    }
                  } catch (innerHtmlError) {
                    console.error('innerHTML填充也失败:', innerHtmlError);
                  }
                } else if (
                  trimmedContent.includes(trimmedQuery) &&
                  trimmedContent !== trimmedQuery
                ) {
                  // 检测到重复内容，清空后重新填充
                  console.warn('检测到重复填充内容，重新填充...');
                  try {
                    // 先彻底清空
                    if ('textContent' in inputHTMLElement) {
                      inputHTMLElement.textContent = '';
                    } else if ('innerHTML' in inputHTMLElement) {
                      inputHTMLElement.innerHTML = '';
                    }

                    // 重新填充
                    if ('innerHTML' in inputHTMLElement) {
                      inputHTMLElement.innerHTML = searchQuery;
                      inputHTMLElement.dispatchEvent(
                        new Event('input', { bubbles: true })
                      );
                      inputHTMLElement.dispatchEvent(
                        new Event('change', { bubbles: true })
                      );
                      console.log('重新填充内容成功');
                    }
                  } catch (error) {
                    console.error('重新填充失败:', error);
                  }
                }
              }, 200); // 延长延迟到200ms，确保DOM更新完成

              contentFilled = true;
              console.log('使用ClipboardEvent成功填充内容');
            } catch (error) {
              console.error(
                '使用ClipboardEvent填充失败，尝试直接设置内容:',
                error
              );

              // 备选方案1：直接设置textContent
              try {
                if ('textContent' in inputHTMLElement) {
                  // 先清空再填充
                  inputHTMLElement.textContent = searchQuery;
                  inputHTMLElement.dispatchEvent(
                    new Event('input', { bubbles: true })
                  );
                  contentFilled = true;
                  console.log('使用textContent成功填充内容');
                }
              } catch (textContentError) {
                console.error('textContent填充失败:', textContentError);

                // 备选方案2：使用innerHTML（兼容ChatGPT）
                try {
                  if ('innerHTML' in inputHTMLElement) {
                    // 先清空再填充
                    inputHTMLElement.innerHTML = searchQuery;
                    inputHTMLElement.dispatchEvent(
                      new Event('input', { bubbles: true })
                    );
                    inputHTMLElement.dispatchEvent(
                      new Event('change', { bubbles: true })
                    );
                    contentFilled = true;
                    console.log('使用innerHTML成功填充内容');
                  }
                } catch (innerHtmlError) {
                  console.error('innerHTML填充也失败:', innerHtmlError);
                }
              }
            }
          }

          if (!contentFilled) {
            console.error('无法填充内容，尝试备选方案...');
            return false;
          }

          // 模拟真实用户行为：填充内容后延迟再提交
          // 等待1500ms让内容完全变更并触发相关事件，同时让发送按钮有时间显示出来
          setTimeout(() => {
            // 再次确认内容已正确填充
            let finalContent = '';
            let hasValidContent = false;

            // 检查实际文本内容
            if (
              inputHTMLElement.tagName === 'TEXTAREA' ||
              inputHTMLElement.tagName === 'INPUT'
            ) {
              const textInput = inputHTMLElement as
                | HTMLTextAreaElement
                | HTMLInputElement;
              finalContent = textInput.value;
              hasValidContent = finalContent.trim() === searchQuery.trim();
            } else {
              // 对于contenteditable元素，先检查textContent
              if ('textContent' in inputHTMLElement) {
                const textContent = inputHTMLElement.textContent || '';
                if (textContent.trim() === searchQuery.trim()) {
                  finalContent = textContent;
                  hasValidContent = true;
                }
              }

              // 如果textContent没有匹配到实际查询内容，检查innerHTML
              if (!hasValidContent && 'innerHTML' in inputHTMLElement) {
                const innerHTML = inputHTMLElement.innerHTML || '';
                // 检查innerHTML是否包含实际查询内容，而不仅仅是空标签
                if (innerHTML.includes(searchQuery)) {
                  finalContent = innerHTML;
                  hasValidContent = true;
                } else if (innerHTML.trim() === '') {
                  // 内容为空，标记为无效
                  hasValidContent = false;
                } else {
                  // 内容不为空但也不是查询内容，可能是平台默认标签，标记为无效
                  hasValidContent = false;
                }
              }
            }

            // 如果没有有效的查询内容，立即重新填充
            if (!hasValidContent) {
              console.warn(
                '内容验证失败，填充的不是实际查询内容，重新尝试填充'
              );
              // 重新填充实际查询内容
              try {
                // 先强制清空
                if ('textContent' in inputHTMLElement) {
                  inputHTMLElement.textContent = '';
                }
                if ('innerHTML' in inputHTMLElement) {
                  inputHTMLElement.innerHTML = '';
                }

                // 直接使用innerHTML填充实际查询内容
                inputHTMLElement.innerHTML = searchQuery;
                inputHTMLElement.dispatchEvent(
                  new Event('input', { bubbles: true })
                );
                inputHTMLElement.dispatchEvent(
                  new Event('change', { bubbles: true })
                );
                console.log('重新使用innerHTML成功填充实际查询内容');

                // 重新获取内容
                finalContent = inputHTMLElement.innerHTML || '';
                hasValidContent = true;
              } catch (innerHtmlError) {
                console.error('重新填充失败:', innerHtmlError);
              }
            }

            if (finalContent.trim()) {
              console.log(
                '内容已确认填充，准备提交:',
                finalContent.slice(0, 20) + '...'
              );

              // 轮询查找发送按钮，兼容填充内容后才显示发送按钮的平台（如ChatGPT）
              let attempts = 0;
              const maxAttempts = 10;
              const interval = 1000;

              const findAndClickSendButton = () => {
                attempts++;
                console.log(`第 ${attempts} 次尝试查找发送按钮...`);

                // 查找发送按钮 - 使用多个选择器确保找到
                const sendSelectors = [
                  chatConfig.sendButtonSelector,
                  'button[type="submit"]',
                  'div.enter-icon-container',
                  'button[class*="send"]',
                  'button[class*="Submit"]',
                  'button[aria-label*="发送"]',
                ];

                let sendButton: HTMLButtonElement | null = null;
                for (const selector of sendSelectors) {
                  sendButton = document.querySelector(
                    selector
                  ) as HTMLButtonElement;
                  if (sendButton) break;
                }

                if (sendButton) {
                  // 检查发送按钮是否可点击
                  if (
                    sendButton.disabled ||
                    sendButton.hasAttribute('disabled')
                  ) {
                    console.warn('发送按钮被禁用，等待启用...');
                    if (attempts < maxAttempts) {
                      setTimeout(findAndClickSendButton, interval);
                      return;
                    } else {
                      console.error('发送按钮始终被禁用，无法提交');
                      // 清除填充进行中标记
                      (window as any).seekflowFillingInProgress = false;
                      return;
                    }
                  }

                  console.log('找到发送按钮，准备提交...');

                  // 触发发送按钮点击 - 使用真实鼠标事件序列确保冒泡
                  const mouseDownEvent = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                  });
                  const mouseUpEvent = new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                  });
                  const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                  });

                  // 保存输入元素引用，用于后续检查
                  const originalInputElement = inputHTMLElement;
                  const originalQuery = searchQuery;

                  // 依次触发事件，模拟真实点击
                  sendButton.dispatchEvent(mouseDownEvent);
                  sendButton.dispatchEvent(mouseUpEvent);
                  sendButton.dispatchEvent(clickEvent);

                  console.log('对话已提交');

                  // 1秒后检查提交是否成功
                  setTimeout(() => {
                    console.log('检查提交是否成功...');

                    // 检查输入框内容是否被清空
                    let currentContent = '';
                    if (
                      originalInputElement.tagName === 'TEXTAREA' ||
                      originalInputElement.tagName === 'INPUT'
                    ) {
                      currentContent = (
                        originalInputElement as
                          | HTMLTextAreaElement
                          | HTMLInputElement
                      ).value;
                    } else if ('textContent' in originalInputElement) {
                      currentContent = originalInputElement.textContent || '';
                    } else if ('innerHTML' in originalInputElement) {
                      currentContent = originalInputElement.innerHTML || '';
                    }

                    const trimmedContent = currentContent.trim();
                    const trimmedQuery = originalQuery.trim();

                    console.log('当前输入框内容:', trimmedContent);
                    console.log('原始查询:', trimmedQuery);

                    // 如果内容没有变化，说明提交可能失败
                    if (
                      trimmedContent === trimmedQuery ||
                      trimmedContent.includes(trimmedQuery)
                    ) {
                      console.warn(
                        '检测到提交后内容未清空，可能提交失败，重新尝试提交...'
                      );

                      // 重新触发点击事件
                      try {
                        sendButton.dispatchEvent(mouseDownEvent);
                        sendButton.dispatchEvent(mouseUpEvent);
                        sendButton.dispatchEvent(clickEvent);
                        console.log('重新提交对话');
                      } catch (retryError) {
                        console.error('重新提交失败:', retryError);
                      }
                    } else {
                      console.log('提交成功，输入框内容已清空或改变');
                    }
                  }, 1000); // 1秒后检查

                  // 更新AI对话状态：提交成功
                  (window as any).seekflowLastSubmitTimestamp = Date.now();
                  (window as any).seekflowIsSubmitted = true;
                  (window as any).seekflowIsGeneratingReply = true; // 提交后AI开始生成回复
                  (window as any).seekflowRetryCount = 0;

                  // 清除填充进行中标记
                  (window as any).seekflowFillingInProgress = false;
                } else if (attempts < maxAttempts) {
                  // 继续尝试查找发送按钮
                  setTimeout(findAndClickSendButton, interval);
                } else {
                  console.error(
                    `超过最大尝试次数(${maxAttempts})，未找到发送按钮`
                  );
                  // 更新AI对话状态：提交失败，允许重试
                  (window as any).seekflowIsGeneratingReply = false;
                  (window as any).seekflowRetryCount =
                    (window as any).seekflowRetryCount + 1 || 1;
                  (window as any).seekflowFillingInProgress = false;
                }
              };

              // 开始查找发送按钮
              findAndClickSendButton();
            } else {
              console.error('内容未正确填充，提交失败');
              // 清除填充进行中标记
              (window as any).seekflowFillingInProgress = false;
            }
          }, 1500); // 1500ms延迟，模拟真实用户操作

          // 填充内容成功，返回true表示填充过程已完成
          // 实际提交是异步的，由findAndClickSendButton处理
          return true;
        };

        // 尝试填充对话内容
        const attemptFill = () => {
          try {
            // 1. 增强的页面状态检查
            if (!isPageReadyForFilling()) {
              return false;
            }

            // 2. 尝试填充内容
            return fillAndSubmitChat() ?? false;
          } catch (error) {
            console.error('填充失败:', error);
            return false;
          }
        };

        // 首次尝试
        try {
          success = attemptFill();
        } catch (error) {
          console.error('首次填充失败:', error);
        }

        if (!success) {
          const intervalId = setInterval(() => {
            const attemptSuccess = attemptFill();

            // 智能重试逻辑：随着尝试次数增加，间隔时间变长
            if (attempts >= 5) {
              interval = 2000; // 第5次尝试后，间隔改为2秒
            }
            if (attempts >= 8) {
              interval = 3000; // 第8次尝试后，间隔改为3秒
            }

            attempts++;

            if (attemptSuccess || attempts >= maxAttempts) {
              clearInterval(intervalId);
              console.log(`填充尝试结束，共尝试 ${attempts} 次`);

              if (attemptSuccess) {
                // 填充成功，通知背景脚本从待处理列表中移除请求
                console.log('填充成功，通知背景脚本');
                try {
                  // 发送消息给背景脚本，通知填充成功
                  chrome.runtime.sendMessage({
                    action: 'aiSearchRequestCompleted',
                    tabId: window.seekflowTabId,
                    query: searchQuery,
                    platformName: platformName,
                  });
                } catch (sendError) {
                  console.error('发送填充成功消息失败:', sendError);
                }
              } else {
                console.log(
                  '所有填充尝试失败，页面可能需要手动交互或加载时间过长'
                );
                // 填充失败，保留在待处理列表中，等待标签页再次激活时重试
              }
            }
          }, interval);
        } else {
          // 首次尝试成功，通知背景脚本
          console.log('首次填充成功，通知背景脚本');
          try {
            chrome.runtime.sendMessage({
              action: 'aiSearchRequestCompleted',
              tabId: window.seekflowTabId,
              query: searchQuery,
              platformName: platformName,
            });
          } catch (sendError) {
            console.error('发送填充成功消息失败:', sendError);
          }
        }
      },
      args: [chatConfig, query, platformName, tabId],
    },
    (_results: any[]) => {
      // 生成唯一的查询处理标识符
      const queryKey = `${tabId}:${platformName}:${query.trim().toLowerCase()}`;

      if (chrome.runtime.lastError) {
        console.error('脚本注入失败:', chrome.runtime.lastError);
        // 清除处理标记
        processingTabs.delete(tabId);
        aiChatProcessingTabs.delete(tabId);
        currentlyProcessingQueries.delete(queryKey);
        // 脚本注入失败，将请求重新添加到待处理列表
        chrome.runtime.sendMessage({
          action: 'retryAiSearchRequest',
          tabId,
          query,
          chatConfig,
          platformName,
        });
      } else {
        // 脚本注入成功，继续保持请求在待处理列表中
        // 直到收到内容脚本发送的填充完成消息
        console.log('脚本注入成功，等待填充完成通知...');
        // 只清除标签页处理标记，保留查询处理标记直到填充完成
        processingTabs.delete(tabId);
        aiChatProcessingTabs.delete(tabId);
        // 注意：不要清除currentlyProcessingQueries和pendingAiSearchRequests
        // 这些会在收到aiSearchRequestCompleted消息后处理
      }
    }
  );
};
