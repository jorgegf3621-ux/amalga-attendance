import { monthLabel } from '../lib/calculations';
import { Calendar, SlidersHorizontal } from 'lucide-react';

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const QUICK_FILTERS = [
  {
    label: 'Today',
    apply: (setMonth, setRange) => {
      const str = formatDate(new Date());
      setMonth('all');
      setRange({ start: str, end: str });
    },
  },
  {
    label: 'Yesterday',
    apply: (setMonth, setRange) => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const str = formatDate(d);
      setMonth('all');
      setRange({ start: str, end: str });
    },
  },
  {
    label: 'Last 7 Days',
    apply: (setMonth, setRange) => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      setMonth('all');
      setRange({ start: formatDate(start), end: formatDate(end) });
    },
  },
  {
    label: 'This Month',
    apply: (setMonth, setRange) => {
      setRange({ start: '', end: '' });
      setMonth(getCurrentMonth());
    },
  },
  {
    label: 'Last Month',
    apply: (setMonth, setRange) => {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const ym = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      setRange({ start: '', end: '' });
      setMonth(ym);
    },
  },
  {
    label: 'All Time',
    apply: (setMonth, setRange) => {
      setRange({ start: '', end: '' });
      setMonth('all');
    },
  },
];

export default function Filters({
  availableMonths, availableDepts,
  selectedMonth, setSelectedMonth,
  dateRange, setDateRange,
  selectedDept, setSelectedDept,
  isAdmin,
}) {
  const handleMonthChange = (val) => {
    setSelectedMonth(val);
    if (val !== 'all') setDateRange({ start: '', end: '' });
  };

  const handleDateChange = (field, val) => {
    const next = { ...dateRange, [field]: val };
    setDateRange(next);
    if (next.start && next.end) setSelectedMonth('all');
  };

  // Detect which quick filter is active
  const activeQuick = (() => {
    if (dateRange.start && dateRange.end) {
      const todayStr = formatDate(new Date());
      if (dateRange.start === todayStr && dateRange.end === todayStr) return 'Today';

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = formatDate(yesterday);
      if (dateRange.start === yStr && dateRange.end === yStr) return 'Yesterday';

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      if (dateRange.start === formatDate(weekStart) && dateRange.end === formatDate(new Date())) return 'Last 7 Days';
    }
    if (!dateRange.start && !dateRange.end) {
      if (selectedMonth === 'all') return 'All Time';
      if (selectedMonth === getCurrentMonth()) return 'This Month';
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthYm = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      if (selectedMonth === lastMonthYm) return 'Last Month';
    }
    return null;
  })();

  const selectStyle = {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  };

  return (
    <div className="animate-fade-up card p-4 mb-6 space-y-4">
      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map(qf => (
          <button
            key={qf.label}
            onClick={() => qf.apply(setSelectedMonth, setDateRange)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={activeQuick === qf.label
              ? { background: 'var(--accent)', color: 'var(--text-inverse)' }
              : { background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
            }
          >
            {qf.label}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          <select value={selectedMonth} onChange={e => handleMonthChange(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm focus:outline-none" style={selectStyle}>
            <option value="all">All Months</option>
            {availableMonths.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>

        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
          <input type="date" value={dateRange.start} onChange={e => handleDateChange('start', e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm focus:outline-none" style={selectStyle} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>→</span>
          <input type="date" value={dateRange.end} onChange={e => handleDateChange('end', e.target.value)}
            className="rounded-lg px-3 py-1.5 text-sm focus:outline-none" style={selectStyle} />
          {(dateRange.start || dateRange.end) && (
            <button onClick={() => { setDateRange({ start: '', end: '' }); setSelectedMonth(getCurrentMonth()); }}
              className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>Clear</button>
          )}
        </div>

        {isAdmin && availableDepts.length > 1 && (
          <div className="flex items-center gap-2 ml-auto">
            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
              className="rounded-lg px-3 py-1.5 text-sm focus:outline-none" style={selectStyle}>
              <option value="all">All Departments</option>
              {availableDepts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
