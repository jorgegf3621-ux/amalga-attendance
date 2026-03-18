import { useMemo, useEffect, useState } from 'react';
import { ThemeProvider } from './lib/theme';
import { validateAccess } from './lib/access';
import { useData } from './lib/useData';
import { useRRData } from './lib/useRRData';
import AccessDenied from './components/AccessDenied';
import Filters from './components/Filters';
import AttendanceSection from './components/AttendanceSection';
import CountsSection from './components/CountsSection';
import OutliersSection from './components/OutliersSection';
import AgentList from './components/AgentList';
import AgentDetail from './components/AgentDetail';
import PayrollSection from './components/PayrollSection';
import RROperations from './components/RROperations';

import ThemeToggle from './components/ThemeToggle';
import Legend from './components/Legend';
import { Activity, Loader2, BarChart3, ClipboardList } from 'lucide-react';

function App() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('access') || '', []);
  const accessConfig = useMemo(() => validateAccess(token), [token]);

  useEffect(() => {
    if (accessConfig?.accent) {
      document.documentElement.style.setProperty('--accent', accessConfig.accent);
      document.documentElement.style.setProperty('--accent-light', accessConfig.accentLight || '#fdf3e4');
    }
  }, [accessConfig]);

  return (
    <ThemeProvider>
      {!accessConfig
        ? <AccessDenied />
        : accessConfig.isAgent
          ? <AgentTracker accessConfig={accessConfig} />
          : <Dashboard accessConfig={accessConfig} />
      }
    </ThemeProvider>
  );
}

function Dashboard({ accessConfig }) {
  const isAdmin = accessConfig.role === 'admin';
  const showRR = accessConfig.showRR;
  const showPayroll = accessConfig.showPayroll;

  const [activeTab, setActiveTab] = useState(showRR && !isAdmin ? 'rr' : 'attendance');
  const [attSubTab, setAttSubTab] = useState('attendance');

  const {
    filteredData, agents, loading, error,
    selectedMonth, setSelectedMonth,
    dateRange, setDateRange,
    selectedDept, setSelectedDept,
    selectedAgent, setSelectedAgent,
    availableMonths, availableDepts,
  } = useData(accessConfig.departments);

  const rrDataHook = useRRData();

  if (loading && activeTab === 'attendance') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:'var(--bg-primary)' }}>
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={32} style={{ color:'var(--accent)' }} />
          <p className="text-sm" style={{ color:'var(--text-secondary)' }}>Loading data...</p>
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
    { key:'attendance', label:'Attendance', icon:<BarChart3 size={15} /> },
    ...(showRR ? [{ key:'rr', label:'Record Review', icon:<ClipboardList size={15} /> }] : []),
  ];

  const attTabs = [
    { key:'attendance', label:'Attendance' },
    ...(showPayroll ? [{ key:'payroll', label:'Payroll' }] : []),
  ];

  return (
    <div className="min-h-screen" style={{ background:'var(--bg-primary)' }}>
      <header className="sticky top-0 z-50 backdrop-blur-md" style={{ background:'var(--bg-primary)', borderBottom:'1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background:'var(--accent-light)' }}>
              <Activity size={18} style={{ color:'var(--accent)' }} />
            </div>
            <div>
              <h1 className="text-base font-bold font-display tracking-tight" style={{ color:'var(--text-primary)' }}>Gemini Dashboard</h1>
              <p className="text-xs" style={{ color:'var(--text-muted)' }}>{accessConfig.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background:'var(--accent)' }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color:'var(--text-muted)' }}>{accessConfig.role}</span>
              </div>
            )}
            <Legend />
            <ThemeToggle />
          </div>
        </div>

        {/* Main tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative"
                style={{ color: activeTab===tab.key ? 'var(--accent)' : 'var(--text-muted)' }}>
                {tab.icon}{tab.label}
                {activeTab===tab.key && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:'var(--accent)' }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Attendance sub-tabs (only if payroll available) */}
        {activeTab === 'attendance' && showPayroll && (
          <div className="max-w-7xl mx-auto px-6 pb-1" style={{ borderTop:'1px solid var(--border)' }}>
            <div className="flex gap-1 pt-1">
              {attTabs.map(sub => (
                <button key={sub.key} onClick={() => setAttSubTab(sub.key)}
                  className="px-3 py-2 text-xs font-medium transition-all relative"
                  style={{ color: attSubTab===sub.key ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {sub.label}
                  {attSubTab===sub.key && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background:'var(--accent)' }} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Attendance / Payroll */}
        {activeTab === 'attendance' && (
          <>
            {attSubTab === 'attendance' && (
              <>
                <Filters
                  availableMonths={availableMonths} availableDepts={availableDepts}
                  selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
                  dateRange={dateRange} setDateRange={setDateRange}
                  selectedDept={selectedDept} setSelectedDept={setSelectedDept}
                  isAdmin={isAdmin}
                />
                <div className="text-xs mb-6" style={{ color:'var(--text-muted)' }}>
                  Showing <span className="font-mono" style={{ color:'var(--text-secondary)' }}>{filteredData.length}</span> records
                </div>
                {filteredData.length === 0
                  ? <div className="text-center py-20"><p style={{ color:'var(--text-muted)' }}>No data matches your current filters</p></div>
                  : <div className="space-y-8">
                      <AttendanceSection data={filteredData} isAdmin={isAdmin} />
                      <CountsSection data={filteredData} />
                      <OutliersSection data={filteredData} onSelectAgent={setSelectedAgent} />
                      <AgentList data={filteredData} onSelectAgent={setSelectedAgent} />
                    </div>
                }
              </>
            )}
            {attSubTab === 'payroll' && showPayroll && (
              <PayrollSection data={filteredData} agents={agents} />
            )}
          </>
        )}

        {/* Record Review */}
        {activeTab === 'rr' && showRR && (
          <RROperations
            opsData={rrDataHook.opsData}
            loading={rrDataHook.loading}
            error={rrDataHook.error}
            preset={rrDataHook.preset}
            setPreset={rrDataHook.setPreset}
            customRange={rrDataHook.customRange}
            setCustomRange={rrDataHook.setCustomRange}
            isSingleDay={rrDataHook.isSingleDay}
            rawData={rrDataHook.rawData}
            range={rrDataHook.range}
          />
        )}
      </main>

      <footer style={{ borderTop:'1px solid var(--border)' }} className="mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs" style={{ color:'var(--text-muted)' }}>
          <span>Amalga Group — Gemini Dashboard</span>
          <span>Data synced from DataHub</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
