/**
 * Tax Calculation Utilities — FY 2025-26
 * 
 * Pure functions for all tax calculations.
 * These are used by both the Calculator page and the ITR filing wizard.
 * 
 * IMPORTANT: These calculations are for educational purposes only.
 * Always consult a CA for actual tax filing.
 */

// ===== TAX SLAB RATES =====

/**
 * New Tax Regime slabs for FY 2025-26
 * Standard deduction: ₹75,000
 * No other deductions allowed (except 80CCD(2) employer NPS)
 */
const NEW_REGIME_SLABS = [
  { min: 0, max: 400000, rate: 0 },
  { min: 400000, max: 800000, rate: 0.05 },
  { min: 800000, max: 1200000, rate: 0.10 },
  { min: 1200000, max: 1600000, rate: 0.15 },
  { min: 1600000, max: 2000000, rate: 0.20 },
  { min: 2000000, max: 2400000, rate: 0.25 },
  { min: 2400000, max: Infinity, rate: 0.30 },
];

/**
 * Old Tax Regime slabs for FY 2025-26
 * Standard deduction: ₹50,000
 * All deductions under 80C, 80D, etc. are available
 */
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
];

/**
 * Calculate tax based on given slabs
 * 
 * How slab-based tax works:
 * - Income is split into ranges (slabs)
 * - Each slab has its own tax rate
 * - You only pay the higher rate on income ABOVE that slab's threshold
 * 
 * @param {number} taxableIncome - Income after all deductions
 * @param {Array} slabs - Tax slab array to use
 * @returns {number} - Total tax before cess
 */
export const calculateSlabTax = (taxableIncome, slabs) => {
  let tax = 0;

  for (const slab of slabs) {
    if (taxableIncome <= slab.min) break;

    // Calculate how much income falls in this slab
    const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min;
    tax += taxableInSlab * slab.rate;
  }

  return Math.round(tax);
};

/**
 * Calculate income tax under the NEW regime
 * 
 * New regime benefits:
 * - Lower tax rates
 * - Higher standard deduction (₹75,000)
 * - But NO deductions under 80C, 80D, HRA, etc.
 * - Rebate under 87A: No tax if income ≤ ₹12,00,000 (effective ₹12,75,000 with std deduction)
 * 
 * @param {number} grossIncome - Total income before any deductions
 * @returns {object} - { taxableIncome, tax, cess, totalTax, effectiveRate }
 */
export const calculateNewRegimeTax = (grossIncome) => {
  // Standard deduction for salaried individuals
  const standardDeduction = 75000;
  const taxableIncome = Math.max(0, grossIncome - standardDeduction);

  // Calculate base tax
  let tax = calculateSlabTax(taxableIncome, NEW_REGIME_SLABS);

  // Rebate under Section 87A: No tax if taxable income ≤ ₹12,00,000
  // (This means gross income up to ₹12,75,000 is tax-free under new regime)
  if (taxableIncome <= 1200000) {
    tax = 0;
  }

  // Health & Education Cess: 4% of tax
  const cess = Math.round(tax * 0.04);
  const totalTax = tax + cess;

  // Effective tax rate (what % of your gross income goes to tax)
  const effectiveRate = grossIncome > 0 ? ((totalTax / grossIncome) * 100).toFixed(2) : '0.00';

  return {
    standardDeduction,
    taxableIncome,
    tax,
    cess,
    totalTax,
    effectiveRate,
    slabs: NEW_REGIME_SLABS,
  };
};

/**
 * Calculate income tax under the OLD regime
 * 
 * Old regime benefits:
 * - Can claim deductions under 80C (₹1.5L), 80D, HRA, etc.
 * - Better for people with high deductions
 * - But higher tax rates
 * - Rebate under 87A: No tax if taxable income ≤ ₹5,00,000
 * 
 * @param {number} grossIncome - Total income before deductions
 * @param {number} totalDeductions - Sum of all deductions (80C + 80D + etc.)
 * @returns {object} - Tax calculation result
 */
export const calculateOldRegimeTax = (grossIncome, totalDeductions = 0) => {
  // Standard deduction for salaried individuals
  const standardDeduction = 50000;

  // Taxable income = Gross - Standard Deduction - Chapter VI-A Deductions
  const taxableIncome = Math.max(0, grossIncome - standardDeduction - totalDeductions);

  // Calculate base tax
  let tax = calculateSlabTax(taxableIncome, OLD_REGIME_SLABS);

  // Rebate under Section 87A: No tax if taxable income ≤ ₹5,00,000
  if (taxableIncome <= 500000) {
    tax = 0;
  }

  // Health & Education Cess: 4% of tax
  const cess = Math.round(tax * 0.04);
  const totalTax = tax + cess;

  const effectiveRate = grossIncome > 0 ? ((totalTax / grossIncome) * 100).toFixed(2) : '0.00';

  return {
    standardDeduction,
    totalDeductions,
    taxableIncome,
    tax,
    cess,
    totalTax,
    effectiveRate,
    slabs: OLD_REGIME_SLABS,
  };
};

/**
 * Compare old vs new regime and recommend the better one
 * 
 * @param {number} grossIncome - Total income
 * @param {number} totalDeductions - Total deductions (for old regime)
 * @returns {object} - Comparison result with recommendation
 */
export const compareRegimes = (grossIncome, totalDeductions = 0) => {
  const newRegime = calculateNewRegimeTax(grossIncome);
  const oldRegime = calculateOldRegimeTax(grossIncome, totalDeductions);

  // Calculate savings
  const savings = Math.abs(newRegime.totalTax - oldRegime.totalTax);
  const recommended = newRegime.totalTax <= oldRegime.totalTax ? 'new' : 'old';

  return {
    newRegime,
    oldRegime,
    savings,
    recommended,
  };
};

/**
 * Calculate HRA Exemption
 * 
 * HRA exemption is the MINIMUM of these three:
 * 1. Actual HRA received from employer
 * 2. 50% of basic salary (metro) or 40% (non-metro)
 * 3. Rent paid minus 10% of basic salary
 * 
 * Metro cities: Delhi, Mumbai, Chennai, Kolkata
 * 
 * @param {number} basicSalary - Basic salary per year
 * @param {number} hraReceived - HRA received from employer per year
 * @param {number} rentPaid - Actual rent paid per year
 * @param {boolean} isMetro - Whether the city is a metro city
 * @returns {object} - HRA calculation breakdown
 */
export const calculateHRA = (basicSalary, hraReceived, rentPaid, isMetro = true) => {
  // The three conditions for HRA exemption
  const actualHRA = hraReceived;
  const percentOfBasic = isMetro ? basicSalary * 0.5 : basicSalary * 0.4;
  const rentMinusBasic = Math.max(0, rentPaid - basicSalary * 0.1);

  // Exemption = minimum of the three
  const exemption = Math.min(actualHRA, percentOfBasic, rentMinusBasic);

  // Taxable HRA = HRA received - exemption
  const taxableHRA = hraReceived - exemption;

  return {
    actualHRA,
    percentOfBasic,
    rentMinusBasic,
    exemption: Math.round(exemption),
    taxableHRA: Math.round(taxableHRA),
    isMetro,
  };
};

/**
 * Calculate Capital Gains Tax
 * 
 * STCG (Short Term Capital Gains):
 * - Equity (held < 12 months): 20%
 * - Other assets (held < 24/36 months): Added to income, taxed at slab rate
 * 
 * LTCG (Long Term Capital Gains):
 * - Equity (held ≥ 12 months): 12.5% above ₹1.25 lakh exemption
 * - Other assets (held ≥ 24/36 months): 12.5%
 * 
 * @param {number} purchasePrice - Price at which asset was bought
 * @param {number} salePrice - Price at which asset was sold
 * @param {number} holdingMonths - How long the asset was held (in months)
 * @param {string} assetType - 'equity' | 'debt' | 'property' | 'gold'
 * @returns {object} - Capital gains calculation
 */
export const calculateCapitalGains = (purchasePrice, salePrice, holdingMonths, assetType = 'equity') => {
  const gains = salePrice - purchasePrice;

  // Determine if this is short-term or long-term based on asset type
  const longTermThreshold = {
    equity: 12,    // 12 months for listed equity/equity MF
    debt: 24,      // 24 months for debt instruments  
    property: 24,  // 24 months for real estate
    gold: 24,      // 24 months for gold
  };

  const threshold = longTermThreshold[assetType] || 24;
  const isLongTerm = holdingMonths >= threshold;

  let tax = 0;
  let exemption = 0;
  let taxRate = 0;

  if (gains <= 0) {
    // Loss — no tax (can be set off against other gains)
    tax = 0;
  } else if (isLongTerm) {
    // LTCG tax
    if (assetType === 'equity') {
      // LTCG on equity: 12.5% above ₹1.25 lakh exemption
      exemption = 125000;
      const taxableGains = Math.max(0, gains - exemption);
      taxRate = 12.5;
      tax = Math.round(taxableGains * 0.125);
    } else {
      // LTCG on other assets: 12.5% (no exemption limit)
      taxRate = 12.5;
      tax = Math.round(gains * 0.125);
    }
  } else {
    // STCG tax
    if (assetType === 'equity') {
      // STCG on listed equity: 20%
      taxRate = 20;
      tax = Math.round(gains * 0.20);
    } else {
      // STCG on other assets: taxed at slab rate (we'll use 30% as worst case)
      taxRate = 30; // Approximate — actual rate depends on total income
      tax = Math.round(gains * 0.30);
    }
  }

  // Add 4% cess
  const cess = Math.round(tax * 0.04);

  return {
    purchasePrice,
    salePrice,
    gains,
    isLongTerm,
    holdingPeriod: isLongTerm ? 'Long Term' : 'Short Term',
    exemption,
    taxableGains: Math.max(0, gains - exemption),
    taxRate,
    tax,
    cess,
    totalTax: tax + cess,
    assetType,
  };
};

/**
 * Format a number as Indian currency (₹)
 * Uses the Indian numbering system (lakhs, crores)
 * 
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted string like "₹1,50,000"
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN');
};

/**
 * Deduction limits for reference
 * Used by the deductions tracker to show progress bars
 */
export const DEDUCTION_LIMITS = {
  '80C': { limit: 150000, label: 'Section 80C', description: 'PPF, ELSS, LIC, FD, etc.' },
  '80D': { limit: 75000, label: 'Section 80D', description: 'Health Insurance (self + parents)' },
  '80CCD(1B)': { limit: 50000, label: 'Section 80CCD(1B)', description: 'NPS (additional)' },
  '80E': { limit: Infinity, label: 'Section 80E', description: 'Education Loan Interest (no limit)' },
  '80G': { limit: Infinity, label: 'Section 80G', description: 'Donations (varies)' },
};
