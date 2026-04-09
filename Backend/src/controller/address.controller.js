const Address = require("../models/address.model");

exports.saveAddress = async (req, res) => {
  try {
    const { address, latitude, longitude } = req.body;

    const newAddress = await Address.create({
      userId: req.user.id,
      address,
      latitude,
      longitude,
    });

    res.json({ success: true, data: newAddress });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
