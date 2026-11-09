const Voucher = require("../models/Voucher");
const AppError = require("../utils/AppError");

class VoucherService {
  async getAllVouchers() {
    return await Voucher.find().sort({ createdAt: -1 }).lean();
  }

  async getVoucherById(id) {
    const voucher = await Voucher.findById(id).lean();
    if (!voucher) {
      throw new AppError("Voucher not found", 404);
    }
    return voucher;
  }

  async validateVoucher(code, userId, subtotal) {
    if (!code || !code.trim()) {
      throw new AppError("Voucher code is required", 400);
    }
    const cleanCode = code.trim().toUpperCase();
    const voucher = await Voucher.findOne({ code: cleanCode });
    if (!voucher) {
      throw new AppError(`Voucher "${cleanCode}" not found`, 404);
    }

    const validation = voucher.validateForOrder(userId, Number(subtotal) || 0);
    if (!validation.valid) {
      throw new AppError(validation.message, 400);
    }

    return {
      valid: true,
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      discountAmount: validation.discountAmount,
      message: "Voucher applied successfully",
    };
  }

  async createVoucher(data) {
    const cleanCode = data.code.trim().toUpperCase();
    const existing = await Voucher.findOne({ code: cleanCode });
    if (existing) {
      throw new AppError(`Voucher with code "${cleanCode}" already exists`, 409);
    }

    const voucher = new Voucher({ ...data, code: cleanCode });
    await voucher.save();
    return voucher;
  }

  async updateVoucher(id, data) {
    if (data.code) {
      data.code = data.code.trim().toUpperCase();
    }
    const voucher = await Voucher.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!voucher) {
      throw new AppError("Voucher not found", 404);
    }
    return voucher;
  }

  async deleteVoucher(id) {
    const voucher = await Voucher.findByIdAndDelete(id);
    if (!voucher) {
      throw new AppError("Voucher not found", 404);
    }
    return { message: "Voucher deleted successfully" };
  }
}

module.exports = new VoucherService();
