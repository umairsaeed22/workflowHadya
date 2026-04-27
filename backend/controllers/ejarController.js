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