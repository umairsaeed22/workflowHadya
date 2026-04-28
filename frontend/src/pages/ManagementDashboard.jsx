import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Bell, UserCircle, Loader2, Activity, ShieldCheck, Clock } from "lucide-react";

import ManagementSidebar from "../components/ManagementSidebar";
import SOAView from "../components/management/SOAView";
import ReportsView from "../components/management/ReportsView";
import ManagementCharts from "../components/management/ManagementCharts";
import { getManagementStats, getNotificationsByDepartment } from "../services/api";

function ManagementDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState({ name: "Manager" });
  const [loading, setLoading] = useState(true);

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
      fetchDashboardData();
      fetchNotifications(payload.department || "management");
    } catch (e) {
      navigate("/");
    }

    // Close dropdown on click outside
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await getManagementStats();
      setStats(res.data.stats);
    } catch (err) {
      toast.error("Failed to sync dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (dept) => {
    try {
      const res = await getNotificationsByDepartment(dept);
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Intelligence sync interrupted");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Safe logout completed");
    navigate("/");
  };

  const displayName = user?.name || "Manager";

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8F9FA] gap-4">
        <Loader2 className="animate-spin text-[#7f6421]" size={40} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
          Synchronizing Intelligence
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      <ManagementSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8 bg-white border-b border-gray-100 z-20">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1 bg-[#7f6421] rounded-full" />
            <h2 className="text-lg font-bold text-gray-800 tracking-tight uppercase">
              {activeSection === "soa" ? "SOA Management" : activeSection}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* NOTIFICATION CENTER */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 transition-all relative rounded-xl ${showNotifications ? 'bg-[#7f6421]/10 text-[#7f6421]' : 'text-gray-400 hover:text-[#7f6421]'
                  }`}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#7f6421] rounded-full border-2 border-white" />
                )}
              </button>

              {/* DROPDOWN POPUP */}
              {showNotifications && (
                <div className="absolute right-0 mt-4 w-80 bg-white border border-gray-100 shadow-2xl rounded-[28px] z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">System Alerts</h3>
                    <span className="bg-[#7f6421] text-white text-[9px] font-black px-2 py-0.5 rounded-lg">
                      {notifications.length} Active
                    </span>
                  </div>

                  <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((notif, idx) => (
                        <div key={notif._id || idx} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
                          <div className="flex gap-4">
                            <div className="mt-1">
                              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-[#7f6421] group-hover:text-white transition-all">
                                <Activity size={14} />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-gray-800 leading-relaxed mb-1">{notif.message}</p>
                              <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase">
                                <Clock size={10} />
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                <span className="mx-1">•</span>
                                {notif.type || 'Operational'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 px-6 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-50 text-gray-200 rounded-full mb-4">
                          <ShieldCheck size={24} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Queue Fully Verified</p>
                      </div>
                    )}
                  </div>

                  <button className="w-full py-4 text-[10px] font-black text-[#7f6421] border-t border-gray-50 uppercase tracking-widest hover:bg-gray-50 transition-colors">
                    View Audit History
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900">{displayName}</p>
                <p className="text-[10px] text-[#7f6421] font-bold uppercase tracking-widest">
                  Executive
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 text-[#7f6421]">
                <UserCircle size={24} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar transition-opacity duration-500 ease-in-out opacity-100 animate-in fade-in">

          {activeSection === "dashboard" && (
            <div className="space-y-6">
              {/* <ManagementCharts stats={stats} /> */}
              <SOAView />
            </div>
          )}

          {activeSection === "soa" && (
            <div className="space-y-6">
              <div className="mb-2 px-2">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Active Verification Queue</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Reviewing current Statement of Account states</p>
              </div>
              <SOAView showStats={false} />
            </div>
          )}

          {activeSection === "reports" && <ReportsView />}
        </main>
      </div>
    </div>
  );
}

export default ManagementDashboard;