#!/bin/bash
cd "$(dirname "$0")/web"
echo "============================================"
echo "    劳动法规检索库 - 启动服务器"
echo "============================================"
echo ""

# 检查 Python3 是否安装
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 Python3"
    echo "请安装 Python3: https://www.python.org/downloads/"
    read -n 1 -s -r -p "按任意键退出..."
    exit 1
fi

# 查找可用端口
PORT=8080
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

echo "正在启动服务器，请稍候..."
python3 -m http.server $PORT >/dev/null 2>&1 &
SERVER_PID=$!
sleep 2

# 检查服务器是否成功启动
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "错误: 服务器启动失败"
    read -n 1 -s -r -p "按任意键退出..."
    exit 1
fi

open "http://localhost:$PORT"
echo ""
echo "✓ 服务器已启动 (PID: $SERVER_PID, 端口: $PORT)"
echo "✓ 浏览器已自动打开"
echo ""
echo "提示: 关闭此窗口将停止服务器"
echo ""
read -n 1 -s -r -p "按任意键关闭服务器..."
echo ""
echo "正在关闭服务器..."
kill $SERVER_PID 2>/dev/null
echo "✓ 服务器已关闭"
