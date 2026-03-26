#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
劳动法规通 - Windows桌面应用
使用PyWebView包装Web界面
"""

import os
import sys
import json
import threading
import webview
from http.server import HTTPServer, SimpleHTTPRequestHandler

# 全局变量
httpd = None
server_thread = None


def get_resource_path(relative_path):
    """获取资源路径（支持打包后的exe）"""
    if getattr(sys, 'frozen', False):
        # 打包后的exe运行
        base_path = os.path.dirname(sys.executable)
    else:
        # 开发环境运行
        base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)


def get_db_path():
    """获取数据库文件路径"""
    possible_paths = [
        get_resource_path('laws_dev.db'),
        os.path.join(os.path.expanduser('~'), '劳动法规通', 'laws_dev.db'),
    ]

    for path in possible_paths:
        if os.path.exists(path):
            return path
    return possible_paths[0]


class CustomHandler(SimpleHTTPRequestHandler):
    """自定义HTTP处理器，支持从打包目录提供文件"""

    web_root = None  # 类变量

    def __init__(self, *args, **kwargs):
        if CustomHandler.web_root is None:
            CustomHandler.web_root = get_resource_path('web')
        super().__init__(*args, directory=CustomHandler.web_root, **kwargs)

    def translate_path(self, path):
        """重写路径转换，正确处理根路径"""
        # 调用父类的 translate_path
        path = super().translate_path(path)
        # 如果路径是目录，添加 index.html
        if os.path.isdir(path):
            path = os.path.join(path, 'index.html')
        return path

    def guess_type(self, path):
        """重写MIME类型猜测，添加wasm支持"""
        if path.endswith('.wasm'):
            return 'application/wasm'
        return super().guess_type(path)

    def do_GET(self):
        # 处理数据库文件请求
        if self.path == '/laws_dev.db':
            db_path = get_db_path()
            if os.path.exists(db_path):
                self.send_response(200)
                self.send_header('Content-Type', 'application/x-sqlite3')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                with open(db_path, 'rb') as f:
                    self.wfile.write(f.read())
                return
            else:
                self.send_response(404)
                self.end_headers()
                return

        # 处理根路径
        if self.path == '/' or self.path == '/index.html':
            index_path = os.path.join(self.directory, 'index.html')
            if os.path.exists(index_path):
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                with open(index_path, 'rb') as f:
                    self.wfile.write(f.read())
                return
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(b'404 - index.html not found')
                return

        # 默认处理静态文件
        try:
            super().do_GET()
        except Exception as e:
            # 如果出错，返回404
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(f'404 - {self.path} not found'.encode())

    def log_message(self, format, *args):
        # 静默HTTP日志
        pass


def start_server(port=0):
    """启动HTTP服务器，返回实际端口"""
    global httpd
    httpd = HTTPServer(('127.0.0.1', port), CustomHandler)
    actual_port = httpd.server_address[1]

    def serve():
        httpd.serve_forever()

    global server_thread
    server_thread = threading.Thread(target=serve, daemon=True)
    server_thread.start()
    return actual_port


def check_database():
    """检查数据库文件是否存在"""
    db_path = get_db_path()
    if not os.path.exists(db_path):
        return False, db_path
    return True, db_path


def show_error_window(expected_path):
    """显示数据库缺失错误窗口"""
    error_html = f'''
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>数据库文件缺失 - 劳动法规通</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }}
            .error-card {{
                background: white;
                border-radius: 16px;
                padding: 40px;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }}
            .error-icon {{
                width: 64px;
                height: 64px;
                background: #fee2e2;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 24px;
            }}
            .error-icon svg {{
                width: 32px;
                height: 32px;
                color: #dc2626;
            }}
            h1 {{
                font-size: 24px;
                color: #1f2937;
                text-align: center;
                margin-bottom: 16px;
            }}
            .steps {{
                background: #f9fafb;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            }}
            .steps ol {{
                margin-left: 20px;
                color: #4b5563;
                line-height: 1.8;
            }}
            .steps li {{
                margin-bottom: 8px;
            }}
            .path {{
                background: #e5e7eb;
                padding: 8px 12px;
                border-radius: 6px;
                font-family: monospace;
                font-size: 12px;
                color: #374151;
                word-break: break-all;
                margin-top: 16px;
            }}
            .btn {{
                display: block;
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                text-decoration: none;
                text-align: center;
                margin-top: 20px;
            }}
            .btn:hover {{
                opacity: 0.9;
            }}
        </style>
    </head>
    <body>
        <div class="error-card">
            <div class="error-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
            </div>
            <h1>找不到数据库文件</h1>
            <div class="steps">
                <p style="color: #6b7280; margin-bottom: 12px;">请按以下步骤操作：</p>
                <ol>
                    <li>从 GitHub Release 页面下载 <code>laws_dev.db</code></li>
                    <li>将数据库文件放在与程序相同的目录</li>
                    <li>重新运行程序</li>
                </ol>
            </div>
            <p style="color: #6b7280; font-size: 14px;">预期路径：</p>
            <div class="path">{expected_path}</div>
            <button class="btn" onclick="openRelease()">打开下载页面</button>
        </div>
        <script>
            function openRelease() {{
                window.location.href = 'https://github.com/Milton-dev-joey/labor-law-search/releases';
            }}
        </script>
    </body>
    </html>
    '''
    return error_html


def main():
    """主函数"""
    # 检查web文件夹是否存在
    web_root = get_resource_path('web')
    if not os.path.exists(web_root):
        print(f"错误: 找不到web文件夹: {web_root}")
        sys.exit(1)

    index_path = os.path.join(web_root, 'index.html')
    if not os.path.exists(index_path):
        print(f"错误: 找不到index.html: {index_path}")
        sys.exit(1)

    # 检查数据库
    db_exists, db_path = check_database()

    # 启动HTTP服务器
    port = start_server()
    url = f'http://127.0.0.1:{port}/'
    print(f"HTTP服务器已启动: {url}")
    print(f"Web根目录: {web_root}")
    print(f"数据库路径: {db_path}")
    print(f"数据库存在: {db_exists}")

    # 创建窗口
    if db_exists:
        # 正常启动
        window = webview.create_window(
            title='劳动法规通',
            url=url,
            width=1400,
            height=900,
            min_size=(1000, 600),
            text_select=True
        )
    else:
        # 显示错误页面
        error_html = show_error_window(db_path)
        window = webview.create_window(
            title='劳动法规通 - 数据库缺失',
            html=error_html,
            width=600,
            height=500,
            resizable=False
        )

    # 启动应用
    webview.start(debug=False)


if __name__ == '__main__':
    main()
