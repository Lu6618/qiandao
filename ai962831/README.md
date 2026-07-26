# 词元站钱包签到

适用站点：`https://ai.962831.xyz/wallet`

目录文件：

- `ai962831-checkin.js`
- `ai962831-checkin.module.sgmodule`

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

模块直链：

```text
https://raw.githubusercontent.com/Lu6618/qiandao/main/ai962831/ai962831-checkin.module.sgmodule
```
