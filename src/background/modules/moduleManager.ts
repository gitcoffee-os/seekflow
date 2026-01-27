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
// 模块管理器 - 集中初始化所有SeekFlow模块

// 导入各个模块的初始化函数
import { initializeExtensionEvents } from './extensionEvents';
import { initializeMessageListener } from './messageHandler';
import { initializeTabListeners } from './tabManager';

/**
 * 初始化所有SeekFlow模块
 * 这个函数将集中调用各个模块的初始化函数
 */
export const initializeAllModules = async () => {
  console.log('SeekFlow 模块初始化开始');

  // 按顺序初始化各个模块
  initializeExtensionEvents(); // 初始化扩展事件
  initializeTabListeners(); // 初始化标签页事件
  await initializeMessageListener(); // 初始化消息监听

  console.log('SeekFlow 模块初始化完成');
};
