// 后台脚本入口
import { initSeekFlow } from '../api';
// 导入模块管理器
import { initializeAllModules } from '../background/modules/moduleManager';
// 导入store初始化函数
import { initStore } from '@gitcoffee/store';
// 导入设置store
import { useSettingsStore } from '../stores/settings';

// Chrome API 类型声明
declare const chrome: any;

export default {
  main() {
    // 基本的后台脚本逻辑
    console.log('WXT background script loaded');

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
  }
};
