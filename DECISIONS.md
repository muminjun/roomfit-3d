# 설계 결정
- 2026-11-02: 신규 전용 저장소에서 feat/roomfit-mvp 브랜치로 진행. 기존 사용자 작업 없음. 추가 worktree는 생성하지 않음.
- 사용자 실행/병렬 요청에 따라 승인 대기 없이 S0~S5 구현. 구현 에이전트는 서로 다른 파일만 소유.
- CSS Modules 사용. 모델은 mm, Konva는 파생 좌표, 3D만 m.
- React19/R3F9/drei10/react-konva19 peerDependencies를 npm view로 확인. 프리릴리스 제외.
- 외부 JSON 반시계 입력은 id 유지 반전, strict schema 및 구조 검증 후 사용자 확인.
- 원격 push/Pages 활성화는 승인 전 금지; 로컬 배포 파일과 subpath 검증은 수행.
