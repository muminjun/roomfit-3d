# 설계 결정
- 2026-11-02: 신규 전용 저장소에서 feat/roomfit-mvp 브랜치로 진행. 기존 사용자 작업 없음. 추가 worktree는 생성하지 않음.
- 사용자 실행/병렬 요청에 따라 승인 대기 없이 S0~S5 구현. 구현 에이전트는 서로 다른 파일만 소유.
- CSS Modules 사용. 모델은 mm, Konva는 파생 좌표, 3D만 m.
- React19/R3F9/drei10/react-konva19 peerDependencies를 npm view로 확인. 프리릴리스 제외.
- 외부 JSON 반시계 입력은 id 유지 반전, strict schema 및 구조 검증 후 사용자 확인.
- 원격 push/Pages 활성화는 승인 전 금지; 로컬 배포 파일과 subpath 검증은 수행.
- 타입 정의용 @types/react/react-dom/three/node는 strict TypeScript 컴파일에 필요한 개발 의존성 예외로 허용 목록에 보완. 런타임 허용 목록은 유지.
- DOM→Stage는 컨테이너 client rect를 뺀 CSS 좌표에 단일 viewport 역변환을 사용하며 DPR을 직접 곱하지 않는다.
- UI 숫자 입력은 문자열로 보관, 쉼표와 공백 제거 후 검증; 빈 값은0으로 강제 변환하지 않음.
- 정규화는 양옆 점 사이에 있는 일직선 중간점만 제거. 역주행 collinear 경로는 SELF_TOUCH로 거절하여 잘못된 구조를 숨기지 않음.
- 의존성 audit: 10개 moderate 표시는 개발용 ESLint 계열 minimatch GHSA 한 건의 전파이며 `npm audit --omit=dev`는0개. npm audit fix가 추천하는 ESLint4 다운그레이드는 호환 파괴이므로 적용하지 않음. 최신 minimatch11을 ^10 의존성에 강제 override하는 방식도 검증되지 않은 semver 변경이라 유지하지 않음. 후속 호환 upstream 릴리스를 기다리며 잔존 개발 도구 위험은 docs/dependency-audit.md에 기록.
- 3D 외벽 합집합은 모든 벽띠·볼록 코너 패치와 polygon 좌표를 포함한 격자에서 계산하고 실내 셀을 제외한다. 폭100mm홈에 두께500mm벽이 있을 때 중간 벽띠가 맞은편 실내로 넘어갈 수 있으므로, ‘실내 침범 실패’는 최종 출력 셀에 대한 불변식으로 해석한다. 최종 mesh는 실내 양의 면적 침범과 중복 내부 면을 허용하지 않는다.
- 3D 초기 카메라 거리는 PRD의8개 꼭짓점 NDC 맞춤 조건을 독립 PerspectiveCamera 이분탐색과1e-6으로 비교한다. 500×500×5000mm처럼 합법적이지만 매우 좁고 높은 방은 맞춤 거리가6D보다 커서 OrbitControls가 즉시 축소하면 방이 잘리므로, 이 경우에만 최대 거리를 max(6D,맞춤 거리)로 확장한다. 일반 방의6D 제한은 그대로다.
- 실제 모델 외벽은 불변이며 3D에서는 실내 가구를 확인할 수 있게 벽 재질을 반투명(opacity0.4,depthWrite false)으로 표시한다.

- 2026-11-03 최종 번들: Vite/Rolldown이 실제 지원하는 codeSplitting groups로 React/Konva/Three core/renderer를 분리했다. 경고 한도나 의존성 버전을 바꾸지 않았고, `/tmp` 실험 후 최종 dist는 `/roomfit-3d/`로 한 번만 빌드했다. 각 청크500kB 미만이며 실제 lazy3D 네트워크/Canvas를 두 브라우저에서 검증했다.
- 최종 배포 검사는 production preview4174에 같은 base를 적용하고, 10개 dist 파일 SHA256이 검사 전후 같음을 확인했다. 개발용4173 서버와 분리하여 미검증 산출물로 바뀌지 않게 했다.
- 가구 중심의±30000mm 제한은 PRD에 없는 제약이므로 제거했다. 안전한0.5mm 배수·유한성은 유지하며,31000mm에 있는 기존 invalid 가구도 JSON에서 보존하고 경고를 파생한다.
- 원격 repo 생성/clone은 사용자 명시 요청으로 수행했지만 원본 프롬프트가 단계별 push를 금지하고 원격 push를 별도 확인 대상으로 지정하므로 코드 공개·push·Pages 설정은 최종 검토 후 승인 대상으로 남긴다. 비공개 저장소의 Pages 플랜도 미확인이다.
- 재설치 후 오래된 Vite dev 서버가 예전 node_modules/.vite URL에504를 반환했다. 실제 응답에서 원인을 확인하고 dev 서버만 --force로 재시작했다. 소스/production dist를 바꾸지 않고 같은 기본 E2E를 재실행한다.

- 2026-11-03 사용자 `ㅇㅇ` 승인으로 main push를 진행했다. 비공개 Pages 생성은 플랜 제한422로 거절되어 코드/기록 공개의 영향을 설명하고 추가 확인을 요청했다. 사용자 `승인` 후 PUBLIC 전환과 Pages Actions 설정을 실행했다. 기존 기록의 원격 금지/미공개 문구는 승인 이전 이력이며 현재 적용 상태가 아니다.

## 2026-11-03 P0 보완과 사용자 추가 범위

- 사용자의 이번 실행 요청은 검증 후 main 반영·push·Pages 재배포를 포함한다. 원문 요구사항 파일은 변경하지 않는다. 작업은 fix/interaction-and-home-planning 브랜치에서 진행한다. 기존 지시의 임의 확장 금지는 사용자가 명시한 문·창문·욕실·주방·현관·추가 아이템에는 적용하지 않는다. S6/AI/서버/GLB/여러 층은 추가하지 않는다.
- 사용자의 “안 맞아도 돌아져야” 요청에 따라 rotateFurniture만 구조 스키마를 통과하면 확정하고 배치 경고를 파생한다. 원문 FR-022/024/025의 무효 회전 확정 금지를 의도적으로 변경했다. 이동/리사이즈/새 배치의 유효 최종 상태 규칙은 유지한다. 회전으로 인한 무효도 JSON/Undo에서 보존한다.
- 한 외곽 polygon에 칸막이와 이름 있는 구역을 추가하는 방식을 기본으로 정했다. 독립된 여러 방의 연결 토폴로지와 구역 표시는 다르며 전자를 구현했다고 말하지 않는다. 잘못 선택했다면 추가 모델 설계가 필요하다.
- schemaVersion2는 유지한다. room.partitions/openings/zones 및 furniture.operation은 optional이고 구형 파일에는 빈 필드를 덧붙이지 않는다. 확장 필드를 포함한 파일은 이전 앱에서 엄격한 스키마로 거절될 수 있다. IDs는 새 항목까지 프로젝트 전역 고유, 엄격한 필드·정수/반 mm·용량 상한을 적용한다.
- 운영 여유는 앞면 전체의 보수적 직사각형이다. 정확한 문짝 호 궤적·제조사 설치 여유·법규 판단이 아니며 설정 가능한 파생 경고다. 방/가구/칸막이 충돌과 같은 데이터에 근거한다.
- 문·창문 개구부는 호스트별로 제거한 벽 체적을 합집합한다. 교차하는 다른 벽까지 뚫지 않는다. 외벽은 기존 실내 제외 클리핑을 유지한다. 표면의 국소 격자만 나누어 64칸막이/100개구부에서 전역3D격자 폭발을 방지했다. 무효 개구부는 데이터는 남기되 충돌/3D 모두 통로로 사용하지 않는다.
- 반시계/일직선 정규화는 외벽의 outgoing edge ID를 바꾸므로 개구부의 world 구간을 보존하도록 host/offset/hinge도 변환한다. 연결할 수 없는 기존 무효 항목은 다른 벽으로 옮기지 않고 고아 참조 경고를 남긴다.
- Undo/Redo/동일ID 프로젝트 교체도 진행 중 드래그를 취소한다. Space 팬·작은 흔들림·blur/pointercancel은 히스토리와 저장을 만들지 않는다. 숫자 범위 힌트는 aria-describedby로 전달하면서 입력의 접근 이름은 기존 라벨 그대로 유지한다.
- 첫 진입은 welcome 화면, valid 저장본만 이어하기를 제공한다. welcome dismissed UI 설정은 프로젝트 저장과 분리한다. 편집기 집중 테스트는 이 UI 설정만 초기화하며 사용자 프로젝트 저장본을 심거나 지우지 않는다.
- jsdom은 Node22.15를 지원하는 안정27.4.0으로 올려 deprecated whatwg-encoding을 제거했다. minimatch11 강제 override/ESLint4 다운그레이드는 하지 않는다.
- 진단의 CPU 제출 시간, 실제 렌더 프레임 간격, WebGL draw calls와 삼각형 수는 GPU 완료 시간 또는 지속 GPU fps와 다르다. GPU 타이머 사용 불가를 그대로 기록한다.

- 사용자 지시로 Edge 검증을 중단했다. 다운로드한 pkg·추출 앱·실행 중 생성된 지원 데이터/환경설정과 프로세스는 제거했으며 다시 설치/실행하지 않는다. 설치된 기존 Chrome 및 격리된 Playwright Chromium/Firefox만 후속 검증에 사용한다.
- 팬 중 도구 전환 후 Konva의 draggable 상태를 과거 값으로 복원하면 벽 이동 도구에서도 가구가 움직일 수 있었다. 현재 도구에 따라 복원하고 취소 이벤트에서 정리하며 resize 핸들도 선택 도구일 때만 드래그한다.
- 첫 welcome에서 JSON import 성공 시 기존 가져온 도면을 보존하며 편집기로 진입한다. 이 경로의 callback 누락을 실패 E2E로 재현한 뒤 보완했다.
