// CryptoDCA Pro Logic
let entries = [
  { price: 62000, amount: 0.05 },
  { price: 58500, amount: 0.08 },
  { price: 54000, amount: 0.12 }
];

const entriesBody = document.getElementById('entries-body');
const addRowBtn = document.getElementById('add-row-btn');
const feeInput = document.getElementById('trading-fee');
const targetExitInput = document.getElementById('target-exit-price');
const resetBtn = document.getElementById('reset-btn');

// Summary elements
const summaryCoins = document.getElementById('summary-coins');
const summaryInvested = document.getElementById('summary-invested');
const summaryAvg = document.getElementById('summary-avg');
const summaryFees = document.getElementById('summary-fees');

// Profit elements
const profitGross = document.getElementById('profit-gross');
const profitSellFee = document.getElementById('profit-sell-fee');
const profitNet = document.getElementById('profit-net');
const profitRoi = document.getElementById('profit-roi');

// Load saved data if available
function loadSavedData() {
  const saved = localStorage.getItem('crypto_dca_data');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.entries) && parsed.entries.length > 0) {
        entries = parsed.entries;
      }
      if (parsed.fee) feeInput.value = parsed.fee;
      if (parsed.target) targetExitInput.value = parsed.target;
    } catch (e) {
      console.error('Storage parse error', e);
    }
  }
}

function saveData() {
  const data = {
    entries: entries,
    fee: feeInput.value,
    target: targetExitInput.value
  };
  localStorage.setItem('crypto_dca_data', JSON.stringify(data));
}

function renderTable() {
  entriesBody.innerHTML = '';
  entries.forEach((item, index) => {
    const tr = document.createElement('tr');
    const spent = (item.price * item.amount).toFixed(2);

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <input type="number" step="any" class="input-price" data-index="${index}" value="${item.price || ''}" placeholder="0.00">
      </td>
      <td>
        <input type="number" step="any" class="input-amount" data-index="${index}" value="${item.amount || ''}" placeholder="0.00">
      </td>
      <td>
        <span class="row-total">$${Number(spent).toLocaleString()}</span>
      </td>
      <td>
        <button class="btn-delete" data-index="${index}">✕</button>
      </td>
    `;
    entriesBody.appendChild(tr);
  });

  attachListeners();
  calculateResults();
}

function attachListeners() {
  document.querySelectorAll('.input-price').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = e.target.dataset.index;
      entries[idx].price = parseFloat(e.target.value) || 0;
      updateRowTotal(idx);
      calculateResults();
      saveData();
    });
  });

  document.querySelectorAll('.input-amount').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = e.target.dataset.index;
      entries[idx].amount = parseFloat(e.target.value) || 0;
      updateRowTotal(idx);
      calculateResults();
      saveData();
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index);
      if (entries.length > 1) {
        entries.splice(idx, 1);
        renderTable();
        saveData();
      } else {
        entries = [{ price: 0, amount: 0 }];
        renderTable();
        saveData();
      }
    });
  });
}

function updateRowTotal(idx) {
  const row = entriesBody.children[idx];
  if (row) {
    const spent = (entries[idx].price * entries[idx].amount).toFixed(2);
    row.querySelector('.row-total').textContent = `$${Number(spent).toLocaleString()}`;
  }
}

function calculateResults() {
  let totalCoins = 0;
  let totalSpent = 0;
  const feePct = (parseFloat(feeInput.value) || 0) / 100;

  entries.forEach(item => {
    const p = parseFloat(item.price) || 0;
    const a = parseFloat(item.amount) || 0;
    totalCoins += a;
    totalSpent += (p * a);
  });

  const avgPrice = totalCoins > 0 ? (totalSpent / totalCoins) : 0;
  const buyFeesPaid = totalSpent * feePct;

  summaryCoins.textContent = totalCoins.toFixed(4);
  summaryInvested.textContent = `$${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  summaryAvg.textContent = `$${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  summaryFees.textContent = `$${buyFeesPaid.toFixed(2)}`;

  // Target Exit Calculation
  const targetExit = parseFloat(targetExitInput.value) || 0;
  if (targetExit > 0 && totalCoins > 0) {
    const grossRevenue = totalCoins * targetExit;
    const sellFee = grossRevenue * feePct;
    const totalCost = totalSpent + buyFeesPaid + sellFee;
    const netProfit = grossRevenue - totalSpent - buyFeesPaid - sellFee;
    const roi = totalSpent > 0 ? (netProfit / totalSpent) * 100 : 0;

    profitGross.textContent = `$${grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    profitSellFee.textContent = `$${sellFee.toFixed(2)}`;
    
    profitNet.textContent = `${netProfit >= 0 ? '+' : ''}$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    profitRoi.textContent = `${roi >= 0 ? '+' : ''}${roi.toFixed(2)}%`;

    if (netProfit >= 0) {
      profitNet.className = 'profit-positive';
      profitRoi.className = 'profit-positive';
    } else {
      profitNet.className = 'profit-negative';
      profitRoi.className = 'profit-negative';
    }
  } else {
    profitGross.textContent = '$0.00';
    profitSellFee.textContent = '$0.00';
    profitNet.textContent = '$0.00';
    profitNet.className = '';
    profitRoi.textContent = '0.00%';
    profitRoi.className = '';
  }
}

addRowBtn.addEventListener('click', () => {
  entries.push({ price: 0, amount: 0 });
  renderTable();
  saveData();
});

feeInput.addEventListener('input', () => {
  calculateResults();
  saveData();
});

targetExitInput.addEventListener('input', () => {
  calculateResults();
  saveData();
});

resetBtn.addEventListener('click', () => {
  if (confirm('Kya aap saare entries reset karna chahte hain?')) {
    localStorage.removeItem('crypto_dca_data');
    entries = [{ price: 0, amount: 0 }];
    targetExitInput.value = '';
    feeInput.value = '0.1';
    renderTable();
  }
});

// Init
loadSavedData();
renderTable();
