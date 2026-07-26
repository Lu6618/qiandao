/*
 * Surge 桃兔 UE2 每日签到脚本。
 *
 * 抓取模式：
 *   开启 Surge MITM 后，登录并打开一次 https://ue2.taotu.ink/?tab=profile
 *
 * 定时模式：
 *   1. GET  /api/user/points/info
 *   2. 当 has_checked_in 为 false 时，POST /api/user/points/checkin
 */

const CFG = {
  name: "桃兔签到",
  baseUrl: "https://ue2.taotu.ink",
  storageKey: "taotu_ue2_auth",
  captureNoticeKey: "taotu_ue2_capture_notice_shown",
  notify: true,
};

const API = {
  pointsInfo: `${CFG.baseUrl}/api/user/points/info`,
  checkin: `${CFG.baseUrl}/api/user/points/checkin`,
  profile: `${CFG.baseUrl}/?tab=profile`,
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

function hasShownCaptureNotice() {
  return $persistentStore.read(CFG.captureNoticeKey) === "1";
}

function markCaptureNoticeShown() {
  return $persistentStore.write("1", CFG.captureNoticeKey);
}

function captureAuth() {
  const headers = ($request && $request.headers) || {};
  const cookie = headerValue(headers, "Cookie");
  const authorization = headerValue(headers, "Authorization");
  const userAgent = headerValue(headers, "User-Agent");
  const acceptLanguage = headerValue(headers, "Accept-Language");

  if (!cookie && !authorization) {
    return done();
  }

  const ok = saveAuth({
    cookie,
    authorization,
    userAgent,
    acceptLanguage,
    updatedAt: new Date().toISOString(),
  });

  if (!ok) {
    notify("登录态保存失败", "请检查 Surge 持久化存储权限。");
    return done();
  }

  if (!hasShownCaptureNotice()) {
    markCaptureNoticeShown();
    notify("登录态已保存", "可以手动运行一次签到脚本测试。");
  }

  done();
}

function buildHeaders() {
  const auth = readAuth();
  if (!auth || (!auth.cookie && !auth.authorization)) {
    throw new Error("未捕获登录态：请先打开 ue2.taotu.ink 并进入个人页。");
  }

  const headers = {
    Accept: "application/json, text/plain, */*",
    Origin: CFG.baseUrl,
    Referer: API.profile,
  };

  if (auth.cookie) headers.Cookie = auth.cookie;
  if (auth.authorization) headers.Authorization = auth.authorization;
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

function formatInfo(data) {
  const points = data?.data?.points;
  const checked = data?.data?.has_checked_in;
  if (points === undefined) return "";
  return `当前积分：${points}${checked ? "，今日已签到" : ""}`;
}

async function runCheckin() {
  let headers;
  try {
    headers = buildHeaders();
  } catch (err) {
    notify("缺少登录态", err.message);
    return done();
  }

  const info = await request("get", API.pointsInfo, headers);
  if (info.error) {
    notify("积分状态读取失败", String(info.error));
  } else if (info.status === 401 || info.status === 403) {
    notify("登录态已失效", "请重新打开网页捕获 Cookie。");
    return done();
  } else if (info.json.status === "success" && info.json?.data?.has_checked_in) {
    notify("今日已签到", formatInfo(info.json));
    return done();
  }

  const checkin = await request("post", API.checkin, headers);
  if (checkin.error) {
    notify("签到请求失败", String(checkin.error));
    return done();
  }

  const data = checkin.json;
  if (data.status === "success") {
    const reward = data.reward ?? 0;
    const balance = data.balance ?? data?.data?.points;
    notify("签到成功", `获得 ${reward} 积分${balance !== undefined ? `，当前 ${balance} 积分` : ""}`);
  } else {
    notify("签到未成功", data.message || `HTTP ${checkin.status}: ${checkin.body.slice(0, 160)}`);
  }

  done();
}

if (typeof $request !== "undefined") {
  captureAuth();
} else {
  runCheckin();
}
