# Docker 测试

macOS 上无窗口运行测试。

## 使用

```bash
npm test          # 直接运行测试（使用已有镜像）
npm run test:build # Dockerfile 变更时重新构建
```

## 流程

1. 本地 `vite build` 构建测试文件
2. Docker 运行（预装系统依赖，挂载本地构建）
3. VS Code 下载缓存到 Docker volume

## 文件

- `Dockerfile.test` - 轻量测试镜像（node:22-slim + 系统依赖）
- `docker-compose.yml` - Compose 配置

## 配置优化

### Electron 日志过滤

VS Code Extension 测试默认输出大量 Electron 内部日志（`NativeExtensionHostFactory` 等）。通过 `grep -v` 过滤清理输出：

```yaml
# docker-compose.yml
command: >
  sh -c "
    Xvfb :99 -screen 0 1280x720x24 &>/dev/null &
    sleep 1
    DISPLAY=:99 npx vscode-test 2>/dev/null | grep -v -E '^[[]main |^workbench#|^NativeExtensionHostFactory|...'
  "
```

**要点：** 使用 `[[]` 匹配 `[` 字符避免 grep 转义问题。

### Build 优化

- 默认 `npm test` 跳过 `--build` 标志，启动更快
- `npm run test:build` 仅在 Dockerfile 变更时使用
- Docker 层缓存自动处理依赖安装
