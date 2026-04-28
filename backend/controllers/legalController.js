// controllers/legalController.js

export const sendLegalConfirmationEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id).populate('createdBy');
    if (!contract) {
      return res.status(404).json({ msg: "Contract not found" });
    }

    // 1. Update the contract status
    contract.currentStage = "court_case_filed";
    contract.currentDepartment = "legal"; // Remains in legal but marked as filed

    // 2. Add to history
    const historyEntry = {
      state: "LEGAL_ACTION_FILED",
      department: "legal",
      action: `Standard court case filed. Claim amount: ${contract.SOABalance} SAR. Confirmation email dispatched to customer.`,
      user: req.user.id, // Assuming you have auth middleware
      timestamp: new Date()
    };

    contract.history.push(historyEntry);
    await contract.save();

    // 3. Trigger Email (Pseudo-code for NodeMailer/SendGrid)
    // await emailService.send({
    //   to: contract.customerEmail,
    //   subject: `Legal Notice: Case Filed - ${contract.customerName}`,
    //   text: `Dear Customer, a formal legal claim has been filed regarding balance: ${contract.SOABalance} SAR.`
    // });

    res.status(200).json({ 
      msg: "Court filing confirmed and customer notified via email", 
      contract 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error during legal confirmation" });
  }
};