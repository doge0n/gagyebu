# 가계부

매주 일요일에 한 주 지출을 몰아서 기록하고, 월간 달력과 여행별로 확인하는 개인용 가계부.
브라우저(localStorage)에 저장하고, 설정에서 로그인하면 Firebase로 기기 간 자동 동기화됩니다. JSON 백업도 됩니다.

## 실행

```bash
npm install      # 처음 한 번
npm run dev      # 개발 서버 → http://localhost:5173
npm test         # 단위 테스트
npm run build    # 배포용 빌드 → dist/
npm run preview  # 빌드 결과 미리보기 (설치·오프라인 확인용)
```

## 화면

| 탭 | 내용 |
|---|---|
| 달력 | 월간 히트맵 달력, 여행 띠, 날짜별 상세(수정·삭제·추가), 월 총액·카테고리 비율·예산·주말/평일·6개월 추이 |
| 주간 입력 | 월~일 7일, 한 칸 입력(`4500 스벅`, `교통 2 숙박 5 술 3`), 자주 쓰는 내역, 일괄 여행 태그, 주간 합계 |
| 여행 | 여행 카드, 같은 지역 회차 비교(1회 평균), 여행 상세 |
| 설정 | 입력 옵션, 예산, 카테고리, 자주 쓰는 내역, 화면 모드, 백업, 초기화 |

## 배포 (무료, 둘 중 하나)

데이터는 서버로 가지 않습니다. 올라가는 건 화면(정적 파일)뿐이고 기록은 각 기기 브라우저에만 저장됩니다.

### A. Netlify Drop — 가장 쉬움 (Git 필요 없음)
1. `npm run build`
2. https://app.netlify.com/drop 에 `dist` 폴더를 끌어다 놓기 (Netlify 무료 계정 필요)
3. 나온 주소(예: `https://xxxx.netlify.app`)를 휴대폰에서 열기
4. 고친 뒤 다시 올릴 때: 사이트 → Deploys → `dist` 폴더를 다시 끌어다 놓기

### B. GitHub Pages — push하면 자동 배포
1. GitHub에 저장소를 만들고 이 폴더를 push (`main` 브랜치)
2. 저장소 Settings → Pages → Source: **GitHub Actions**
3. 이후 `main`에 push할 때마다 `.github/workflows/deploy.yml`이 테스트·빌드·배포
4. 주소: `https://<아이디>.github.io/<저장소이름>/`

## 휴대폰에 앱처럼 설치

- **iPhone (Safari)**: 주소 열기 → 공유 버튼 → **홈 화면에 추가**
- **Android (Chrome)**: 주소 열기 → 메뉴(⋮) → **앱 설치** 또는 **홈 화면에 추가**

설치하면 주소창 없이 열리고, 인터넷이 없어도 동작합니다. 새 버전을 배포하면 다음에 열 때 자동으로 바뀝니다.

## 자동 동기화 (Firebase)

- 설정 → 자동 동기화에서 이메일/비밀번호로 로그인하면 같은 계정의 기기끼리 실시간으로 맞춰집니다.
- Firebase 프로젝트: `gagyebu-4dba4` (Spark 무료 요금제). 설정값은 `src/sync/config.ts`, 보안 규칙은 본인 uid 문서만 읽기/쓰기.
- 저장 구조: `users/{uid}/items/{종류_id}` = `{ data, del, at }`. 삭제는 `del: true`로 남겨 다른 기기에 전달.
- 처음 로그인하는 기기에 기록이 있으면 "합치기 / 클라우드 것만 쓰기"를 묻습니다. 화면 모드는 기기마다 따로입니다.
- 로컬 테스트: `VITE_FIREBASE_EMULATOR=1 npm run dev` + Firebase 에뮬레이터(auth 9099, firestore 8080).

## 데이터 주의사항

- **기기·브라우저마다 데이터가 따로**입니다. PC → 휴대폰은 설정 → 백업 → **내보내기**로 만든 JSON 파일을
  iCloud Drive/구글 드라이브에 저장하고, 휴대폰에서 **가져오기**하세요. 가져오기는 데이터를 통째로 바꿉니다.
- **iPhone에서는 홈 화면 앱과 Safari 탭의 저장소가 서로 다릅니다.** 설치했다면 앞으로는 홈 화면 앱만 쓰고,
  백업 파일도 홈 화면 앱에서 가져오세요. (Safari 탭은 오래 안 열면 데이터가 지워질 수 있지만, 홈 화면 앱은 그렇지 않습니다.)
- 브라우저의 "사이트 데이터 삭제"를 하면 기록이 지워집니다. 가끔 내보내기로 백업해 두세요.

## 구조

```
src/
├─ types.ts              데이터 모델 (Expense, Trip, Category, QuickItem, Settings)
├─ lib/                  금액 인식(money), 한 줄 입력(quickLine), 날짜(date), 집계(stats), 색(palette)
├─ store/                Zustand 스토어(useStore), 백업 검증(storage), 기본값, 샘플 데이터
├─ components/           공통 UI (시트, 토스트, 수정 폼, 여행 선택, 카테고리 막대 등)
└─ features/             weekly / calendar / trips / settings 화면
```

나중에 PC·휴대폰 자동 동기화가 필요하면 `store/useStore.ts`의 `persist` 저장소만 클라우드용으로 바꾸면 됩니다.
