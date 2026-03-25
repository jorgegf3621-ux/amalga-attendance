import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const CODES = [
  { code: 'ON', label: 'On Time', color: '#10b981' },
  { code: 'T', label: 'Tardy', color: '#f59e0b' },
  { code: 'A', label: 'Absent', color: '#ef4444' },
  { code: 'NCNS', label: 'No Call No Show', color: '#dc2626' },
  { code: 'EO', label: 'Early Logout', color: '#f97316' },
  { code: 'PTO', label: 'Planned Time Off', color: '#C6842A' },
  { code: 'UTO', label: 'Unplanned Time Off', color: '#6366f1' },
  { code: 'SLW', label: 'Sick Leave (Full Day)', color: '#06b6d4' },
  { code: 'SL', label: 'Sick Leave (Partial)', color: '#06b6d4' },
  { code: 'ER', label: 'Emergency', color: '#ec4899' },
  { code: 'WD', label: 'Work Disruption', color: '#64748b' },
];

export default function Legend() {
  const [open, setOpen] = useState(false);
  const modalRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on any click outside the modal
  useEffect(() => {
    if (!open) return;

    function handleClick(e) {
      if (modalRef.current && !modalRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    // Small delay so the opening click doesn't immediately close it
    setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 10);

    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
        style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        Legend
      </button>

      {open && (
        <div ref={modalRef}
          className="absolute right-0 top-12 w-72 card p-0 z-[100]"
          style={{ background: 'var(--bg-card)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>

          <div className="flex items-center justify-between p-3"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="text-xs font-bold font-display uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Attendance Legend
            </h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>

          <div className="p-2">
            {CODES.map(c => (
              <div key={c.code} className="flex items-center gap-3 px-3 py-1.5 rounded-lg">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold font-mono shrink-0"
                  style={{ background: c.color + '18', color: c.color, minWidth: '44px', textAlign: 'center' }}>
                  {c.code}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{c.label}</span>
              </div>
            ))}
          </div>

          <div className="px-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Based on 8-hour shifts (480 min), excluding lunch. 
              PTO, UTO, and SLW are excluded from the calculation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
