// src/components/management/SOAView.jsx

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    FileText,
    ShieldCheck,
    Bell
} from "lucide-react";
import toast from "react-hot-toast";
import {
    getAllContracts,
    approveContract, // Positive flow
    rejectAndProcessNegative // Negative flow
} from "../../services/api";

function SOAView() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState(null);

    const [mainFilter, setMainFilter] = useState("all");
    const [subFilter, setSubFilter] = useState("all");

    useEffect(() => {
        fetchContracts("management");
    }, []);

    const fetchContracts = async (department) => {
        try {
            const res = await getAllContracts(department);
            setContracts(res.data.contracts || []);
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
      AUTO DECIDE ENDPOINT

      Positive SOA  -> approveContract()
      Negative SOA  -> rejectAndProcessNegative()
    */
    const handleApprove = async (contract) => {
        try {
            setApprovingId(contract._id);

            let res;

            /*
              POSITIVE FLOW
            */
            if (contract.SOAStatus === "Positive") {
                res = await approveContract(
                    contract._id
                );
            }

            /*
              NEGATIVE FLOW
            */
            else if (
                contract.SOAStatus === "Negative"
            ) {
                res =
                    await rejectAndProcessNegative(
                        contract._id,
                        {
                            /*
                              Optional fields
                              fallback defaults
                            */
                            damageAmount:
                                contract.damageAmount || 0,

                            hasRemainingDebt:
                                contract.hasRemainingDebt || false
                        }
                    );
            }

            toast.success(
                res.data?.msg ||
                "Contract processed successfully"
            );

            fetchContracts("management");
        } catch (err) {
            toast.error(
                err.response?.data?.msg ||
                err.message ||
                "Process failed"
            );
        } finally {
            setApprovingId(null);
        }
    };

    const filteredContracts = contracts.filter(
        (contract) => {
            const soa =
                contract.SOAStatus?.toLowerCase();

            if (
                mainFilter !== "all" &&
                soa !== mainFilter
            ) {
                return false;
            }

            if (mainFilter === "positive") {
                if (
                    subFilter === "guarantee" &&
                    !contract.hasGuarantee
                ) {
                    return false;
                }

                if (
                    subFilter === "no-guarantee" &&
                    contract.hasGuarantee
                ) {
                    return false;
                }
            }

            return true;
        }
    );

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">
                SOA Management
            </h1>

            {/* STATS */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                    {
                        title: "Total Contracts",
                        value: filteredContracts.length,
                        icon: <FileText />
                    },
                    {
                        title: "Positive SOA",
                        value: contracts.filter(
                            (c) =>
                                c.SOAStatus ===
                                "Positive"
                        ).length,
                        icon: <ShieldCheck />
                    },
                    {
                        title: "Negative SOA",
                        value: contracts.filter(
                            (c) =>
                                c.SOAStatus ===
                                "Negative"
                        ).length,
                        icon: <Bell />
                    }
                ].map((item, index) => (
                    <motion.div
                        key={index}
                        className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl shadow-2xl p-6"
                    >
                        <div className="flex items-center gap-3 text-white">
                            {item.icon}
                            <h2 className="font-semibold">
                                {item.title}
                            </h2>
                        </div>

                        <p className="text-4xl font-bold mt-4">
                            {item.value}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* TABLE */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>

                    <h2 className="text-xl font-bold">
                        Active SOA
                    </h2>
                </div>

                {loading ? (
                    <p className="text-white/70">
                        Loading contracts...
                    </p>
                ) : filteredContracts.length === 0 ? (
                    <p className="text-white/70">
                        No contracts found
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-left text-white/80">
                                    <th className="py-4 px-4">
                                        Customer
                                    </th>
                                    <th className="py-4 px-4">
                                        SOA Status
                                    </th>
                                    <th className="py-4 px-4">
                                        Guarantee
                                    </th>
                                    <th className="py-4 px-4">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredContracts.map(
                                    (contract) => (
                                        <tr
                                            key={contract._id}
                                            className="border-b border-white/10 hover:bg-white/5 transition"
                                        >
                                            <td className="py-4 px-4 font-medium">
                                                {
                                                    contract.customerName
                                                }
                                            </td>

                                            <td className="py-4 px-4">
                                                {
                                                    contract.SOAStatus
                                                }
                                            </td>

                                            <td className="py-4 px-4">
                                                {contract.hasGuarantee
                                                    ? contract.guaranteeType
                                                    : "No"}
                                            </td>

                                            <td className="py-4 px-4">
                                                <button
                                                    onClick={() =>
                                                        handleApprove(
                                                            contract
                                                        )
                                                    }
                                                    disabled={
                                                        approvingId ===
                                                        contract._id
                                                    }
                                                    className="bg-[#7f6421] hover:opacity-90 text-white px-4 py-2 rounded-xl font-medium transition"
                                                >
                                                    {approvingId ===
                                                        contract._id
                                                        ? "Processing..."
                                                        : contract.SOAStatus ===
                                                          "Negative"
                                                        ? "Process Negative"
                                                        : "Approve"}
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SOAView;