import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, LogOut, Scale, Gavel, ShieldOff, MailCheck,
  Clock, History, CheckCircle2, Bell, Activity, ShieldCheck,
  ChevronLeft, ChevronRight, Timer, Landmark, AlertTriangle, Search, Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getAllContracts,
  deactivateGuarantee,
  sendLegalConfirmationEmail,
  getNotificationsByDepartment
} from "../services/api";

/* DYNAMIC ACTION MODAL */
function ActionConfirmModal({ isOpen, onClose, onConfirm, contract, loading, type }) {
  if (!isOpen || !contract) return null;
  const isEmail = type === 'email';
  const isPN = contract.guaranteeType === "PN";
  const isLongTerm = contract.currentStage === "legal_manual_court_long_term";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
          isEmail ? (isPN ? 'bg-orange-50 text-orange-600' : isLongTerm ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600') : 'bg-green-50 text-green-600'
        }`}>
          {isEmail ? (isPN ? <Timer size={28} /> : isLongTerm ? <Gavel size={28} /> : <MailCheck size={28} />) : <ShieldOff size={28} />}
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 mb-2">
            {isPN ? "Start Enforcement" : isLongTerm ? "Confirm Court Filing" : isEmail ? "Confirm Notification" : "Release Guarantee"}
        </h2>
        
        <p className="text-slate-500 mb-6 text-sm leading-relaxed">
          {isPN 
            ? `Execute Promissory Note enforcement for ${contract.customerName}. This starts the 15-day executive court notice.`
            : isLongTerm 
              ? `Manual contract detected. This will log the formal court filing for ${contract.customerName}.`
              : isEmail 
                ? `Confirming this case has been filed in court. This will notify ${contract.customerName} via email.`
                : `Positive SOA detected. Confirming the release of the security note for ${contract.customerName}.`}
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100">
           <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold uppercase">Customer</span>
              <span className="font-bold text-slate-800">{contract.customerName}</span>
           </div>
           <div className="flex justify-between items-center text-xs mt-2">
              <span className="text-slate-400 font-bold uppercase">Claim Balance</span>
              <span className="font-black text-red-600">{contract.SOABalance} SAR</span>
           </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition text-sm">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 text-white py-4 rounded-2xl font-bold transition-transform active:scale-95 text-sm ${
              isPN ? 'bg-orange-600' : isLongTerm ? 'bg-red-700' : isEmail ? 'bg-slate-900' : 'bg-green-600'
            } shadow-lg`}>
            {loading ? "Processing..." : "Confirm Action"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LegalDashboard() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [modalType, setModalType] = useState(null); 
  const [processingId, setProcessingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const itemsPerPage = 6;
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    checkAccess();
    const handleClickOutside = (e) => { if (notificationRef.current && !notificationRef.current.contains(e.target)) setShowNotifications(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkAccess = () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.department?.toLowerCase() !== "legal") return navigate("/");
      fetchData("legal");
    } catch (e) { navigate("/"); }
  };

  const fetchData = async (dept) => {
    setLoading(true);
    try {
      const [contractsRes, notifyRes] = await Promise.all([
        getAllContracts(dept),
        getNotificationsByDepartment(dept)
      ]);
      setContracts(contractsRes.data.contracts || []);
      setNotifications(notifyRes.data.notifications || []);
    } catch (err) { toast.error("Judicial sync failed"); } finally { setLoading(false); }
  };

  // --- FILTERING LOGIC ---
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const matchesSearch = c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || c._id.includes(searchTerm);
      const isPN = c.guaranteeType === "PN";
      const isManual = c.currentStage === "legal_manual_court_long_term";
      const isPositive = c.SOAStatus === "Positive";

      if (filterType === "pn") return matchesSearch && isPN && !isPositive;
      if (filterType === "manual") return matchesSearch && isManual;
      if (filterType === "release") return matchesSearch && isPositive;
      return matchesSearch;
    });
  }, [contracts, searchTerm, filterType]);

  const handleActionExecution = async () => {
    setProcessingId(selectedContract._id);
    try {
      const res = modalType === 'deactivate' 
        ? await deactivateGuarantee(selectedContract._id, selectedContract.guaranteeType)
        : await sendLegalConfirmationEmail(selectedContract._id);
      toast.success(res.data.msg);
      setModalType(null);
      setSelectedContract(null);
      fetchData("legal");
    } catch (err) { toast.error(err.response?.data?.msg || "Action failed"); } finally { setProcessingId(null); }
  };

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const currentItems = filteredContracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 pb-20">
      <ActionConfirmModal isOpen={!!modalType} onClose={() => { setModalType(null); setSelectedContract(null); }} onConfirm={handleActionExecution} contract={selectedContract} loading={processingId === selectedContract?._id} type={modalType} />

      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 bg-red-700 rounded-full" />
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">Judicial Control</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Legal Enforcement Queue</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative" ref={notificationRef}>
            <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2.5 transition-all relative rounded-xl border ${showNotifications ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-slate-900'}`}>
              <Bell size={20} />
              {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-black">{notifications.length}</span>}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-4 w-80 bg-white border border-slate-200 shadow-2xl rounded-[28px] z-50 overflow-hidden">
                  <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Judicial Alerts</h3>
                    <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-lg">{notifications.length} New</span>
                  </div>
                  <div className="max-h-[380px] overflow-y-auto">
                    {notifications.length > 0 ? notifications.map((n, idx) => (
                      <div key={idx} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group flex gap-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-slate-900 group-hover:text-white h-fit"><Activity size={14} /></div>
                        <div className="flex-1 text-xs">
                          <p className="font-bold text-slate-800 mb-1 leading-relaxed text-left">{n.message}</p>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase"><Clock size={10} /> {new Date(n.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-12 text-center text-slate-300"><ShieldCheck size={24} className="mx-auto mb-2" /><p className="text-[10px] font-black uppercase tracking-widest">Records Synchronized</p></div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button onClick={() => { localStorage.clear(); navigate("/"); }} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-black transition shadow-lg"><LogOut size={16} /> LOGOUT</button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {/* STATS SECTION */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard title="PN Enforcement" count={contracts.filter(c => c.guaranteeType === "PN" && c.SOAStatus !== "Positive").length} icon={<Timer className="text-orange-600" />} color="bg-orange-50" />
          <StatCard title="Court Filings" count={contracts.filter(c => c.currentStage === "legal_manual_court_long_term").length} icon={<Gavel className="text-red-600" />} color="bg-red-50" />
          <StatCard title="Release Review" count={contracts.filter(c => c.SOAStatus === "Positive").length} icon={<CheckCircle2 className="text-green-600" />} color="bg-green-50" />
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search customer or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-slate-900 transition-all" />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {['all', 'pn', 'manual', 'release'].map((type) => (
              <button key={type} onClick={() => setFilterType(type)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest">Syncing Judicial Records...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {currentItems.map((contract) => {
                const isPN = contract.guaranteeType === "PN";
                const isPositive = contract.SOAStatus === "Positive";
                const isLongTerm = contract.currentStage === "legal_manual_court_long_term";
                const isActionable = ["pn_collection", "legal_enforcement_15days", "legal_manual_court_long_term"].includes(contract.currentStage);

                return (
                  <motion.div key={contract._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl transition-all">
                    <div className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest flex justify-between ${
                      isPositive ? 'bg-green-600' : isLongTerm ? 'bg-red-700' : isPN ? 'bg-orange-600' : 'bg-slate-800'
                    } text-white`}>
                      <span>{isPositive ? "Release Queue" : isLongTerm ? "Manual Court Filing" : isPN ? "Executive Enforcement" : "Litigation Queue"}</span>
                      {isLongTerm ? <Gavel size={12} /> : isPN ? <Landmark size={12} /> : <Clock size={12} />}
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-6">
                        <h3 className="text-xl font-black text-slate-800 leading-tight truncate text-left">{contract.customerName}</h3>
                        <p className="text-[10px] font-mono text-slate-400 text-left">REF: {contract._id.slice(-8).toUpperCase()}</p>
                      </div>

                      {isLongTerm && (
                        <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                          <div className="p-2 bg-red-100 text-red-700 rounded-lg"><AlertTriangle size={16} /></div>
                          <div>
                            <p className="text-[9px] font-black text-red-700 uppercase tracking-widest">Manual Action Required</p>
                            <p className="text-[10px] font-bold text-red-600">Requires physical court submission</p>
                          </div>
                        </div>
                      )}

                      {isPN && !isPositive && (
                        <div className="mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                           <div className="flex justify-between items-center mb-2">
                             <span className="text-[9px] font-black text-orange-700 uppercase tracking-widest">Enforcement Window</span>
                             <span className="text-[10px] font-bold text-orange-600">15 Days Left</span>
                           </div>
                           <div className="w-full bg-orange-200 h-2 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: '15%' }} className="bg-orange-600 h-full" />
                           </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 mb-6">
                        <DetailBox label="Net Balance" value={`${contract.SOABalance} SAR`} highlight={!isPositive} />
                        <DetailBox label="Guarantee" value={contract.guaranteeType || "None"} color={isPN ? "text-orange-600" : isLongTerm ? "text-red-700" : "text-slate-700"} />
                        <DetailBox label="SOA Status" value={contract.SOAStatus} color={isPositive ? 'text-green-600' : 'text-red-600'} />
                        <DetailBox label="Damage Amt" value={`${contract.damageAmount || 0} SAR`} />
                      </div>

                      <div className="mt-auto">
                        {isPositive ? (
                          <button onClick={() => { setSelectedContract(contract); setModalType('deactivate'); }} className="w-full bg-green-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-green-100 hover:bg-green-700 transition active:scale-95">
                            <ShieldOff size={18} /> Deactivate Guarantee
                          </button>
                        ) : isActionable ? (
                          <button onClick={() => { setSelectedContract(contract); setModalType('email'); }} className={`w-full text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
                            isLongTerm ? 'bg-red-700 hover:bg-red-800 shadow-red-100' : isPN ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : 'bg-slate-900 hover:bg-black shadow-slate-200'
                          }`}>
                            {isLongTerm ? <Gavel size={18} /> : isPN ? <Landmark size={18} /> : <MailCheck size={18} />}
                            {isLongTerm ? "Log Formal Court Filing" : isPN ? "Enforce PN Claim" : "Log Filing & Notify"}
                          </button>
                        ) : (
                          <div className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-center text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                            <Clock size={14} /> Pending Procedure
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 disabled:opacity-30 shadow-sm transition-all"><ChevronLeft size={20} /></button>
            <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm font-black text-[10px] text-slate-900 uppercase">Page {currentPage} / {totalPages}</div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 disabled:opacity-30 shadow-sm transition-all"><ChevronRight size={20} /></button>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, count, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex flex-col group hover:border-slate-300 transition">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>{icon}</div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">{title}</span>
      <span className="text-4xl font-black text-slate-800 mt-1 text-left">{count}</span>
    </div>
  );
}

function DetailBox({ label, value, color = "text-slate-700", highlight = false }) {
  return (
    <div className={`p-2.5 rounded-xl border border-slate-100 ${highlight ? 'bg-red-50/50 border-red-100' : 'bg-slate-50/50'}`}>
      <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 text-left">{label}</p>
      <p className={`text-[11px] font-bold truncate text-left ${color} ${highlight ? 'text-red-700 font-black' : ''}`}>{value}</p>
    </div>
  );
}

export default LegalDashboard;