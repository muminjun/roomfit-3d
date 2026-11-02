# RoomFit 3D 진행 장부
- 저장소: 신규 private `muminjun/roomfit-3d`; 작업 브랜치 `feat/roomfit-mvp`. 원격 push 금지.
- P0: S0~S5 전체 미완료. S6 협업은 범위 밖.
- 폴더: `src/lib/geometry`, `types`, `store`, `components/editor2d`, `components/viewer3d`, `features/project`, `tests`.
- 데이터: schemaVersion 2, mm 정수/가구 중심 0.5mm, 단일 Zustand 원본.
- 순서: 기반→순수기하→방편집→가구검증→3D→저장강화→배포경로 검증.

| 단계 | 상태 | 마지막 통과 명령/종료코드 | AC | 다음 작업 |
|---|---|---|---|---|
| S0 | 게이트통과 | npm ci/타입 음성검사/타입/lint/test48/build 종료0; Chromium+Firefox8 E2E 종료0 | AC-01 2D/78 및 S0 부분 검증 | S1 공간 편집 |
| S1 | 게이트통과 | 타입/lint/test48/build0; Chromium+Firefox18 E2E0+root12 E2E0 | 방 편집/기하/뷰포트 검증 | S2 가구 배치 |
| S2 | 미착수 | 없음 | 미실행 | 가구/검증 |
| S3 | 미착수 | 없음 | 미실행 | 실제 3D |
| S4 | 미착수 | 없음 | 미실행 | 저장·E2E |
| S5 | 미착수 | 없음 | 원격 미검증 | base/Actions |

AC별 증거는 `TEST_REPORT.md`, 독립 감사는 `docs/AC_AUDIT.md`.

## 19:10 중간 상태
S0 npm ci/타입 음성검사/로컬 gate 통과, 브라우저에서 발견한 쉼표·Escape 문제 수정 후 독립 재검증 중. S0 게이트 완료 표시는 보류.
순수기하25 UT 및 room command7 UT 완료(전체36개). S1 UI 진행: 벽/홈/프리셋/뷰포트. S2 이후 미착수.

S0 게이트 통과: 19:12 controller typecheck/lint/test48/build 모두 종료0, root Chromium+Firefox8 E2E 종료0. S1 일부 prework(방 명령/기하/history/일부 UI)를 함께 보존하며 S1 전체 게이트는 미통과.

S1 게이트:48unit 및 공간E2E18개(Chrome계열/Firefox),root독립12개 통과. Safari feature-detect 구현이나 실제Safari 미검증. S2 가구단계 진행 예정.
