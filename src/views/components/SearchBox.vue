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

<template>
  <!-- 转发到统一的SearchBox组件 -->
  <SearchBox
    :settingData="settingData"
    :searching="searching"
    :searchQuery="searchQuery"
    :selectedPlatforms="selectedPlatforms"
    :selectedSearchEngine="selectedSearchEngine"
    @search="handleSearch"
    @update:searchQuery="updateSearchQuery"
    @update:selectedSearchEngine="updateSelectedSearchEngine"
  />
</template>

<script setup lang="ts">
import { SearchBox } from '@gitcoffee/search-ui';

import { selectedPlatforms, selectedSearchEngine } from '@gitcoffee/search';
import { executeSearch, searching, searchQuery } from '@gitcoffee/search';
import { settingData } from '@gitcoffee/app';
import { $t } from '../../locales';

// 响应式数据

// 处理搜索事件
const handleSearch = (query: string, engine: string) => {
  // 执行搜索逻辑，传递选中的搜索引擎
  executeSearch(query, selectedPlatforms.value, undefined, engine);
};

// 更新搜索查询
const updateSearchQuery = (value: string) => {
  // 直接修改searchQuery，它是一个ref
  searchQuery.value = value;
};

// 更新选中的搜索引擎
const updateSelectedSearchEngine = (value: string) => {
  // 直接修改selectedSearchEngine，它是一个ref
  selectedSearchEngine.value = value;
};
</script>

<style scoped>
/* 此处样式已迁移到统一的SearchBox组件 */
</style>
