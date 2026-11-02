# 배포 준비 독립 감사

확인일: 2026-11-02. 저장소: https://github.com/muminjun/roomfit-3d (비공개). 로컬: `/Users/minjun/Documents/development/roomfit-3d`.

## 공식 출처와 실제 릴리스 확인

[Vite 공식 정적 배포 안내](https://vite.dev/guide/static-deploy)는 아래 현재 major를 예시로 사용한다. [GitHub Pages 사용자 워크플로 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)는 이전 major 예시가 일부 남아 있어 실제 릴리스 API로 교차 확인했다.

`gh api repos/actions/<name>/releases/latest --jq '{tag_name, published_at, html_url}'` 각각 종료 코드 0:

| Action | 확인된 최신 안정 릴리스 | 게시일(UTC) |
|---|---|---|
| checkout | [v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1) | 2026-07-20 |
| setup-node | [v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0) | 2026-10-08 |
| configure-pages | [v6.0.0](https://github.com/actions/configure-pages/releases/tag/v6.0.0) | 2026-03-25 |
| upload-pages-artifact | [v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0) | 2026-04-10 |
| deploy-pages | [v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1) | 2026-09-01 |

실행 환경 Node v22.15.0, npm 10.9.2. CI도 Node22를 사용하고 package-lock.json 기준 npm ci를 실행한다.

## 배포 계약

- main push + workflow_dispatch. contents:read, pages:write, id-token:write. github-pages environment와 concurrency 적용.
- typecheck/lint/test 후 저장소명에서 base를 계산하고 한 번 빌드한 dist를 검사/업로드한다.
- `/roomfit-3d/` 아래 entry/CSS/favicon/lazy 3D 청크 로딩을 production preview에서 확인한다.
- 원격 push·Pages 활성화·원격 URL 실행은 아직 미실행이다. 명세상 push 전 별도 승인 조건을 따른다.
- 비공개 저장소 Pages는 요금제 확인 필요. 공개 전환은 현재 수행하지 않았다. 무료 플랜은 공개 저장소 Pages를 지원한다([GitHub 공식 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)).

## 결과

AC-39/80 로컬 검증 통과: 최종 dist를 /roomfit-3d/로 한 번 빌드하고 정적 자산26참조/7개 JS를 검사했다. Chromium/Firefox에서 하위 경로 entry/CSS/favicon/lazy3D/실제Canvas/새로고침2개 테스트 종료0. 10개 dist 파일 SHA256이 검사 전후 동일하다. AC-40 원격 push/Pages는 미실행이며 승인과 private Pages 플랜 확인이 필요하다.
