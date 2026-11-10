"use strict";
// 11주차 실습: JSON 파일을 fetch()로 읽어 실제 화면 입력값에 적용합니다.
// AI 생성 및 토큰/응답시간 측정과는 별개의 기능입니다.
(async function initNpcDataset() {
  const select = document.getElementById('datasetSelect');
  const apply = document.getElementById('datasetApply');
  const status = document.getElementById('datasetStatus');
  const preview = document.getElementById('referenceAnswer');
  let items = [];

  try {
    const response = await fetch('./data/npc_samples.json', {cache:'no-cache'});
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const result = await response.json();
    if (!Array.isArray(result.items)) throw new Error('JSON에 items 배열이 없습니다.');
    items = result.items.filter(x => x && typeof x.userMessage === 'string');
    if (!items.length) throw new Error('사용할 수 있는 대화 데이터가 없습니다.');
    select.replaceChildren(new Option('NPC 대화를 선택하세요', ''));
    items.forEach((item, index) => {
      select.add(new Option(`${item.id} · ${item.npcName} · ${item.userMessage.slice(0,30)}`, String(index)));
    });
    select.disabled = false;
    status.textContent = `${items.length}건을 JSON 파일에서 불러왔습니다. NPC 대화를 선택해 주세요.`;
  } catch (error) {
    select.replaceChildren(new Option('데이터 로딩 실패', ''));
    status.textContent = 'JSON 불러오기 실패: ' + error.message + ' (Live Server 또는 로컬 서버로 실행하세요)';
    return;
  }

  select.addEventListener('change', () => {
    const item = items[Number(select.value)];
    const valid = select.value !== '' && !!item;
    apply.disabled = !valid;
    preview.textContent = valid ? item.referenceAnswer || '참고 답변 없음' : 'NPC 데이터를 선택하면 원본 참고 답변이 나타납니다.';
  });
  apply.addEventListener('click', () => {
    if (select.value === '') return;
    const item = items[Number(select.value)];
    if (!item) return;
    document.getElementById('npcType').value = '마을 주민';
    document.getElementById('npcName').value = item.npcName || 'NPC';
    document.getElementById('npcPrompt').value = item.systemPrompt || '';
    document.getElementById('dialogue').value = item.userMessage;
    status.textContent = `${item.id}를 입력창에 적용했습니다. 아래의 NPC 설정과 질문을 확인하세요.`;
  });
})();
