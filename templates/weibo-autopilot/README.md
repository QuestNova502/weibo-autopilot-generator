# Weibo Autopilot

基于 Claude Code 的微博自动化 Skill。

## 快速开始

```bash
# 1. 移动到 skills 目录
mv weibo-autopilot ~/.agents/skills/

# 2. 进入脚本目录
cd ~/.agents/skills/weibo-autopilot/scripts

# 3. 学习用户偏好（首次必须）
bun learn-preferences.ts

# 4. 启动自动化
bun autopilot.ts
```

## 配置

编辑 `data/user-config.json`：

```json
{
  "topics": ["科技", "足球", "AI"],
  "settings": {
    "intervalMinutes": 10
  },
  "contentSource": {
    "type": "home",
    "groups": []
  }
}
```

## 命令

```bash
# 学习偏好
bun learn-preferences.ts

# 启动自动化
bun autopilot.ts

# 指定分组
bun autopilot.ts --group "科技"

# 试运行
bun autopilot.ts --dry-run
```

## 文件结构

```
weibo-autopilot/
├── scripts/           # 脚本文件
├── data/              # 数据文件
│   ├── user-config.json
│   └── user-profile.json
├── skill.md
└── README.md
```

## 许可

MIT License
