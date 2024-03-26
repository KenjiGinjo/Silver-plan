```bash
# 系统：Ubuntu 22.04 x86_64
# 连接服务器 qDrlYPO1LQTv
ssh root@212.50.255.206 -p 28987

# 更新你的包列表
sudo apt update

#  安装git
sudo apt update
sudo apt install git
git --version

# 更新你的包列表
sudo apt update
# 安装 ffmpeg
sudo apt install ffmpeg
# 检查 ffmpeg 的安装版本
ffmpeg -version

# 安装 Nginx-RTMP
# Nginx-RTMP 是一个 Nginx 模块，用于支持 RTMP 和 HLS 流媒体协议。因为它是一个第三方模块，所以需要重新编译 Nginx 来添加此模块。
# 1. 安装编译所需的依赖：
sudo apt install build-essential libpcre3 libpcre3-dev libssl-dev zlib1g-dev
# 2.  下载 Nginx 和 Nginx-RTMP 模块源码：
wget http://nginx.org/download/nginx-1.24.0.tar.gz
tar -zxvf nginx-1.24.0.tar.gz
git clone https://github.com/arut/nginx-rtmp-module.git
# 3. 编译 Nginx 与 Nginx-RTMP 模块：
cd nginx-1.24.0
# ./configure --with-http_ssl_module --add-module=../nginx-rtmp-module
./configure --add-module=../nginx-rtmp-module
make
sudo make install

# 重启 Nginx：
# 由于你是从源代码编译安装的 Nginx，可能需要直接调用其安装路径来启动。通常情况下，可以通过以下命令启动 Nginx：

sudo /usr/local/nginx/sbin/nginx
# 如果需要重启 Nginx，可以先停止再启动：
sudo /usr/local/nginx/sbin/nginx -s stop
sudo /usr/local/nginx/sbin/nginx

# 自动启动 Nginx
# 为了使 Nginx 在系统启动时自动运行，你可能需要创建一个 systemd 服务文件。创建一个名为 /etc/systemd/system/nginx.service 的文件，并填充以下内容：
[Unit]
Description=Nginx - high performance web server
Documentation=http://nginx.org/en/docs/
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/nginx/sbin/nginx
ExecReload=/usr/local/nginx/sbin/nginx -s reload
ExecStop=/usr/local/nginx/sbin/nginx -s quit

[Install]
WantedBy=multi-user.target

# 之后，启用并启动服务：
sudo systemctl enable nginx
sudo systemctl start nginx

# 5. 配置防火墙
# 如果你的服务器运行的是 UFW 防火墙，确保开放 HTTP（端口 80）和 HTTPS（端口 443）：
sudo ufw allow 'Nginx Full'

# 配置 Nginx-RTMP
# 配置 Nginx 以使用 RTMP 模块，并设置 RTMP 监听端口以及应用程序。
# 编辑 Nginx 配置文件：

# 打开 /usr/local/nginx/conf/nginx.conf 文件进行编辑。

# 在文件的末尾添加 RTMP 配置块：

# rtmp {
#     server {
#         listen 1935; # RTMP 监听端口
#         chunk_size 4096;

#         application live {
#             live on;
#             record off;
#         }
#     }
# }
# 这个配置定义了一个 RTMP 服务器，监听 1935 端口，并设置了一个名为 "live" 的应用程序，用于处理实时视频流。


# 验证安装
# Node.js：验证 Node.js 安装成功，运行 node -v，它应该显示安装的 Node.js 版本。
# Nginx：访问你服务器的公网 IP 地址或域名，你应该能看到 Nginx 的默认欢迎页面。
# RTMP：使用 RTMP 流测试你的配置。你可以使用 OBS Studio 或其他流媒体工具，配置推流地址为 rtmp://your_server_ip/live，流密钥可以设置为任意值

# 安装 Node.js
# 1. 添加 Node.js PPA
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
# 2. 安装 Node.js：
sudo apt-get install -y nodejs

```

然后，你可以使用 Node.js 调用 ffmpeg 来转码文件。这里是一个简单的 Node.js 脚本示例：
const { exec } = require('child_process');

// 假设你的 MP3 文件位于 /path/to/your/file.mp3
const inputPath = '/path/to/your/file.mp3';
const outputPath = '/mnt/hls/file.m3u8'; // 输出的 HLS 播放列表

// 使用 ffmpeg 将 MP3 转码为 HLS 格式
const ffmpegCommand = `ffmpeg -i ${inputPath} -codec:a aac -b:a 128k -f hls -hls_time 4 -hls_playlist_type event ${outputPath}`;

exec(ffmpegCommand, (error, stdout, stderr) => {
if (error) {
console.error(`转码出错: ${error}`);
return;
}
console.log(`转码完成: ${stdout}`);
});

ffmpeg -i /Users/kenjiginjo/Downloads/1.mp3 -codec:a aac -b:a 128k -f hls -hls_time 4 -hls_playlist_type event /Users/kenjiginjo/Downloads/file.m3u8
