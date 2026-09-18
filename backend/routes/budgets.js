const express = require('express');
const { all, run, get } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const normalizeMonth = (value) => {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  return value;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const defaultCategoryList = [
  'Salary',
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Education',
  'Entertainment',
  'Other'
];

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const selectedMonth = normalizeMonth(month);

    const rows = await all(
      'SELECT id, user_id, month, date, category, description, income, expense, balance, created_at FROM budgets WHERE user_id = ? AND month = ? ORDER BY date ASC, id ASC',
      [req.user.id, selectedMonth]
    );

    return res.json(rows);
  } catch (error) {
    console.error('Fetch budgets error:', error);
    return res.status(500).json({ message: 'Failed to fetch budget entries.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { month, date, category, description, income, expense } = req.body || {};
    const selectedMonth = normalizeMonth(month);
    const selectedDate = date || `${selectedMonth}-01`;
    const validCategory = defaultCategoryList.includes(category) ? category : 'Other';
    const rowIncome = safeNumber(income);
    const rowExpense = safeNumber(expense);
    const balance = rowIncome - rowExpense;

    const result = await run(
      `INSERT INTO budgets (user_id, month, date, category, description, income, expense, balance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, selectedMonth, selectedDate, validCategory, (description || '').trim(), rowIncome, rowExpense, balance]
    );

    const created = await get(
      'SELECT id, user_id, month, date, category, description, income, expense, balance, created_at FROM budgets WHERE id = ?',
      [result.lastID]
    );

    return res.status(201).json(created);
  } catch (error) {
    console.error('Create budget error:', error);
    return res.status(500).json({ message: 'Failed to create budget entry.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT * FROM budgets WHERE id = ? AND user_id = ?', [id, req.user.id]);

    if (!existing) {
      return res.status(404).json({ message: 'Budget entry not found.' });
    }

    const { month, date, category, description, income, expense } = req.body || {};
    const selectedMonth = normalizeMonth(month || existing.month);
    const selectedDate = date || existing.date || `${selectedMonth}-01`;
    const validCategory = defaultCategoryList.includes(category) ? category : existing.category || 'Other';
    const rowIncome = safeNumber(income);
    const rowExpense = safeNumber(expense);
    const balance = rowIncome - rowExpense;

    await run(
      `UPDATE budgets
       SET month = ?, date = ?, category = ?, description = ?, income = ?, expense = ?, balance = ?
       WHERE id = ? AND user_id = ?`,
      [selectedMonth, selectedDate, validCategory, (description || '').trim(), rowIncome, rowExpense, balance, id, req.user.id]
    );

    const updated = await get(
      'SELECT id, user_id, month, date, category, description, income, expense, balance, created_at FROM budgets WHERE id = ?',
      [id]
    );

    return res.json(updated);
  } catch (error) {
    console.error('Update budget error:', error);
    return res.status(500).json({ message: 'Failed to update budget entry.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT * FROM budgets WHERE id = ? AND user_id = ?', [id, req.user.id]);

    if (!existing) {
      return res.status(404).json({ message: 'Budget entry not found.' });
    }

    await run('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, req.user.id]);
    return res.json({ message: 'Budget entry deleted successfully.' });
  } catch (error) {
    console.error('Delete budget error:', error);
    return res.status(500).json({ message: 'Failed to delete budget entry.' });
  }
});

module.exports = router;
