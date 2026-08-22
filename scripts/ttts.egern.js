/**
 * 天天跳绳 去广告脚本 (Egern http_response)
 * 原理：改写服务端下发的广告总配置 api2/abtest/ads_v2，
 *       让 App 认为当前是"会员免广告"且没有任何广告位。
 * 保留：激励视频(看视频领能量豆)接口 video_energy_bean/* 不受影响。
 */
export default async function (ctx) {
  try {
    const resp = await ctx.response.json();
    // BaseResponse<AbtestAds> 结构: { code, msg, data:{...} }；兼容裸结构
    const body = resp && typeof resp === 'object' && ('data' in resp) ? resp.data : resp;
    if (body && typeof body === 'object') {
      // 1. 会员免广告标志 → 走官方"会员不弹广告"逻辑
      body.member_ad_free = true;

      // 2. 热启动广告(切后台回来弹的开屏) → 关闭
      if ('open_hot_position' in body) body.open_hot_position = null;

      // 3. 插屏广告位 → 清空
      if ('insert_positions' in body) body.insert_positions = null;
      if ('hybrid_positions' in body) body.hybrid_positions = [];

      // 4. 广告位 ID 下载源 → 置空，阻止拉取新广告位 ID
      if ('ids_resource' in body) body.ids_resource = null;

      // 5. 广告追踪 / hook 自检 → 关闭
      if ('tracking_enabled' in body) body.tracking_enabled = false;
      if ('ad_hook' in body) body.ad_hook = false;

      ctx.notify?.({
        title: '天天跳绳',
        body: '广告配置已拦截 (member_ad_free=true)',
        sound: false,
        duration: 2,
      });
    }
    return { body: resp };   // Object 会自动 JSON 序列化
  } catch (e) {
    // 解析失败则透传，不影响正常使用
    return;
  }
}
