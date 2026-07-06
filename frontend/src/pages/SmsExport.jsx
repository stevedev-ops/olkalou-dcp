import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Download, Users, Phone, MapPin, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";

export default function SmsExport() {
  const { wardsWithCenters } = useLocationData();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ ward: "", station: "" });
  
  const availableStations = form.ward ? wardsWithCenters.find(w => w.name === form.ward)?.centers || [] : [];

  const handleFilter = async () => {
    setLoading(true);
    const { data: res } = await api.getSmsRecipients(form);
    setData(res || { count: 0, recipients: [] });
    setLoading(false);
  };

  const handleCopyNumbers = () => {
    if (!data?.recipients.length) return;
    const numbers = data.recipients.map(r => r.phone).join(", ");
    navigator.clipboard.writeText(numbers);
    toast.success(`${data.count} numbers copied to clipboard!`);
  };

  const handleDownloadCsv = () => {
    if (!data?.recipients.length) return;
    const headers = "Name,Phone,Ward,Station\n";
    const rows = data.recipients.map(r => `"${r.name}","${r.phone}","${r.ward}","${r.station}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dcp_contacts_${form.ward || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV Downloaded!");
  };

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-6">

        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(0,132,61,0.2)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">Communications</p>
              <h1 className="text-3xl font-black text-white italic uppercase">Ward-Targeted SMS</h1>
              <p className="text-slate-400 text-sm mt-1">Export filtered lists of supporters for Africa's Talking / Bulk SMS</p>
            </div>
            <div className="w-16 h-16 rounded-3xl bg-dcp-green/20 border border-dcp-green/30 flex items-center justify-center">
              <Send className="text-dcp-green w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">Filter Audience</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ward</label>
              <select value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value, station: "" }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green/50 transition appearance-none">
                <option value="">All Wards (Whole Constituency)</option>
                {wardsWithCenters.map(w => <option key={w.id} value={w.name}>{w.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Polling Station</label>
              <select value={form.station} onChange={e => setForm(f => ({ ...f, station: e.target.value }))} disabled={!form.ward}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green/50 transition appearance-none disabled:opacity-50">
                <option value="">All Stations in Ward</option>
                {availableStations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleFilter} disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />} Generate List
          </button>
        </div>

        {data && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-dcp-green/30 rounded-3xl p-6 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="text-center md:text-left">
                <p className="text-3xl font-black text-dcp-green">{data.count}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matching Contacts</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleCopyNumbers} disabled={data.count === 0}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition disabled:opacity-50">
                  <Copy className="w-4 h-4" /> Copy Numbers
                </button>
                <button onClick={handleDownloadCsv} disabled={data.count === 0}
                  className="flex items-center gap-2 px-5 py-3 bg-dcp-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dcp-green/90 transition shadow-lg shadow-dcp-green/20 disabled:opacity-50">
                  <Download className="w-4 h-4" /> Download CSV
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
              {data.recipients.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{r.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {r.ward} · {r.station}
                    </p>
                  </div>
                  <p className="font-black text-slate-600 tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {r.phone}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
