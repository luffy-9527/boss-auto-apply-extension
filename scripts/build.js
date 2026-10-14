import fs from 'node:fs';
import path from 'node:path';
import { build } from 'vite';

async function runBuild() {
  console.log('🚀 开始构建 Boss直聘一键投递助手...');

  // 1. 生成并确保图标存在
  import('./generate-icons.js');

  // 2. 构建前端 Popup 与 Dashboard
  console.log('📦 构建 Popup 与 Web 控制台...');
  await build({
    configFile: path.resolve('vite.config.ts'),
  });

  // 3. 构建 Content Script (IIFE 格式，独立不拆分)
  console.log('📦 构建 Content Script...');
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/content/content.ts'),
        name: 'BossContent',
        formats: ['iife'],
        fileName: () => 'content.js',
      },
    },
  });

  // 4. 构建 Background Script (IIFE 格式)
  console.log('📦 构建 Background Service Worker...');
  await build({
    configFile: false,
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      lib: {
        entry: path.resolve('src/background/background.ts'),
        name: 'BossBackground',
        formats: ['iife'],
        fileName: () => 'background.js',
      },
    },
  });

  // 5. 复制 manifest.json 与 icons 到 dist/
  console.log('📋 复制 manifest.json 与图标资源...');
  fs.copyFileSync(path.resolve('manifest.json'), path.resolve('dist/manifest.json'));

  const iconsSrcDir = path.resolve('public/icons');
  const iconsDistDir = path.resolve('dist/icons');
  if (fs.existsSync(iconsSrcDir)) {
    fs.mkdirSync(iconsDistDir, { recursive: true });
    for (const file of fs.readdirSync(iconsSrcDir)) {
      fs.copyFileSync(path.join(iconsSrcDir, file), path.join(iconsDistDir, file));
    }
  }

  console.log('✅ 构建完成！dist 目录已就绪，可直接在 Chrome 扩展管理界面加载。');
}

runBuild().catch((err) => {
  console.error('❌ 构建失败:', err);
  process.exit(1);
});
