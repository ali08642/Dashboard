import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Clock, Filter, Mail, Phone, Search, StickyNote, Users } from 'lucide-react';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Button } from '../components/common/Button';
import { businessApi, businessInteractionApi } from '../utils/api';
import type { BusinessInteraction, Business } from '../utils/types';

export const BusinessInteractions: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<BusinessInteraction[]>([]);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<string>('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const [global, setGlobal] = useState<{ total: number; notes: number; calls: number; emails: number }>(
    { total: 0, notes: 0, calls: 0, emails: 0 }
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await businessInteractionApi.getAll({ action, search, from: from || undefined, to: to || undefined });
      setInteractions(data);
    } finally {
      setLoading(false);
    }
  }, [action, search, from, to]);

  const loadGlobal = useCallback(async () => {
    try {
      const businesses = await businessApi.getAll();
      // Compute basic counts: this is not interactions, but we want interaction counts
      const allInteractions = await businessInteractionApi.getAll();
      setGlobal({
        total: allInteractions.length,
        notes: allInteractions.filter(i => i.action === 'note_added').length,
        calls: allInteractions.filter(i => i.action === 'call_made').length,
        emails: allInteractions.filter(i => i.action === 'email_sent').length
      });
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadGlobal();
  }, [loadGlobal]);

  const actionOptions = useMemo(() => ([
    { value: 'all', label: 'All Types' },
    { value: 'note_added', label: 'Notes' },
    { value: 'call_made', label: 'Calls' },
    { value: 'email_sent', label: 'Emails' },
  ]), []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadData(), loadGlobal()]);
    } finally {
      setRefreshing(false);
    }
  };

  const iconFor = (a: string) => {
    if (a === 'note_added') return <StickyNote className="w-4 h-4 text-amber-600" />;
    if (a === 'call_made') return <Phone className="w-4 h-4 text-emerald-600" />;
    if (a === 'email_sent') return <Mail className="w-4 h-4 text-blue-600" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="text-3xl font-bold text-white tracking-tight">Business Interactions</div>
                <div className="text-gray-300 text-sm mt-1">Notes, calls and emails across all businesses</div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleRefresh} loading={refreshing} className="bg-white text-gray-800 hover:bg-gray-50">
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Global Stats */}
          <div className="px-8 py-6 bg-white/70 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/60 shadow bg-white p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase">Total Interactions</div>
                <div className="text-2xl font-bold mt-1">{global.total.toLocaleString()}</div>
              </div>
              <div className="rounded-2xl border border-white/60 shadow bg-white p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase">Notes</div>
                <div className="text-2xl font-bold mt-1">{global.notes.toLocaleString()}</div>
              </div>
              <div className="rounded-2xl border border-white/60 shadow bg-white p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase">Calls</div>
                <div className="text-2xl font-bold mt-1">{global.calls.toLocaleString()}</div>
              </div>
              <div className="rounded-2xl border border-white/60 shadow bg-white p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase">Emails</div>
                <div className="text-2xl font-bold mt-1">{global.emails.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-8 pb-6 bg-white/60 border-t border-white/50">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search notes, outcomes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <Select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                options={actionOptions}
              />
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-800">From</label>
                <input type="date" className="w-full px-3 py-3.5 border border-gray-200 rounded-xl text-sm" value={from}
                  onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-800">To</label>
                <input type="date" className="w-full px-3 py-3.5 border border-gray-200 rounded-xl text-sm" value={to}
                  onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="flex">
                <Button className="w-full">Apply</Button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="px-8 py-6 bg-white/70">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                <div className="text-gray-700 mt-4">Loading interactions...</div>
              </div>
            ) : interactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-500">No interactions found</div>
              </div>
            ) : (
              <div className="space-y-3">
                {interactions.map((it) => (
                  <div key={it.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{iconFor(it.action)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {it.action === 'note_added' ? 'Note Added' : it.action === 'call_made' ? 'Call Logged' : it.action === 'email_sent' ? 'Email Sent' : it.action}
                          </div>
                          <div className="text-[12px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(it.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-[13px] text-gray-600 mt-1 whitespace-pre-wrap">
                          {it.action === 'note_added' && (it.details?.note || '—')}
                          {it.action === 'call_made' && (`Outcome: ${it.details?.outcome || '—'}${it.details?.duration ? ` • ${it.details.duration} sec` : ''}${it.details?.notes ? ` • ${it.details.notes}` : ''}`)}
                          {it.action === 'email_sent' && (`Subject: ${it.details?.subject || '—'} • Outcome: ${it.details?.outcome || '—'}`)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


