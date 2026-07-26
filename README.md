# 桃兔 UE2 Surge 自动签到

适用于 `https://ue2.taotu.ink` 的 Surge 自动签到脚本与模块。

## 文件说明

- `taotu-checkin.js`：负责抓取登录态并执行签到。
- `taotu-ue2-checkin.module.sgmodule`：Surge 模块，包含请求捕获、定时任务和 MITM 域名配置。

## 已确认接口

- `GET https://ue2.taotu.ink/api/user/points/info`
- `POST https://ue2.taotu.ink/api/user/points/checkin`

## 使用方法

1. 在 Surge 中导入 `taotu-ue2-checkin.module.sgmodule`。
2. 模块已经直接指向当前仓库的 GitHub raw 脚本地址。
3. 为 `ue2.taotu.ink` 开启 MITM。
4. 登录后打开一次 `https://ue2.taotu.ink/?tab=profile`。
5. 等待“登录态已保存”通知。
6. 手动执行一次“桃兔每日签到”测试是否正常。
7. 保持定时任务开启，默认每天 `09:00` 自动签到。

## 当前脚本地址

```text
https://raw.githubusercontent.com/Lu6618/qiandao/main/taotu-checkin.js
```
