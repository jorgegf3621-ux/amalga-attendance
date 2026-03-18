import { calcShrinkage, fmtPct, fmtMinToHrs } from '../lib/calculations';
import MetricCard from './MetricCard';

export default function ShrinkageSection({ data }) {
  const s = calcShrinkage(data);

  return (
    <div className="animate-fade-up delay-3">
      <h2 className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>Shrinkage</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Shrinkage %" value={fmtPct(s.shrinkagePct)} color={s.shrinkagePct <= 0.05 ? '#10b981' : s.shrinkagePct <= 0.1 ? '#f59e0b' : '#ef4444'} delay={1} />
        <MetricCard label="Tardy Minutes" value={fmtMinToHrs(s.tardyMin)} sub={`${s.tardyMin} min`} color="#f59e0b" delay={2} />
        <MetricCard label="Absence Minutes" value={fmtMinToHrs(s.absenceMin)} sub={`${s.absenceMin} min`} color="#ef4444" delay={3} />
        <MetricCard label="Total Lost" value={fmtMinToHrs(s.totalLostMin)} sub={`of ${fmtMinToHrs(s.totalShiftMin)} scheduled`} color="#6366f1" delay={4} />
      </div>
    </div>
  );
}
