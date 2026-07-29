'use client'

let uidCounter = 0
export const nextCalcId = (prefix: string) => `${prefix}_${Date.now()}_${uidCounter++}`

// ─── Общие классы, повторяющие существующую дизайн-систему сайта ───
// (см. .calc-inp / .calc-inp-wrap label / .calc-addbtn в globals.css)
export const CALC_LABEL_CLS =
  'text-[10px] font-semibold uppercase tracking-[.06em] text-[var(--muted)]'

export const CALC_INPUT_CLS =
  'h-9 w-full min-w-0 rounded-[8px] border border-[var(--border)] bg-[var(--surface2)] ' +
  'px-3 text-[13px] text-[var(--text)] outline-none transition-colors focus:border-[var(--dark)]'

export const CALC_UNIT_CLS = 'text-[12px] text-[var(--muted)]'

export const CALC_ADD_LINK_CLS =
  'self-start text-[12.5px] font-semibold text-[var(--dark)] transition-colors hover:text-[var(--dark-h)]'

export const CALC_DEL_BTN_CLS =
  'ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[var(--muted)] ' +
  'transition-colors hover:bg-[var(--tag)] hover:text-[var(--accent)]'

export const CALC_RESULT_PANEL_CLS =
  'flex flex-col gap-2 rounded-[10px] bg-[var(--surface2)] px-4 py-3.5'

export const CALC_PRIMARY_BTN_CLS =
  'mt-1 self-start rounded-[9px] bg-[var(--dark)] px-4 h-9 text-[13px] font-semibold text-white ' +
  'transition-colors hover:bg-[var(--dark-h)]'

export const CALC_HEADFONT = { fontFamily: 'var(--fh)' }

export interface FieldDef<T> { key: keyof T; label: string }

export function CalcRowList<T extends { id: string }>({
  title, items, onAdd, onRemove, onChange, fields, unit,
}: {
  title: string
  items: T[]
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (id: string, key: keyof T, val: number) => void
  fields: FieldDef<T>[]
  unit: string
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className={CALC_LABEL_CLS}>{title}</div>
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-2">
          {fields.map((f, i) => (
            <span key={String(f.key)} className="flex items-center gap-2">
              {i > 0 && <span className="text-[12px] text-[var(--muted)]">×</span>}
              <input
                type="number"
                step="0.1"
                value={item[f.key] as unknown as number}
                onChange={e => onChange(item.id, f.key, parseFloat(e.target.value) || 0)}
                title={f.label}
                className={`${CALC_INPUT_CLS} w-[84px]`}
              />
            </span>
          ))}
          <span className={CALC_UNIT_CLS}>{unit}</span>
          {items.length > 1 && (
            <button onClick={() => onRemove(item.id)} aria-label="Удалить" className={CALC_DEL_BTN_CLS}>✕</button>
          )}
        </div>
      ))}
      <button onClick={onAdd} className={CALC_ADD_LINK_CLS}>+ добавить</button>
    </div>
  )
}
