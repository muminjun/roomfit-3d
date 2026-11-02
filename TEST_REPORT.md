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
