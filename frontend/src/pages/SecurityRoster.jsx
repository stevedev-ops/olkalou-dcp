import { useState, useEffect } from "react";
import { Users, Search, Edit2, ShieldCheck, MapPin, X, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";

export default function SecurityRoster() {
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { wardsWithCenters } = useLocationData();
  const [editModal, setEditModal] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await api.getSecurityPersonnel();
    if (data) {
      setPersonnel(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = personnel.filter(p => 
    (p.full_name?.toLowerCase() || "").includes(search.toLowerCase()) || 
    (p.phone || "").includes(search) ||
    (p.ward?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (p.polling_station?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col min-h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Security Roster</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">Manage personnel assignments & contact details</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, phone..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-dcp-green/50 text-sm font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 flex-1 overflow-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading roster...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">No security personnel found.</p>
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase">{p.full_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                      {p.security_rank?.replace('_', ' ') || 'None'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">{p.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5"><MapPin size={10} className="inline mr-1" />Assignment</p>
                  <p className="text-xs font-bold text-slate-700">{p.ward || 'No Ward'} <span className="text-slate-300 mx-1">|</span> {p.polling_station || 'No Station'}</p>
                </div>
                <button onClick={() => setEditModal(p)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0">
                  <Edit2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <AssignmentModal 
          person={editModal} 
          onClose={() => setEditModal(null)} 
          onSuccess={() => { setEditModal(null); loadData(); }}
          wardsWithCenters={wardsWithCenters}
        />
      )}
    </div>
  );
}

function AssignmentModal({ person, onClose, onSuccess, wardsWithCenters }) {
  const [form, setForm] = useState({
    ward: person.ward || "",
    polling_station: person.polling_station || "",
    security_rank: person.security_rank || "guard"
  });
  const [saving, setSaving] = useState(false);

  const availableStations = form.ward ? wardsWithCenters.find(w => w.name === form.ward)?.centers || [] : [];

  const handleSave = async () => {
    setSaving(true);
    // Use the toggle-active endpoint which supports PATCHing these fields
    const res = await fetch(`https://ol-kalou-backend-7tko.onrender.com/api/members/${person.id}/toggle-active/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('dcp_token')}`
      },
      body: JSON.stringify(form)
    });
    
    if (res.ok) {
      toast.success("Assignment updated!");
      onSuccess();
    } else {
      toast.error("Failed to update assignment.");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-black text-lg uppercase tracking-widest text-slate-900">Edit Assignment</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">{person.full_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Security Rank</label>
            <select value={form.security_rank} onChange={e => setForm({...form, security_rank: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
              <option value="guard">Guard</option>
              <option value="station_commander">Station Commander</option>
              <option value="ward_commander">Ward Commander</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ward</label>
            <select value={form.ward} onChange={e => setForm({...form, ward: e.target.value, polling_station: ""})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none">
              <option value="">— Select Ward —</option>
              {wardsWithCenters.map(w => <option key={w.id} value={w.name}>{w.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Polling Station</label>
            <select value={form.polling_station} onChange={e => setForm({...form, polling_station: e.target.value})} disabled={!form.ward} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none disabled:opacity-50">
              <option value="">— Select Station —</option>
              {availableStations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50">
            {saving ? "Saving..." : <><Check size={16} /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
