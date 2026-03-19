import { useState, useEffect } from 'react';
import { DATE_PRESETS, fetchAgentStatuses, computeBlocks } from '../lib/useRRData';

const AGENTS = ['Stephania Collazo', 'Alexis Garcia', 'Katya Elisa Carballo'];
const AGENT_SHORT = { 'Stephania Collazo':'Steph', 'Alexis Garcia':'Alexis', 'Katya Elisa Carballo':'Elisa' };
const ACOLORS = { 'Stephania Collazo':'#379AAB', 'Alexis Garcia':'#34c98a', 'Katya Elisa Carballo':'#7c6fd4' };
const DAILY_TARGET = 70;

function KPICard({ label, value, sub, color }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background:'var(--bg-card)', borderColor:'var(--border)' }}>
      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color:'var(--text-muted)' }}>{label}</div>
      <div className="text-3xl font-mono font-bold" style={{ color }}>{value ?? '—'}</div>
      {sub && <div className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function DateFilter({ preset, setPreset, customRange, setCustomRange }) {
  return (
    <div className="rounded-xl border p-4 mb-6" style={{ background:'var(--bg-card)', borderColor:'var(--border)' }}>
      <div className="flex flex-wrap gap-2 mb-3">
        {DATE_PRESETS.filter(p => p.key !== 'custom').map(p => (
          <button key={p.key} onClick={() => setPreset(p.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: preset===p.key ? 'var(--accent)' : 'var(--bg-secondary)', color: preset===p.key ? '#fff' : 'var(--text-muted)', border:'1px solid var(--border)' }}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <input type="date" value={customRange.start}
          onChange={e => { setCustomRange(r => ({...r, start:e.target.value})); setPreset('custom'); }}
          className="rounded-lg px-3 py-1.5 text-sm border outline-none"
          style={{ background:'var(--bg-secondary)', borderColor:'var(--border)', color:'var(--text-primary)' }} />
        <span style={{ color:'var(--text-muted)' }}>→</span>
        <input type="date" value={customRange.end}
          onChange={e => { setCustomRange(r => ({...r, end:e.target.value})); setPreset('custom'); }}
          className="rounded-lg px-3 py-1.5 text-sm border outline-none"
          style={{ background:'var(--bg-secondary)', borderColor:'var(--border)', color:'var(--text-primary)' }} />
      </div>
    </div>
  );
}

function AgentCard({ agent, filterAgent, setFilterAgent, workDays }) {
  const col = ACOLORS[agent.name];
  const isSelected = filterAgent === agent.name;
  const pct = agent.progress;
  const barCol = pct >= 80 ? col : pct >= 50 ? '#e8a020' : '#e05555';
  return (
    <div className="rounded-xl p-4 border cursor-pointer transition-all"
      style={{ background:'var(--bg-card)', borderColor: isSelected ? col : 'var(--border)', boxShadow: isSelected ? `0 0 0 2px ${col}33` : 'none' }}
      onClick={() => setFilterAgent(isSelected ? null : agent.name)}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: col+'22', color: col }}>{AGENT_SHORT[agent.name]}</div>
        <div>
          <div className="text-sm font-semibold" style={{ color: col }}>{agent.name.split(' ')[0]}</div>
          <div className="text-xs" style={{ color:'var(--text-muted)' }}>
            {agent.total} cases{workDays > 1 ? ` · ${Math.round(agent.total/workDays*10)/10}/day` : ''}
          </div>
        </div>
        <div className="ml-auto text-xs font-bold" style={{ color: barCol }}>{pct}%</div>
      </div>
      <div className="h-1.5 rounded-full mb-3" style={{ background:'var(--border)' }}>
        <div className="h-full rounded-full" style={{ width:`${pct}%`, background: barCol }} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span style={{ color:'var(--text-muted)' }}>Reg AHT </span><span className="font-mono">{agent.regAHT ?? '—'}m</span></div>
        <div><span style={{ color:'var(--text-muted)' }}>Esc AHT </span><span className="font-mono">{agent.escAHT ?? '—'}m</span></div>
        <div><span style={{ color:'var(--text-muted)' }}>Regular </span><span className="font-mono" style={{ color:'#34c98a' }}>{agent.regCount}</span></div>
        <div><span style={{ color:'var(--text-muted)' }}>Escalation </span><span className="font-mono" style={{ color:'#e05555' }}>{agent.escCount}</span></div>
      </div>
    </div>
  );
}

function WeeklyBars({ weeks }) {
  const [hovered, setHovered] = useState(null);
  if (!weeks?.length || weeks.length < 2) return null;
  const max = Math.max(...weeks.map(w => w.avg), 1);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background:'var(--bg-card)', borderColor:'var(--border)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor:'var(--border)', background:'var(--bg-secondary)' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>Avg Cases / Day · by Week</span>
      </div>
      <div className="p-4 flex items-end gap-3" style={{ height:160 }}>
        {weeks.map((w, i) => {
          const h = Math.round(w.avg / max * 100);
          const isH = hovered === i;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <div className="text-xs font-mono font-bold" style={{ color: isH ? '#379AAB' : 'var(--text-secondary)' }}>{w.avg}</div>
              <div className="w-full rounded-t-lg transition-all"
                style={{ height:`${h}%`, minHeight:4, background: isH ? '#379AAB' : 'rgba(55,154,171,.25)', border:'2px solid #379AAB', borderBottom:'none' }} />
              <div className="text-center" style={{ color:'var(--text-muted)', fontSize:9 }}>{w.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoriesPanel({ categories, filterAgent, rawData }) {
  const display = filterAgent
    ? (() => {
        const m = {};
        (rawData||[]).filter(r => r.agent===filterAgent && r.avoidable_category).forEach(r => { m[r.avoidable_category]=(m[r.avoidable_category]||0)+1; });
        return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([label,value])=>({label,value}));
      })()
    : categories;
  const max = Math.max(...display.map(c=>c.value), 1);
  const col = filterAgent ? ACOLORS[filterAgent] : '#e05555';
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background:'var(--bg-card)', borderColor:'var(--border)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor:'var(--border)', background:'var(--bg-secondary)' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>Avoidable Categories</span>
      </div>
      <div className="p-4 space-y-3">
        {!display.length
          ? <p className="text-xs text-center py-4" style={{ color:'var(--text-muted)' }}>No data</p>
          : display.map(c => (
            <div key={c.label} className="flex items-center gap-3">
              <div className="text-xs flex-shrink-0 truncate" style={{ color:'var(--text-muted)', width:150 }} title={c.label}>{c.label}</div>
              <div className="flex-1 h-2 rounded-full" style={{ background:'var(--border)' }}>
                <div className="h-full rounded-full" style={{ width:`${Math.round(c.value/max*100)}%`, background:col }} />
              </div>
              <div className="text-xs font-mono min-w-4 text-right" style={{ color:col }}>{c.value}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function GapsPanel({ agents, filterAgent, isSingleDay }) {
  const names = filterAgent ? [filterAgent] : AGENTS;
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background:'var(--bg-card)', borderColor:'var(--border)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor:'var(--border)', background:'var(--bg-secondary)' }}>
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>
          ⚠ Gaps &gt;10 min {!isSingleDay && '· avg/day'}
        </span>
      </div>
      <div className="p-4 space-y-3">
        {names.map(name => {
          const agent = agents?.find(a => a.name === name);
          if (!agent) return null;
          const col = ACOLORS[name];
          const alert = agent.gapAlert;
          return (
            <div key={name} className="rounded-lg p-3 border"
              style={{ borderColor: alert ? '#e05555' : 'var(--border)', background: alert ? 'rgba(224,85,85,.05)' : 'var(--bg-secondary)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold" style={{ color: col }}>{name.split(' ')[0]}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: alert ? 'rgba(224,85,85,.15)' : 'rgba(52,201,138,.15)', color: alert ? '#e05555' : '#34c98a' }}>
                  {alert ? '⚠' : '✓'} {isSingleDay ? `${agent.gapCount} gaps` : `${agent.avgGapsPerDay} gaps/day avg`}
                </span>
              </div>
              {isSingleDay && agent.gaps?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {agent.gaps.map((gp, i) => (
                    <span key={i} className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background:'rgba(224,85,85,.1)', color:'#e05555' }}>
                      {gp.from}→{gp.to} ({gp.gapMin}m)
                    </span>
                  ))}
                </div>
              )}
              {isSingleDay && !agent.gaps?.length && (
                <p className="text-xs" style={{ color:'var(--text-muted)' }}>No significant gaps</p>
              )}
              {!isSingleDay && (
                <p className="text-xs" style={{ color:'var(--text-muted)' }}>Based on {agent.total} cases across {Math.round(agent.total / Math.max(agent.avgGapsPerDay,0.1))} days</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlocksPanel({ cases }) {
  const blocks = computeBlocks(cases);
  const cols = ['#379AAB','#34c98a','#7c6fd4'];
  return (
    <div className="grid grid-cols-3 gap-3">
      {blocks.map((b,i) => {
        const col = b.pct>=100?cols[i]:b.pct>=80?cols[i]:b.pct>=50?'#e8a020':'#e05555';
        const st = b.pct>=100?'✓ Target':b.pct>=80?'↑ On track':b.pct>=50?'→ In progress':'↓ Below';
        return (
          <div key={b.key} className="rounded-xl border p-4" style={{ background:'var(--bg-secondary)', borderColor:'var(--border)' }}>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold" style={{ color:'var(--text-muted)' }}>{b.label}</span>
              <span className="text-xs" style={{ color:'var(--text-muted)' }}>{b.start.slice(0,5)}–{b.end.slice(0,5)}</span>
            </div>
            <div className="text-3xl font-mono font-bold mb-1" style={{ color: col }}>{b.total}</div>
            <div className="text-xs mb-2" style={{ color:'var(--text-muted)' }}>target: {b.target}</div>
            <div className="h-1.5 rounded-full mb-2" style={{ background:'var(--border)' }}>
              <div className="h-full rounded-full" style={{ width:`${b.pct}%`, background: col }} />
            </div>
            <div className="text-xs font-bold mb-3" style={{ color: col }}>{st}</div>
            <div className="space-y-1 text-xs border-t pt-2" style={{ borderColor:'var(--border)' }}>
              <div className="flex justify-between">
                <span style={{ color:'var(--text-muted)' }}>Reg AHT</span>
                <span className="font-mono" style={{ color: b.regAHT&&b.regAHT>b.regAHT?'#e05555':'var(--text-secondary)' }}>
                  {b.regAHT??'—'}m <span style={{ color:'var(--text-muted)' }}>/ {b.regAHT}m</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color:'var(--text-muted)' }}>Esc AHT</span>
                <span className="font-mono" style={{ color:'var(--text-secondary)' }}>
                  {b.escAHT??'—'}m <span style={{ color:'var(--text-muted)' }}>/ {b.escAHT}m</span>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function RROperations({ opsData, loading, error, preset, setPreset, customRange, setCustomRange, isSingleDay, rawData, range }) {
  const [filterAgent, setFilterAgent] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const [activitySummary, setActivitySummary] = useState({});

  useEffect(() => {
    if (!isSingleDay || !range?.start) return;
    fetchAgentStatuses(range.start).then(({ statusMap: sm, activitySummary: as }) => {
      setStatusMap(sm);
      setActivitySummary(as);
    });
    const t = setInterval(() => {
      fetchAgentStatuses(range.start).then(({ statusMap: sm, activitySummary: as }) => {
        setStatusMap(sm);
        setActivitySummary(as);
      });
    }, 30000);
    return () => clearInterval(t);
  }, [isSingleDay, range?.start]);

  const team = opsData;
  const workDays = team?.workDays || 1;
  const selectedAgent = filterAgent ? team?.agents?.find(a => a.name === filterAgent) : null;

  const kpiTotal     = filterAgent ? selectedAgent?.total : team?.teamAvg;
  const kpiTotalSub  = filterAgent
    ? `${selectedAgent?.progress ?? 0}% · target ${DAILY_TARGET}${workDays>1 ? ` · ${Math.round((selectedAgent?.total||0)/workDays*10)/10}/day avg` : ''}`
    : `team avg · target ${DAILY_TARGET}${workDays>1 ? ` · ${workDays} days` : ''}`;
  const kpiRegAHT    = filterAgent ? selectedAgent?.regAHT : team?.teamRegAHT;
  const kpiEscAHT    = filterAgent ? selectedAgent?.escAHT : team?.teamEscAHT;
  const kpiEscRate   = filterAgent ? (selectedAgent ? Math.round(selectedAgent.escCount/Math.max(selectedAgent.total,1)*100) : 0) : team?.escRate;
  const kpiAvoid     = filterAgent ? (selectedAgent ? Math.round(selectedAgent.avoidCount/Math.max(selectedAgent.escCount,1)*100) : 0) : team?.avoidRate;

  return (
    <div className="space-y-6">
      <DateFilter preset={preset} setPreset={setPreset} customRange={customRange} setCustomRange={setCustomRange} />

      {/* Agent toggle */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterAgent(null)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: !filterAgent ? 'var(--accent)' : 'var(--bg-secondary)', color: !filterAgent ? '#fff' : 'var(--text-muted)', border:'1px solid var(--border)' }}>
          Team
        </button>
        {AGENTS.map(name => (
          <button key={name} onClick={() => setFilterAgent(filterAgent===name ? null : name)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: filterAgent===name ? ACOLORS[name] : 'var(--bg-secondary)', color: filterAgent===name ? '#fff' : 'var(--text-muted)', border:`1px solid ${filterAgent===name ? ACOLORS[name] : 'var(--border)'}` }}>
            {name.split(' ')[0]}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-20 text-sm" style={{ color:'var(--text-muted)' }}>Loading...</div>}
      {error && <div className="text-center py-10 text-sm" style={{ color:'#e05555' }}>Error: {error}</div>}

      {!loading && team && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-5 gap-3">
            <KPICard label={filterAgent ? 'Total Cases' : 'Team Avg Cases'} value={kpiTotal ?? '—'} sub={kpiTotalSub} color="var(--accent)" />
            <KPICard label="Reg AHT" value={kpiRegAHT ? `${kpiRegAHT}m` : '—'} sub="avg minutes" color="#34c98a" />
            <KPICard label="Esc AHT" value={kpiEscAHT ? `${kpiEscAHT}m` : '—'} sub="avg minutes" color="#7c6fd4" />
            <KPICard label="Esc Rate" value={`${kpiEscRate ?? 0}%`}
              sub={filterAgent ? `${selectedAgent?.escCount??0} escalations` : `${team.teamEsc} of ${team.teamTotal}`} color="#e05555" />
            <KPICard label="Avoidable" value={`${kpiAvoid ?? 0}%`} sub="of escalations" color="#e8a020" />
          </div>

          {/* Agent cards */}
          <div className="grid grid-cols-3 gap-4">
            {(team.agents||[]).map(agent => {
              const status = statusMap[agent.name];
              const statusLabel = status ? (status.type==='lunch'?'🍽 On Lunch':'☕ On Break') : null;
              return (
                <div key={agent.name}>
                  <AgentCard agent={agent} filterAgent={filterAgent} setFilterAgent={setFilterAgent} workDays={workDays} />
                  {statusLabel && (
                    <div className="mt-1 text-xs font-semibold text-center px-2 py-1 rounded-lg"
                      style={{ background: status.type==='lunch'?'rgba(232,160,32,.15)':'rgba(55,154,171,.15)', color: status.type==='lunch'?'#e8a020':'#379AAB' }}>
                      {statusLabel}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Blocks — only when agent selected + single day */}
          {filterAgent && isSingleDay && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color:'var(--text-muted)' }}>
                {filterAgent.split(' ')[0]} · Time Blocks
              </div>
              <BlocksPanel cases={(rawData||[]).filter(r=>r.agent===filterAgent)} />
            </div>
          )}

          {/* Charts row */}
          <div className={`grid gap-4 ${team.weeks?.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {team.weeks?.length >= 2 && <WeeklyBars weeks={team.weeks} />}
            <CategoriesPanel categories={team.categories||[]} filterAgent={filterAgent} rawData={rawData} />
          </div>

          {/* Gaps */}
          <GapsPanel agents={team.agents} filterAgent={filterAgent} isSingleDay={isSingleDay} />

          {/* Activity Log Summary — single day only */}
          {isSingleDay && Object.keys(activitySummary).length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ background:'var(--bg-card)', borderColor:'var(--border)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor:'var(--border)', background:'var(--bg-secondary)' }}>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>Activity Log — Avg Duration (min)</span>
              </div>
              <div className="p-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ color:'var(--text-muted)' }}>
                      <th className="text-left pb-2 font-semibold uppercase tracking-wider">Agent</th>
                      {['lunch','break','case_assist','meeting'].map(t => (
                        <th key={t} className="text-right pb-2 font-semibold uppercase tracking-wider">{t.replace('_',' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AGENTS.map(name => {
                      const col = ACOLORS[name];
                      const agSummary = activitySummary[name] || {};
                      const hasData = Object.keys(agSummary).length > 0;
                      if (!hasData && filterAgent && filterAgent !== name) return null;
                      if (!hasData) return null;
                      return (
                        <tr key={name} className="border-t" style={{ borderColor:'var(--border)' }}>
                          <td className="py-2 font-semibold" style={{ color: col }}>{name.split(' ')[0]}</td>
                          {['lunch','break','case_assist','meeting'].map(type => (
                            <td key={type} className="py-2 text-right font-mono" style={{ color:'var(--text-secondary)' }}>
                              {agSummary[type] ? `${agSummary[type]}m` : '—'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !team && (
        <div className="text-center py-20 text-sm" style={{ color:'var(--text-muted)' }}>No data for selected range</div>
      )}
    </div>
  );
}

// Add at top of file — but since we're appending, add Blocks component here
// This will be imported and used when filterAgent is selected on a single day
