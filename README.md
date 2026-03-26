# 劳动法规通

本地劳动法规检索工具，支持关键词搜索、筛选和收藏功能。

## 项目结构

```
.
├── main.py              # 桌面应用入口
├── 劳动法规通.spec      # PyInstaller 配置
├── requirements.txt     # Python依赖
├── web/                 # Web界面
│   ├── index.html       # 主页面
│   ├── app.js           # 搜索逻辑
│   ├── style.css        # 样式
│   ├── sql-wasm.js      # SQLite WASM
│   └── sql-wasm.wasm    # SQLite WASM二进制
├── laws_dev.db          # 数据库文件 (~50MB，不提交到git)
└── .github/workflows/   # GitHub Actions 工作流
    └── build-release.yml
```

## 开发环境运行

```bash
# 安装依赖
pip install -r requirements.txt

# 运行桌面应用
python main.py
```

## 打包 Windows 应用

```bash
# 安装 pyinstaller
pip install pyinstaller

# 打包
pyinstaller 劳动法规通.spec

# 输出在 dist/劳动法规通.exe
```

## 发布流程

1. 推送代码到 GitHub
2. 创建版本标签触发自动构建：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions 自动构建 `劳动法规通.exe`
4. 在 Release 页面手动上传 `laws_dev.db` 数据库文件

## Release 文件说明

| 文件 | 说明 |
|------|------|
| `劳动法规通.exe` | Windows桌面应用（GitHub Actions自动构建） |
| `laws_dev.db` | 数据库文件（手动上传） |

## 使用方法

1. 从 Release 页面下载 `劳动法规通.exe` 和 `laws_dev.db`
2. 将两个文件放在同一目录
3. 双击 `劳动法规通.exe` 运行

## 功能特性

- 关键词搜索 + 同义词扩展
- 筛选：法规类型、地区、时间范围
- 收藏功能（数据保存在浏览器本地存储中）
- 搜索结果高亮显示

## 系统要求

- Windows 10 或更高版本
- 需要 WebView2 运行时（Windows 10/11 通常已预装）
