# 독립 입력·성능 검증 데이터

- `performance-30walls-50furniture.json`: 20×20m ㄱ자 공간의 상단 홈 6개. 직각 변 30개, 서로 겹치지 않는 500×500×950mm 의자 50개.
- `boundary-64vertices-100furniture.json`: 30×20m 공간의 상단 홈 15개. 직각 변 64개, 의자 100개. 허용되는 입력 상한이다.
- `invalid-65vertices.json`: 허용 상한 fixture에 꼭짓점 1개를 추가한 거절 입력.
- `invalid-101furniture.json`: 허용 상한 fixture에 가구 1개를 추가한 거절 입력.

모든 ID와 날짜는 고정하여 재현 가능하다. 가구 샘플의 편집된 치수는 해당 인스턴스에만 적용한다. 성능 데이터의 단순한 치수/색상은 실제 구매 제품이 아니다.

파일 생성 자체는 통과 증거가 아니다. schema/geometry/placement 검증 후 브라우저 JSON 가져오기에서 30벽/50가구를 로드하고 선택·숫자 편집·저장·3D 전환의 실제 응답 시간과 requestAnimationFrame 간격을 측정한다. 기기·브라우저·headless 여부와 샘플 길이를 기록하고 실제 측정 전 fps 수치를 주장하지 않는다. 65점/101가구 거절 시 현재 프로젝트/히스토리/저장본 보존도 확인한다.
