# 安装指南

## 系统要求

- **操作系统**: macOS, Linux, 或 Windows
- **运行时**: [Bun](https://bun.sh/) 或 Node.js 18+
- **浏览器**: Google Chrome 或 Chromium

## 安装步骤

### 1. 安装 Bun（推荐）

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Windows (需要 WSL)
# 或使用 npm: npm install -g bun
```

### 2. 安装 Chrome

确保系统中已安装 Google Chrome。如果没有，可以从以下地址下载：
- https://www.google.com/chrome/

也可以使用环境变量指定 Chrome 路径：
```bash
export WEIBO_BROWSER_CHROME_PATH="/path/to/chrome"
```

### 3. 获取 Skill

#### 方式 A: 使用在线生成器

1. 访问 https://liubin1.github.io/weibo-autopilot-generator/
2. 填写配置
3. 点击"下载定制 Skill"
4. 解压下载的 ZIP 文件

#### 方式 B: 克隆仓库

```bash
git clone https://github.com/liubin1/weibo-autopilot-generator.git
cd weibo-autopilot-generator/templates/weibo-autopilot
```

### 4. 放置 Skill

将 Skill 文件夹移动到 Claude Code 的 skills 目录：

```bash
# 创建目录（如果不存在）
mkdir -p ~/.agents/skills

# 移动 skill
mv weibo-autopilot ~/.agents/skills/
# 或
cp -r weibo-autopilot ~/.agents/skills/
```

### 5. 初始化

```bash
cd ~/.agents/skills/weibo-autopilot/scripts

# 首次运行：学习用户偏好
bun learn-preferences.ts
```

首次运行时会打开 Chrome 浏览器，需要手动登录微博账号。

### 6. 验证安装

```bash
# 试运行模式
bun autopilot.ts --dry-run
```

如果看到正常的日志输出，说明安装成功。

## 配置 Chrome 路径

如果 Chrome 不在默认位置，可以通过环境变量指定：

```bash
# macOS
export WEIBO_BROWSER_CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Linux
export WEIBO_BROWSER_CHROME_PATH="/usr/bin/google-chrome"

# Windows (WSL)
export WEIBO_BROWSER_CHROME_PATH="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
```

建议将此行添加到 `~/.bashrc` 或 `~/.zshrc` 中。

## 故障排除

### Chrome 未找到

```
Error: Chrome not found. Set WEIBO_BROWSER_CHROME_PATH env var.
```

解决方法：设置 `WEIBO_BROWSER_CHROME_PATH` 环境变量。

### 端口被占用

```
Error: Chrome debug port not ready
```

解决方法：关闭其他 Chrome 实例，或等待几秒后重试。

### 登录状态丢失

如果登录状态丢失，删除浏览器配置文件后重新登录：

```bash
rm -rf ~/.local/share/weibo-autopilot-profile
bun learn-preferences.ts
```

## 下一步

- 查看 [使用指南](USAGE.md) 了解如何运行和配置
- 查看 [配置参考](CONFIG.md) 了解所有配置项
