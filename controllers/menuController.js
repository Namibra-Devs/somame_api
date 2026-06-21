const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const Vendor = require('../models/Vendor');

// ==========================================
// MENU CATEGORIES
// ==========================================

// @desc    Create a menu category
// @route   POST /api/vendors/me/menu-categories
const createMenuCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'Name is required' });

    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });

    const category = await MenuCategory.create({ vendor_id: vendor.id, name, description });
    res.status(201).json({ status: 'success', message: 'Menu category created successfully', data: category });
  } catch (error) {
    if (error.code === '23505') { // unique violation
      return res.status(400).json({ status: 'error', message: 'Category name already exists for your menu' });
    }
    next(error);
  }
};

// @desc    Get my menu categories
// @route   GET /api/vendors/me/menu-categories
const getMyMenuCategories = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });

    const categories = await MenuCategory.findByVendorId(vendor.id);
    res.status(200).json({ status: 'success', message: 'Menu categories retrieved successfully', data: categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a menu category
// @route   PUT /api/vendors/me/menu-categories/:id
const updateMenuCategory = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });

    const { name, description } = req.body;
    const category = await MenuCategory.update(req.params.id, vendor.id, { name, description });

    if (!category) return res.status(404).json({ status: 'error', message: 'Menu category not found' });

    res.status(200).json({ status: 'success', message: 'Menu category updated successfully', data: category });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ status: 'error', message: 'Category name already exists for your menu' });
    }
    next(error);
  }
};

// @desc    Delete a menu category
// @route   DELETE /api/vendors/me/menu-categories/:id
const deleteMenuCategory = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });

    const isDeleted = await MenuCategory.delete(req.params.id, vendor.id);
    if (!isDeleted) return res.status(404).json({ status: 'error', message: 'Menu category not found' });

    res.status(200).json({ status: 'success', message: 'Menu category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// MENU ITEMS
// ==========================================

// @desc    Create a menu item
// @route   POST /api/vendors/me/menu-items
const createMenuItem = async (req, res, next) => {
  try {
    const { menu_category_id, name, description, price, size, quantity, image_url, extras, is_in_stock } = req.body;
    if (!name || !price) return res.status(400).json({ status: 'error', message: 'Name and price are required' });

    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });

    // Validate category ownership if category is provided
    if (menu_category_id) {
      const category = await MenuCategory.findById(menu_category_id);
      if (!category || category.vendor_id !== vendor.id) {
        return res.status(400).json({ status: 'error', message: 'Invalid menu category' });
      }
    }

    const item = await MenuItem.create({ 
      vendor_id: vendor.id, menu_category_id, name, description, price, size, quantity, image_url, extras, is_in_stock 
    });

    res.status(201).json({ status: 'success', message: 'Menu item created successfully', data: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my menu items
// @route   GET /api/vendors/me/menu-items
const getMyMenuItems = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });

    const { category_id } = req.query;
    const items = await MenuItem.findByVendorId(vendor.id, category_id);

    res.status(200).json({ status: 'success', message: 'Menu items retrieved successfully', data: items });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a menu item
// @route   PUT /api/vendors/me/menu-items/:id
const updateMenuItem = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });

    const { menu_category_id, name, description, price, size, quantity, image_url, extras, is_in_stock } = req.body;

    if (menu_category_id) {
      const category = await MenuCategory.findById(menu_category_id);
      if (!category || category.vendor_id !== vendor.id) {
        return res.status(400).json({ status: 'error', message: 'Invalid menu category' });
      }
    }

    const item = await MenuItem.update(req.params.id, vendor.id, { 
      menu_category_id, name, description, price, size, quantity, image_url, extras, is_in_stock 
    });

    if (!item) return res.status(404).json({ status: 'error', message: 'Menu item not found' });

    res.status(200).json({ status: 'success', message: 'Menu item updated successfully', data: item });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a menu item
// @route   DELETE /api/vendors/me/menu-items/:id
const deleteMenuItem = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByUserId(req.user.id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor profile not found' });

    const isDeleted = await MenuItem.delete(req.params.id, vendor.id);
    if (!isDeleted) return res.status(404).json({ status: 'error', message: 'Menu item not found' });

    res.status(200).json({ status: 'success', message: 'Menu item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// @desc    Get full menu for a specific vendor
// @route   GET /api/vendors/:id/menu
const getVendorMenu = async (req, res, next) => {
  try {
    const vendor_id = req.params.id;
    const vendor = await Vendor.findById(vendor_id);
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Vendor not found' });

    const categories = await MenuCategory.findByVendorId(vendor_id);
    const items = await MenuItem.findByVendorId(vendor_id);

    // Group items by category for convenience on frontend
    const menu = categories.map(cat => ({
      ...cat,
      items: items.filter(item => item.menu_category_id === cat.id)
    }));

    // Items without a category
    const uncategorized = items.filter(item => item.menu_category_id === null);
    if (uncategorized.length > 0) {
      menu.push({
        id: null,
        name: 'Uncategorized',
        description: null,
        items: uncategorized
      });
    }

    res.status(200).json({ status: 'success', message: 'Vendor menu retrieved successfully', data: menu });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMenuCategory,
  getMyMenuCategories,
  updateMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  getMyMenuItems,
  updateMenuItem,
  deleteMenuItem,
  getVendorMenu
};
