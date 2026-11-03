import { useEffect, useId, useState } from "react";
import { LIMITS } from "../../config/limits";
import styles from "../../styles/App.module.css";

export function NumberField({
  label,
  value,
  onCommit,
  half = false,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  half?: boolean;
}) {
  const [text, setText] = useState(String(value));
  const [error, setError] = useState(false);
  const id = useId();
  const bounds = label.startsWith("전체 ") ? [LIMITS.roomMin, LIMITS.roomMax]
    : label.startsWith("벽 높이") ? [LIMITS.heightMin, LIMITS.heightMax]
    : label.startsWith("벽 두께") ? [LIMITS.wallMin, LIMITS.wallMax]
    : label.startsWith("높이 H") ? [LIMITS.furnitureHeightMin, LIMITS.furnitureHeightMax]
    : label.startsWith("가로 W") || label.startsWith("깊이 D") ? [LIMITS.furnitureMin, LIMITS.furnitureMax] : null;
  useEffect(() => setText(String(value)), [value]);
  return (
    <label className={styles.field}>
      {label}
      <input
        aria-label={label}
        value={text}
        inputMode="numeric"
        aria-invalid={error || undefined}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const cleaned = text.replace(/[\s,]/g, "");
          if (
            half
              ? /^-?\d+(?:\.5)?$/.test(cleaned) &&
                Number.isSafeInteger(Number(cleaned) * 2)
              : /^-?\d+$/.test(cleaned) && Number.isSafeInteger(Number(cleaned))
          ) {
            if (bounds && (Number(cleaned) < bounds[0] || Number(cleaned) > bounds[1])) { setError(true); return; }
            setError(false);
            onCommit(Number(cleaned));
          } else setError(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      <small id={`${id}-hint`}>{bounds ? `${bounds[0].toLocaleString()}–${bounds[1].toLocaleString()} mm` : "0.5 mm 단위"}</small>
      {error && (
        <small id={`${id}-error`} className={styles.error} role="alert">
          {bounds ? "표시된 범위의 정수를 입력해 주세요." : half ? "0.5 mm 단위로 입력해 주세요." : "정수 치수를 입력해 주세요."}
        </small>
      )}
    </label>
  );
}
