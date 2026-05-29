/**
 * Auto-Fill and Tax Calculation Engine
 * 
 * Takes scanned document data, maps it to ITR structure,
 * and performs tax computations under both Old and New regimes
 * for FY 2025-26 (AY 2026-27).
 */

/**
 * Calculates tax under the NEW REGIME for FY 2025-26
 * Slabs:
 * - 0 to 4L: 0%
 * - 4L to 8L: 5% (max 20,000)
 * - 8L to 12L: 10% (max 40,000)
 * - 12L to 16L: 15% (max 60,000)
 * - 16L to 20L: 20% (max 80,000)
 * - 20L to 24L: 25% (max 100,000)
 * - Above 24L: 30%
 * 
 * Rebate u/s 87A:
 * - Taxable income <= 12,00,000 gets a rebate up to 60,000 (making net tax 0).
 */
const calculateNewRegimeTax = (taxableIncome) => {
  let tax = 0;

  if (taxableIncome <= 400000) {
    tax = 0;
  } else if (taxableIncome <= 800000) {
    tax = (taxableIncome - 400000) * 0.05;
  } else if (taxableIncome <= 1200000) {
    tax = 20000 + (taxableIncome - 800000) * 0.10;
  } else if (taxableIncome <= 1600000) {
    tax = 20000 + 40000 + (taxableIncome - 1200000) * 0.15;
  } else if (taxableIncome <= 2000000) {
    tax = 20000 + 40000 + 60000 + (taxableIncome - 1600000) * 0.20;
  } else if (taxableIncome <= 2400000) {
    tax = 20000 + 40000 + 60000 + 80000 + (taxableIncome - 2000000) * 0.25;
  } else {
    tax = 20000 + 40000 + 60000 + 80000 + 100000 + (taxableIncome - 2400000) * 0.30;
  }

  // Rebate u/s 87A
  let rebate = 0;
  if (taxableIncome <= 1200000) {
    rebate = tax; // Full rebate up to calculated tax
  } else {
    // Under New Regime FY 2025-26, marginal relief is allowed if the tax exceeds the excess income over 12L
    const excessIncome = taxableIncome - 1200000;
    if (tax > excessIncome) {
      rebate = tax - excessIncome; // Rebate is the difference, so taxAfterRebate = excessIncome
    }
  }

  let taxAfterRebate = Math.max(0, tax - rebate);

  // Surcharge
  let surcharge = 0;
  if (taxableIncome > 5000000 && taxableIncome <= 10000000) {
    surcharge = taxAfterRebate * 0.10;
  } else if (taxableIncome > 10000000 && taxableIncome <= 20000000) {
    surcharge = taxAfterRebate * 0.15;
  } else if (taxableIncome > 20000000) {
    surcharge = taxAfterRebate * 0.25; // New regime caps surcharge at 25%
  }

  // Cess
  const baseForCess = taxAfterRebate + surcharge;
  const cess = baseForCess * 0.04;

  const totalTax = baseForCess + cess;

  return {
    tax,
    rebate,
    surcharge,
    cess,
    total: Math.round(totalTax),
  };
};

/**
 * Calculates tax under the OLD REGIME for FY 2025-26
 * Slabs:
 * - 0 to 2.5L: 0%
 * - 2.5L to 5L: 5% (max 12,500)
 * - 5L to 10L: 20% (max 100,000)
 * - Above 10L: 30%
 * 
 * Rebate u/s 87A:
 * - Taxable income <= 5,00,000 gets a rebate up to 12,500 (making net tax 0).
 */
const calculateOldRegimeTax = (taxableIncome) => {
  let tax = 0;

  if (taxableIncome <= 250000) {
    tax = 0;
  } else if (taxableIncome <= 500000) {
    tax = (taxableIncome - 250000) * 0.05;
  } else if (taxableIncome <= 1000000) {
    tax = 12500 + (taxableIncome - 500000) * 0.20;
  } else {
    tax = 12500 + 100000 + (taxableIncome - 1000000) * 0.30;
  }

  // Rebate u/s 87A
  let rebate = 0;
  if (taxableIncome <= 500000) {
    rebate = tax; // Full rebate up to calculated tax
  }

  let taxAfterRebate = Math.max(0, tax - rebate);

  // Surcharge
  let surcharge = 0;
  if (taxableIncome > 5000000 && taxableIncome <= 10000000) {
    surcharge = taxAfterRebate * 0.10;
  } else if (taxableIncome > 10000000 && taxableIncome <= 20000000) {
    surcharge = taxAfterRebate * 0.15;
  } else if (taxableIncome > 20000000) {
    surcharge = taxAfterRebate * 0.25;
  }

  // Cess
  const baseForCess = taxAfterRebate + surcharge;
  const cess = baseForCess * 0.04;

  const totalTax = baseForCess + cess;

  return {
    tax,
    rebate,
    surcharge,
    cess,
    total: Math.round(totalTax),
  };
};

/**
 * Map, calculate, and compile document scanner results into ITR autofill data.
 * 
 * @param {Array<object>} documentsData - Array of extracted JSONs from document scanner
 * @param {object} currentUser - Logged in user profile data
 * @returns {object} - Structured ITR pre-filled details
 */
const compileAutoFillData = (documentsData, currentUser = {}) => {
  // 1. Initialize empty state
  const data = {
    personalInfo: {
      pan: currentUser.pan || '',
      name: currentUser.name || '',
      dob: '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      address: currentUser.address?.street || '',
      city: currentUser.address?.city || '',
      state: currentUser.address?.state || '',
      pincode: currentUser.address?.pincode || '',
      bankName: '',
      accountNumber: '',
      ifsc: '',
    },
    salaryIncome: {
      gross: 0,
      hra: 0,
      lta: 0,
      standard: 75000,
      net: 0,
    },
    otherIncome: {
      interest: 0,
      dividend: 0,
      capitalGains: 0,
    },
    deductions: {
      '80c': 0,
      '80d': 0,
      '80e': 0,
      '80g': 0,
      'nps': 0,
    },
    tdsDetails: {
      total: 0,
      breakdown: [],
    },
    taxComputation: {},
  };

  // 2. Aggregate data from all scanned documents
  documentsData.forEach((doc) => {
    if (!doc) return;

    // Map Personal Info fields if available
    if (doc.employeePAN && !data.personalInfo.pan) data.personalInfo.pan = doc.employeePAN;
    if (doc.pan && !data.personalInfo.pan) data.personalInfo.pan = doc.pan;
    if (doc.employeeName && !data.personalInfo.name) data.personalInfo.name = doc.employeeName;

    // Document Specific Aggregation
    // --- FORM 16 ---
    if (doc.grossSalary !== undefined || doc.basicSalary !== undefined) {
      data.salaryIncome.gross += Number(doc.grossSalary) || 0;
      if (doc.allowances) {
        data.salaryIncome.hra += Number(doc.allowances.hra) || 0;
        data.salaryIncome.lta += Number(doc.allowances.lta) || 0;
      }
      
      // Deductions
      if (doc.professionalTax) {
        // Professional tax goes to standard deductions logic or deductions aggregate
      }
      if (doc.totalTDS) {
        data.tdsDetails.total += Number(doc.totalTDS) || 0;
        data.tdsDetails.breakdown.push({
          deductor: doc.employerName || 'Employer',
          tan: doc.employerTAN || '',
          amount: Number(doc.totalTDS) || 0,
          quarter: 'Q1-Q4',
          status: 'Verified',
        });
      }
      if (doc.tdsQuarterWise && Array.isArray(doc.tdsQuarterWise)) {
        doc.tdsQuarterWise.forEach((q) => {
          data.tdsDetails.breakdown.push({
            deductor: doc.employerName || 'Employer',
            tan: doc.employerTAN || '',
            amount: Number(q.amount) || 0,
            quarter: q.quarter || 'Q',
            status: 'Verified',
          });
        });
      }
    }

    // --- FORM 26AS ---
    if (doc.totalTDS && Array.isArray(doc.totalTDS)) {
      doc.totalTDS.forEach((t) => {
        const amt = Number(t.amount) || 0;
        data.tdsDetails.total += amt;
        data.tdsDetails.breakdown.push({
          deductor: t.deductorName || 'Deductor',
          tan: t.tan || '',
          amount: amt,
          quarter: t.quarter || 'Annual',
          status: t.status || 'Verified',
        });
      });
    }
    if (doc.advanceTax) {
      // Advance tax paid
    }

    // --- AIS ---
    if (doc.salaryIncome) {
      if (data.salaryIncome.gross === 0) data.salaryIncome.gross = Number(doc.salaryIncome);
    }
    if (doc.interestIncome) {
      data.otherIncome.interest += Number(doc.interestIncome) || 0;
    }
    if (doc.dividendIncome) {
      data.otherIncome.dividend += Number(doc.dividendIncome) || 0;
    }

    // --- FORM 16A ---
    if (doc.tdsDeducted !== undefined) {
      const amt = Number(doc.tdsDeducted) || 0;
      data.tdsDetails.total += amt;
      data.tdsDetails.breakdown.push({
        deductor: doc.deductorName || 'Deductor',
        tan: doc.deductorTAN || '',
        amount: amt,
        quarter: 'Annual',
        status: 'Verified',
      });
    }

    // --- BANK INTEREST CERTIFICATE ---
    if (doc.savingsInterest !== undefined || doc.fdInterest !== undefined) {
      data.otherIncome.interest += (Number(doc.savingsInterest) || 0) + (Number(doc.fdInterest) || 0);
      if (doc.tdsDeducted) {
        const amt = Number(doc.tdsDeducted) || 0;
        data.tdsDetails.total += amt;
        data.tdsDetails.breakdown.push({
          deductor: doc.bankName || 'Bank',
          tan: '',
          amount: amt,
          quarter: 'Annual',
          status: 'Verified',
        });
      }
    }

    // --- CAPITAL GAINS STATEMENT ---
    if (doc.stcg !== undefined || doc.ltcg !== undefined) {
      data.otherIncome.capitalGains += (Number(doc.stcg) || 0) + (Number(doc.ltcg) || 0);
    }
  });

  // 3. Derived values & deductions logic
  // Estimate basic salary as 50% of gross salary
  const basicSalaryEstimate = data.salaryIncome.gross * 0.5;
  const hraExempt = Math.min(data.salaryIncome.hra, basicSalaryEstimate * 0.4); // Standard non-metro/metro approximation (40%)

  // Calculate Old Regime values
  const standardDeductionOld = Math.min(50000, data.salaryIncome.gross);
  const netSalaryOld = Math.max(0, data.salaryIncome.gross - standardDeductionOld - hraExempt);
  const totalIncomeOld = netSalaryOld + data.otherIncome.interest + data.otherIncome.dividend + data.otherIncome.capitalGains;
  const totalDeductionsOld = Math.min(data.deductions['80c'], 150000) +
                             data.deductions['80d'] +
                             data.deductions['80e'] +
                             data.deductions['80g'] +
                             Math.min(data.deductions['nps'], 50000);
  const taxableIncomeOld = Math.max(0, totalIncomeOld - totalDeductionsOld);

  // Calculate New Regime values
  const standardDeductionNew = Math.min(75000, data.salaryIncome.gross);
  const netSalaryNew = Math.max(0, data.salaryIncome.gross - standardDeductionNew); // HRA exemption is NOT allowed under New Regime
  const totalIncomeNew = netSalaryNew + data.otherIncome.interest + data.otherIncome.dividend + data.otherIncome.capitalGains;
  const taxableIncomeNew = Math.max(0, totalIncomeNew); // No Chapter VI-A deductions under New Regime

  // 4. Run tax calculations for both regimes
  const oldRegimeTax = calculateOldRegimeTax(taxableIncomeOld);
  const newRegimeTax = calculateNewRegimeTax(taxableIncomeNew);

  const recommendedRegime = newRegimeTax.total <= oldRegimeTax.total ? 'new' : 'old';
  const finalTaxDue = recommendedRegime === 'new' ? newRegimeTax.total : oldRegimeTax.total;

  // Set the dashboard-facing standard deduction and net salary based on recommended regime
  if (recommendedRegime === 'new') {
    data.salaryIncome.standard = standardDeductionNew;
    data.salaryIncome.net = netSalaryNew;
  } else {
    data.salaryIncome.standard = standardDeductionOld;
    data.salaryIncome.net = netSalaryOld;
  }

  const tdsPaid = data.tdsDetails.total;
  const balancePayable = Math.max(0, finalTaxDue - tdsPaid);
  const refundDue = Math.max(0, tdsPaid - finalTaxDue);

  data.taxComputation = {
    oldRegime: {
      taxableIncome: taxableIncomeOld,
      tax: oldRegimeTax.tax,
      surcharge: oldRegimeTax.surcharge,
      cess: oldRegimeTax.cess,
      total: oldRegimeTax.total,
    },
    newRegime: {
      taxableIncome: taxableIncomeNew,
      tax: newRegimeTax.tax,
      surcharge: newRegimeTax.surcharge,
      cess: newRegimeTax.cess,
      total: newRegimeTax.total,
    },
    recommended: recommendedRegime,
    tdsAlreadyPaid: tdsPaid,
    balancePayable,
    refundDue,
  };

  return data;
};

module.exports = {
  compileAutoFillData,
  calculateNewRegimeTax,
  calculateOldRegimeTax,
};
