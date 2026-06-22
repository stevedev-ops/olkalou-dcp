import { useState, useEffect } from "react";
import { Plus, Users, Calendar, MapPin, Search, CheckCircle2, UserCheck, Download } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { exportToCSV } from "../lib/exportUtils";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Event Form State
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  // Check-in State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await api.getEvents();
    if (data) setEvents(data.results || data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const { data, error } = await api.createEvent({ name, date, location });
    if (error) {
      toast.error("Failed to create event");
      return;
    }
    toast.success("Event created!");
    setShowForm(false);
    fetchEvents();
  };

  const selectEvent = async (evt) => {
    setSelectedEvent(evt);
    setSearchQuery("");
    setSearchResults([]);
    const { data } = await api.getEventAttendance(evt.id);
    if (data) setAttendees(data.results || data || []);
  };

  // Debounced search for manual check-in
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await api.getMembers({ search: searchQuery });
      if (data) setSearchResults(data.results || data || []);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleCheckIn = async (memberId) => {
    if (!selectedEvent) return;
    const { data, error } = await api.checkInMember(selectedEvent.id, memberId);
    if (error) {
      toast.error(error.message || "Check-in failed");
      return;
    }
    toast.success("Member checked in!");
    setSearchQuery("");
    setSearchResults([]);
    // Refresh attendees
    selectEvent(selectedEvent);
  };

  return (
    <div className="selection:bg-dcp-green/30 space-y-6">
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(0,132,61,0.25)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">Field Mobilization</p>
            <h1 className="text-3xl font-black text-white italic uppercase">Rally Check-ins</h1>
            <p className="text-slate-400 text-sm mt-1">Track physical attendance at DCP events and town halls.</p>
          </div>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-5 py-3 bg-dcp-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dcp-green/90 transition shadow-lg shadow-dcp-green/20">
            <Plus className="w-4 h-4" /> New Event
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreateEvent} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Event Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-dcp-green text-sm font-bold text-slate-900" placeholder="e.g. Kanjuiri Townhall" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Date & Time</label>
            <input required type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-dcp-green text-sm font-bold text-slate-900" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location</label>
            <input required value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-dcp-green text-sm font-bold text-slate-900" placeholder="Ward / Venue" />
          </div>
          <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition">
            Create Event
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Event List */}
        <div className="md:col-span-1 space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Upcoming Events</h3>
          {events.map((evt) => (
            <button
              key={evt.id}
              onClick={() => selectEvent(evt)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedEvent?.id === evt.id ? 'bg-dcp-green/10 border-dcp-green text-slate-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
            >
              <h4 className="font-black text-sm uppercase mb-1">{evt.name}</h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mb-1">
                <Calendar size={12} /> {new Date(evt.date).toLocaleDateString()}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span className="flex items-center gap-1"><MapPin size={12} /> {evt.location}</span>
                <span className="flex items-center gap-1 text-dcp-green"><Users size={12} /> {evt.attendees_count}</span>
              </div>
            </button>
          ))}
          {events.length === 0 && !loading && (
             <p className="text-sm text-slate-400 font-medium px-2">No events created yet.</p>
          )}
        </div>

        {/* Check-in Scanner */}
        <div className="md:col-span-2">
          {selectedEvent ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[600px]">
              <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedEvent.name}</h3>
                  <p className="text-sm text-slate-500 font-bold mt-1 flex items-center gap-2">
                    <Calendar size={14} /> {new Date(selectedEvent.date).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-100 px-4 py-2 rounded-xl text-center">
                  <p className="text-2xl font-black text-slate-900">{attendees.length}</p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Checked In</p>
                </div>
              </div>

              {/* Check-in Input */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="TYPE NAME OR ID NUMBER TO CHECK IN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-dcp-green focus:ring-2 focus:ring-dcp-green/20 transition-all font-black text-sm uppercase tracking-wider"
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 3 && (
                <div className="mb-6 space-y-2 border border-dcp-green/30 bg-dcp-green/5 p-2 rounded-xl">
                  {isSearching ? (
                    <p className="text-xs font-bold text-slate-500 p-2 uppercase">Searching...</p>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <div>
                          <p className="font-bold text-sm uppercase">{member.full_name}</p>
                          <p className="text-xs text-slate-500 font-medium">{member.phone} • {member.ward}</p>
                        </div>
                        <button onClick={() => handleCheckIn(member.id)} className="flex items-center gap-1 bg-dcp-green text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-dcp-green/90 transition">
                          <UserCheck size={14} /> Check In
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-bold text-slate-500 p-2 uppercase">No members found.</p>
                  )}
                </div>
              )}

              {/* Attendee List */}
              <div className="flex-1 overflow-y-auto min-h-0 relative">
                <div className="flex items-center justify-between mb-3 sticky top-0 bg-white pb-2">
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Check-ins</h4>
                   {attendees.length > 0 && (
                     <button onClick={() => exportToCSV(attendees, `Event_Attendance_${selectedEvent.name}`)} className="flex items-center gap-1 text-dcp-green hover:text-dcp-green-dark text-[10px] font-black uppercase tracking-widest">
                       <Download size={12}/> Export
                     </button>
                   )}
                </div>
                <div className="space-y-2">
                  {attendees.length > 0 ? (
                    attendees.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-dcp-green" />
                          <div>
                            <p className="font-bold text-sm uppercase text-slate-900">{a.member_name}</p>
                            <p className="text-xs text-slate-500 font-medium">{a.member_ward} • Checked in at {new Date(a.checked_in_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 font-medium text-center py-8">No attendees checked in yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl h-[600px] flex flex-col items-center justify-center text-slate-400">
              <Calendar size={48} className="mb-4 opacity-50" />
              <p className="font-black text-sm uppercase tracking-widest">Select an event to open scanner</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
