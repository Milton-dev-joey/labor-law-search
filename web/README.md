# 劳动法规通 Web 版

纯静态网页版，无需服务器，浏览器直接打开即可使用。

## 快速开始

### 方式一：本地服务器（推荐，兼容所有浏览器）

```bash
cd web
python -m http.server 8080
# 浏览器访问 http://localhost:8080
```

服务器方式下，数据库需要放在 `web/` 的**上一级目录**（即 `../laws_dev.db`）。

---

### 方式二：双击打开（有限制）

由于浏览器安全限制，**直接双击 `index.html` 可能无法加载数据库**。

#### 要求：
- ✅ Chrome、Edge、Opera（支持 File System Access API）
- ❌ Safari、Firefox（请使用服务器方式）

#### 目录结构：
```
📁 labor-law-search/
├── 📁 web/              # 本文件夹
│   ├── index.html      # 双击打开
│   ├── app.js
│   ├── style.css
│   └── sql-wasm.*
└── 📄 laws_dev.db       # 数据库文件（放在 web/ 同级）
```

#### 如果双击无法加载：

**方法 1：启动本地服务器（推荐）**
```bash
cd web
python -m http.server 8080
```

**方法 2：修改 Chrome/Edge 启动参数**
1. 右键 Chrome 快捷方式 → "属性"
2. 在 "目标" 末尾添加：`--allow-file-access-from-files`
3. 重启浏览器，再双击打开 `index.html`

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 主页面 |
| `app.js` | 搜索逻辑 + 筛选 + 收藏功能 |
| `style.css` | 样式 |
| `sql-wasm.js` / `sql-wasm.wasm` | SQLite 引擎（浏览器版）|

---

## 功能特性

- ✓ 关键词搜索 + 同义词扩展
- ✓ 多维度筛选（法规类型、地区、时间）
- ✓ 收藏功能（localStorage 本地保存）
- ✓ 结果高亮
- ✓ 卡片展开/折叠
