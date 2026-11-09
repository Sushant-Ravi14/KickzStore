const mongoose = require("mongoose");
const schema = mongoose.Schema;

const VoucherSchema = new schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, trim: true },
    discountType: {
      type: String,
      enum: ["percent", "amount"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number },
    minOrderValue: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 100, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    usedBy: [{ type: schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Method to validate eligibility for a specific user and order amount
VoucherSchema.methods.validateForOrder = function (userId, orderSubtotal) {
  const now = new Date();
  if (!this.isActive) {
    return { valid: false, message: "This voucher is currently inactive." };
  }
  if (now < this.startDate) {
    return { valid: false, message: "This voucher is not yet active." };
  }
  if (now > this.endDate) {
    return { valid: false, message: "This voucher has expired." };
  }
  if (this.usedCount >= this.usageLimit) {
    return { valid: false, message: "This voucher has reached its maximum global usage limit." };
  }
  if (userId && this.usedBy.some((id) => id.toString() === userId.toString())) {
    return { valid: false, message: "You have already used this voucher code." };
  }
  if (orderSubtotal < this.minOrderValue) {
    return {
      valid: false,
      message: `Minimum order value of $${this.minOrderValue} required for voucher "${this.code}".`,
    };
  }

  let calculatedDiscount = 0;
  if (this.discountType === "percent") {
    calculatedDiscount = (orderSubtotal * this.discountValue) / 100;
    if (this.maxDiscountAmount && calculatedDiscount > this.maxDiscountAmount) {
      calculatedDiscount = this.maxDiscountAmount;
    }
  } else {
    calculatedDiscount = this.discountValue;
  }

  // Discount cannot exceed order subtotal
  if (calculatedDiscount > orderSubtotal) {
    calculatedDiscount = orderSubtotal;
  }

  return {
    valid: true,
    discountAmount: Math.round(calculatedDiscount * 100) / 100,
  };
};

module.exports = mongoose.model("Voucher", VoucherSchema, "vouchers");
