const express = require('express');
const Form = require('../models/Form');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all forms (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const forms = await Form.find()
      .select('title description createdAt isPublished shareId createdBy')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get form by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching form with ID:', req.params.id);
    
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid form ID format' });
    }
    
    const form = await Form.findById(req.params.id).populate('createdBy', 'name email');
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get form by share ID (for public access - no authentication required)
router.get('/share/:shareId', async (req, res) => {
  try {
    const form = await Form.findOne({ shareId: req.params.shareId, isPublished: true });
    if (!form) {
      return res.status(404).json({ error: 'Form not found or not published' });
    }
    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get form by ID (for public access - no authentication required)
router.get('/public/:id', async (req, res) => {
  try {
    // Validate ObjectId format
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid form ID format' });
    }
    
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    if (!form.isPublished) {
      return res.status(404).json({ error: 'Form not found or not published' });
    }
    
    res.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new form (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const formData = {
      ...req.body,
      shareId: uuidv4(),
      createdBy: req.user._id
    };
    const form = new Form(formData);
    const savedForm = await form.save();
    res.status(201).json(savedForm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update form (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    const updatedForm = await Form.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    
    res.json(updatedForm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete form (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    await Form.findByIdAndDelete(req.params.id);
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish/unpublish form (admin only)
router.patch('/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    const { isPublished } = req.body;
    const updatedForm = await Form.findByIdAndUpdate(
      req.params.id,
      { isPublished, updatedAt: Date.now() },
      { new: true }
    );
    
    res.json(updatedForm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;