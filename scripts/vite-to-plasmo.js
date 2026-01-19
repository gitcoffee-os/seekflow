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
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const VITE_DIST_DIR = path.join(__dirname, '../dist');
const PLASMO_BUILD_DIR = path.join(__dirname, '../build/chrome-mv3-dev');
const PLASMO_STATIC_DIR = path.join(__dirname, '../.plasmo/static');

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
    (file) => file.startsWith('background-') && file.endsWith('.js')
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
  if (!fs.existsSync(manifestPath)) {
    console.error(`✗ manifest.json not found at ${manifestPath}`);
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const backgroundScript = getBackgroundScript();
  const contentScript = getContentScript();

  if (backgroundScript) {
    // 更新背景脚本路径
    if (manifest.background && manifest.background.service_worker) {
      manifest.background.service_worker = `assets/${backgroundScript}`;
    }
    console.log(`✓ Updated background script in manifest.json`);
  }

  if (contentScript) {
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

  // 2. 处理动态导入
  content = content.replace(/import\s*\([\s\S]*?\)/g, (match) => {
    // 同样，我们可以移除动态导入，因为所有依赖都应该已经包含在文件中
    return '{}';
  });

  // 处理 import.meta 代码
  content = content.replace(/import\.meta\.env/g, '{}');
  content = content.replace(/import\.meta\.url/g, `"file://${filePath}"`);

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

  // 处理 require 语句
  content = content.replace(
    /require\(['"]([^'"]+)['"]\)/g,
    (match, modulePath) => {
      // 由于我们使用IIFE格式，并且已经将所有依赖打包到单个文件中，
      // 我们可以简单地移除require语句，因为所有依赖都应该已经包含在文件中
      return '{}';
    }
  );

  // 将整个文件包装在IIFE中
  content = `(function() {\n${content}\n})();`;

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
  console.log('🚀 Starting Vite to Plasmo conversion...');

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

  // 2. 处理并复制 Vite 构建的 HTML 文件
  const rootHtmlPath = path.join(VITE_DIST_DIR, 'index.html');
  const optionsHtmlPath = path.join(
    VITE_DIST_DIR,
    'src',
    'options',
    'index.html'
  );
  // Sidepanel now uses Plasmo's default handling - no HTML file needed
  const popupHtmlPath = path.join(VITE_DIST_DIR, 'src', 'popup', 'index.html');

  if (fs.existsSync(rootHtmlPath)) {
    processHtmlFile(rootHtmlPath, path.join(PLASMO_BUILD_DIR, 'index.html'));
  }

  if (fs.existsSync(optionsHtmlPath)) {
    processHtmlFile(
      optionsHtmlPath,
      path.join(PLASMO_BUILD_DIR, 'options.html')
    );
  }

  // Sidepanel HTML processing removed - using Plasmo's default handling

  if (fs.existsSync(popupHtmlPath)) {
    processHtmlFile(popupHtmlPath, path.join(PLASMO_BUILD_DIR, 'popup.html'));
  }

  // 3. 复制 Vite 构建的所有资源
  const assetsDir = path.join(VITE_DIST_DIR, 'assets');
  if (fs.existsSync(assetsDir)) {
    const plasmoAssetsDir = path.join(PLASMO_BUILD_DIR, 'assets');
    copyDir(assetsDir, plasmoAssetsDir);
  }

  // 4. 再次转换 assets 目录下的背景脚本（因为 copyDir 会覆盖之前的转换）
  const updatedBackgroundScript = getBackgroundScript();
  if (updatedBackgroundScript) {
    const buildAssetsBackgroundPath = path.join(
      PLASMO_BUILD_DIR,
      'assets',
      updatedBackgroundScript
    );
    // 转换背景脚本为 IIFE 格式
    convertEsModuleToIife(buildAssetsBackgroundPath);
    // 修复模块引用路径
    fixModulePaths(buildAssetsBackgroundPath);
  }

  // 5. 更新 manifest.json
  updateManifest();

  // 6. 从package.json复制manifest配置到构建目录
  copyManifestConfig();

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
    // 合并配置，保留构建生成的字段，同时覆盖package.json中的配置
    Object.assign(manifest, packageJson.manifest);

    // 保存更新后的manifest.json
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(
      `✓ Copied manifest configuration from package.json to build directory`
    );
  }
}

// 运行转换脚本
convertViteToPlasmo();
