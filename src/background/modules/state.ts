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
// 从searchTask模块导入搜索任务相关定义
import type { SearchTask } from './searchTask';
import { activeSearchTasks } from './searchTask';

// 状态管理模块 - 处理扩展的各种状态

// 声明全局Window接口
declare global {
  interface Window {
    seekflowSearchTaskId?: string;
    seekflowFillingInProgress?: boolean;
    seekflowFilledQueries?: Set<string>;
    seekflowTabId?: number;
    seekflowLastFilledQuery?: string;
    seekflowLastSubmitTimestamp?: number;
    seekflowIsSubmitted?: boolean;
    seekflowIsGeneratingReply?: boolean;
    seekflowRetryCount?: number;
  }
}

// 存储正在处理的标签页，防止重复处理
export const processingTabs = new Set<number>();

// 存储标签页的URL历史，用于检测页面重定向
export const tabUrlHistory = new Map<number, string>();

// 存储已经处理过的查询和标签页组合，防止重复提交
export const processedQueries = new Map<number, Set<string>>();

// 存储正在处理的查询和标签页组合，用于实时防重
export const currentlyProcessingQueries = new Map<string, boolean>();

// 存储每个标签页当前是否正在处理AI对话请求
export const aiChatProcessingTabs = new Set<number>();

// 存储每个标签页的AI对话状态
export interface AIChatState {
  // 最后一次填充的查询
  lastFilledQuery: string | null;
  // 最后一次提交的时间戳
  lastSubmitTimestamp: number;
  // 是否已经提交过查询
  isSubmitted: boolean;
  // AI是否正在生成回复
  isGeneratingReply: boolean;
  // 已经重试的次数
  retryCount: number;
}

// 存储标签页的AI对话状态
export const aiChatStates = new Map<number, AIChatState>();

// 初始化或重置标签页的AI对话状态
export const initializeChatState = (tabId: number): void => {
  aiChatStates.set(tabId, {
    lastFilledQuery: null,
    lastSubmitTimestamp: 0,
    isSubmitted: false,
    isGeneratingReply: false,
    retryCount: 0,
  });
};

// 更新标签页的AI对话状态
export const updateChatState = (
  tabId: number,
  updates: Partial<AIChatState>
): void => {
  const currentState = aiChatStates.get(tabId) || {
    lastFilledQuery: null,
    lastSubmitTimestamp: 0,
    isSubmitted: false,
    isGeneratingReply: false,
    retryCount: 0,
  };
  aiChatStates.set(tabId, { ...currentState, ...updates });
};

// 获取标签页的AI对话状态
export const getChatState = (tabId: number): AIChatState => {
  return (
    aiChatStates.get(tabId) || {
      lastFilledQuery: null,
      lastSubmitTimestamp: 0,
      isSubmitted: false,
      isGeneratingReply: false,
      retryCount: 0,
    }
  );
};
