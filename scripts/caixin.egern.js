/*
 * 财新 App 会员/正文解锁（Egern 版 · ctx API）
 * ─────────────────────────────────────────────
 * 适配：财新 App 7.9.8（com.caixin.news）
 * 原理（逆向自 APK + 前端 index.js）：
 *   - 正文权限：POST /api/app-api/auth/newValidate（新版）/ GET /api/app-api/auth/validate（旧版）
 *     前端逻辑 isExpand = data.info.power > 0 → 展开全文；正文以汉字隐写随页面下发，权限只是显示开关
 *   - 音频鉴权：POST /api/app-api/auth/validateAudioAuth → data.power / audioStatus / isLoginPower
 *   - 周刊订阅状态：mapiv5.caixin.com/android/user/get_user_power → code
 *   - 会员权益：/api/purchase/user/getUserPowerArticlesV2 → power.subscribe_list
 * 只改响应不改请求；解析失败一律透传，不破坏 App。仅供学习交流。
 *
 * ── Egern 配置（追加到 egern.yaml 末尾）────────────────────
scriptings:
  - http_response:
      name: "财新会员+正文"
      match: "^https?:\\/\\/(gateway\\.caixin\\.com\\/api\\/(app-api\\/auth\\/(newValidate|validate|validateAudioAuth)|purchase\\/user\\/getUserPowerArticlesV2)|mapiv5\\.caixin\\.com\\/android\\/user\\/get_user_power|mappsv5\\.caixin\\.com\\/articlev5\\/.*\\.html)"
      script_url: "https://raw.githubusercontent.com/funit1858/egern-config/main/scripts/caixin.egern.js"
      body_required: true
      timeout: 10
mitm:
  hostnames:
    includes:
      - "gateway.caixin.com"
      - "mapiv5.caixin.com"
      - "mappsv5.caixin.com"
 * ─────────────────────────────────────────────────────────
 */

export default async function (ctx) {
  try {
    const url = ctx.request.url || '';
    const text = await ctx.response.text();

    // ---- 1) 会员/正文权限校验 (newValidate / validate / validateAudioAuth) ----
    if (/\/app-api\/auth\/(newValidate|validate|validateAudioAuth)/.test(url)) {
      const data = tryParse(text);
      if (data && typeof data === 'object') {
        patchAuth(data);
        return { body: data };
      }
    }

    // ---- 2) 周刊权限 (mapiv5 get_user_power) ----
    else if (/get_user_power/.test(url)) {
      const data = tryParse(text);
      if (data && typeof data === 'object') {
        if (data.code !== undefined && data.code !== 0) data.code = 0;
        if (data.msg !== undefined) data.msg = 'success';
        return { body: data };
      }
    }

    // ---- 3) 会员权益 (getUserPowerArticlesV2) ----
    else if (/purchase\/user\/getUserPowerArticlesV2/.test(url)) {
      const data = tryParse(text);
      if (data && typeof data === 'object') {
        const holder = (data.data && typeof data.data === 'object') ? data.data : data;
        if (holder.power && typeof holder.power === 'object') {
          const p = holder.power;
          if (p.errorCode !== undefined) p.errorCode = 0;
          if (p.power !== undefined && typeof p.power === 'number') p.power = 1;
          if (!Array.isArray(p.subscribe_list) || p.subscribe_list.length === 0) {
            p.subscribe_list = [{
              goodsTypeId: 20, goodsCode: 'TAG', permanent: 0,
              list: [{ endTime: '2030-01-01 00:00:00', startTime: '2022-07-01 00:00:00', status: 1 }]
            }];
          }
          if (!Array.isArray(p.article_list)) p.article_list = [];
        }
        return { body: data };
      }
    }

    // ---- 4) 正文 HTML (mappsv5 articlev5): isFree/need_login 翻转（兜底） ----
    if (/mappsv5\.caixin\.com\/articlev5\//.test(url)) {
      return {
        body: text
          .replace(/<title>([^<]*)<\/title>/, '<title>[UNLOCKED] $1</title>')
          .replace(/<title>([^<]*)<\/title>/, '<title>[UNLOCKED] $1</title>')
          .replace(/"isFree"\s*:\s*"?1"?(?![0-9])/g, '"isFree":0')
          .replace(/isFree\s*:\s*1(?![0-9])/g, 'isFree:0')
          .replace(/isFree\s*=\s*["']1["']/g, 'isFree="0"')
          .replace(/"?need_login"?\s*:\s*["']?1["']?(?![0-9])/g, 'need_login:"0"')
          .replace(/need_login\s*=\s*["']1["']/g, 'need_login="0"'),
      };
    }
  } catch (e) {
    // 读取失败：透传
  }
  // 不返回 → 透传
}

function tryParse(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

/* newValidate / validate 响应: data.info{power,errorCode,tipsMsg,redmsg}
   validateAudioAuth 响应: data{power,audioStatus,isLoginPower,expireTime} */
function patchAuth(data) {
  const d = data.data;
  if (!d || typeof d !== 'object') { try { console.log('[CAIXIN-UNLOCK] no data', JSON.stringify(data).slice(0, 200)); } catch (e) {} return; }
  // 结构1: {data:{info:{errorCode,power}}}
  if (d.info && typeof d.info === 'object') {
    if (d.info.errorCode !== undefined) d.info.errorCode = 0;
    if (d.info.power !== undefined) { d.info.power = 1; try { console.log('[CAIXIN-UNLOCK] patched power 0->1'); } catch (e) {} }
  }
  // 结构2: {data:{power,audioStatus,isLoginPower,expireTime}} (AudioAuthInfo)
  if (d.power !== undefined) {
    d.power = 1;
    d.audioStatus = 1;
    d.isLoginPower = true;
    if (d.expireTime !== undefined) d.expireTime = 1893427200; // 2030-01-01
  }
}
