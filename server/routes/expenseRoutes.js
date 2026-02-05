const express = require('express');
const router = express.Router({ mergeParams: true }); // Merge params to access group_id
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.use(authMiddleware);

router.post('/groups/:group_id/expenses', upload.single('receipt'), expenseController.createExpense);
router.get('/groups/:group_id/expenses', expenseController.getGroupExpenses);
router.get('/groups/:group_id/balances', expenseController.getGroupBalances);
router.delete('/groups/:group_id/expenses/:id', expenseController.deleteExpense);
router.put('/groups/:group_id/expenses/:id', upload.single('receipt'), expenseController.updateExpense);
router.get('/groups/:group_id/expenses/:id', expenseController.getExpenseById);

module.exports = router;
