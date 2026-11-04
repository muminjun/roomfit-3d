import { useEffect, useId, useRef, useState } from "react";
import { LIMITS } from "../../config/limits";
import { createProject } from "../../features/project/createProject";
import { useProjectStore } from "../../store/useProjectStore";
import { projectSchema } from "../../types/schema";
import styles from "../../styles/App.module.css";

type Dimensions = {
  width: string;
  depth: string;
  height: string;
  thickness: string;
};
const fields: Array<{ key: keyof Dimensions; label: string; range: string }> = [
  { key: "width", label: "가로 (mm)", range: "500–30,000" },
  { key: "depth", label: "세로 (mm)", range: "500–30,000" },
  { key: "height", label: "높이 (mm)", range: "1,800–5,000" },
  { key: "thickness", label: "벽 두께 (mm)", range: "50–500" },
];
const parseInteger = (value: string): number | null => {
  const cleaned = value.replace(/[\s,]/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const number = Number(cleaned);
  return Number.isSafeInteger(number) ? number : null;
};
const ranges: Record<keyof Dimensions, readonly [number, number]> = {
  width:[LIMITS.roomMin,LIMITS.roomMax], depth:[LIMITS.roomMin,LIMITS.roomMax],
  height:[LIMITS.heightMin,LIMITS.heightMax], thickness:[LIMITS.wallMin,LIMITS.wallMax],
};
function fieldError(key: keyof Dimensions, value: string): string | undefined {
  const number = parseInteger(value), [min,max] = ranges[key];
  return number === null || number < min || number > max ? "표시된 범위의 정수를 입력해 주세요." : undefined;
}
export function NewProjectDialog({ onClose, onCreated }: { onClose: () => void; onCreated?: () => void }) {
  const loadProject = useProjectStore((s) => s.loadProject);
  const [values, setValues] = useState<Dimensions>({
    width: "4200",
    depth: "3400",
    height: "2400",
    thickness: "120",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Dimensions, string>>>({});
  const id = useId();
  const initial = useRef<Partial<Record<keyof Dimensions, string>>>({});
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    dialog.current?.querySelector<HTMLInputElement>("input")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog.current) return;
      const focusable = [
        ...dialog.current.querySelectorAll<HTMLElement>(
          "input, button:not(:disabled)",
        ),
      ];
      if (!focusable.length) return;
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [onClose]);
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const width = parseInteger(values.width),
      depth = parseInteger(values.depth),
      height = parseInteger(values.height),
      thickness = parseInteger(values.thickness);
    const next: Partial<Record<keyof Dimensions, string>> = {};
    for (const field of fields) {
      if (fieldError(field.key, values[field.key])) next[field.key] = fieldError(field.key, values[field.key]);
    }
    if (Object.keys(next).length || width === null || depth === null || height === null || thickness === null) { setErrors(next); return; }
    setErrors({});
    const candidate = createProject(width, depth, height, thickness);
    if (!projectSchema.safeParse(candidate).success) {
      setErrors({ width: "방 치수를 확인해 주세요." });
      return;
    }
    if (
      !window.confirm(
        "현재 프로젝트를 새 프로젝트로 교체할까요? 필요한 경우 먼저 JSON으로 백업해 주세요.",
      )
    )
      return;
    if (loadProject(candidate)) {
      onClose();
      onCreated?.();
    }
  }
  return (
    <div className={styles.overlay}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-title"
        className={styles.modal}
      >
        <h2 id="new-title">새 프로젝트</h2>
        <p>공간의 실측 치수를 입력해 주세요.</p>
        <form onSubmit={submit}>
          <div className={styles.form}>
            {fields.map((field) => (
              <label key={field.key}>
                {field.label}
                <input
                  type="text"
                  inputMode="numeric"
                  value={values[field.key]}
                  onFocus={() => { if (!errors[field.key]) initial.current[field.key] = values[field.key]; }}
                  onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                  onBlur={(event) => setErrors(current => ({...current, [field.key]:fieldError(field.key, event.target.value)}))}
                  onKeyDown={event => {
                    if (event.key === "Escape" && (values[field.key] !== initial.current[field.key] || errors[field.key])) {
                      event.preventDefault(); event.stopPropagation();
                      setValues(current => ({ ...current, [field.key]: initial.current[field.key] ?? current[field.key] }));
                      setErrors(current => ({ ...current, [field.key]: undefined }));
                    }
                  }}
                  aria-invalid={errors[field.key] ? true : undefined}
                  aria-describedby={`${id}-${field.key}-range${errors[field.key] ? ` ${id}-${field.key}-error` : ""}`}
                />
                <small id={`${id}-${field.key}-range`}>{field.range} mm</small>
                {errors[field.key] && <small id={`${id}-${field.key}-error`} role="alert" className={styles.error}>{errors[field.key]}</small>}
              </label>
            ))}
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose}>
              취소
            </button>
            <button className={styles.primary} type="submit">
              만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
