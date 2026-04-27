// src/pages/LeasingDashboard.jsx

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  LogOut,
  Bell,
  Building2,
  CheckCircle,
  Upload,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getAllContracts,
  uploadToEjar
} from "../services/api";
import EjarUploadModal from "../components/EjarUploadModal";

function LeasingDashboard() {
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  /*
    MODAL STATE
  */
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] =
    useState(null);

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

    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    if (
      payload.department?.toLowerCase() !==
      "leasing"
    ) {
      toast.error(
        "Access denied. Leasing only."
      );
      navigate("/");
      return;
    }

    fetchContracts("leasing");
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
    OPEN EJAR MODAL (Refundable)
  */
  const handleRefundable = (contract) => {
    setSelectedContract(contract);
    setShowModal(true);
  };

  /*
    NON REFUNDABLE ACTION
  */
  const handleNonRefundable = (contract) => {
    toast.success(
      `${contract.customerName} marked as Non-Refundable`
    );
  };

  /*
    SUBMIT EJAR UPLOAD
  */
  const handleEjarSubmit = async (
    formData
  ) => {
    try {
      const res = await uploadToEjar(
        selectedContract._id,
        formData
      );

      toast.success(res.data.msg);

      setShowModal(false);
      setSelectedContract(null);

      fetchContracts("leasing");
    } catch (err) {
      toast.error(
        err.response?.data?.msg ||
          "Ejar upload failed"
      );
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
            Leasing Dashboard
          </h1>

          <p className="text-sm text-gray-500">
            Leasing Department Contracts
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow p-6"
          >
            <div className="flex items-center gap-3">
              <Building2 />
              <h2 className="font-semibold">
                Leasing Assigned
              </h2>
            </div>

            <p className="text-3xl font-bold mt-4">
              {
                contracts.filter(
                  (c) =>
                    c.currentDepartment ===
                    "leasing"
                ).length
              }
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl shadow p-6"
          >
            <div className="flex items-center gap-3">
              <CheckCircle />
              <h2 className="font-semibold">
                Approved Cases
              </h2>
            </div>

            <p className="text-3xl font-bold mt-4">
              {
                contracts.filter(
                  (c) =>
                    c.currentStage ===
                    "approved"
                ).length
              }
            </p>
          </motion.div>
        </div>

        {/* CONTRACT CARDS */}
        <div>
          <h2 className="text-xl font-bold mb-6">
            Leasing Contracts
          </h2>

          {loading ? (
            <p>Loading contracts...</p>
          ) : contracts.length === 0 ? (
            <p>
              No contracts available for
              Leasing Department
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
                      <strong>Ejar:</strong>{" "}
                      {contract.hasEjar
                        ? "Yes"
                        : "No"}
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs">
                        {contract.currentStage ===
                        "approved"
                          ? "Management Approved"
                          : contract.currentStage}
                      </span>
                    </p>

                    <p>
                      <strong>Department:</strong>{" "}
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs">
                        {
                          contract.currentDepartment
                        }
                      </span>
                    </p>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() =>
                        handleRefundable(
                          contract
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
                    >
                      <Upload size={18} />
                      Refundable
                    </button>

                    <button
                      onClick={() =>
                        handleNonRefundable(
                          contract
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-xl"
                    >
                      <XCircle size={18} />
                      Non-Refundable
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EJAR MODAL */}
      <EjarUploadModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedContract(null);
        }}
        onSubmit={handleEjarSubmit}
        contract={selectedContract}
      />
    </div>
  );
}

export default LeasingDashboard;