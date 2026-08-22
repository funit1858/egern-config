/**
 * 天天跳绳 - 内页广告配置清空脚本 (Egern http_response)
 * 用于 api2/ad_sys/inner_ad_config、homework_inner_ad_config，
 * 返回空配置使内页(详情页底部/作业页)信息流广告无位可展示。
 */
export default async function (ctx) {
  try {
    const resp = await ctx.response.json();
    const body = resp && typeof resp === 'object' && ('data' in resp) ? resp.data : resp;
    if (body && typeof body === 'object') {
      for (const k of Object.keys(body)) {
        if (Array.isArray(body[k])) body[k] = [];
        else if (body[k] && typeof body[k] === 'object') body[k] = null;
        else if (typeof body[k] !== 'number') body[k] = body[k]; // 保留数值字段
      }
      return { body: resp };
    }
  } catch (e) { /* 解析失败透传 */ }
}
