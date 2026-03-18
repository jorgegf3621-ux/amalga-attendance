import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';

const RR_AGENTS = ['Stephania Collazo', 'Alexis Garcia', 'Katya Elisa Carballo'];
const DAILY_TARGET = 70;
const OUTLIER_MAX_SEC = 50 * 60;

function todayStr() { return new Date().toISOString().split('T')[0]; }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; }
function nDaysAgoStr(n) { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().split('T')[0]; }
function thisMonthRange() {
  const n = new Date();
  return { start: `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`, end: todayStr() };
}
function lastMonthRange() {
  const n = new Date();
  const first = new Date(n.getFullYear(), n.getMonth()-1, 1);
  const last  = new Date(n.getFullYear(), n.getMonth(), 0);
  return { start: first.toISOString().split('T')[0], end: last.toISOString().split('T')[0] };
}

export const DATE_PRESETS = [
  { key: 'today',      label: 'Today' },
  { key: 'yesterday',  label: 'Yesterday' },
  { key: 'last7',      label: 'Last 7 Days' },
  { key: 'thisMonth',  label: 'This Month' },
  { key: 'lastMonth',  label: 'Last Month' },
  { key: 'custom',     label: 'Custom' },
];

export function presetToRange(key) {
  switch(key) {
    case 'today':     return { start: todayStr(),     end: todayStr() };
    case 'yesterday': return { start: yesterdayStr(), end: yesterdayStr() };
    case 'last7':     return { start: nDaysAgoStr(6), end: todayStr() };
    case 'thisMonth': return thisMonthRange();
    case 'lastMonth': return lastMonthRange();
    default:          return { start: todayStr(),     end: todayStr() };
  }
}

export function useRRData() {
  const [rawData, setRawData]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [preset, setPreset]         = useState('today');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const range = useMemo(() => {
    if (preset === 'custom' && customRange.start && customRange.end) return customRange;
    return presetToRange(preset);
  }, [preset, customRange]);

  const isSingleDay = range.start === range.end;

  useEffect(() => {
    if (!range.start || !range.end) return;
    loadData(range.start, range.end);
  }, [range]);

  async function loadData(start, end) {
    try {
      setLoading(true); setError(null);
      const { data, error: err } = await supabase
        .from('rr_cases').select('*')
        .gte('date', start).lte('date', end)
        .order('date').order('start_time');
      if (err) throw err;
      setRawData(data || []);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const opsData = useMemo(() => {
    if (!rawData.length) return null;
    const dates = [...new Set(rawData.map(r => r.date))].sort();
    const workDays = dates.length;

    const byAgent = {};
    RR_AGENTS.forEach(a => { byAgent[a] = { cases: [], regSec:0, regCount:0, escSec:0, escCount:0, avoidCount:0, gapsByDay:{} }; });

    rawData.forEach(r => {
      const ag = byAgent[r.agent]; if (!ag) return;
      ag.cases.push(r);
      const sec = r.duration_sec || 0;
      if (sec <= OUTLIER_MAX_SEC) {
        if (r.case_type === 'Escalation') { ag.escSec += sec; ag.escCount++; if (r.avoidable==='Yes') ag.avoidCount++; }
        else { ag.regSec += sec; ag.regCount++; }
      }
    });

    // Gaps — per day per agent
    RR_AGENTS.forEach(name => {
      const ag = byAgent[name];
      dates.forEach(date => {
        const dayCases = ag.cases.filter(c => c.date === date && c.start_time && c.end_time)
          .sort((a,b) => a.start_time.localeCompare(b.start_time));
        const allGaps = [];
        for (let i = 1; i < dayCases.length; i++) {
          const [ph,pm,ps] = dayCases[i-1].end_time.split(':').map(Number);
          const [ch,cm,cs] = dayCases[i].start_time.split(':').map(Number);
          const gapMin = Math.round(((ch*3600+cm*60+(cs||0)) - (ph*3600+pm*60+(ps||0))) / 60);
          if (gapMin >= 10) allGaps.push({ from: dayCases[i-1].end_time.slice(0,5), to: dayCases[i].start_time.slice(0,5), gapMin });
        }
        // Exclude expected lunch (60-65 min, 1 allowed) and breaks (15-20 min, 2 allowed)
        let lunchExcluded = 0, breakExcluded = 0;
        const realGaps = allGaps.filter(g => {
          if (g.gapMin >= 60 && g.gapMin <= 65 && lunchExcluded < 1) { lunchExcluded++; return false; }
          if (g.gapMin >= 15 && g.gapMin <= 20 && breakExcluded < 2) { breakExcluded++; return false; }
          return true;
        });
        ag.gapsByDay[date] = realGaps;
      });
    });

    const agents = RR_AGENTS.map(name => {
      const ag = byAgent[name];
      const total = ag.cases.length;
      const regAHT = ag.regCount ? Math.round(ag.regSec/ag.regCount/60*10)/10 : null;
      const escAHT = ag.escCount ? Math.round(ag.escSec/ag.escCount/60*10)/10 : null;
      const progress = Math.min(Math.round(total/(DAILY_TARGET*workDays)*100),100);

      // Gaps summary (after exclusions)
      const allDayGaps = Object.values(ag.gapsByDay);
      const totalGapCount = allDayGaps.reduce((s,g)=>s+g.length,0);
      const avgGapsPerDay = workDays ? Math.round(totalGapCount/workDays*10)/10 : 0;
      const todayGaps = isSingleDay ? (ag.gapsByDay[range.start]||[]) : [];
      const gapAlert = isSingleDay ? todayGaps.length >= 1 : avgGapsPerDay >= 1;

      return { name, total, regAHT, escAHT, regCount:ag.regCount, escCount:ag.escCount, avoidCount:ag.avoidCount, progress,
        gaps: isSingleDay ? todayGaps : null, avgGapsPerDay, gapAlert, gapCount: isSingleDay ? todayGaps.length : avgGapsPerDay };
    });

    const teamTotal = agents.reduce((s,a)=>s+a.total,0);
    const teamAvg   = Math.round(teamTotal/workDays/3*10)/10;
    const teamEsc   = agents.reduce((s,a)=>s+a.escCount,0);
    const teamReg   = agents.reduce((s,a)=>s+a.regCount,0);
    const teamAvoid = agents.reduce((s,a)=>s+a.avoidCount,0);
    const escRate   = teamTotal ? Math.round(teamEsc/teamTotal*100) : 0;
    const avoidRate = teamEsc  ? Math.round(teamAvoid/teamEsc*100)  : 0;

    // Team reg/esc AHT avg
    const teamRegAHT = agents.filter(a=>a.regAHT).length ? Math.round(agents.filter(a=>a.regAHT).reduce((s,a)=>s+(a.regAHT||0),0)/agents.filter(a=>a.regAHT).length*10)/10 : null;
    const teamEscAHT = agents.filter(a=>a.escAHT).length ? Math.round(agents.filter(a=>a.escAHT).reduce((s,a)=>s+(a.escAHT||0),0)/agents.filter(a=>a.escAHT).length*10)/10 : null;

    // Categories
    const catMap = {};
    rawData.forEach(r => { if(r.avoidable_category) catMap[r.avoidable_category]=(catMap[r.avoidable_category]||0)+1; });
    const categories = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).map(([label,value])=>({label,value}));

    // Weekly — for range view
    const weekMap = {};
    rawData.forEach(r => {
      const dt = new Date(r.date+'T00:00:00'), day=dt.getDay(), diff=dt.getDate()-day+(day===0?-6:1);
      const mon = new Date(dt.getFullYear(),dt.getMonth(),diff).toISOString().split('T')[0];
      weekMap[mon] = (weekMap[mon]||0)+1;
    });
    const weeks = Object.keys(weekMap).sort().map(wk=>{
      const mon=new Date(wk+'T00:00:00'), fri=new Date(mon); fri.setDate(fri.getDate()+4);
      const fmt=d=>String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getDate()).padStart(2,'0');
      return { label:`${fmt(mon)}–${fmt(fri)}`, total:weekMap[wk], avg:Math.round(weekMap[wk]/3*10)/10 };
    });

    return { agents, teamTotal, teamAvg, teamEsc, teamReg, escRate, avoidRate, teamRegAHT, teamEscAHT, categories, weeks, workDays, isSingleDay };
  }, [rawData, isSingleDay, range.start]);

  return { opsData, loading, error, preset, setPreset, customRange, setCustomRange, range, isSingleDay, rawData };
}

// Fetch today's activity status for all agents (for dashboard)
export async function fetchAgentStatuses(date) {
  const { data } = await supabase
    .from('activity_log')
    .select('*')
    .eq('date', date)
    .is('end_time', null) // still active
    .order('created_at', { ascending: false });
  
  // Latest open activity per agent
  const statusMap = {};
  (data || []).forEach(row => {
    if (!statusMap[row.agent]) statusMap[row.agent] = row;
  });
  return statusMap;
}

// Compute block stats for a single agent on a single day
export function computeBlocks(cases) {
  const BLOCKS = [
    { key:'b1', label:'Block 1', start:'09:00:00', end:'13:00:00', target:34, regAHT:5.0, escAHT:12.0 },
    { key:'b2', label:'Block 2', start:'14:00:00', end:'17:00:00', target:25, regAHT:5.0, escAHT:12.0 },
    { key:'b3', label:'Block 3', start:'17:00:00', end:'18:00:00', target:9,  regAHT:5.0, escAHT:12.0 },
  ];
  return BLOCKS.map(b => {
    const blockCases = cases.filter(c => c.start_time && c.start_time >= b.start && c.start_time < b.end);
    const reg = blockCases.filter(c => c.case_type==='Regular' && c.duration_sec>0 && c.duration_sec<=3000);
    const esc = blockCases.filter(c => c.case_type==='Escalation' && c.duration_sec>0 && c.duration_sec<=3000);
    const regAHT = reg.length ? Math.round(reg.reduce((s,c)=>s+c.duration_sec,0)/reg.length/60*10)/10 : null;
    const escAHT = esc.length ? Math.round(esc.reduce((s,c)=>s+c.duration_sec,0)/esc.length/60*10)/10 : null;
    const total = blockCases.length;
    const pct = Math.min(Math.round(total/b.target*100),100);
    return { ...b, total, regCount:reg.length, escCount:esc.length, regAHT, escAHT, pct };
  });
}
