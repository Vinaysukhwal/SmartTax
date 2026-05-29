/**
 * Calculator.jsx — Premium Interactive Tax Calculator Page (Public)
 * 
 * Side-by-side Old vs New Tax Regime comparisons with responsive inputs,
 * animated comparison bars, and gross breakdown.
 */

import { useState, useEffect } from 'react';
import { calculateNewRegimeTax, calculateOldRegimeTax, formatCurrency } from '../utils/taxCalculations';
import toast from 'react-hot-toast';

const Calculator = () => {
  // Input fields state
  const [salary, setSalary] = useState('');
  const [house, setHouse] = useState('');
  const [capital, setCapital] = useState('');
  const [other, setOther] = useState('');

  const [sec80c, setSec80c] = useState('');
  const [sec80d, setSec80d] = useState('');
  const [sec80ccd, setSec80ccd] = useState('');
  const [hra, setHra] = useState('');

  // Results state
  const [gross, setGross] = useState(0);
  const [totalDeductions, setTotalDeductions] = useState(0);
  const [oldTaxable, setOldTaxable] = useState(0);
  const [newTaxable, setNewTaxable] = useState(0);
  
  const [oldTaxVal, setOldTaxVal] = useState(0);
  const [newTaxVal, setNewTaxVal] = useState(0);
  const [oldCessVal, setOldCessVal] = useState(0);
  const [newCessVal, setNewCessVal] = useState(0);

  const [savings, setSavings] = useState(0);
  const [recommended, setRecommended] = useState('new');
  
  // Transition trigger
  const [pulse, setPulse] = useState(false);

  // Auto calculate when values change
  useEffect(() => {
    handleCalculation();
  }, [salary, house, capital, other, sec80c, sec80d, sec80ccd, hra]);

  const handleCalculation = () => {
    const sVal = parseFloat(salary) || 0;
    const hVal = parseFloat(house) || 0;
    const cVal = parseFloat(capital) || 0;
    const oVal = parseFloat(other) || 0;

    const c80c = Math.min(parseFloat(sec80c) || 0, 150000); // 80C cap: 1.5L
    const c80d = parseFloat(sec80d) || 0;
    const cNps = Math.min(parseFloat(sec80ccd) || 0, 50000); // NPS cap: 50k
    const cHra = parseFloat(hra) || 0;

    const calculatedGross = sVal + hVal + cVal + oVal;
    const deductionsSum = c80c + c80d + cNps + cHra;

    // Use our utility functions
    const oldRegime = calculateOldRegimeTax(calculatedGross, deductionsSum, sVal);
    const newRegime = calculateNewRegimeTax(calculatedGross, sVal);

    setGross(calculatedGross);
    setTotalDeductions(deductionsSum + oldRegime.standardDeduction); // standard deduction is included in old total deductions display
    setOldTaxable(oldRegime.taxableIncome);
    setNewTaxable(newRegime.taxableIncome);

    setOldTaxVal(oldRegime.totalTax);
    setNewTaxVal(newRegime.totalTax);
    setOldCessVal(oldRegime.cess);
    setNewCessVal(newRegime.cess);

    const diff = Math.abs(oldRegime.totalTax - newRegime.totalTax);
    setSavings(diff);
    setRecommended(newRegime.totalTax <= oldRegime.totalTax ? 'new' : 'old');
  };

  const triggerCalculate = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 400);
    toast.success('Tax updated successfully!', { id: 'calc-toast' });
  };

  // Bar chart computations
  const maxTax = Math.max(oldTaxVal, newTaxVal, 1);
  const oldWidth = (oldTaxVal / maxTax) * 100;
  const newWidth = (newTaxVal / maxTax) * 100;

  return (
    <div className="min-h-screen pb-24 text-[#e8dfee] bg-[#0f0f0f] font-sans relative overflow-x-hidden">
      
      {/* Mesh Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#7c3aed]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#6f00be]/5 blur-[120px] rounded-full"></div>
      </div>

      <main className="pt-24 px-6 md:px-12 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="mb-12">
          <h1 className="text-3xl md:text-5xl font-extrabold mb-2 text-on-surface tracking-tight bg-gradient-to-r from-white to-[#ccc3d8] bg-clip-text text-transparent">
            Income Tax Calculator
          </h1>
          <p className="text-[#ccc3d8]/80 font-semibold text-sm">
            Financial Year 2025-26 | Assessment Year 2026-27 (Latest Budget Updates)
          </p>
        </section>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Input Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-3xl p-6 border border-[#4a4455]/20">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#d2bbff]">
                <span className="material-symbols-outlined text-[#7c3aed]">analytics</span>
                Enter Details
              </h2>

              {/* Income Fields */}
              <div className="space-y-4 mb-8">
                <label className="block text-xs font-bold text-[#ccc3d8]/80 uppercase tracking-wider mb-2">Income Sources</label>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#ccc3d8]">Salary Income</label>
                  <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                    <input
                      type="number"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#ccc3d8]">House Property Income</label>
                  <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                    <input
                      type="number"
                      value={house}
                      onChange={(e) => setHouse(e.target.value)}
                      placeholder="0"
                      className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8]">Capital Gains</label>
                    <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                      <input
                        type="number"
                        value={capital}
                        onChange={(e) => setCapital(e.target.value)}
                        placeholder="₹ 0"
                        className="w-full bg-transparent border-none rounded-xl py-3 px-4 text-[#e8dfee] focus:ring-0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8]">Other Income</label>
                    <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                      <input
                        type="number"
                        value={other}
                        onChange={(e) => setOther(e.target.value)}
                        placeholder="₹ 0"
                        className="w-full bg-transparent border-none rounded-xl py-3 px-4 text-[#e8dfee] focus:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Deduction Fields */}
              <div className="space-y-4 mb-8">
                <label className="block text-xs font-bold text-[#ccc3d8]/80 uppercase tracking-wider mb-2">Deductions (For Old Regime)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8]">Sec 80C (Max 1.5L)</label>
                    <input
                      type="number"
                      value={sec80c}
                      onChange={(e) => setSec80c(e.target.value)}
                      placeholder="₹ 0"
                      className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-3 px-4 text-[#e8dfee] text-sm focus:ring-1 focus:ring-[#7c3aed]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8]">Sec 80D (Health)</label>
                    <input
                      type="number"
                      value={sec80d}
                      onChange={(e) => setSec80d(e.target.value)}
                      placeholder="₹ 0"
                      className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-3 px-4 text-[#e8dfee] text-sm focus:ring-1 focus:ring-[#7c3aed]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8]">80CCD (NPS Max 50k)</label>
                    <input
                      type="number"
                      value={sec80ccd}
                      onChange={(e) => setSec80ccd(e.target.value)}
                      placeholder="₹ 0"
                      className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-3 px-4 text-[#e8dfee] text-sm focus:ring-1 focus:ring-[#7c3aed]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8]">HRA Exemption</label>
                    <input
                      type="number"
                      value={hra}
                      onChange={(e) => setHra(e.target.value)}
                      placeholder="₹ 0"
                      className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-3 px-4 text-[#e8dfee] text-sm focus:ring-1 focus:ring-[#7c3aed]"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={triggerCalculate}
                className="w-full h-14 bg-gradient-to-r from-[#7c3aed] to-[#ddb7ff] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#7c3aed]/20 hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined">calculate</span>
                Calculate Tax
              </button>
            </div>
          </div>

          {/* Right Results Panel */}
          <div className="lg:col-span-7 space-y-6">
            <div className={`glass-card rounded-3xl p-8 border border-[#4a4455]/20 transition-all duration-300 ${pulse ? 'scale-[1.01]' : ''}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-extrabold text-[#e8dfee]">Your Tax Summary</h2>
                <div className="flex items-center gap-2 bg-[#221e28] px-4 py-2 rounded-full border border-[#4a4455]/20">
                  <span className="material-symbols-outlined text-[#ffb784] text-sm">history</span>
                  <span className="text-xs font-bold">Updated Live</span>
                </div>
              </div>

              {/* Side-by-side Regime Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {/* Old Regime */}
                <div className="glass-card rounded-2xl p-6 border border-[#4a4455]/20 relative overflow-hidden transition-all duration-300">
                  <div className="text-xs font-bold text-[#ccc3d8]/80 mb-4 flex items-center justify-between">
                    OLD REGIME
                    <span className="material-symbols-outlined text-xs">info</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-[#ccc3d8] uppercase tracking-wider">Taxable Income</p>
                      <p className="text-xl font-bold text-[#e8dfee]">{formatCurrency(oldTaxable)}</p>
                    </div>
                    <div className="pt-4 border-t border-[#4a4455]/20">
                      <p className="text-[10px] text-[#ccc3d8] uppercase tracking-wider">Estimated Tax</p>
                      <p className="text-3xl font-extrabold text-white">{formatCurrency(oldTaxVal)}</p>
                    </div>
                  </div>
                </div>

                {/* New Regime */}
                <div className={`glass-card rounded-2xl p-6 border relative overflow-hidden transition-all duration-300 ${recommended === 'new' ? 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'border-[#4a4455]/20'}`}>
                  {recommended === 'new' && (
                    <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs font-bold">verified</span>
                      BEST REGIME
                    </div>
                  )}
                  <div className="text-xs font-bold text-[#ccc3d8]/80 mb-4">NEW REGIME</div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-[#ccc3d8] uppercase tracking-wider">Taxable Income</p>
                      <p className="text-xl font-bold text-[#e8dfee]">{formatCurrency(newTaxable)}</p>
                    </div>
                    <div className="pt-4 border-t border-[#4a4455]/20">
                      <p className="text-[10px] text-[#ccc3d8] uppercase tracking-wider">Estimated Tax</p>
                      <p className="text-3xl font-extrabold text-[#d2bbff]">{formatCurrency(newTaxVal)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Bars Comparison */}
              <div className="space-y-6 mb-10">
                <label className="block text-xs font-bold text-[#ccc3d8]/80 uppercase tracking-wider">Tax Comparison Chart</label>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[#ccc3d8]">
                      <span>Old Regime</span>
                      <span className="font-semibold">{formatCurrency(oldTaxVal)}</span>
                    </div>
                    <div className="w-full bg-[#221e28] rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-[#958da1]/40 rounded-full transition-all duration-700"
                        style={{ width: `${oldWidth}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[#d2bbff]">
                      <span className="font-bold">New Regime</span>
                      <span className="font-bold">{formatCurrency(newTaxVal)}</span>
                    </div>
                    <div className="w-full bg-[#221e28] rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#7c3aed] to-[#ddb7ff] rounded-full transition-all duration-700"
                        style={{ width: `${newWidth}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Savings Banner */}
              {savings > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between animate-fadeIn mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <span className="material-symbols-outlined">savings</span>
                    </div>
                    <div>
                      <p className="text-emerald-400 font-extrabold text-sm">
                        You save {formatCurrency(savings)} with the {recommended === 'new' ? 'New Regime' : 'Old Regime'}!
                      </p>
                      <p className="text-[#ccc3d8] text-xs mt-0.5">Recommended option for maximum benefits.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Breakdown */}
              <div className="border-t border-[#4a4455]/20 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[#ccc3d8] text-[10px] font-bold uppercase tracking-wider mb-1">Gross Total</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(gross)}</p>
                </div>
                <div>
                  <p className="text-[#ccc3d8] text-[10px] font-bold uppercase tracking-wider mb-1">Deductions</p>
                  <p className="text-sm font-bold text-white">{formatCurrency(totalDeductions)}</p>
                </div>
                <div>
                  <p className="text-[#ccc3d8] text-[10px] font-bold uppercase tracking-wider mb-1">Surcharge</p>
                  <p className="text-sm font-bold text-white">₹0</p>
                </div>
                <div>
                  <p className="text-[#ccc3d8] text-[10px] font-bold uppercase tracking-wider mb-1">Cess (4%)</p>
                  <p className="text-sm font-bold text-white">
                    {formatCurrency(recommended === 'new' ? newCessVal : oldCessVal)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informative Grid */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-[#4a4455]/20 flex items-start gap-4">
            <span className="material-symbols-outlined text-[#7c3aed] text-3xl">bolt</span>
            <div>
              <h4 className="font-bold text-sm text-[#e8dfee] mb-1">Instant Calculation</h4>
              <p className="text-[#ccc3d8]/70 text-xs leading-relaxed">Real-time computations strictly compiled under FY 2025-26 rules.</p>
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-[#4a4455]/20 flex items-start gap-4">
            <span className="material-symbols-outlined text-[#ffb784] text-3xl">shield</span>
            <div>
              <h4 className="font-bold text-sm text-[#e8dfee] mb-1">Privacy First</h4>
              <p className="text-[#ccc3d8]/70 text-xs leading-relaxed">Calculations happen entirely in your browser. Your sensitive data is safe.</p>
            </div>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-[#4a4455]/20 flex items-start gap-4">
            <span className="material-symbols-outlined text-emerald-400 text-3xl">recommend</span>
            <div>
              <h4 className="font-bold text-sm text-[#e8dfee] mb-1">Smart Optimization</h4>
              <p className="text-[#ccc3d8]/70 text-xs leading-relaxed">Personalized tips suggesting the optimal tax-saving route for your income.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Calculator;
