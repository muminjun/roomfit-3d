import { useEffect, useRef } from "react";
import { shortcutHelp } from "../../config/shortcuts";
import styles from "../../styles/App.module.css";
export function HelpDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const node = ref.current;
    node?.querySelector<HTMLButtonElement>("button")?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const elements = [
        ...node.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,select,a[href]",
        ),
      ];
      if (!elements.length) return;
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className={styles.overlay}>
      <div
        ref={ref}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        <h2 id="help-title">사용 안내와 단축키</h2>
        <p>
          1. 실측한 방을 만듭니다. 2. 벽과 가구를 배치합니다. 3. 3D로 살펴보고
          JSON으로 백업합니다.
        </p>
        <p>
          실제 제품 치수, 문틀과 설치 여유는 별도로 확인해 주세요. 자동 저장은
          이 브라우저에만 보관되며, 여러 탭 동시 편집은 충돌 없이 저장됨을
          보장하지 않습니다.
        </p>
        {shortcutHelp.map(({ label, description }) => (
          <div className={styles.info} key={label}>
            <span>{label}</span>
            <b>{description}</b>
          </div>
        ))}
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
