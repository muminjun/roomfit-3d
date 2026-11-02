/** User-facing descriptions of geometry and placement failures. */
export const geometryMessages: Record<string, string> = {
  TOO_FEW_POINTS: "방에는 꼭짓점이 네 개 이상 필요합니다.",
  TOO_MANY_POINTS: "방의 꼭짓점은 64개 이하여야 합니다.",
  DUPLICATE_CLOSING_POINT: "마지막 꼭짓점에 첫 점을 중복할 수 없습니다.",
  INVALID_ID: "꼭짓점 ID가 비어 있습니다.",
  DUPLICATE_ID: "꼭짓점 ID가 중복되었습니다.",
  INVALID_COORDINATE: "꼭짓점 좌표는 범위 안의 정수여야 합니다.",
  NOT_ORTHOGONAL: "벽은 수평 또는 수직이어야 합니다.",
  SEGMENT_TOO_SHORT: "벽 길이는 100mm 이상이어야 합니다.",
  DUPLICATE_POINT: "서로 다른 꼭짓점이 같은 위치에 있습니다.",
  SELF_INTERSECTION: "벽이 서로 교차합니다.",
  SELF_TOUCH: "서로 떨어진 벽이 맞닿거나 겹칩니다.",
  COLLINEAR: "같은 직선 위에 불필요한 꼭짓점이 있습니다.",
  ODD_POINT_COUNT: "직각 방의 꼭짓점 수는 짝수여야 합니다.",
  INVALID_BOUNDS: "방의 가로와 세로는 각각 500~30,000mm여야 합니다.",
  INVALID_ORIENTATION: "방의 방향 또는 면적이 올바르지 않습니다.",
  INVALID_PARAMS: "입력한 벽 편집 값이 허용 범위를 벗어났습니다.",
  OUTSIDE_ROOM: "가구가 방 바닥 밖 영역을 가로지릅니다.",
  FURNITURE_OVERLAP: "다른 가구와 겹칩니다.",
  TOO_TALL: "가구 높이가 방 높이를 초과합니다.",
  INVALID_DIMENSIONS: "가구의 크기, 위치 또는 회전 값이 올바르지 않습니다.",
};
export const geometryMessage = (code: string) =>
  geometryMessages[code] ?? "도형을 처리할 수 없습니다.";
