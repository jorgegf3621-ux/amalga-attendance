import { useState } from 'react';
import { useTracker, AVOIDABLE_CATEGORIES } from '../lib/useTracker';
import { Plus, Coffee, UtensilsCrossed, CheckCircle, Copy, Check, Sun, Moon } from 'lucide-react';
import { useTheme } from '../lib/theme';

function fmtTime(secs) {
  const m = Math.floor(secs/60), s = secs%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function fmtTimeStr(t) {
  if (!t) return '--:--';
  // Handle full date strings like "Sat Dec 30 1899 14:53:00 GMT..."
  if (t.length > 8) {
    const m = t.match(/(\d{2}:\d{2}:\d{2})/);
    return m ? m[1].slice(0,5) : '--:--';
  }
  return t.slice(0,5);
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={handleCopy} className="p-1 rounded transition-all"
      style={{ color: copied ? '#34c98a' : 'var(--text-muted)' }}
      title="Copy case number">
      {copied ? <Check size={11}/> : <Copy size={11}/>}
    </button>
  );
}

export default function AgentTracker({ accessConfig }) {
  const { agentName, accent } = accessConfig;
  const { dark, toggle } = useTheme();
  const {
    todayCases, activeCase, activity, loading, saving,
    elapsed, actElapsed, totalCases, progress,
    startCase, closeCase, cancelCase, startActivity, endActivity,
  } = useTracker(agentName);

  const [step, setStep]                   = useState('idle');
  const [caseNumber, setCaseNumber]       = useState('');
  const [escalation, setEscalation]       = useState(null);
  const [avoidable, setAvoidable]         = useState(null);
  const [avoidableCategory, setAvoidableCategory] = useState('');
  const [isDuplicate, setIsDuplicate]     = useState(false);
  const [duplicateTimes, setDuplicateTimes] = useState(1);
  const [error, setError]                 = useState('');

  function handleCancel() {
    cancelCase();
    setStep('idle');
    setError('');
  }
  const firstName = agentName.split(' ')[0];  = todayCases.filter(c => c.case_type==='Regular' && !c.case_number.endsWith('_DUP')).length;
  const escCount  = todayCases.filter(c => c.case_type==='Escalation' && !c.case_number.endsWith('_DUP')).length;
  const barCol    = progress >= 90 ? '#34c98a' : progress >= 60 ? accent : progress >= 30 ? '#e8a020' : '#e05555';

  function handleNewCase() { setStep('input'); setCaseNumber(''); setError(''); }

  function handleStartCase() {
    const cn = caseNumber.trim();
    if (!cn) { setError('Enter a case number'); return; }
    if (!/^(REC\d+|\d+)$/i.test(cn)) { setError('Invalid format'); return; }
    startCase(cn);
    setStep('close');
    setEscalation(null); setAvoidable(null); setAvoidableCategory('');
    setIsDuplicate(false); setDuplicateTimes(1); setError('');
  }

  async function handleCloseCase() {
    if (escalation === null) { setError('Select escalation status'); return; }
    if (escalation && avoidable === null) { setError('Select if avoidable'); return; }
    if (escalation && avoidable && !avoidableCategory) { setError('Select category'); return; }
    const ok = await closeCase({ escalation, avoidable, avoidableCategory, isDuplicate, duplicateTimes });
    if (ok) { setStep('idle'); setError(''); }
  }

  return (
    <div className="min-h-screen" style={{ background:'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background:'var(--bg-primary)', borderBottom:'1px solid var(--border)' }}>
        <div className="px-6 py-3 flex items-center gap-4">
          {/* Agent info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: accent+'22', color: accent }}>{firstName.slice(0,2).toUpperCase()}</div>
            <div>
              <div className="font-bold text-sm" style={{ color:'var(--text-primary)' }}>{firstName}</div>
              <div className="text-xs" style={{ color:'var(--text-muted)' }}>Record Review</div>
            </div>
          </div>

          {/* Progress */}
          <div className="flex-1 mx-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold" style={{ color: accent }}>{totalCases}</span>
                <span className="text-sm" style={{ color:'var(--text-muted)' }}>/ 70</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: accent+'22', color: accent }}>{progress}%</span>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color:'var(--text-muted)' }}>
                <span><span className="font-mono font-bold" style={{ color:'#34c98a' }}>{regCount}</span> REG</span>
                <span><span className="font-mono font-bold" style={{ color:'#e05555' }}>{escCount}</span> ESC</span>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background:'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width:`${progress}%`, background: barCol }} />
            </div>
          </div>

          {/* Activity status pill */}
          {activity && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: activity.type==='lunch'?'rgba(232,160,32,.15)':'rgba(55,154,171,.15)', color: activity.type==='lunch'?'#e8a020':accent }}>
              {activity.type==='lunch' ? <UtensilsCrossed size={12}/> : <Coffee size={12}/>}
              {fmtTime(actElapsed)}
            </div>
          )}

          {/* Theme toggle */}
          <button onClick={toggle} className="p-2 rounded-lg transition-all"
            style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-muted)' }}>
            {dark ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
        </div>
      </header>

      <div className="p-6">
        <div className="max-w-5xl mx-auto">

          {/* Active Case */}
          {activeCase && step==='close' && (
            <div className="rounded-2xl border-2 overflow-hidden mb-6" style={{ borderColor: accent, background:'var(--bg-card)' }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ background: accent+'12' }}>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: accent }}>Active Case</div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-mono font-bold" style={{ color:'var(--text-primary)' }}>{activeCase.caseNumber}</div>
                    <CopyButton text={activeCase.caseNumber} />
                  </div>
                  <div className="text-xs mt-1" style={{ color:'var(--text-muted)' }}>Started {fmtTimeStr(activeCase.startTime)}</div>
                </div>
                <div className="text-5xl font-mono font-bold" style={{ color: accent }}>{fmtTime(elapsed)}</div>
              </div>

              <div className="p-6 grid grid-cols-2 gap-6">
                {/* Left: Escalation + Avoidable */}
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color:'var(--text-muted)' }}>Escalation</div>
                    <div className="flex gap-2">
                      {['No','Yes'].map(v => (
                        <button key={v} onClick={() => { setEscalation(v==='Yes'); setAvoidable(null); setAvoidableCategory(''); }}
                          className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                          style={{ background: escalation===(v==='Yes') ? (v==='Yes'?'#e05555':accent) : 'var(--bg-secondary)', color: escalation===(v==='Yes') ? '#fff' : 'var(--text-muted)', border:'1.5px solid var(--border)' }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {escalation===true && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color:'var(--text-muted)' }}>Avoidable?</div>
                      <div className="flex gap-2">
                        {['No','Yes'].map(v => (
                          <button key={v} onClick={() => { setAvoidable(v==='Yes'); setAvoidableCategory(''); }}
                            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                            style={{ background: avoidable===(v==='Yes') ? '#e8a020' : 'var(--bg-secondary)', color: avoidable===(v==='Yes') ? '#fff' : 'var(--text-muted)', border:'1.5px solid var(--border)' }}>
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duplicate */}
                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={() => setIsDuplicate(!isDuplicate)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: isDuplicate ? '#7c6fd4' : 'var(--bg-secondary)', color: isDuplicate ? '#fff' : 'var(--text-muted)', border:'1px solid var(--border)' }}>
                      <Copy size={12}/> Duplicate
                    </button>
                    {isDuplicate && (
                      <select value={duplicateTimes} onChange={e => setDuplicateTimes(Number(e.target.value))}
                        className="rounded-lg px-3 py-2 text-xs border outline-none"
                        style={{ background:'var(--bg-secondary)', borderColor:'var(--border)', color:'var(--text-primary)' }}>
                        {[...Array(10)].map((_,i) => <option key={i+1} value={i+1}>×{i+1}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {/* Right: Category */}
                <div>
                  {escalation===true && avoidable===true && (
                    <>
                      <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color:'var(--text-muted)' }}>Category</div>
                      <div className="grid grid-cols-2 gap-2">
                        {AVOIDABLE_CATEGORIES.map(cat => (
                          <button key={cat} onClick={() => setAvoidableCategory(cat)}
                            className="px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all"
                            style={{ background: avoidableCategory===cat ? '#e8a020' : 'var(--bg-secondary)', color: avoidableCategory===cat ? '#fff' : 'var(--text-muted)', border:'1px solid var(--border)' }}>
                            {cat}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {error && <div className="px-6 pb-2 text-xs font-semibold" style={{ color:'#e05555' }}>{error}</div>}

              <div className="px-6 pb-6 flex gap-3">
                <button onClick={handleCancel} className="px-6 py-3 rounded-xl text-sm font-semibold"
                  style={{ background:'var(--bg-secondary)', color:'var(--text-muted)', border:'1px solid var(--border)' }}>
                  Cancel
                </button>
                <button onClick={handleCloseCase} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{ background: accent, color:'#fff', opacity: saving?0.7:1 }}>
                  <CheckCircle size={16}/> {saving ? 'Saving...' : 'Close Case'}
                </button>
              </div>
            </div>
          )}

          {/* New case input */}
          {step==='input' && !activeCase && (
            <div className="rounded-2xl border p-6 mb-6" style={{ background:'var(--bg-card)', borderColor: accent }}>
              <div className="text-sm font-bold mb-3" style={{ color:'var(--text-primary)' }}>Enter Case Number</div>
              <div className="flex gap-3">
                <input autoFocus value={caseNumber}
                  onChange={e => setCaseNumber(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key==='Enter' && handleStartCase()}
                  placeholder="e.g. 1234567 or REC1234567"
                  className="flex-1 rounded-xl px-4 py-3 text-sm border outline-none font-mono"
                  style={{ background:'var(--bg-secondary)', borderColor:'var(--border)', color:'var(--text-primary)' }}
                />
                <button onClick={() => { setStep('idle'); setError(''); }}
                <button onClick={handleStartCase}
                  className="px-6 py-3 rounded-xl text-sm font-bold"
                  style={{ background: accent, color:'#fff' }}>
                  Start
                </button>
              </div>
              {error && <div className="text-xs mt-2 font-semibold" style={{ color:'#e05555' }}>{error}</div>}
            </div>
          )}

          {/* Main actions — idle */}
          {step==='idle' && !activeCase && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button onClick={handleNewCase}
                className="col-span-1 py-6 rounded-2xl text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: accent, color:'#fff' }}>
                <Plus size={28}/>
                New Case
              </button>
              <button
                onClick={() => activity?.type==='lunch' ? endActivity() : startActivity('lunch')}
                disabled={!!activity && activity.type!=='lunch'}
                className="py-6 rounded-2xl text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all"
                style={{ background: activity?.type==='lunch'?'#e8a020':'var(--bg-card)', color: activity?.type==='lunch'?'#fff':'#e8a020', border:`2px solid #e8a020`, opacity:(activity && activity.type!=='lunch')?0.35:1 }}>
                <UtensilsCrossed size={22}/>
                {activity?.type==='lunch' ? `Back (${fmtTime(actElapsed)})` : 'Lunch'}
              </button>
              <button
                onClick={() => activity?.type==='break' ? endActivity() : startActivity('break')}
                disabled={!!activity && activity.type!=='break'}
                className="py-6 rounded-2xl text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all"
                style={{ background: activity?.type==='break'?accent:'var(--bg-card)', color: activity?.type==='break'?'#fff':accent, border:`2px solid ${accent}`, opacity:(activity && activity.type!=='break')?0.35:1 }}>
                <Coffee size={22}/>
                {activity?.type==='break' ? `Back (${fmtTime(actElapsed)})` : 'Break'}
              </button>
            </div>
          )}

          {/* Today's cases grid */}
          {todayCases.length > 0 && (
            <div className="rounded-2xl border overflow-hidden" style={{ background:'var(--bg-card)', borderColor:'var(--border)' }}>
              <div className="px-5 py-3 border-b" style={{ borderColor:'var(--border)', background:'var(--bg-secondary)' }}>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>
                  Today's Cases — {totalCases} total
                </span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3">
                {[...todayCases].reverse().map(c => {
                  const isDup = c.case_number.endsWith('_DUP');
                  const isEsc = c.case_type==='Escalation';
                  return (
                    <div key={c.id} className="rounded-xl border px-4 py-3 flex items-center gap-3"
                      style={{ background:'var(--bg-secondary)', borderColor:'var(--border)' }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-mono font-semibold truncate" style={{ color:'var(--text-primary)' }}>
                            {c.case_number.replace('_DUP','')}
                          </span>
                          <CopyButton text={c.case_number.replace('_DUP','')} />
                          {isDup && <span className="text-xs px-1.5 rounded" style={{ background:'rgba(124,111,212,.15)', color:'#7c6fd4' }}>DUP</span>}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>
                          {Math.round(c.duration_sec/60*10)/10}m
                        </div>
                        {c.avoidable_category && (
                          <div className="text-xs mt-0.5 truncate" style={{ color:'var(--text-muted)' }}>{c.avoidable_category}</div>
                        )}
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                        style={{ background: isEsc?'rgba(224,85,85,.12)':'rgba(52,201,138,.12)', color: isEsc?'#e05555':'#34c98a' }}>
                        {isEsc?'ESC':'REG'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loading && <div className="text-center py-8 text-sm" style={{ color:'var(--text-muted)' }}>Loading...</div>}
        </div>
      </div>
    </div>
  );
}
