// src/pages/FinanceDashboard.jsx

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  LogOut,
  Bell,
  DollarSign,
  CheckCircle2,
  Wallet,
  Clock,
  Building2,
  ShieldCheck,
  SendHorizontal,
  Activity,
  ChevronLeft,
  ChevronRight,
  UserCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  getAllContracts,
  confirmPaymentAndPOP,
  getNotificationsByDepartment
} from "../services/api";

function FinanceDashboard() {
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

    // Close notifications on click outside
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
      if (payload.department?.toLowerCase() !== "finance") {
        toast.error("Access denied. Finance only.");
        navigate("/");
        return;
      }
      fetchData("finance");
    } catch (error) {
      localStorage.removeItem("token");
      toast.error("Invalid session. Please login again.");
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
      toast.error("Intelligence sync failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseRefund = async (contract) => {
    try {
      setProcessingId(contract._id);
      const isBG = contract.currentStage === "bg_liquidation_process";
      
      const payload = {
        popReference: isBG ? `BG-LIQ-${Date.now()}` : `POP-${Date.now()}`,
        paymentNotes: isBG 
          ? `Finance confirmed liquidation of Bank Guarantee for ${contract.customerName}`
          : `Refund released for ${contract.customerName}`
      };

      const res = await confirmPaymentAndPOP(contract._id, payload);
      toast.success(res.data.msg);
      fetchData("finance");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to process request");
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
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 bg-slate-900 rounded-full" />
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">Finance Treasury</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financial Reconciliation & Refund Control</p>
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
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Treasury Alerts</h3>
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
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-800 leading-relaxed mb-1">{n.message}</p>
                              <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase">
                                <Clock size={10} />
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <ShieldCheck size={24} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Queue Clean</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-bold text-xs hover:bg-black transition shadow-lg shadow-slate-200"
          >
            <LogOut size={16} /> LOGOUT
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {/* STATS SECTION */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            title="Total Contracts" 
            count={contracts.length} 
            icon={<FileText className="text-blue-600" />} 
            color="bg-blue-50" 
          />
          <StatCard 
            title="Refunds Pending" 
            count={contracts.filter(c => c.SOAStatus === "Positive").length} 
            icon={<Wallet className="text-amber-600" />} 
            color="bg-amber-50" 
          />
          <StatCard 
            title="BG Liquidation Queue" 
            count={contracts.filter(c => c.currentStage === "bg_liquidation_process").length} 
            icon={<ShieldCheck className="text-purple-600" />} 
            color="bg-purple-50" 
          />
        </div>

        <div className="flex items-center gap-2 mb-8 px-2">
            <div className="h-6 w-1 bg-slate-900 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Disbursement & Liquidation</h2>
        </div>

        {loading ? (
          <div className="py-20 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest italic">
            Accessing Treasury Records...
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border border-dashed border-slate-300">
             <DollarSign className="mx-auto text-slate-200 mb-4" size={48} />
             <p className="text-slate-400 font-bold uppercase tracking-widest">No Treasury Tasks Found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {currentItems.map((contract) => {
                  const isBGProcess = contract.currentStage === "bg_liquidation_process";
                  return (
                    <motion.div
                      key={contract._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group"
                    >
                      <div className={`h-2 transition-colors ${isBGProcess ? 'bg-purple-600' : 'bg-slate-800 group-hover:bg-amber-500'}`}></div>

                      <div className="p-6 flex-grow flex flex-col">
                        <div className="mb-6 flex justify-between items-start">
                          <div>
                              <h3 className="text-xl font-black text-slate-800 leading-tight">
                              {contract.customerName}
                              </h3>
                              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter mt-1">
                              TX-ID: {contract._id.slice(-8).toUpperCase()}
                              </p>
                          </div>
                          {isBGProcess ? (
                            <span className="bg-purple-50 text-purple-600 text-[9px] font-black px-2 py-1 rounded-full uppercase border border-purple-100">
                                BG Liquidation
                            </span>
                          ) : contract.SOAStatus === "Positive" && (
                              <span className="bg-green-50 text-green-600 text-[9px] font-black px-2 py-1 rounded-full uppercase border border-green-100">
                                  Refund Ready
                              </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-6">
                          <DetailBox label="Total Amount" value={`${contract.totalAmount} SAR`} />
                          <DetailBox label="Paid" value={`${contract.paidAmount} SAR`} />
                          <DetailBox 
                              label={isBGProcess ? "Liquidation Amt" : "Refund Due"} 
                              value={`${Math.abs(isBGProcess ? contract.SOABalance : contract.depositAmount)} SAR`} 
                              highlight={!isBGProcess}
                              bgBlue={isBGProcess}
                          />
                          <DetailBox 
                            label="SOA Status" 
                            value={contract.SOAStatus} 
                            color={contract.SOAStatus === 'Positive' ? 'text-green-600' : 'text-red-600'} 
                          />
                          <DetailBox label="Guarantee" value={contract.hasGuarantee ? contract.guaranteeType : "None"} />
                          <DetailBox label="Ejar Case" value={contract.hasEjar ? "Yes" : "No"} />
                        </div>

                        <div className="space-y-2 mb-8 mt-auto">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <Clock size={14} className="text-blue-500" />
                            <span className="uppercase tracking-tighter">Current Step:</span>
                            <span className="text-slate-800 ml-auto">{contract.currentStage}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleReleaseRefund(contract)}
                          disabled={processingId === contract._id}
                          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isBGProcess 
                            ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-100' 
                            : 'bg-slate-900 hover:bg-black text-white shadow-slate-200'
                          }`}
                        >
                          {processingId === contract._id 
                            ? "Processing..." 
                            : isBGProcess 
                              ? "Confirm BG Liquidation" 
                              : "Confirm & Release Refund"
                          }
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
    </div>
  );
}

/* REUSABLE UI COMPONENTS */
function StatCard({ title, count, icon, color }) {
  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex flex-col group hover:border-slate-300 transition">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
      <span className="text-4xl font-black text-slate-800 mt-1">{count}</span>
    </div>
  );
}

function DetailBox({ label, value, color = "text-slate-700", highlight = false, bgBlue = false }) {
  let bgColor = "bg-slate-50/50";
  let labelColor = "text-slate-400";
  let valueColor = color;

  if (highlight) {
    bgColor = "bg-amber-50 border-amber-100";
    valueColor = "text-amber-700 font-black";
  } else if (bgBlue) {
    bgColor = "bg-blue-50 border-blue-100";
    valueColor = "text-blue-700 font-black";
  }

  return (
    <div className={`p-3 rounded-2xl border border-slate-100 ${bgColor}`}>
      <p className={`text-[9px] font-black uppercase tracking-tighter mb-0.5 ${labelColor}`}>{label}</p>
      <p className={`text-xs font-bold truncate ${valueColor}`}>{value}</p>
    </div>
  );
}

export default FinanceDashboard;