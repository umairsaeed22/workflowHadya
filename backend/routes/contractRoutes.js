const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

const {
  createContract,
  getAllContracts,
  getAllContractsForManagement,
  approveContract
} = require("../controllers/contractController");

router.post("/", auth, createContract);

router.get("/", auth, getAllContracts);

/*
APPROVE CONTRACT
*/
router.put(
  "/:id/approve",
  auth,
  approveContract
);

router.get(
  "/all",
  auth,
  getAllContractsForManagement
);

const {
  rejectAndProcessNegative
} = require("../controllers/contractController");

const authMiddleware = require("../middleware/authMiddleware");

/*
  Management → Negative SOA Flow

  REPORTING POINT:
  SOA_CHECKED (Negative)

  FLOW:
  Management → Operations → Legal / Finance
*/

router.post(
  "/contracts/:id/reject-negative",
  authMiddleware,
  rejectAndProcessNegative
);

module.exports = router;