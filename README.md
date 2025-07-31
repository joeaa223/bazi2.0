# BaZi 八字命理系统

## 部署到 Vercel

### 1. 环境变量设置
在 Vercel 项目设置中添加以下环境变量：
- `GEMINI_API_KEY`: 你的 Google Gemini API 密钥

### 2. 部署步骤
1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 确保环境变量已设置
4. 部署

### 3. 验证部署
- 访问根路径 `/` 应该显示 form2.html
- 访问 `/test` 应该返回服务器状态
- 访问 `/form` 应该显示 form.html

### 4. 故障排除
如果遇到 404 错误：
1. 检查 `package.json` 中的入口文件是否为 `fullServer.js`
2. 确保 `vercel.json` 配置正确
3. 检查环境变量是否已设置
4. 查看 Vercel 部署日志

## 本地开发
```bash
npm install
npm start
```

访问 http://localhost:3010 