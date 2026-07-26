# qiandao

现在仓库按“一个站点一个文件夹”整理，后续继续加签到脚本会更清晰。

## 目录结构

- `taotu-ue2/`
  - `taotu-checkin.js`
  - `taotu-ue2-checkin.module.sgmodule`
  - `README.md`
- `ai962831/`
  - `ai962831-checkin.js`
  - `ai962831-checkin.module.sgmodule`
  - `README.md`

## 直接导入

- 桃兔 UE2 模块：
  - `https://raw.githubusercontent.com/Lu6618/qiandao/main/taotu-ue2/taotu-ue2-checkin.module.sgmodule`
- 词元站模块：
  - `https://raw.githubusercontent.com/Lu6618/qiandao/main/ai962831/ai962831-checkin.module.sgmodule`

## 说明

- 每个子目录单独维护一个站点的脚本、模块和说明
- 根目录只保留总览，避免不同站点文件混在一起
# qiandao

这个仓库收集了几个可直接导入 Surge 的自动签到脚本与模块，当前包含：

- `taotu-checkin.js` / `taotu-ue2-checkin.module.sgmodule`
- `ai962831-checkin.js` / `ai962831-checkin.module.sgmodule`

## 1. 桃兔 UE2

适用站点：`https://ue2.taotu.ink`

已确认接口：

- `GET https://ue2.taotu.ink/api/user/points/info`
- `POST https://ue2.taotu.ink/api/user/points/checkin`

使用方法：

1. 在 Surge 中导入 `taotu-ue2-checkin.module.sgmodule`
2. 给 `ue2.taotu.ink` 开启 MITM
3. 登录后打开一次 `https://ue2.taotu.ink/?tab=profile`
4. 等待“登录态已保存”通知
5. 手动执行一次“桃兔每日签到”测试

Raw 地址：

```text
https://raw.githubusercontent.com/Lu6618/qiandao/main/taotu-ue2-checkin.module.sgmodule
```

## 2. 词元站钱包签到

适用站点：`https://ai.962831.xyz/wallet`

已确认接口：

- `GET  https://ai.962831.xyz/api/user/self`
- `GET  https://ai.962831.xyz/api/user/checkin`
- `POST https://ai.962831.xyz/api/user/checkin`

说明：

- 该站使用新版 `checkin` 接口
- `POST /api/user/checkin` 未登录时会返回 `401 Unauthorized`
- `POST /api/user/sign_in` 在该站是无效路由，不使用旧版 `sign_in`
- 页面请求会带 `New-Api-User`，脚本会一并抓取并保存

使用方法：

1. 在 Surge 中导入 `ai962831-checkin.module.sgmodule`
2. 给 `ai.962831.xyz` 开启 MITM
3. 登录后打开一次 `https://ai.962831.xyz/wallet`
4. 等待“登录态已保存”通知
5. 手动执行一次“词元站每日签到”测试

Raw 地址：

```text
https://raw.githubusercontent.com/Lu6618/qiandao/main/ai962831-checkin.module.sgmodule
```

## 默认定时

两个模块默认都是每天 `09:00` 执行一次；如果你想改时间，直接编辑模块里的 `cronexp` 即可。
