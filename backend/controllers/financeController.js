// controllers/financeController.js
const Contract = require("../models/Contract");
const Notification = require("../models/Notification");

exports.confirmPaymentAndPOP = async (req, res) => {
  try {
    const { id } = req.params;
    const { popReference, paymentNotes } = req.body; 

    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({ msg: "Contract not found" });
    }

    const isZeroBalance = !contract.depositAmount || contract.depositAmount === 0;

    /* UPDATED REPORTING POINT
       We set department to "customer_service" because this entry 
       represents the handover to the final stage.
    */
    contract.history.push({
      state: "POP_ISSUED",
      department: "finance", // Fixed from 'finance'
      action: isZeroBalance 
        ? "Financial Clearance: Confirmed zero balance. Moved to Customer Service for Survey." 
        : `Payment Processed: Bank Transfer Ref: ${popReference || "Manual"}. Moved to Customer Service for Survey.`,
      user: req.user.id
    });

    /* FINAL TRANSITION 
       Finance is finished; the contract now belongs to Customer Service.
    */
    contract.currentDepartment = "customer_service";
    contract.currentStage = "completed_pending_survey"; 
    contract.isClosed = true; 

    await contract.save();

    /* NOTIFY CUSTOMER SERVICE 
    */
    await Notification.create({
      title: "New Survey Ready",
      message: `Payment/Clearance for ${contract.customerName} is done. Please follow up with customer survey.`,
      department: "customer_service",
      contractId: contract._id
    });

    return res.json({
      msg: "Handed over to Customer Service successfully.",
      data: {
        contractId: contract._id,
        currentDepartment: contract.currentDepartment,
        nextStep: "Customer Survey Email"
      }
    });

  } catch (err) {
    console.error("Finance Handover Error:", err);
    res.status(500).json({ msg: err.message });
  }
};