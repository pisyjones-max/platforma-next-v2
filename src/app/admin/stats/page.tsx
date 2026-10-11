'use client'
import { useState, useEffect, useCallback } from 'react'

type Rows = [string, number][]
interface Stats {
  days: { d: string; pv: number; sessions: number; uv: number }[]
  totals: { pv: number; sessions: number; uv: number; bounceRate: number | null; avgSec: number | null }
  tables: { src: Rows; ref: Rows; pages: Rows; entry: Rows; exit: Rows; flow: Rows; dev: Rows; ret: Rows; utm: Rows; goals: Rows }
}

const LS_ADMIN_KEY = 'platforma_admin_key'
const GOAL_NAMES: Record<string, string> = { order: 'Заказы с сайта', callback: 'Заявки «перезвонить»', card: 'Карты соседей', chat_message: 'Сообщения в чат' }
const mmss = (s: number | null) => (s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`)
const shortDate = (d: string) => d.slice(8) + '.' + d.slice(5, 7)

function Table({ title, rows, hint, map }: { title: string; rows: Rows; hint?: string; map?: (k: string) => string }) {
  const max = Math.max(1, ...rows.map(r => r[1]))
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 14, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: '#7B7772', marginBottom: 6 }}>{hint}</div>}
      {rows.length === 0 && <div style={{ fontSize: 13, color: '#aaa', marginTop: 8 }}>Пока нет данных</div>}
      {rows.map(([k, v]) => (
        <div key={k} style={{ position: 'relative', margin: '4px 0', fontSize: 13 }}>
          <div style={{ position: 'absolute', inset: 0, width: `${(v / max) * 100}%`, background: '#e8f1ff', borderRadius: 4 }} />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 10, padding: '3px 6px' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{map ? map(k) : k}</span>
            <b>{v}</b>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminStatsPage() {
  const [key, setKey] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [days, setDays] = useState(7)
  const [data, setData] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { const k = localStorage.getItem(LS_ADMIN_KEY); if (k) setKey(k) }, [])

  const load = useCallback(async () => {
    if (!key) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/admin/stats?days=${days}`, { headers: { 'x-admin-key': key }, cache: 'no-store' })
      if (res.status === 401) { localStorage.removeItem(LS_ADMIN_KEY); setKey(''); setError('Неверный ключ'); return }
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Ошибка загрузки'); return }
      setData(d)
    } catch { setError('Ошибка сети') } finally { setLoading(false) }
  }, [key, days])

  useEffect(() => { load() }, [load])

  const unlock = () => { const k = keyInput.trim(); if (!k) return; localStorage.setItem(LS_ADMIN_KEY, k); setKey(k) }

  if (!key) {
    return (
      <div style={{ maxWidth: 380, margin: '80px auto', padding: '0 16px', fontFamily: 'var(--fb, sans-serif)' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Статистика PLATFORMA</h1>
        <input type="password" placeholder="Ключ доступа" value={keyInput} onChange={e => setKeyInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && unlock()}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 8, marginBottom: 10, boxSizing: 'border-box' }} />
        <button onClick={unlock} style={{ width: '100%', padding: '10px 12px', background: '#192C1E', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Войти</button>
        {error && <div style={{ color: '#BF3E22', fontSize: 14, marginTop: 8 }}>{error}</div>}
      </div>
    )
  }

  const t = data?.totals
  const maxPv = Math.max(1, ...(data?.days.map(d => d.pv) ?? [1]))
  const card = (label: string, value: string | number, sub?: string) => (
    <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', boxShadow: '0 1px 4px rgba(0,0,0,.08)', minWidth: 130, flex: 1 }}>
      <div style={{ fontSize: 12, color: '#7B7772' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#999' }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ fontFamily: 'var(--fb, sans-serif)', background: '#f5f5f5', minHeight: '100dvh' }}>
      <div style={{ padding: '12px 16px', background: '#192C1E', color: '#fff', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Статистика PLATFORMA</div>
        <a href="/admin/chat" style={{ color: '#9fd', fontSize: 13 }}>Чат</a>
        <a href="/admin/orders" style={{ color: '#9fd', fontSize: 13 }}>Заказы</a>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {[1, 7, 30].map(n => (
            <button key={n} onClick={() => setDays(n)} style={{
              padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13,
              background: days === n ? '#fff' : 'rgba(255,255,255,.2)', color: days === n ? '#192C1E' : '#fff',
            }}>{n === 1 ? 'Сегодня' : `${n} дн.`}</button>
          ))}
          <button onClick={load} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, background: 'rgba(255,255,255,.2)', color: '#fff' }}>
            {loading ? '…' : '↻'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 12 }}>
        {error && <div style={{ color: '#BF3E22', fontSize: 14, marginBottom: 8 }}>{error}</div>}
        {!data ? <div style={{ color: '#7B7772', padding: 20 }}>Загрузка…</div> : (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {card('Визиты', t!.sessions)}
              {card('Посетители', t!.uv, 'уникальные')}
              {card('Просмотры', t!.pv)}
              {card('Отказы', t!.bounceRate == null ? '—' : `${t!.bounceRate}%`, 'ушли с 1 страницы')}
              {card('Время на сайте', mmss(t!.avgSec), 'в среднем')}
            </div>

            {data.days.length > 1 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginTop: 10, boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Просмотры по дням</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 110, overflowX: 'auto' }}>
                  {data.days.map(d => (
                    <div key={d.d} title={`${d.d}: просмотров ${d.pv}, визитов ${d.sessions}, посетителей ${d.uv}`}
                      style={{ flex: 1, minWidth: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                      <div style={{ fontSize: 10, color: '#7B7772' }}>{d.pv || ''}</div>
                      <div style={{ width: '100%', background: '#229ED9', borderRadius: 3, height: `${Math.max(2, (d.pv / maxPv) * 80)}%` }} />
                      <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{shortDate(d.d)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 10, marginTop: 10 }}>
              <Table title="Цели" rows={data.tables.goals} map={k => GOAL_NAMES[k] || k} hint="Считаются на сервере" />
              <Table title="Откуда пришли" rows={data.tables.src} hint="Тип источника (визиты)" />
              <Table title="Сайты-источники" rows={data.tables.ref} />
              <Table title="Рекламные метки" rows={data.tables.utm} hint="utm_source / medium / campaign" />
              <Table title="Куда пришли (вход)" rows={data.tables.entry} hint="Первая страница визита" />
              <Table title="Где уходят (выход)" rows={data.tables.exit} hint="Последняя страница, приблизительно" />
              <Table title="Переходы: откуда → куда" rows={data.tables.flow} />
              <Table title="Популярные страницы" rows={data.tables.pages} />
              <Table title="Устройства" rows={data.tables.dev} />
              <Table title="Новые и вернувшиеся" rows={data.tables.ret} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
