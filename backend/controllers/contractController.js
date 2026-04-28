// controllers/contractController.js

const Contract = require("../models/Contract");
const Notification = require("../models/Notification");

exports.createContract = async (req, res) => {
  try {
    const {
      customerName,
      totalAmount,
      paidAmount,
      depositAmount,
      hasGuarantee,
      guaranteeType,
      hasEjar,
      damageAmount,
      hasRemainingDebt,
      SOABalance,
      SOAStatus,
      currentStage,      // Take directly from body
      currentDepartment  // Take directly from body
    } = req.body;

    const contract = await Contract.create({
      customerName,
      totalAmount,
      paidAmount,
      depositAmount,
      hasGuarantee,
      guaranteeType,
      hasEjar,
      SOABalance: SOABalance || 0,
      SOAStatus: SOAStatus || "Positive",
      damageAmount: damageAmount || 0,
      hasRemainingDebt: hasRemainingDebt || false,

      // Use the department and stage provided in the request body
      // Default to management if not provided
      currentStage: currentStage || "management_approval",
      currentDepartment: currentDepartment || "management",
      
      createdBy: req.user.id,
      history: [
        {
          state: (currentStage || "management_approval").toUpperCase(),
          department: currentDepartment || "management",
          action: "Contract Initiated via Payload",
          user: req.user.id
        }
      ]
    });

    /* CREATE NOTIFICATION */
    // This will now correctly alert the department specified in your test payload
    await Notification.create({
      title: "New Task Assigned",
      message: `Contract for ${contract.customerName} requires ${contract.currentDepartment} action`,
      department: contract.currentDepartment,
      contractId: contract._id
    });

    res.json({
      msg: `Contract created in ${contract.currentDepartment} department`,
      contract
    });

  } catch (err) {
    console.error("Creation Error:", err);
    res.status(500).json({ msg: err.message });
  }
};
// controllers/contractController.js

exports.getAllContracts = async (req, res) => {
  try {
    const { department } = req.query;

    const filter = department
      ? { currentDepartment: department.toLowerCase() }
      : {};

    const contracts = await Contract.find(filter)
      // keep ALL required fields (no data loss)
      .select("-__v") // removes only mongoose noise (safe)
      .populate({
        path: "createdBy",
        select: "name email",
        options: { lean: true } // faster populate
      })
      .sort({ createdAt: -1 })
      .lean(); // 🚀 big performance boost

    return res.json({
      total: contracts.length,
      contracts
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message
    });
  }
};

exports.getAllContractsForManagement = async (req, res) => {
  try {
    /*
      Fetch all contracts
      without department filtering
    */
    const contracts = await Contract.find()
      .sort({ createdAt: -1 });

    return res.json({
      contracts
    });

  } catch (err) {
    res.status(500).json({
      msg: err.message
    });
  }
};

/*
MANAGEMENT APPROVE API
positive flow:
hasGuarantee = true
hasEjar = true
*/

exports.approveContract = async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({
        msg: "Contract not found"
      });
    }

    /* MANAGEMENT APPROVAL LOGIC (POSITIVE SOA FLOW)
      Reporting Point: SOA_CHECKED is the entry point for all these cases.
    */

    // --- CASE 1: POSITIVE SOA + HAS GUARANTEE + HAS EJAR ---
    // Path: Management -> Leasing (To decide if refundable)
    if (
      contract.SOAStatus === "Positive" &&
      contract.hasGuarantee === true &&
      contract.hasEjar === true
    ) {
      contract.currentDepartment = "leasing";
      contract.currentStage = "pending_leasing_decision";

      contract.history.push({
        state: "SOA_CHECKED",
        department: "management",
        action: "Manager approved: Positive SOA with Ejar. Sent to Leasing for refund decision.",
        user: req.user.id
      });

      await contract.save();

      await Notification.create({
        title: "Refund Decision Required",
        message: `Contract for ${contract.customerName} (Ejar) moved to Leasing for refund eligibility check.`,
        department: "leasing",
        contractId: contract._id
      });

      return res.json({
        msg: "Contract approved and sent to Leasing Department",
        contract
      });
    }

    // --- CASE 2: POSITIVE SOA + HAS GUARANTEE + NO EJAR ---
    // Path: Management -> Legal (To deactivate PN/BG directly)
    if (
      contract.SOAStatus === "Positive" &&
      contract.hasGuarantee === true &&
      contract.hasEjar === false
    ) {
      contract.currentDepartment = "legal";
      contract.currentStage = "pending_deactivation";

      contract.history.push({
        state: "SOA_CHECKED",
        department: "management",
        action: "Manager approved: Positive SOA (No Ejar). Sent to Legal for PN/BG deactivation.",
        user: req.user.id
      });

      await contract.save();

      await Notification.create({
        title: "Legal Action Required",
        message: `Contract for ${contract.customerName} requires Legal to deactivate security (No Ejar).`,
        department: "legal",
        contractId: contract._id
      });

      return res.json({
        msg: "Contract approved and sent to Legal Department",
        contract
      });
    }

    // --- CASE 3: POSITIVE SOA + NO GUARANTEE / NO DEPOSIT ---
    // Path: Management -> Finance (Direct to POP)
    if (
      contract.SOAStatus === "Positive" && 
      contract.hasGuarantee === false
    ) {
      contract.currentDepartment = "finance";
      contract.currentStage = "pending_payment";

      contract.history.push({
        state: "SOA_CHECKED",
        department: "management",
        action: "Manager approved: No guarantee found. Sent directly to Finance for POP/Payment.",
        user: req.user.id
      });

      await contract.save();

      await Notification.create({
        title: "Payment Processing Required",
        message: `Contract for ${contract.customerName} has no security. Finance to process refund/POP.`,
        department: "finance",
        contractId: contract._id
      });

      return res.json({
        msg: "No guarantee found. Contract sent directly to Finance for payment.",
        contract
      });
    }

    /*
      DEFAULT REJECTION
      If it hits here, it's either a Negative SOA or an unhandled condition.
    */
    return res.status(400).json({
      msg: "Approval conditions not matched. Ensure SOA is Positive."
    });

  } catch (err) {
    res.status(500).json({
      msg: err.message
    });
  }
};

// controllers/contractController.js

exports.rejectAndProcessNegative = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      damageAmount = 0,
      hasRemainingDebt = false
    } = req.body;

    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({
        msg: "Contract not found"
      });
    }

    /* 1. Update values from the Manager's input */
    contract.damageAmount = damageAmount;
    contract.hasRemainingDebt = hasRemainingDebt;

    /*
      STEP 1: INITIAL REJECTION LOGGING
      REPORTING POINT: SOA_CHECKED (Negative)
    */
    contract.history.push({
      state: "SOA_CHECKED",
      department: "management",
      action: `Negative SOA confirmed. Damages: ${damageAmount}. Starting negative flow.`,
      user: req.user.id
    });

    /*
      =====================================================
      CASE 1: GUARANTEE LOGIC (Keep existing logic)
      =====================================================
    */
    if (contract.hasGuarantee) {
      if (damageAmount > contract.depositAmount) {
        contract.currentDepartment = "leasing";
        contract.currentStage = "refund_adjustment_pending";

        contract.history.push({
          state: "INSUFFICIENT_BALANCE",
          department: "leasing",
          action: `Damage amount (${damageAmount}) exceeds balance (${contract.depositAmount}). Sent to Leasing for adjustment/collection.`,
          user: req.user.id
        });
      } else {
        contract.currentDepartment = "operations";
        contract.currentStage = "operations_send_confirmation_email";

        contract.history.push({
          state: "BALANCE_COVERED",
          department: "operations",
          action: `Damage amount (${damageAmount}) covered by balance (${contract.depositAmount}). Sent to Operations for confirmation email.`,
          user: req.user.id
        });
      }
    }

    /*
      =====================================================
      CASE 2: NO GUARANTEE FLOW (Updated logic)
      =====================================================
    */
    else {
      if (!hasRemainingDebt) {
        /* No Debt + No Guarantee -> Finance Closure */
        contract.currentDepartment = "finance";
        contract.currentStage = "financial_clearance";

        contract.history.push({
          state: "NO_REMAINING_DEBT",
          department: "finance",
          action: "No remaining debt found. Moving to Finance for closure process.",
          user: req.user.id
        });
      } else {
        /* Debt exists + No Guarantee:
           Route to LEGAL for management approval of court filing
        */
        contract.currentDepartment = "legal";
        contract.currentStage = "management_approval";

        contract.history.push({
          state: "LEGAL_ACTION_REQUIRED",
          department: "legal",
          action: "No guarantee found. Approved from Management and Now ready for Long-Term Court Filing.",
          user: req.user.id
        });
      }
    }

    // Save changes (This triggers the pre-save hook for SOABalance)
    await contract.save();

    return res.json({
      msg: "Negative flow processed successfully",
      data: {
        contractId: contract._id,
        customerName: contract.customerName,
        damageAmount: contract.damageAmount,
        depositAmount: contract.depositAmount,
        SOABalance: contract.SOABalance,
        currentDepartment: contract.currentDepartment,
        currentStage: contract.currentStage
      }
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: err.message
    });
  }
};

// Add this to your existing contractController.js
exports.updateContractStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      currentDepartment, 
      currentStage, 
      historyAction 
    } = req.body;

    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({ msg: "Contract not found" });
    }

    // Update the Routing
    if (currentDepartment) contract.currentDepartment = currentDepartment;
    if (currentStage) contract.currentStage = currentStage;

    // Log the action to history
    contract.history.push({
      state: currentStage.toUpperCase(),
      department: "operations", // This API is being called by Operations
      action: historyAction || `Moved to ${currentDepartment}`,
      user: req.user.id // From auth middleware
    });

    await contract.save();

    res.json({
      msg: "Status updated successfully",
      contract
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

// controllers/contractController.js

exports.getManagementStats = async (req, res) => {
  try {
    const statsAgg = await Contract.aggregate([
      {
        $group: {
          _id: null,

          total: { $sum: 1 },

          positive: {
            $sum: {
              $cond: [{ $eq: ["$SOAStatus", "Positive"] }, 1, 0]
            }
          },

          negative: {
            $sum: {
              $cond: [{ $eq: ["$SOAStatus", "Negative"] }, 1, 0]
            }
          },

          unsecured: {
            $sum: {
              $cond: [{ $eq: ["$hasGuarantee", false] }, 1, 0]
            }
          },

          guaranteed: {
            $sum: {
              $cond: [{ $eq: ["$hasGuarantee", true] }, 1, 0]
            }
          },

          refundable: {
            $sum: {
              $cond: [{ $gt: ["$depositAmount", 0] }, 1, 0]
            }
          },

          nonRefundable: {
            $sum: {
              $cond: [{ $lte: ["$depositAmount", 0] }, 1, 0]
            }
          },

          totalValue: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalDeposit: { $sum: "$depositAmount" },
          totalDamage: { $sum: "$damageAmount" },

          management: {
            $sum: {
              $cond: [{ $eq: ["$currentDepartment", "management"] }, 1, 0]
            }
          },

          operations: {
            $sum: {
              $cond: [{ $eq: ["$currentDepartment", "operations"] }, 1, 0]
            }
          },

          leasing: {
            $sum: {
              $cond: [{ $eq: ["$currentDepartment", "leasing"] }, 1, 0]
            }
          },

          finance: {
            $sum: {
              $cond: [{ $eq: ["$currentDepartment", "finance"] }, 1, 0]
            }
          },

          legal: {
            $sum: {
              $cond: [{ $eq: ["$currentDepartment", "legal"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const data = statsAgg[0] || {};

    const stats = {
      total: data.total || 0,
      positive: data.positive || 0,
      negative: data.negative || 0,
      unsecured: data.unsecured || 0,
      guaranteed: data.guaranteed || 0,
      refundable: data.refundable || 0,
      nonRefundable: data.nonRefundable || 0,

      financials: {
        totalValue: data.totalValue || 0,
        totalPaid: data.totalPaid || 0,
        totalDeposit: data.totalDeposit || 0,
        totalDamage: data.totalDamage || 0
      },

      departmentDistribution: {
        management: data.management || 0,
        operations: data.operations || 0,
        leasing: data.leasing || 0,
        finance: data.finance || 0,
        legal: data.legal || 0
      }
    };

    return res.json({
      msg: "Management stats fetched successfully",
      stats
    });

  } catch (err) {
    console.error("Stats Error:", err);

    return res.status(500).json({
      msg: "Failed to fetch stats"
    });
  }
};