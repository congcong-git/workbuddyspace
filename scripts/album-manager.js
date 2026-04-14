#!/usr/bin/env node

/**
 * 相册照片管理工具
 * 
 * 用法:
 *   node scripts/album-manager.js add <相册名> <照片路径> [标题]
 *   node scripts/album-manager.js create <相册名> <描述>
 *   node scripts/album-manager.js list
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ALBUMS_DIR = path.join(process.cwd(), 'content/albums');
const IMAGES_DIR = path.join(process.cwd(), 'public/images/albums');

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 列出所有相册
function listAlbums() {
  ensureDir(ALBUMS_DIR);
  const files = fs.readdirSync(ALBUMS_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  
  if (files.length === 0) {
    console.log('暂无相册');
    return;
  }

  console.log('\n📷 相册列表:\n');
  files.forEach(file => {
    const content = fs.readFileSync(path.join(ALBUMS_DIR, file), 'utf8');
    const data = yaml.load(content);
    const slug = file.replace(/\.ya?ml$/, '');
    console.log(`  📁 ${data.name} (${slug})`);
    console.log(`     ${data.description || '无描述'}`);
    console.log(`     ${data.photos ? data.photos.length : 0} 张照片\n`);
  });
}

// 创建新相册
function createAlbum(name, description) {
  ensureDir(ALBUMS_DIR);
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '');
  const filePath = path.join(ALBUMS_DIR, `${slug}.yaml`);
  
  if (fs.existsSync(filePath)) {
    console.log(`❌ 相册 "${slug}" 已存在`);
    return;
  }

  const albumData = {
    name: name,
    description: description || '',
    date: new Date().toISOString().split('T')[0],
    cover: '',
    photos: [],
  };

  fs.writeFileSync(filePath, yaml.dump(albumData, { lineWidth: -1 }), 'utf8');
  console.log(`✅ 相册 "${name}" 创建成功 (${slug}.yaml)`);
}

// 添加照片到相册
function addPhoto(albumSlug, photoPath, caption) {
  ensureDir(ALBUMS_DIR);
  ensureDir(path.join(IMAGES_DIR, albumSlug));
  
  const yamlPath = path.join(ALBUMS_DIR, `${albumSlug}.yaml`);
  
  if (!fs.existsSync(yamlPath)) {
    console.log(`❌ 相册 "${albumSlug}" 不存在`);
    return;
  }

  // 复制图片到 public 目录
  const photoFileName = path.basename(photoPath);
  const destPath = path.join(IMAGES_DIR, albumSlug, photoFileName);
  
  if (fs.existsSync(photoPath)) {
    fs.copyFileSync(photoPath, destPath);
    console.log(`📸 照片已复制到 ${destPath}`);
  }

  // 更新 YAML
  const content = fs.readFileSync(yamlPath, 'utf8');
  const data = yaml.load(content);
  
  if (!data.photos) data.photos = [];
  
  data.photos.push({
    src: `/images/albums/${albumSlug}/${photoFileName}`,
    caption: caption || photoFileName.replace(/\.[^.]+$/, ''),
  });

  // 如果是第一张照片，自动设为封面
  if (data.photos.length === 1) {
    data.cover = `/images/albums/${albumSlug}/${photoFileName}`;
  }

  fs.writeFileSync(yamlPath, yaml.dump(data, { lineWidth: -1 }), 'utf8');
  console.log(`✅ 照片已添加到相册 "${data.name}"`);
}

// 命令解析
const [,, command, ...args] = process.argv;

switch (command) {
  case 'list':
    listAlbums();
    break;
  case 'create':
    if (!args[0]) {
      console.log('用法: node album-manager.js create <相册名> [描述]');
      break;
    }
    createAlbum(args[0], args[1]);
    break;
  case 'add':
    if (!args[0] || !args[1]) {
      console.log('用法: node album-manager.js add <相册名> <照片路径> [标题]');
      break;
    }
    addPhoto(args[0], args[1], args[2]);
    break;
  default:
    console.log(`
📷 相册管理工具

用法:
  node scripts/album-manager.js list                          列出所有相册
  node scripts/album-manager.js create <相册名> [描述]        创建新相册
  node scripts/album-manager.js add <相册名> <照片路径> [标题] 添加照片到相册
    `);
}
