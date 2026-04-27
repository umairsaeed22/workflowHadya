// src/components/management/ReportsView.jsx

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Eye,
  Calendar,
  Building2
} from "lucide-react";
import toast from "react-hot-toast";
import { getAllContractsForManagement } from "../../services/api";

function ReportsView() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  /*
    Selected Contract Report Modal
  */
  const [selectedContract, setSelectedContract] =
    useState(null);

  useEffect(() => {
    fetchAllContracts();
  }, []);

  /*
    FETCH ALL CONTRACTS
  */
  const fetchAllContracts = async () => {
    try {
      const res =
        await getAllContractsForManagement();

      setContracts(res.data.contracts || []);
    } catch (err) {
      toast.error(
        err.response?.data?.msg ||
          "Failed to fetch reports"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Reports Dashboard
      </h1>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <motion.div className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl shadow-2xl p-6">
          <div className="flex items-center gap-3">
            <FileText />
            <h2 className="font-semibold">
              Total Contracts
            </h2>
          </div>

          <p className="text-4xl font-bold mt-4">
            {contracts.length}
          </p>
        </motion.div>
      </div>

      {/* CONTRACT CARDS */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl shadow-2xl p-6">
        <h2 className="text-xl font-bold mb-6">
          All Contract Reports
        </h2>

        {loading ? (
          <p className="text-white/70">
            Loading reports...
          </p>
        ) : contracts.length === 0 ? (
          <p className="text-white/70">
            No contracts found
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {contracts.map((contract) => (
              <div
                key={contract._id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Building2 size={20} />
                  <h3 className="text-lg font-semibold">
                    {contract.customerName}
                  </h3>
                </div>

                <div className="space-y-2 text-sm text-white/80">
                  <p>
                    <strong>Total:</strong>{" "}
                    {contract.totalAmount}
                  </p>

                  <p>
                    <strong>SOA:</strong>{" "}
                    {contract.SOAStatus}
                  </p>

                  <p>
                    <strong>Department:</strong>{" "}
                    {contract.currentDepartment}
                  </p>

                  <p>
                    <strong>Stage:</strong>{" "}
                    {contract.currentStage}
                  </p>
                </div>

                <button
                  onClick={() =>
                    setSelectedContract(contract)
                  }
                  className="mt-5 flex items-center gap-2 bg-[#7f6421] hover:opacity-90 text-white px-4 py-2 rounded-xl font-medium transition"
                >
                  <Eye size={18} />
                  View Report
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REPORT MODAL */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0d1a4a] border border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Contract Report
              </h2>

              <button
                onClick={() =>
                  setSelectedContract(null)
                }
                className="bg-white/10 px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-3">
                {selectedContract.customerName}
              </h3>

              <div className="space-y-2 text-white/80">
                <p>
                  Total Amount:{" "}
                  {selectedContract.totalAmount}
                </p>

                <p>
                  Paid Amount:{" "}
                  {selectedContract.paidAmount}
                </p>

                <p>
                  SOA Status:{" "}
                  {selectedContract.SOAStatus}
                </p>

                <p>
                  Current Department:{" "}
                  {
                    selectedContract.currentDepartment
                  }
                </p>

                <p>
                  Current Stage:{" "}
                  {selectedContract.currentStage}
                </p>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-5">
              Contract History
            </h3>

            {!selectedContract.history ||
            selectedContract.history.length ===
              0 ? (
              <p className="text-white/70">
                No history found
              </p>
            ) : (
              <div className="space-y-4">
                {selectedContract.history.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="border border-white/10 bg-white/5 rounded-2xl p-5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={16} />
                        <p className="text-sm text-white/70">
                          {new Date(
                            item.timestamp
                          ).toLocaleString()}
                        </p>
                      </div>

                      <p>
                        <strong>State:</strong>{" "}
                        {item.state}
                      </p>

                      <p>
                        <strong>Department:</strong>{" "}
                        {item.department}
                      </p>

                      <p>
                        <strong>Action:</strong>{" "}
                        {item.action}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsView;