// 模拟 Egern ctx API 测试财新脚本
import fs from 'fs';

const scriptCode = fs.readFileSync('./scripts/caixin.egern.js', 'utf-8');

// 把 export default function 转成模块字符串执行
const moduleCode = scriptCode.replace('export default', 'export const handler =');
const dataUrl = 'data:text/javascript;base64,' + Buffer.from(moduleCode).toString('base64');
const mod = await import(dataUrl);

function mockCtx(url, bodyText) {
  return {
    request: { url },
    response: {
      text: async () => bodyText,
    },
    env: {},
  };
}

function printResult(label, result, before, after) {
  console.log(`\n=== ${label} ===`);
  if (result && result.body) {
    console.log('脚本返回 body');
    if (typeof result.body === 'string') {
      console.log('返回字符串片段:', result.body.slice(0, 120).replace(/\n/g, ' '));
    } else {
      console.log('返回对象:', JSON.stringify(result.body, null, 2).slice(0, 400));
    }
  } else {
    console.log('脚本未返回（透传）');
  }
}

// 测试 1: newValidate 响应
const newValidateUrl = 'https://gateway.caixin.com/api/app-api/auth/newValidate';
const newValidateBody = JSON.stringify({
  data: {
    info: { errorCode: 7, power: 0, tipsMsg: 'xxx', redmsg: '' }
  }
});
let result = await mod.handler(mockCtx(newValidateUrl, newValidateBody));
printResult('newValidate', result, newValidateBody);

// 测试 2: articlev5 HTML
const articleUrl = 'https://mappsv5.caixin.com/articlev5/7233/1057233.html?noImg=0';
const articleBody = `<!DOCTYPE html><html><head><title>两市成交额重回万亿元 6只...</title></head><body><script>var isFree=1; var need_login=1;</script></body></html>`;
result = await mod.handler(mockCtx(articleUrl, articleBody));
printResult('articlev5', result, articleBody);

// 测试 3: get_user_power
const powerUrl = 'https://mapiv5.caixin.com/android/user/get_user_power';
const powerBody = JSON.stringify({ code: -1, msg: 'fail' });
result = await mod.handler(mockCtx(powerUrl, powerBody));
printResult('get_user_power', result, powerBody);

// 测试 4: getUserPowerArticlesV2
const articlesUrl = 'https://gateway.caixin.com/api/purchase/user/getUserPowerArticlesV2';
const articlesBody = JSON.stringify({ data: { power: { errorCode: 7, power: 0, subscribe_list: [] } } });
result = await mod.handler(mockCtx(articlesUrl, articlesBody));
printResult('getUserPowerArticlesV2', result, articlesBody);
