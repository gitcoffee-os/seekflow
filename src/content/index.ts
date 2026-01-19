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
// 内容脚本 - 在网页中运行的脚本

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener(
  (request: any, _sender: any, sendResponse: any) => {
    if (request.action === 'injectSearch') {
      // 可以在这里注入搜索相关的功能到页面
      injectSearchInterface(request.query);
      sendResponse({ success: true });
    }
  }
);

// 注入搜索界面的函数
function injectSearchInterface(query: string) {
  // 创建搜索界面覆盖层
  const overlay = document.createElement('div');
  overlay.id = 'seekflow-overlay';
  overlay.innerHTML = `
    <div class="seekflow-modal">
      <div class="seekflow-header">
        <h3>SeekFlow 搜索结果</h3>
        <button class="seekflow-close">&times;</button>
      </div>
      <div class="seekflow-content">
        <p>正在为您搜索: <strong>${query}</strong></p>
        <div class="seekflow-loading">
          <div class="spinner"></div>
          <span>搜索中...</span>
        </div>
      </div>
    </div>
  `;

  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    #seekflow-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .seekflow-modal {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .seekflow-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e8e8e8;
    }

    .seekflow-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .seekflow-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .seekflow-close:hover {
      color: #333;
    }

    .seekflow-content {
      padding: 20px;
      text-align: center;
    }

    .seekflow-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #1890ff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  // 添加到页面
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  // 绑定关闭事件
  const closeBtn = overlay.querySelector('.seekflow-close') as HTMLElement;
  closeBtn.addEventListener('click', () => {
    overlay.remove();
    style.remove();
  });

  // 点击遮罩层关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      style.remove();
    }
  });

  // 3秒后自动关闭
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.remove();
      style.remove();
    }
  }, 3000);
}

// 如果需要在页面加载时执行某些操作
document.addEventListener('DOMContentLoaded', () => {
  // 可以在这里添加一些初始化逻辑
});
