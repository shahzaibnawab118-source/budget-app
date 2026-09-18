const express = require('express');
const { all, run, get } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const transactions = await all(
      'SELECT id, description, amount, type, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    return res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ message: 'Failed to load transactions.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { description, amount, type } = req.body;

    if (!description || !amount || !type) {
      return res.status(400).json({ message: 'Description, amount, and type are required.' });
    }

    const normalizedType = type.toLowerCase();
    if (!['income', 'expense'].includes(normalizedType)) {
      return res.status(400).json({ message: 'Type must be either income or expense.' });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number.' });
    }

    const result = await run(
      'INSERT INTO transactions (user_id, description, amount, type) VALUES (?, ?, ?, ?)',
      [req.user.id, description.trim(), numericAmount, normalizedType]
    );

    const transaction = await get(
      'SELECT id, description, amount, type, created_at FROM transactions WHERE id = ?',
      [result.lastID]
    );

    return res.status(201).json({ message: 'Transaction added successfully.', transaction });
  } catch (error) {
    console.error('Create transaction error:', error);
    return res.status(500).json({ message: 'Failed to create transaction.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await get(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    await run('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, req.user.id]);

    return res.json({ message: 'Transaction deleted successfully.' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return res.status(500).json({ message: 'Failed to delete transaction.' });
  }
});

module.exports = router;
