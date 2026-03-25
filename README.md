# 劳动法规通 - 本地劳动法检索工具

一个基于 Electron 的本地劳动法规检索桌面应用，支持 Windows 单文件免安装运行。

## 功能特性

- **全文检索** — 搜索 415 部法规、19,159 条法条
- **同义词扩展** — 输入"炒鱿鱼"自动扩展为"解除劳动合同"等法律术语
- **结果高亮** — 关键词自动高亮显示
- **展开/折叠** — 按法律分组，点击展开具体条文
- **快速响应** — 全内存检索，10-36ms 返回结果

## 快速开始

### 开发运行

```bash
npm install
# 将数据库文件 laws_dev.db 放到上级目录的 劳动法规通(1)/ 文件夹中
npm start
```

### 打包 Windows 单文件 exe

```bash
npm run build:win
# 输出文件：dist/劳动法规通.exe
```

## 数据库

应用使用 SQLite 数据库 `laws_dev.db`（50MB），需自行提供，放置于：
```
../劳动法规通(1)/laws_dev.db
```

打包时会自动将数据库打包进可执行文件。

## 技术栈

- [Electron](https://electronjs.org/) — 跨平台桌面框架
- [sql.js-fts5](https://www.npmjs.com/package/sql.js-fts5) — 纯 JS SQLite（含 FTS5 支持）
- 原生 HTML / CSS / JavaScript — 无框架依赖

## 项目结构

```
├── main.js          # 主进程：数据库加载 + 搜索逻辑
├── preload.js       # 安全 IPC 桥接
├── renderer/
│   ├── index.html   # 页面结构
│   ├── style.css    # 浅色简洁风 UI
│   └── app.js       # 前端交互逻辑
└── package.json
```
