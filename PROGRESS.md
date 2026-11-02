# RoomFit 3D 진행 장부
- 저장소: 신규 private `muminjun/roomfit-3d`; 작업 브랜치 `feat/roomfit-mvp`. 원격 push 금지.
- P0: S0~S5 전체 미완료. S6 협업은 범위 밖.
- 폴더: `src/lib/geometry`, `types`, `store`, `components/editor2d`, `components/viewer3d`, `features/project`, `tests`.
- 데이터: schemaVersion 2, mm 정수/가구 중심 0.5mm, 단일 Zustand 원본.
- 순서: 기반→순수기하→방편집→가구검증→3D→저장강화→배포경로 검증.

| 단계 | 상태 | 마지막 통과 명령/종료코드 | AC | 다음 작업 |
|---|---|---|---|---|
| S0 | 진행 | 환경 점검 0 | 미실행 | 기반·스키마·2D·최소저장 |
| S1 | 미착수 | 없음 | 미실행 | 기하 UT 선행 |
| S2 | 미착수 | 없음 | 미실행 | 가구/검증 |
| S3 | 미착수 | 없음 | 미실행 | 실제 3D |
| S4 | 미착수 | 없음 | 미실행 | 저장·E2E |
| S5 | 미착수 | 없음 | 원격 미검증 | base/Actions |

AC별 증거는 `TEST_REPORT.md`, 독립 감사는 `docs/AC_AUDIT.md`.
