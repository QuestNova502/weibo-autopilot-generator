# Weibo Autopilot - 通用版

这是可以直接下载使用的微博自动化 Skill 通用版本。

## 安装步骤

1. 下载整个 `skill` 文件夹
2. 重命名为你喜欢的名字（如 `my-weibo-autopilot`）
3. 移动到 `~/.agents/skills/` 目录

```bash
mv skill ~/.agents/skills/my-weibo-autopilot
```

## 首次使用

1. 学习你的发帖风格（首次必须运行）：
```bash
cd ~/.agents/skills/my-weibo-autopilot/scripts
bun learn-preferences.ts
```

2. 启动自动运行：
```bash
bun autopilot.ts
```

## 自定义配置

运行学习脚本后，你可以编辑 `data/user-profile.json` 来调整：
- 感兴趣的话题
- 发帖风格偏好

## 更多信息

查看 [SKILL.md](./SKILL.md) 了解完整的命令参考和配置说明。
