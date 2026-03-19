import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const DAILY_TARGET = 70;
const AVOIDABLE_CATEGORIES = [
  'Not enough notes','Time zone','Large file','No Claim',
  'Error REC A Was not found','Records able to fulfill','Wrong REC','CNR Filled','Damaged file'
];
const ACTIVITY_TYPES = [
  { key:'lunch',       label:'Lunch',       icon:'🍽' },
  { key:'break',       label:'Break',       icon:'☕' },
  { key:'case_assist', label:'Case Assist', icon:'🎧' },
  { key:'meeting',     label:'Meeting',     icon:'📋' },
];

export { AVOIDABLE_CATEGORIES, ACTIVITY_TYPES };

export function useTracker(agentName) {
  const [todayCases, setTodayCases]   = useState([]);
  const [viewCases, setViewCases]     = useState([]);  // cases for selected date
  const [viewDate, setViewDate]       = useState(null); // null = today
  const [activeCase, setActiveCase]   = useState(null);
  const [activity, setActivity]       = useState(null);
  const [elapsed, setElapsed]         = useState(0);
  const [actElapsed, setActElapsed]   = useState(0);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const timerRef    = useRef(null);
  const actTimerRef = useRef(null);

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  useEffect(() => { loadTodayCases(); }, [agentName]);

  useEffect(() => {
    if (activeCase) {
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - activeCase.startMs) / 1000)), 1000);
    } else { clearInterval(timerRef.current); setElapsed(0); }
    return () => clearInterval(timerRef.current);
  }, [activeCase]);

  useEffect(() => {
    if (activity) {
      actTimerRef.current = setInterval(() => setActElapsed(Math.floor((Date.now() - activity.startMs) / 1000)), 1000);
    } else { clearInterval(actTimerRef.current); setActElapsed(0); }
    return () => clearInterval(actTimerRef.current);
  }, [activity]);

  async function loadTodayCases() {
    setLoading(true);
    const { data } = await supabase.from('rr_cases').select('*')
      .eq('date', today).eq('agent', agentName).order('start_time');
    setTodayCases(data || []);
    setLoading(false);
  }

  async function loadCasesForDate(date) {
    setLoading(true);
    const { data } = await supabase.from('rr_cases').select('*')
      .eq('date', date).eq('agent', agentName).order('start_time');
    setViewCases(data || []);
    setViewDate(date);
    setLoading(false);
  }

  async function searchCase(caseNumber) {
    setLoading(true);
    const { data } = await supabase.from('rr_cases').select('*')
      .eq('agent', agentName)
      .ilike('case_number', `%${caseNumber}%`)
      .order('date', { ascending: false })
      .limit(20);
    setViewCases(data || []);
    setViewDate('search');
    setLoading(false);
  }

  function startCase(caseNumber) {
    const now = new Date();
    setActiveCase({ caseNumber, startTime: now.toTimeString().slice(0,8), startMs: now.getTime() });
  }

  async function closeCase({ escalation, avoidable, avoidableCategory, isDuplicate, duplicateTimes, comments }) {
    if (!activeCase) return false;
    setSaving(true);
    const now = new Date();
    const endTime = now.toTimeString().slice(0,8);
    const durationSec = Math.floor((now.getTime() - activeCase.startMs) / 1000);
    const base = {
      date: today, agent: agentName,
      case_number: activeCase.caseNumber,
      start_time: activeCase.startTime, end_time: endTime,
      duration_sec: durationSec, duration_min: Math.round(durationSec/60*100)/100,
      case_type: escalation ? 'Escalation' : 'Regular',
      avoidable: escalation ? (avoidable ? 'Yes' : 'No') : null,
      avoidable_category: (escalation && avoidable) ? avoidableCategory : null,
      case_weight: 1,
      comments: comments || null,
    };
    const records = [base];
    if (isDuplicate && duplicateTimes > 0) {
      for (let i = 0; i < duplicateTimes; i++) {
        records.push({ ...base, case_number: activeCase.caseNumber+'_DUP', case_weight: 2, avoidable: null, avoidable_category: null, comments: 'Duplicate' });
      }
    }
    const { error } = await supabase.from('rr_cases').insert(records);
    if (!error) { setActiveCase(null); await loadTodayCases(); }
    setSaving(false);
    return !error;
  }

  async function startActivity(type) {
    // End any existing activity first
    if (activity) await endActivity();
    const now = new Date();
    const startTime = now.toTimeString().slice(0,8);
    const { data, error } = await supabase.from('activity_log')
      .insert({ agent: agentName, date: today, type, start_time: startTime })
      .select().single();
    if (!error && data) setActivity({ id: data.id, type, startTime, startMs: now.getTime() });
  }

  async function endActivity() {
    if (!activity) return;
    const now = new Date();
    const endTime = now.toTimeString().slice(0,8);
    const durationMin = Math.round((now.getTime() - activity.startMs) / 60000 * 100) / 100;
    await supabase.from('activity_log').update({ end_time: endTime, duration_min: durationMin }).eq('id', activity.id);
    setActivity(null);
  }

  function cancelCase() { setActiveCase(null); }

  const totalCases = todayCases.filter(c => !c.case_number.endsWith('_DUP')).length;
  const progress   = Math.min(Math.round(totalCases / DAILY_TARGET * 100), 100);
  const displayCases = viewDate ? viewCases : todayCases;

  return {
    todayCases, viewCases, displayCases, viewDate,
    activeCase, activity, loading, saving,
    elapsed, actElapsed, totalCases, progress,
    startCase, closeCase, cancelCase,
    startActivity, endActivity,
    loadTodayCases, loadCasesForDate, searchCase,
    today,
  };
}
