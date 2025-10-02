# Surge Conf Secure Host (Upstash)

部署在 Vercel 的安全托管器，用于 Surge 配置文件。使用 **Upstash Redis** 存储。

## 功能
- URL Token + 密码双重保护
- Upstash Redis 存储单文件 surge.conf
- 版本管理（保留最近 5 个，可回滚）
- 强制下载直链

## 部署步骤（GitHub + Vercel + Upstash）
1. 将本仓库推到 GitHub（建议私有）并在 Vercel 导入项目
2. 在 Vercel → Marketplace 安装 **Upstash Redis**，绑定当前项目
3. 在 Vercel 项目 Settings → Environment Variables 添加：
   - `APP_PASSWORD`：你的密码
   - `URL_TOKEN`：使用 `openssl rand -hex 16` 生成
   - （Upstash 安装后会自动注入）`UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN`
4. 部署完成后：
   - 登录页：`https://<域名>/<URL_TOKEN>`
   - 下载直链（强制下载，仅需 URL token）：`https://<域名>/<URL_TOKEN>/api/raw`

## 本地开发（可选）
- 使用 `vercel dev` 或在 `.env.local` 填写 Upstash 的 REST 变量

## 安全建议
- `URL_TOKEN` 定期轮换；密码定期更换
- Vercel 项目设置里限制可见性与日志访问
