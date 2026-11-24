# NPC 비용 절감 프로젝트: Gemini 연동 안내 (2026-11-24)

## 판정
- 추천 모델: Google `gemini-3.1-flash-lite` (무료 API 한도 내에서 실습 가능)
- GitHub Pages는 HTML/CSS/JS와 JSON은 제공하지만 `/api/generate` 같은 API 서버를 직접 실행하지 못함
- 이 수정본은 기존 `index.html`의 Ollama 호출만 Gemini 중계 호출로 바꿈
- 회원가입/로그인은 기존 `Code.gs` 및 기존 배포 URL을 그대로 사용함
- 요금: **무료 API 실제 결제 0달러**. 화면의 입력 0.25 / 출력 1.50 달러는 **유료 Standard 가상 단가(100만 토큰당)**. 다른 계정·요금제에는 다를 수 있음.

## 따라하기
1. https://aistudio.google.com/apikey 에서 무료 Gemini API 키를 발급한다. (무료 등급 자격과 제한은 계정마다 다를 수 있다.)
2. https://script.google.com/home 에서 **새 프로젝트**를 생성한다. 기존 `Code.gs`가 있는 로그인 프로젝트를 수정하지 않는다.
3. 새 프로젝트의 기본 `.gs` 파일에 `GeminiRelay_Code.gs`의 전체 내용을 붙여 넣는다.
4. 왼쪽 프로젝트 설정(톱니바퀴) → **스크립트 속성** → 속성 추가: 이름 `GEMINI_API_KEY`, 값에는 발급받은 **API 키 문자열**을 적고 저장한다. 키를 `index.html`이나 GitHub에 기록하면 안 된다.
5. 배포 → 새 배포 → 유형 **웹 앱**, 실행 사용자 **나**, 액세스 가능한 사용자 **모든 사용자** 선택 → 승인 → 배포한다.
6. 발급된 **새 웹 앱의 /exec URL**을 복사한다. (기존 회원가입용 웹 앱 URL과는 다른 URL이다.)
7. `index.html`에서 다음 코드를 검색한다: `const GEMINI_PROXY_URL = 'PASTE_YOUR_GEMINI_WEB_APP_URL_HERE';` → 따옴표 안에 새 URL을 넣는다.
8. 수정한 `index.html`을 **기존 GitHub 저장소의 루트에 올린 뒤** Pages 배포 완료를 확인한다. JS/CSS/JSON 파일은 삭제하거나 이동할 필요가 없다.
9. 웹사이트 로그인 → NPC 설정 확인 → `각 방식 반복 실행 횟수`를 **3**으로 설정 → **3개 방식 모두 실행**을 눌러 토큰·시간·캐시 결과를 확인한다. 처음에는 업로드 JSON 없이 1개 시나리오만 실험한다.
10. 결과 페이지에서 답변 품질 평가 후 CSV를 내려받는다.

## 확인할 결과
- 기본 방식: 입력/출력 토큰 값(0이 아닌 실측값)과 실제 왕복 지연시간
- 캐싱 방식: 첫 호출 후 동일한 프롬프트의 재호출은 `캐싱 (적중)`, **신규 API 토큰 0개**, 거의 0ms에 가까운 로컬 검색 시간
- 프롬프트 축약: 기본 방식보다 입력 토큰이 적은지 확인. **출력의 품질**은 반드시 팀원이 검사
- CSV의 비용은 실제 청구액이 아니라 *유료 단가로 계산한 추정 비용*이며, 실측값은 토큰과 지연시간임
- 세 방법의 호출 순서에 따른 네트워크 상태 등의 영향을 줄이려면 같은 데이터로 여러 번 실행하고 평균을 비교

## 주의 / 알려진 한계
- **실제 API 키 없음**: 이 ZIP 파일은 이미 호출되는 상태가 아님. 팀원이 키 발급·Apps Script 배포·URL 입력을 완료해야 함.
- **공개 호출 위험**: 웹 앱을 모두에게 공개하면 누구나 URL을 호출해 무료 호출 한도를 소비할 수 있다. 예제에는 120회/일 제한을 넣었지만 사용자 인증이나 남용 방지가 완벽하지 않다. 외부 공개 전에는 Cloudflare Workers 등 접근제어 가능한 별도 서버로 옮기는 것이 좋다.
- **CORS/리디렉션**: Google Apps Script의 ContentService는 리디렉션이 있어 GitHub Pages 브라우저 환경에서 CORS 또는 JSON 오류가 날 수 있다. 기존 로그인은 같은 방식으로 동작했다는 프로젝트 기록이 있지만, 새 앱도 동일하게 된다는 보장은 없다. 이때는 Network 탭의 오류를 확인하고, 안정적인 CORS 설정이 가능한 Cloudflare Worker 같은 중계 서버로 전환해야 한다.
- 무료 API는 RPD/RPM/TPM 제한이 있고 계정에 따라 다르다. 429 오류가 뜨면 `https://aistudio.google.com/rate-limit`에서 프로젝트의 사용 한도 확인.
- 비용표는 2026-11-24 기준. `https://ai.google.dev/gemini-api/docs/pricing`에서 모델 단가 변경 확인.
- 무료 API 사용 데이터는 Google 제품 개선에 이용될 수 있어, 실습 데이터에 개인정보·비공개 게임 시나리오를 넣지 않는다.
- `js/script.js`는 현재 `index.html`에서 **불러오지 않는 이전 코드**임. 이 파일만 수정해도 실제 서비스는 바뀌지 않는다.
- `data/npc_samples.json`은 참고 NPC 대화 데이터 40건. 데이터 로드는 모델 실행과 별개이다.
- 캐시는 브라우저 세션의 메모리(`Map`)에 저장된 **완전일치 답변 캐시**. Gemini 공급자 차원의 입력 캐싱과는 다르다.
- 현재 로그인 표시/기록은 브라우저 저장소 기반이므로 인증된 서버 사용자 확인 용도로 쓰면 안 된다.

## 공식 출처
- Gemini API 가격: https://ai.google.dev/gemini-api/docs/pricing
- 사용량 제한 확인: https://ai.google.dev/gemini-api/docs/rate-limits
- Apps Script API 호출(공식 실습): https://codelabs.developers.google.com/codelabs/gemini-workspace
- Apps Script 외부 API 호출: https://developers.google.com/apps-script/guides/services/external
- Apps Script ContentService: https://developers.google.com/apps-script/reference/content/content-service
