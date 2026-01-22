# 使用指南

## 基本流程

### 1. 学习用户偏好

首次使用前，需要运行学习脚本来分析你的微博风格：

```bash
cd ~/.agents/skills/weibo-autopilot/scripts
bun learn-preferences.ts
```

这会：
- 打开浏览器访问你的微博主页
- 分析你最近的发帖内容
- 分析你的评论风格
- 生成用户画像保存到 `data/user-profile.json`

### 2. 启动自动化

```bash
bun autopilot.ts
```

默认行为：
- 浏览首页 Feed
- 根据你的兴趣话题筛选内容
- 每 10 分钟检查一次，选择最匹配的内容转发

### 3. 自定义运行参数

```bash
# 指定分组
bun autopilot.ts --group "科技博主"

# 设置间隔时间
bun autopilot.ts --interval 15

# 试运行（不实际转发）
bun autopilot.ts --dry-run

# 组合使用
bun autopilot.ts --group "足球" --interval 20 --dry-run
```

## 命令详解

### autopilot.ts - 主自动化脚本

```bash
bun autopilot.ts [选项]

选项:
  --group <name>      指定浏览的分组名称
  --interval <min>    执行间隔（分钟），默认 10
  --dry-run           试运行，不实际执行转发
  --help, -h          显示帮助
```

### learn-preferences.ts - 学习用户偏好

```bash
bun learn-preferences.ts [选项]

选项:
  --posts <num>       分析的帖子数量，默认 20
  --comments <num>    分析的评论数量，默认 20
  --help, -h          显示帮助
```

### repost.ts - 手动转发

```bash
bun repost.ts <微博URL> [选项]

选项:
  --comment <text>    自定义转发评论
  --help, -h          显示帮助

示例:
  bun repost.ts https://weibo.com/1234567890/AbCdEfG
  bun repost.ts https://weibo.com/1234567890/AbCdEfG --comment "好内容！"
```

### browse-feed.ts - 浏览 Feed

```bash
bun browse-feed.ts [选项]

选项:
  --group <name>      指定分组
  --scrolls <num>     滚动次数，默认 10
  --output <file>     输出文件路径
  --help, -h          显示帮助
```

## 后台运行

### 使用 nohup

```bash
nohup bun autopilot.ts > autopilot.log 2>&1 &
echo $! > autopilot.pid
```

### 使用 screen

```bash
screen -S weibo-autopilot
bun autopilot.ts
# Ctrl+A, D 分离
# screen -r weibo-autopilot 恢复
```

### 使用 tmux

```bash
tmux new -s weibo-autopilot
bun autopilot.ts
# Ctrl+B, D 分离
# tmux attach -t weibo-autopilot 恢复
```

### 查看日志

```bash
# 实时查看
tail -f autopilot.log

# 查看最近 100 行
tail -100 autopilot.log
```

### 停止运行

```bash
# 使用 PID 文件
kill $(cat autopilot.pid)

# 或查找进程
ps aux | grep autopilot
kill <PID>
```

## 配置分组

微博支持将关注的人分组管理。你可以让 autopilot 只浏览特定分组：

1. 在微博网页版创建/管理分组
2. 记住分组名称（如"科技博主"、"足球达人"）
3. 运行时指定：

```bash
bun autopilot.ts --group "科技博主"
```

或在 `user-config.json` 中配置：

```json
{
  "contentSource": {
    "type": "group",
    "groups": ["科技博主", "足球达人"]
  }
}
```

## 话题匹配

autopilot 会根据你配置的话题对内容评分：

1. 编辑 `data/user-config.json`：

```json
{
  "topics": ["AI", "人工智能", "Claude", "科技", "足球"]
}
```

2. 评分规则：
   - 每匹配一个兴趣词 +10 分
   - 每匹配一个话题词 +15 分
   - 高互动量（点赞>1000）+5 分
   - 内容太短（<20字）-10 分
   - 已是转发内容 -5 分

3. 选择得分最高的内容转发

## 安全建议

1. **合理间隔** - 建议 10-30 分钟，避免频繁操作
2. **试运行** - 新配置先用 `--dry-run` 测试
3. **内容审核** - 定期检查转发历史
4. **保持 AI 标识** - 建议不要关闭，保持透明

## 查看历史

转发历史保存在 `data/repost-history.json`：

```bash
# 查看最近的转发
cat data/repost-history.json | jq '.reposts[-5:]'

# 统计转发数量
cat data/repost-history.json | jq '.reposts | length'
```

## 下一步

- 查看 [配置参考](CONFIG.md) 了解所有配置项
- 查看 [故障排除](TROUBLESHOOTING.md) 解决常见问题
