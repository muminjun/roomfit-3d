# 검증 보고서
2026-11-02 시작. 현재 실제 테스트 실행 없음. 통과로 간주하지 않습니다.

| 범위 | 상태 | 증거 |
|---|---|---|
| AC-01~51,61~90 | 미실행 | 구현/검증 예정 |
| AC-52~60 | 범위 밖 | 선택 S6 미구현 |
| AC-40 원격 Pages | 미검증 | push/배포 승인 전 |

## S0 / 순수기하 중간 증거
- 19:08 controller `npm run typecheck && npm run lint && npm run test && npm run build`: 종료 0, 28 tests/2 files. 이후 schema 교차 검사 및 방 명령을 추가한 worker 전체 실행 36 tests/3 files, typecheck/lint/build 종료 0.
- foundation `npm ci` 종료 0; 고의 string→number 오류 TS2322로 typecheck 비정상 종료 확인, 제거 후 종료 0. `/roomfit-3d/` 한 번 빌드 및 check-dist 종료 0.
- Geometry 고정 카탈로그25개 통과: UT-GEO01~12, UT-PLC01~08, UT-VIEW01~02 및 앵커/스냅/정규화 회귀. 처음 runner 부재로 최초 카탈로그의 실행 가능한 red를 확인하지 못했으며, backtracking 회귀는 실제 red→green 확인.
- Root 실제 Chromium E2E 초기 실행 종료1: 모바일 생성/내보내기/넘침 검사 통과; 쉼표 입력(type=number) 실패, Esc 모달 닫힘 실패. text/inputMode 및 Escape/focus trap 수정 후 재실행 대기.
- 실측 unit 결과: 직사각형14.28, 함몰13.88, 동일800×500돌출14.68,1000×600돌출14.88,ㄱ12.36,ㄷ13.08㎡; 상단+20015.12,오른쪽+15014.79㎡; 퀸90°2000×1500mm.
- Build chunk 크기 경고약650kB와 npm audit moderate10개는 S4 조사/정리 예정. 원격 배포 미실행.

## AC별 현재 상태(단계별 갱신)

| ID | 상태 | 증거/미완료 |
|---|---|---|
| AC-01 | 부분 검증 | S0 unit/CI 및 Chromium+Firefox 8 E2E; 전체 기준은 후속 단계 |
| AC-02 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-03 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-04 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-05 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-06 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-07 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-08 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-09 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-10 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-11 | 미실행 | 후속 단계 검증 예정 |
| AC-12 | 미실행 | 후속 단계 검증 예정 |
| AC-13 | 미실행 | 후속 단계 검증 예정 |
| AC-14 | 미실행 | 후속 단계 검증 예정 |
| AC-15 | 미실행 | 후속 단계 검증 예정 |
| AC-16 | 미실행 | 후속 단계 검증 예정 |
| AC-17 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-18 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-19 | 미실행 | 후속 단계 검증 예정 |
| AC-20 | 미실행 | 후속 단계 검증 예정 |
| AC-21 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-22 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-23 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-24 | 미실행 | 후속 단계 검증 예정 |
| AC-25 | 미실행 | 후속 단계 검증 예정 |
| AC-26 | 미실행 | 후속 단계 검증 예정 |
| AC-27 | 미실행 | 후속 단계 검증 예정 |
| AC-28 | 미실행 | 후속 단계 검증 예정 |
| AC-29 | 미실행 | 후속 단계 검증 예정 |
| AC-30 | 미실행 | 후속 단계 검증 예정 |
| AC-31 | 부분 검증 | S0 unit/CI 및 Chromium+Firefox 8 E2E; 전체 기준은 후속 단계 |
| AC-32 | 미실행 | 후속 단계 검증 예정 |
| AC-33 | 미실행 | 후속 단계 검증 예정 |
| AC-34 | 미실행 | 후속 단계 검증 예정 |
| AC-35 | 미실행 | 후속 단계 검증 예정 |
| AC-36 | 미실행 | 후속 단계 검증 예정 |
| AC-37 | 부분 검증 | S0 unit/CI 및 Chromium+Firefox 8 E2E; 전체 기준은 후속 단계 |
| AC-38 | 부분 검증 | S0 unit/CI 및 Chromium+Firefox 8 E2E; 전체 기준은 후속 단계 |
| AC-39 | 미실행 | 후속 단계 검증 예정 |
| AC-40 | 미실행 | push/Pages 승인 전 원격 미검증 |
| AC-41 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-42 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-43 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-44 | 미실행 | 후속 단계 검증 예정 |
| AC-45 | 미실행 | 후속 단계 검증 예정 |
| AC-46 | 미실행 | 후속 단계 검증 예정 |
| AC-47 | 미실행 | 후속 단계 검증 예정 |
| AC-48 | 미실행 | 후속 단계 검증 예정 |
| AC-49 | 미실행 | 후속 단계 검증 예정 |
| AC-50 | 미실행 | 후속 단계 검증 예정 |
| AC-51 | 미실행 | 후속 단계 검증 예정 |
| AC-52 | 범위 밖(S6) | S6 선택 단계 |
| AC-53 | 범위 밖(S6) | S6 선택 단계 |
| AC-54 | 범위 밖(S6) | S6 선택 단계 |
| AC-55 | 범위 밖(S6) | S6 선택 단계 |
| AC-56 | 범위 밖(S6) | S6 선택 단계 |
| AC-57 | 범위 밖(S6) | S6 선택 단계 |
| AC-58 | 범위 밖(S6) | S6 선택 단계 |
| AC-59 | 범위 밖(S6) | S6 선택 단계 |
| AC-60 | 범위 밖(S6) | S6 선택 단계 |
| AC-61 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-62 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-63 | 미실행 | 후속 단계 검증 예정 |
| AC-64 | 미실행 | 후속 단계 검증 예정 |
| AC-65 | 미실행 | 후속 단계 검증 예정 |
| AC-66 | 미실행 | 후속 단계 검증 예정 |
| AC-67 | 부분 검증 | S0 unit/CI 및 Chromium+Firefox 8 E2E; 전체 기준은 후속 단계 |
| AC-68 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-69 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-70 | 미실행 | 후속 단계 검증 예정 |
| AC-71 | 미실행 | 후속 단계 검증 예정 |
| AC-72 | 미실행 | 후속 단계 검증 예정 |
| AC-73 | 미실행 | 후속 단계 검증 예정 |
| AC-74 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-75 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-76 | 미실행 | 후속 단계 검증 예정 |
| AC-77 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-78 | 통과 | foundation-report: TS2322 음성검사→복구0, vitest e2e 제외 |
| AC-79 | 부분 검증 | S0 unit/CI 및 Chromium+Firefox 8 E2E; 전체 기준은 후속 단계 |
| AC-80 | 미실행 | 후속 단계 검증 예정 |
| AC-81 | 미실행 | 후속 단계 검증 예정 |
| AC-82 | 미실행 | 후속 단계 검증 예정 |
| AC-83 | 미실행 | 후속 단계 검증 예정 |
| AC-84 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-85 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-86 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-87 | 미실행 | 후속 단계 검증 예정 |
| AC-88 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |
| AC-89 | 미실행 | 후속 단계 검증 예정 |
| AC-90 | 부분 검증 | geometry/room/history unit; 요구 브라우저·3D 검증 미완료 |

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
