export default function MetricCard({ label, value, sub, color, delay = 0, icon }) {
  return (
    <div className={`animate-fade-up delay-${delay} card p-5`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</span>
        {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono" style={{ color: color || 'var(--text-primary)' }}>
          {value}
        </span>
        {sub && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</span>}
      </div>
    </div>
  );
}
