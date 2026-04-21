NBA Insight (Lite)

一个轻量级 NBA 数据工具，展示今日赛程、球员数据，并支持预测验证。

功能

· 首页：今日赛程 + 实时比分（每 5 分钟自动刷新）
· 球员页：赛季场均数据、最近 5 场表现、偏见提醒（与赛季均值差异）
· 预测验证页：保存预测，赛后自动对比真实结果

技术栈

· 前端：原生 HTML/JS
· 数据接口：ESPN 公开 JSON
· 存储：Supabase
· 部署：Vercel

文件结构

```
public/
  index.html          # 首页
  player.html         # 球员页
  predictions.html    # 预测验证页
api/
  scoreboard.js       # 赛程接口
  player.js           # 球员数据接口
  predictions.js      # 预测保存与验证接口
supabase-init.sql     # 数据库初始化脚本
```

部署步骤

1. 创建 Supabase 项目

· 登录 Supabase
· 新建项目，记录数据库密码
· 执行 supabase-init.sql 中的 SQL（通过 SQL Editor）

2. 获取环境变量

在 Supabase 项目设置 → Data API 中获取：

· SUPABASE_URL
· SUPABASE_SERVICE_ROLE_KEY

3. 上传代码到 GitHub

将代码推送到一个公开或私有仓库。

4. 部署到 Vercel

· 登录 Vercel
· 导入该 GitHub 仓库
· 在项目设置中添加环境变量：
  · SUPABASE_URL
  · SUPABASE_SERVICE_ROLE_KEY
· 重新部署

使用说明

首页

打开网站自动显示当日赛程，赛程卡片下方包含比赛 ID（用于预测页）。

球员页

访问 /player，输入 ESPN 球员 ID。
示例 ID：4251 → Paul George

预测验证页

访问 /predictions，需要提供：

· 比赛 ID（从首页获取）
· 球员 ID
· 预测项目（得分/篮板/助攻）
· 预测数值

保存后，待比赛结束点击“验证”，系统将从 ESPN 拉取真实数据并比对。

已知限制（当前版本）

· 球员搜索需手动输入 ESPN ID（后续可升级为名字搜索）
· 无用户登录系统，预测为全局共享
· 数据仅依赖 ESPN 公开接口，无本地历史存储

后续可升级方向

· 球员名字自动补全搜索
· 简单用户登录（仅保存自己的预测）
· 定时抓取并存储历史数据
