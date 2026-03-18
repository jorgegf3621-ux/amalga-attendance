import { useMemo, useEffect, useState } from 'react';
import { ThemeProvider } from './lib/theme';
import { validateAccess } from './lib/access';
import { useData } from './lib/useData';
import AccessDenied from './components/AccessDenied';
import Filters from './components/Filters';
import AttendanceSection from './components/AttendanceSection';
import CountsSection from './components/CountsSection';
import OutliersSection from './components/OutliersSection';
import AgentList from './components/AgentList';
import AgentDetail from './components/AgentDetail';
import PayrollSection from './components/PayrollSection';
import ThemeToggle from './components/ThemeToggle';
import { Activity, Loader2, BarChart3, DollarSign } from 'lucide-react';

function App() {
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('access') || '';
  }, []);

  const accessConfig = useMemo(() => validateAccess(token), [token]);

  useEffect(() => {
    if (accessConfig?.accent) {
      document.documentElement.style.setProperty('--accent', accessConfig.accent);
      document.documentElement.style.setProperty('--accent-light', accessConfig.accentLight || '#fdf3e4');
    }
  }, [accessConfig]);

  return (
    <ThemeProvider>
      {accessConfig ? <Dashboard accessConfig={accessConfig} /> : <AccessDenied />}
    </ThemeProvider>
  );
}

function Dashboard({ accessConfig }) {
  const isAdmin = accessConfig.role === 'admin';
  const [activeTab, setActiveTab] = useState('attendance');

  const {
    filteredData, agents, loading, error,
    selectedMonth, setSelectedMonth,
    dateRange, setDateRange,
    selectedDept, setSelectedDept,
    selectedAgent, setSelectedAgent,
    availableMonths, availableDepts,
  } = useData(accessConfig.departments);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={32} style={{ color: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center max-w-md">
          <p className="font-medium mb-2" style={{ color: '#ef4444' }}>Error loading data</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (selectedAgent) {
    return (
      <div className="min-h-screen p-6 max-w-5xl mx-auto">
        <AgentDetail data={filteredData} agentName={selectedAgent} onBack={() => setSelectedAgent(null)} />
      </div>
    );
  }

  const tabs = [
    { key: 'attendance', label: 'Attendance', icon: <BarChart3 size={15} /> },
    ...(isAdmin ? [{ key: 'payroll', label: 'Payroll', icon: <DollarSign size={15} /> }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <header className="sticky top-0 z-50 backdrop-blur-md" style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-light)' }}>
              <Activity size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h1 className="text-base font-bold font-display tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Attendance Dashboard
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{accessConfig.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {accessConfig.role}
                </span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Tabs - solo si hay más de una */}
        {tabs.length > 1 && (
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative"
                  style={{
                    color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--accent)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Filters
          availableMonths={availableMonths} availableDepts={availableDepts}
          selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          dateRange={dateRange} setDateRange={setDateRange}
          selectedDept={selectedDept} setSelectedDept={setSelectedDept}
          isAdmin={isAdmin}
        />

        <div className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
          Showing <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{filteredData.length}</span> records
          {selectedDept !== 'all' && <> in <span style={{ color: 'var(--text-secondary)' }}>{selectedDept}</span></>}
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-20">
            <p style={{ color: 'var(--text-muted)' }}>No data matches your current filters</p>
          </div>
        ) : (
          <>
            {activeTab === 'attendance' && (
              <div className="space-y-8">
                <AttendanceSection data={filteredData} isAdmin={isAdmin} />
                <CountsSection data={filteredData} />
                <OutliersSection data={filteredData} onSelectAgent={setSelectedAgent} />
                <AgentList data={filteredData} onSelectAgent={setSelectedAgent} />
              </div>
            )}

            {activeTab === 'payroll' && isAdmin && (
              <PayrollSection data={filteredData} agents={agents} />
            )}
          </>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border)' }} className="mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Amalga Group — Attendance Operations</span>
          <span>Data synced from DataHub</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
