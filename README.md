# Taotu UE2 Surge Check-in

Surge module and script for daily points check-in on `https://ue2.taotu.ink`.

## Files

- `taotu-checkin.js`: Surge script that captures auth and runs check-in.
- `taotu-ue2-checkin.module.sgmodule`: Surge module with capture rule, cron rule, and MITM hostname.

## Confirmed APIs

- `GET https://ue2.taotu.ink/api/user/points/info`
- `POST https://ue2.taotu.ink/api/user/points/checkin`

## Usage

1. Import `taotu-ue2-checkin.module.sgmodule` in Surge.
2. The module already points to the GitHub raw JS URL for this repository.
3. Enable MITM for `ue2.taotu.ink`.
4. Open `https://ue2.taotu.ink/?tab=profile` once while logged in.
5. Wait for the auth capture notification.
6. Manually run `Taotu UE2 Daily Check-in` once to test.
7. Keep the cron rule enabled for daily 09:00 check-in.

## Remote Script Path

This repository uses:

```text
https://raw.githubusercontent.com/Lu6618/qiandao/main/taotu-checkin.js
```
