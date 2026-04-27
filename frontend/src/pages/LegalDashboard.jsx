// src/pages/LegalDashboard.jsx

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  LogOut,
  Scale,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getAllContracts,
  deactivateGuarantee
} from "../services/api";

/*
  REUSABLE CONFIRM MODAL
*/
function NajizConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  contract,
  loading
}) {
  if (!isOpen || !contract) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">
          Deactivate Guarantee Note
        </h2>

        <p className="text-gray-600 mb-6">
          Are you sure you want to deactivate
          the guarantee note for{" "}
          <span className="font-semibold">
            {contract.customerName}
          </span>
          ?
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p>
            <strong>Guarantee Type:</strong>{" "}
            {contract.guaranteeType || "N/A"}
          </p>

          <p>
            <strong>Current Stage:</strong>{" "}
            {contract.currentStage}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-200 py-3 rounded-lg font-medium"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium"
          >
            {loading
              ? "Processing..."
              : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LegalDashboard() {
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedContract, setSelectedContract] =
    useState(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [processingId, setProcessingId] =
    useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  /*
    CHECK ACCESS
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
      "legal"
    ) {
      toast.error(
        "Access denied. Legal only."
      );
      navigate("/");
      return;
    }

    fetchContracts(
      payload.department?.toLowerCase()
    );
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
    OPEN MODAL
  */
  const openDeactivateModal = (contract) => {
    setSelectedContract(contract);
    setModalOpen(true);
  };

  /*
    CLOSE MODAL
  */
  const closeDeactivateModal = () => {
    setSelectedContract(null);
    setModalOpen(false);
  };

  /*
    HIT NAJIZ API
  */
  const handleDeactivate = async () => {
    if (!selectedContract) return;

    try {
      setProcessingId(
        selectedContract._id
      );

      const res =
        await deactivateGuarantee(
          selectedContract._id,
          selectedContract.guaranteeType
        );

      toast.success(res.data.msg);

      closeDeactivateModal();

      /*
        refresh contracts
      */
      fetchContracts("legal");
    } catch (err) {
      toast.error(
        err.response?.data?.msg ||
        "Failed to deactivate guarantee"
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
      {/* MODAL */}
      <NajizConfirmModal
        isOpen={modalOpen}
        onClose={closeDeactivateModal}
        onConfirm={handleDeactivate}
        contract={selectedContract}
        loading={
          processingId ===
          selectedContract?._id
        }
      />

      {/* HEADER */}
      <div className="bg-white shadow-sm px-8 py-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Legal Dashboard
          </h1>

          <p className="text-sm text-gray-500">
            Legal Department Contracts
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      <div className="p-8">
        {/* STATS */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center gap-3">
              <FileText />
              <h2 className="font-semibold">
                Total Contracts
              </h2>
            </div>

            <p className="text-3xl font-bold mt-4">
              {contracts.length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center gap-3">
              <Scale />
              <h2 className="font-semibold">
                Ejar Uploaded
              </h2>
            </div>

            <p className="text-3xl font-bold mt-4">
              {
                contracts.filter(
                  (c) =>
                    c.currentStage ===
                    "ejar_uploaded"
                ).length
              }
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center gap-3">
              <CheckCircle />
              <h2 className="font-semibold">
                Legal Review
              </h2>
            </div>

            <p className="text-3xl font-bold mt-4">
              {
                contracts.filter(
                  (c) =>
                    c.currentDepartment ===
                    "legal"
                ).length
              }
            </p>
          </div>
        </div>

        {/* CONTRACT CARDS */}
        {loading ? (
          <p>Loading contracts...</p>
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
                    {contract.SOABalance}
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

                  {/* ADD THESE 2 FIELDS */}
                  <p>
                    <strong>Current Stage:</strong>{" "}
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs">
                      {contract.currentStage}
                    </span>
                  </p>

                  <p>
                    <strong>Current Department:</strong>{" "}
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs">
                      {contract.currentDepartment}
                    </span>
                  </p>
                </div>

                {contract.hasGuarantee ? (
                  <button
                    onClick={() =>
                      openDeactivateModal(
                        contract
                      )
                    }
                    className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium"
                  >
                    Deactivate Guarantee Note
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full mt-6 bg-gray-300 text-gray-500 py-3 rounded-lg font-medium cursor-not-allowed"
                  >
                    No Guarantee Available
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LegalDashboard;