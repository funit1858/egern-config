/*
 * 财新周刊解锁（Egern 版 · ctx API）
 * ─────────────────────────────────────────────
 * 适配：独立财新周刊 App（ipadcms.caixin.com）
 * 注意：老 CMS 接口（/api/article /tmp/articles /power/myfree*）已实测空响应，
 *       本脚本保留以兼容仍可用的场景；主 App 内的周刊栏目请用 caixin.egern.js。
 * 逻辑源自 Functional-Store-Hub @R·E：isfree 0→1 + myfree 整包替换（至 2030）。
 * 仅供学习交流。
 *
 * ── Egern 配置 ────────────────────────────────
scriptings:
  - http_response:
      name: "财新周刊"
      match: "^https?:\\/\\/ipadcms\\.caixin\\.com\\/(api|tmp|power)\\/(articles?|myfree(v\\d+)?)"
      script_url: "https://raw.githubusercontent.com/funit1858/egern-config/main/scripts/caixin-weekly.egern.js"
      body_required: true
      timeout: 10
mitm:
  hostnames:
    includes:
      - "ipadcms.caixin.com"
 * ─────────────────────────────────────────────────────────
 */

export default async function (ctx) {
  try {
    const url = ctx.request.url || '';
    const text = await ctx.response.text();

    // 文章正文/详情: isfree 0 -> 1
    if (url.indexOf('//ipadcms.caixin.com/api/article/') !== -1 ||
        url.indexOf('//ipadcms.caixin.com/tmp/articles/') !== -1) {
      return { body: text.replace(/"isfree":0/g, '"isfree":1') };
    }

    // myfree: 整包替换订阅信息（财新通兑换码白嫖，至 2030-01-01）
    if (url.indexOf('//ipadcms.caixin.com/power/myfree/') !== -1) {
      return { body: '{"info":[{"type":2,"subscriptDescription":"通过财新通兑换码白嫖","uid":null,"endtime":1893427200,"magazineid":1000,"starttime":1656604800}],"list":[{"UID":null,"END_DT":1893427200,"subscriptDescription":"通过财新通兑换码白嫖","MAGAZINEID":1000,"START_DT":1656604800,"TYPE":2,"ID":null}]}' };
    }

    // myfreev3: 整包替换订阅信息
    if (url.indexOf('//ipadcms.caixin.com/power/myfreev3/') !== -1) {
      return { body: '{"msg":"success","data":{"flag":true,"list":[{"goodsTypeId":20,"goodsCode":"TAG","permanent":0,"list":[{"endTime":"2030-01-01 00:00:00","startTime":"2022-07-01 00:00:00","status":1}]},{"goodsTypeId":11,"goodsCode":"QZSF","permanent":0,"list":[{"endTime":"2030-01-01 00:00:00","startTime":"2022-07-01 00:00:00","status":1}]}]},"code":0}' };
    }
  } catch (e) {
    // 读取失败：透传
  }
  // 不返回 → 透传
}
