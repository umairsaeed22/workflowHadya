// src/pages/OperationsDashboard.jsx
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, LogOut, Bell, CheckCircle2, Mail, Clock,
  ChevronLeft, ChevronRight, Activity, ShieldCheck, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  getAllContracts, 
  updateContractStatus, 
  getNotificationsByDepartment 
} from "../services/api";

function OperationsDashboard() {
  const navigate = useNavigate();
  
  // Core State
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    checkAccess();

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const checkAccess = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      navigate("/");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.department?.toLowerCase() !== "operations") {
        toast.error("Access denied. Operations only.");
        navigate("/");
        return;
      }
      fetchData(payload.department?.toLowerCase());
    } catch (error) {
      localStorage.removeItem("token");
      navigate("/");
    }
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
    } catch (err) {
      toast.error("Operational sync failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, type) => {
    setProcessingId(id);
    const config = type === 'positive' 
      ? {
          currentDepartment: "customer_service",
          currentStage: "final_closure_pending",
          historyAction: "Operations closed the file. Moving to Customer Service for final handover."
        }
      : {
          currentDepartment: "customer_service",
          currentStage: "usage_confirmed",
          historyAction: "Confirmation email sent: Deposit used to cover balance. Case moved to Customer Service."
        };

    try {
      await updateContractStatus(id, config);
      toast.success(type === 'positive' ? "Operation Closed." : "Usage Confirmed.");
      setContracts(prev => prev.filter(c => c._id !== id));
      // Reset to page 1 if current page becomes empty
      if (currentItems.length === 1 && currentPage > 1) setCurrentPage(prev => prev - 1);
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/");
  };

  // Pagination Logic
  const totalPages = Math.ceil(contracts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = contracts.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      {/* HEADER - MATCHING MANAGEMENT UI */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 bg-slate-900 rounded-full" />
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">Operations Hub</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Case Verification & Processing</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* NOTIFICATION HUB */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 transition-all relative rounded-xl border ${
                showNotifications 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-slate-900'
              }`}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-black">
                  {notifications.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 bg-white border border-slate-200 shadow-2xl rounded-[28px] z-50 overflow-hidden"
                >
                  <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Ops Alerts</h3>
                    <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-lg">{notifications.length} New</span>
                  </div>
                  <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((n, idx) => (
                        <div key={n._id || idx} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                          <div className="flex gap-4">
                            <div className="mt-1">
                               <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all">
                                 <Activity size={14} />
                               </div>
                            </div>
                            <div className="flex-1 text-xs">
                              <p className="font-bold text-slate-800 mb-1">{n.message}</p>
                              <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase">
                                <Clock size={10} />
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-slate-300">
                        <ShieldCheck size={24} className="mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">All Clear</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-black transition shadow-lg">
            <LogOut size={16} /> LOGOUT
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <StatCard title="Assigned Tasks" count={contracts.length} icon={<FileText className="text-blue-600" />} color="bg-blue-50" />
          <StatCard title="Critical (Negative)" count={contracts.filter(c => c.SOAStatus === "Negative").length} icon={<AlertCircle className="text-red-600" />} color="bg-red-50" />
        </div>

        {loading ? (
          <div className="py-20 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest italic">
            Synchronizing Hub Data...
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border border-dashed border-slate-300">
             <CheckCircle2 className="mx-auto text-slate-200 mb-4" size={48} />
             <p className="text-slate-400 font-bold uppercase tracking-widest">Queue Fully Processed</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {currentItems.map((contract) => (
                  <motion.div
                    key={contract._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all group"
                  >
                    <div className={`h-2 transition-colors ${contract.SOAStatus === 'Positive' ? 'bg-green-500' : 'bg-red-600'}`}></div>

                    <div className="p-6 flex-grow flex flex-col">
                      <div className="mb-6">
                        <h3 className="text-xl font-black text-slate-800 truncate">{contract.customerName}</h3>
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">ID: {contract._id.slice(-8).toUpperCase()}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-6">
                        <DetailBox label="Net Balance" value={`${Math.abs(contract.SOABalance)} SAR`} highlight={contract.SOAStatus === 'Negative'} />
                        <DetailBox 
                          label="SOA Status" 
                          value={contract.SOAStatus} 
                          color={contract.SOAStatus === 'Positive' ? 'text-green-600' : 'text-red-600'} 
                        />
                        <DetailBox label="Guarantee" value={contract.hasGuarantee ? contract.guaranteeType : "None"} />
                        <DetailBox label="Damage Amt" value={`${contract.damageAmount || 0} SAR`} />
                      </div>

                      <div className="mt-auto space-y-3">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <Clock size={14} className="text-slate-400" />
                            <span className="uppercase tracking-tighter">Current:</span>
                            <span className="text-slate-800 ml-auto truncate uppercase">{contract.currentStage.replace(/_/g, ' ')}</span>
                         </div>
                        
                        {contract.SOAStatus === "Positive" ? (
                          <button
                            disabled={processingId === contract._id}
                            onClick={() => handleAction(contract._id, 'positive')}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-100 transition transform active:scale-95 disabled:opacity-50"
                          >
                            <CheckCircle2 size={18} />
                            {processingId === contract._id ? "CLOSING..." : "COMPLETE & CLOSE"}
                          </button>
                        ) : (
                          <button
                            disabled={processingId === contract._id}
                            onClick={() => handleAction(contract._id, 'negative')}
                            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-100 transition transform active:scale-95 disabled:opacity-50"
                          >
                            <Mail size={18} />
                            {processingId === contract._id ? "SENDING..." : "CONFIRM & SEND"}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12 pb-10">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm font-black text-[10px] text-slate-900 uppercase tracking-widest">
                  Page {currentPage} <span className="text-slate-300 mx-2">/</span> {totalPages}
                </div>

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, count, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex flex-col group hover:border-slate-400 transition-all">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      <span className="text-4xl font-black text-slate-800 mt-1">{count}</span>
    </div>
  );
}

function DetailBox({ label, value, color = "text-slate-700", highlight = false }) {
  return (
    <div className={`p-3 rounded-2xl border border-slate-100 ${highlight ? 'bg-red-50/50 border-red-100' : 'bg-slate-50/50'}`}>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{label}</p>
      <p className={`text-xs font-bold truncate ${color} ${highlight ? 'text-red-700 font-black' : ''}`}>{value}</p>
    </div>
  );
}

export default OperationsDashboard;