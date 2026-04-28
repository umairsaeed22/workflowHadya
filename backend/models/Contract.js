const mongoose = require("mongoose");

const ContractSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true
    },

    totalAmount: {
      type: Number,
      required: true
    },

    paidAmount: {
      type: Number,
      required: true
    },

    SOABalance: {
      type: Number,
      default: 0
    },

    SOAStatus: {
      type: String,
      enum: ["Positive", "Negative"],
      default: "Positive"
    },

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
      enum: ["None", "PN", "BG", "Unified", "Manual"],
      default: "None"
    },

    hasEjar: {
      type: Boolean,
      default: false
    },

    damageAmount: {
      type: Number,
      default: 0
    },

    hasRemainingDebt: {
      type: Boolean,
      default: false
    },

    currentStage: {
      type: String,
      default: "management_approval"
    },

    currentDepartment: {
      type: String,
      default: "management",
      lowercase: true, // 🔥 ensures consistent indexing
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    history: [
      {
        state: String,
        department: String,
        action: String,
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
  },
  {
    timestamps: false
  }
);

/*
  WHERE currentDepartment = ?
  ORDER BY createdAt DESC
*/
ContractSchema.index({ currentDepartment: 1, createdAt: -1 });

/*
  PRE-SAVE BUSINESS LOGIC
*/
ContractSchema.pre("save", function () {
  const paymentBalance =
    this.totalAmount - this.paidAmount;

  const damageVsDeposit =
    this.damageAmount - this.depositAmount;

  const finalBalance =
    paymentBalance + damageVsDeposit;

  this.SOABalance = finalBalance;

  this.SOAStatus =
    finalBalance > 0 ? "Negative" : "Positive";

  this.hasRemainingDebt =
    finalBalance > 0;
});

module.exports = mongoose.model("Contract", ContractSchema);