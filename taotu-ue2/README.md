# 桃兔 UE2

适用站点：`https://ue2.taotu.ink`

目录文件：

- `taotu-checkin.js`
- `taotu-ue2-checkin.module.sgmodule`

已确认接口：

- `GET https://ue2.taotu.ink/api/user/points/info`
- `POST https://ue2.taotu.ink/api/user/points/checkin`

使用方法：

1. 在 Surge 中导入 `taotu-ue2-checkin.module.sgmodule`
2. 给 `ue2.taotu.ink` 开启 MITM
3. 登录后打开一次 `https://ue2.taotu.ink/?tab=profile`
4. 等待“登录态已保存”通知
5. 手动执行一次“桃兔每日签到”测试

模块直链：

```text
https://raw.githubusercontent.com/Lu6618/qiandao/main/taotu-ue2/taotu-ue2-checkin.module.sgmodule
```
