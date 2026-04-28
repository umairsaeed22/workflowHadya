import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, FileWarning, AlertCircle, Loader2, Gavel } from "lucide-react";

function EjarNegativeUploadModal({ isOpen, onClose, onSubmit, contract }) {
  const [hoFile, setHoFile] = useState(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hoFile) return;

    const formData = new FormData();
    formData.append("hoFile", hoFile);
    formData.append("amount", amount);

    try {
      setSubmitting(true);
      await onSubmit(formData);
      
      setTimeout(() => {
        setSubmitting(false);
        setHoFile(null);
        onClose();
      }, 1500);
    } catch (err) {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-red-100"
      >
        {/* Urgent Header */}
        <div className="p-6 border-b border-red-50 flex justify-between items-center bg-red-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <AlertCircle size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Negative Claim</h2>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Debt & Damage Processing</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900 shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {submitting ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20"></div>
                  <div className="relative bg-white p-5 rounded-full shadow-xl border border-slate-50">
                    <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Processing Claim</h3>
                <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-[240px]">
                  Filing damage reports and updating legal ledger...
                </p>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Custom File Upload */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                    Damage Evidence (Handover PDF)
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setHoFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      required
                    />
                    <div className={`
                      border-2 border-dashed rounded-[24px] p-8 text-center transition-all
                      ${hoFile 
                        ? 'border-red-500 bg-red-50/30' 
                        : 'border-slate-200 bg-slate-50 group-hover:border-red-300 group-hover:bg-red-50/20'}
                    `}>
                      {hoFile ? (
                        <div className="flex flex-col items-center text-red-600">
                          <FileWarning className="mb-2" size={32} />
                          <p className="text-xs font-black truncate max-w-full px-4 italic">{hoFile.name}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <UploadCloud className="mb-2 group-hover:scale-110 transition-transform" size={32} />
                          <p className="text-xs font-bold uppercase tracking-tighter">Upload evidence file</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                    Claim Amount (SAR)
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400">
                      <Gavel size={18} />
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-red-600"
                      placeholder="Enter claim value"
                      required
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all"
                  >
                    Dismiss
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Execute Claim
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default EjarNegativeUploadModal;