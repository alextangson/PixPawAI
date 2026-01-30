# PixPawAI - Docker 测试/运行（字体已打包在 public/fonts，容器内无需系统字体）
FROM node:20-alpine

WORKDIR /app

# 依赖
COPY package.json package-lock.json ./
RUN npm ci

# 源码（含 public/fonts 字体文件）
COPY . .

# 开发模式：直接跑 dev（适合本地测试 Art Card）
EXPOSE 3000
CMD ["npm", "run", "dev"]

# 生产模式构建可改为：
# RUN npm run build && npm start
