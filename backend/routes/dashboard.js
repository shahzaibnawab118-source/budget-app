const express = require('express');
const { get, all } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const transactions = await all(
      'SELECT id, description, amount, type, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    const totalIncome = transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const totalExpenses = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    const totalBalance = totalIncome - totalExpenses;

    res.json({
      totalBalance,
      totalIncome,
      totalExpenses,
      transactions
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return res.status(500).json({ message: 'Server error while fetching dashboard summary.' });
  }
});

module.exports = router;
