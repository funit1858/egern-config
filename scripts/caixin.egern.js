/*
 * 财新 App v8 会员/正文解锁（Egern 版 · ctx API）
 * ─────────────────────────────────────────────
 * 适配：财新 App 8.6.0（com.caixinmedia.client）
 * 原理（逆向自 v8 前端 index.js）：
 *   - v8 的 newValidate 鉴权接口响应已加密（authData 字段），无法直接改响应
 *   - 但前端页面初始化还有一个明文接口 /app-api/userAuth/checkUserAndLoginRead
 *     只要登录（UID+USER_LOGIN_CODE）就返回 code:0 + articleProperties.content 完整正文
 *     （服务端只校验登录状态，不校验订阅）
 *   - 方案：在 articlev5 页面注入 JS，页面加载后 fetch 该接口，把正文渲染进
 *     #cx-cons 容器并标记 body.expand，绕过付费墙
 * 只改响应不改请求；解析失败一律透传，不破坏 App。仅供学习交流。
 */

export default async function (ctx) {
  try {
    const url = ctx.request.url || '';

    // ---- articlev5 正文页：注入解锁脚本 ----
    if (/mappsv5\.caixin\.com\/articlev5\//.test(url)) {
      const text = await ctx.response.text();
      if (!text) return;

      const inject = `
<script>
(function() {
  if (window.__CX_UNLOCKED__) return;
  window.__CX_UNLOCKED__ = true;
  function getCookie(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function unlock() {
    var uid = getCookie('UID') || getCookie('SA_USER_UID');
    var code = getCookie('USER_LOGIN_CODE');
    var sourceId = (document.getElementById('source_id') || {}).value;
    if (!uid || !code || !sourceId) return;
    fetch('/api/app-api/userAuth/checkUserAndLoginRead?uid=' + encodeURIComponent(uid) + '&code=' + encodeURIComponent(code) + '&unit=1&deviceType=1&sourceId=' + sourceId, {credentials: 'include'})
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d && d.code === 0 && d.data && d.data.articleProperties && d.data.articleProperties.content) {
          var cons = document.getElementById('cx-cons');
          if (cons) {
            cons.innerHTML = d.data.articleProperties.content;
            document.body.classList.add('expand');
            document.title = '[UNLOCKED] ' + document.title;
          }
        }
      }).catch(function(e) {});
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', unlock);
  } else {
    unlock();
  }
})();
</script>
`;
      // 在 </body> 前注入（或 </html> 前）
      let out;
      if (text.includes('</body>')) {
        out = text.replace('</body>', inject + '</body>');
      } else if (text.includes('</html>')) {
        out = text.replace('</html>', inject + '</html>');
      } else {
        out = text + inject;
      }
      return { body: out };
    }
  } catch (e) {}
  // 不返回 → 透传
}
