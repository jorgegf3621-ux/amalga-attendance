import { useState, useMemo } from 'react';
import { fmtMinToHrs, getDeptColor } from '../lib/calculations';
import { ArrowUpDown } from 'lucide-react';

/**
 * Payroll deduction rules:
 * - Nomina: T, A, NCNS, EO, UTO, WD get deducted. SL/SLW do NOT.
 * - Contractor: T, A, NCNS, EO, UTO, WD get deducted. SL/SLW DO get deducted.
 */

const DEDUCT_CODES_ALL = ['T', 'A', 'NCNS', 'EO', 'UTO', 'WD'];
const DEDUCT_CODES_CONTRACTOR_EXTRA = ['SL', 'SLW'];

function isDeductible(code, payType) {
  const c = (code || '').toUpperCase();
  if (DEDUCT_CODES_ALL.includes(c)) return true;
  if (DEDUCT_CODES_CONTRACTOR_EXTRA.includes(c) && payType === 'Nomina') return true;
  return false;
}

function getDeductMinutes(record) {
  const code = (record.code || '').toUpperCase();
  if (code === 'A' || code === 'NCNS' || code === 'UTO' || code === 'SLW') return 480;
  if (code === 'T') return record.tardy_minutes || 0;
  if (code === 'EO') return record.lost_minutes || 0;
  if (code === 'SL') return record.lost_minutes || 0;
  if (code === 'WD') return record.lost_minutes || 0;
  return 0;
}

const SORT_OPTIONS = [
  { key: 'hours-desc', label: 'Hours ↓', sort: (a, b) => b.totalMin - a.totalMin },
  { key: 'hours-asc', label: 'Hours ↑', sort: (a, b) => a.totalMin - b.totalMin },
  { key: 'name-asc', label: 'Name A–Z', sort: (a, b) => a.agent.localeCompare(b.agent) },
  { key: 'dept-asc', label: 'Department', sort: (a, b) => a.department.localeCompare(b.department) || b.totalMin - a.totalMin },
];

export default function PayrollSection({ data, agents }) {
  const [sortKey, setSortKey] = useState('hours-desc');
  const [expandedAgent, setExpandedAgent] = useState(null);

  // Build agent pay type map
  const payTypeMap = useMemo(() => {
    const map = {};
    agents.forEach(a => { map[a.agent] = a.pay_type || 'Contractor'; });
    return map;
  }, [agents]);

  // Calculate payroll per agent
  const payrollByAgent = useMemo(() => {
    const byAgent = {};

    data.forEach(r => {
      const agent = r.agent;
      if (!agent) return;
      const payType = payTypeMap[agent] || 'Contractor';
      const code = (r.code || '').toUpperCase();

      if (!isDeductible(code, payType)) return;

      if (!byAgent[agent]) {
        byAgent[agent] = {
          agent,
          department: r.department,
          payType,
          totalMin: 0,
          records: [],
          byCodes: {},
        };
      }

      const mins = getDeductMinutes(r);
      if (mins <= 0) return;

      byAgent[agent].totalMin += mins;
      byAgent[agent].records.push({ date: r.date, code, minutes: mins });
      byAgent[agent].byCodes[code] = (byAgent[agent].byCodes[code] || 0) + mins;
    });

    return Object.values(byAgent);
  }, [data, payTypeMap]);

  const currentSort = SORT_OPTIONS.find(s => s.key === sortKey);
  const sorted = [...payrollByAgent].sort(currentSort.sort);

  const grandTotalMin = payrollByAgent.reduce((s, a) => s + a.totalMin, 0);

  const codeColor = (code) => {
    const map = { T: '#f59e0b', A: '#ef4444', NCNS: '#dc2626', EO: '#f97316', UTO: '#6366f1', SL: '#06b6d4', SLW: '#06b6d4', WD: '#64748b' };
    return map[code] || '#64748b';
  };

  return (
    <div className="animate-fade-up delay-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Payroll Deductions
          <span className="ml-2 font-normal normal-case">({sorted.length} agents with deductions)</span>
        </h2>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} style={{ color: 'var(--text-muted)' }} />
          <select value={sortKey} onChange={e => setSortKey(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
            {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Grand total */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Deductions (all agents)</span>
          <div className="text-right">
            <span className="font-mono text-2xl font-bold" style={{ color: '#ef4444' }}>
              {(grandTotalMin / 60).toFixed(1)}h
            </span>
            <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
              ({grandTotalMin} min)
            </span>
          </div>
        </div>
      </div>

      {/* Agent table */}
      {sorted.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          No deductions in this period
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: 'var(--table-header)' }}>
                <tr className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  <th className="text-left p-3 font-medium">#</th>
                  <th className="text-left p-3 font-medium">Agent</th>
                  <th className="text-left p-3 font-medium">Department</th>
                  <th className="text-center p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Breakdown</th>
                  <th className="text-right p-3 font-medium">Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((a, i) => (
                  <>
                    <tr key={a.agent}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => setExpandedAgent(expandedAgent === a.agent ? null : a.agent)}>
                      <td className="p-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td className="p-3 font-medium" style={{ color: 'var(--text-primary)' }}>{a.agent}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: getDeptColor(a.department) }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{a.department}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            background: a.payType === 'Nomina' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
                            color: a.payType === 'Nomina' ? '#10b981' : '#6366f1',
                          }}>
                          {a.payType}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(a.byCodes).map(([code, mins]) => (
                            <span key={code} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                              style={{ background: codeColor(code) + '18', color: codeColor(code) }}>
                              {code} <span className="opacity-70">{fmtMinToHrs(mins)}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-mono font-semibold" style={{ color: '#ef4444' }}>
                          {(a.totalMin / 60).toFixed(1)}h
                        </span>
                      </td>
                    </tr>
                    {/* Expanded detail */}
                    {expandedAgent === a.agent && (
                      <tr key={`${a.agent}-detail`}>
                        <td colSpan={6} style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                          <div className="p-4">
                            <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                              Individual Records
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {a.records.sort((x, y) => x.date.localeCompare(y.date)).map((r, ri) => (
                                <div key={ri} className="card p-2 text-center text-xs">
                                  <div className="font-mono" style={{ color: 'var(--text-secondary)' }}>{r.date.substring(5)}</div>
                                  <span className="inline-block px-1.5 py-0.5 rounded mt-1 font-semibold"
                                    style={{ background: codeColor(r.code) + '18', color: codeColor(r.code) }}>
                                    {r.code}
                                  </span>
                                  <div className="font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{fmtMinToHrs(r.minutes)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
