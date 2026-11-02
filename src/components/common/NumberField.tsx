import { useEffect, useState } from "react";
import styles from "../../styles/App.module.css";

export function NumberField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [error, setError] = useState(false);
  useEffect(() => setText(String(value)), [value]);
  return (
    <label className={styles.field}>
      {label}
      <input
        value={text}
        inputMode="numeric"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const cleaned = text.replace(/[\s,]/g, "");
          if (
            /^-?\d+$/.test(cleaned) &&
            Number.isSafeInteger(Number(cleaned))
          ) {
            setError(false);
            onCommit(Number(cleaned));
          } else setError(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      {error && (
        <small className={styles.error}>정수 치수를 입력해 주세요.</small>
      )}
    </label>
  );
}
