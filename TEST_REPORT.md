# 작업대 통합 검증 — 2026-11-04

현재 변경은 `495c7df` 이후의 작업대 확장이다. 아래2026-11-03 결과는 이전 릴리스 기록이며 현재 변경의 통과 근거로 대신하지 않는다. 원문 AC별 현재 결과는 [81개 근거표](docs/ac-evidence-2026-11-04.md)를 따른다.

현재 검증: 타입/린트 종료0, 단위·통합162개(22파일) 종료0. 의도적 TS2322 음성 검사는 종료1, 임시 파일 제거 후 정상 타입 검사는 종료0. 런타임 audit0, 개발 moderate10은 기존 단일 minimatch advisory 전파로 동일하다.

최초 전체 브라우저 실행은266개 중264통과/2실패(종료1)였다. 실패는 양쪽 브라우저의 같은 기존 건축 편집 테스트였다.3D에서도 속성 패널을 유지하도록 변경됐는데, 테스트가 복귀 후 열린 details를 다시 클릭하여 닫은 뒤 내부 버튼을 기다렸다. 토글을 제거하고 패널이 열린 상태임을 직접 검증하도록 수정했다. 제한시간/재시도/제품 검증 조건은 완화하지 않았다. 해당 기존 시나리오 및 새 구조 드래그 blur/뷰/프로젝트 교체 취소는 집중10/10(종료0)으로 확인했다. 최종 전체 결과는 아래 완료 기록을 따른다.

독립 리뷰로 XML 비허용 문자 처리, 낮은 방의 기둥 DnD 후보 높이 일치, 다중 선택 생존자 보존, 구조 폼 삭제/드래프트 유지, 무효 프리뷰 색, 미세 흔들림/오른쪽 버튼 방어를 보완했다.3D blur/pointercancel/프로젝트 교체 취소도 집중 회귀로 확인했다. 한 번 관측됐던 Firefox React 렌더 경고는 전체 실행과 개발 서버의 실제 여정에서 재현되지 않았으며 원인을 확정하지 않았다.

## 작업대 최종 로컬 게이트

| 실행 명령 | 종료 코드 / 결과 |
|---|---|
| npm run typecheck | 0 (TS2322 음성 검사1, 복구 후0) |
| npm run lint | 0 |
| npm run test | 0, 162개 / 22파일 |
| npm run test:e2e -- --workers=1 | 0, Chromium/Firefox272개, 3.5분 |
| RUN_CHROME=1 npx playwright test (건축·기둥·보관함·3D 대표4파일) --workers=1 --project=chrome | 0, 설치된 Chrome156.0.8078.80에서25개 |
| VITE_BASE_PATH=/roomfit-3d/ npm run build | 0, 단일 최종 빌드 |
| VITE_BASE_PATH=/roomfit-3d/ npm run check:dist | 0, 26참조 / 7JS 검사 |
| npm run test:e2e:subpath | 0, 2개; 검사 전후 dist10개 SHA256 동일 |
| node scripts/verify-live.mjs http://127.0.0.1:4175/roomfit-3d/ | 0, Chromium/Firefox 실제 production 여정 |
| 설치된 Chrome production 분할 보기390/800/1023px | 0, 두 캔버스 표시 및 가로 overflow 없음(뷰포트 에뮬레이션) |

명령별 종료코드와 최종 파일 해시는 [검증 기록](docs/verification-2026-11-04.json), 실제 렌더 측정은 [성능 기록](docs/performance-2026-11-04.json)에 보존했다. Chromium SwiftShader에서 마지막 CPU 제출0.5ms/프레임 간격16.7ms, Firefox Apple M1 계열에서6ms/16ms였고 두 장면은553 draw calls/4180 triangles였다. GPU 완료 측정이나 지속30fps 보장이 아니다.

원문 SHA256은 `25cabf1861d7e9fe305cfbd328a8e7aabf4b6f95d5683cb3ee1dc265edb21065`로 Downloads 원본과 동일하다. 실제 Safari·스크린리더·물리 입력장치와 AC별 구체적인 잔여 증거는 최신 근거표의 부분 검증 항목으로 남긴다. Edge는 설치·실행하지 않았다. 원격 배포 결과는 완료 후 추가한다.

---

# 검증 보고서 — 2026-11-03 최종 보완

현재 코드 반영 커밋은 `cb84a44651792d1644fea1f6e850f609e284a15f`이며, 클라이언트 구현 커밋은 `319f6c0`이다. 기존의 일괄 통과 표시를 대신하는 기준별 원문·코드·검증·남은 조항은 [81개 AC 근거표](docs/ac-evidence-2026-11-03.md)다. 원문 파일은 수정하지 않았고 Downloads 원본과 SHA256이 같다.

## 실제 실행 결과

| 명령/대상 | 종료 코드와 결과 |
|---|---|
| npm ci | 종료0; jsdom27.4.0, whatwg-encoding 제거 |
| npm run typecheck | 종료0; 별도 고의 TS2322는 종료1, 즉시 제거 후 종료0 |
| npm run lint | 종료0 |
| npm run test | 종료0, 126개 / 16파일; main 병합 후도126개 종료0 |
| npm run test:e2e -- --workers=1 | 종료0, Chromium/Firefox154개 (2.0분) |
| VITE_BASE_PATH=/roomfit-3d/ npm run build | 종료0, 최종 클라이언트 수정 후 빌드 |
| VITE_BASE_PATH=/roomfit-3d/ npm run check:dist | 종료0, 26참조/7JS 검사 |
| npm run test:e2e:subpath | 종료0, 같은 dist에서 Chromium/Firefox2개 |
| 기존 설치된 실제 Chrome 대표 시나리오 | 종료0, 15개 |
| node scripts/verify-live.mjs — 로컬 production4175 | 종료0, Chromium/Firefox의 P0 및 확장 기능 여정 |
| npm audit --omit=dev --json | 종료0, 취약점0 |
| [Pages Actions41643720875](https://github.com/muminjun/roomfit-3d/actions/runs/41643720875) | success, cb84a44 main push / deploy job125943459722 전체 단계 성공 |

최종 전체 E2E의 로그는 `/tmp/roomfit-final-e2e-recorded.log`, 보존된 종료코드는 `/tmp/roomfit-final-e2e-exit-code.txt`의0이다. 병렬 부하가 있던 이전 전체 실행은153통과/1지연 실패였고, 테스트와 기본 대기 시간을 바꾸지 않은 해당 시나리오 재실행1/1, 단독 전체154/154, 종료코드 보존 전체154/154가 차례로 통과했다. 최초 지연의 원인은 확정하지 않았으며 아래 이력에서 숨기지 않는다. 재시도 설정·시간제한·검증 조건을 느슨하게 바꾸지 않았다.

최종 dist10개 파일의 SHA256은 서브경로 검사 전후 같으며 [build-evidence](docs/build-evidence-2026-11-03.json)에 있다. Actions는 base를 적용해 한 번 빌드하고 검사한 동일 dist를 업로드한다.

## 재현과 해결

- Space/중간 버튼 팬이 가구/핸들 편집보다 우선한다. Space에서 X2100→2700으로 바뀌던 실패를 먼저 재현했다. 팬 중 도구 변경으로 draggable이 복원되는 별도 실패도 재현해 보완했다.
- Shift 가로 드래그의 Y1755→1800 스냅 실패를 먼저 재현하고, 스냅 후 고정 축을 정확히 보존했다. 반 mm/홀수/90도/스냅OFF와 Undo1건·취소0건을 확인했다.
- Shift+2 가구 맞춤, draft 취소 후 idle Esc 선택 해제, 키보드 실패 사유/겹친 가구 이름, 선택 가구 기준 Alt 측정과 벽 호버를 보완했다. Undo 중 stale drag 재확정도 재현해 차단했다.
- 사용자 요청에 따라 공간이 부족한 회전은 확정하고 파생 배치 경고를 남긴다. 이는 원문 무효 회전 금지의 명시적인 변경이다. 이동/리사이즈/새 배치의 유효 최종 상태 계약은 유지한다.
- 칸막이·문/현관문·창문·화장실/주방/현관 등의 계획 구역, 실제3D 개구부,45종 카탈로그, 가구/가전 여는 공간을 추가했다. 경첩/열림 방향·개구부 하단 높이와 가구 여유 치수를 설정할 수 있다.
- 리뷰에서 교차 벽까지 개구부가 지우는 문제,64칸막이/100개구부의 전역 격자 폭발, CCW JSON 문 위치 변경, 무효 개구부의 충돌/3D 불일치를 재현해 고쳤다. 오목한 방의 외벽 실내 침범도 별도 회귀로 보완했다.
- 독립 welcome/유효 저장본 이어하기, 방 속성 진입, 상태바, 썸네일/툴팁, 반응형과 실제 Tab/Enter 여정을 보완했다. 첫 welcome JSON import가 편집기로 진입하지 않던 연결 누락도 실패 후 수정했다.

## 한계와 남은 확인

각 AC의 전체 문구를 직접 확인했는지는 근거표를 따른다. 부분 검증은 코드 누락 개수와 같지 않으며, 구체적인 미실행 조합/수동 확인 조항을 남겼다. S6 AC52–60은 제외한다. 독립된 여러 방의 연결 모델·여러 층·AI·GLB·로그인/서버는 구현 범위가 아니다.

Edge는 사용자 지시로 검증을 중단하고 다운로드 패키지·추출 앱·이번 실행에서 생성된 지원 데이터/환경설정·프로세스를 삭제했다. 다시 설치/실행하지 않는다. Safari27.2는 Remote Automation 비활성으로 WebDriver세션 생성500이었다. 실제 스크린리더·물리 트랙패드/핀치는 미검증이다. [수동 확인 절차](docs/manual-verification-2026-11-03.md)를 제공한다.

30벽/50가구의 실제 렌더 CPU제출·프레임 간격·draw calls/삼각형과 별도 rAF cadence를 [측정 표본](docs/performance-2026-11-03.json)에 기록했다. GPU타이머가 없어 GPU완료 시간 또는 모든 환경에서 지속30fps 달성은 확인하지 않았다. 개발 도구 moderate10개는 한 minimatch advisory의 전파로 남아 있으며 force/미검증 override는 하지 않았다. 런타임 audit0 및 whatwg-encoding 제거는 별도 사실이다.

## 실제 서비스 검증

실제 https://muminjun.github.io/roomfit-3d/ 에서 Chromium156.0.8078.4 및 Firefox157의 사용자 여정 검증이 종료0으로 통과했다. 새 공간 생성, 가구 위 Space팬 좌표 불변, Shift축Y1755 보존, Undo/Esc, 창문·주방 구역·양변기 추가, 실제3D, JSON백업, 자동저장/새로고침복원, 자산404·페이지오류 없음을 확인했다. 배포된 index-8-FBkCca.js와3D청크 등 실제 자산 경로는 [remote-evidence-2026-11-03.json](docs/remote-evidence-2026-11-03.json)에 기록했다. 기록 파일을 추가하는 후속 문서 커밋은 클라이언트 소스를 바꾸지 않는다.

<details><summary>이전 실행 기록 — 위 최종 확인보다 이전 상태</summary>

# 검증 보고서 — 2026-11-03

현재 소스의 기준별 원문·코드·실제 테스트·잔여 항목은 [AC 근거표](docs/ac-evidence-2026-11-03.md)가 유일한 기준이다. S6 AC-52–60은 제외한다. 기존의 일괄 통과 표는 이전 리비전의 기록이며 현재 소스의 통과를 뜻하지 않는다.

## 현재 실행 결과

| 명령 / 검증 | 결과 |
|---|---|
| `npm ci` | jsdom 27.4.0 설치 후 종료 0; whatwg-encoding 경고 없음 |
| `npm run typecheck`, `npm run lint`, `npm run test` | 각각 종료 0; 단위 126개 / 16파일 |
| 의도적인 타입 오류 음성 검사 | 종료 비0, TS2322 확인; 임시 파일 삭제 후 typecheck 종료 0 (`/tmp/roomfit-typecheck-negative.log`, `/tmp/roomfit-typecheck-restored.log`) |
| 하위 경로 production build / `check:dist` | 종료 0; 26개 참조 및 JS 7개 파일 검사. 엔트리 `index-8-FBkCca.js` |
| `npm run test:e2e:subpath` | Chromium/Firefox 2/2 통과, 종료 0 |
| 전체 Chromium/Firefox E2E, 이전 완료 실행 | 152/152 통과; 별도 pan tool 전환 회귀 2/2 통과 |
| 전체 Chromium/Firefox E2E, 최신 154개 실행 | **153 통과, 1 실패**: Chromium `architecture can be created, edited, saved and undone`에서 3D canvas가 5초 안에 나타나지 않음. 원인 조사 중 (`/tmp/roomfit-final-154-e2e.log`) |
| 실패한 Chromium 건축 시나리오 동일 조건 재검사 | 기존 assertion과 timeout을 바꾸지 않고 1/1 통과; 첫 실패의 근본 원인은 아직 확인되지 않음 |
| 최종 전체 브라우저 단독 실행 | 로그상 Chromium/Firefox **154개 통과** (2.0분), 변경 없는 테스트 및 설정 (`/tmp/roomfit-final-serial-e2e.log`). 프로세스 종료 코드는 별도로 보존되지 않음 |
| 로컬 production `scripts/verify-live.mjs` | Chromium/Firefox 통과. Space 팬·Shift 축·Undo·문/구역·가구·실제 3D·JSON·자동저장/복원 확인 (`/tmp/roomfit-local-live-check.json`) |
| 실제 Chrome 대표 검사 | 앞선 실행 15개 통과 |
| production dependency audit / 전체 audit | production 0개; 전체 moderate 10개 항목은 하나의 minimatch advisory에서 전파 |
| 현재 GitHub Actions / Pages | 현재 리비전 배포 및 원격 검증 대기 |

`/tmp/roomfit-final-dist-before.json`의 dist 10개 SHA-256을 현재 파일과 대조해 모두 일치했고 추가 파일도 없다. 원본 요구 파일의 SHA-256 `25cabf1861d7e9fe305cfbd328a8e7aabf4b6f95d5683cb3ee1dc265edb21065`는 `git show HEAD` 원본과 일치한다.

## 회귀와 검증 한계

초기 전체 실행에서 NumberField 접근 이름 회귀가 확인되어 고친 뒤 root-smoke 14/14가 통과했다. 팬 도구 전환 중 기존 드래그가 x=2100에서 2400으로 잘못 커밋되는 회귀도 재현 후 수정했고 집중 브라우저 테스트 2/2가 통과했다. 최신 154개 실행의 3D canvas 시간 초과 사례는 assertion과 timeout을 변경하지 않은 단독 재검사에서 1/1 통과했다. 최초 실패의 원인은 확인되지 않았고, 다른 브라우저 검사 없이 실행한 최종 전체 검사 로그에는 154개 통과가 기록됐다. 종료 코드는 별도로 보존되지 않았다.

`p0-interactions.spec.ts`의 Space 팬, Shift 축, Escape, fit selection, Alt 거리 표시 및 중간 버튼과 Tab/Enter 전체 키보드 여정은 완료된 자동 검사에 포함된다. 각 원본 AC에 남은 미검증 조항은 [AC 근거표](docs/ac-evidence-2026-11-03.md)에 기록한다. 사용자가 후속 요청으로 잘못된 배치가 되는 회전을 허용했으므로 원래 금지 조건과 의도적으로 다르다.

실제 Safari 27.2 safaridriver 세션 생성은 Remote Automation 비활성으로 HTTP 500이었다. Edge는 사용자 중단·삭제 지시에 따라 내려받은 패키지·앱·생성 지원 데이터와 프로세스를 제거했고 실제 제품 여정은 미검증이다. 실제 스크린리더와 물리 트랙패드 핀치도 미검증이다.

30벽/50가구의 headless Chromium 표본은 draw calls 552, triangles 4,180, CPU 제출 0.8ms, 프레임 간격 17.2ms였다. GPU 완료 시간이나 지속 처리량을 측정한 결과가 아니다. 이전 Actions/Pages 성공은 이전 리비전의 기록이다.

<details><summary>이전 검증 보고서 보관 (현재 상태 아님)</summary>

# 검증 보고서

최종 갱신: 2026-11-03. 상태: **원격 배포 확인 완료**. 아래 최신 결과가 과거 단계 중간 기록보다 우선한다.

## 최종 실행 결과

| 명령/대상 | 결과 |
|---|---|
| npm ci | 종료0, 249 packages |
| npm run typecheck / npm run lint | 각각 종료0 |
| npm run test | 종료0, 97개/10파일 |
| VITE_BASE_PATH=/roomfit-3d/ npm run build | 종료0, 최종 dist 한 번 빌드, 청크 크기 경고 없음 |
| VITE_BASE_PATH=/roomfit-3d/ npm run check:dist | 종료0, 26개 참조/7개 JS 파일 검사 |
| npm run test:e2e:subpath | 종료0, Chromium/Firefox 2개(2.6초) |
| npm run test:e2e -- --workers=1 --reporter=line | 종료0, Chromium/Firefox 92개(1.2분) |
| 실제 Google Chrome156.0.8078.74 | 독립 대표5개 종료0(7.9초), worker 대표3개 별도 통과 |
| npm audit --omit=dev | 종료0, 취약점0개 |
| GitHub Pages 원격 | 종료0, [Actions 재실행2](https://github.com/muminjun/roomfit-3d/actions/runs/41546473922) 성공, 실제 URL 양브라우저 검증 통과 |

빌드된10개 dist 파일의 SHA256이 production browser 검사 전후 모두 동일했다. 실제 하위 경로에서 JS/CSS/favicon/lazy3D 로드, 실제 Canvas, 2D 복귀 및 새로고침, 404/페이지 오류 없음 확인. 실행 Node22.15.0/npm10.9.2, macOS, Playwright headless Chromium/Firefox 및 설치된 Google Chrome.

## 고정 수치 실제 결과

직사각형14.28㎡, 800×500 함몰13.88㎡, 동일 크기 돌출14.68㎡, 1000×600 돌출14.88㎡, ㄱ12.36㎡, ㄷ13.08㎡. 상단 벽+200mm는15.12㎡, 오른쪽+150mm는14.79㎡. 퀸 침대90° footprint는2000×1500mm. UT-GEO/PLC/VIEW/3D/ST 고정 카탈로그와 회귀 테스트를 실제 실행했다. 바닥 실제 Float32 메시의 위쪽 법선/음수 좌표/면적 및 카메라 투영1e-6 비교도 포함한다.

## 검증의 한계

- AC-40은 실제 Actions 성공과 공개 URL 양브라우저 검증으로 통과했다. 첫 비공개 Pages 플랜422 실패는 승인 후 공개 전환으로 해소했다.
- 실제 Edge/Safari 및 실제 스크린리더·물리 트랙패드/핀치는 미검증이다. HTML 대체 조작·포커스·키보드·이벤트 자동 검증은 수행했다.
- 30벽/50가구 선택·수정·저장·실제3D 기능을 검증했다. 측정된 rAF cadence는 Chromium 약10.10Hz, Firefox 약57.92Hz로 환경/동시 실행에 따라 변한다. 이는 GPU 렌더fps가 아니며30fps 달성을 보장하지 않는다.
- npm ci는 개발 도구 트리의 moderate10개 및 whatwg-encoding deprecation을 보고했다. 런타임 audit0개. 파괴적인 audit fix/강제 override는 적용하지 않았으며 `docs/dependency-audit.md`에 근거가 있다.
- 초기 기하 고정 카탈로그의 최초 red 실행은 runner 부재로 확인하지 못했다. 이후 발견 회귀는 red→green으로 검증했으며 이 한계를 소급해 숨기지 않는다.

## AC별 최종 상태

검증 방법과 관련 파일은 `docs/AC_AUDIT.md`의 증거 묶음과 원본 PRD §17을 함께 읽는다. 자동 검증 통과가 모든 수동 환경을 확인했다는 뜻은 아니다.

| ID | 상태 | 증거/제약 |
|---|---|---|
| AC-01 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-02 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-03 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-04 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-05 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-06 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-07 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-08 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-09 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-10 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-11 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-12 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-13 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-14 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-15 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-16 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-17 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-18 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-19 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-20 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-21 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-22 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-23 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-24 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-25 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-26 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-27 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-28 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-29 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-30 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-31 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-32 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-33 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-34 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-35 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-36 | 부분 검증/제약 명시 | 기능/상한 검증·rAF 측정 완료; GPU 30fps 달성 미확인 |
| AC-37 | 부분 검증/제약 명시 | 키보드·포커스·레이블 자동 검증; 실제 스크린리더 수동 검증 미실행 |
| AC-38 | 통과(자동 검증) | 통과: 최종 npm ci/타입/lint/단위97/동일 base 빌드/자산 검사 모두 종료0 |
| AC-39 | 통과(자동 검증) | 통과: 동일 dist 하위 경로 Chromium/Firefox 2개 종료0; 자산 200·새로고침·실제 3D 확인 |
| AC-40 | 통과(실제 원격) | Actions attempt2 success; https://muminjun.github.io/roomfit-3d/ Chromium/Firefox HTTP200·편집·3D·JSON·자동복원·자산 확인 |
| AC-41 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-42 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-43 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-44 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-45 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-46 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-47 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-48 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-49 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-50 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-51 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-52 | 범위 밖(S6) | 범위 밖(S6): 구현·검증하지 않음 |
| AC-53 | 범위 밖(S6) | 범위 밖(S6): 구현·검증하지 않음 |
| AC-54 | 범위 밖(S6) | 범위 밖(S6): 구현·검증하지 않음 |
| AC-55 | 범위 밖(S6) | 범위 밖(S6): 구현·검증하지 않음 |
| AC-56 | 범위 밖(S6) | 범위 밖(S6): 구현·검증하지 않음 |
| AC-57 | 범위 밖(S6) | 범위 밖(S6): 구현·검증하지 않음 |
| AC-58 | 범위 밖(S6) | 범위 밖(S6): 구현·검증하지 않음 |
| AC-59 | 범위 밖(S6) | 범위 밖(S6): 구현·검증하지 않음 |
| AC-60 | 범위 밖(S6) | 범위 밖(S6): 구현·검증하지 않음 |
| AC-61 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-62 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-63 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-64 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-65 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-66 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-67 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-68 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-69 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-70 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-71 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-72 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-73 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-74 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-75 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-76 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-77 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-78 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-79 | 부분 검증/제약 명시 | Chrome 156/Chromium/Firefox 확인; Edge·실제 Safari 미검증 |
| AC-80 | 통과(자동 검증) | 통과: 동일 dist 하위 경로 Chromium/Firefox 2개 종료0; 자산 200·새로고침·실제 3D 확인 |
| AC-81 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-82 | 부분 검증/제약 명시 | 기능/상한 검증·rAF 측정 완료; GPU 30fps 달성 미확인 |
| AC-83 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-84 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-85 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-86 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-87 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-88 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-89 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-90 | 통과(자동 검증) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |

## 과거 단계별 실행 기록

아래는 당시 상태이며, 최종 결과가 우선한다.

## S0 / 순수기하 중간 증거
- 19:08 controller `npm run typecheck && npm run lint && npm run test && npm run build`: 종료 0, 28 tests/2 files. 이후 schema 교차 검사 및 방 명령을 추가한 worker 전체 실행 36 tests/3 files, typecheck/lint/build 종료 0.
- foundation `npm ci` 종료 0; 고의 string→number 오류 TS2322로 typecheck 비정상 종료 확인, 제거 후 종료 0. `/roomfit-3d/` 한 번 빌드 및 check-dist 종료 0.
- Geometry 고정 카탈로그25개 통과: UT-GEO01~12, UT-PLC01~08, UT-VIEW01~02 및 앵커/스냅/정규화 회귀. 처음 runner 부재로 최초 카탈로그의 실행 가능한 red를 확인하지 못했으며, backtracking 회귀는 실제 red→green 확인.
- Root 실제 Chromium E2E 초기 실행 종료1: 모바일 생성/내보내기/넘침 검사 통과; 쉼표 입력(type=number) 실패, Esc 모달 닫힘 실패. text/inputMode 및 Escape/focus trap 수정 후 재실행 대기.
- 실측 unit 결과: 직사각형14.28, 함몰13.88, 동일800×500돌출14.68,1000×600돌출14.88,ㄱ12.36,ㄷ13.08㎡; 상단+20015.12,오른쪽+15014.79㎡; 퀸90°2000×1500mm.
- Build chunk 크기 경고약650kB와 npm audit moderate10개는 S4 조사/정리 예정. 원격 배포 미실행.

S0 최종 로컬 스냅샷: controller19:12 typecheck/lint/test48(4files)/build 종료0. Root Chromium+Firefox8/8 E2E 종료0. 669.36kB chunk 경고 잔존; S4 최적화 예정.

## S1 중간 브라우저 증거
- Root 독립 `npx playwright test tests/e2e/room-editor.spec.ts --project=firefox --workers=1 --reporter=line`: 종료0,8/8 통과(6.1s). 벽 수치/실제드래그+Undo, ㄱ/ㄷ/돌출예제, 숫자/두단계마우스 함몰,99mm거절,450mm거절/+500병합,Esc,휠모드유지.
- 동일8개 Chromium worker 실행 종료0. 실제 줌/팬 후 편집 및 추가 취소 불변식 검증은 계속 진행 중.
- Root 수치/ID 독립 브라우저 추가: root-smoke 총12개 Chromium+Firefox 종료0(10.3s). AC-88 800×500돌출의 실제 JSON8점/minY−500/14.68㎡/기존ID+Undo 보존, AC-42 상단+200후 가로5000에서 앵커(0,−200)와 모든 좌표 확인. 면적 라벨 외 실제 내보낸 모델로 검증.

S1 최종 worker: typecheck/lint/test48(4files)/build 종료0; room-editor Chromium+Firefox18/18 종료0. Root독립root-smoke12/12 종료0. initial672.21kB 경고 잔존. Safari 실제/Edge 미검증.

S2 중간: controller `npm run test`64/6files 종료0. 가구domain12unit+fixture경계4unit 포함. Root30벽50가구·64점100가구 모두 스키마/배치유효,65점101가구 거절 및 load원자성검증. 카탈로그 클릭퀸/90도/Undo Chromium첫E2E통과; 전체S2브라우저진행중.

## S2 게이트
- worker typecheck/lint/test65(6files)/build 종료0. room+furniture Chromium+Firefox42/42 E2E 종료0. 90도 핸들 로컬W/D,Alt복제+Undo1,Esc/재드래그,IME/화살표Undo병합,복구,실제DOMDnD 포함.
- Root 독립Firefox가구11/11 종료0(7.9s). 실제내보낸JSON퀸90도에서로컬W/D1500×2000유지;W1001/중심(1000,500.5)정확접촉;H2401거절후JSON전체불변—양브라우저2/2종료0(3.4s).
- build698.15kB경고잔존. Edge/Safari실제미검증.

## S3 재개 후 중간 검증(2026-11-03)
- controller 실제 `npm run typecheck && npm run lint && npm run test && npm run build`: 종료0,78 tests/8files. 바닥 노멀/면적/xyz, 비균일 격자 벽 내부면 회귀,20가구 외곽/바닥접촉, 카메라 독립투영 비교 포함.
- 초기 Context-loss 테스트 실패는 R3F wrapper에 이벤트를 보낸 테스트 위치 오류였다. 실제 canvas에 dispatch한 양브라우저 검증은 통과. 앱 결함 재현으로 과장하지 않는다.
- 3D Canvas/Orbit/초기화/JSON불변/Alt전환/WebGL없음/context-loss 양브라우저8개 통과. 실제3D Undo에 따른 canvas 이미지 변경+가구0개JSON도 양브라우저 확인.
- 빌드 advisory: main702.50kB, lazy3D938.40kB. S4에서 의존성/분할을 비파괴적으로 검토한다.

## S3 게이트 통과
- worker 안정파일 기준 typecheck/lint/unit78/build 모두0; 전체Chromium+Firefox E2E68/68 종료0.
- Root 독립viewer+performance12/12 종료0(41.1s), 실제Firefox3D30벽50가구 스크린샷 육안확인. source외벽/카메라 독립감사 통과.
- 실측환경: headlessPlaywright, 다른검사동시실행 가능. Chromium선택482ms/편집115ms/RAF17callbacks÷1583.8ms≈10.10Hz; Firefox324ms/80ms/88callbacks÷1502.04ms≈57.92Hz. 이는 브라우저UI RAF cadence 대리측정이며 GPU렌더fps나30fps보장이 아니다. 별도동시전체실행 Chromium약17.2Hz/Firefox약60Hz로 변동. 기능상30벽50가구선택/수정/자동저장/실제3D/2D복귀완료.

S4 중간: strictJSON raw검사→정규화→확정스키마검사→파생경고 완료. 가역메타데이터/ID보존,CCW요약,unknowncatalog→other,UTF8실제2MiB,중복/깊은prototype/버전/64·100상한,파일명검증. 제거가능50mm중간점정리/잔존99mm거절 및 C1제어문자입력정리회귀포함. 전체unit92개통과. Root독립source감사JSON/자동저장보존파이프라인차단없음; 전체브라우저게이트진행중.

## S4 final gate (2026-11-03)
- Controller typecheck/lint/unit97 (10 files)/build: exit0. Default Chromium+Firefox84/84 passed before final fixes; focused storage8, restore-label2, new furniture6 and root import-boundary4 cases all passed afterward.
- New exported-model cases: DOM drop after zoom/pan yields exact center(1000,1100); outside/stage-leave/U-notch attempts preserve model/history; odd1001mm handle resize keeps opposite corner fixed.
- Actual Google Chrome156.0.8078.74: worker3 and root5 representative cases passed. Chromium is reported separately. Edge absent; actual Safari unverified.
- Restored updatedAt remains project metadata and is not labeled as actual last-save time. Current-session successful writes show the real save time.
- Final S4 build advisory: main646.26kB, lazy3D938.40kB. Limited splitting experiment is part of S5; no warning threshold suppression.


## 최종 전체 브라우저 재검증

새 의존성 설치 이후 켜져 있던 이전 Vite 서버가 예전 최적화 URL에서504를 반환하여 초기 재실행은2개 실패/1개 중단이었다. page response에서 원인을 확인하고 기존 dev 서버만 종료 후 `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort --force`로 재시작했다. 제품 소스나 최종 production dist는 변경하지 않았다.

그 후 동일 `npm run test:e2e -- --workers=1 --reporter=line`을 재실행하여 **92/92 통과, 종료0, 1.2분**을 확인했다. 최신30벽/50가구 측정: Chromium 선택208ms/편집30ms/rAF76callbacks·1508.9ms≈49.71Hz, Firefox145ms/32ms/87callbacks·1509.4ms≈56.98Hz. 실행 간 변동과 rAF 대리측정의 한계는 그대로 유지한다. 30fps GPU 보장으로 해석하지 않는다.


## 원격 첫 실행 결과
사용자 승인 후 main push 성공. Actions run41546473922의 npm ci/typecheck/lint/test/build/check-dist는 모두 success. configure-pages에서 failure, upload/deploy는 skipped. Pages API422로 현재 플랜의 비공개 저장소 Pages 미지원 확인. 공개 전환 승인 대기이며 아직 원격 배포 확인 완료가 아니다.

## 원격 배포 최종 확인

사용자의 push 승인과 별도 공개 전환 승인 후, PUBLIC 저장소/Pages workflow source/HTTPS를 확인했다. [Actions](https://github.com/muminjun/roomfit-3d/actions/runs/41546473922) attempt2는 success이며 ci/typecheck/lint/unit97/build/check-dist/configure/upload/deploy 모두 성공했다. 실제 https://muminjun.github.io/roomfit-3d/ 에서 Chromium156.0.8078.4와 Firefox157.0 각 새 컨텍스트로 HTTP200, 기본2D, 퀸 침대 추가·90° 회전·JSON실측값, 실제3D·Orbit·카메라 초기화·데이터 불변, 2D복귀, localStorage 저장·새로고침 동일JSON, favicon/CSS/lazy3D 응답을 확인했다. 자산13/14건, 404·pageerror0. `/tmp/roomfit-remote-smoke.mjs` 실제 실행 종료0; 원격 근거를 `docs/remote-evidence.json`에 보존했다.

</details>

</details>
