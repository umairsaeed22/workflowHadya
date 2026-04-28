const Contract = require("../models/Contract");

exports.uploadToEjar = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    /*
      DEBUG LOGS
    */
    console.log("contractId:", id);
    console.log("amount:", amount);
    console.log("file:", req.file);

    /*
      Validation
    */
    if (!req.file) {
      return res.status(400).json({
        msg: "HO PDF file is required"
      });
    }

    if (!amount) {
      return res.status(400).json({
        msg: "Amount is required"
      });
    }

    /*
      Find Contract
    */
    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({
        msg: "Contract not found"
      });
    }

    /*
      Dummy delay 2 sec
    */
    await new Promise((resolve) =>
      setTimeout(resolve, 2000)
    );

    /*
      Update contract after Ejar upload

      FLOW:
      Leasing → Legal

      REPORTING POINT:
      EJAR_HO_UPLOADED
    */
    contract.currentStage = "ejar_uploaded";
    contract.currentDepartment = "legal";

    /*
      HISTORY TRACKING
    */
    contract.history.push({
      state: "EJAR_HO_UPLOADED",
      department: "leasing",
      action: `HO uploaded to Ejar with amount ${amount}`,
      user: req.user.id
    });

    await contract.save();

    /*
      Response
    */
    return res.json({
      msg: "Successfully uploaded to Ejar and moved to Legal Department",
      data: {
        contractId: id,
        amount,
        fileName: req.file.filename,
        currentStage: contract.currentStage,
        currentDepartment: contract.currentDepartment
      }
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      msg: err.message
    });
  }
};

exports.uploadToEjarNegativeFlow = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body; // The amount officially registered in Ejar

    // 1. Validation
    if (!req.file) {
      return res.status(400).json({ msg: "HO PDF file is required" });
    }

    if (!amount) {
      return res.status(400).json({ msg: "Amount is required" });
    }

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ msg: "Contract not found" });
    }

    // 2. Dummy delay for processing simulation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    /* 3. DECISION LOGIC BASED ON FLOWCHART
       Check: Is there a remaining balance? (Using your SOABalance logic)
    */
    const remainingBalance = contract.SOABalance; 

    if (remainingBalance <= 0) {
      /* CASE: NO REMAINING BALANCE 
         Move to Finance for closing.
      */
      contract.currentDepartment = "finance";
      contract.currentStage = "final_financial_closure";
      
      contract.history.push({
        state: "EJAR_UPLOAD_COMPLETE",
        department: "leasing",
        action: `HO Uploaded (${amount}). No remaining debt found. Moving to Finance for closure.`,
        user: req.user.id
      });

    } else {
      /* CASE: YES, REMAINING BALANCE EXISTS
         Decision Point: Is there a guarantee?
      */
      if (!contract.hasGuarantee) {
        // Path: No Guarantee -> Standard Court
        contract.currentDepartment = "legal";
        contract.currentStage = "standard_court_proceedings";

        contract.history.push({
          state: "EJAR_UPLOAD_COMPLETE",
          department: "leasing",
          action: `HO Uploaded (${amount}). No guarantee found. Moving to Legal for Standard Court.`,
          user: req.user.id
        });
      } 
      else {
        // Path: Has Guarantee -> Branch by Type
        contract.currentDepartment = "legal"; // Default to legal, might change to finance for BG

        if (contract.guaranteeType === "PN" || contract.guaranteeType === "Unified") {
          contract.currentStage = "legal_enforcement_15days";
          contract.history.push({
            state: "EJAR_UPLOAD_COMPLETE",
            department: "leasing",
            action: `HO Uploaded (${amount}). ${contract.guaranteeType} found. Moving to Enforcement Court (15 Days).`,
            user: req.user.id
          });
        } 
        else if (contract.guaranteeType === "BG") {
          contract.currentDepartment = "finance";
          contract.currentStage = "bg_liquidation_process";
          contract.history.push({
            state: "EJAR_UPLOAD_COMPLETE",
            department: "leasing",
            action: `HO Uploaded (${amount}). Bank Guarantee found. Moving to Finance for Liquidation.`,
            user: req.user.id
          });
        }
        else if (contract.guaranteeType === "Manual") {
          contract.currentStage = "legal_manual_court_long_term";
          contract.history.push({
            state: "EJAR_UPLOAD_COMPLETE",
            department: "leasing",
            action: `HO Uploaded (${amount}). Manual Contract found. Moving to Legal for Long-term Court.`,
            user: req.user.id
          });
        }
      }
    }

    // 4. Final Save
    await contract.save();

    return res.json({
      msg: "Ejar technicality completed. Contract routed based on guarantee matrix.",
      data: {
        contractId: id,
        ejarAmount: amount,
        remainingBalance,
        newDepartment: contract.currentDepartment,
        newStage: contract.currentStage,
        fileName: req.file.filename
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};