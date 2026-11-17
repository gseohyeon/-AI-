const SPREADSHEET_ID = '1DrpJWnVoIYwVY7tUOjMlsRGsHa4OJiVONeaQRoZ5g9Y';
const SHEET_NAME = '회원정보';
const HEADERS = ['회원 ID', '닉네임', '비밀번호 Salt', '비밀번호 Hash', '가입 일시', '최근 로그인 일시', '계정 상태'];

function getMemberSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet() {
  return json_({ success: true, message: 'EOM Join API is running' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(data.action || '');
    const nickname = String(data.nickname || '').trim();
    const sheet = getMemberSheet_();
    const rows = sheet.getDataRange().getValues();

    if (!nickname || nickname.length < 2 || nickname.length > 24 || /\\s/.test(nickname)) {
      throw new Error('닉네임은 공백 없이 2~24자로 입력해 주세요.');
    }

    if (action === 'register') {
      const salt = String(data.salt || '');
      const passwordHash = String(data.passwordHash || '');
      if (!salt || !passwordHash) throw new Error('비밀번호 정보가 누락되었습니다.');
      const duplicate = rows.slice(1).some(r => String(r[1]) === nickname && String(r[6]) === '활성');
      if (duplicate) throw new Error('이미 사용 중인 닉네임입니다.');
      const memberId = Utilities.getUuid();
      sheet.appendRow([memberId, nickname, salt, passwordHash, new Date(), '', '활성']);
      return json_({ success: true, nickname: nickname, memberId: memberId });
    }

    if (action === 'getSalt') {
      const index = rows.findIndex((r, i) => i > 0 && String(r[1]) === nickname && String(r[6]) === '활성');
      if (index < 0) throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
      return json_({ success: true, salt: String(rows[index][2]) });
    }

    if (action === 'verifyLogin') {
      const passwordHash = String(data.passwordHash || '');
      const index = rows.findIndex((r, i) => i > 0 && String(r[1]) === nickname && String(r[6]) === '활성');
      if (index < 0) throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
      const row = rows[index];
      if (String(row[3]) !== passwordHash) throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
      sheet.getRange(index + 1, 6).setValue(new Date());
      return json_({ success: true, nickname: nickname, memberId: String(row[0]) });
    }

    throw new Error('지원하지 않는 요청입니다.');
  } catch (err) {
    return json_({ success: false, message: err.message || '서버 오류가 발생했습니다.' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
