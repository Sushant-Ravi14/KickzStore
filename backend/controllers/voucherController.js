const voucherService = require("../services/voucher.service");

class VoucherController {
  async getAll(_req, res, next) {
    try {
      const vouchers = await voucherService.getAllVouchers();
      res.status(200).json(vouchers);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const voucher = await voucherService.getVoucherById(id);
      res.status(200).json(voucher);
    } catch (err) {
      next(err);
    }
  }

  async validateCode(req, res, next) {
    try {
      const { code, orderSubtotal } = req.body;
      const userId = req.user ? req.user.id : null;
      const result = await voucherService.validateVoucher(code, userId, orderSubtotal);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const newVoucher = await voucherService.createVoucher(req.body);
      res.status(201).json({ message: "Voucher created", voucher: newVoucher });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updated = await voucherService.updateVoucher(id, req.body);
      res.status(200).json({ message: "Voucher updated", voucher: updated });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await voucherService.deleteVoucher(id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VoucherController();
