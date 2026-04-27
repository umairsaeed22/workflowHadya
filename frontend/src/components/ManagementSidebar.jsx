import {
  LayoutDashboard,
  FileText,
  BarChart3,
  LogOut
} from "lucide-react";

function ManagementSidebar({
  activeSection,
  setActiveSection,
  handleLogout
}) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />
    },
    {
      id: "soa",
      label: "SOA",
      icon: <FileText size={20} />
    },
    {
      id: "reports",
      label: "Reports",
      icon: <BarChart3 size={20} />
    }
  ];

  return (
    <div className="w-[280px] min-h-screen backdrop-blur-xl bg-white/10 border-r border-white/10 p-6 flex flex-col justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white mb-8">
          Management Panel
        </h2>

        <div className="space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition duration-200 ${
                activeSection === item.id
                  ? "bg-white text-[#0d1a4a] font-semibold shadow-lg"
                  : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#7f6421] text-white hover:bg-[#8e722a] transition duration-200"
      >
        <LogOut size={20} />
        Logout
      </button>
    </div>
  );
} // Added the missing closing brace here

export default ManagementSidebar;