---
name: weibo-autopilot
description: Weibo autopilot skill for automatic reposting and engagement
version: 1.0.0
---

# Weibo Autopilot

微博自动化 Skill，用于自动转发和互动。

## 功能

- 自动浏览微博 Feed
- 根据话题匹配筛选内容
- 自动转发感兴趣的内容
- 学习用户发帖风格生成评论

## 使用方法

1. 首次运行学习偏好:
   ```bash
   cd scripts && bun learn-preferences.ts
   ```

2. 启动自动运行:
   ```bash
   bun autopilot.ts
   ```

3. 带参数运行:
   ```bash
   bun autopilot.ts --interval 15 --group "科技"
   ```

## 配置

编辑 `data/user-config.json` 自定义：
- 兴趣话题
- 执行间隔
- 内容来源

## 注意事项

- 首次运行需要在浏览器中登录微博
- 建议设置合理的间隔时间，避免频繁操作
- 所有转发内容会带有 AI 标识
