/*
 * Surge ai.962831.xyz 每日签到脚本
 *
 * 抓取模式：
 *   开启 Surge MITM 后，登录并打开一次 https://ai.962831.xyz/wallet
 *   页面上的 /api/user/* 请求会自动保存 Cookie 与 New-Api-User。
 *
 * 定时模式：
 *   1. GET  /api/user/self      验证登录态
 *   2. GET  /api/user/checkin   尝试判断今日是否已签到
 *   3. POST /api/user/checkin   未签到时执行签到
 */

const CFG = {
  name: "词元站签到",
  baseUrl: "https://ai.962831.xyz",
  storageKey: "ai962831_wallet_auth",
  notify: true,
};

const API = {
  self: `${CFG.baseUrl}/api/user/self`,
  checkin: `${CFG.baseUrl}/api/user/checkin`,
  wallet: `${CFG.baseUrl}/wallet`,
};

function notify(subtitle, body) {
  if (CFG.notify) $notification.post(CFG.name, subtitle || "", body || "");
}

function done(value) {
  $done(value || {});
}

function parseJson(text) {
  try {
    return JSON.parse(text || "{}");
  } catch (_) {
    return {};
  }
}

function headerValue(headers, name) {
  if (!headers) return "";
  const wanted = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === wanted) return headers[key];
  }
  return "";
}

function readAuth() {
  const raw = $persistentStore.read(CFG.storageKey);
  return raw ? parseJson(raw) : null;
}

function saveAuth(auth) {
  return $persistentStore.write(JSON.stringify(auth), CFG.storageKey);
}

function captureAuth() {
  const headers = ($request && $request.headers) || {};
  const cookie = headerValue(headers, "Cookie");
  const authorization = headerValue(headers, "Authorization");
  const apiUser = headerValue(headers, "New-Api-User");
  const userAgent = headerValue(headers, "User-Agent");
  const acceptLanguage = headerValue(headers, "Accept-Language");

  if (!cookie && !authorization) {
    return done();
  }

  const ok = saveAuth({
    cookie,
    authorization,
    apiUser,
    userAgent,
    acceptLanguage,
    updatedAt: new Date().toISOString(),
  });

  notify(
    ok ? "登录态已保存" : "登录态保存失败",
    ok
      ? "已抓到 Cookie 和请求头，可以手动运行一次签到测试。"
      : "请检查 Surge 持久化存储权限。"
  );
  done();
}

function buildHeaders() {
  const auth = readAuth();
  if (!auth || (!auth.cookie && !auth.authorization)) {
    throw new Error("未捕获登录态：请先打开 ai.962831.xyz 的钱包页面。");
  }

  const headers = {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    Origin: CFG.baseUrl,
    Referer: API.wallet,
  };

  if (auth.cookie) headers.Cookie = auth.cookie;
  if (auth.authorization) headers.Authorization = auth.authorization;
  if (auth.apiUser) headers["New-Api-User"] = auth.apiUser;
  if (auth.userAgent) headers["User-Agent"] = auth.userAgent;
  if (auth.acceptLanguage) headers["Accept-Language"] = auth.acceptLanguage;

  return headers;
}

function request(method, url, headers, body) {
  return new Promise((resolve) => {
    const options = { url, headers };
    if (body !== undefined) options.body = body;

    $httpClient[method.toLowerCase()](options, (error, response, data) => {
      resolve({
        error,
        status: response ? response.status || response.statusCode || 0 : 0,
        body: data || "",
        json: parseJson(data),
      });
    });
  });
}

function payloadText(payload, rawBody) {
  const parts = [
    payload?.message,
    payload?.msg,
    payload?.error,
    payload?.error?.message,
    payload?.data?.message,
    rawBody,
  ].filter(Boolean);
  return parts.join(" | ");
}

function isUnauthorized(result) {
  return result.status === 401 || result.status === 403;
}

function isSuccessPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  return payload.success === true || payload.status === "success";
}

function inferCheckedState(payload, rawBody) {
  const bools = [
    payload?.checked_in,
    payload?.has_checked_in,
    payload?.checkedIn,
    payload?.data?.checked_in,
    payload?.data?.has_checked_in,
    payload?.data?.checkedIn,
    payload?.data?.checked,
  ];

  for (const value of bools) {
    if (typeof value === "boolean") return value;
  }

  const haystack = payloadText(payload, rawBody).toLowerCase();
  if (
    haystack.includes("already checked") ||
    haystack.includes("checked in today") ||
    haystack.includes("already sign") ||
    haystack.includes("已签到")
  ) {
    return true;
  }
  if (
    haystack.includes("not checked") ||
    haystack.includes("未签到") ||
    haystack.includes("check in now")
  ) {
    return false;
  }

  return null;
}

function extractReward(payload) {
  const candidates = [
    payload?.reward,
    payload?.quota_awarded,
    payload?.quotaAwarded,
    payload?.data?.reward,
    payload?.data?.quota_awarded,
    payload?.data?.quotaAwarded,
    payload?.data?.quota,
  ];
  return candidates.find((value) => value !== undefined && value !== null);
}

function extractBalance(payload) {
  const candidates = [
    payload?.balance,
    payload?.quota,
    payload?.remaining_quota,
    payload?.remainingQuota,
    payload?.data?.balance,
    payload?.data?.quota,
    payload?.data?.remaining_quota,
    payload?.data?.remainingQuota,
  ];
  return candidates.find((value) => value !== undefined && value !== null);
}

async function ensureAuth(headers) {
  const profile = await request("get", API.self, headers);
  if (profile.error) {
    notify("登录验证失败", String(profile.error));
    return null;
  }
  if (isUnauthorized(profile)) {
    notify("登录态已失效", "请重新打开 ai.962831.xyz/wallet 抓取登录态。");
    return null;
  }
  return profile;
}

async function checkStatus(headers) {
  const status = await request("get", API.checkin, headers);
  if (status.error || status.status === 404 || status.status === 405) {
    return { known: false, checked: false, raw: status };
  }
  if (isUnauthorized(status)) {
    notify("登录态已失效", "请重新打开 ai.962831.xyz/wallet 抓取登录态。");
    return null;
  }

  const checked = inferCheckedState(status.json, status.body);
  return {
    known: checked !== null,
    checked: checked === true,
    raw: status,
  };
}

async function runCheckin() {
  let headers;
  try {
    headers = buildHeaders();
  } catch (err) {
    notify("缺少登录态", err.message);
    return done();
  }

  const profile = await ensureAuth(headers);
  if (!profile) return done();

  const statusInfo = await checkStatus(headers);
  if (statusInfo === null) return done();
  if (statusInfo.known && statusInfo.checked) {
    notify("今日已签到", "站点返回当前账号今天已经签到。");
    return done();
  }

  const checkin = await request("post", API.checkin, headers, "{}");
  if (checkin.error) {
    notify("签到请求失败", String(checkin.error));
    return done();
  }
  if (isUnauthorized(checkin)) {
    notify("登录态已失效", "请重新打开 ai.962831.xyz/wallet 抓取登录态。");
    return done();
  }

  const data = checkin.json;
  const bodyText = payloadText(data, checkin.body);
  const checked = inferCheckedState(data, checkin.body);

  if (isSuccessPayload(data)) {
    const reward = extractReward(data);
    const balance = extractBalance(data);
    const detail = [
      reward !== undefined ? `获得 ${reward}` : "",
      balance !== undefined ? `当前余额/额度 ${balance}` : "",
    ]
      .filter(Boolean)
      .join("，");
    notify("签到成功", detail || "今日签到已完成。");
  } else if (checked === true) {
    notify("今日已签到", bodyText || "站点提示今天已经签到。");
  } else {
    notify("签到未成功", bodyText || `HTTP ${checkin.status}: ${checkin.body.slice(0, 160)}`);
  }

  done();
}

if (typeof $request !== "undefined") {
  captureAuth();
} else {
  runCheckin();
}
