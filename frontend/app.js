const API_BASE = '/api';

const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const authForm = document.getElementById('authForm');
const transactionForm = document.getElementById('transactionForm');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const nameField = document.getElementById('nameField');
const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const authMessage = document.getElementById('authMessage');
const transactionMessage = document.getElementById('transactionMessage');
const balanceValue = document.getElementById('balanceValue');
const incomeValue = document.getElementById('incomeValue');
const expenseValue = document.getElementById('expenseValue');
const transactionTableBody = document.getElementById('transactionTableBody');
const logoutBtn = document.getElementById('logoutBtn');
const currencySelect = document.getElementById('currencySelect');
const dashboardNavBtn = document.getElementById('dashboardNavBtn');

let authMode = 'login';
let selectedCurrency = localStorage.getItem('budget_currency') || 'PKR';
let currentView = 'dashboard';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const safeNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => {
  const currencyMap = {
    PKR: { locale: 'en-PK', currency: 'PKR' },
    USD: { locale: 'en-US', currency: 'USD' },
    EUR: { locale: 'en-IE', currency: 'EUR' }
  };

  const config = currencyMap[selectedCurrency] || currencyMap.PKR;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
};

const showMessage = (element, message, isError = true) => {
  element.textContent = message;
  element.classList.toggle('hidden', !message);
  element.classList.toggle('border-red-500/30', isError);
  element.classList.toggle('bg-red-500/10', isError);
  element.classList.toggle('text-red-200', isError);
};

const setAuthMode = (mode) => {
  authMode = mode;
  const isLogin = mode === 'login';
  nameField.classList.toggle('hidden', isLogin);
  loginTab.classList.toggle('bg-slate-900', isLogin);
  loginTab.classList.toggle('text-white', isLogin);
  loginTab.classList.toggle('bg-slate-800', !isLogin);
  loginTab.classList.toggle('text-slate-300', !isLogin);
  registerTab.classList.toggle('bg-slate-900', !isLogin);
  registerTab.classList.toggle('text-white', !isLogin);
  registerTab.classList.toggle('bg-slate-800', isLogin);
  registerTab.classList.toggle('text-slate-300', isLogin);
  authSubmitBtn.textContent = isLogin ? 'Login' : 'Create Account';
  authForm.reset();
  showMessage(authMessage, '', false);
};

const getToken = () => localStorage.getItem('budget_token');

const setToken = (token) => localStorage.setItem('budget_token', token);

const clearToken = () => localStorage.removeItem('budget_token');

const apiRequest = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
};

const renderDashboard = (dashboardData) => {
  balanceValue.textContent = formatCurrency(dashboardData.totalBalance);
  incomeValue.textContent = formatCurrency(dashboardData.totalIncome);
  expenseValue.textContent = formatCurrency(dashboardData.totalExpenses);

  if (!dashboardData.transactions || dashboardData.transactions.length === 0) {
    transactionTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="py-4 text-center text-slate-400">No transactions yet.</td>
      </tr>
    `;
    return;
  }

  transactionTableBody.innerHTML = dashboardData.transactions
    .map((transaction) => `
      <tr class="border-b border-slate-700 last:border-b-0">
        <td class="py-3 pr-3">${transaction.description}</td>
        <td class="py-3 pr-3">
          <span class="rounded-full px-2 py-1 text-xs font-medium ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}">
            ${transaction.type}
          </span>
        </td>
        <td class="py-3 pr-3 ${transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}">
          ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
        </td>
        <td class="py-3 pr-3 text-slate-400">${new Date(transaction.created_at).toLocaleDateString()}</td>
        <td class="py-3">
          <button data-id="${transaction.id}" class="delete-transaction rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-300 hover:border-rose-500 hover:text-white">
            Delete
          </button>
        </td>
      </tr>
    `)
    .join('');

  document.querySelectorAll('.delete-transaction').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      try {
        await apiRequest(`/transactions/${id}`, { method: 'DELETE' });
        await fetchDashboard();
      } catch (error) {
        showMessage(transactionMessage, error.message, true);
      }
    });
  });
};

const fetchDashboard = async () => {
  try {
    const data = await apiRequest('/dashboard');
    renderDashboard(data);
  } catch (error) {
    clearToken();
    showAuthView();
    showMessage(authMessage, error.message, true);
  }
};

const setActiveView = (view) => {
  currentView = view;
  dashboardNavBtn.classList.toggle('active', view === 'dashboard');
};

const updateCurrency = () => {
  selectedCurrency = currencySelect.value;
  localStorage.setItem('budget_currency', selectedCurrency);

  if (currentView === 'dashboard') {
    fetchDashboard();
  }
};

const showDashboardView = () => {
  authSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  currencySelect.value = selectedCurrency;
  setActiveView('dashboard');
  fetchDashboard();
};

const showAuthView = () => {
  authSection.classList.remove('hidden');
  dashboardSection.classList.add('hidden');
  logoutBtn.classList.add('hidden');
  setAuthMode('login');
  setActiveView('dashboard');
  dashboardNavBtn.classList.remove('active');
};

const handleAuthSubmit = async (event) => {
  event.preventDefault();

  const payload = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value
  };

  if (!payload.email || !payload.password || (authMode === 'register' && !payload.name)) {
    showMessage(authMessage, 'Please complete all required fields.', true);
    return;
  }

  try {
    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setToken(response.token);
    showMessage(authMessage, '', false);
    showDashboardView();
  } catch (error) {
    showMessage(authMessage, error.message, true);
  }
};

const handleTransactionSubmit = async (event) => {
  event.preventDefault();

  const payload = {
    description: document.getElementById('transactionDescription').value.trim(),
    amount: document.getElementById('transactionAmount').value,
    type: document.getElementById('transactionType').value
  };

  try {
    await apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    transactionForm.reset();
    showMessage(transactionMessage, '', false);
    await fetchDashboard();
  } catch (error) {
    showMessage(transactionMessage, error.message, true);
  }
};


loginTab.addEventListener('click', () => setAuthMode('login'));
registerTab.addEventListener('click', () => setAuthMode('register'));
authForm.addEventListener('submit', handleAuthSubmit);
transactionForm.addEventListener('submit', handleTransactionSubmit);
currencySelect.addEventListener('change', updateCurrency);
logoutBtn.addEventListener('click', () => {
  clearToken();
  showAuthView();
});
dashboardNavBtn.addEventListener('click', () => {
  if (getToken()) {
    showDashboardView();
  }
});

const initApp = () => {
  currencySelect.value = selectedCurrency;
  if (getToken()) {
    showDashboardView();
  } else {
    showAuthView();
  }
};

initApp();
