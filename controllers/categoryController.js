const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json({ status: 'success', count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }
    res.status(200).json({ status: 'success', data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category (Admin only)
// @route   POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Admins only' });
    }

    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Please provide a category name' });
    }

    const category = await Category.create({ name, description });
    res.status(201).json({ status: 'success', data: category });
  } catch (error) {
    if (error.code === '23505') { // unique violation
      return res.status(400).json({ status: 'error', message: 'Category name already exists' });
    }
    next(error);
  }
};

// @desc    Update a category (Full replace)
// @route   PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Admins only' });
    }

    const { name, description, is_active } = req.body;
    if (!name || is_active === undefined) {
      return res.status(400).json({ status: 'error', message: 'Please provide name and is_active status' });
    }

    const category = await Category.update(req.params.id, { name, description, is_active });
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }

    res.status(200).json({ status: 'success', data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Patch a category (Partial update)
// @route   PATCH /api/categories/:id
const patchCategory = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Admins only' });
    }

    const category = await Category.patch(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ status: 'error', message: 'Category not found or no fields provided' });
    }

    res.status(200).json({ status: 'success', data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Admins only' });
    }

    const success = await Category.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ status: 'error', message: 'Category not found' });
    }

    res.status(200).json({ status: 'success', message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  patchCategory,
  deleteCategory
};
