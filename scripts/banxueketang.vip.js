/*
 * 伴学课堂 Pro 解锁（增强版 · 适配 v1.6.x）
 * ─────────────────────────────────────────────
 * 适配版本：Android v1.6.6（内部 1.6.82）/ iOS v1.6.7
 * 基于：@liul0ng 原版 bxkt.js
 * 增强点（针对 v1.6+ 反编译分析）：
 *   1. 新版 VIP 判定字段补齐：memberCardCode / vipStatus / isUpSVip /
 *      notAnyVip / isSVIP / vipTime / svipTime（原脚本完全没处理）
 *   2. 类型兼容：isVip 在新版部分响应中是 Integer(0/1)、部分是 Boolean，
 *      按字段原类型改写，避免反序列化失败
 *   3. 深度递归解锁：不仅 refBusinessList，任何嵌套对象/数组中的
 *      isLock / isVip / isHave 等字段一律改写
 * 使用声明：仅供学习交流，请于下载后 24 小时内删除，勿商用传播。
 */

/*
 * ── Quantumult X ──────────────────────────────────────────
[rewrite_local]
# 伴学课堂（匹配全部业务接口，含 vip/getAppUserVip 等）
^https?:\/\/api\.banxueketang\.com\/api\/classpal\/app\/v1 url script-response-body banxueketang.vip.js

[mitm]
hostname = api.banxueketang.com
 * ───────────────────────────────────────────────────────────
 */

/*
 * ── Surge ─────────────────────────────────────────────────
[Script]
http-response ^https?:\/\/api\.banxueketang\.com\/api\/classpal\/app\/v1 script-path=banxueketang.vip.js, requires-body=true

[MITM]
hostname = %APPEND% api.banxueketang.com
 * ───────────────────────────────────────────────────────────
 */

/*
 * ── Loon / Shadowrocket ───────────────────────────────────
[Script]
http-response ^https?:\/\/api\.banxueketang\.com\/api\/classpal\/app\/v1 script-path=banxueketang.vip.js, requires-body=true

[MITM]
hostname = api.banxueketang.com
 * ───────────────────────────────────────────────────────────
 */

var body = $response.body;
if (!body) return $done({});

try {
    var obj = JSON.parse(body);
    if (obj && typeof obj === 'object') {
        unlock(obj);
        // 投屏等 SKU 权益接口（兼容安卓 IsRights / iOS UserIsRights）：强制注入权益解锁字段
        if ($request && $request.url && $request.url.indexOf('getFunctionsSku') >= 0) {
            forceUnlockSku(obj);
        }
    }
    body = JSON.stringify(obj);
} catch (e) {
    // 容错分支：非标准 JSON 结构时按文本兜底替换
    body = body
        .replace(/"isVip":(false|0)(?=[,}])/g, '"isVip":1')
        .replace(/"isHave":(false|0)(?=[,}])/g, '"isHave":1')
        .replace(/"isLock":(true|1)(?=[,}])/g, '"isLock":false')
        .replace(/"vipStatus":1(?=[,}])/g, '"vipStatus":2')
        .replace(/"memberCardCode":null(?=[,}])/g, '"memberCardCode":"svip"');
}

$done({ body: body });

/*
 * 深度解锁：遍历整棵 JSON 树，字段存在即改写。
 * 字段名参考 1.6.82 反编译结果：
 *   CurseTabListInfoData / UserInfo / UserVipInfo / UserVipData / MaterialInfoBean
 */
function unlock(data) {
    if (!data || typeof data !== 'object') return;

    if (Object.prototype.toString.call(data) === '[object Array]') {
        for (var i = 0; i < data.length; i++) unlock(data[i]);
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
    for (var key in data) {
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
 */
function forceUnlockSku(data) {
    if (!data || typeof data !== 'object') return;
    var list = (data.data && Array.isArray(data.data)) ? data.data : (Array.isArray(data) ? data : [data]);
    for (var i = 0; i < list.length; i++) {
        var item = list[i];
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
