#!/usr/bin/env node

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

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const isDevMode = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';
const isBuildMode = process.argv.includes('--build') || !isDevMode;
const VITE_DIST_DIR = path.join(__dirname, '../dist');
const PLASMO_BUILD_DIR = path.join(__dirname, '../build/chrome-mv3-dev');
const PLASMO_STATIC_DIR = path.join(__dirname, '../.plasmo/static');
const SRC_DIR = path.join(__dirname, '../src');

// 创建目录
function mkdirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 处理 HTML 文件中的资源路径，将绝对路径转为相对路径
function processHtmlFile(src, dest) {
  mkdirSync(path.dirname(dest));
  let content = fs.readFileSync(src, 'utf8');
  // 将绝对路径替换为相对路径
  content = content.replace(/src="\//g, 'src="./');
  content = content.replace(/href="\//g, 'href="./');
  fs.writeFileSync(dest, content);
  console.log(`✓ Processed and copied ${src} to ${dest}`);
}

// 复制文件
function copyFile(src, dest) {
  mkdirSync(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`✓ Copied ${src} to ${dest}`);
}

// 复制目录
function copyDir(src, dest) {
  mkdirSync(dest);
  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// 获取背景脚本文件名
function getBackgroundScript() {
  const assetsDir = path.join(VITE_DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) {
    return null;
  }
  const files = fs.readdirSync(assetsDir);
  return files.find(
    (file) => file.startsWith('background-') && (file.endsWith('.js') || file.endsWith('.cjs'))
  );
}

// 获取内容脚本文件名
function getContentScript() {
  const assetsDir = path.join(VITE_DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) {
    return null;
  }
  const files = fs.readdirSync(assetsDir);
  return files.find(
    (file) => file.startsWith('content-') && file.endsWith('.js')
  );
}

// 获取侧边栏脚本文件名
function getSidepanelScript() {
  const assetsDir = path.join(VITE_DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) {
    return null;
  }
  const files = fs.readdirSync(assetsDir);
  return files.find(
    (file) => file.startsWith('sidepanel-') && file.endsWith('.js')
  );
}

// 更新 manifest.json
function updateManifest() {
  const manifestPath = path.join(PLASMO_BUILD_DIR, 'manifest.json');
  
  // 如果manifest.json不存在，创建一个基本的manifest.json文件
  if (!fs.existsSync(manifestPath)) {
    console.warn(`⚠️ manifest.json not found at ${manifestPath}, creating a new one`);
    const baseManifest = {
      manifest_version: 3,
      name: 'SeekFlow 智能探索助手',
      version: '1.0.0',
      description: 'SeekFlow 智能探索助手',
      permissions: [
        'storage',
        'activeTab',
        'tabs',
        'scripting',
        'tabGroups',
        'sidePanel'
      ],
      host_permissions: [
        'https://*/*',
        'http://127.0.0.1/*',
        'http://localhost/*'
      ],
      web_accessible_resources: [
        {
          resources: [
            'index.html',
            'assets/*'
          ],
          matches: [
            '<all_urls>'
          ]
        }
      ],
      options_page: 'options.html',
      options_ui: {
        page: 'options.html',
        open_in_tab: false
      },
      side_panel: {
        default_path: 'sidepanel.html'
      }
    };
    fs.writeFileSync(manifestPath, JSON.stringify(baseManifest, null, 2));
    console.log(`✓ Created new manifest.json file`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const backgroundScript = getBackgroundScript();
  const contentScript = getContentScript();

  console.log(`🔍 Checking for background script...`);
  if (backgroundScript) {
    console.log(`✓ Found background script: ${backgroundScript}`);
    // 更新或添加背景脚本配置
    if (!manifest.background) {
      manifest.background = {};
    }
    const oldBackgroundScript = manifest.background.service_worker;
    manifest.background.service_worker = `assets/${backgroundScript}`;
    console.log(`✓ Updated background script in manifest.json from ${oldBackgroundScript || 'none'} to assets/${backgroundScript}`);
  } else {
    console.warn(`⚠️ No background script found`);
  }

  if (contentScript) {
    console.log(`✓ Found content script: ${contentScript}`);
    // 添加内容脚本配置
    manifest.content_scripts = [
      {
        matches: ['http://*/*', 'https://*/*'],
        js: ['assets/' + contentScript],
      },
    ];
    console.log(`✓ Added content script configuration to manifest.json`);
  }

  // 递归清理 manifest 中的所有字段，移除多余的反引号
  function cleanObject(obj) {
    if (Array.isArray(obj)) {
      return obj.map(cleanObject);
    } else if (typeof obj === 'object' && obj !== null) {
      const cleaned = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cleaned[key] = cleanObject(obj[key]);
        }
      }
      return cleaned;
    } else if (typeof obj === 'string') {
      return obj.replace(/`/g, '').trim();
    }
    return obj;
  }

  // 清理整个 manifest 对象
  const cleanedManifest = cleanObject(manifest);
  Object.assign(manifest, cleanedManifest);
  console.log(`✓ Cleaned all fields in manifest.json`);

  // 确保 web_accessible_resources 配置正确
  if (!manifest.web_accessible_resources) {
    manifest.web_accessible_resources = [];
  }

  // 保存更新后的 manifest.json
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✓ Saved updated manifest.json`);
  console.log(`📋 Final manifest background configuration:`, manifest.background);
}

// 将 ES 模块转换为 IIFE 格式（用于背景脚本）
function convertEsModuleToIife(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`✗ File not found at ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 处理 import 语句
  // 1. 处理静态导入（包括minified格式）
  content = content.replace(
    /import\s*([\s\S]*?)\s*from\s*['"]([^'"]+)['"]/g,
    (match, importedNames, modulePath) => {
      // 由于我们使用IIFE格式，并且已经将所有依赖打包到单个文件中，
      // 我们可以简单地移除导入语句，因为所有依赖都应该已经包含在文件中
      return '';
    }
  );
  
  // 2. 处理简化的导入语句（如：import"./vendor.js";）
  content = content.replace(
    /import\s*['"]([^'"]+)['"];?/g,
    (match, modulePath) => {
      // 同样移除这种格式的导入语句
      return '';
    }
  );

  // 2. 处理动态导入
  content = content.replace(/import\s*\([\s\S]*?\)/g, (match) => {
    // 同样，我们可以移除动态导入，因为所有依赖都应该已经包含在文件中
    return '{}';
  });

  // 处理 import.meta 代码
  content = content.replace(/import\.meta\.env/g, '{}');
  content = content.replace(/import\.meta\.url/g, `"file://${filePath}"`);
  // 处理直接访问 import.meta 的情况
  content = content.replace(/import\.meta/g, '{}');
  // 处理 window.import.meta 的情况
  content = content.replace(/window\.import\.meta/g, '{}');
  content = content.replace(/window\.import\.meta\.env/g, '{}');
  content = content.replace(/window\.import\.meta\.url/g, `"file://${filePath}"`);


  // 处理 export default - 我们将其转换为全局变量
  content = content.replace(
    /export\s*default\s*([^;]+);?/g,
    (match, exported) => {
      // 在IIFE中，我们不需要导出，只需确保代码执行
      return `${exported};`;
    }
  );

  // 处理 export { ... } 格式
  content = content.replace(
    /export\s*\{([^}]+)\};?/g,
    (match, exportedNames) => {
      // 移除导出语句，因为我们不需要导出
      return '';
    }
  );

  // 处理单个导出
  content = content.replace(
    /export\s+(?:const|let|var|function|class)\s+([^=]+)=?/g,
    (match, declaration) => {
      // 保留声明但移除导出关键字
      const keyword = match.match(/export\s+(const|let|var|function|class)/)[1];
      return `${keyword} ${declaration} =`;
    }
  );

  // 处理 export * from ... 格式
  content = content.replace(/export\s*\*\s*from\s*['"]([^'"]+)['"]/g, () => {
    // 移除导出语句
    return '';
  });

  // 添加必要的变量定义，用于修复 Ant Design Vue 中的国际化配置问题
  const variableDefinitions = `\n  // Ant Design Vue 国际化配置变量定义\n  const S = {}; // Pagination 国际化配置\n  const o = {}; // DatePicker 和 Calendar 国际化配置\n  const p = {}; // TimePicker 国际化配置\n  \n  // 国际化翻译函数\n  function t(obj, defaultObj) {\n    return obj || defaultObj || {};\n  }\n  `;

  // 将整个文件包装在IIFE中，并在其中添加必要的变量定义
  content = `(function() {\n${variableDefinitions}${content}\n})();`;

  // 写入转换后的内容
  fs.writeFileSync(filePath, content);
  console.log(`✓ Converted ES module to IIFE in ${filePath}`);
}

// 修复背景脚本中的模块引用路径
function fixModulePaths(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`✗ File not found at ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // 将相对路径的模块引用转换为指向 assets 目录
  // 例如：require('./platforms-123456.js') -> require('../assets/platforms-123456.js')
  content = content.replace(
    /require\(['"](\.\/[^'"]+)['"]\)/g,
    (match, modulePath) => {
      // 检查是否是平台模块或其他依赖模块
      if (
        modulePath.startsWith('./platforms-') ||
        modulePath.startsWith('./_plugin-vue_export-helper-') ||
        modulePath.startsWith('./main-') ||
        modulePath.startsWith('./content-')
      ) {
        // 将路径改为指向 assets 目录
        return `require('../assets/${modulePath.replace('./', '')}')`;
      }
      return match;
    }
  );

  // 写入修复后的内容
  fs.writeFileSync(filePath, content);
  console.log(`✓ Fixed module paths in ${filePath}`);
}

// 转换 Vite 产物到 Plasmo 格式
function convertViteToPlasmo() {
  console.log(`🚀 Starting Vite to Plasmo conversion... ${isDevMode ? '(Development Mode)' : '(Build Mode)'}`);

  // 1. 处理 HTML 文件
  if (isDevMode) {
    // 开发模式：使用 Vite 编译后的产物
    console.log('📁 Development mode: waiting for Vite compilation');
    console.log('📝 Note: In development mode, files are served by Vite dev server');
    
    // 清理 build 目录，确保不会有旧的文件残留
    console.log('🧹 Cleaning build directory...');
    if (fs.existsSync(PLASMO_BUILD_DIR)) {
      fs.rmSync(PLASMO_BUILD_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(PLASMO_BUILD_DIR, { recursive: true });
    console.log('✓ Cleaned build directory');
    
    // 检查 Vite 编译产物是否存在
    const viteDistIndexHtml = path.join(VITE_DIST_DIR, 'index.html');
    const viteDistOptionsHtml = path.join(VITE_DIST_DIR, 'src', 'options', 'index.html');
    const viteDistSidepanelHtml = path.join(VITE_DIST_DIR, 'src', 'sidepanel', 'index.html');
    
    // 如果 Vite 已经编译完成，使用编译后的产物
    if (fs.existsSync(viteDistIndexHtml)) {
      console.log('✓ Vite compilation detected, using built artifacts');
      processHtmlFile(viteDistIndexHtml, path.join(PLASMO_BUILD_DIR, 'index.html'));
      
      // 复制 Vite 构建的所有资源
      const assetsDir = path.join(VITE_DIST_DIR, 'assets');
      if (fs.existsSync(assetsDir)) {
        const plasmoAssetsDir = path.join(PLASMO_BUILD_DIR, 'assets');
        copyDir(assetsDir, plasmoAssetsDir);
        console.log('✓ Copied assets to build directory');
        // 列出复制的文件，便于调试
        const copiedFiles = fs.readdirSync(plasmoAssetsDir);
        console.log('📋 Copied files:', copiedFiles);
      }
      
      // 处理开发模式下的背景脚本
      const backgroundScript = getBackgroundScript();
      if (backgroundScript) {
        const buildAssetsBackgroundPath = path.join(
          PLASMO_BUILD_DIR,
          'assets',
          backgroundScript
        );
        
        // 转换背景脚本为 IIFE 格式
        convertEsModuleToIife(buildAssetsBackgroundPath);
        // 修复模块引用路径
        fixModulePaths(buildAssetsBackgroundPath);
        console.log('✓ Processed background script in development mode');
        console.log('✓ Background script path:', buildAssetsBackgroundPath);
      }
    }
    
    if (fs.existsSync(viteDistOptionsHtml)) {
      processHtmlFile(viteDistOptionsHtml, path.join(PLASMO_BUILD_DIR, 'options.html'));
      console.log('✓ Processed options.html');
    } else {
      console.warn('⚠️ options.html not found in Vite dist directory');
      // 如果找不到，尝试从 src/options/index.html 复制
      const srcOptionsHtml = path.join(SRC_DIR, 'options', 'index.html');
      if (fs.existsSync(srcOptionsHtml)) {
        fs.copyFileSync(srcOptionsHtml, path.join(PLASMO_BUILD_DIR, 'options.html'));
        console.log('✓ Copied options.html from src directory');
      }
    }
    
    // 处理 sidepanel.html
    if (fs.existsSync(viteDistSidepanelHtml)) {
      processHtmlFile(viteDistSidepanelHtml, path.join(PLASMO_BUILD_DIR, 'sidepanel.html'));
      console.log('✓ Processed sidepanel.html');
    } else {
      console.warn('⚠️ sidepanel.html not found in Vite dist directory');
      // 如果找不到，尝试从 src/sidepanel/index.html 复制
      const srcSidepanelHtml = path.join(SRC_DIR, 'sidepanel', 'index.html');
      if (fs.existsSync(srcSidepanelHtml)) {
        fs.copyFileSync(srcSidepanelHtml, path.join(PLASMO_BUILD_DIR, 'sidepanel.html'));
        console.log('✓ Copied sidepanel.html from src directory');
      }
    }
  } else {
    // 构建模式：使用 Vite 构建的产物
    console.log('📁 Build mode: using Vite build artifacts');
    
    // 1. 处理 Vite 构建的背景脚本
    const backgroundScript = getBackgroundScript();
    if (backgroundScript) {
      const viteBackgroundPath = path.join(
        VITE_DIST_DIR,
        'assets',
        backgroundScript
      );
      const plasmoBackgroundPath = path.join(
        PLASMO_STATIC_DIR,
        'background',
        'index.js'
      );
      const buildAssetsBackgroundPath = path.join(
        PLASMO_BUILD_DIR,
        'assets',
        backgroundScript
      );
      const buildBackgroundPath = path.join(
        PLASMO_BUILD_DIR,
        'static',
        'background',
        'index.js'
      );

      // 复制到各个位置
      copyFile(viteBackgroundPath, plasmoBackgroundPath);
      copyFile(viteBackgroundPath, buildAssetsBackgroundPath);
      copyFile(viteBackgroundPath, buildBackgroundPath);

      // 转换所有位置的背景脚本为 IIFE 格式
      convertEsModuleToIife(plasmoBackgroundPath);
      convertEsModuleToIife(buildAssetsBackgroundPath);
      convertEsModuleToIife(buildBackgroundPath);

      // 修复所有位置的模块引用路径
      fixModulePaths(plasmoBackgroundPath);
      fixModulePaths(buildAssetsBackgroundPath);
      fixModulePaths(buildBackgroundPath);
    }

    // 2. 处理 Vite 构建的侧边栏脚本
    const sidepanelScript = getSidepanelScript();
    if (sidepanelScript) {
      const viteSidepanelPath = path.join(
        VITE_DIST_DIR,
        'assets',
        sidepanelScript
      );
      const plasmoSidepanelPath = path.join(
        PLASMO_STATIC_DIR,
        'sidepanel',
        'index.js'
      );
      const buildAssetsSidepanelPath = path.join(
        PLASMO_BUILD_DIR,
        'assets',
        sidepanelScript
      );
      const buildSidepanelPath = path.join(
        PLASMO_BUILD_DIR,
        'static',
        'sidepanel',
        'index.js'
      );

      // 创建侧边栏目录
      fs.mkdirSync(path.dirname(plasmoSidepanelPath), { recursive: true });
      fs.mkdirSync(path.dirname(buildSidepanelPath), { recursive: true });

      // 复制到各个位置
      copyFile(viteSidepanelPath, plasmoSidepanelPath);
      copyFile(viteSidepanelPath, buildAssetsSidepanelPath);
      copyFile(viteSidepanelPath, buildSidepanelPath);

      // 转换所有位置的侧边栏脚本为 IIFE 格式
      convertEsModuleToIife(plasmoSidepanelPath);
      convertEsModuleToIife(buildAssetsSidepanelPath);
      convertEsModuleToIife(buildSidepanelPath);

      // 修复所有位置的模块引用路径
      fixModulePaths(plasmoSidepanelPath);
      fixModulePaths(buildAssetsSidepanelPath);
      fixModulePaths(buildSidepanelPath);
    }

    // 3. 处理并复制 Vite 构建的 HTML 文件
    const rootHtmlPath = path.join(VITE_DIST_DIR, 'index.html');
    const optionsHtmlPath = path.join(
      VITE_DIST_DIR,
      'src',
      'options',
      'index.html'
    );
    const sidepanelHtmlPath = path.join(
      VITE_DIST_DIR,
      'src',
      'sidepanel',
      'index.html'
    );
    const popupHtmlPath = path.join(VITE_DIST_DIR, 'popup.html');

    if (fs.existsSync(rootHtmlPath)) {
      processHtmlFile(rootHtmlPath, path.join(PLASMO_BUILD_DIR, 'index.html'));
    }

    if (fs.existsSync(optionsHtmlPath)) {
      processHtmlFile(
        optionsHtmlPath,
        path.join(PLASMO_BUILD_DIR, 'options.html')
      );
      console.log('✓ Processed options.html');
    }

    // 处理 sidepanel.html
    if (fs.existsSync(sidepanelHtmlPath)) {
      processHtmlFile(
        sidepanelHtmlPath,
        path.join(PLASMO_BUILD_DIR, 'sidepanel.html')
      );
      console.log('✓ Processed sidepanel.html');
    } else {
      console.warn('⚠️ sidepanel.html not found in Vite dist directory');
      // 如果找不到，尝试从 src/sidepanel/index.html 复制
      const srcSidepanelHtml = path.join(SRC_DIR, 'sidepanel', 'index.html');
      if (fs.existsSync(srcSidepanelHtml)) {
        fs.copyFileSync(srcSidepanelHtml, path.join(PLASMO_BUILD_DIR, 'sidepanel.html'));
        console.log('✓ Copied sidepanel.html from src directory');
      }
    }

    if (fs.existsSync(popupHtmlPath)) {
      processHtmlFile(popupHtmlPath, path.join(PLASMO_BUILD_DIR, 'popup.html'));
      console.log('✓ Processed popup.html');
    }

    // 4. 复制 Vite 构建的所有资源
    const assetsDir = path.join(VITE_DIST_DIR, 'assets');
    if (fs.existsSync(assetsDir)) {
      const plasmoAssetsDir = path.join(PLASMO_BUILD_DIR, 'assets');
      copyDir(assetsDir, plasmoAssetsDir);
    }

    // 5. 转换 assets 目录下的所有脚本文件（包括 settings-*.js）
    const buildAssetsDir = path.join(PLASMO_BUILD_DIR, 'assets');
    if (fs.existsSync(buildAssetsDir)) {
      const files = fs.readdirSync(buildAssetsDir);
      for (const file of files) {
        if (file.endsWith('.js')) {
          const filePath = path.join(buildAssetsDir, file);
          // 转换脚本为 IIFE 格式
          convertEsModuleToIife(filePath);
          // 修复模块引用路径
          fixModulePaths(filePath);
        }
      }
    }

    // 6. 再次复制 options.html 文件（确保它不会被 plasmo build 覆盖）
    if (fs.existsSync(optionsHtmlPath)) {
      processHtmlFile(
        optionsHtmlPath,
        path.join(PLASMO_BUILD_DIR, 'options.html')
      );
      console.log('✓ Re-copied options.html to ensure it exists in build directory');
    }
    
    // 7. 再次复制 sidepanel.html 文件（确保它不会被 plasmo build 覆盖）
    if (fs.existsSync(sidepanelHtmlPath)) {
      processHtmlFile(
        sidepanelHtmlPath,
        path.join(PLASMO_BUILD_DIR, 'sidepanel.html')
      );
      console.log('✓ Re-copied sidepanel.html to ensure it exists in build directory');
    } else {
      // 如果找不到，尝试从 src/sidepanel/index.html 复制
      const srcSidepanelHtml = path.join(SRC_DIR, 'sidepanel', 'index.html');
      if (fs.existsSync(srcSidepanelHtml)) {
        fs.copyFileSync(srcSidepanelHtml, path.join(PLASMO_BUILD_DIR, 'sidepanel.html'));
        console.log('✓ Re-copied sidepanel.html from src directory to ensure it exists in build directory');
      }
    }
  }

  // 7. 更新 manifest.json
  updateManifest();
  console.log('✓ Updated manifest.json with latest background script');

  // 8. 从package.json复制manifest配置到构建目录
  copyManifestConfig();
  console.log('✓ Copied manifest configuration from package.json');

  // 9. 确保Plasmo能够检测到manifest.json的变化
  // 这对于热更新非常重要
  const manifestPath = path.join(PLASMO_BUILD_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    // 触摸manifest.json文件，确保Plasmo能够检测到变化
    fs.utimesSync(manifestPath, new Date(), new Date());
    console.log('✓ Touched manifest.json to trigger Plasmo hot reload');
  }
  
  // 10. 修复.plasmo/main.tsx文件中的导入路径问题
  const plasmoMainPath = path.join(__dirname, '..', '.plasmo', 'main.tsx');
  if (fs.existsSync(plasmoMainPath)) {
    console.log('🔧 Fixing import paths in .plasmo/main.tsx');
    let plasmoMainContent = fs.readFileSync(plasmoMainPath, 'utf8');
    
    // 写入修改后的内容
    fs.writeFileSync(plasmoMainPath, plasmoMainContent);
    console.log('✓ Fixed import paths in .plasmo/main.tsx');
  }

  console.log('🎉 Vite to Plasmo conversion completed!');
}

// 从package.json复制manifest配置到构建目录
function copyManifestConfig() {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const manifestPath = path.join(PLASMO_BUILD_DIR, 'manifest.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.error(`✗ package.json not found at ${packageJsonPath}`);
    return;
  }

  if (!fs.existsSync(manifestPath)) {
    console.error(`✗ manifest.json not found at ${manifestPath}`);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  // 复制package.json中的manifest配置到构建目录的manifest.json
  if (packageJson.manifest) {
    // 保存现有的background配置（如果存在）
    const existingBackground = manifest.background;
    
    // 合并配置，保留构建生成的字段，同时添加package.json中的配置
    // 注意：我们只合并package.json中定义的字段，不覆盖现有的background配置
    const packageManifest = packageJson.manifest;
    Object.keys(packageManifest).forEach(key => {
      // 跳过background字段，保留我们刚刚更新的配置
      if (key !== 'background') {
        manifest[key] = packageManifest[key];
      }
    });
    
    // 确保background配置存在（如果之前没有）
    if (existingBackground) {
      manifest.background = existingBackground;
    }

    // 保存更新后的manifest.json
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(
      `✓ Copied manifest configuration from package.json to build directory`
    );
  }
}

// 运行转换脚本
convertViteToPlasmo();

// 开发模式下的额外处理
if (isDevMode) {
  console.log('✅ Development mode conversion completed!');
  console.log('🔄 Watching for file changes...');
  console.log('📝 Note: In development mode, TypeScript files are compiled by Vite, not copied directly');
}
