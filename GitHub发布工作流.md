# 劳动法规通 - GitHub 发布工作流

## 项目结构

```
demo/
├── main.py                  # 程序入口
├── build.py                 # 打包脚本
├── 劳动法规通.spec          # PyInstaller 配置
├── .github/workflows/       # GitHub Actions 工作流
│   └── build-release.yml
├── database/                # 数据库模块
├── gui/                     # UI模块
├── utils/                   # 工具模块
├── laws_dev.db              # 数据库文件 (~50MB, 不提交到git)
└── README.md
```

---

## 第一次发布流程

### 1. 初始化仓库并推送代码

```bash
# 进入项目目录
cd /Users/joey/Desktop/demo

# 初始化git仓库
git init

# 创建 .gitignore 排除大文件
cat > .gitignore << 'EOF'
# Database files
*.db
*.sqlite
*.sqlite3

# Executable files
*.exe
*.dll
*.so
*.dylib

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
build/
dist/
*.egg-info/

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Project specific
extracted/
EOF

# 添加文件并提交
git add .
git commit -m "Initial commit"

# 推送到GitHub（假设已创建仓库）
git remote add origin https://github.com/Milton-dev-joey/Milton-dev-joey.git
git push -u origin main
```

### 2. 配置 GitHub Actions 自动打包

创建文件 `.github/workflows/build-release.yml`：

```yaml
name: Build Windows Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install pyinstaller

      - name: Build executable
        run: pyinstaller 劳动法规通.spec

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: 劳动法规通-windows
          path: dist/劳动法规通.exe

      - name: Create/Update Release
        if: startsWith(github.ref, 'refs/tags/')
        uses: softprops/action-gh-release@v1
        with:
          files: dist/劳动法规通.exe
          draft: true
          prerelease: false
          name: Release ${{ github.ref_name }}
          body: |
            ## 劳动法规通 v${{ github.ref_name }}

            ### 下载说明
            本Release包含两个文件：
            1. **劳动法规通.exe** - 主程序（已打包）
            2. **laws_dev.db** - 数据库文件（需要手动上传）

            ### 使用方法
            1. 下载 `劳动法规通.exe` 和 `laws_dev.db`
            2. 将两个文件放在同一目录
            3. 双击 `劳动法规通.exe` 运行

            ### 系统要求
            - Windows 7 或更高版本
            - 无需安装 Python

            ### 注意事项
            由于数据库文件较大 (~50MB)，未包含在自动构建中。
            维护者需要手动上传 `laws_dev.db` 到本Release。
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 3. 配置 PyInstaller

创建 `劳动法规通.spec`（注意：不包含数据库文件）：

```python
# -*- mode: python ; coding: utf-8 -*-

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[],  # 数据库不打包进exe
    hiddenimports=['database', 'gui', 'utils'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='劳动法规通',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
app = BUNDLE(
    exe,
    name='劳动法规通.app',
    icon=None,
    bundle_identifier=None,
)
```

### 4. 处理数据库路径（关键代码）

在 `gui/main_window.py` 中修改数据库初始化：

```python
def _init_database(self):
    """初始化数据库连接"""
    # 获取数据库路径（支持多个位置）
    possible_paths = []

    if getattr(sys, 'frozen', False):
        # 打包后的exe运行
        base_dir = os.path.dirname(sys.executable)
        possible_paths.append(os.path.join(base_dir, 'laws_dev.db'))
        # 也检查用户数据目录
        user_data_dir = os.path.join(os.path.expanduser('~'), '劳动法规通')
        possible_paths.append(os.path.join(user_data_dir, 'laws_dev.db'))
    else:
        # 开发环境运行
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        possible_paths.append(os.path.join(base_dir, 'laws_dev.db'))

    # 查找数据库文件
    db_path = None
    for path in possible_paths:
        if os.path.exists(path):
            db_path = path
            break

    # 如果找不到，使用第一个路径（会显示友好的错误）
    if db_path is None:
        db_path = possible_paths[0]

    try:
        return LawDatabase(db_path)
    except Exception as e:
        # 显示友好的错误提示
        self._show_db_error_dialog(db_path)
        raise SystemExit(1)

def _show_db_error_dialog(self, expected_path):
    """显示数据库缺失错误对话框"""
    error_msg = f"""找不到数据库文件！

预期路径: {expected_path}

请按以下步骤操作：
1. 从 Release 页面下载 laws_dev.db
2. 将数据库文件放在与程序相同的目录
3. 重新运行程序

点击"确定"打开下载页面。"""

    result = messagebox.showerror(
        "数据库文件缺失",
        error_msg,
        icon='error'
    )

    # 尝试打开浏览器
    try:
        import webbrowser
        webbrowser.open("https://github.com/Milton-dev-joey/Milton-dev-joey/releases")
    except:
        pass
```

### 5. 触发构建并发布

```bash
# 提交GitHub Actions配置
git add .github/workflows/build-release.yml
git commit -m "添加GitHub Actions自动打包工作流"
git push

# 创建版本标签触发构建
git tag v1.0.0
git push origin v1.0.0
```

### 6. 上传数据库文件（手动）

1. 等待 [Actions 构建](https://github.com/Milton-dev-joey/Milton-dev-joey/actions) 完成
2. 访问 [Releases 页面](https://github.com/Milton-dev-joey/Milton-dev-joey/releases)
3. 找到 `v1.0.0` Draft Release
4. 点击 **Edit** → 上传本地的 `laws_dev.db` 文件
5. 点击 **Publish Release**

---

## 后续更新流程

### 更新代码并发布新版本

```bash
# 修改代码...

# 提交更改
git add .
git commit -m "修复XXX问题"
git push

# 创建新版本标签
git tag v1.0.1
git push origin v1.0.1
```

构建完成后，重复步骤6上传数据库文件（如果数据库没有变化，可以直接复制上一个版本的文件）。

---

## 常见问题

### Q: 为什么数据库不打包进exe？
A: 数据库文件约50MB，打包后每次更新都要重新下载整个文件。分离后用户只需更新程序 (~10MB)。

### Q: 用户如何知道需要下载数据库？
A: 程序已添加友好提示，如果缺少数据库会弹出对话框并跳转到下载页面。

### Q: 如何测试打包结果？
A: 在Windows电脑上：
```bash
pip install pyinstaller
pyinstaller 劳动法规通.spec
# 测试运行
dist/劳动法规通.exe
```

### Q: 如何更新数据库？
A: 只需在Release页面上传新的 `laws_dev.db` 文件，覆盖旧版本即可。

---

## Release 页面最终文件清单

| 文件 | 来源 | 说明 |
|------|------|------|
| `劳动法规通.exe` | GitHub Actions 自动构建 | 主程序 |
| `laws_dev.db` | 手动上传 | 数据库文件 (~50MB) |

**用户使用方式**：下载两个文件，放在同一文件夹，双击exe运行。
