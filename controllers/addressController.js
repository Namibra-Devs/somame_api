const SavedAddress = require('../models/SavedAddress');

// @desc    Get all saved addresses for the logged-in customer
// @route   GET /api/users/me/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
    try {
        const addresses = await SavedAddress.findByCustomerId(req.user.id);
        res.json({ status: 'success', data: addresses });
    } catch (err) {
        console.error('Error in getAddresses:', err);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// @desc    Add a new saved address
// @route   POST /api/users/me/addresses
// @access  Private
exports.addAddress = async (req, res) => {
    try {
        const { type, name, address_text, location } = req.body;

        if (!name || !address_text || !location || location.lat === undefined || location.lng === undefined) {
            return res.status(400).json({ status: 'error', message: 'Please provide name, address_text, and location (lat/lng)' });
        }

        const newAddress = await SavedAddress.create({
            customer_id: req.user.id,
            type: type || 'custom',
            name,
            address_text,
            location
        });

        res.status(201).json({ status: 'success', data: newAddress });
    } catch (err) {
        console.error('Error in addAddress:', err);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// @desc    Update a saved address
// @route   PUT /api/users/me/addresses/:id
// @access  Private
exports.updateAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        
        const existingAddress = await SavedAddress.findById(addressId);
        if (!existingAddress) {
            return res.status(404).json({ status: 'error', message: 'Address not found' });
        }

        if (existingAddress.customer_id !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to update this address' });
        }

        const updatedAddress = await SavedAddress.update(addressId, req.body);
        res.json({ status: 'success', data: updatedAddress });
    } catch (err) {
        console.error('Error in updateAddress:', err);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};

// @desc    Delete a saved address
// @route   DELETE /api/users/me/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;

        const existingAddress = await SavedAddress.findById(addressId);
        if (!existingAddress) {
            return res.status(404).json({ status: 'error', message: 'Address not found' });
        }

        if (existingAddress.customer_id !== req.user.id) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to delete this address' });
        }

        await SavedAddress.delete(addressId);
        res.json({ status: 'success', message: 'Address deleted successfully' });
    } catch (err) {
        console.error('Error in deleteAddress:', err);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
};
