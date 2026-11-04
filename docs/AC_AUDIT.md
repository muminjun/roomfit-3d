> **2026-11-04 workbench update:** The current criterion-by-criterion source is [AC evidence 2026-11-04](ac-evidence-2026-11-04.md). Current full unit162/browser272, Chrome25 and same-dist subpath2 results are recorded in TEST_REPORT.md. Pages CI41842857753 and actual service Chromium/Firefox passed. Current47 verified/34 partial criteria and exact limitations are in the latest evidence table. Material below refers to the earlier release unless explicitly updated.

<!-- 현재 추가 확인: unit126/16파일, 전체E2E154 종료0, 동일dist서브경로2 종료0. 원격CI는 후속 확인. -->
# 수용 기준 감사 — 2026-11-03

현재 감사의 단일 기준표는 [AC별 원문 및 근거](ac-evidence-2026-11-03.md)다. 원본 §17의 P0 81개(AC-01–51, AC-61–90)를 각각 기록하며 S6 AC-52–60은 제외한다. 각 행은 실제로 실행한 근거와 남은 조항을 분리한다. 이전의 묶음 근거 또는 유사 테스트는 모든 문구의 통과를 증명하지 않는다.

최신 단위 126개/16파일, root-smoke 14/14 및 제스처 lifecycle 8/8은 코디네이터 보고다. 이전 전체 브라우저 152/152 후 최신 154개 실행은 153개 통과, Chromium 건축 편집 여정에서 3D 캔버스 대기 시간 초과 1개 실패다. 동일 assertion과 timeout으로 실패한 시나리오를 단독 재검사해 1/1 통과했으나 최초 실패의 원인은 확인되지 않았다. 다른 브라우저 검사 없이 실행한 최종 전체 검사 로그는 154개 통과를 기록한다. 프로세스 종료 코드는 별도로 보존되지 않았다. Safari는 Remote Automation 비활성으로 세션 생성이 실패했고 Edge 검증은 사용자 요청으로 중단했으며 내려받은 앱과 생성된 데이터를 삭제했다. 스크린리더, 물리 핀치와 GPU 완료 시간도 미검증이다. 자세한 실행 상태는 [검증 보고서](../TEST_REPORT.md)를 참조한다.

사용자의 후속 지시에 따라 잘못된 배치 결과가 되는 회전도 허용한다. 이는 원본의 무효 배치 회전 금지와 의도적으로 다르며, 원본 요구 파일은 수정하지 않았다. 추가된 칸막이·문·창문·구역·여는 공간·확장 카탈로그는 별도 범위다.

<details><summary>이전 감사 보관 (이전 리비전, 현재 통과 판정 아님)</summary>

# 독립 수용 기준 감사

원본: `docs/requirements/RoomFit3D_PROMPT.md`의 §17. 아래 90개 기준은 원문 요구를 추적하기 위한 감사표다. 구현 또는 스크립트 통과만으로 브라우저 검증까지 통과로 간주하지 않는다. 최신 실행 결과와 단계 상태의 원본은 `TEST_REPORT.md`와 `PROGRESS.md`다.

P0는 AC-01~51, AC-61~90의 **81개**다. AC-52~60의 9개는 선택 S6이며 이번 구현 범위에 포함하지 않는다.

| ID | 단계 | 검증 방식 | 확인해야 할 결과 | 독립 감사 상태 |
|---|---|---|---|---|
| AC-01 | S0 부분 / S3 전체 | unit+CI | 실제 polygon·2D 치수·면적 14.28㎡ 생성, 3D 최종 연동 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-02 | S1 / S3 | unit+E2E | bbox 4200×3600, 꼭짓점 `(0,-200)` 포함(음수 좌표 허용), 면적 **15.12㎡**, 3D 같은 변화 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-03 | S1 / S3 | unit+E2E | 직각 단순 도형, 면적 **13.88㎡**, 3D 오목 바닥 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-04 | S1 / S3 | unit+E2E | 면적 **14.88㎡**, 2D/3D 바닥 확장 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-05 | S1 | unit+E2E | 정확한 6개 정규 꼭짓점, 면적 **12.36㎡** | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-06 | S1 | unit+E2E | 정확한 8개 정규 꼭짓점, 면적 **13.08㎡** | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-07 | S1 | unit+E2E | 빨간 프리뷰·이유·실행 취소, 프로젝트 무변경 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-08 | S1 | unit+E2E | 실패 및 원래 polygon 보존 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-09 | S1 | unit+E2E | 정수 mm 적용, bbox 4350×3400, 면적 **14.79㎡**, 인접 변 수평/수직·연결 유지 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-10 | S1 | unit+CI | 실측 반영·정확한 포인터 위치; px 누적 오차 없음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-11 | S2 | integration+E2E | 예시치수와 동일한 실제 아이템 표시 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-12 | S2 | integration+E2E | 1500×2000×500mm, 정확한 포인터 아래 배치 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-13 | S2 | integration+E2E | world 좌표 변환 정확; 드롭 위치 점프 없음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-14 | S2 | integration+E2E | 빨간 ghost·실내 이탈 오류, 추가되지 않음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-15 | S2 | integration+E2E | 배치 거부; 이전 유효 상태 유지 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-16 | S2 | integration+E2E | 오류 없이 허용 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-17 | S2 | unit+E2E | 네 꼭짓점이 실내여도 홈 점유 시 거부 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-18 | S2 / S3 | unit+E2E | 세계축 footprint가 2000×1500mm, 2D/3D 일치 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-19 | S2 / S3 | unit+CI | 실측 W 적용; 3D 외곽도 변경 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-20 | S2 | integration+E2E | W/D+중심 수정, 반대편 코너 기준, 정확한 검사 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-21 | S2 | unit+E2E | 이유 안내·무효 확정 금지 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-22 | S2 | unit+CI | 방 편집 허용, 가구 삭제 없이 오류 표시 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-23 | S2 | unit+CI | 오류 제거, 정상 편집 가능 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-24 | S1~S2 | integration+E2E | 벽·면적·가구 경고를 이전/이후 상태로 복구 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-25 | S2 / S3 | integration+E2E | 위치·3D와 저장 상태 모두 일치 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-26 | S2 | integration+E2E | Delete, R, Ctrl+Z 등 전역 액션이 입력을 방해하지 않음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-27 | S3 | integration+E2E | polygon·가구·경고가 동일하며 프로젝트 데이터 불변 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-28 | S3 | unit+integration+E2E | 카메라가 FR-031 확정식 값(거리 `max(1.2·D, 맞춤 거리)`, 허용오차 1e-6)으로 복귀하고 방 bbox 8꼭짓점이 모두 NDC ±0.95 안, 데이터 불변 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-29 | S3 | unit+CI | 바닥 노멀 위쪽, 실내 크기 보존, 코너 큰 틈 없음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-30 | S3 | manual+E2E | 안내 + 2D 편집 유지, 앱 크래시 없음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-31 | S0 / S4 | integration+E2E | 자동 저장에서 수치와 위치 동일하게 복원 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-32 | S4 | integration+E2E | ID/치수/좌표/회전/설정 등 정해진 영속 데이터 왕복 보존 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-33 | S4 | integration+E2E | 명확히 거부, 현재 프로젝트/스토리지 보존 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-34 | S4 | integration+E2E | 가구 유실 없이 복원되고 해결 필요 경고 표시 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-35 | S4 | integration+E2E | 전체 앱 작동, 저장 실패와 수동 백업 안내 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-36 | S4 | manual+E2E | 심각한 멈춤 없이 선택·배치·저장·3D 표시 | 기능/상한 검증·rAF 측정 완료; GPU 30fps 달성 미확인 |
| AC-37 | S4 | integration+E2E | 포커스·라벨·안내 일관, 기능 버튼 실제 동작 | 키보드·포커스·레이블 자동 검증; 실제 스크린리더 수동 검증 미실행 |
| AC-38 | S0~S5 | unit+CI | 명령 성공, 경고/에러 수정, dist 생성 | 통과: 최종 npm ci/타입/lint/단위97/동일 base 빌드/자산 검사 모두 종료0 |
| AC-39 | S5 | unit+CI | JS/CSS/동적 3D 청크가 서브경로에서 로드 가능 | 통과: 동일 dist 하위 경로 Chromium/Firefox 2개 종료0; 자산 200·새로고침·실제 3D 확인 |
| AC-40 | S5 | manual+E2E | Actions 성공, `/<REPO>/` 접속·새로고침·2D/3D·저장 정상 | 통과: 승인 후 PUBLIC/Pages 설정, Actions attempt2 success, 실제 https://muminjun.github.io/roomfit-3d/ 양브라우저 편집·3D·자동복원·자산 검증 |
| AC-41 | S1 | unit+E2E | 홈이 사라져 4꼭짓점 사각형으로 **병합**(거절 아님), 면적 14.28㎡, 선택이 병합된 변으로 이동 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-42 | S1 | unit+CI | bbox 좌상단 고정, 오른쪽/아래쪽만 이동 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-43 | S2 | unit+E2E | 반대편 코너 불변, W/D 정수, 중심은 0.5mm 배수(§3.1), 벽에 접해 있던 가구는 계속 접함(오차 0), 검증 후 커밋 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-44 | S2 | integration+E2E | 항상 허용(검증이 막지 않음) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-45 | S4 | integration+E2E | 엄격히 거부, 전역 프로토타입 오염 없음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-46 | S4 | integration+E2E | 원본 보존 사본 + 새 시작 안내 / 다른 탭 변경 감지 안내, 조용한 덮어쓰기 없음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-47 | S1 | integration+E2E | 포인터 위치 기준 줌, 브라우저 페이지 확대 없음, 배율 상·하한 유지 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-48 | S1 | integration+E2E | 포인터 기준 줌 / 가로 이동 / 팬 / 팬. 토글을 “Figma 방식”으로 바꾸면 휠=세로 이동, 선택은 새로고침 후 유지(UI 설정 키), 프로젝트 JSON에는 없음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-49 | S2 | integration+E2E | 단축키 동작(`event.code`), 조합 중에는 무시 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-50 | S2 | integration+E2E | 복제본만 이동·Undo 1건 / 연속 이동 Undo 1건 / 축 고정 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-51 | S4 | integration+E2E | 표시된 단축키가 레지스트리와 일치(자동 생성), 입력창 포커스 중 전역 단축키 비동작 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-52 | S6(선택) | S6 통합+2브라우저 E2E | 서로 반영된다(지연은 측정값만 기록) | 범위 밖(S6): 구현·검증하지 않음 |
| AC-53 | S6(선택) | S6 통합+2브라우저 E2E | 두 클라이언트가 같은 최종 상태로 수렴, 데이터 유효 | 범위 밖(S6): 구현·검증하지 않음 |
| AC-54 | S6(선택) | S6 통합+2브라우저 E2E | polygon은 항상 합법(정규화 통과), 진 쪽에 알림, 가구 삭제 없음 | 범위 밖(S6): 구현·검증하지 않음 |
| AC-55 | S6(선택) | S6 통합+2브라우저 E2E | 거부+경고, 로컬 상태 유지 | 범위 밖(S6): 구현·검증하지 않음 |
| AC-56 | S6(선택) | S6 통합+2브라우저 E2E | 본인 작업만 되돌아가고 타인 작업은 유지 | 범위 밖(S6): 구현·검증하지 않음 |
| AC-57 | S6(선택) | S6 통합+2브라우저 E2E | 가구 필드는 수렴, 방 polygon revision 충돌은 안전하게 안내·재적용; 연결 상태 표시 정확 | 범위 밖(S6): 구현·검증하지 않음 |
| AC-58 | S6(선택) | S6 통합+2브라우저 E2E | MVP 전 기능 정상, 협업 UI만 비활성 | 범위 밖(S6): 구현·검증하지 않음 |
| AC-59 | S6(선택) | S6 통합+2브라우저 E2E | 상대 커서가 같은 world(mm) 지점에 이름표와 함께 표시, 가구 선택 윤곽선이 상대 색으로 보임 | 범위 밖(S6): 구현·검증하지 않음 |
| AC-60 | S6(선택) | S6 통합+2브라우저 E2E | 텍스트로만 출력, 500자·초당 2건 제한 적용, 프로젝트 JSON·자동 저장에 미포함 | 범위 밖(S6): 구현·검증하지 않음 |
| AC-61 | S1 | unit | 인접 0길이/일직선 중간점만 삭제, 99mm 변·중복 vertex id는 거부; 살아남은 선택 선분 id로 재연결 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-62 | S2 | unit+E2E | 중심 `(500.5,1000)`으로 저장되고 벽에 **정확히** 접해 유효(UT-PLC-05) / `(500,1000)`은 minX=−0.5라 `OUTSIDE_ROOM`으로 거부 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-63 | S4 | integration+E2E | `storage` 이벤트 감지 시 pending debounce 취소, 저장 상태=conflict, 명시 승인 전 덮어쓰기 없음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-64 | S3 | unit+3D | 볼록 코너 t×t 틈 0, 오목 100mm 홈에서 겹치는 삼각형 0, 실내 면적 침범 0 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-65 | S3 | unit+3D | 모든 삼각형 Y normal>0, 삼각형 면적 합=shoelace 면적 13.08㎡(오차 ≤1e-6㎡, Float32 버퍼 기준), 정점 `z=y2d/1000` | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-66 | S2 | E2E | ghost/ref 해제, 실제 가구/히스토리/스토리지 불변, 다음 DnD 정상 작동 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-67 | S0 / S2 / S4 | unit+E2E | 빈값/쉼표/NaN/Infinity/소수/음수/범위 초과, 제목 61자·가구 이름 41자, 팔레트 밖 색상 `#123456`을 UI 인라인 오류와 JSON 검증 모두에서 거부하고 무효 커밋 없음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-68 | S1 | unit | 비인접 선분 교차·겹침·T자 접촉 후보 거부, 원본 polygon 동일 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-69 | S1 | unit+E2E | 800×500 상단 함몰의 안쪽 800mm 벽 +500mm → 원본 4꼭짓점/14.28㎡, 유효한 시작 id 선택 유지 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-70 | S1+S2 | integration+E2E | 수백번 preview 후 Esc → 데이터/히스토리/저장 없음; 유효 drop만 Undo 1건·autosave 1회 예약 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-71 | S4 | unit+E2E | 알 수 없는 키를 strict schema로 거부, React 텍스트만 표시, `__proto__` 실행 영향 없음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-72 | S4 | unit+E2E | schemaVersion 999/0/누락 파일은 명확히 거부, 현재 project/history/autosave 불변 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-73 | S4 | E2E+manual | 숫자/클릭 추가/삭제/저장/뷰 전환 조작 가능, 캔버스 드래그 없더라도 주요 여정 완료 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-74 | S2 | unit | 침대 1500×2000 중심 `(1050,1250)` → left 300 / up 250 / right 2400 / down 1150 mm(UT-GEO-12); rect `[1000,1000,2000,2000]`과 `[2500,1000,3000,2000]`이 함께 있으면 첫 rect의 right=500, 둘째 rect의 left=500 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-75 | S3 | unit+integration | 2D 회전 90° → footprint 2000×1500, 3D rotation.y=−π/2, 방향 표식 동일 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-76 | S4 | unit+integration | 불변 사용자 필드·id·settings·createdAt·updatedAt 동일, import 자체는 updatedAt 변경 안 함 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-77 | S2 | unit+integration | room height 2800→2400, 기존 가구 height 2600 유지·TOO_TALL 경고; 가구 높이 수정으로 회복 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-78 | S0 | CI+manual | 의도적 `ts` 타입 오류를 임시 격리 테스트에서 만들면 `npm run typecheck`가 종료코드≠0으로 실패, 복구 후 성공; `vitest`가 `tests/e2e/**`를 수집하지 않음; CI 증거 기록 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-79 | S4 | E2E+manual | 지원 최신 Chrome/Edge/Firefox에서 주요 P0 시나리오/콘솔; Safari는 접근 가능한 경우 별도 결과로 보고 | Chrome 156/Chromium/Firefox 확인; Edge·실제 Safari 미검증 |
| AC-80 | S5 | CI+E2E | 프로젝트 하위 URL에서 entry·CSS·favicon·lazy 3D chunk 모두 200 응답(또는 로컬 서버로 동일 경로 시뮬레이션) | 통과: 동일 dist 하위 경로 Chromium/Firefox 2개 종료0; 자산 200·새로고침·실제 3D 확인 |
| AC-81 | S4 | integration | 저장 오류 뒤 기존 autosave/현재 memory project 불변, 실패 UI·JSON 내보내기 여전히 가능 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-82 | S4 | unit+manual | 64개 vertex/100개 가구 JSON은 파싱 허용, 65개/101개는 사유와 함께 거부되고 현재 프로젝트 보존; 30벽/50가구에서 측정된 UI 응답과 fps 기록 | 기능/상한 검증·rAF 측정 완료; GPU 30fps 달성 미확인 |
| AC-83 | S4 | E2E+manual | 경쟁 저장은 무충돌 보장 아님을 UI/README에 고지, 양 탭 원본 수동 JSON 백업 가능 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-84 | S3 | unit+3D | top 1000×600 돌출 후 minY=−600mm, floor=14.88㎡, 외벽 실내 바닥 침범 없음 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-85 | S2 | unit | 폭 1000mm 목표 minX=100mm → 중심 600mm 정수, 왼쪽 edge 정확히 x=100mm | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-86 | S1 | unit+E2E | 벽 이동 중 무효 후보 빨강+사유, mouseup 후 polygon/id/history/autosave 그대로 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-87 | S4 | unit+integration | 유효한 schemaVersion 2 JSON 정상 복원; 중복 vertex/furniture id·지원 불명 버전은 거부; 파일 실패 원자적 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-88 | S1+S3 | unit+E2E | 상단 800×500 **돌출**을 별도로 생성하면 14.28+0.40=**14.68㎡**(함몰 13.88㎡/1000×600 돌출 14.88㎡와 구별) | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-89 | S4 | unit+integration | 거부하지 않고 정규 방향으로 뒤집어 로드(vertex id 보존, 면적 동일), 정규화로 바뀐 내용을 교체 확인 전에 표시; 사선·구조 오류는 거부 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |
| AC-90 | S1 | unit | 새 vertex id가 `seq-1…seq-4`로 결정론적이고 두 결과가 deep-equal; 프로덕션 생성기는 `crypto.randomUUID()` 폴백 포함 | 자동 검증 근거 확인 — 아래 증거 묶음 참조 |

## 우선 점검하는 불변식

- 방 좌표·W/D/H는 안전 정수, 가구 중심만 0.5mm 배수. 접촉 허용, 1mm 양의 겹침은 거절.
- 오목 방 포함은 네 꼭짓점 대신 열린 격자 셀 중점으로 검사.
- 홈 복원 +500mm는 4점으로 병합하고 선택 ID를 살아남은 벽에 재연결.
- 방 축소/높이 축소는 기존 가구를 유지하고 경고만 파생. 무효 가구의 이름·색상·삭제는 허용.
- preview/취소/NoChange는 history/autosave를 변경하지 않음. Undo는 grid/snap을 되감지 않음.
- import 실패/취소는 project/history/selection/storage/dirty 불변. 정상 import는 메타데이터 보존.
- 손상 저장 원본 보존, storage 이벤트 시 pending debounce 취소 및 명시 해결 전 저장 중지.
- 3D 바닥 +Y normal, z=y2d/1000, 외벽 합집합 실내 침범/중복 삼각형 없음.
- 카메라 맞춤은 aspect에 따라 8개 꼭짓점 NDC ±0.95를 만족. yaw=-rotationDeg.
- 문자 단축키 event.code, composing/입력/모달 중 정지, Space는 캔버스 focus 한정.
- Pages는 한 번 빌드한 dist를 검사 후 그대로 업로드. 원격 미실행은 미검증으로 명시.


## 독립 브라우저 검증 — S0 기반

`npx playwright test tests/e2e/root-smoke.spec.ts --project=chromium --project=firefox --workers=1 --reporter=line`: 종료 코드 0, 8개 통과(7.7초). Chromium/Firefox 설치 완료. 테스트: JSON에서 기본 방 꼭짓점·schemaVersion·단위·높이/두께 확인 및 새로고침 후 전체 필드 동일, 소수 입력 거절 후 Esc 취소와 원본 동일, 쉼표 치수 파싱, 390px 화면의 수치 생성/JSON 백업/가로 넘침 없음.

이는 AC-01/31/67/73의 기반 부분 검증이다. 3D·가구 3개 복원·전체 키보드 사용자 여정까지 통과로 확대 해석하지 않는다. 최초 실패에서 발견한 쉼표 미지원과 Esc 모달 미지원은 수정 후 같은 테스트로 통과를 확인했다.


## 최종 증거 묶음과 해석 범위 (2026-11-03)

표의 자동 검증 표시는 해당 요구와 연관된 독립 계산 및 실제 브라우저 동작을 확인했다는 뜻이다. 모든 운영체제·물리 입력장치·보조기술까지 직접 확인했다는 뜻은 아니다. 최신 통합 실행 수/종료코드는 `TEST_REPORT.md`와 최종 검증 절을 함께 읽는다.

| 범위 | 실제 검증 파일/관찰 |
|---|---|
| AC-01~10, 41~42, 61, 68~69, 86, 88, 90 | `tests/unit/geometry.test.ts`, `room-commands.test.ts`, `tests/e2e/room-editor.spec.ts`, `root-smoke.spec.ts`: 고정 면적·벽/홈·병합·ID·실제 좌표 JSON·취소·줌/팬 |
| AC-11~26, 43~44, 49~50, 62, 66, 70, 74, 77, 85 | `tests/unit/furniture-commands.test.ts`, `geometry.test.ts`, `history.test.ts`, `tests/e2e/furniture-editor.spec.ts`, `root-smoke.spec.ts`: 실제 DnD/핸들·양의 겹침·오목 포함·반 mm·invalid 복구·Undo·IME·Alt 복제 |
| AC-27~30, 64~65, 75, 84 | `tests/unit/viewer3d.test.ts`, `independent-viewer3d.test.ts`, `tests/e2e/viewer3d.spec.ts`: 실제 메시/법선/면적/벽 합집합·독립 투영 이분탐색·실제 Canvas/카메라/폴백/컨텍스트 손실/상태 동기화 |
| AC-31~35, 45~46, 63, 67, 71~72, 76, 81, 83, 87, 89 | `tests/unit/storage-schema.test.ts`, `tests/integration/autosave.test.ts`, `tests/e2e/storage-editor.spec.ts`, `import-boundaries.spec.ts`, `root-smoke.spec.ts`: 실제 JSON/스토리지 원자성, 손상·쿼터·보안 예외·다중 탭·버전/프로토타입·메타데이터/정규화 취소 |
| AC-36, 82 | `tests/unit/fixture-boundaries.test.ts`, `tests/e2e/performance.spec.ts`, `import-boundaries.spec.ts`: 30벽/50가구 기능, 64점/100가구 허용, 65점/101가구 거절. rAF cadence는 Chromium 약10.10Hz/Firefox 약57.92Hz 측정이며 GPU fps 보장이 아님 |
| AC-37, 47~48, 51, 73 | `tests/e2e/accessibility.spec.ts`, `room-editor.spec.ts`, `furniture-editor.spec.ts`, `root-smoke.spec.ts`: HTML 대체 조작·좁은 화면·포커스/도움말·단축키. 실제 스크린리더, 물리 트랙패드/핀치는 별도 수동 미검증 |
| AC-38~40, 78, 80 | 단계별 npm 게이트와 고의 TS 오류 음성 검사. S5 최종 `npm ci` 및 동일 dist 하위 경로 검사 진행 중. 원격 배포는 미실행 |
| AC-79 | 설치된 Google Chrome156.0.8078.74 대표5개 추가 검사 종료0(7.9초), Chromium/Firefox 전체 E2E. Edge/Safari는 미검증 |

`TEST_REPORT.md`의 코드 구현/부분 검증과 완전한 통과를 구분한다. 특히 실제 스크린리더 검증과 원격 배포는 위 자동 검증으로 대체하지 않는다.


## S5 독립 최종 검사

2026-11-03 로컬 `npm ci` 종료0(249 packages, 22초) → `npm run typecheck` 종료0 → `npm run lint` 종료0 → `npm run test` 종료0(97개/10파일) → `VITE_BASE_PATH=/roomfit-3d/ npm run build` 종료0(한 번) → 같은 base `npm run check:dist` 종료0(26개 자산 참조/7개 JS 파일) → `npm run test:e2e:subpath` 종료0(Chromium/Firefox 2개, 2.6초).

실제 `/roomfit-3d/`에서 entry/CSS/favicon/새 lazy 3D 청크 로드, 실제 Canvas, 2D 복귀와 새로고침, 404/페이지 오류 없음 확인. 빌드된 10개 dist 파일의 SHA256을 브라우저 검사 전후 비교하여 모두 동일함을 확인했다. npm audit --omit=dev는 종료0, 취약점0개. 개발 의존성의 moderate10개 및 whatwg-encoding deprecation은 별도 기록하며 force 업데이트하지 않았다.


최종 기본 전체 재검증: `npm run test:e2e -- --workers=1 --reporter=line` 종료0, Chromium/Firefox92개 통과(1.2분). 오래된 dev optimizer 캐시504는 서버 재시작으로 해소했고 소스/dist 변경은 없었다. 최신 성능 cadence는 Chromium49.71Hz/Firefox56.98Hz로 관측되었으며 이전 측정과의 변동도 그대로 보고한다.


AC-40 최종 원격 검증 통과: [Actions 재실행2](https://github.com/muminjun/roomfit-3d/actions/runs/41546473922) success, 실제 사이트 양브라우저 검증 종료0. 세부 자산 응답은 `remote-evidence.json`. 이전 원격 미실행 문구는 승인 이전 기록이다.

</details>
