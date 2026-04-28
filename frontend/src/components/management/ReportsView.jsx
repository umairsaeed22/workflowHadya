import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, X, Building2, Search, CheckCircle2, 
  AlertTriangle, ArrowLeft, ArrowRight, ShieldCheck, 
  FileWarning, Download 
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getAllContractsForManagement } from "../../services/api";

function ReportsView() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const res = await getAllContractsForManagement();
      setContracts(res.data.contracts || []);
    } catch (e) { 
      toast.error("Sync Error"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus]);

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "All" || c.SOAStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const currentItems = filteredContracts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- PDF GENERATION LOGIC ---
  const downloadPDF = (contract) => {
    const doc = new jsPDF();
    const brandColor = [127, 100, 33]; // #7f6421

    // Header Section
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Audit Intelligence Report", 14, 22);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Customer Name: ${contract.customerName}`, 14, 32);
    doc.text(`Reference ID: ${contract._id}`, 14, 37);
    doc.text(`Generation Date: ${new Date().toLocaleString()}`, 14, 42);

    // Status Badge in PDF
    const isPositive = contract.SOAStatus === "Positive";
    doc.setFillColor(isPositive ? 240 : 255, isPositive ? 255 : 240, isPositive ? 240 : 240);
    doc.roundedRect(150, 15, 45, 12, 2, 2, 'F');
    doc.setTextColor(isPositive ? 21 : 185, isPositive ? 128 : 28, isPositive ? 61 : 28);
    doc.setFontSize(10);
    doc.text(contract.SOAStatus.toUpperCase(), 158, 23);

    // Prepare Table Rows
    const tableRows = (contract.history || []).map((h) => [
      new Date(h.timestamp).toLocaleDateString(),
      h.department.toUpperCase(),
      h.state?.replace(/_/g, ' '),
      h.action
    ]);

    // Generate Table
    autoTable(doc, {
      startY: 50,
      head: [['Date', 'Department', 'Protocol State', 'Action Details']],
      body: tableRows,
      headStyles: { 
        fillColor: brandColor, 
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: { 
        fontSize: 9,
        textColor: [50, 50, 50]
      },
      alternateRowStyles: {
        fillColor: [252, 252, 252]
      },
      margin: { top: 50 }
    });

    doc.save(`Audit_Report_${contract.customerName.replace(/\s+/g, '_')}.pdf`);
    toast.success("Audit Log Exported Successfully");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm animate-in fade-in duration-500">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Audit Intelligence</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time ledger monitoring</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input 
              type="text" placeholder="Quick search..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#7f6421]/10 w-64 transition-all outline-none"
            />
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            {["All", "Positive", "Negative"].map((status) => (
              <button
                key={status} onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  filterStatus === status ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-[#7f6421] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <motion.div key={`${filterStatus}-${currentPage}`} variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map(c => {
              const isPositive = c.SOAStatus === "Positive";
              return (
                <motion.div key={c._id} variants={itemVariants} className={`bg-white border rounded-[28px] p-6 hover:shadow-lg transition-shadow relative ${isPositive ? 'border-green-100' : 'border-red-100'}`}>
                  
                  <div className={`absolute top-6 right-6 px-3 py-1 rounded-full flex items-center gap-1.5 ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {isPositive ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
                    <span className="text-[9px] font-black uppercase">{c.SOAStatus}</span>
                  </div>

                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <Building2 size={20}/>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg truncate pr-16">{c.customerName}</h3>
                  <p className="text-[10px] text-gray-400 font-mono mb-4 uppercase tracking-tighter">{c._id}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded-2xl">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Total Value</p>
                      <p className="text-xs font-bold text-gray-900">{c.totalAmount?.toLocaleString()} <span className="text-[9px] text-gray-400">SAR</span></p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Current Dept</p>
                      <p className="text-xs font-bold text-[#7f6421] truncate uppercase tracking-tighter">{c.currentDepartment}</p>
                    </div>
                  </div>

                  <div className="bg-gray-900/5 p-4 rounded-2xl mb-6 flex items-center justify-around">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`p-1.5 rounded-lg ${c.hasEjar ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-400'}`}>
                        <ShieldCheck size={14} />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest">Ejar</span>
                    </div>
                    <div className="w-[1px] h-8 bg-gray-200" />
                    <div className="flex flex-col items-center gap-1">
                      <div className={`p-1.5 rounded-lg ${c.hasGuarantee ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-400'}`}>
                        <FileWarning size={14} />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest">Guarantee</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelected(c)} 
                    className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      isPositive ? 'bg-gray-900 text-white hover:bg-[#7f6421]' : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    Review Audit Log
                  </button>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-[#7f6421] transition-colors"><ArrowLeft size={20} /></button>
              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? "bg-[#7f6421] text-white shadow-lg" : "bg-white text-gray-400 border border-gray-100"}`}>{i + 1}</button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 rounded-xl bg-white border border-gray-100 text-gray-400 disabled:opacity-30 hover:text-[#7f6421] transition-colors"><ArrowRight size={20} /></button>
            </div>
          )}
        </>
      )}

      {/* History Modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSelected(null)} className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"/>
            <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:20, opacity:0}} className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-gray-100">
              
              {/* Modal Header with Download Button */}
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <div className="flex flex-col">
                  <h2 className="font-bold text-gray-900">History: {selected.customerName}</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Internal Ledger History</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => downloadPDF(selected)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#7f6421]/10 text-[#7f6421] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#7f6421] hover:text-white transition-all group"
                  >
                    <Download size={14} className="group-hover:scale-110 transition-transform" />
                    Export PDF
                  </button>
                  <button onClick={()=>setSelected(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={18}/></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {selected.history?.map((h, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 ${selected.SOAStatus === 'Positive' ? 'bg-green-500' : 'bg-red-500'}`}/>
                      <div className="w-[1px] flex-1 bg-gray-100 mt-2"/>
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-[#7f6421] uppercase bg-[#7f6421]/5 px-2 py-0.5 rounded tracking-tighter">{h.department}</span>
                        <span className="text-[9px] text-gray-300 font-mono">{new Date(h.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 uppercase tracking-tighter">{h.state?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-400 italic mt-1">"{h.action}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ReportsView;