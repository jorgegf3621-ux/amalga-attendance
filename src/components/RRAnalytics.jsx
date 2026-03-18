import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const AGENTS = ['Stephania Collazo', 'Alexis Garcia', 'Katya Elisa Carballo'];
const ACOLORS = ['#379AAB', '#34c98a', '#7c6fd4'];
const AFILLS = ['rgba(55,154,171,.15)', 'rgba(52,201,138,.15)', 'rgba(124,111,212,.15)'];

function StatCard({ label, value, sub, color }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-2xl font-mono font-bold" style={{ color }}>{value ?? '—'}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function SimpleBarChart({ data, labels, colors, title }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.flat().filter(Boolean), 1);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{title}</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="flex items-end gap-1 h-32 min-w-max">
          {labels.map((lbl, i) => (
            <div key={i} className="flex flex-col items-center gap-1" style={{ minWidth: 28 }}>
              <div className="flex items-end gap-0.5 h-24">
                {(Array.isArray(data[0]) ? data : [data]).map((series, si) => {
                  const val = series[i] ?? 0;
                  const h = Math.round(val / max * 100);
                  return (
                    <div key={si} title={`${AGENTS[si] || ''}: ${val}`}
                      className="rounded-t transition-all"
                      style={{ width: 8, height: `${h}%`, minHeight: val > 0 ? 2 : 0, background: colors[si] || colors[0], opacity: 0.85 }} />
                  );
                })}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)', fontSize: 8, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{lbl}</div>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-4 mt-3 flex-wrap">
          {AGENTS.map((a, i) => (
            <div key={a} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: ACOLORS[i] }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeeklyBars({ weeks }) {
  if (!weeks?.length) return null;
  const max = Math.max(...weeks.map(w => w.total), 1);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Cases by Week (Team Total)</span>
      </div>
      <div className="p-4 flex items-end gap-3 h-40">
        {weeks.map((w, i) => {
          const h = Math.round(w.total / max * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{w.total}</div>
              <div className="w-full rounded-t-lg transition-all" style={{ height: `${h}%`, minHeight: 4, background: 'rgba(55,154,171,.3)', border: '2px solid #379AAB', borderBottom: 'none' }} />
              <div className="text-center" style={{ color: 'var(--text-muted)', fontSize: 9 }}>{w.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CatsBar({ categories }) {
  if (!categories?.length) return null;
  const max = Math.max(...categories.map(c => c.value), 1);
  const colors = ['#379AAB', '#e05555', '#34c98a', '#e8a020', '#7c6fd4', '#fb923c', '#e879f9'];
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Avoidable Categories</span>
      </div>
      <div className="p-4 space-y-3">
        {categories.map((c, i) => (
          <div key={c.label} className="flex items-center gap-3">
            <div className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)', width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.label}>{c.label}</div>
            <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round(c.value / max * 100)}%`, background: colors[i % colors.length] }} />
            </div>
            <div className="text-xs font-mono min-w-6 text-right" style={{ color: colors[i % colors.length] }}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RRAnalytics({ analyticsData, analyticsRange, setAnalyticsRange, loadAnalyticsData, loading, analyticsLoaded }) {
  const today = new Date().toISOString().split('T')[0];
  const d30 = new Date(); d30.setDate(d30.getDate() - 30);
  const [from, setFrom] = useState(analyticsRange.start || d30.toISOString().split('T')[0]);
  const [to, setTo] = useState(analyticsRange.end || today);

  function handleLoad() {
    if (!from || !to || from > to) return;
    setAnalyticsRange({ start: from, end: to });
    loadAnalyticsData(from, to);
  }

  const d = analyticsData;

  return (
    <div className="space-y-6">
      {/* Range picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm border outline-none"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm border outline-none"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} />
        </div>
        <button onClick={handleLoad} disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
          style={{ background: 'var(--accent)', color: '#fff', opacity: loading ? 0.6 : 1 }}>
          {loading && <Loader2 size={13} className="animate-spin" />}
          Load Analysis
        </button>
        {d && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{from} → {to} · {d.workDays} days · {d.totalCases} cases</span>}
      </div>

      {!analyticsLoaded && !loading && (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Select a date range and click Load Analysis</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin mr-3" size={20} style={{ color: 'var(--accent)' }} />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading historical data...</span>
        </div>
      )}

      {d && !loading && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Total Cases" value={d.totalCases} sub={`${d.workDays} work days`} color="var(--accent)" />
            <StatCard label="Avg Cases/Day" value={d.avgPerDay} sub="team total" color="#e8a020" />
            <StatCard label="Avg Reg AHT" value={`${d.avgRegAHT}m`} sub="minutes" color="#34c98a" />
            <StatCard label="Avg Esc AHT" value={`${d.avgEscAHT}m`} sub="minutes" color="#7c6fd4" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="Escalation Rate" value={`${d.escRate}%`} sub={`${d.escCases} of ${d.totalCases}`} color="#e05555" />
            <StatCard label="Avoidable Rate" value={`${d.avoidRate}%`} sub="of escalations" color="var(--accent)" />
            <StatCard label="Regular Cases" value={d.regCases} color="#34c98a" />
            <StatCard label="Escalation Cases" value={d.escCases} color="#e05555" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            <SimpleBarChart
              title="Cases per Day per Agent"
              labels={d.dates.map(dt => dt.slice(5))}
              data={d.agentDailySeries.map(s => s.values)}
              colors={ACOLORS}
            />
            <SimpleBarChart
              title="Reg AHT per Day per Agent (min)"
              labels={d.dates.map(dt => dt.slice(5))}
              data={d.ahtSeries.map(s => s.values)}
              colors={ACOLORS}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <WeeklyBars weeks={d.weeks} />
            <CatsBar categories={d.categories} />
          </div>
        </>
      )}
    </div>
  );
}
