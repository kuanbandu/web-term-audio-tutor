# 术语朗读卡 · web-term-audio-tutor

**在线使用：<https://kuanbandu.github.io/web-term-audio-tutor/>**

手机优先的「网页术语 → 学习卡 → TTS 朗读」小工具。输入一个网页地址（或直接粘贴正文），自动提取专业英文术语，生成带中文释义和例句的卡片，用手机自带语音朗读。

适合 PortSwigger Web Security Academy、渗透测试文档、英文技术博客等场景。交互取向参考 Read Frog 的轻量阅读学习体验：打开即用，不装扩展、不依赖后端。

## 功能

- **输入网址即抓正文**：通过公共阅读代理 `r.jina.ai` 抓取，零后端。
- **手动粘贴兜底**：需要登录、被反爬或代理限流时，直接粘贴正文。
- **LLM 提取术语**：兼容 OpenAI 格式，默认 DeepSeek。输出 `term / 中文释义 / 英文例句 / 标签`。
- **无 Key 也能用**：内置约 100 条 PortSwigger / 渗透测试词表，零配置先跑通。
- **两种朗读模式**：
  - 单词卡：英文术语 → 中文释义 → 英文例句
  - 问答：英文术语 → 停顿 → 中文释义（适合通勤自测）
- **循环播放、语速调节、英文音色选择、单卡点读**。
- **生词本**：本地保存，可再次朗读、删除、导出。
- **导出**：JSON / Anki CSV。
- **数据全在本机**：设置、生词本、上次结果都存在浏览器 `localStorage`。

## 手机使用三步

1. 打开部署好的网址（或本地起的页面）。
2. 第一次进「设置」：填 DeepSeek API Key（也可以先不填，用内置词表模式），保存。
3. 回「学习」页：粘贴网址 → 抓取 → 提取术语 → 点「▶ 朗读」。

> iPhone 首次朗读必须由你点一下按钮触发，这是 Safari 的系统限制。声音小就检查侧边静音键和媒体音量。
>
> 想更像 App：Safari 点「分享 → 添加到主屏幕」；Android Chrome 点菜单「添加到主屏幕」。

## 本地运行

### 方式 A：零构建（最简单）

```bash
cd web-term-audio-tutor
python3 -m http.server 8080
```

浏览器打开 `http://localhost:8080`。

> 不能直接双击 `index.html`，因为 ES Module 需要 HTTP 环境。

### 方式 B：Vite 开发

```bash
npm install
npm run dev
```

手机和电脑在同一 Wi-Fi 时，用 Vite 输出的局域网地址访问即可。

### 构建

```bash
npm run build
npm run preview
```

产物在 `dist/`。`vite.config.js` 已设置 `base: './'`，可部署到任意子路径。

## 部署到 GitHub Pages

### 方式 A：直接部署仓库根目录（推荐，零构建）

1. 把仓库推到 GitHub。
2. 仓库 **Settings → Pages**。
3. **Source** 选 `Deploy from a branch`。
4. **Branch** 选 `main`，目录选 `/ (root)`，保存。
5. 等一两分钟，访问 `https://<用户名>.github.io/<仓库名>/`。

这种方式直接使用根目录的 `index.html` 和 `src/`，不需要构建。

### 方式 B：GitHub Actions 自动构建

仓库已带 `.github/workflows/deploy.yml`：

1. 推到 `main`。
2. **Settings → Pages → Source** 选 `GitHub Actions`。
3. 之后每次推送都会自动构建并发布 `dist/`。

## 配置 DeepSeek

1. 到 <https://platform.deepseek.com/> 注册并创建 API Key。
2. 在工具「设置」里填：
   - **Base URL**：`https://api.deepseek.com`
   - **API Key**：`sk-...`
   - **模型**：`deepseek-chat`
3. 点「测试连接」，成功即可。

也支持任意 OpenAI 兼容接口，例如：

```text
Base URL: https://api.openai.com/v1
模型: gpt-4o-mini
```

Base URL 填到 `/v1` 即可，不要带 `/chat/completions`（工具会自动处理）。

### 无 Key 模式

不填 Key 时会调用内置词表：优先匹配 PortSwigger 常见漏洞、工具、协议名称，再补充正文中的大写缩写和高频词。

- 优点：零成本、立刻能用、不联网调 LLM。
- 缺点：释义是固定的，例句可能不够贴切；非安全领域的页面效果一般。

## 抓取原理与限制

```text
网址 → https://r.jina.ai/<url> → 清洗 Markdown → 正文
```

- 这是第三方公共服务，可能被限流（HTTP 429）、需要排队，或抓不到登录后页面。
- 抓取失败时，页面会自动展开「直接粘贴正文」。在电脑上 `Ctrl+A` 复制 PortSwigger 页面正文即可。
- 浏览器直连 LLM 接口需要对方允许 CORS。若你换的接口在浏览器里报「无法连接」，说明它不允许跨域，需自建代理或换支持 CORS 的接口。

## 朗读说明

- 使用浏览器内置 `SpeechSynthesis`，免费、无需额外服务。
- 「问答」模式的停顿时长可在设置页调（1 / 1.5 / 2 / 3 秒）。
- 英文音色来自手机系统。iOS 可在「设置 → 辅助功能 → 朗读内容 → 声音」下载更多音色。
- 中文释义默认用系统中文音色；没有中文音色时会用默认音色读中文。
- 如果某个音色没声音，切回「自动（推荐）」再试。

## 生词本与导出

- 学习页点卡片右上角 `☆` 加入生词本；生词本里点 `★` 移出。
- 生词本和上次学习结果只保存在当前浏览器，不会同步到云端。
- **导出 JSON**：字段为 `term / zh / example / tag`。
- **导出 Anki CSV**：逗号分隔，四列依次为术语、释义、例句、标签。

在 Anki 里：`文件 → 导入`，选择 CSV，字段分隔符选「逗号」，把第 1 列映射到正面、第 2 列映射到背面，第 3/4 列可选。导入前建议先备份牌组。

## 目录结构

```text
web-term-audio-tutor/
├── index.html                 # 页面骨架（学习 / 生词本 / 设置）
├── src/
│   ├── main.js                # UI、状态、播放流程
│   ├── style.css              # 移动优先样式（自动深色模式）
│   ├── fetchArticle.js        # r.jina.ai 抓取 + Markdown 清洗
│   ├── extractTerms.js        # LLM 调用、JSON 容错、测试连接
│   ├── ruleExtract.js         # 无 Key 规则提取
│   ├── glossary.js            # 内置安全术语词表
│   ├── speak.js               # SpeechSynthesis 封装、队列与停止
│   ├── store.js               # localStorage 设置 / 生词本 / 上次结果
│   └── exporters.js           # JSON / Anki CSV / 下载
├── vite.config.js
├── package.json
└── .github/workflows/deploy.yml
```

## 自定义

- **加词表**：编辑 `src/glossary.js`，按 `{ term, zh, tag }` 追加。注意 `term` 用英文原词。
- **改提取提示词**：编辑 `src/extractTerms.js` 里的 `SYSTEM_PROMPT`。
- **改默认模型**：编辑 `src/extractTerms.js` 的 `DEFAULT_MODEL`，或直接在设置页改。
- **换抓取服务**：编辑 `src/fetchArticle.js` 的 `JINA_READER`，保持返回 `{ title, text, url }`。

## 隐私提醒

- API Key 以明文存在本机 `localStorage`，任何能执行该页面脚本的人都能读到。不要在公共电脑上保存 Key。
- 正文只会发送到你配置的 LLM 接口和 `r.jina.ai` 抓取服务。
- 生词本、设置、上次结果都可用「设置 → 清除本地数据」一键删除。

## 常见问题

**抓取提示 429 / 超时？**
公共代理限流。等几分钟，或直接粘贴正文。长期用建议自建一个简单的抓取后端。

**LLM 报 401 / 402 / 404？**
分别检查 Key、余额、Base URL 和模型名。Base URL 不要填到 `/chat/completions`。

**手机点朗读没声音？**
先点一下页面任意按钮解锁音频；检查静音键、媒体音量；iOS 换「自动」音色；确认没开省电模式限制。

**提取出来很多普通单词？**
无 Key 模式的局限。配置 LLM 后会好很多；也可以在提示词里加更严格的领域限制。
