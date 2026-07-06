const express = require('express');
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/my-orders', orderController.getMyOrders);
router.get('/my-orders/:id', orderController.getMyOrderById);
router.post('/my-orders/:id/cancel', orderController.cancelOrder);

module.exports = router;
