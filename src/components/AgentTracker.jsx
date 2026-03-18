import { useState } from 'react';
import { useTracker, AVOIDABLE_CATEGORIES } from '../lib/useTracker';
import { LogOut, Plus, Clock, Coffee, UtensilsCrossed, CheckCircle, Copy } from 'lucide-react';

function fmtTime(secs) {
  const m = Math.floor(secs/60), s = secs%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function fmtTimeStr(t) { return t ? t.slice(0,5) : '--:--'; }

export default function AgentTracker({ accessConfig }) {
  const { agentName, accent } = accessConfig;
  const {
    todayCases, activeCase, activity, loading, saving,
    elapsed, actElapsed, totalCases, progress,
    startCase, closeCase, cancelCase, startActivity, endActivity,
  } = useTracker(agentName);

  // New case form
  const [step, setStep]                   = useState('idle'); // idle | input | close
  const [caseNumber, setCaseNumber]       = useState('');
  const [escalation, setEscalation]       = useState(null);
  const [avoidable, setAvoidable]         = useState(null);
  const [avoidableCategory, setAvoidableCategory] = useState('');
  const [isDuplicate, setIsDuplicate]     = useState(false);
  const [duplicateTimes, setDuplicateTimes] = useState(1);
  const [error, setError]                 = useState('');

  const firstName = agentName.split(' ')[0];
  const barCol = progress >= 80 ? accent : progress >= 50 ? '#e8a020' : '#e05555';

  function handleNewCase() { setStep('input'); setCaseNumber(''); setError(''); }

  function handleStartCase() {
    const cn = caseNumber.trim();
    if (!cn) { setError('Enter a case number'); return; }
    if (!/^(REC\d+|\d+)$/i.test(cn)) { setError('Invalid format (e.g. 1234567 or REC1234567)'); return; }
    startCase(cn);
    setStep('close');
    setEscalation(null); setAvoidable(null); setAvoidableCategory('');
    setIsDuplicate(false); setDuplicateTimes(1);
    setError('');
  }

  async function handleCloseCase() {
    if (escalation === null) { setError('Select escalation status'); return; }
    if (escalation && avoidable === null) { setError('Select if avoidable'); return; }
    if (escalation && avoidable && !avoidableCategory) { setError('Select avoidable category'); return; }
    const ok = await closeCase({ escalation, avoidable, avoidableCategory, isDuplicate, duplicateTimes });
    if (ok) { setStep('idle'); setError(''); }
  }

  return (
    <div className="min-h-screen" style={{ background:'var(--bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background:'var(--bg-primary)', borderBottom:'1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: accent+'22', color: accent }}>{firstName.slice(0,2).toUpperCase()}</div>
            <div>
              <div className="font-bold text-sm" style={{ color:'var(--text-primary)' }}>{firstName}</div>
              <div className="text-xs" style={{ color:'var(--text-muted)' }}>Record Review Tracker</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold" style={{ color: accent }}>{totalCases}<span className="text-sm font-normal" style={{ color:'var(--text-muted)' }}>/70</span></div>
            <div className="text-xs" style={{ color:'var(--text-muted)' }}>{progress}% of target</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5" style={{ background:'var(--border)' }}>
          <div className="h-full transition-all" style={{ width:`${progress}%`, background: barCol }} />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Activity status */}
        {activity && (
          <div className="rounded-xl p-4 border flex items-center justify-between"
            style={{ background: activity.type==='lunch' ? 'rgba(232,160,32,.08)' : 'rgba(55,154,171,.08)', borderColor: activity.type==='lunch' ? '#e8a020' : accent }}>
            <div className="flex items-center gap-3">
              {activity.type==='lunch' ? <UtensilsCrossed size={18} color="#e8a020"/> : <Coffee size={18} style={{ color: accent }}/>}
              <div>
                <div className="text-sm font-semibold" style={{ color: activity.type==='lunch'?'#e8a020':accent }}>
                  On {activity.type==='lunch'?'Lunch':'Break'}
                </div>
                <div className="text-xs font-mono" style={{ color:'var(--text-muted)' }}>{fmtTime(actElapsed)}</div>
              </div>
            </div>
            <button onClick={endActivity}
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: activity.type==='lunch'?'#e8a020':accent, color:'#fff' }}>
              Back
            </button>
          </div>
        )}

        {/* Active case */}
        {activeCase && step === 'close' && (
          <div className="rounded-xl border overflow-hidden" style={{ background:'var(--bg-card)', borderColor: accent }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: accent+'15' }}>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>Active Case</div>
                <div className="text-lg font-mono font-bold" style={{ color: accent }}>{activeCase.caseNumber}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold" style={{ color: accent }}>{fmtTime(elapsed)}</div>
                <div className="text-xs" style={{ color:'var(--text-muted)' }}>Started {fmtTimeStr(activeCase.startTime)}</div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Escalation */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color:'var(--text-muted)' }}>Escalation</div>
                <div className="flex gap-2">
                  {['No','Yes'].map(v => (
                    <button key={v} onClick={() => { setEscalation(v==='Yes'); setAvoidable(null); setAvoidableCategory(''); }}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                      style={{ background: escalation===(v==='Yes') ? (v==='Yes'?'#e05555':accent) : 'var(--bg-secondary)', color: escalation===(v==='Yes') ? '#fff' : 'var(--text-muted)', border:'1px solid var(--border)' }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avoidable */}
              {escalation === true && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color:'var(--text-muted)' }}>Avoidable?</div>
                  <div className="flex gap-2">
                    {['No','Yes'].map(v => (
                      <button key={v} onClick={() => { setAvoidable(v==='Yes'); setAvoidableCategory(''); }}
                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                        style={{ background: avoidable===(v==='Yes') ? '#e8a020' : 'var(--bg-secondary)', color: avoidable===(v==='Yes') ? '#fff' : 'var(--text-muted)', border:'1px solid var(--border)' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category */}
              {escalation === true && avoidable === true && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color:'var(--text-muted)' }}>Category</div>
                  <div className="grid grid-cols-2 gap-2">
                    {AVOIDABLE_CATEGORIES.map(cat => (
                      <button key={cat} onClick={() => setAvoidableCategory(cat)}
                        className="px-3 py-2 rounded-lg text-xs font-medium text-left transition-all"
                        style={{ background: avoidableCategory===cat ? '#e8a020' : 'var(--bg-secondary)', color: avoidableCategory===cat ? '#fff' : 'var(--text-muted)', border:'1px solid var(--border)' }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicate */}
              <div className="flex items-center gap-3 pt-1">
                <button onClick={() => setIsDuplicate(!isDuplicate)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
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

              {error && <div className="text-xs font-semibold" style={{ color:'#e05555' }}>{error}</div>}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={cancelCase} className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background:'var(--bg-secondary)', color:'var(--text-muted)', border:'1px solid var(--border)' }}>
                  Cancel
                </button>
                <button onClick={handleCloseCase} disabled={saving}
                  className="flex-2 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: accent, color:'#fff', flex:2, opacity: saving?0.7:1 }}>
                  <CheckCircle size={15}/> {saving ? 'Saving...' : 'Close Case'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New case input */}
        {step === 'input' && (
          <div className="rounded-xl border p-4 space-y-3" style={{ background:'var(--bg-card)', borderColor:'var(--border)' }}>
            <div className="text-sm font-semibold" style={{ color:'var(--text-primary)' }}>New Case</div>
            <input
              autoFocus
              value={caseNumber}
              onChange={e => setCaseNumber(e.target.value.toUpperCase())}
              onKeyDown={e => e.key==='Enter' && handleStartCase()}
              placeholder="Case number (e.g. 1234567)"
              className="w-full rounded-lg px-4 py-3 text-sm border outline-none font-mono"
              style={{ background:'var(--bg-secondary)', borderColor:'var(--border)', color:'var(--text-primary)' }}
            />
            {error && <div className="text-xs" style={{ color:'#e05555' }}>{error}</div>}
            <div className="flex gap-2">
              <button onClick={() => { setStep('idle'); setError(''); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background:'var(--bg-secondary)', color:'var(--text-muted)', border:'1px solid var(--border)' }}>
                Cancel
              </button>
              <button onClick={handleStartCase}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: accent, color:'#fff' }}>
                Start
              </button>
            </div>
          </div>
        )}

        {/* Main actions — idle */}
        {step === 'idle' && !activeCase && (
          <div className="space-y-3">
            <button onClick={handleNewCase}
              className="w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{ background: accent, color:'#fff' }}>
              <Plus size={18}/> New Case
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => activity?.type==='lunch' ? endActivity() : startActivity('lunch')}
                disabled={!!activity && activity.type!=='lunch'}
                className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: activity?.type==='lunch' ? '#e8a020' : 'var(--bg-card)', color: activity?.type==='lunch' ? '#fff' : '#e8a020', border:'1.5px solid #e8a020', opacity: (activity && activity.type!=='lunch') ? 0.4 : 1 }}>
                <UtensilsCrossed size={15}/> {activity?.type==='lunch' ? `Back (${fmtTime(actElapsed)})` : 'Lunch'}
              </button>
              <button
                onClick={() => activity?.type==='break' ? endActivity() : startActivity('break')}
                disabled={!!activity && activity.type!=='break'}
                className="py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: activity?.type==='break' ? accent : 'var(--bg-card)', color: activity?.type==='break' ? '#fff' : accent, border:`1.5px solid ${accent}`, opacity: (activity && activity.type!=='break') ? 0.4 : 1 }}>
                <Coffee size={15}/> {activity?.type==='break' ? `Back (${fmtTime(actElapsed)})` : 'Break'}
              </button>
            </div>
          </div>
        )}

        {/* Today's cases list */}
        {todayCases.length > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ background:'var(--bg-card)', borderColor:'var(--border)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor:'var(--border)', background:'var(--bg-secondary)' }}>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>
                Today's Cases — {totalCases} total
              </span>
            </div>
            <div className="divide-y" style={{ borderColor:'var(--border)' }}>
              {[...todayCases].reverse().map(c => (
                <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-mono font-semibold" style={{ color:'var(--text-primary)' }}>
                      {c.case_number}
                      {c.case_number.endsWith('_DUP') && <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background:'rgba(124,111,212,.15)', color:'#7c6fd4' }}>DUP</span>}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>
                      {fmtTimeStr(c.start_time)} → {fmtTimeStr(c.end_time)} · {Math.round(c.duration_sec/60*10)/10}m
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: c.case_type==='Escalation'?'rgba(224,85,85,.15)':'rgba(52,201,138,.15)', color: c.case_type==='Escalation'?'#e05555':'#34c98a' }}>
                      {c.case_type==='Escalation'?'ESC':'REG'}
                    </span>
                    {c.avoidable_category && (
                      <span className="text-xs" style={{ color:'var(--text-muted)' }}>{c.avoidable_category}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="text-center py-8 text-sm" style={{ color:'var(--text-muted)' }}>Loading...</div>}
      </main>
    </div>
  );
}
