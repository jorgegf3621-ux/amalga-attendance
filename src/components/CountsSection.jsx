import { useState } from 'react';
import { calcCounts, getDeptColor } from '../lib/calculations';
import MetricCard from './MetricCard';
import { X } from 'lucide-react';

function getRecordsByCode(data, codeFilter) {
  const byAgent = {};
  data.forEach(r => {
    const code = (r.code || '').toUpperCase();
    let match = false;

    switch (codeFilter) {
      case 'absences': match = code === 'A'; break;
      case 'tardies': match = code === 'T'; break;
      case 'ncns': match = code === 'NCNS'; break;
      case 'ptos': match = code === 'PTO'; break;
      case 'utos': match = code === 'UTO'; break;
      case 'partialSickLeaves': match = code === 'SL'; break;
      case 'completeSickLeaves': match = code === 'SLW'; break;
      case 'emergencies': match = code === 'ER'; break;
      case 'earlyLogouts': match = code === 'EL' || code === 'EO'; break;
      case 'onTime': match = code === 'ON'; break;
    }

    if (!match) return;

    if (!byAgent[r.agent]) {
      byAgent[r.agent] = { agent: r.agent, department: r.department, count: 0, dates: [] };
    }
    byAgent[r.agent].count++;
    byAgent[r.agent].dates.push(r.date);
  });

  return Object.values(byAgent).sort((a, b) => b.count - a.count);
}

export default function CountsSection({ data }) {
  const counts = calcCounts(data);
  const [expanded, setExpanded] = useState(null);

  const items = [
    { key: 'absences', label: 'Absences', value: counts.absences, color: '#ef4444' },
    { key: 'tardies', label: 'Tardies', value: counts.tardies, color: '#f59e0b' },
    { key: 'ncns', label: 'NCNS', value: counts.ncns, color: '#dc2626' },
    { key: 'ptos', label: 'PTOs', value: counts.ptos, color: '#C6842A' },
    { key: 'utos', label: 'UTOs', value: counts.utos, color: '#6366f1' },
    { key: 'partialSickLeaves', label: 'Partial Sick Leave', value: counts.partialSickLeaves, color: '#0ea5e9' },
    { key: 'completeSickLeaves', label: 'Complete Sick Leave', value: counts.completeSickLeaves, color: '#06b6d4' },
    { key: 'emergencies', label: 'Emergency', value: counts.emergencies, color: '#ec4899' },
    { key: 'earlyLogouts', label: 'Early Logouts', value: counts.earlyLogouts, color: '#f97316' },
    { key: 'onTime', label: 'On Time', value: counts.onTime, color: '#10b981' },
  ];

  const expandedData = expanded ? getRecordsByCode(data, expanded) : [];
  const expandedItem = items.find(i => i.key === expanded);

  return (
    <div className="animate-fade-up delay-2">
      <h2 className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Code Breakdown</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <div
            key={item.key}
            className="cursor-pointer transition-all hover:scale-[1.02]"
            onClick={() => setExpanded(expanded === item.key ? null : item.key)}
            style={expanded === item.key ? { transform: 'scale(1.02)' } : {}}
          >
            <div className={`animate-fade-up delay-${i % 5} card p-5`}
              style={expanded === item.key ? { borderColor: item.color, boxShadow: `0 0 0 1px ${item.color}33` } : {}}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded detail panel */}
      {expanded && expandedData.length > 0 && (
        <div className="card mt-4 overflow-hidden animate-fade-up">
          <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: expandedItem?.color }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {expandedItem?.label} — {expandedData.length} agent{expandedData.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button onClick={() => setExpanded(null)} className="p-1 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <X size={16} />
            </button>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--table-header)' }}>
                <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  <th className="text-left p-3 font-medium">#</th>
                  <th className="text-left p-3 font-medium">Agent</th>
                  <th className="text-left p-3 font-medium">Department</th>
                  <th className="text-right p-3 font-medium">Count</th>
                  <th className="text-left p-3 font-medium">Dates</th>
                </tr>
              </thead>
              <tbody>
                {expandedData.map((row, i) => (
                  <tr key={row.agent} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="p-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td className="p-3 font-medium" style={{ color: 'var(--text-primary)' }}>{row.agent}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: getDeptColor(row.department) }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{row.department}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-mono font-semibold" style={{ color: expandedItem?.color }}>{row.count}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {row.dates.sort().map(d => (
                          <span key={d} className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                            {d.substring(5)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {expanded && expandedData.length === 0 && (
        <div className="card mt-4 p-6 text-center animate-fade-up" style={{ color: 'var(--text-muted)' }}>
          No records found
        </div>
      )}
    </div>
  );
}
