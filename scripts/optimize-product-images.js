const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 商品图片目录
const PRODUCTS_DIR = path.join(__dirname, '../public/products');
const BACKUP_DIR = path.join(__dirname, '../public/products/backup');

// 优化配置
const OPTIMIZE_CONFIG = {
  maxWidth: 800,        // 最大宽度（2x 用于 Retina，实际显示 315px）
  maxHeight: 800,       // 最大高度
  quality: 85,          // JPG 质量
  fit: 'inside',        // 保持比例，不裁剪
  withoutEnlargement: true, // 不放大已经较小的图片
};

async function optimizeImage(inputPath, outputPath) {
  try {
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    
    console.log(`\n📸 处理: ${path.basename(inputPath)}`);
    console.log(`   原始大小: ${(originalSize / 1024).toFixed(2)} KB`);
    
    // 获取原始图片信息
    const metadata = await sharp(inputPath).metadata();
    console.log(`   原始尺寸: ${metadata.width}x${metadata.height}`);
    
    // 优化图片
    const optimizedBuffer = await sharp(inputPath)
      .resize(OPTIMIZE_CONFIG.maxWidth, OPTIMIZE_CONFIG.maxHeight, {
        fit: OPTIMIZE_CONFIG.fit,
        withoutEnlargement: OPTIMIZE_CONFIG.withoutEnlargement,
      })
      .jpeg({ 
        quality: OPTIMIZE_CONFIG.quality,
        mozjpeg: true, // 使用 mozjpeg 获得更好的压缩
      })
      .toBuffer();
    
    // 保存优化后的图片
    fs.writeFileSync(outputPath, optimizedBuffer);
    
    const newSize = optimizedBuffer.length;
    const saved = originalSize - newSize;
    const savedPercent = ((saved / originalSize) * 100).toFixed(1);
    
    console.log(`   ✅ 优化后: ${(newSize / 1024).toFixed(2)} KB`);
    console.log(`   💾 节省: ${(saved / 1024).toFixed(2)} KB (${savedPercent}%)`);
    
    return {
      original: originalSize,
      optimized: newSize,
      saved: saved,
      savedPercent: savedPercent,
    };
  } catch (error) {
    console.error(`   ❌ 错误: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 开始优化商品图片...\n');
  
  // 创建备份目录
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('📁 创建备份目录');
  }
  
  // 获取所有 JPG 文件
  const files = fs.readdirSync(PRODUCTS_DIR)
    .filter(file => /\.(jpg|jpeg)$/i.test(file))
    .map(file => ({
      name: file,
      inputPath: path.join(PRODUCTS_DIR, file),
      backupPath: path.join(BACKUP_DIR, file),
      outputPath: path.join(PRODUCTS_DIR, file),
    }));
  
  if (files.length === 0) {
    console.log('❌ 未找到 JPG 图片文件');
    return;
  }
  
  console.log(`找到 ${files.length} 个图片文件\n`);
  
  // 先备份所有文件
  console.log('📦 备份原始文件...');
  for (const file of files) {
    fs.copyFileSync(file.inputPath, file.backupPath);
  }
  console.log('✅ 备份完成\n');
  
  // 优化所有图片
  const results = [];
  for (const file of files) {
    const result = await optimizeImage(file.inputPath, file.outputPath);
    if (result) {
      results.push({ name: file.name, ...result });
    }
  }
  
  // 显示总结
  console.log('\n' + '='.repeat(50));
  console.log('📊 优化总结');
  console.log('='.repeat(50));
  
  const totalOriginal = results.reduce((sum, r) => sum + r.original, 0);
  const totalOptimized = results.reduce((sum, r) => sum + r.optimized, 0);
  const totalSaved = totalOriginal - totalOptimized;
  const totalSavedPercent = ((totalSaved / totalOriginal) * 100).toFixed(1);
  
  console.log(`\n总原始大小: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`总优化后: ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
  console.log(`💾 总共节省: ${(totalSaved / 1024 / 1024).toFixed(2)} MB (${totalSavedPercent}%)`);
  
  console.log('\n✅ 优化完成！');
  console.log(`📁 原始文件已备份到: ${BACKUP_DIR}`);
  console.log('\n提示: 如果结果不满意，可以从备份目录恢复文件。');
}

main().catch(console.error);
