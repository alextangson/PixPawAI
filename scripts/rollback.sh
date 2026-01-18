#!/bin/bash
# 紧急回滚脚本 - 关闭所有新功能
# 
# 使用方法:
# chmod +x scripts/rollback.sh
# ./scripts/rollback.sh

echo "🚨 执行紧急回滚..."
echo ""

# 检查当前目录
if [ ! -f "package.json" ]; then
  echo "❌ 错误: 请在项目根目录执行此脚本"
  exit 1
fi

echo "📝 回滚方案："
echo ""
echo "方式1: 本地开发环境回滚"
echo "--------------------------------------"
echo "修改 .env.local 文件，添加以下内容："
echo ""
echo "NEXT_PUBLIC_USE_NEW_PROMPT_SYSTEM=false"
echo "NEXT_PUBLIC_USE_DATABASE_STYLES=false"
echo ""
echo "然后重启开发服务器: npm run dev"
echo ""

echo "方式2: Vercel 生产环境回滚（推荐）"
echo "--------------------------------------"
echo "1. 访问 Vercel Dashboard: https://vercel.com/dashboard"
echo "2. 选择 PixPawAI 项目"
echo "3. 进入 Settings → Environment Variables"
echo "4. 修改以下环境变量："
echo "   - NEXT_PUBLIC_USE_NEW_PROMPT_SYSTEM = false"
echo "   - NEXT_PUBLIC_USE_DATABASE_STYLES = false"
echo "5. 点击 Save"
echo "6. 触发重新部署:"
echo "   - 进入 Deployments 页面"
echo "   - 点击最新部署右侧的 ... 按钮"
echo "   - 选择 Redeploy"
echo "   - 等待部署完成（约2-3分钟）"
echo ""

echo "方式3: Git 回滚（终极方案）"
echo "--------------------------------------"
echo "如果环境变量回滚不够，可以回滚到上一个稳定版本："
echo ""
echo "git log --oneline -10  # 查看最近10次提交"
echo "git revert <commit-hash>  # 回滚到指定提交"
echo "git push  # 推送，Vercel 自动部署"
echo ""

echo "✅ 回滚说明已生成"
echo ""
echo "💡 提示："
echo "- 环境变量回滚最快（2-3分钟生效）"
echo "- Git 回滚最彻底（但需要新的提交）"
echo "- 回滚后，用户立即恢复到旧系统"
