// models/Contract.js

const mongoose = require("mongoose");

const ContractSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },

  totalAmount: {
    type: Number,
    required: true
  },

  paidAmount: {
    type: Number,
    required: true
  },

  /*
    FINAL SOA BALANCE

    Positive value  -> customer owes company
    Zero/Negative   -> refundable / clear
  */
  SOABalance: {
    type: Number,
    default: 0
  },

  /*
    SOA STATUS

    Positive = customer clear / refundable
    Negative = customer still owes
  */
  SOAStatus: {
    type: String,
    enum: ["Positive", "Negative"],
    default: "Positive"
  },

  /*
    SECURITY DEPOSIT
  */
  depositAmount: {
    type: Number,
    default: 0
  },

  hasGuarantee: {
    type: Boolean,
    default: false
  },

  guaranteeType: {
    type: String,
    enum: [
      "None",
      "PN",
      "BG",
      "Unified",
      "Manual"
    ],
    default: "None"
  },

  hasEjar: {
    type: Boolean,
    default: false
  },

  /*
    DAMAGE AMOUNT
    Used for Negative Flow
  */
  damageAmount: {
    type: Number,
    default: 0
  },

  /*
    AUTO-CALCULATED
    true = customer still owes money
  */
  hasRemainingDebt: {
    type: Boolean,
    default: false
  },

  /*
    WORKFLOW FIELDS
  */
  currentStage: {
    type: String,
    default: "management_approval"
  },

  currentDepartment: {
    type: String,
    default: "management"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  /*
    HISTORY TRACKING
  */
  history: [
    {
      state: {
        type: String
      },

      department: {
        type: String
      },

      action: {
        type: String
      },

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },

      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

/*
  PRE-SAVE HOOK

  BUSINESS LOGIC:

  Example:
  damages = 6000
  deposit = 5000

  customer owes:
  6000 - 5000 = 1000

  Since balance > 0
  SOAStatus = Negative

  If:
  deposit >= damages

  then:
  SOAStatus = Positive
*/

ContractSchema.pre("save", function () {
  /*
    Payment balance from contract
  */
  const paymentBalance =
    this.totalAmount - this.paidAmount;

  /*
    Core business rule

    damages - deposit

    positive => customer owes money
    zero/negative => refundable or clear
  */
  const damageVsDeposit =
    this.damageAmount - this.depositAmount;

  /*
    Final SOA balance
  */
  const finalBalance =
    paymentBalance + damageVsDeposit;

  this.SOABalance = finalBalance;

  /*
    SOA Decision
  */
  this.SOAStatus =
    finalBalance > 0
      ? "Negative"
      : "Positive";

  /*
    Auto set remaining debt
  */
  this.hasRemainingDebt =
    finalBalance > 0;
});

module.exports = mongoose.model(
  "Contract",
  ContractSchema
);