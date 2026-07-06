const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', wishlistController.getWishlist);
router.get('/check/:productId', wishlistController.checkWishlist);
router.post('/:productId', wishlistController.addToWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

module.exports = router;
