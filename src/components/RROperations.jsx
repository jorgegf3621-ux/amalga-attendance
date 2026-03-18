import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, Users, Clock, Zap } from 'lucide-react';

const AGENTS = ['Stephania Collazo', 'Alexis Garcia', 'Katya Elisa Carballo'];
const AGENT_SHORT = { 'Stephania Collazo': 'Steph', 'Alexis Garcia': 'Alexis', 'Katya Elisa Carballo': 'Elisa' };
const ACOLORS = { 'Stephania Collazo': '#379AAB', 'Alexis Garcia': '#34c98a', 'Katya Elisa Carballo': '#7c6fd4' };
const DAILY_TARGET = 65;

function KPICard({ label, value, sub, color = 'var(--accent)', accent }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-3xl font-mono font-bold" style={{ color }}>{value ?? '—'}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function AgentCard({ agent, filterAgent, setFilterAgent }) {
  const col = ACOLORS[agent.name];
  const isSelected = filterAgent === agent.name;
  const pct = agent.progress;
  const barCol = pct >= 80 ? col : pct >= 50 ? '#e8a020' : '#e05555';

  return (
    <div
      className="rounded-xl p-4 border cursor-pointer transition-all"
      style={{
        background: 'var(--bg-card)',
        borderColor: isSelected ? col : 'var(--border)',
        boxShadow: isSelected ? `0 0 0 2px ${col}33` : 'none',
      }}
      onClick={() => setFilterAgent(isSelected ? null : agent.name)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: col + '22', color: col }}>
          {AGENT_SHORT[agent.name]}
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: col }}>{agent.name.split(' ')[0]}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{agent.total} cases</div>
        </div>
        <div className="ml-auto text-xs font-bold" style={{ color: barCol }}>{pct}%</div>
      </div>
      <div className="h-1.5 rounded-full mb-3" style={{ background: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barCol }} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span style={{ color: 'var(--text-muted)' }}>Reg AHT </span><span className="font-mono">{agent.regAHT ?? '—'}m</span></div>
        <div><span style={{ color: 'var(--text-muted)' }}>Esc AHT </span><span className="font-mono">{agent.escAHT ?? '—'}m</span></div>
        <div><span style={{ color: 'var(--text-muted)' }}>Regular </span><span className="font-mono" style={{ color: '#34c98a' }}>{agent.regCount}</span></div>
        <div><span style={{ color: 'var(--text-muted)' }}>Escalation </span><span className="font-mono" style={{ color: '#e05555' }}>{agent.escCount}</span></div>
      </div>
    </div>
  );
}

function GapsPanel({ gaps, filterAgent }) {
  const names = filterAgent ? [filterAgent] : AGENTS;
  return (
    <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <AlertTriangle size={13} style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Gaps &gt;10 min</span>
      </div>
      <div className="p-4 space-y-3">
        {names.map(name => {
          const g = gaps?.[name] || { gaps: [], count: 0, alert: false };
          const col = ACOLORS[name];
          return (
            <div key={name} className="rounded-lg p-3 border" style={{ borderColor: g.alert ? '#e05555' : 'var(--border)', background: g.alert ? 'rgba(224,85,85,.05)' : 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold" style={{ color: col }}>{name.split(' ')[0]}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: g.alert ? 'rgba(224,85,85,.15)' : 'rgba(52,201,138,.15)', color: g.alert ? '#e05555' : '#34c98a' }}>
                  {g.alert ? `⚠ ${g.count} gaps` : `✓ ${g.count} gaps`}
                </span>
              </div>
              {g.gaps.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {g.gaps.map((gp, i) => (
                    <span key={i} className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(224,85,85,.1)', color: '#e05555' }}>
                      {gp.from}→{gp.to} ({gp.gapMin}m)
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No significant gaps</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoriesPanel({ categories, filterAgent, data }) {
  const filtered = filterAgent
    ? categories.filter(c => {
        // recount for agent
        return true;
      })
    : categories;

  const displayCats = useMemo(() => {
    if (!filterAgent) return categories;
    const catMap = {};
    (data || []).filter(r => r.agent === filterAgent && r.avoidable_category).forEach(r => {
      catMap[r.avoidable_category] = (catMap[r.avoidable_category] || 0) + 1;
    });
    return Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  }, [categories, filterAgent, data]);

  const max = Math.max(...displayCats.map(c => c.value), 1);
  const col = filterAgent ? ACOLORS[filterAgent] : '#e05555';

  return (
    <div className="rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Avoidable Categories</span>
      </div>
      <div className="p-4 space-y-3">
        {displayCats.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No data</p>
        ) : displayCats.map(c => (
          <div key={c.label} className="flex items-center gap-3">
            <div className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }} title={c.label}>{c.label}</div>
            <div className="flex-2 h-2 rounded-full flex-1" style={{ background: 'var(--border)', minWidth: 80 }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round(c.value / max * 100)}%`, background: col }} />
            </div>
            <div className="text-xs font-mono min-w-4 text-right" style={{ color: col }}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RROperations({ opsData, opsDate, setOpsDate, loading, rawData }) {
  const [filterAgent, setFilterAgent] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  const team = opsData;
  const selectedAgent = filterAgent ? team?.agents?.find(a => a.name === filterAgent) : null;

  const kpiTotal = filterAgent ? selectedAgent?.total : team?.teamTotal;
  const kpiRegAHT = filterAgent ? selectedAgent?.regAHT : team?.agents ? Math.round(team.agents.filter(a => a.regCount).reduce((s, a) => s + (a.regAHT || 0), 0) / Math.max(team.agents.filter(a => a.regCount).length, 1) * 10) / 10 : null;
  const kpiEscAHT = filterAgent ? selectedAgent?.escAHT : team?.agents ? Math.round(team.agents.filter(a => a.escCount).reduce((s, a) => s + (a.escAHT || 0), 0) / Math.max(team.agents.filter(a => a.escCount).length, 1) * 10) / 10 : null;
  const kpiEscRate = filterAgent ? (selectedAgent ? Math.round(selectedAgent.escCount / Math.max(selectedAgent.total, 1) * 100) : 0) : team?.escRate;
  const kpiAvoid = filterAgent ? (selectedAgent ? Math.round(selectedAgent.avoidCount / Math.max(selectedAgent.escCount, 1) * 100) : 0) : team?.avoidRate;

  return (
    <div className="space-y-6">
      {/* Date + agent toggle */}
      <div className="flex items-center gap-4 flex-wrap">
        <input
          type="date"
          value={opsDate}
          onChange={e => setOpsDate(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm border outline-none"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <div className="flex gap-2">
          <button onClick={() => setFilterAgent(null)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: !filterAgent ? 'var(--accent)' : 'var(--bg-secondary)', color: !filterAgent ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
            Team
          </button>
          {AGENTS.map(name => (
            <button key={name} onClick={() => setFilterAgent(filterAgent === name ? null : name)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: filterAgent === name ? ACOLORS[name] : 'var(--bg-secondary)', color: filterAgent === name ? '#fff' : 'var(--text-muted)', border: `1px solid ${filterAgent === name ? ACOLORS[name] : 'var(--border)'}` }}>
              {name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Total Cases" value={kpiTotal ?? '—'} sub={`${Math.min(Math.round((kpiTotal || 0) / DAILY_TARGET * 100), 100)}% of target`} color="var(--accent)" />
        <KPICard label="Reg AHT" value={kpiRegAHT ? `${kpiRegAHT}m` : '—'} sub="avg minutes" color="#34c98a" />
        <KPICard label="Esc AHT" value={kpiEscAHT ? `${kpiEscAHT}m` : '—'} sub="avg minutes" color="#7c6fd4" />
        <KPICard label="Esc Rate" value={`${kpiEscRate ?? 0}%`} sub={filterAgent ? `${selectedAgent?.escCount ?? 0} escalations` : `${team?.teamEsc ?? 0} of ${team?.teamTotal ?? 0}`} color="#e05555" />
        <KPICard label="Avoidable" value={`${kpiAvoid ?? 0}%`} sub="of escalations" color="#e8a020" />
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-3 gap-4">
        {(team?.agents || []).map(agent => (
          <AgentCard key={agent.name} agent={agent} filterAgent={filterAgent} setFilterAgent={setFilterAgent} />
        ))}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-2 gap-4">
        <CategoriesPanel categories={team?.categories || []} filterAgent={filterAgent} data={rawData} />
        <GapsPanel gaps={team?.gaps} filterAgent={filterAgent} />
      </div>
    </div>
  );
}
