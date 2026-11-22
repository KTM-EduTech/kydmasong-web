"use client";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import clsx from "clsx";

/* ---------------------------------------------------------------- Toasts */
type Toast = { id: number; kind: "ok" | "error"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 8000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              "flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-xl",
              t.kind === "ok" ? "bg-navy text-white" : "bg-red-700 text-white",
            )}
          >
            {t.kind === "ok" ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-gold" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0" />}
            <span className="flex-1">{t.text}</span>
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ------------------------------------------------------------- Controls */
export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" | "gold"; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      {...props}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm",
        {
          primary: "bg-navy text-white hover:bg-navy/90",
          gold: "bg-gold text-navy hover:brightness-95",
          secondary: "border border-line bg-surface text-ink hover:border-ink/40",
          ghost: "text-ink hover:bg-bg-alt",
          danger: "bg-red-700 text-white hover:bg-red-800",
        }[variant],
        className,
      )}
    />
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-[15px] text-ink placeholder:text-muted/60 focus:border-navy focus:outline-none focus:ring-2 focus:ring-gold/70";

export function Field({ label, help, children, count, max, htmlFor }: { label: string; help?: string; children: React.ReactNode; count?: number; max?: number; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {max !== undefined && count !== undefined && (
          <span className={clsx("text-xs tabular-nums", count > max ? "font-semibold text-red-700" : "text-muted")}>
            {count}/{max}
          </span>
        )}
      </div>
      {children}
      {help && <p className="text-xs text-muted">{help}</p>}
    </div>
  );
}

export function TextInput({ label, value, onChange, help, max, placeholder, type = "text", required }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  help?: string;
  max?: number;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  const id = useId();
  return (
    <Field label={label + (required ? " *" : "")} help={help} count={value.length} max={max} htmlFor={id}>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </Field>
  );
}

export function TextArea({ label, value, onChange, help, max, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; help?: string; max?: number; rows?: number }) {
  const id = useId();
  return (
    <Field label={label} help={help} count={value.length} max={max} htmlFor={id}>
      <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </Field>
  );
}

export function Select({ label, value, onChange, options, help }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; help?: string }) {
  const id = useId();
  return (
    <Field label={label} help={help} htmlFor={id}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 inline-flex">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-line transition peer-checked:bg-navy peer-focus-visible:ring-2 peer-focus-visible:ring-gold" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5 peer-checked:bg-gold" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {help && <span className="block text-xs text-muted">{help}</span>}
      </span>
    </label>
  );
}

export function Card({ title, children, actions, className }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-2xl border border-line bg-surface", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          {title && <h2 className="font-semibold">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-100 text-emerald-900",
    draft: "bg-gold/60 text-navy",
    new: "bg-gold text-navy",
    read: "bg-bg-alt text-ink",
    archived: "bg-bg-alt text-muted",
    hidden: "bg-bg-alt text-muted",
    review: "bg-orange-100 text-orange-900",
    scheduled: "bg-sky-100 text-sky-900",
  };
  return <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", map[status] ?? "bg-bg-alt")}>{status}</span>;
}

export function PageHeading({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* -------------------------------------------------------------- Dialogs */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={clsx(
        "m-auto max-h-[90vh] w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-navy/50",
        wide ? "max-w-5xl" : "max-w-lg",
      )}
    >
      {open && (
        <div className="flex max-h-[90vh] flex-col">
          <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
            <h2 className="font-semibold">{title}</h2>
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-bg-alt" aria-label="Close">
              <X size={18} />
            </button>
          </header>
          <div className="overflow-y-auto p-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}

/** Promise-based confirmation dialog: `if (await confirm({...})) doIt()` */
type ConfirmOpts = { title: string; body: string; confirmLabel?: string; danger?: boolean };
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setState({ ...o, resolve })), []);
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal open={!!state} onClose={() => close(false)} title={state?.title ?? ""}>
        <p className="text-[15px] text-muted">{state?.body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button variant={state?.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>
            {state?.confirmLabel ?? "Confirm"}
          </Button>
        </div>
      </Modal>
    </ConfirmCtx.Provider>
  );
}

/** Warn before leaving the page with unsaved changes. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
}

export function StringList({ label, value, onChange, help, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; help?: string; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };
  return (
    <Field label={label} help={help}>
      <div className="flex flex-wrap gap-2">
        {value.map((v, i) => (
          <span key={v + i} className="inline-flex items-center gap-1 rounded-full bg-bg-alt px-3 py-1 text-sm">
            {v}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove ${v}`} className="rounded-full p-0.5 hover:bg-line">
              <X size={13} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder ?? "Type and press Enter"}
          className={inputCls}
        />
        <Button variant="secondary" onClick={add}>
          Add
        </Button>
      </div>
    </Field>
  );
}

export { inputCls };
