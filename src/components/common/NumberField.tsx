import { useEffect, useId, useRef, useState } from "react";
import { LIMITS } from "../../config/limits";
import styles from "../../styles/App.module.css";

type FieldResult = void | { ok: boolean; issues?: { message: string }[] };
export function NumberField({ label, value, onCommit, half = false, min, max }: {
  label: string; value: number; onCommit: (value: number) => FieldResult; half?: boolean; min?: number; max?: number;
}) {
  const [text, setText] = useState(String(value));
  const [error, setError] = useState("");
  const cancelBlur = useRef(false);
  const id = useId();
  const inferred = label.startsWith("전체 ") ? [LIMITS.roomMin, LIMITS.roomMax]
    : label.startsWith("벽 높이") ? [LIMITS.heightMin, LIMITS.heightMax]
    : label.startsWith("벽 두께") ? [LIMITS.wallMin, LIMITS.wallMax]
    : label.startsWith("높이 H") ? [LIMITS.furnitureHeightMin, LIMITS.furnitureHeightMax]
    : label.startsWith("가로 W") || label.startsWith("깊이 D") ? [LIMITS.furnitureMin, LIMITS.furnitureMax] : null;
  const lower = min ?? inferred?.[0], upper = max ?? inferred?.[1];
  const hint = lower !== undefined && upper !== undefined ? `${lower.toLocaleString()}–${upper.toLocaleString()} mm` : half ? "0.5 mm 단위" : "정수 mm 단위";
  useEffect(() => { setText(String(value)); setError(""); }, [value]);
  function commit() {
    if (cancelBlur.current) { cancelBlur.current = false; return; }
    const cleaned = text.replace(/[\s,]/g, "");
    const valid = (half ? /^-?\d+(?:\.5)?$/ : /^-?\d+$/).test(cleaned)
      && Number.isSafeInteger(Number(cleaned) * (half ? 2 : 1));
    const number = Number(cleaned);
    if (!valid || (lower !== undefined && number < lower) || (upper !== undefined && number > upper)) {
      setError(lower !== undefined || upper !== undefined ? "표시된 범위의 정수를 입력해 주세요." : half ? "0.5 mm 단위로 입력해 주세요." : "정수 치수를 입력해 주세요.");
      return;
    }
    const result = onCommit(number);
    if (result && !result.ok) { setError(result.issues?.map(issue => issue.message).join(" ") || "값을 적용할 수 없습니다."); return; }
    setError("");
    setText(String(number));
  }
  return <label className={styles.field}>
    {label}
    <input aria-label={label} value={text} inputMode="numeric" aria-invalid={error ? true : undefined}
      aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
      onChange={e => setText(e.target.value)} onBlur={commit}
      onKeyDown={e => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape" && (text !== String(value) || error)) { e.preventDefault(); e.stopPropagation(); cancelBlur.current = true; setText(String(value)); setError(""); e.currentTarget.blur(); }
      }} />
    <small id={`${id}-hint`}>{hint}</small>
    {error && <small id={`${id}-error`} className={styles.error} role="alert">{error}</small>}
  </label>;
}
