# NBA洞察者（轻量玩具版）

这是一个适合新手的 MVP：

- 首页：展示今日赛程和实时比分
- 球员页：展示赛季均值、最近 5 场、偏见提醒
- 预测验证页：保存你的预测，并和真实比赛结果对比
- 数据源：ESPN 公开 JSON 接口
- 存储：Supabase
- 部署：Vercel

这个版本的目标不是“很专业”，而是“你能尽快上线一个真的能用的小网站”。

## 1. 你已经拿到的文件

- `public/index.html`：首页
- `public/player.html`：球员分析页
- `public/predictions.html`：预测验证页
- `api/scoreboard.js`：今日赛程接口
- `api/player.js`：球员分析接口
- `api/predictions.js`：预测保存与验证接口
- `supabase-init.sql`：数据库初始化 SQL

## 2. 先理解一个最重要的事实

为了省事，这个玩具版没有用复杂框架，也没有用户登录。

好处：

- 更容易看懂
- 更容易部署
- 出问题更容易排查

代价：

- 页面没有 React 那么高级
- 球员搜索目前建议先手动输入 ESPN 球员 id
- 不带账号系统

## 3. 第一步：创建 Supabase

1. 打开 [Supabase 官网](https://supabase.com/)
2. 点击 `Start your project`
3. 用 GitHub 登录
4. 点击 `New project`
5. Project Name 填：`nba-insight-lite`
6. Database Password：自己设一个密码并保存
7. Region：选离你近的
8. 点击 `Create new project`

等数据库创建完成后：

1. 左侧点击 `SQL Editor`
2. 点击 `New query`
3. 打开本项目里的 `supabase-init.sql`
4. 全选复制进去
5. 点击 `Run`

## 4. 第二步：拿 Supabase 两个关键信息

创建好项目后：

1. 左侧点击 `Project Settings`
2. 点击 `Data API`
3. 找到 `Project URL`
4. 找到 `service_role` key

你需要保存这两个值：

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

注意：

- `service_role` 很敏感，只能放到 Vercel 环境变量里，不要公开发给别人

## 5. 第三步：上传到 GitHub

如果你电脑还没装 Git，也没关系，你可以：

1. 去 [GitHub](https://github.com/) 新建一个仓库
2. 仓库名可以叫 `nba-insight-lite`
3. 然后把当前文件夹压缩备份
4. 或者后续我再继续帮你补“最傻瓜式上传 GitHub”步骤

## 6. 第四步：部署到 Vercel

1. 打开 [Vercel](https://vercel.com/)
2. 用 GitHub 登录
3. 点击 `Add New...`
4. 选择 `Project`
5. 选择你的 GitHub 仓库
6. 直接点击 `Deploy`

部署前或部署后，记得补环境变量：

1. 进入项目设置页
2. 点击 `Environment Variables`
3. 新增：
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. 保存后重新部署

## 7. 第五步：如何使用

### 首页

- 打开网站首页
- 它会自动加载 ESPN 今日赛程
- 每 5 分钟自动刷新

### 球员页

1. 打开 `/player`
2. 输入球员 ESPN id
3. 点击“加载球员数据”

示例：

- `4251`：Paul George

页面会显示：

- 赛季场均得分、篮板、助攻
- 最近 5 场
- 偏见提醒
- 如果最近数据和赛季平均差太多，会出现红色提示

### 预测验证页

1. 打开 `/predictions`
2. 输入比赛 id
3. 输入球员 id
4. 选择预测项目
5. 输入预测值
6. 点击“保存预测”
7. 比赛结束后点击“验证这条预测”

系统会：

- 调 ESPN 实时比赛摘要
- 找到这个球员本场真实数据
- 算出一个简化版准确率

## 8. 你最可能会卡住的地方

### 卡点 1：不知道比赛 id

解决方法：

- 先去首页
- 每场比赛卡片下面都有比赛 id

### 卡点 2：不知道球员 id

当前轻量版建议先手动试几个已知 id。

如果你下一步想要，我可以继续帮你加：

- 球员名字搜索框
- 自动补全建议

### 卡点 3：预测页提示没配置 Supabase

这说明你还没在 Vercel 里填环境变量。

回到：

- `Vercel Project`
- `Settings`
- `Environment Variables`

补上两个值后重新部署。

## 9. 后续最值得升级的 3 个功能

如果你要继续做第二版，我建议按这个顺序升级：

1. 加球员名字搜索，不再手填 id
2. 加简单登录，只保存你自己的预测
3. 加每天定时抓取，把历史球员数据真正落到数据库

## 10. 截图指引该怎么做

你这次要求“截图指引”，但我现在不能直接替你操作浏览器截图。

最省 token 的做法是：

1. 你先按 README 做到某一步
2. 截图发我
3. 我会直接在你的截图上告诉你“点哪里、填什么”

这样最适合新手，也最省来回折腾。

## 11. 如果你现在就想继续

你下一句只要回复下面任意一句都行：

- “继续教我部署 Supabase”
- “继续教我上传 GitHub”
- “给我加球员搜索框”
- “给我加登录功能”
