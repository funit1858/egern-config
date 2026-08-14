/*
 * 伴学课堂 Pro 解锁（Egern 专用版 · 适配 v1.6.x）
 * ─────────────────────────────────────────────
 * 适配版本：Android v1.6.6（内部 1.6.82）/ iOS v1.6.7
 * 逻辑与 QX/Surge 增强版 banxueketang.vip.js 完全一致，
 * 仅入口改为 Egern 的 ctx API：
 *   - export default async function(ctx)
 *   - await ctx.response.text() 读取响应体
 *   - return { body: data } 返回修改（Object 自动 JSON 序列化）
 * 使用声明：仅供学习交流，请于下载后 24 小时内删除。
 *
 * ── Egern 配置（YAML，追加到配置末尾）────────────────────
# 脚本（script_url 可填本地路径或远程链接）
scriptings:
  - http_response:
      name: "伴学课堂 VIP 解锁"
      match: "^https://api\\.banxueketang\\.com/api/classpal/app/v1"
      script_url: "banxueketang.egern.js"
      body_required: true
      timeout: 10

# HTTPS 解密（必须，否则脚本看不到明文响应）
mitm:
  ca_p12: ""
  ca_passphrase: "123456"
  hostnames:
    includes:
      - "api.banxueketang.com"
 * ─────────────────────────────────────────────────────────
 */

export default async function(ctx) {
  try {
    const text = await ctx.response.text();
    try {
      const data = JSON.parse(text);
      if (data && typeof data === 'object') {
        unlock(data);
        // 投屏等 SKU 权益接口：强制注入权益解锁字段（无论字段是否存在）
        if (ctx.request.url.indexOf('getFunctionsSku') >= 0) {
          forceUnlockSku(data);
        }
        return { body: data }; // Egern 自动 JSON 序列化
      }
    } catch (e) {
      // 非标准 JSON：文本正则兜底
      return {
        body: text
          .replace(/"isVip":(false|0)(?=[,}])/g, '"isVip":1')
          .replace(/"isHave":(false|0)(?=[,}])/g, '"isHave":1')
          .replace(/"isLock":(true|1)(?=[,}])/g, '"isLock":false')
          .replace(/"vipStatus":1(?=[,}])/g, '"vipStatus":2')
          .replace(/"memberCardCode":null(?=[,}])/g, '"memberCardCode":"svip"'),
      };
    }
  } catch (e) {
    // 读取失败：透传原响应
  }
  // 不返回 → 透传
}

/*
 * 深度解锁：遍历整棵 JSON 树，字段存在即改写。
 * 字段名参考 1.6.82 反编译结果：
 *   CurseTabListInfoData / UserInfo / UserVipInfo / UserVipData / MaterialInfoBean
 */
function unlock(data) {
  if (!data || typeof data !== 'object') return;

  if (Object.prototype.toString.call(data) === '[object Array]') {
    for (let i = 0; i < data.length; i++) unlock(data[i]);
    return;
  }

  // 内容解锁（v1.4 即有，v1.6 仍在使用）
  setF(data, 'isVip', true, 1);        // 会员标记（Boolean 或 Integer）
  setF(data, 'isHave', true, 1);       // 已拥有资源 → isHaveVideo=true → 全解锁
  setF(data, 'isLock', false, 0);      // 单资源锁定标记
  setF(data, 'isSale', true, 1);       // 可购买标记
  setF(data, 'trialTopNum', 999);      // 试看条数拉满（列表本地解锁逻辑）
  setF(data, 'originalPrice', 0);
  setF(data, 'salePrice', 0);

  // 新版 VIP 状态判定（v1.6+ 核心）
  setF(data, 'memberCardCode', 'svip'); // "vip"=普通会员 "svip"=超级会员；如需普通会员标识可改 'vip'
  setF(data, 'vipStatus', 2);           // 2=生效中（1=非会员 3=已过期）→ notAnyVip() 自动为 false
  setF(data, 'isUpSVip', true, 1);
  setF(data, 'isSVIP', 1, true);        // UserVipData 字段（注意全大写）
  setF(data, 'isSVip', true, 1);        // UserVipInfo 字段
  setF(data, 'isVipExpire', false, 0);
  setF(data, 'isVipExpired', false, 0); // UserInfo 字段
  setF(data, 'notAnyVip', false, 0);    // 显式清除非会员标记
  setF(data, 'vipType', 'svip');

  // SKU 权益解锁（投屏/字幕等 VIP 专属功能）
  // 参考反编译：SkuRights.checkAvailable() 判定路径
  //   isRights=false        → isSkuFunction()=false → 非付费功能，直接可用
  //   isRightsAvailable=false → 权益无限制（双保险）
  setF(data, 'isRights', false, 0);
  setF(data, 'resourceCount', 9999);   // 资源包数量拉满（我的页展示用）
  setF(data, 'isRightsAvailable', false, 0);

  // 有效期拉满（vipTime / svipTime / expireTime 字符串格式）
  setF(data, 'vipTime', '2099-12-31 23:59:59');
  setF(data, 'svipTime', '2099-12-31 23:59:59');
  setF(data, 'expireTime', '2099-12-31 23:59:59');
  setF(data, 'vipExpireTime', '2099-12-31 23:59:59');

  // 递归进入所有嵌套对象 / 数组
  for (const key in data) {
    if (data[key] && typeof data[key] === 'object') unlock(data[key]);
  }
}

/*
 * 字段改写规则：
 *   val 为布尔 → 目标值也是布尔；仅当原值为数字时写 intVal（兼容 Integer 结构）
 *   val 为数字/字符串 → 直接写入（服务端字段本身是数字/字符串）
 * 仅在字段已存在时改写，绝不注入新字段（避免 Kotlinx 严格反序列化报错）
 */
function setF(obj, key, val, intVal) {
  if (!obj || !Object.prototype.hasOwnProperty.call(obj, key)) return;
  if (typeof val === 'boolean') {
    obj[key] = (typeof obj[key] === 'number') ? intVal : val;
  } else {
    obj[key] = val;
  }
}

/*
 * SKU 权益接口（functions/product/getFunctionsSkuIsRights）专用强制解锁：
 * 反编译自 FunctionSkuRightBean / SkuRights.checkAvailable()：
 *   skuVipRightsApiDTO（功能权益要求）isRights=false → 非付费功能直接可用
 *   appUserVipRightsApiDTO（用户权益）isRights=true → 用户持有权益（双保险）
 * isRights / isRightsAvailable 是 VipRightsInfo 模型标准字段，强制写入安全。
 */
function forceUnlockSku(data) {
  if (!data || typeof data !== 'object') return;
  const list = (data.data && Array.isArray(data.data)) ? data.data : (Array.isArray(data) ? data : [data]);
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item || typeof item !== 'object') continue;
    if (item.skuVipRightsApiDTO) forceVipRights(item.skuVipRightsApiDTO, false);
    // iOS 版可能不返回 appUserVipRightsApiDTO → 强制创建并解锁（用户持有权益）
    if (!item.appUserVipRightsApiDTO || typeof item.appUserVipRightsApiDTO !== 'object') {
      item.appUserVipRightsApiDTO = {};
    }
    forceVipRights(item.appUserVipRightsApiDTO, true);
  }
}

function forceVipRights(v, isUser) {
  if (!v || typeof v !== 'object') return;
  v.isRights = isUser ? true : false;
  v.isRightsAvailable = false;
  v.vipStatus = 2;
  v.memberCardCode = v.memberCardCode || 'svip';
  v.isVip = (typeof v.isVip === 'number') ? 1 : true;
}
