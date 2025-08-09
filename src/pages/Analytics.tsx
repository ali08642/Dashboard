import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, CheckCircle2, Download, Phone, Users } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { Input } from '../components/common/Input';
import { areaApi, businessApi, businessInteractionApi, scrapeJobApi } from '../utils/api';
import type { Business, BusinessInteraction, ScrapeJob } from '../utils/types';

type DatePreset = '7d' | '30d' | '90d' | 'custom';

const getPresetRange = (preset: DatePreset): { from: string; to: string } => {
  const to = new Date();
  const from = new Date();
  if (preset === '7d') from.setDate(to.getDate() - 7);
  if (preset === '30d') from.setDate(to.getDate() - 30);
  if (preset === '90d') from.setDate(to.getDate() - 90);
  return { from: from.toISOString(), to: to.toISOString() };
};

export const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const isCustom = datePreset === 'custom';

  // Global business stats
  const [businessStats, setBusinessStats] = useState<{
    total: number;
    by_status: Record<string, number>;
    by_contact_status: Record<string, number>;
    recent_count: number;
  }>({ total: 0, by_status: {}, by_contact_status: {}, recent_count: 0 });

  // Interactions summary (period-bound)
  const [interactionSummary, setInteractionSummary] = useState<{
    total: number;
    notes: number;
    calls: number;
    emails: number;
  }>({ total: 0, notes: 0, calls: 0, emails: 0 });

  // Jobs summary (global)
  const [jobSummary, setJobSummary] = useState<{
    total: number;
    running: number;
    pending: number;
    completed: number;
    failed: number;
    avgProcessingSeconds: number;
    totalBusinessesFound: number;
  }>({ total: 0, running: 0, pending: 0, completed: 0, failed: 0, avgProcessingSeconds: 0, totalBusinessesFound: 0 });

  // Top breakdowns (period-bound for creation vs global for now)
  const [topCategories, setTopCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [topLocations, setTopLocations] = useState<Array<{ location: string; count: number }>>([]);

  const computeBusinessStats = (businesses: Business[]) => {
    const by_status: Record<string, number> = {};
    const by_contact_status: Record<string, number> = {};
    for (const b of businesses) {
      by_status[b.status] = (by_status[b.status] || 0) + 1;
      by_contact_status[b.contact_status] = (by_contact_status[b.contact_status] || 0) + 1;
    }
    const recentThreshold = new Date();
    recentThreshold.setDate(recentThreshold.getDate() - 7);
    const recent_count = businesses.filter(b => new Date(b.created_at) > recentThreshold).length;
    return { total: businesses.length, by_status, by_contact_status, recent_count };
  };

  const computeTopCategories = (businesses: Business[]) => {
    const map: Record<string, number> = {};
    for (const b of businesses) {
      if (!b.category) continue;
      map[b.category] = (map[b.category] || 0) + 1;
    }
    return Object.entries(map)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const computeTopLocations = (businesses: Business[]) => {
    const map: Record<string, number> = {};
    for (const b of businesses) {
      const loc = `${b.areas?.cities?.name || ''}${b.areas?.name ? ` • ${b.areas?.name}` : ''}`.trim();
      if (!loc) continue;
      map[loc] = (map[loc] || 0) + 1;
    }
    return Object.entries(map)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // Business global stats
      try {
        const server = await businessApi.getStats();
        setBusinessStats(server);
      } catch (e) {
        const all = await businessApi.getAll();
        setBusinessStats(computeBusinessStats(all));
      }

      // Interactions for selected period
      const period = datePreset === 'custom'
        ? { from: from || undefined, to: to || undefined }
        : getPresetRange(datePreset);
      const inter = await businessInteractionApi.getAll({ from: period.from, to: period.to });
      setInteractionSummary({
        total: inter.length,
        notes: inter.filter(i => i.action === 'note_added').length,
        calls: inter.filter(i => i.action === 'call_made').length,
        emails: inter.filter(i => i.action === 'email_sent').length,
      });

      // Jobs global summary
      const jobs = await scrapeJobApi.getAll();
      const sum = jobs.reduce((acc, j) => {
        acc.total += 1;
        // @ts-ignore
        acc[j.status] = (acc[j.status] || 0) + 1;
        if (j.processing_time_seconds) acc.processingSum += j.processing_time_seconds;
        if (j.businesses_found) acc.totalBusinessesFound += j.businesses_found;
        return acc;
      }, { total: 0, pending: 0, running: 0, completed: 0, failed: 0, processingSum: 0, totalBusinessesFound: 0 } as any);
      setJobSummary({
        total: sum.total,
        pending: sum.pending || 0,
        running: sum.running || 0,
        completed: sum.completed || 0,
        failed: sum.failed || 0,
        avgProcessingSeconds: sum.total ? Math.round((sum.processingSum || 0) / sum.total) : 0,
        totalBusinessesFound: sum.totalBusinessesFound || 0,
      });

      // Top categories/locations - use all businesses (global)
      const allBusinesses = await businessApi.getAll();
      setTopCategories(computeTopCategories(allBusinesses));
      setTopLocations(computeTopLocations(allBusinesses));
    } finally {
      setLoading(false);
    }
  }, [datePreset, from, to]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const presets: Array<{ id: DatePreset; label: string }> = useMemo(() => ([
    { id: '7d', label: '7d' },
    { id: '30d', label: '30d' },
    { id: '90d', label: '90d' },
    { id: 'custom', label: 'Custom' },
  ]), []);

  const percent = (num: number, den: number) => den ? Math.min(100, Math.round((num / den) * 100)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-white/20 rounded-2xl"><BarChart3 className="w-7 h-7 text-white" /></div>
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Analytics & Insights</h1>
                    <p className="text-indigo-100 text-sm font-medium mt-0.5">Performance overview of your pipeline</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-white/10 rounded-full p-1">
                  {presets.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setDatePreset(p.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${datePreset === p.id ? 'bg-white text-indigo-700' : 'text-white/80 hover:text-white'}`}
                      title={p.id === 'custom' ? 'Choose a custom date range' : `Last ${p.label}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {isCustom && (
                  <div className="flex items-center gap-2">
                    <input type="date" className="px-3 py-3.5 border border-indigo-200 rounded-xl text-sm bg-white/90" value={from.slice(0, 10)} onChange={(e) => setFrom(new Date(e.target.value).toISOString())} />
                    <span className="text-indigo-100">to</span>
                    <input type="date" className="px-3 py-3.5 border border-indigo-200 rounded-xl text-sm bg-white/90" value={to.slice(0, 10)} onChange={(e) => setTo(new Date(e.target.value).toISOString())} />
                  </div>
                )}
                <Button variant="secondary" onClick={handleRefresh} loading={refreshing} className="bg-white text-indigo-700 hover:bg-gray-50">Refresh</Button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="px-8 py-6 bg-white/60 backdrop-blur-sm">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="rounded-2xl border border-white/60 shadow bg-white p-5 animate-pulse">
                    <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/60 shadow bg-white p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Total Businesses</div>
                  <Users className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{businessStats.total.toLocaleString()}</div>
              </div>
              <div className="rounded-2xl border border-white/60 shadow bg-white p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Contacted</div>
                  <Phone className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{(businessStats.by_contact_status?.contacted || 0).toLocaleString()}</div>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${percent(businessStats.by_contact_status?.contacted || 0, businessStats.total)}%` }} />
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 shadow bg-white p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Qualified / Closed</div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{((businessStats.by_status?.qualified || 0) + (businessStats.by_status?.closed || 0)).toLocaleString()}</div>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${percent((businessStats.by_status?.qualified || 0) + (businessStats.by_status?.closed || 0), businessStats.total)}%` }} />
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 shadow bg-white p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase">Interactions (period)</div>
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{interactionSummary.total.toLocaleString()}</div>
                <div className="mt-2 text-[12px] text-gray-500">Notes {interactionSummary.notes} • Calls {interactionSummary.calls} • Emails {interactionSummary.emails}</div>
              </div>
            </div>
            )}
          </div>

          {/* Grids */}
          <div className="px-8 pb-8 bg-white/60 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Categories */}
            <div className="col-span-1 rounded-2xl border border-white/60 shadow bg-white p-5 hover:shadow-md transition-shadow">
              <div className="text-[13px] font-semibold text-gray-700 mb-3">Top Categories</div>
              <div className="space-y-3">
                {topCategories.map((c) => (
                  <div key={c.category} className="flex items-center justify-between">
                    <div className="text-sm text-gray-800">{c.category}</div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-100 h-1.5 rounded-full">
                        <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${percent(c.count, businessStats.total)}%` }} />
                      </div>
                      <div className="text-[12px] text-gray-500">{c.count}</div>
                    </div>
                  </div>
                ))}
                {topCategories.length === 0 && <div className="text-sm text-gray-500">No data</div>}
              </div>
            </div>

            {/* Top Locations */}
            <div className="col-span-1 rounded-2xl border border-white/60 shadow bg-white p-5 hover:shadow-md transition-shadow">
              <div className="text-[13px] font-semibold text-gray-700 mb-3">Top Locations</div>
              <div className="space-y-3">
                {topLocations.map((l) => (
                  <div key={l.location} className="flex items-center justify-between">
                    <div className="text-sm text-gray-800">{l.location}</div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-100 h-1.5 rounded-full">
                        <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: `${percent(l.count, businessStats.total)}%` }} />
                      </div>
                      <div className="text-[12px] text-gray-500">{l.count}</div>
                    </div>
                  </div>
                ))}
                {topLocations.length === 0 && <div className="text-sm text-gray-500">No data</div>}
              </div>
            </div>

            {/* Jobs Summary */}
            <div className="col-span-1 rounded-2xl border border-white/60 shadow bg-white p-5 hover:shadow-md transition-shadow">
              <div className="text-[13px] font-semibold text-gray-700 mb-3">Scrape Jobs Summary</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-[11px] text-gray-500">Total</div>
                  <div className="font-semibold text-gray-900">{jobSummary.total}</div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <div className="text-[11px] text-blue-700">Running</div>
                  <div className="font-semibold text-blue-900">{jobSummary.running}</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50">
                  <div className="text-[11px] text-emerald-700">Completed</div>
                  <div className="font-semibold text-emerald-900">{jobSummary.completed}</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50">
                  <div className="text-[11px] text-amber-700">Pending</div>
                  <div className="font-semibold text-amber-900">{jobSummary.pending}</div>
                </div>
                <div className="p-3 rounded-lg bg-rose-50">
                  <div className="text-[11px] text-rose-700">Failed</div>
                  <div className="font-semibold text-rose-900">{jobSummary.failed}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-[11px] text-gray-500">Avg Processing (s)</div>
                  <div className="font-semibold text-gray-900">{jobSummary.avgProcessingSeconds}</div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 col-span-2">
                  <div className="text-[11px] text-gray-500">Businesses Found</div>
                  <div className="font-semibold text-gray-900">{jobSummary.totalBusinessesFound.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


