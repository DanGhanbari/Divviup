const express = require('express');
const router = express.Router();
const multer = require('multer');
const { scanReceipt } = require('../controllers/receiptController');
const authMiddleware = require('../middlewares/authMiddleware');

const upload = multer({ dest: 'uploads/' });

router.post('/scan', authMiddleware, upload.single('receipt'), scanReceipt);

module.exports = router;
