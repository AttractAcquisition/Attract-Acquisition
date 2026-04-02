import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';
import { Users, Shield, Link } from 'lucide-react';

export default function AdminControl() {
  const [clientRecords, setClientRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast() as any;

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('clients')
        .select('id, business_name, owner_name, account_manager, account_manager_name')
        .order('business_name', { ascending: true });

      if (error) throw error;
      setClientRecords(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err.message);
      toast.addToast?.('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateRole = async (userId: string, newRole: string, metadataId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke('update-user-role', {
      body: { userId, role: newRole, metadata_id: metadataId ?? null },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });

    if (error) {
      toast.addToast?.('Error updating role', 'error');
    } else {
      toast.addToast?.('Role updated in auth metadata ✓', 'success');
    }
  };

  // Uses clients.id (UUID) as the identifier — not email
  const updateMapping = async (clientId: string, managerId: string) => {
    const { error } = await (supabase as any)
      .from('clients')
      .update({ account_manager: managerId || null })
      .eq('id', clientId);

    if (error) {
      console.error('Mapping Error:', error.message);
      toast.addToast?.('Mapping failed: ' + error.message, 'error');
    } else {
      toast.addToast?.('Client assigned successfully', 'success');
      setClientRecords(prev => prev.map(c =>
        c.id === clientId ? { ...c, account_manager: managerId } : c
      ));
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-bg1">
      <div className="text-teal-500 font-mono animate-pulse uppercase tracking-widest">
        Initializing Command Center...
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <Shield className="text-teal-400" size={32} /> AA OS
          </h1>
          <p className="text-zinc-500 text-sm font-mono uppercase tracking-tighter">Infrastructure Management</p>
        </div>
      </header>

      {/* Section 1: User Permissions — managed via JWT user_metadata */}
      <section className="bg-zinc-900/40 p-8 rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
          <Users size={20} className="text-teal-400" /> System Permissions
        </h2>
        <div className="p-4 rounded-lg border border-white/10 bg-zinc-950/50 text-zinc-500 font-mono text-xs leading-relaxed">
          <p className="text-zinc-400 mb-2">Role management now operates via JWT <code className="text-teal-400">user_metadata</code>.</p>
          <p>To update a user's role, invoke the <code className="text-teal-400">update-user-role</code> Edge Function with the target user's Auth UUID, new role, and their <code className="text-teal-400">metadata_id</code>. Role changes take effect on next session refresh.</p>
          <p className="mt-2 text-zinc-600">A staff management UI will be available once the <code>staff</code> table is provisioned.</p>
        </div>
      </section>

      {/* Section 2: Account Mapping — uses clients table as source of truth */}
      <section className="bg-zinc-900/40 p-8 rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
          <Link size={20} className="text-teal-400" /> Infrastructure Mapping
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-zinc-600 border-b border-white/5 text-[11px] uppercase tracking-[0.2em]">
                <th className="pb-4 font-semibold">Client Brand</th>
                <th className="pb-4 font-semibold">Current Lead (UUID)</th>
                <th className="pb-4 text-right font-semibold">Assign Manager UUID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clientRecords.map(client => (
                <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5">
                    <div className="text-teal-400 font-medium">{client.business_name || '—'}</div>
                    <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{client.owner_name || 'FUNNEL ACTIVE'}</div>
                  </td>
                  <td className="py-5">
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {client.account_manager_name
                        ? <span className="text-zinc-300">{client.account_manager_name}</span>
                        : <span className="text-zinc-600">Unassigned</span>
                      }
                    </div>
                    {client.account_manager && (
                      <div className="text-[9px] text-zinc-700 font-mono mt-0.5 truncate max-w-[180px]">{client.account_manager}</div>
                    )}
                  </td>
                  <td className="py-5 text-right">
                    <input
                      type="text"
                      placeholder="Paste manager UUID..."
                      defaultValue={client.account_manager || ''}
                      onBlur={(e) => {
                        const val = e.target.value.trim()
                        if (val !== (client.account_manager || '')) {
                          updateMapping(client.id, val)
                        }
                      }}
                      className="w-full max-w-xs bg-zinc-950 border border-white/10 text-xs text-zinc-400 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-500 font-mono placeholder-zinc-700"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
