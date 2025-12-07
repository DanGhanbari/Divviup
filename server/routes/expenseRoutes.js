const express = require('express');
const router = express.Router({ mergeParams: true }); // Merge params to access group_id
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/', expenseController.createExpense);
router.get('/', expenseController.getGroupExpenses);

module.exports = router;
