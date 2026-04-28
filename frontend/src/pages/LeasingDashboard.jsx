// src/pages/LeasingDashboard.jsx
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, LogOut, Bell, CheckCircle, XCircle, 
  ArrowUpRight, ShieldAlert, Wallet, Clock, 
  Activity, ShieldCheck, ChevronLeft, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  getAllContracts,
  uploadToEjar,
  uploadToEjarNegativeFlow,
  getNotificationsByDepartment
} from "../services/api";

import EjarUploadModal from "../components/EjarUploadModal";
import EjarNegativeUploadModal from "../components/EjarNegativeUploadModal";

function LeasingDashboard() {
  const navigate = useNavigate();
  
  // Core State
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Modals State
  const [showModal, setShowModal] = useState(false);
  const [showNegativeModal, setShowNegativeModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

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
      if (payload.department?.toLowerCase() !== "leasing") {
        toast.error("Access denied. Leasing only.");
        navigate("/");
        return;
      }
      fetchData("leasing");
    } catch (e) {
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
      toast.error("System synchronization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRefundable = (contract) => {
    setSelectedContract(contract);
    setShowModal(true);
  };

  const handleNonRefundable = (contract) => {
    setSelectedContract(contract);
    setShowNegativeModal(true);
  };

  const handleEjarSubmit = async (formData) => {
    try {
      const res = await uploadToEjar(selectedContract._id, formData);
      toast.success(res.data.msg);
      setShowModal(false);
      fetchData("leasing");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Ejar upload failed");
    }
  };

  const handleNegativeFlowSubmit = async (formData) => {
    try {
      const res = await uploadToEjarNegativeFlow(selectedContract._id, formData);
      toast.success(res.data.msg);
      setShowNegativeModal(false);
      fetchData("leasing");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Negative flow failed");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
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
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 bg-emerald-600 rounded-full" />
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">Leasing Portal</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ejar Integration & Refunds</p>
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
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">System Alerts</h3>
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
                              <p className="font-bold text-slate-800 mb-1 leading-relaxed">{n.message}</p>
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
                        <p className="text-[10px] font-black uppercase tracking-widest">Queue Clear</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={handleLogout} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-black transition shadow-lg shadow-slate-200">
            <LogOut size={16} /> EXIT
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {/* STATS SECTION */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <StatCard title="Active Queue" count={contracts.length} icon={<FileText className="text-blue-600" />} />
          <StatCard 
            title="Debt Cases" 
            count={contracts.filter(c => c.SOABalance > 0).length} 
            icon={<ShieldAlert className="text-amber-600" />} 
            color="bg-amber-50"
          />
          <StatCard 
            title="Refund Pending" 
            count={contracts.filter(c => c.SOABalance <= 0).length} 
            icon={<Wallet className="text-emerald-600" />} 
            color="bg-emerald-50"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest">Synchronizing Ejar Records...</div>
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-[32px] p-20 text-center border border-dashed border-slate-300">
            <ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest">Queue processed</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {currentItems.map((contract) => {
                  const isNonRefundable = contract.SOABalance > 0 || contract.SOAStatus === "Negative";
                  
                  return (
                    <motion.div
                      key={contract._id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-xl transition-all group"
                    >
                      <div className={`px-6 py-2 text-[10px] font-black uppercase tracking-tighter flex justify-between items-center ${
                        isNonRefundable ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        <span>{isNonRefundable ? "Non-Refundable (Debtor)" : "Refundable (Clear)"}</span>
                        <ArrowUpRight size={14} />
                      </div>

                      <div className="p-6 flex-grow">
                        <div className="mb-6">
                          <h3 className="text-xl font-black text-slate-800 mb-1 truncate">{contract.customerName}</h3>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {contract._id.slice(-8).toUpperCase()}</p>
                        </div>

                        <div className="bg-slate-50 rounded-[24px] p-4 mb-6 space-y-3 border border-slate-100">
                          <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span>Deposit Balance</span>
                            <span className="text-slate-900">{contract.depositAmount} SAR</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-slate-500">
                            <span>Damage Claims</span>
                            <span className="text-red-500">{Math.abs(contract.damageAmount)} SAR</span>
                          </div>
                          <hr className="border-slate-200 border-dashed" />
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Position</span>
                            <span className={`text-lg font-black ${isNonRefundable ? "text-red-600" : "text-emerald-600"}`}>
                              {Math.abs(contract.SOABalance)} SAR
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[10px] mb-6 font-black uppercase tracking-tight text-slate-400">
                          <div>
                            <p className="mb-1">Guarantee</p>
                            <p className="text-slate-700 bg-slate-100 py-1.5 px-3 rounded-xl w-fit">
                              {contract.hasGuarantee ? contract.guaranteeType : "None"}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1">Ejar Status</p>
                            <p className="text-slate-700 bg-slate-100 py-1.5 px-3 rounded-xl w-fit">
                              {contract.hasEjar ? "Connected" : "Disconnected"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 pt-0 mt-auto flex gap-3">
                        <button
                          disabled={isNonRefundable}
                          onClick={() => handleRefundable(contract)}
                          className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            isNonRefundable 
                            ? "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100 shadow-none" 
                            : "bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95"
                          }`}
                        >
                          <CheckCircle size={16} /> Refund
                        </button>

                        <button
                          disabled={!isNonRefundable}
                          onClick={() => handleNonRefundable(contract)}
                          className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            !isNonRefundable 
                            ? "bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100 shadow-none" 
                            : "bg-slate-900 text-white shadow-lg shadow-slate-100 hover:bg-black active:scale-95"
                          }`}
                        >
                          <XCircle size={16} /> Ejar Claim
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
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

      <EjarUploadModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleEjarSubmit} contract={selectedContract} />
      <EjarNegativeUploadModal isOpen={showNegativeModal} onClose={() => setShowNegativeModal(false)} onSubmit={handleNegativeFlowSubmit} contract={selectedContract} />
    </div>
  );
}

function StatCard({ title, count, icon, color = "bg-white" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${color} rounded-[32px] p-6 shadow-sm border border-slate-100 group hover:border-slate-300 transition-all`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">{icon}</div>
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h2>
      </div>
      <p className="text-4xl font-black text-slate-800">{count}</p>
    </motion.div>
  );
}

export default LeasingDashboard;