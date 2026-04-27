// src/pages/FinanceDashboard.jsx

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  LogOut,
  Bell,
  DollarSign,
  CheckCircle,
  Mail
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  getAllContracts,
  confirmPaymentAndPOP
} from "../services/api";

function FinanceDashboard() {
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  /*
    CHECK LOGIN + ACCESS
  */
  const checkAccess = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login first");
      navigate("/");
      return;
    }

    try {
      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      if (
        payload.department?.toLowerCase() !==
        "finance"
      ) {
        toast.error(
          "Access denied. Finance only."
        );
        navigate("/");
        return;
      }

      fetchContracts("finance");
    } catch (error) {
      localStorage.removeItem("token");
      toast.error(
        "Invalid session. Please login again."
      );
      navigate("/");
    }
  };

  /*
    FETCH CONTRACTS
  */
  const fetchContracts = async (department) => {
    try {
      const res =
        await getAllContracts(department);

      setContracts(
        res.data.contracts || []
      );
    } catch (err) {
      toast.error(
        err.response?.data?.msg ||
          "Failed to fetch contracts"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
    RELEASE REFUND + POP
  */
  const handleReleaseRefund = async (
    contract
  ) => {
    try {
      setProcessingId(contract._id);

      const payload = {
        popReference: `POP-${Date.now()}`,
        paymentNotes: `Refund released for ${contract.customerName}`
      };

      const res =
        await confirmPaymentAndPOP(
          contract._id,
          payload
        );

      toast.success(res.data.msg);

      // refresh data after success
      fetchContracts("finance");
    } catch (err) {
      toast.error(
        err.response?.data?.msg ||
          "Failed to release refund"
      );
    } finally {
      setProcessingId(null);
    }
  };

  /*
    LOGOUT
  */
  const handleLogout = () => {
    localStorage.removeItem("token");

    toast.success(
      "Logged out successfully"
    );

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <div className="bg-white shadow-sm px-8 py-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Finance Dashboard
          </h1>

          <p className="text-sm text-gray-500">
            Finance Department Contracts
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative bg-slate-100 p-3 rounded-lg hover:bg-slate-200 transition">
            <Bell size={20} />

            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Total Contracts */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow p-6"
          >
            <div className="flex items-center gap-3">
              <FileText />
              <h2 className="font-semibold">
                Total Contracts
              </h2>
            </div>

            <p className="text-3xl font-bold mt-4">
              {contracts.length}
            </p>
          </motion.div>

          {/* Refund Pending */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow p-6"
          >
            <div className="flex items-center gap-3">
              <DollarSign />
              <h2 className="font-semibold">
                Refund Pending
              </h2>
            </div>

            <p className="text-3xl font-bold mt-4">
              {
                contracts.filter(
                  (c) =>
                    c.SOAStatus ===
                    "Positive"
                ).length
              }
            </p>
          </motion.div>

          {/* Processed Cases */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow p-6"
          >
            <div className="flex items-center gap-3">
              <CheckCircle />
              <h2 className="font-semibold">
                Processed Cases
              </h2>
            </div>

            <p className="text-3xl font-bold mt-4">
              {
                contracts.filter(
                  (c) =>
                    c.currentStage ===
                    "completed_pending_survey"
                ).length
              }
            </p>
          </motion.div>
        </div>

        {/* CONTRACT CARDS */}
        <div>
          <h2 className="text-xl font-bold mb-6">
            Finance Contracts
          </h2>

          {loading ? (
            <p>Loading contracts...</p>
          ) : contracts.length === 0 ? (
            <p>
              No contracts available for
              Finance Department
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contracts.map((contract) => (
                <motion.div
                  key={contract._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-2xl shadow p-6"
                >
                  <h3 className="text-lg font-bold mb-4">
                    {contract.customerName}
                  </h3>

                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Total:</strong>{" "}
                      {contract.totalAmount}
                    </p>

                    <p>
                      <strong>Paid:</strong>{" "}
                      {contract.paidAmount}
                    </p>

                    <p>
                      <strong>Balance:</strong>{" "}
                      {Math.abs(
                        contract.depositAmount
                      )}
                    </p>

                    <p>
                      <strong>SOA:</strong>{" "}
                      {contract.SOAStatus}
                    </p>

                    <p>
                      <strong>Guarantee:</strong>{" "}
                      {contract.hasGuarantee
                        ? contract.guaranteeType
                        : "No"}
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs">
                        {contract.currentStage}
                      </span>
                    </p>
                  </div>

                  {/* ACTION BUTTON */}
                  <button
                    onClick={() =>
                      handleReleaseRefund(
                        contract
                      )
                    }
                    disabled={
                      processingId ===
                      contract._id
                    }
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl disabled:opacity-50"
                  >
                    <Mail size={18} />

                    {processingId ===
                    contract._id
                      ? "Processing..."
                      : "Release Refund"}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinanceDashboard;