const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

const {
  createContract,
  getAllContracts,
  getAllContractsForManagement,
  approveContract,
  rejectAndProcessNegative,
  updateContractStatus,
  getManagementStats
} = require("../controllers/contractController");

/*
CREATE CONTRACT
*/
router.post(
  "/",
  auth,
  createContract
);

/*
GET ALL CONTRACTS
*/
router.get(
  "/",
  auth,
  getAllContracts
);

/*
APPROVE CONTRACT
*/
router.put(
  "/:id/approve",
  auth,
  approveContract
);

/*
MANAGEMENT ALL CONTRACTS
*/
router.get(
  "/all",
  auth,
  getAllContractsForManagement
);

/*
NEGATIVE FLOW
IMPORTANT:
NO /contracts here
*/
router.post(
  "/:id/reject-negative",
  auth,
  rejectAndProcessNegative
);

/*
UPDATE STATUS
IMPORTANT:
NO /contracts here
*/
router.put(
  "/:id/update-status",
  auth,
  updateContractStatus
);

router.get(
  "/management-stats",
  auth,
  getManagementStats
);

module.exports = router;