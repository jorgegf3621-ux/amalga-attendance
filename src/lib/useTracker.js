import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const DAILY_TARGET = 70;
const AVOIDABLE_CATEGORIES = [
  'Not enough notes','Time zone','Large file','No Claim',
  'Error REC A Was not found','Records able to fulfill','Wrong REC','CNR Filled','Damaged file'
];

export { AVOIDABLE_CATEGORIES };

export function useTracker(agentName) {
  const [todayCases, setTodayCases]   = useState([]);
  const [activeCase, setActiveCase]   = useState(null);
  const [activity, setActivity]       = useState(null); // {id, type, startTime, startMs}
  const [elapsed, setElapsed]         = useState(0);
  const [actElapsed, setActElapsed]   = useState(0);
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const timerRef    = useRef(null);
  const actTimerRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { loadTodayCases(); }, [agentName]);

  // Case timer
  useEffect(() => {
    if (activeCase) {
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - activeCase.startMs) / 1000)), 1000);
    } else { clearInterval(timerRef.current); setElapsed(0); }
    return () => clearInterval(timerRef.current);
  }, [activeCase]);

  // Activity timer
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

  function startCase(caseNumber) {
    const now = new Date();
    setActiveCase({ caseNumber, startTime: now.toTimeString().slice(0,8), startMs: now.getTime() });
  }

  async function closeCase({ escalation, avoidable, avoidableCategory, isDuplicate, duplicateTimes }) {
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
    };
    const records = [base];
    if (isDuplicate && duplicateTimes > 0) {
      for (let i = 0; i < duplicateTimes; i++) {
        records.push({ ...base, case_number: activeCase.caseNumber+'_DUP', case_weight: 2, avoidable: null, avoidable_category: null });
      }
    }
    const { error } = await supabase.from('rr_cases').insert(records);
    if (!error) { setActiveCase(null); await loadTodayCases(); }
    setSaving(false);
    return !error;
  }

  async function startActivity(type) {
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

  return {
    todayCases, activeCase, activity, loading, saving,
    elapsed, actElapsed, totalCases, progress,
    startCase, closeCase, cancelCase, startActivity, endActivity, loadTodayCases,
  };
}
