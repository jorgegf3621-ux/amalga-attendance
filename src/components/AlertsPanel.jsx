import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const RR_AGENTS_FULL = ['Stephania Collazo', 'Alexis Garcia', 'Katya Elisa Carballo'];
const AGENT_SHORT = { 'Stephania Collazo':'Stephania', 'Alexis Garcia':'Alexis', 'Katya Elisa Carballo':'Katya' };
const ACOLORS = { 'Stephania Collazo':'#379AAB', 'Alexis Garcia':'#34c98a', 'Katya Elisa Carballo':'#7c6fd4' };

const WARN_LEVELS = ['verbal','written','final','termination'];
const WARN_LABELS = { verbal:'Verbal Warning', written:'Written Warning', final:'Final Warning', termination:'Suggest Termination' };
const WARN_COLORS = { verbal:'#e8a020', written:'#e05555', final:'#c0392b', termination:'#7c0000' };

// Thresholds per type
const TARDY_THRESHOLDS = [3,6,9,12]; // verbal, written, final, termination
const ABSENCE_THRESHOLDS = [1,2,3,4]; // written, final, termination (starts at written)
const NCN_THRESHOLDS = [1,2,3,4];

function getNextWarnLevel(currentLevel) {
  const idx = WARN_LEVELS.indexOf(currentLevel);
  return WARN_LEVELS[Math.min(idx+1, WARN_LEVELS.length-1)];
}

function calcWarnLevel(count, type) {
  const thresholds = type==='tardy' ? TARDY_THRESHOLDS : ABSENCE_THRESHOLDS;
  const levels = type==='tardy' ? WARN_LEVELS : ['written','final','termination','termination'];
  let level = null;
  for (let i = thresholds.length-1; i >= 0; i--) {
    if (count >= thresholds[i]) { level = levels[i]; break; }
  }
  return level;
}

export default function AlertsPanel({ opsData, attendanceData, isSingleDay, range }) {
  const [disciplinary, setDisciplinary] = useState([]);
  const [attAlerts, setAttAlerts] = useState([]);
  const [acknowledging, setAcknowledging] = useState(null);
  const [expanded, setExpanded] = useState({ rr:true, att:true, disc:true });

  useEffect(() => { loadDisciplinary(); }, []);
  useEffect(() => { if (attendanceData) computeAttAlerts(attendanceData); }, [attendanceData]);

  async function loadDisciplinary() {
    const { data } = await supabase.from('disciplinary_actions').select('*').order('issued_at', { ascending:false });
    setDisciplinary(data || []);
  }

  function computeAttAlerts(data) {
    // Rolling 30 days
    const since = new Date(); since.setDate(since.getDate()-30);
    const sinceStr = since.toISOString().split('T')[0];
    const recent = data.filter(r => r.date >= sinceStr);

    const agentMap = {};
    recent.forEach(r => {
      if (!agentMap[r.agent]) agentMap[r.agent] = { tardies:0, absences:0, ncns:0 };
      const code = (r.code||'').toUpperCase();
      if (code==='T') agentMap[r.agent].tardies++;
      if (code==='A') agentMap[r.agent].absences++;
      if (code==='NCNS') agentMap[r.agent].ncns++;
    });

    const alerts = [];
    Object.entries(agentMap).forEach(([agent, counts]) => {
      ['tardies','absences','ncns'].forEach(type => {
        const count = counts[type];
        if (!count) return;
        const infraType = type==='tardies'?'tardy':(type==='absences'?'absence':'ncn');
        const warnLevel = calcWarnLevel(count, infraType);
        if (warnLevel) alerts.push({ agent, type: infraType, count, warnLevel });
      });
    });
    setAttAlerts(alerts);
  }

  // RR performance alerts from opsData
  const rrAlerts = [];
  if (opsData && isSingleDay) {
    opsData.agents.forEach(agent => {
      // Below target
      if (agent.progress < 70) {
        rrAlerts.push({ type:'below_target', agent: agent.name, msg:`${agent.total} cases — ${agent.progress}% of target`, severity:'warn' });
      }
      // AHT too high
      if (agent.regAHT && agent.regAHT > 5.0) {
        rrAlerts.push({ type:'aht_high', agent: agent.name, msg:`Reg AHT ${agent.regAHT}m (target 5.0m)`, severity:'warn' });
      }
      if (agent.escAHT && agent.escAHT > 12.0) {
        rrAlerts.push({ type:'aht_high', agent: agent.name, msg:`Esc AHT ${agent.escAHT}m (target 12.0m)`, severity:'warn' });
      }
      // Gaps
      if (agent.gapAlert && agent.gaps?.length > 0) {
        rrAlerts.push({ type:'gaps', agent: agent.name, msg:`${agent.gaps.length} unexpected gap${agent.gaps.length>1?'s':''} detected`, severity:'warn' });
      }
      // High esc rate vs team
      const teamEscRate = opsData.escRate;
      const agentEscRate = agent.total ? Math.round(agent.escCount/agent.total*100) : 0;
      if (agentEscRate > teamEscRate + 10) {
        rrAlerts.push({ type:'esc_rate', agent: agent.name, msg:`Esc rate ${agentEscRate}% vs team avg ${teamEscRate}%`, severity:'warn' });
      }
    });
  }

  // Active disciplinary — unacknowledged
  const activeDisc = disciplinary.filter(d => !d.acknowledged_at);

  // Check if new warning needed based on att alerts
  const discNeeded = attAlerts.filter(a => {
    const existing = disciplinary.find(d => d.agent===a.agent && d.infraction_type===a.type && !d.acknowledged_at);
    if (!existing) return true;
    const nextLevel = getNextWarnLevel(existing.warning_level);
    return nextLevel !== existing.warning_level && a.warnLevel !== existing.warning_level;
  });

  async function issueWarning(agent, type, level) {
    const resetAt = new Date(); resetAt.setDate(resetAt.getDate()+30);
    await supabase.from('disciplinary_actions').insert({
      agent, infraction_type: type, warning_level: level,
      issued_at: new Date().toISOString().split('T')[0],
      reset_at: resetAt.toISOString().split('T')[0],
    });
    await loadDisciplinary();
  }

  async function acknowledge(id) {
    setAcknowledging(id);
    await supabase.from('disciplinary_actions').update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: 'TL',
    }).eq('id', id);
    await loadDisciplinary();
    setAcknowledging(null);
  }

  const totalAlerts = rrAlerts.length + attAlerts.length + activeDisc.length;

  function Section({ title, count, colorKey, children, sKey }) {
    const isOpen = expanded[sKey];
    return (
      <div className="rounded-xl border overflow-hidden" style={{ background:'var(--bg-card)', borderColor:'var(--border)' }}>
        <button className="w-full px-4 py-3 flex items-center justify-between"
          style={{ background:'var(--bg-secondary)', borderBottom: isOpen?'1px solid var(--border)':'none' }}
          onClick={() => setExpanded(e=>({...e,[sKey]:!e[sKey]}))}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color:'var(--text-muted)' }}>{title}</span>
            {count > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:'rgba(224,85,85,.15)', color:'#e05555' }}>{count}</span>}
          </div>
          {isOpen ? <ChevronUp size={14} style={{ color:'var(--text-muted)' }}/> : <ChevronDown size={14} style={{ color:'var(--text-muted)' }}/>}
        </button>
        {isOpen && <div className="p-4 space-y-3">{children}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bell size={16} style={{ color:'var(--accent)' }}/>
        <span className="text-sm font-bold" style={{ color:'var(--text-primary)' }}>Alerts & Notifications</span>
        {totalAlerts > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:'rgba(224,85,85,.15)', color:'#e05555' }}>
            {totalAlerts} active
          </span>
        )}
      </div>

      {/* RR Performance Alerts */}
      <Section title="Record Review Performance" count={rrAlerts.length} sKey="rr">
        {rrAlerts.length === 0
          ? <p className="text-xs text-center py-2" style={{ color:'var(--text-muted)' }}>
              {isSingleDay ? '✓ No performance alerts today' : 'Select a single day to see performance alerts'}
            </p>
          : rrAlerts.map((a,i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border"
              style={{ borderColor:'rgba(232,160,32,.3)', background:'rgba(232,160,32,.05)' }}>
              <AlertTriangle size={14} color="#e8a020" className="mt-0.5 flex-shrink-0"/>
              <div>
                <span className="text-xs font-semibold" style={{ color: ACOLORS[a.agent]||'var(--accent)' }}>
                  {AGENT_SHORT[a.agent]||a.agent}
                </span>
                <span className="text-xs ml-2" style={{ color:'var(--text-secondary)' }}>{a.msg}</span>
              </div>
            </div>
          ))
        }
      </Section>

      {/* Attendance Alerts */}
      <Section title="Attendance (Last 30 Days)" count={attAlerts.length} sKey="att">
        {attAlerts.length === 0
          ? <p className="text-xs text-center py-2" style={{ color:'var(--text-muted)' }}>✓ No attendance issues in last 30 days</p>
          : attAlerts.map((a,i) => {
            const col = WARN_COLORS[a.warnLevel];
            const existing = disciplinary.find(d => d.agent===a.agent && d.infraction_type===a.type && !d.acknowledged_at);
            const nextLevel = existing ? getNextWarnLevel(existing.warning_level) : a.warnLevel;
            const needsNew = !existing || nextLevel !== existing.warning_level;
            return (
              <div key={i} className="p-3 rounded-lg border" style={{ borderColor: col+'44', background: col+'0d' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color:'var(--text-primary)' }}>{a.agent}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: col+'22', color: col }}>
                      {WARN_LABELS[a.warnLevel]}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color:'var(--text-muted)' }}>
                    {a.count} {a.type}{a.count>1?'s':''} in 30 days
                  </span>
                </div>
                {needsNew && (
                  <button onClick={() => issueWarning(a.agent, a.type, nextLevel)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: col, color:'#fff' }}>
                    Issue {WARN_LABELS[nextLevel]}
                  </button>
                )}
                {existing && !needsNew && (
                  <span className="text-xs" style={{ color:'var(--text-muted)' }}>
                    {WARN_LABELS[existing.warning_level]} issued {existing.issued_at} — pending acknowledgment
                  </span>
                )}
              </div>
            );
          })
        }
      </Section>

      {/* Disciplinary Actions — pending acknowledge */}
      <Section title="Disciplinary Actions — Pending" count={activeDisc.length} sKey="disc">
        {activeDisc.length === 0
          ? <p className="text-xs text-center py-2" style={{ color:'var(--text-muted)' }}>✓ No pending disciplinary actions</p>
          : activeDisc.map(d => {
            const col = WARN_COLORS[d.warning_level];
            return (
              <div key={d.id} className="p-3 rounded-lg border" style={{ borderColor: col+'44', background: col+'0d' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold" style={{ color:'var(--text-primary)' }}>{d.agent}</span>
                    <span className="text-xs ml-2 px-2 py-0.5 rounded-full font-semibold" style={{ background: col+'22', color: col }}>
                      {WARN_LABELS[d.warning_level]}
                    </span>
                    <span className="text-xs ml-2" style={{ color:'var(--text-muted)' }}>
                      {d.infraction_type} · {d.issued_at}
                    </span>
                  </div>
                  <button onClick={() => acknowledge(d.id)} disabled={acknowledging===d.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                    style={{ background:'rgba(52,201,138,.15)', color:'#34c98a', border:'1px solid rgba(52,201,138,.3)' }}>
                    <CheckCircle size={12}/>
                    {acknowledging===d.id ? 'Saving...' : 'Acknowledge'}
                  </button>
                </div>
                {d.notes && <p className="text-xs mt-2" style={{ color:'var(--text-muted)' }}>{d.notes}</p>}
              </div>
            );
          })
        }
      </Section>
    </div>
  );
}
