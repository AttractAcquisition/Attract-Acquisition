import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../lib/toast';
import { Users, Shield, Link } from 'lucide-react';

export default function AdminControl() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast() as any;

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all profiles (the "Who")
      const { data: profileData, error: pError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch all client mappings (the "Where")
      const { data: clientData, error: cError } = await (supabase as any)
        .from('clients')
        .select('email, account_manager');

      if (pError || cError) throw pError || cError;

      if (profileData && clientData) {
        // Merge account_manager into the profile objects so the UI can see them
        const mergedData = profileData.map((p: any) => {
          const mapping = clientData.find((c: any) => c.email === p.email);
          return {
            ...p,
            // If they exist in clients table, get their manager, otherwise null
            account_manager: mapping ? mapping.account_manager : null
          };
        });
        setProfiles(mergedData);
      }
    } catch (err: any) {
      console.error("Fetch error:", err.message);
      toast.addToast?.('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateRole = async (userId: string, newRole: string) => {
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      toast.addToast?.('Error updating role', 'error');
    } else {
      toast.addToast?.('Role updated successfully', 'success');
      fetchData();
    }
  };

  const updateMapping = async (clientEmail: string, operatorId: string) => {
    // We use the email to find the row in the 'clients' table
    const { error } = await (supabase as any)
      .from('clients')
      .update({ account_manager: operatorId || null })
      .eq('email', clientEmail);

    if (error) {
      console.error("Mapping Error:", error.message);
      toast.addToast?.('Mapping failed: ' + error.message, 'error');
    } else {
      toast.addToast?.('Client assigned successfully', 'success');
      
      // Optimistic local update so the UI doesn't flicker
      setProfiles(prev => prev.map(p => 
        p.email === clientEmail ? { ...p, account_manager: operatorId } : p
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

  const operators = profiles.filter(p => p.role === 'operator' || p.role === 'admin');
  const clients = profiles.filter(p => p.role === 'client');

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

      {/* Section 1: User Permissions */}
      <section className="bg-zinc-900/40 p-8 rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
          <Users size={20} className="text-teal-400" /> System Permissions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-zinc-600 border-b border-white/5 text-[11px] uppercase tracking-[0.2em]">
                <th className="pb-4 font-semibold">User Identity</th>
                <th className="pb-4 font-semibold text-center">Current Role</th>
                <th className="pb-4 text-right font-semibold">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {profiles.map(user => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-5">
                    <div className="text-zinc-300 font-medium">{user.email}</div>
                    <div className="text-[10px] text-zinc-600 font-mono mt-0.5">{user.id}</div>
                  </td>
                  <td className="py-5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                      user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                      user.role === 'operator' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                      'bg-teal-500/10 text-teal-400 border-teal-500/20'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-5 text-right">
                    <select 
                      onChange={(e) => updateRole(user.id, e.target.value)}
                      className="bg-zinc-950 border border-white/10 text-xs text-zinc-400 rounded-lg px-3 py-1.5 focus:outline-none focus:border-teal-500 hover:text-white transition-all cursor-pointer"
                      defaultValue={user.role}
                    >
                      <option value="admin">Admin Access</option>
                      <option value="operator">Growth Operator</option>
                      <option value="client">Client Portal</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Account Mapping */}
      <section className="bg-zinc-900/40 p-8 rounded-2xl border border-white/5 backdrop-blur-md shadow-2xl">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
          <Link size={20} className="text-teal-400" /> Acquisition Infrastructure Mapping
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-zinc-600 border-b border-white/5 text-[11px] uppercase tracking-[0.2em]">
                <th className="pb-4 font-semibold">Client Brand</th>
                <th className="pb-4 font-semibold text-right">Assigned Strategic Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5">
                    <div className="text-teal-400 font-medium">{client.email}</div>
                    <div className="text-[10px] text-zinc-600 font-mono mt-0.5">ACQUISITION FUNNEL ACTIVE</div>
                  </td>
                  <td className="py-5 text-right">
                    <select 
                      onChange={(e) => updateMapping(client.email, e.target.value)}
                      className="w-full max-w-sm bg-zinc-950 border border-white/10 text-xs text-zinc-400 rounded-lg px-4 py-2 focus:outline-none focus:border-teal-500 hover:text-white transition-all cursor-pointer"
                      defaultValue={client.account_manager || ""}
                    >
                      <option value="">-- No Strategic Lead Assigned --</option>
                      {operators.map(op => (
                        <option key={op.id} value={op.id}>
                          {op.email} ({op.role.toUpperCase()})
                        </option>
                      ))}
                    </select>
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