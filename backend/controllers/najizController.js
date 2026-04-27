// controllers/najizController.js

const Contract = require("../models/Contract");

exports.deactivateGuarantee = async (req, res) => {
  try {
    const { id } = req.params;
    const { guaranteeType } = req.body;

    console.log("contractId:", id);
    console.log("guaranteeType:", guaranteeType);

    if (!guaranteeType) {
      return res.status(400).json({
        msg: "Guarantee type is required"
      });
    }

    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({
        msg: "Contract not found"
      });
    }

    if (!contract.hasGuarantee) {
      return res.status(400).json({
        msg: "No guarantee found for this contract"
      });
    }

    /*
      Dummy processing delay
      (Simulating Najiz API/Process)
    */
    await new Promise((resolve) =>
      setTimeout(resolve, 2000)
    );

    /*
      FLOW:
      Legal → Operations OR Finance

      REPORTING POINT:
      GUARANTEE_DEACTIVATED
    */
    contract.currentStage =
      "guarantee_deactivated";

    if (contract.hasEjar) {
      /*
        PATH:
        Positive + Ejar

        Next Step:
        Operations
      */
      contract.currentDepartment =
        "operations";
    } else {
      /*
        PATH:
        Positive + No Ejar

        Next Step:
        Finance
      */
      contract.currentDepartment =
        "finance";
    }

    /*
      HISTORY TRACKING
    */
    contract.history.push({
      state: "GUARANTEE_DEACTIVATED",
      department: "legal",
      action: `Guarantee (${guaranteeType}) deactivated successfully`,
      user: req.user.id
    });

    await contract.save();

    /*
      Response
    */
    const successMsg = contract.hasEjar
      ? "Guarantee deactivated successfully and moved to Operations"
      : "Guarantee deactivated successfully and moved to Finance";

    return res.json({
      msg: successMsg,
      data: {
        contractId: id,
        guaranteeType,
        hasEjar: contract.hasEjar,
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