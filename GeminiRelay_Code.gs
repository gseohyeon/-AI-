/**
 * NPC 비용 절감 프로젝트 - Gemini API 연동 전용 Google Apps Script
 * 기존 회원가입 Code.gs와 분리된 새 Apps Script 프로젝트에 복사하세요.
 * 프로젝트 설정 > 스크립트 속성: GEMINI_API_KEY = (Google AI Studio API key)
 * 배포 > 새 배포 > 웹 앱 > 실행 사용자: 나 / 액세스: 모든 사용자
 * 공개 데모 전용: 누구나 웹 앱 URL을 호출할 수 있으므로 일일 호출 제한을 둡니다.
 */
const NPC_MODEL = 'gemini-3.1-flash-lite';
const NPC_MAX_PROMPT_CHARS = 8000;
const NPC_DAILY_LIMIT = 120; // 조별 데모용 한도, 필요에 맞춰 변경

function doGet() {
  return npcJson_({success:true, message:'NPC Gemini relay ready', model:NPC_MODEL});
}

function doPost(e) {
  try {
    const request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (request.action !== 'generate') throw new Error('허용되지 않은 요청입니다.');
    const prompt = String(request.prompt || '').trim();
    if (!prompt || prompt.length > NPC_MAX_PROMPT_CHARS) {
      throw new Error('프롬프트는 1~' + NPC_MAX_PROMPT_CHARS + '자여야 합니다.');
    }
    const key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (!key) throw new Error('Apps Script 스크립트 속성 GEMINI_API_KEY가 비어 있습니다.');

    npcUseDailyQuota_();
    const requestBody = {
      contents: [{role:'user', parts:[{text:prompt}]}],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
        thinkingConfig: {thinkingLevel:'minimal'}
      }
    };
    const t0 = Date.now();
    const response = UrlFetchApp.fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + NPC_MODEL + ':generateContent',
      {
        method:'post',
        contentType:'application/json',
        headers:{'x-goog-api-key':key},
        payload:JSON.stringify(requestBody),
        muteHttpExceptions:true
      }
    );
    const code = response.getResponseCode();
    const result = JSON.parse(response.getContentText() || '{}');
    if (code < 200 || code >= 300) {
      const apiMessage = (result.error && result.error.message) || 'Gemini API 요청 실패';
      throw new Error('Gemini API HTTP ' + code + ': ' + apiMessage);
    }
    const candidate = (result.candidates || [])[0] || {};
    const parts = (candidate.content && candidate.content.parts) || [];
    const answer = parts.map(part=>part.text || '').join('').trim();
    if (!answer) throw new Error('Gemini 응답 텍스트가 비어 있습니다: '+ (candidate.finishReason || '원인 미상'));
    const usage = result.usageMetadata || {};
    if (!Number.isFinite(usage.promptTokenCount) || !Number.isFinite(usage.candidatesTokenCount)) {
      throw new Error('Gemini 응답에 실측 사용량(usageMetadata)이 없습니다.');
    }
    return npcJson_({
      success:true,
      model:result.modelVersion || NPC_MODEL,
      response:answer,
      prompt_eval_count:usage.promptTokenCount,
      eval_count:usage.candidatesTokenCount + (usage.thoughtsTokenCount || 0),
      server_latency_ms:Date.now()-t0
    });
  } catch (err) {
    return npcJson_({success:false,error:String(err.message || err)});
  }
}

function npcUseDailyQuota_() {
  const props = PropertiesService.getScriptProperties();
  const day = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd');
  const key = 'npc_calls_' + day;
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const count = Number(props.getProperty(key) || 0);
    if (count >= NPC_DAILY_LIMIT) {
      throw new Error('프로젝트 데모의 일일 API 호출 제한(' + NPC_DAILY_LIMIT + '회)에 도달했습니다.');
    }
    props.setProperty(key, String(count + 1));
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function npcJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
