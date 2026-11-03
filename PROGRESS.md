# RoomFit 3D — P0 보완·주거 계획 확장 진행 장부

최신 작업 브랜치 `fix/interaction-and-home-planning`, 기준 `a088b54`. 사용자가 이번 수정·검증·main push·Pages 재배포와 문/창문/욕실/주방/현관/카탈로그 확장을 요청했다. text-auto-wrap은 수정하지 않았다. 아래가 과거 기록보다 우선한다.

| 작업 | 현재 상태 | 실행 근거 | 남은 일 |
|---|---|---|---|
| Space 팬 / Shift 스냅 / 단축키 / Alt | 구현·집중 회귀 통과 | p0-interactions24(도구전환 포함) + lifecycle8 Chromium/Firefox | 최종 전체 게이트 |
| 첫 화면·상태·접근성·반응형 | 구현·키보드 여정 통과 | ui-journey,390/800/1023/1280, 실제Tab여정 | 실제 보조기술/물리입력 제약 |
| 회전 허용·여는 공간·45종 | 구현·회귀 통과 | home-planning/operation/unit + browser | 원문 회전 규칙의 의도적 변경 기록 |
| 칸막이·문·창문·구역·실제3D 개구부 | 구현·통합 회귀 통과 | architecture/unit9geometry + browser | 독립된 다중방/여러층 범위 아님 |
| 코드 리뷰 후 보완 | 중요4건+오목실내침범+stale drag 수정 | 교차벽,64/100스트레스,CCW연결,무효통로,오목클리핑,Undo중드래그 red→green | 전체 게이트 후 커밋 |
| 의존성 | jsdom27.4.0, 폐기경고 제거 | npm ci/type/lint/unit exit0, productionaudit0 | minimatch 단일advisory 전파 moderate10 잔존 |
| 검증·감사 | unit126, 기본E2E154 및 subpath2 통과; 최종 종료코드 기록 중 | type/lint/build/check:dist exit0 | 종료코드 기록·main push·Pages (Edge는 사용자 지시로 삭제·중단) |
| 배포 | 검증 대기 | 기존공개repo/main 그대로 보존 | 커밋→main→push→Actions→서비스회귀 |

원문 AC81개의 정확한 증거와 부분/미검증은 docs/ac-evidence-2026-11-03.md를 따른다. 통과 개수는 모든 요구사항/환경의 충족을 증명하지 않는다. Safari27.2는 원격자동화 설정 비활성으로 WebDriver세션 생성500, 스크린리더/물리트랙패드 미검증. Edge 검증은 사용자 요청으로 중단했고 다운로드·추출 앱·생성 데이터·프로세스를 삭제했다. 재설치·재실행하지 않는다.

<details><summary>기존 단계 장부 보관 — 현재 상태 아님</summary>

# RoomFit 3D 진행 장부
- 저장소: PUBLIC `muminjun/roomfit-3d`, 기본/현재 브랜치 `main`. 사용자 승인으로 원격 push·공개 전환·Pages 배포 완료. 기존 개발 브랜치 `feat/roomfit-mvp` 보존.
- 상태: S0~S5 구현·로컬 검증 및 원격 Pages 배포 확인 완료. 실제 수동 환경 제약은 TEST_REPORT 참조. S6 협업은 범위 밖.
- 폴더: `src/lib/geometry`, `types`, `store`, `components/editor2d`, `components/viewer3d`, `features/project`, `tests`.
- 데이터: schemaVersion 2, mm 정수/가구 중심 0.5mm, 단일 Zustand 원본.
- 순서: 기반→순수기하→방편집→가구검증→3D→저장강화→배포경로 검증.

| 단계 | 상태 | 마지막 통과 명령/종료코드 | AC | 다음 작업 |
|---|---|---|---|---|
| S0 | 게이트통과 | npm ci/타입 음성검사/타입/lint/test48/build 종료0; Chromium+Firefox8 E2E 종료0 | AC-01 2D/78 및 S0 부분 검증 | S1 공간 편집 |
| S1 | 게이트통과 | 타입/lint/test48/build0; Chromium+Firefox18 E2E0+root12 E2E0 | 방 편집/기하/뷰포트 검증 | S2 가구 배치 |
| S2 | 게이트통과 | 타입/lint/test65/build0; room+furniture E2E42/42 종료0 | 가구20종/배치/키보드/경고 검증 | S3 실제3D |
| S3 | 게이트통과 | 타입/lint/test78/build0; 전체 E2E68/68 종료0 | 실제Canvas/메시/카메라/폴백/동기화 | S4 저장·안정화 |
| S4 | Gate passed | type/lint/unit97/build exit0; full84 E2E + final focused cases exit0 | JSON, autosave, accessibility, Chrome verified | S5 same-dist subpath verification |
| S5 | 게이트통과 / 원격 확인 완료 | 로컬97unit/92E2E/서브경로2 및 Actions attempt2 success, 실제 URL2브라우저 검증 | AC-39/40/80 통과 | 배포 기록 최종 동기화 |

AC별 증거는 `TEST_REPORT.md`, 독립 감사는 `docs/AC_AUDIT.md`.

## 19:10 중간 상태
S0 npm ci/타입 음성검사/로컬 gate 통과, 브라우저에서 발견한 쉼표·Escape 문제 수정 후 독립 재검증 중. S0 게이트 완료 표시는 보류.
순수기하25 UT 및 room command7 UT 완료(전체36개). S1 UI 진행: 벽/홈/프리셋/뷰포트. S2 이후 미착수.

S0 게이트 통과: 19:12 controller typecheck/lint/test48/build 모두 종료0, root Chromium+Firefox8 E2E 종료0. S1 일부 prework(방 명령/기하/history/일부 UI)를 함께 보존하며 S1 전체 게이트는 미통과.

S1 게이트:48unit 및 공간E2E18개(Chrome계열/Firefox),root독립12개 통과. Safari feature-detect 구현이나 실제Safari 미검증. S2 가구단계 진행 예정.

## 2026-11-03 재개
2026-11-02 S2 커밋71581af 이후 S3 진행 중 에이전트 실행이 workspace credits 소진으로 중단되었다. 사용자의 명시적 계속 지시에 따라 기존 변경을 보존하고 같은 두 구현 에이전트를 재개했다. S0~S2를 다시 만들지 않으며 S3→S4→S5를 이어간다. 원격 push는 여전히 금지.


## 2026-11-03 S5 최종 인계
최종 타입/lint/unit97와 동일 dist 서브경로2개 E2E 통과. dist10개 SHA256 전후 동일, 최종 build는 청크 경고 없음. 최종 전체 기본 E2E92개 종료0(1.2분). GPT-6.1-Sol 지휘 에이전트가 workspace credits 제한으로 다시 중단되어 root가 남은 최종 검증/기록/로컬 커밋을 이어 처리한다. 제품 구현은 기존 Terra 결과를 보존하며 재시작하지 않았다.


## P0 요구사항 ID별 인계

관련 AC와 실제 테스트/소스 파일의 세부 매핑은 TEST_REPORT 및 docs/AC_AUDIT.md를 참조한다.

| 요구사항 | 상태 | 관련 AC | 관련 모듈/증거 | 남은 항목 |
|---|---|---|---|---|
| FR-001 | 로컬 검증 통과 | AC-01, AC-67, AC-73 | src/features/room, src/components/editor2d, tests/unit/geometry.test.ts, tests/e2e/room-editor.spec.ts | 없음(자동 검증 범위) |
| FR-002 | 로컬 검증 통과 | AC-02, AC-09, AC-42 | src/features/room, src/components/editor2d, tests/unit/geometry.test.ts, tests/e2e/room-editor.spec.ts | 없음(자동 검증 범위) |
| FR-003 | 로컬 검증 통과 | AC-02, AC-07, AC-08, AC-09, AC-24, AC-41, AC-68, AC-69, AC-86 | src/features/room, src/components/editor2d, tests/unit/geometry.test.ts, tests/e2e/room-editor.spec.ts | 없음(자동 검증 범위) |
| FR-004 | 로컬 검증 통과 | AC-07, AC-08, AC-41, AC-61, AC-68, AC-69, AC-87, AC-89, AC-90 | src/features/room, src/components/editor2d, tests/unit/geometry.test.ts, tests/e2e/room-editor.spec.ts | 없음(자동 검증 범위) |
| FR-010 | 로컬 검증 통과 | AC-03, AC-04, AC-07, AC-08, AC-41, AC-69, AC-86, AC-88, AC-90 | src/features/room, src/components/editor2d, tests/unit/geometry.test.ts, tests/e2e/room-editor.spec.ts | 없음(자동 검증 범위) |
| FR-011 | 로컬 검증 통과 | AC-03, AC-04, AC-05, AC-06 | src/features/room, src/components/editor2d, tests/unit/geometry.test.ts, tests/e2e/room-editor.spec.ts | 없음(자동 검증 범위) |
| FR-012 | 로컬 검증 통과 | AC-10, AC-47, AC-48, AC-62, AC-85 | src/features/room, src/components/editor2d, tests/unit/geometry.test.ts, tests/e2e/room-editor.spec.ts | 없음(자동 검증 범위) |
| FR-013 | 로컬 검증 통과 | AC-10, AC-47, AC-48, AC-66, AC-70, AC-73, AC-86 | src/features/room, src/components/editor2d, tests/unit/geometry.test.ts, tests/e2e/room-editor.spec.ts | 없음(자동 검증 범위) |
| FR-020 | 로컬 검증 통과 | AC-11, AC-12, AC-13, AC-14, AC-66, AC-73 | src/features/furniture, src/components/panels, tests/e2e/furniture-editor.spec.ts | 없음(자동 검증 범위) |
| FR-021 | 로컬 검증 통과 | AC-13, AC-16, AC-18, AC-43, AC-62, AC-85 | src/features/furniture, src/components/panels, tests/e2e/furniture-editor.spec.ts | 없음(자동 검증 범위) |
| FR-022 | 로컬 검증 통과 | AC-18, AC-19, AC-20, AC-21, AC-43, AC-75, AC-77 | src/features/furniture, src/components/panels, tests/e2e/furniture-editor.spec.ts | 없음(자동 검증 범위) |
| FR-023 | 로컬 검증 통과 | AC-26, AC-49, AC-50, AC-51, AC-73 | src/features/furniture, src/components/panels, tests/e2e/furniture-editor.spec.ts | 없음(자동 검증 범위) |
| FR-024 | 로컬 검증 통과 | AC-12, AC-13, AC-14, AC-15, AC-23, AC-43, AC-44, AC-66, AC-70 | src/features/furniture, src/components/panels, tests/e2e/furniture-editor.spec.ts | 없음(자동 검증 범위) |
| FR-025 | 로컬 검증 통과 | AC-14, AC-15, AC-16, AC-17, AC-21, AC-22, AC-23, AC-34, AC-62, AC-74, AC-77 | src/features/furniture, src/components/panels, tests/e2e/furniture-editor.spec.ts | 없음(자동 검증 범위) |
| FR-030 | 로컬 검증 통과 | AC-03, AC-04, AC-27, AC-29, AC-64, AC-65, AC-84, AC-88 | src/components/viewer3d, tests/unit/viewer3d.test.ts, tests/e2e/viewer3d.spec.ts | 없음(자동 검증 범위) |
| FR-031 | 로컬 검증 통과 | AC-27, AC-28, AC-75 | src/components/viewer3d, tests/unit/viewer3d.test.ts, tests/e2e/viewer3d.spec.ts | 없음(자동 검증 범위) |
| FR-032 | 로컬 검증 통과 | AC-30, AC-36, AC-79, AC-82 | src/components/viewer3d, tests/unit/viewer3d.test.ts, tests/e2e/viewer3d.spec.ts | 없음(자동 검증 범위) |
| FR-033 | 로컬 검증 통과 | AC-29, AC-64, AC-65, AC-84 | src/components/viewer3d, tests/unit/viewer3d.test.ts, tests/e2e/viewer3d.spec.ts | 없음(자동 검증 범위) |
| FR-034 | 로컬 검증 통과 | AC-18, AC-19, AC-25, AC-27, AC-28, AC-65, AC-75 | src/components/viewer3d, tests/unit/viewer3d.test.ts, tests/e2e/viewer3d.spec.ts | 없음(자동 검증 범위) |
| FR-040 | 로컬 검증 통과 | AC-31, AC-35, AC-46, AC-63, AC-70, AC-81, AC-83 | src/features/project, tests/integration/autosave.test.ts, tests/e2e/storage-editor.spec.ts | 없음(자동 검증 범위) |
| FR-041 | 로컬 검증 통과 | AC-32, AC-33, AC-34, AC-45, AC-72, AC-76, AC-87, AC-89 | src/features/project, tests/integration/autosave.test.ts, tests/e2e/storage-editor.spec.ts | 없음(자동 검증 범위) |
| FR-042 | 로컬 검증 통과 | AC-33, AC-34, AC-45, AC-67, AC-71, AC-72, AC-76, AC-87, AC-89 | src/features/project, tests/integration/autosave.test.ts, tests/e2e/storage-editor.spec.ts | 없음(자동 검증 범위) |
| FR-043 | 로컬 검증 통과 | AC-35, AC-46, AC-63, AC-81, AC-83 | src/features/project, tests/integration/autosave.test.ts, tests/e2e/storage-editor.spec.ts | 없음(자동 검증 범위) |
| FR-050 | 로컬 검증 통과 | AC-24, AC-25, AC-27, AC-31, AC-70 | src/store, tests/unit/history.test.ts, tests/e2e/root-smoke.spec.ts | 없음(자동 검증 범위) |
| FR-051 | 로컬 검증 통과 | AC-24, AC-25, AC-43, AC-50, AC-69, AC-70 | src/store, tests/unit/history.test.ts, tests/e2e/root-smoke.spec.ts | 없음(자동 검증 범위) |
| FR-052 | 자동 검증 통과 / 수동 일부 미실행 | AC-26, AC-37, AC-44, AC-51, AC-66, AC-73, AC-79 | src/components/common, tests/e2e/accessibility.spec.ts | 실제 스크린리더·물리 입력장치 |
| FR-053 | 원격 검증 통과 | AC-38, AC-39, AC-40, AC-80 | vite.config.ts, deploy.yml, subpath.pw.ts, docs/remote-evidence.json | 없음 |
| FR-054 | 기능/측정 완료 / GPU fps 미확인 | AC-30, AC-36, AC-64, AC-79, AC-82 | src/components/viewer3d, tests/e2e/performance.spec.ts | 실기기 GPU30fps 목표 검증 |
| FR-055 | 로컬 검증 통과 | AC-38, AC-39, AC-40, AC-78, AC-79, AC-80 | TEST_REPORT.md, docs/AC_AUDIT.md, PROGRESS.md, scripts/check-dist.mjs | 명시한 환경/원격 제약 참조 |
| FR-056 | 로컬 검증 통과 | AC-38, AC-78 | TEST_REPORT.md, docs/AC_AUDIT.md, PROGRESS.md, scripts/check-dist.mjs | 명시한 환경/원격 제약 참조 |
| FR-057 | 로컬 검증 통과 | AC-01, AC-05, AC-06, AC-11, AC-37, AC-67, AC-73 | src/lib/geometry, src/features, src/store, tests | 없음(자동 검증 범위) |


최종: `npm ci`, typecheck, lint, unit97, 한 번의 base=/roomfit-3d/ build, check:dist, 서브경로2 E2E, 기본 전체92 E2E 모두 종료0. 실제Chrome대표5개 별도 종료0. AC-40 원격 미실행, AC-37/79의 실제스크린리더·Edge/Safari 및 물리입력 수동확인은 남아 있다. 다음 실행자는 로컬 앱을 재작성하지 말고 원격 push/Pages 승인과 이 환경 제약만 이어서 확인한다.


## 원격 배포 진행 — 2026-11-03
사용자가 push/Pages 진행에 `ㅇㅇ`으로 승인했다. `git push origin HEAD:refs/heads/main` 종료0, 원격 HEAD=acbc303ed9dba2d9f5c0567b0a633ca97aea9201. 기본 브랜치 main 설정 완료. Actions https://github.com/muminjun/roomfit-3d/actions/runs/41546473922 에서 ci/type/lint/unit97/build/check-dist 모두 통과했으나 configure-pages가 실패했다. Pages 생성 API는422 `Your current plan does not support GitHub Pages for this repository.` 응답. 비공개→공개는 코드/커밋 공개를 수반하므로 별도 승인 질문을 보냈으며 아직 답변 전이다. 공개 전환이나 Pages 배포 성공으로 표시하지 않는다.


공개 전환 승인: 사용자가 `승인`으로 명시 확인했다. 저장소 PUBLIC 전환 및 Pages workflow source 생성 API가 각각 종료0. 사이트 예정 URL https://muminjun.github.io/roomfit-3d/ , https_enforced=true. 첫 Actions run41546473922를 재실행했다. 공개 전환 승인 대기 상태는 해제되었으며, 현재는 재실행 성공과 실제 URL 검증을 진행한다.

## 최종 원격 인계
사용자 `ㅇㅇ`으로 push 승인, `승인`으로 공개 전환 승인. 현재 저장소 PUBLIC, 기본브랜치 main. 실제 https://muminjun.github.io/roomfit-3d/ 배포 성공 및 Chromium/Firefox 사용자 흐름 검증 통과. AC-40 이전 미실행/승인대기 문구는 과거 이력이며 최신 상태는 이 절과 상단 표를 따른다. 실제 Edge/Safari/스크린리더/물리입력/GPU보장 제약은 여전히 유지한다.

</details>
