劳动法规检索库 - Mac 版使用说明
========================================

【快速开始】

1. 双击 "启动.command"
2. 浏览器会自动打开 http://localhost:8080
3. 开始搜索法规

【系统要求】

- macOS 10.14 或更高版本
- 已安装 Python3（macOS 12+ 默认已安装）

【手动启动（备用方法）】

如果启动脚本无法工作：

1. 打开终端
2. 进入 web 文件夹:
   cd web
3. 启动服务器:
   python3 -m http.server 8080
4. 浏览器访问: http://localhost:8080

【文件说明】

- laws_dev.db       数据库文件 (50MB)
- web/              网页版程序
  - index.html      主页面
  - app.js          搜索逻辑
  - style.css       样式文件

【功能特性】

- 关键词搜索 + 同义词扩展
- 筛选：法规类型、地区、时间范围
- 收藏功能（数据保存在浏览器中）
- 结果高亮显示

【注意事项】

- 请勿删除或移动 laws_dev.db 文件
- 收藏数据保存在浏览器 localStorage 中
- 建议使用 Chrome、Edge 或 Safari 浏览器

【技术支持】

如有问题，请访问:
https://github.com/Milton-dev-joey/labor-law-search
