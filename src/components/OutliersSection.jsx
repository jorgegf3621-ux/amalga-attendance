import { useState } from 'react';
import { calcOutliers, getDeptColor, fmtMinToHrs } from '../lib/calculations';

const TABS = [
  { key: 'byAbsences', label: 'Absences', field: 'absences', color: '#ef4444' },
  { key: 'byTardies', label: 'Tardies', field: 'tardies', color: '#f59e0b' },
  { key: 'byTardyMinutes', label: 'Tardy Min', field: 'tardyMin', color: '#f97316', fmt: v => fmtMinToHrs(v) },
  { key: 'byUtos', label: 'UTOs', field: 'utos', color: '#6366f1' },
  { key: 'byPtos', label: 'PTOs', field: 'ptos', color: '#C6842A' },
  { key: 'byPartialSickLeaves', label: 'Partial Sick Leave', field: 'partialSickLeaves', color: '#0ea5e9' },
  { key: 'byCompleteSickLeaves', label: 'Complete Sick Leave', field: 'completeSickLeaves', color: '#06b6d4' },
  { key: 'byEmergencies', label: 'Emergency', field: 'emergencies', color: '#ec4899' },
  { key: 'byWorkDisruptions', label: 'Work Disruption', field: 'workDisruptions', color: '#64748b' },
];

export default function OutliersSection({ data, onSelectAgent }) {
  const [activeTab, setActiveTab] = useState('byAbsences');
  const outliers = calcOutliers(data, 3);
  const currentTab = TABS.find(t => t.key === activeTab);
  const rows = outliers[activeTab] || [];
  const maxVal = Math.max(...rows.map(r => r[currentTab.field]), 1);

  return (
    <div className="animate-fade-up delay-4">
      <h2 className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Outliers - Top 3</h2>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={activeTab === tab.key
              ? { background: tab.color + '18', color: tab.color, border: `1px solid ${tab.color}44` }
              : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {rows.filter(r => r[currentTab.field] > 0).length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No data for this category</div>
        ) : (
          <div>
            {rows.filter(r => r[currentTab.field] > 0).map((row, i) => (
              <div
                key={row.agent}
                className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => onSelectAgent?.(row.agent)}
              >
                <span className="text-xs font-mono w-5" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{row.agent}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: getDeptColor(row.department) }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.department}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bar-bg)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(row[currentTab.field] / maxVal) * 100}%`, background: currentTab.color }} />
                  </div>
                  <span className="font-mono text-sm font-semibold w-12 text-right" style={{ color: currentTab.color }}>
                    {currentTab.fmt ? currentTab.fmt(row[currentTab.field]) : row[currentTab.field]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
