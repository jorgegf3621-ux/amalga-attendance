import { calcAttendancePct, calcCounts, fmtPct, fmtMinToHrs, getDeptColor } from '../lib/calculations';
import { ArrowLeft } from 'lucide-react';

export default function AgentDetail({ data, agentName, onBack }) {
  const agentData = data.filter(r => r.agent === agentName);
  if (!agentData.length) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--text-secondary)' }}>No data found for {agentName}</p>
        <button onClick={onBack} className="mt-4 text-sm hover:underline" style={{ color: 'var(--accent)' }}>← Back</button>
      </div>
    );
  }

  const dept = agentData[0].department;
  const pct = calcAttendancePct(agentData);
  const counts = calcCounts(agentData);
  const measuredDays = agentData.filter(r => r.is_measured_day === 1).length;
  const totalTardyMin = agentData.reduce((s, r) => s + (r.tardy_minutes || 0), 0);
  const sorted = [...agentData].sort((a, b) => b.date.localeCompare(a.date));

  const pctColor = (p) => p >= 0.95 ? '#10b981' : p >= 0.85 ? '#f59e0b' : '#ef4444';

  const codeColor = (code) => {
    const map = { ON: '#10b981', T: '#f59e0b', A: '#ef4444', NCNS: '#dc2626', PTO: '#C6842A', UTO: '#6366f1', SLW: '#06b6d4', SL: '#06b6d4', EL: '#f97316', EO: '#f97316', WD: '#64748b' };
    return map[code?.toUpperCase()] || '#64748b';
  };

  return (
    <div className="animate-fade-up">
      <button onClick={onBack}
        className="flex items-center gap-2 text-sm transition-colors mb-6"
        style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold font-display"
          style={{ background: getDeptColor(dept) + '18', color: getDeptColor(dept) }}>
          {agentName.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </div>
        <div>
          <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-primary)' }}>{agentName}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-2 h-2 rounded-full" style={{ background: getDeptColor(dept) }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{dept}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="card p-4">
          <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Attendance</span>
          <div className="font-mono text-2xl font-bold mt-1" style={{ color: pctColor(pct) }}>{fmtPct(pct)}</div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{measuredDays} days</span>
        </div>
        <div className="card p-4">
          <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Absences</span>
          <div className="font-mono text-2xl font-bold mt-1" style={{ color: '#ef4444' }}>{counts.absences}</div>
        </div>
        <div className="card p-4">
          <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tardies</span>
          <div className="font-mono text-2xl font-bold mt-1" style={{ color: '#f59e0b' }}>{counts.tardies}</div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmtMinToHrs(totalTardyMin)}</span>
        </div>
        <div className="card p-4">
          <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>NCNS</span>
          <div className="font-mono text-2xl font-bold mt-1" style={{ color: '#dc2626' }}>{counts.ncns}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-8">
        {[
          { label: 'PTOs', val: counts.ptos, color: '#C6842A' },
          { label: 'UTOs', val: counts.utos, color: '#6366f1' },
          { label: 'Sick', val: counts.sickLeaves, color: '#06b6d4' },
          { label: 'Early Out', val: counts.earlyLogouts, color: '#f97316' },
        ].map(c => (
          <div key={c.label} className="card p-3 text-center">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.label}</span>
            <div className="font-mono text-lg font-semibold mt-0.5" style={{ color: c.color }}>{c.val}</div>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Daily Log</h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="sticky top-0" style={{ background: 'var(--table-header)' }}>
              <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-center p-3 font-medium">Code</th>
                <th className="text-right p-3 font-medium">Tardy Min</th>
                <th className="text-right p-3 font-medium">Att %</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.date} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="p-3 font-mono" style={{ color: 'var(--text-secondary)' }}>{r.date}</td>
                  <td className="p-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ background: codeColor(r.code) + '18', color: codeColor(r.code) }}>{r.code}</span>
                  </td>
                  <td className="p-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {r.tardy_minutes > 0 ? `${r.tardy_minutes}m` : '—'}
                  </td>
                  <td className="p-3 text-right font-mono" style={{
                    color: r.is_measured_day ? pctColor(r.attendance_pct) : 'var(--text-muted)'
                  }}>
                    {r.is_measured_day ? fmtPct(r.attendance_pct) : '—'}
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
