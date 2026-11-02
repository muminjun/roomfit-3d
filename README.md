# RoomFit 3D
실측 mm 기반 단일 공간·한 층의 2D·3D 가구 배치 도구입니다. 2D·3D 편집기와 로컬 배포 검증을 구현했습니다. 원격 배포는 아직 수행하지 않았습니다. 단계별 상태와 실제 검증 결과는 [PROGRESS.md](PROGRESS.md), [TEST_REPORT.md](TEST_REPORT.md)를 확인하세요. 기준 명세는 [원본 요구사항](docs/requirements/RoomFit3D_PROMPT.md)입니다.

Node **22.15.0**과 npm을 사용합니다. React19 + TypeScript strict + Vite, react-konva, Three.js/R3F9/Drei10, Zustand, Zod, CSS Modules로 구성합니다. 런타임 의존성은 명세 허용 목록으로 제한하며 외부 폰트·사진·모델·아이콘을 사용하지 않습니다.

```sh
cd /Users/minjun/Documents/development/roomfit-3d
npm ci
npm run dev
```

```sh
npm run typecheck
npm run lint
npm run test
npx playwright install chromium firefox
npm run test:e2e
npm run build
npm run preview
```

`typecheck`는 `tsc -b`로 실제 소스를 검사합니다. Vitest는 `tests/e2e`를 수집하지 않습니다. 기본 E2E는 Chromium과 Firefox를 실행합니다. 설치된 실제 Chrome은 `RUN_CHROME=1` 및 `--project=chrome`, Edge는 `PLAYWRIGHT_EDGE=1` 및 `--project=edge`로 선택 실행하며 해당 브라우저 설치가 필요합니다. 설치하지 못한 브라우저 결과는 통과로 표시하지 않습니다.

실내 polygon은 직각 단순 다각형이며 좌표와 치수는 mm 정수입니다. 가구 위치는 바닥 footprint 중심이며 0.5mm 단위로 보존합니다. 방 경계 접촉·가구끼리의 접촉은 허용하고 양의 면적 겹침은 차단합니다. 방을 줄인 뒤 기존 가구가 무효가 되면 가구를 유지하며 경고를 표시합니다.

자동 저장은 현재 브라우저에만 적용됩니다. 다른 기기·브라우저·시크릿 모드와 동기화하지 않으며 브라우저 데이터를 삭제하면 복구되지 않을 수 있습니다. JSON 파일을 별도로 백업하세요. 여러 탭 동시 편집은 지원하지 않으며 localStorage만으로 경쟁 저장의 무충돌을 보장할 수 없습니다. 손상 저장본은 명시적 처리 전 덮어쓰지 않습니다. schemaVersion2 JSON을 사용하며 v1 마이그레이션은 제공하지 않습니다.

RoomFit 3D는 공간 배치 계획 도구입니다. 가구 샘플은 제품 규격이 아닌 예시이며 몰딩·문틀·설치 여유·배송 반입 경로·전문 실측·구조 안전·시공 가능성을 판정하지 않습니다. 구매와 시공 전 현장 및 제품 치수를 다시 확인하세요. 문·창·여러 방·GLB·AI·실시간 협업은 이번 MVP 범위에 포함하지 않습니다.

GitHub Pages 프로젝트 경로는 설정 저장소명에서 파생합니다. `VITE_BASE_PATH`가 우선하며 다음 명령으로 하위 경로를 확인합니다.

```sh
VITE_BASE_PATH=/roomfit-3d/ npm run build
VITE_BASE_PATH=/roomfit-3d/ npm run check:dist
npm run test:e2e:subpath
VITE_BASE_PATH=/roomfit-3d/ npm run preview -- --host 127.0.0.1
```

Actions는 같은 base로 한 번 빌드한 `dist`를 검사한 후 그대로 업로드합니다. 승인 후 저장소의 `Settings → Pages → Build and deployment → Source: GitHub Actions` 설정이 필요합니다. 저장소는 private으로 만들었으며 개인 요금제에 따라 Pages 사용이 제한될 수 있고 Pages 사이트는 공개될 수 있습니다. 예상 경로는 `https://muminjun.github.io/roomfit-3d/`이지만 **원격 push·Pages 활성화·URL 검증은 아직 수행하지 않았습니다.**


최종 검증: 단위/통합97개, 동일 dist의 하위 경로 Chromium/Firefox2개 통과. 실제Chrome 대표5개 추가 통과. 기본 전체 E2E92개도 통과했습니다. 상세 결과는 TEST_REPORT에 기록합니다. 의존성을 재설치한 뒤 기존 개발 서버가 오래된 최적화 URL을 참조하면 서버를 다시 시작하세요.

최종 번들은 앱164.88kB, React347.58kB, Konva133.03kB와 지연3D195.48kB, Three renderer365.22kB/core383.44kB로 분리되어 Vite 청크 크기 경고가 없습니다. 런타임 보안 audit은0개이며 개발 도구의 moderate10개 및 테스트 의존성 deprecation은 `docs/dependency-audit.md`에 한계를 기록했습니다. 실제 Edge/Safari·스크린리더·물리 트랙패드/핀치는 미검증이고, 측정된 rAF 주기는 GPU fps 또는30fps 보장이 아닙니다.
