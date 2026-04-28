import { useEffect, useState } from "react";
import {
  FileText, ShieldCheck, AlertCircle,
  Search, Filter, CheckCircle2, Info,
  ShieldAlert, Landmark, Wallet, Activity,
  ArrowUpRight, TrendingUp, Receipt, Gavel,
  ArrowLeft, ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getAllContracts,
  approveContract,
  rejectAndProcessNegative,
  getManagementStats
} from "../../services/api";

function SOAView({ showStats = true }) {
  const [contracts, setContracts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [guaranteeFilter, setGuaranteeFilter] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contractsRes, statsRes] = await Promise.all([
        getAllContracts("management"),
        getManagementStats()
      ]);
      setContracts(contractsRes.data.contracts || []);
      setStats(statsRes.data.stats || null);
    } catch (err) {
      toast.error("Intelligence Sync Error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contract) => {
    try {
      setApprovingId(contract._id);
      let res = contract.SOAStatus === "Positive"
        ? await approveContract(contract._id)
        : await rejectAndProcessNegative(contract._id, {
          damageAmount: contract.damageAmount || 0,
          hasRemainingDebt: contract.hasRemainingDebt || false
        });

      toast.success(res.data?.msg || "Action Certified");
      fetchData(); 
    } catch (err) {
      toast.error("Authorization Failed");
    } finally {
      setApprovingId(null);
    }
  };

  // Logic for Filtering
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || c._id.includes(searchQuery);
    const matchesStatus = statusFilter === "All" || c.SOAStatus === statusFilter;
    const matchesGuarantee = guaranteeFilter === "All"
      ? true
      : guaranteeFilter === "Secured" ? (c.hasGuarantee || c.hasEjar) : (!c.hasGuarantee && !c.hasEjar);
    return matchesSearch && matchesStatus && matchesGuarantee;
  });

  // Logic for Pagination
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredContracts.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, guaranteeFilter]);

  if (loading && !stats) return <div className="p-20 text-center font-black text-gray-200 animate-pulse tracking-widest uppercase">Initializing Secure Ledger...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* 1. CONDITIONAL SUMMARY ROWS */}
      {showStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Total Portfolio"
              value={`${((stats?.financials?.totalValue || 0) / 1000).toFixed(1)}k`}
              subText="Gross SAR"
              icon={<Landmark size={20} />}
              color="gray"
            />
            <StatCard
              label="Collection Gap"
              value={`${(((stats?.financials?.totalValue || 0) - (stats?.financials?.totalPaid || 0)) / 1000).toFixed(1)}k`}
              subText="Pending SAR"
              icon={<TrendingUp size={20} />}
              color="red"
            />
            <StatCard
              label="Security Pool"
              value={`${((stats?.financials?.totalDeposit || 0) / 1000).toFixed(1)}k`}
              subText="Cash Deposits"
              icon={<ShieldCheck size={20} />}
              color="green"
            />
            <StatCard
              label="Risk Exposure"
              value={stats?.unsecured || 0}
              subText="Unsecured Cases"
              icon={<ShieldAlert size={20} />}
              color="amber"
            />
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Global Workload Distribution</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Real-time status across all units</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl text-[10px] font-black text-green-600 uppercase">
                <Activity size={12} className="animate-pulse" /> Live Ledger
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats?.departmentDistribution || {}).map(([dept, count]) => (
                <div
                  key={dept}
                  className="p-5 rounded-[24px] bg-[#7f6421]/[0.04] border border-[#7f6421]/10 hover:border-[#7f6421]/40 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  <p className="text-[10px] font-black text-[#7f6421]/60 uppercase tracking-tighter mb-2 group-hover:text-[#7f6421] transition-colors">{dept}</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-black text-gray-900 leading-none group-hover:text-[#7f6421] transition-colors">{count}</p>
                    <p className="text-[10px] font-bold text-gray-400 pb-1">Tasks</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 2. FILTER & TABLE SECTION */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search active management queue..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#7f6421]/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:block">
              {filteredContracts.length} Results
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase px-4 py-2.5 outline-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Flows</option>
              <option value="Positive">Positive Only</option>
              <option value="Negative">Negative Only</option>
            </select>

            <select
              className="bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase px-4 py-2.5 outline-none cursor-pointer"
              value={guaranteeFilter}
              onChange={(e) => setGuaranteeFilter(e.target.value)}
            >
              <option value="All">All Risk</option>
              <option value="Secured">Secured (Ejar/Guar)</option>
              <option value="Unsecured">Unsecured Only</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest">
                <th className="px-8 py-5">Entity Information</th>
                <th className="px-8 py-5">Financial Position</th>
                <th className="px-8 py-5">Legal Assets</th>
                <th className="px-8 py-5">Audit Status</th>
                <th className="px-8 py-5 text-right">Executive Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentItems.map(c => (
                <tr key={c._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="font-bold text-gray-900">{c.customerName}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 tracking-tighter uppercase">Ref: {c._id.slice(-8)}</p>
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg text-gray-400"><Receipt size={14} /></div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{c.totalAmount?.toLocaleString()} SAR</p>
                        <p className="text-[12px] text-gray-400 font-bold uppercase tracking-tighter">Balance: {c.SOABalance || 0}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-2">
                      {c.hasGuarantee && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                          <Landmark size={10} /> {c.guaranteeType}
                        </span>
                      )}
                      {c.hasEjar && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase tracking-tighter">
                          <Gavel size={10} /> Ejar Active
                        </span>
                      )}
                      {!c.hasGuarantee && !c.hasEjar && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-tighter">Unsecured</span>
                      )}
                    </div>
                  </td>

                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${c.SOAStatus === 'Positive' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${c.SOAStatus === 'Positive' ? 'bg-green-500' : 'bg-red-500'}`} />
                      {c.SOAStatus}
                    </span>
                  </td>

                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => handleApprove(c)}
                      disabled={approvingId === c._id}
                      className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-sm ${c.SOAStatus === 'Positive'
                          ? 'bg-gray-900 text-white hover:bg-[#7f6421]'
                          : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                    >
                      {approvingId === c._id ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ShieldCheck size={14} />}
                      {c.SOAStatus === "Positive" ? "Authorize" : "Execute Recovery"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 3. PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="px-8 py-4 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredContracts.length)} of {filteredContracts.length} entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-[#7f6421] transition-all"
                >
                  <ArrowLeft size={18} />
                </button>
                
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                        currentPage === i + 1 
                        ? "bg-[#7f6421] text-white shadow-md scale-105" 
                        : "bg-white text-gray-400 border border-gray-100 hover:border-[#7f6421]/30"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-[#7f6421] transition-all"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, subText }) {
  const colors = {
    blue: "text-blue-500 bg-blue-50",
    green: "text-green-500 bg-green-50",
    red: "text-red-500 bg-red-50",
    amber: "text-amber-500 bg-amber-50",
    gray: "text-gray-500 bg-gray-50"
  };

  return (
    <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-start justify-between group hover:border-[#7f6421]/20 transition-all">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
        <p className="text-[9px] font-bold text-gray-300 uppercase mt-1">{subText}</p>
      </div>
      <div className={`p-3 rounded-2xl ${colors[color] || colors.gray} transition-transform group-hover:scale-110 shadow-sm`}>
        {icon}
      </div>
    </div>
  );
}

export default SOAView;