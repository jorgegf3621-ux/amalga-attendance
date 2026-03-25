import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';

/**
 * Get current month as yyyy-MM string
 */
function getCurrentMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Hook principal — jala data de Supabase y aplica filtros.
 */
export function useData(allowedDepartments, attendanceTable = 'daily_attendance') {
  const [rawData, setRawData] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros — default al mes corriente
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        let attQuery = supabase
          .from(attendanceTable)
          .select('*')
          .order('date', { ascending: true });

        if (allowedDepartments) {
          attQuery = attQuery.in('department', allowedDepartments);
        }

        const { data: attData, error: attErr } = await attQuery;
        if (attErr) throw attErr;

        let agentQuery = supabase
          .from('agents')
          .select('*')
          .eq('active', true)
          .order('agent');

        if (allowedDepartments) {
          agentQuery = agentQuery.in('department', allowedDepartments);
        }

        const { data: agentData, error: agentErr } = await agentQuery;
        if (agentErr) throw agentErr;

        setRawData(attData || []);
        setAgents(agentData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [allowedDepartments, attendanceTable]);

  // Meses disponibles
  const availableMonths = useMemo(() => {
    const months = new Set();
    rawData.forEach(r => {
      if (r.date) months.add(r.date.substring(0, 7));
    });
    return Array.from(months).sort();
  }, [rawData]);

  // Departamentos disponibles
  const availableDepts = useMemo(() => {
    const depts = new Set();
    rawData.forEach(r => {
      if (r.department) depts.add(r.department);
    });
    return Array.from(depts).sort();
  }, [rawData]);

  // Data filtrada
  const filteredData = useMemo(() => {
    let data = rawData;

    // Filtrar por mes
    if (selectedMonth !== 'all') {
      data = data.filter(r => r.date && r.date.startsWith(selectedMonth));
    }

    // Filtrar por rango de fechas (overrides month if both set)
    if (dateRange.start && dateRange.end) {
      data = rawData.filter(r => r.date >= dateRange.start && r.date <= dateRange.end);
    }

    // Filtrar por departamento
    if (selectedDept !== 'all') {
      data = data.filter(r => r.department === selectedDept);
    }

    return data;
  }, [rawData, selectedMonth, dateRange, selectedDept]);

  return {
    rawData,
    filteredData,
    agents,
    loading,
    error,
    selectedMonth, setSelectedMonth,
    dateRange, setDateRange,
    selectedDept, setSelectedDept,
    selectedAgent, setSelectedAgent,
    availableMonths,
    availableDepts,
  };
}
