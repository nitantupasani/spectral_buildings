const express = require('express');
const { body, validationResult } = require('express-validator');
const Building = require('../models/Building');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Get all buildings
router.get('/', auth, async (req, res) => {
  try {
    const buildings = await Building.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(buildings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single building
router.get('/:id', auth, async (req, res) => {
  try {
    const building = await Building.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }
    
    res.json(building);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create building (admin only)
router.post('/', [auth, adminAuth, [
  body('name').notEmpty(),
  body('address').notEmpty()
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, description, status } = req.body;

    const building = new Building({
      name,
      address,
      description,
      status,
      createdBy: req.user.userId
    });

    await building.save();
    await building.populate('createdBy', 'username email');

    res.status(201).json(building);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update building (admin only)
router.put('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const { name, address, description, status } = req.body;

    const building = await Building.findByIdAndUpdate(
      req.params.id,
      { name, address, description, status },
      { new: true }
    ).populate('createdBy', 'username email');

    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }

    res.json(building);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete building (admin only)
router.delete('/:id', [auth, adminAuth], async (req, res) => {
  try {
    const building = await Building.findByIdAndDelete(req.params.id);

    if (!building) {
      return res.status(404).json({ message: 'Building not found' });
    }

    res.json({ message: 'Building deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
