import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, LogOut, Bell, HeartHandshake, CheckCircle, 
  MessageSquare, Clock, ShieldCheck, Search,
  Activity, ArrowUpRight, Inbox, X, UserCircle,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  getAllContracts, 
  updateContractStatus, 
  getNotificationsByDepartment 
} from "../services/api";

function CustomerServiceDashboard() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState({ name: "Service Officer" });

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

  // Reset page when filtering or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const checkAccess = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
      if (payload.department !== "customer_service") {
        toast.error("Unauthorized Access");
        navigate("/");
        return;
      }
      fetchData("customer_service");
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
      toast.error("Intelligence sync failed");
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleFinalHandover = async (id) => {
    try {
      await updateContractStatus(id, {
        currentDepartment: "admin",
        currentStage: "contract_closed",
        historyAction: "Customer Service completed final handover. Contract officially closed."
      });
      toast.success("Audit Cycle Finalized");
      setContracts(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      toast.error("Authorization Error");
    }
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || c._id.includes(searchQuery);
    if (activeTab === "positive") return matchesSearch && c.SOAStatus === 'Positive';
    if (activeTab === "negative") return matchesSearch && c.SOAStatus === 'Negative';
    return matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredContracts.slice(indexOfFirstItem, indexOfLastItem);

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Safe logout completed");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8F9FA] gap-4">
        <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-[#7f6421] rounded-full animate-spin"></div>
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Synchronizing Intelligence</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans antialiased">
      <header className="h-20 bg-white border-b border-gray-100 px-8 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 bg-[#7f6421] rounded-full" />
          <div>
            <h2 className="text-lg font-bold text-gray-800 tracking-tight uppercase">Customer Success Portal</h2>
            <p className="text-[9px] font-bold text-[#7f6421] uppercase tracking-[0.2em]">Post-Operation Management</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 transition-all relative rounded-xl ${
                showNotifications ? 'bg-[#7f6421]/10 text-[#7f6421]' : 'text-gray-400 hover:text-[#7f6421]'
              }`}
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#7f6421] border-2 border-white rounded-full" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-80 bg-white border border-gray-100 shadow-2xl rounded-[28px] z-50 overflow-hidden"
                >
                  <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">System Alerts</h3>
                    <span className="bg-[#7f6421] text-white text-[9px] font-black px-2 py-0.5 rounded-lg">{notifications.length} Active</span>
                  </div>
                  <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((n, idx) => (
                        <div key={n._id || idx} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                          <div className="flex gap-4">
                            <div className="mt-1">
                               <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-[#7f6421] group-hover:text-white transition-all">
                                 <Activity size={14} />
                               </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-gray-800 leading-relaxed mb-1">{n.message}</p>
                              <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase">
                                <Clock size={10} />
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <ShieldCheck size={24} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Queue Verified</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
            <div className="text-right">
              <p className="text-xs font-bold text-gray-900">{user?.name || "Officer"}</p>
              <button onClick={handleLogout} className="text-[9px] text-[#7f6421] font-black uppercase tracking-widest hover:underline">
                Safe Logout
              </button>
            </div>
            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 text-[#7f6421]">
              <UserCircle size={24} />
            </div>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard label="Inbox" value={contracts.length} icon={<Inbox size={20} />} color="gray" subText="Pending Audit" />
          <StatCard label="Refunds" value={contracts.filter(c => c.SOAStatus === 'Positive').length} icon={<Activity size={20} />} color="green" subText="Positive Flow" />
          <StatCard label="Recovery" value={contracts.filter(c => c.SOAStatus === 'Negative').length} icon={<ShieldCheck size={20} />} color="red" subText="Negative Flow" />
          <StatCard label="Efficiency" value={`${Math.round((contracts.length / 50) * 100)}%`} icon={<ArrowUpRight size={20} />} color="amber" subText="Unit Load" />
        </div>

        <div className="bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between mb-8">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="SEARCH CLIENT IDENTITY..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#7f6421]/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 bg-gray-50 p-1.5 rounded-2xl">
            {["all", "positive", "negative"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === tab ? "bg-white text-[#7f6421] shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-[40px] p-24 text-center border border-gray-100">
             <MessageSquare className="mx-auto text-gray-100 mb-6" size={64} />
             <p className="text-gray-400 font-black uppercase tracking-[0.3em]">No Outstanding Actions</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <AnimatePresence mode="popLayout">
                {currentItems.map((contract) => (
                  <motion.div
                    key={contract._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-[32px] border border-gray-100 p-8 hover:shadow-xl hover:border-[#7f6421]/20 transition-all group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        contract.SOAStatus === 'Positive' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                      }`}>
                        {contract.SOAStatus}
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Balance</p>
                        <p className={`text-xl font-black tracking-tight ${contract.SOAStatus === 'Positive' ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(contract.SOABalance).toLocaleString()} <span className="text-[10px]">SAR</span>
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight mb-6 group-hover:text-[#7f6421] transition-colors line-clamp-1">
                      {contract.customerName}
                    </h3>

                    <div className="space-y-3 mb-10">
                      <InfoRow label="Audit ID" value={contract._id.slice(-12)} icon={<ShieldCheck size={14}/>} />
                      <InfoRow label="Lifecycle" value={contract.currentStage.replace(/_/g, ' ')} icon={<Clock size={14}/>} />
                    </div>

                    <button
                      onClick={() => handleFinalHandover(contract._id)}
                      className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${
                        contract.SOAStatus === 'Positive' 
                        ? 'bg-gray-900 text-white hover:bg-[#7f6421] shadow-gray-200' 
                        : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'
                      }`}
                    >
                      <CheckCircle size={18} />
                      {contract.SOAStatus === 'Positive' ? 'Authorize Handover' : 'Archive Record'}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* MINIMALIST PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#7f6421] disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                    Page {currentPage} <span className="text-gray-300 mx-2">/</span> {totalPages}
                  </span>
                </div>

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#7f6421] disabled:opacity-30 transition-all shadow-sm"
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

function StatCard({ label, value, icon, color, subText }) {
  const colors = {
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50",
    amber: "text-amber-600 bg-amber-50",
    gray: "text-gray-500 bg-gray-50"
  };

  return (
    <div className="bg-white p-6 rounded-[28px] border border-gray-100 flex items-start justify-between group hover:border-[#7f6421]/20 transition-all shadow-sm">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
        <p className="text-[9px] font-bold text-gray-300 uppercase mt-1 tracking-tighter">{subText}</p>
      </div>
      <div className={`p-3 rounded-2xl ${colors[color]} transition-transform group-hover:scale-110 shadow-sm`}>
        {icon}
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-50 group-hover:bg-white transition-all">
      <div className="text-[#7f6421]/60">{icon}</div>
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-[10px] font-black text-gray-900 ml-auto uppercase tracking-tighter">{value}</span>
    </div>
  );
}

export default CustomerServiceDashboard;