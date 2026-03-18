import { useState } from 'react';
import { calcAttendanceByAgent, fmtPct, getDeptColor } from '../lib/calculations';
import { ArrowUpDown } from 'lucide-react';

const SORT_OPTIONS = [
  { key: 'pct-desc', label: 'Attendance ↓', sort: (a, b) => b.pct - a.pct },
  { key: 'pct-asc', label: 'Attendance ↑', sort: (a, b) => a.pct - b.pct },
  { key: 'name-asc', label: 'Name A–Z', sort: (a, b) => a.agent.localeCompare(b.agent) },
  { key: 'dept-asc', label: 'Department', sort: (a, b) => a.department.localeCompare(b.department) || b.pct - a.pct },
];

export default function AgentList({ data, onSelectAgent }) {
  const [sortKey, setSortKey] = useState('pct-desc');
  const byAgent = calcAttendanceByAgent(data);

  const currentSort = SORT_OPTIONS.find(s => s.key === sortKey);
  const sorted = [...byAgent].sort(currentSort.sort);

  const pctColor = (p) => p >= 0.95 ? '#10b981' : p >= 0.85 ? '#f59e0b' : '#ef4444';

  if (!byAgent.length) {
    return <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No agent data available</div>;
  }

  return (
    <div className="animate-fade-up delay-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Agent Breakdown
          <span className="ml-2 font-normal normal-case" style={{ color: 'var(--text-muted)' }}>({byAgent.length} agents)</span>
        </h2>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10" style={{ background: 'var(--table-header)' }}>
              <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                <th className="text-left p-3 font-medium w-8">#</th>
                <th className="text-left p-3 font-medium">Agent</th>
                <th className="text-left p-3 font-medium">Department</th>
                <th className="text-right p-3 font-medium">Days</th>
                <th className="text-right p-3 font-medium">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a, i) => (
                <tr key={a.agent} className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => onSelectAgent(a.agent)}>
                  <td className="p-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td className="p-3 font-medium" style={{ color: 'var(--text-primary)' }}>{a.agent}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: getDeptColor(a.department) }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{a.department}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{a.measured}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bar-bg)' }}>
                        <div className="h-full rounded-full" style={{ width: `${a.pct * 100}%`, background: pctColor(a.pct) }} />
                      </div>
                      <span className="font-mono font-semibold w-16 text-right" style={{ color: pctColor(a.pct) }}>{fmtPct(a.pct)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
