import { LayoutDashboard, FileText, BarChart3, LogOut } from "lucide-react";

function ManagementSidebar({ activeSection, setActiveSection, handleLogout }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "soa", label: "SOA Queue", icon: <FileText size={18} /> },
    { id: "reports", label: "Audit Reports", icon: <BarChart3 size={18} /> }
  ];

  return (
    <div className="w-[260px] h-screen bg-white border-r border-gray-100 p-6 flex flex-col justify-between shadow-sm">
      <div className="space-y-8">
        <div className="px-4 py-2">
          <h1 className="text-xl text-center font-black text-gray-900 tracking-tighter">HADYA</h1>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeSection === item.id
                  ? "bg-[#7f6421] text-white shadow-lg shadow-[#7f6421]/20 font-bold"
                  : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.icon}
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-bold text-sm"
      >
        <LogOut size={18} />
        Logout Session
      </button>
    </div>
  );
}

export default ManagementSidebar;