// controllers/contractController.js

const Contract = require("../models/Contract");
const Notification = require("../models/Notification");

exports.createContract = async (req, res) => {
  try {
    const contract = await Contract.create({
      customerName: req.body.customerName,
      totalAmount: req.body.totalAmount,
      paidAmount: req.body.paidAmount,
      depositAmount: req.body.depositAmount,
      hasGuarantee: req.body.hasGuarantee,
      guaranteeType: req.body.guaranteeType,
      hasEjar: req.body.hasEjar,
      
      // FIX: Added these fields to the create call
      damageAmount: req.body.damageAmount || 0,
      hasRemainingDebt: req.body.hasRemainingDebt || false,

      currentStage: "management_approval",
      currentDepartment: "management",
      createdBy: req.user.id,
      history: [
        {
          state: "SOA_CHECKED",
          department: "management",
          action: "SOA Initiated",
          user: req.user.id
        }
      ]
    });

    /* CREATE NOTIFICATION */
    await Notification.create({
      title: "New Contract Created",
      message: `New contract for ${contract.customerName} requires management approval`,
      department: "management",
      contractId: contract._id
    });

    res.json({
      msg: "Contract created",
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
    /*
      dynamic query based on department
      example:
      /api/contracts?department=operations
    */

    const { department } = req.query;

    let filter = {};

    // if department is passed, filter by currentDepartment
    if (department) {
      filter.currentDepartment =
        department.toLowerCase();
    }

    const contracts = await Contract.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      total: contracts.length,
      contracts
    });

  } catch (err) {
    res.status(500).json({
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

    /*
      Save optional values to contract
    */
    contract.damageAmount = damageAmount;
    contract.hasRemainingDebt = hasRemainingDebt;

    /*
      STEP 1: INITIAL REJECTION

      REPORTING POINT:
      SOA_CHECKED (Negative)
    */
    contract.history.push({
      state: "SOA_CHECKED",
      department: "management",
      action: `Negative SOA confirmed. Damages: ${damageAmount}. Moving to Operations for HO Technical Upload.`,
      user: req.user.id
    });

    /*
      Move to Operations first
    */
    contract.currentDepartment = "operations";
    contract.currentStage = "awaiting_ho_upload";

    /*
      CASE:
      No remaining debt

      → Skip legal recovery
      → Move directly to Finance
    */
    if (!hasRemainingDebt) {
      contract.currentDepartment = "finance";
      contract.currentStage = "financial_clearance";

      contract.history.push({
        state: "NO_REMAINING_DEBT",
        department: "finance",
        action: "No remaining debt found. Moving to Finance for closure process.",
        user: req.user.id
      });
    }

    /*
      CASE:
      Remaining debt exists
    */
    if (hasRemainingDebt) {
      /*
        No Guarantee
      */
      if (!contract.hasGuarantee) {
        contract.currentDepartment = "legal";
        contract.currentStage =
          "court_proceedings_initiated";

        contract.history.push({
          state: "LEGAL_ACTION_REQUIRED",
          department: "legal",
          action:
            "No guarantee found. Legal initiating standard court case.",
          user: req.user.id
        });
      }

      /*
        Has Guarantee
      */
      else {
        /*
          PN / Unified
        */
        if (
          contract.guaranteeType === "PN" ||
          contract.guaranteeType === "Unified"
        ) {
          contract.currentDepartment = "legal";
          contract.currentStage =
            "enforcement_court_15days";

          contract.history.push({
            state: "ENFORCEMENT_INITIATED",
            department: "legal",
            action: `Enforcement Court case filed (${contract.guaranteeType}). 15-day notice period started.`,
            user: req.user.id
          });
        }

        /*
          BG
        */
        else if (
          contract.guaranteeType === "BG"
        ) {
          contract.currentDepartment = "finance";
          contract.currentStage =
            "bg_liquidation_pending";

          contract.history.push({
            state: "FINANCE_CLAIM_INITIATED",
            department: "finance",
            action:
              "Bank Guarantee found. Finance to claim/liquidate funds with the bank.",
            user: req.user.id
          });
        }

        /*
          Manual
        */
        else if (
          contract.guaranteeType === "Manual"
        ) {
          contract.currentDepartment = "legal";
          contract.currentStage =
            "manual_court_long_term";

          contract.history.push({
            state: "LEGAL_COURT_LONG_TERM",
            department: "legal",
            action:
              "Manual contract found. Initiating long-term court proceedings.",
            user: req.user.id
          });
        }
      }
    }

    await contract.save();

    return res.json({
      msg: "Negative flow processed successfully",
      data: {
        contractId: contract._id,
        damageAmount,
        hasRemainingDebt,
        currentStage: contract.currentStage,
        currentDepartment:
          contract.currentDepartment
      }
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: err.message
    });
  }
};