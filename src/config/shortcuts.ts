export type ShortcutAction =
  | "select"
  | "wallMove"
  | "indent"
  | "protrude"
  | "undo"
  | "redo"
  | "rotate"
  | "rotateBack"
  | "delete"
  | "duplicate"
  | "nudgeLeft"
  | "nudgeRight"
  | "nudgeUp"
  | "nudgeDown"
  | "fit"
  | "actualSize"
  | "fitSelection"
  | "zoomIn"
  | "zoomOut"
  | "save"
  | "help"
  | "view2d"
  | "view3d";
type Definition = {
  action: ShortcutAction;
  label: string;
  description: string;
  match: (e: KeyboardEvent) => boolean;
};
const plain = (e: KeyboardEvent) => !e.ctrlKey && !e.metaKey && !e.altKey;
const mod = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;
export const shortcuts: Definition[] = [
  {
    action: "select",
    label: "V",
    description: "선택 도구",
    match: (e) => plain(e) && !e.shiftKey && e.code === "KeyV",
  },
  {
    action: "wallMove",
    label: "W",
    description: "벽 이동",
    match: (e) => plain(e) && !e.shiftKey && e.code === "KeyW",
  },
  {
    action: "indent",
    label: "I",
    description: "함몰",
    match: (e) => plain(e) && !e.shiftKey && e.code === "KeyI",
  },
  {
    action: "protrude",
    label: "P",
    description: "돌출",
    match: (e) => plain(e) && !e.shiftKey && e.code === "KeyP",
  },
  {
    action: "undo",
    label: "Ctrl·⌘ Z",
    description: "실행 취소",
    match: (e) => mod(e) && !e.shiftKey && e.code === "KeyZ",
  },
  {
    action: "redo",
    label: "Ctrl·⌘ Shift Z / Ctrl Y",
    description: "다시 실행",
    match: (e) =>
      mod(e) && ((e.shiftKey && e.code === "KeyZ") || e.code === "KeyY"),
  },
  {
    action: "rotate",
    label: "R",
    description: "가구 회전",
    match: (e) => plain(e) && !e.shiftKey && e.code === "KeyR",
  },
  {
    action: "rotateBack",
    label: "Shift R",
    description: "가구 반대 회전",
    match: (e) => plain(e) && e.shiftKey && e.code === "KeyR",
  },
  {
    action: "delete",
    label: "Delete / Backspace",
    description: "가구 삭제",
    match: (e) => plain(e) && ["Delete", "Backspace"].includes(e.code),
  },
  {
    action: "duplicate",
    label: "Ctrl·⌘ D",
    description: "가구 복제",
    match: (e) => mod(e) && e.code === "KeyD",
  },
  ...(["Left", "Right", "Up", "Down"] as const).map((direction) => ({
    action: `nudge${direction}` as ShortcutAction,
    label: `${direction} 방향키`,
    description: "가구 이동 (Shift: 5격자, Alt: 1 mm)",
    match: (e: KeyboardEvent) => !mod(e) && e.code === `Arrow${direction}`,
  })),
  {
    action: "fit",
    label: "F / Shift 1",
    description: "전체 보기",
    match: (e) =>
      plain(e) && (e.code === "KeyF" || (e.shiftKey && e.code === "Digit1")),
  },
  {
    action: "actualSize",
    label: "Shift 0",
    description: "100% 보기",
    match: (e) => plain(e) && e.shiftKey && e.code === "Digit0",
  },
  {
    action: "fitSelection",
    label: "Shift 2",
    description: "선택 항목 보기",
    match: (e) => plain(e) && e.shiftKey && e.code === "Digit2",
  },
  {
    action: "zoomIn",
    label: "Ctrl·⌘ +",
    description: "확대",
    match: (e) => mod(e) && ["Equal", "NumpadAdd"].includes(e.code),
  },
  {
    action: "zoomOut",
    label: "Ctrl·⌘ −",
    description: "축소",
    match: (e) => mod(e) && ["Minus", "NumpadSubtract"].includes(e.code),
  },
  {
    action: "save",
    label: "Ctrl·⌘ S",
    description: "JSON 내보내기",
    match: (e) => mod(e) && e.code === "KeyS",
  },
  {
    action: "help",
    label: "?",
    description: "단축키 도움말",
    match: (e) => plain(e) && e.shiftKey && e.code === "Slash",
  },
  {
    action: "view2d",
    label: "Alt 1",
    description: "2D 편집",
    match: (e) => e.altKey && e.code === "Digit1",
  },
  {
    action: "view3d",
    label: "Alt 2",
    description: "3D 보기 안내",
    match: (e) => e.altKey && e.code === "Digit2",
  },
];
export const shortcutHelp = [
  { label: "Esc", description: "진행 중인 작업 취소" },
  ...shortcuts.map(({ label, description }) => ({ label, description })),
  { label: "Space / 가운데 버튼 드래그", description: "화면 이동" },
  { label: "Alt + 가구 드래그", description: "가구 복제" },
  { label: "Alt + 가구 위 포인터", description: "도면상 최단거리" },
];
export function resolveShortcut(event: KeyboardEvent) {
  return shortcuts.find((shortcut) => shortcut.match(event))?.action;
}
