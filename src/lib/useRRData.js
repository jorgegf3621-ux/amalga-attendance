import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';

const RR_AGENTS = ['Stephania Collazo', 'Alexis Garcia', 'Katya Elisa Carballo'];
const DAILY_TARGET = 65;
const OUTLIER_MAX_SEC = 50 * 60; // 50 min

export function useRRData() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Operations filters
  const [opsDate, setOpsDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Analytics filters
  const [analyticsRange, setAnalyticsRange] = useState({ start: '', end: '' });
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false);

  // Load ops data (single day) — auto on date change
  useEffect(() => {
    if (!opsDate) return;
    loadOpsData(opsDate);
  }, [opsDate]);

  async function loadOpsData(date) {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('rr_cases')
        .select('*')
        .eq('date', date)
        .order('start_time', { ascending: true });
      if (err) throw err;
      setRawData(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalyticsData(start, end) {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('rr_cases')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });
      if (err) throw err;
      setRawData(data || []);
      setAnalyticsLoaded(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Ops computed data
  const opsData = useMemo(() => {
    if (!rawData.length) return null;

    const byAgent = {};
    RR_AGENTS.forEach(a => {
      byAgent[a] = { cases: [], regSec: 0, regCount: 0, escSec: 0, escCount: 0, avoidCount: 0 };
    });

    rawData.forEach(r => {
      const ag = byAgent[r.agent];
      if (!ag) return;
      ag.cases.push(r);
      const sec = r.duration_sec || 0;
      if (sec > OUTLIER_MAX_SEC) return; // exclude outliers from AHT
      if (r.case_type === 'Escalation') {
        ag.escSec += sec; ag.escCount++;
        if (r.avoidable === 'Yes') ag.avoidCount++;
      } else {
        ag.regSec += sec; ag.regCount++;
      }
    });

    const agents = RR_AGENTS.map(name => {
      const ag = byAgent[name];
      const total = ag.cases.length;
      const regAHT = ag.regCount ? Math.round(ag.regSec / ag.regCount / 60 * 10) / 10 : null;
      const escAHT = ag.escCount ? Math.round(ag.escSec / ag.escCount / 60 * 10) / 10 : null;
      const progress = Math.min(Math.round(total / DAILY_TARGET * 100), 100);
      return { name, total, regAHT, escAHT, regCount: ag.regCount, escCount: ag.escCount, avoidCount: ag.avoidCount, progress, cases: ag.cases };
    });

    const teamTotal = agents.reduce((s, a) => s + a.total, 0);
    const teamEsc = agents.reduce((s, a) => s + a.escCount, 0);
    const teamReg = agents.reduce((s, a) => s + a.regCount, 0);
    const teamAvoid = agents.reduce((s, a) => s + a.avoidCount, 0);
    const escRate = teamTotal ? Math.round(teamEsc / teamTotal * 100) : 0;
    const avoidRate = teamEsc ? Math.round(teamAvoid / teamEsc * 100) : 0;

    // Gaps per agent
    const gaps = {};
    RR_AGENTS.forEach(name => {
      const ag = byAgent[name];
      const sorted = ag.cases
        .filter(c => c.start_time && c.end_time)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      const agentGaps = [];
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1].end_time;
        const curr = sorted[i].start_time;
        if (!prev || !curr) continue;
        const [ph, pm, ps] = prev.split(':').map(Number);
        const [ch, cm, cs] = curr.split(':').map(Number);
        const prevSec = ph * 3600 + pm * 60 + (ps || 0);
        const currSec = ch * 3600 + cm * 60 + (cs || 0);
        const gapMin = Math.round((currSec - prevSec) / 60);
        if (gapMin >= 10) agentGaps.push({ from: prev.slice(0, 5), to: curr.slice(0, 5), gapMin });
      }
      gaps[name] = { gaps: agentGaps, count: agentGaps.length, alert: agentGaps.length >= 3 };
    });

    // Categories
    const catMap = {};
    rawData.forEach(r => {
      if (r.avoidable_category) {
        catMap[r.avoidable_category] = (catMap[r.avoidable_category] || 0) + 1;
      }
    });
    const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

    return { agents, teamTotal, teamEsc, teamReg, escRate, avoidRate, teamAvoid, gaps, categories };
  }, [rawData]);

  // Analytics computed data
  const analyticsData = useMemo(() => {
    if (!rawData.length || !analyticsLoaded) return null;

    const dates = [...new Set(rawData.map(r => r.date))].sort();
    const totalCases = rawData.length;
    const escCases = rawData.filter(r => r.case_type === 'Escalation').length;
    const regCases = totalCases - escCases;
    const avoidCases = rawData.filter(r => r.avoidable === 'Yes').length;
    const workDays = dates.length;

    // AHT (excluding outliers)
    const regRows = rawData.filter(r => r.case_type === 'Regular' && r.duration_sec > 0 && r.duration_sec <= OUTLIER_MAX_SEC);
    const escRows = rawData.filter(r => r.case_type === 'Escalation' && r.duration_sec > 0 && r.duration_sec <= OUTLIER_MAX_SEC);
    const avgRegAHT = regRows.length ? Math.round(regRows.reduce((s, r) => s + r.duration_sec, 0) / regRows.length / 60 * 10) / 10 : 0;
    const avgEscAHT = escRows.length ? Math.round(escRows.reduce((s, r) => s + r.duration_sec, 0) / escRows.length / 60 * 10) / 10 : 0;
    const avgPerDay = workDays ? Math.round(totalCases / workDays * 10) / 10 : 0;
    const escRate = totalCases ? Math.round(escCases / totalCases * 100) : 0;
    const avoidRate = escCases ? Math.round(avoidCases / escCases * 100) : 0;

    // Daily series per agent
    const agentDailySeries = RR_AGENTS.map(name => ({
      agent: name,
      values: dates.map(d => rawData.filter(r => r.date === d && r.agent === name).length)
    }));

    // AHT series per agent per day
    const ahtSeries = RR_AGENTS.map(name => ({
      agent: name,
      values: dates.map(d => {
        const rows = rawData.filter(r => r.date === d && r.agent === name && r.case_type === 'Regular' && r.duration_sec > 0 && r.duration_sec <= OUTLIER_MAX_SEC);
        return rows.length ? Math.round(rows.reduce((s, r) => s + r.duration_sec, 0) / rows.length / 60 * 10) / 10 : null;
      })
    }));

    // Categories
    const catMap = {};
    rawData.forEach(r => { if (r.avoidable_category) catMap[r.avoidable_category] = (catMap[r.avoidable_category] || 0) + 1; });
    const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

    // Weekly totals
    const weekMap = {};
    rawData.forEach(r => {
      const dt = new Date(r.date + 'T00:00:00');
      const day = dt.getDay(), diff = dt.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(dt.getFullYear(), dt.getMonth(), diff).toISOString().split('T')[0];
      weekMap[mon] = (weekMap[mon] || 0) + 1;
    });
    const weeks = Object.keys(weekMap).sort().map(wk => {
      const mon = new Date(wk + 'T00:00:00');
      const fri = new Date(mon); fri.setDate(fri.getDate() + 4);
      const fmt = d => String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
      return { label: `${fmt(mon)}–${fmt(fri)}`, total: weekMap[wk] };
    });

    return { dates, totalCases, escCases, regCases, avoidCases, workDays, avgRegAHT, avgEscAHT, avgPerDay, escRate, avoidRate, agentDailySeries, ahtSeries, categories, weeks };
  }, [rawData, analyticsLoaded]);

  return {
    opsData, analyticsData,
    loading, error,
    opsDate, setOpsDate,
    analyticsRange, setAnalyticsRange,
    loadAnalyticsData, analyticsLoaded,
  };
}
