const express = require('express');
const router = express.Router({ mergeParams: true }); // Merge params to access group_id
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/groups/:group_id/expenses', expenseController.createExpense);
router.get('/groups/:group_id/expenses', expenseController.getGroupExpenses);
router.get('/groups/:group_id/balances', expenseController.getGroupBalances);
router.delete('/groups/:group_id/expenses/:id', expenseController.deleteExpense);
router.put('/groups/:group_id/expenses/:id', expenseController.updateExpense);

module.exports = router;
