import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Bell } from "lucide-react";
import Icon from "../assets/hadqya.png"; // Ensure this path is correct

// Import your sub-components
import ManagementSidebar from "../components/ManagementSidebar";
import ManagementDashboardContent from "../components/management/SOAView";
import ManagementSOA from "../components/management/SOAView";
import ManagementReports from "../components/management/ReportsView";

function ManagementDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      navigate("/");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      // Verify if user is a manager
      if (payload.role?.toLowerCase() !== "manager") {
        toast.error("Access denied. Management only.");
        navigate("/");
        return;
      }
    } catch (error) {
      localStorage.removeItem("token");
      toast.error("Invalid session. Please login again.");
      navigate("/");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div
      className="min-h-screen text-white flex"
      style={{
        background:
          "linear-gradient(135deg, #16245f 0%, #0d1a4a 45%, #7f6421 100%)",
      }}
    >
      <ManagementSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleLogout={handleLogout}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <div className="backdrop-blur-xl bg-white/10 border-b border-white/10 shadow-xl px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={Icon} alt="Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Management Dashboard
              </h1>
              <p className="text-sm text-white/70 mt-1">Contracts Overview</p>
            </div>
          </div>

          <button
            type="button"
            className="relative backdrop-blur-lg bg-white/10 border border-white/20 p-3 rounded-xl hover:bg-white/20 transition"
          >
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-[#7f6421] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {activeSection === "dashboard" && <ManagementDashboardContent />}
          {activeSection === "soa" && <ManagementSOA />}
          {activeSection === "reports" && <ManagementReports />}
        </div>
      </div>
    </div>
  );
}

export default ManagementDashboard;