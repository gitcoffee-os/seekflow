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
import { truncateString } from './utils';

// 标签页分组管理模块 - 处理标签页分组的创建和管理

// Chrome API 类型声明
declare const chrome: any;

/**
 * 创建标签页分组
 * @param tabIds 要分组的标签页ID数组
 * @param query 搜索关键词，用于生成分组标题
 * @returns 分组ID
 */
export const createTabGroup = async (
  tabIds: number[],
  query: string
): Promise<number | undefined> => {
  if (!tabIds || tabIds.length === 0) {
    return undefined;
  }

  console.log('Creating tab group with tabIds:', tabIds);

  try {
    // 使用创建的标签页ID创建标签组
    const groupId = await chrome.tabs.group({
      tabIds: tabIds,
    });

    // 设置分组标题和颜色，确保标签组显示
    const truncatedQuery = truncateString(query, 15);
    const groupTitle = `搜索: ${truncatedQuery} (${tabIds.length}个平台)`;

    await chrome.tabGroups.update(groupId, {
      title: groupTitle,
      color: 'red',
      collapsed: false,
    });

    console.log('已创建标签组:', groupId, '标题:', groupTitle);
    return groupId;
  } catch (error) {
    console.error('创建标签组失败:', error);
    return undefined;
  }
};

/**
 * 创建标签页搜索结果分组
 * @param tabIds 要分组的标签页ID数组
 * @param query 搜索关键词，用于生成分组标题
 * @param isSearchResult 是否为搜索结果分组
 * @returns 分组ID
 */
export const createSearchResultGroup = async (
  tabIds: number[],
  query: string,
  isSearchResult: boolean = true
): Promise<number | undefined> => {
  if (!tabIds || tabIds.length === 0) {
    return undefined;
  }

  try {
    // 使用标签页ID创建标签组
    const groupId = await chrome.tabs.group({
      tabIds: tabIds,
    });

    // 设置分组标题和颜色
    const truncatedQuery = truncateString(query, 15);
    const groupTitle = isSearchResult
      ? `标签页搜索: ${truncatedQuery} (${tabIds.length}个标签页)`
      : `标签页分组: ${truncatedQuery} (${tabIds.length}个标签页)`;

    await chrome.tabGroups.update(groupId, {
      title: groupTitle,
      color: 'green',
      collapsed: false,
    });

    console.log('已创建标签页分组:', groupId, '标题:', groupTitle);
    return groupId;
  } catch (error) {
    console.error('创建标签页分组失败:', error);
    return undefined;
  }
};
