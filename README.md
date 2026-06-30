# Knee Check-in

Knee Check-in 是一个手机端优先的家庭自用膝盖不适记录网页。它只用于日常记录、观察趋势和提醒必要时就医，不能替代医生诊断，也不会根据记录判断病因。

## 本地运行

```bash
npm install
npm run dev
```

然后打开终端提示的本地地址。

如果要让同一 Wi-Fi 下的手机访问，请运行：

```bash
npm run dev -- --host 0.0.0.0
```

终端会显示类似 `Network: http://192.168.x.x:5173/` 的地址。手机和电脑连接同一个 Wi-Fi 后，用手机浏览器打开这个 Network 地址即可。

## 构建

```bash
npm run build
```

构建产物会生成在 `dist/`。

## 数据保存在哪里

所有记录保存在当前浏览器的 `localStorage` 中，键名是 `knee-check-in-records-v1`。不需要后端，也不需要登录。

如果换手机、换浏览器、清理浏览器缓存，或使用无痕模式，数据可能丢失。建议定期在“设置/说明”里导出 JSON 备份。

## 导出和导入

在“设置/说明”页面可以：

- 导出 CSV：适合用 Excel、Numbers 或表格软件查看。
- 导出 JSON：适合完整备份。
- 导入 JSON：可恢复之前导出的记录。
- 清空全部数据：需要二次确认。

## 部署到 Vercel

项目已经包含 `vercel.json`，可以直接部署：

1. 将项目推送到 GitHub。
2. 打开 Vercel，选择 Add New Project。
3. 导入这个 GitHub 仓库。
4. Vercel 会读取 `vercel.json`，使用 `npm install`、`npm run build`，并发布 `dist/`。
5. 部署完成后，用手机打开 Vercel 给出的 HTTPS 地址。
6. 在手机浏览器菜单中选择“添加到主屏幕”。

## 部署到 GitHub Pages

项目已经包含 `.github/workflows/deploy-pages.yml`。推送到 GitHub 后，它会自动构建并发布到 GitHub Pages。

步骤：

1. 在 GitHub 新建一个仓库。
2. 把本项目推送到仓库的 `main` 分支。
3. 打开仓库 Settings → Pages。
4. Source 选择 GitHub Actions。
5. 等待 Actions 中的 Deploy to GitHub Pages 工作流完成。
6. GitHub Pages 会生成一个网址，手机打开该网址即可。

工作流会自动处理 Vite 的 `base` 路径：

- 如果仓库是 `用户名.github.io`，发布路径使用 `/`。
- 如果仓库是普通仓库，例如 `knee-check-in`，发布路径使用 `/knee-check-in/`。

## PWA 支持

项目包含 `public/manifest.webmanifest` 和 `public/icon.svg`，手机浏览器可添加到主屏幕。当前未加入离线缓存 Service Worker，数据仍保存在本机浏览器。

## 重要提醒

本工具只用于记录和观察趋势。如果出现明显肿胀、发热发红、不能承重、膝盖卡住伸不直、打软腿、突然严重疼痛，应该及时就医。
