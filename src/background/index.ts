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
import { initSeekFlow } from '../api';
// 导入模块管理器
import { initializeAllModules } from './modules/moduleManager';
// 导入store初始化函数
import { initStore } from '@gitcoffee/store';
// 导入设置store
import { useSettingsStore } from '../stores/settings';

// 背景脚本 - 处理扩展的后台逻辑

// Chrome API 类型声明
declare const chrome: any;

// 初始化 SeekFlow 扩展
const initializeSeekFlow = async () => {
  console.log('SeekFlow 后台脚本初始化开始');

  // 初始化 store
  console.log('初始化 Store...');
  await initStore();
  console.log('Store 初始化完成');

  // 初始化设置
  console.log('初始化设置...');
  const settingsStore = useSettingsStore();
  await settingsStore.initialize();
  console.log('设置初始化完成');

  initSeekFlow();

  // 使用模块管理器初始化所有模块
  await initializeAllModules();

  console.log('SeekFlow 后台脚本初始化完成');
};

// 启动初始化
initializeSeekFlow();
