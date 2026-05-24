import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../config/api';
import { calculateNewRegimeTax, calculateOldRegimeTax, formatCurrency } from '../utils/taxCalculations';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

const ItrWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard state (1: Personal, 2: Income, 3: Deductions, 4: Review)
  const [currentStep, setCurrentStep] = useState(1);
  const [itrType, setItrType] = useState('ITR-1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    personalInfo: {
      fullName: user?.name || '',
      pan: user?.pan || '',
      dob: '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || '',
      bankName: '',
      accountNumber: '',
      ifsc: '',
    },
    incomeDetails: {
      grossSalary: '',
      housePropertyIncome: '',
      otherIncome: '',
      interestIncome: '',
      capitalGainsSTCG: '',
      capitalGainsLTCG: '',
      foreignIncome: '',
      businessIncome: '',
      businessExpenses: '',
      presumptiveTurnover: '',
      presumptiveRate: '8',
    },
    deductions: {
      section80C: '',
      section80D: '',
      section80CCD: '',
      section80E: '',
      section80G: '',
    },
  });

  // Selected regime ('new' or 'old')
  const [selectedRegime, setSelectedRegime] = useState('new');
  // State for triggering visual preview pulse when inputs update
  const [pulse, setPulse] = useState(false);

  // Load existing filing on mount
  useEffect(() => {
    const loadFiling = async () => {
      try {
        const response = await API.get(`/itr/get/${user.id}`);
        if (response.data) {
          const filing = response.data;
          setItrType(filing.itrType || 'ITR-1');
          setCurrentStep(filing.currentStep || 1);
          if (filing.formData) {
            setFormData((prev) => ({
              personalInfo: { ...prev.personalInfo, ...filing.formData.personalInfo },
              incomeDetails: { ...prev.incomeDetails, ...filing.formData.incomeDetails },
              deductions: { ...prev.deductions, ...filing.formData.deductions },
            }));
          }
        }
      } catch (error) {
        console.error('Load filing error:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) loadFiling();
  }, [user]);

  // Handle value change trigger pulse
  const triggerPulse = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 400);
  };

  const updateField = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
    triggerPulse();
  };

  // Calculations
  const calculateTotalIncome = () => {
    const inc = formData.incomeDetails;
    let total = 0;
    total += Number(inc.grossSalary) || 0;
    total += Number(inc.housePropertyIncome) || 0;
    total += Number(inc.otherIncome) || 0;
    total += Number(inc.interestIncome) || 0;

    if (itrType === 'ITR-2') {
      total += Number(inc.capitalGainsSTCG) || 0;
      total += Number(inc.capitalGainsLTCG) || 0;
      total += Number(inc.foreignIncome) || 0;
    }
    if (itrType === 'ITR-3') {
      total += (Number(inc.businessIncome) || 0) - (Number(inc.businessExpenses) || 0);
    }
    if (itrType === 'ITR-4') {
      const turnover = Number(inc.presumptiveTurnover) || 0;
      const rate = Number(inc.presumptiveRate) || 8;
      total += turnover * (rate / 100);
    }
    return total;
  };

  const calculateTotalDeductions = () => {
    const ded = formData.deductions;
    return (
      Math.min(Number(ded.section80C) || 0, 150000) +
      (Number(ded.section80D) || 0) +
      Math.min(Number(ded.section80CCD) || 0, 50000) +
      (Number(ded.section80E) || 0) +
      (Number(ded.section80G) || 0)
    );
  };

  const totalIncome = calculateTotalIncome();
  const totalDeductions = calculateTotalDeductions();

  const newRegimeTax = calculateNewRegimeTax(totalIncome);
  const oldRegimeTax = calculateOldRegimeTax(totalIncome, totalDeductions);

  // Auto-recommend regime
  const recommendedRegime = newRegimeTax.totalTax <= oldRegimeTax.totalTax ? 'new' : 'old';
  const taxSavings = Math.abs(newRegimeTax.totalTax - oldRegimeTax.totalTax);

  // Auto-select recommended regime on load/income recalculate
  useEffect(() => {
    setSelectedRegime(recommendedRegime);
  }, [recommendedRegime]);

  const saveProgress = async (step, status = 'in-progress') => {
    setSaving(true);
    try {
      await API.post('/itr/save', {
        itrType,
        currentStep: step,
        status,
        formData,
      });
      toast.success('Progress saved!');
    } catch (error) {
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await saveProgress(nextStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(124, 58, 237);
    doc.text('SmartTax — ITR Filing Summary', 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 20, 33);
    doc.text(`Form: ${itrType} | AY: 2026-27 | FY: 2025-26`, 20, 39);
    doc.setDrawColor(200);
    doc.line(20, 43, 190, 43);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('1. Personal Information', 20, 52);
    doc.setFontSize(10);
    doc.setTextColor(60);
    const pi = formData.personalInfo;
    doc.text(`Name: ${pi.fullName}`, 25, 60);
    doc.text(`PAN: ${pi.pan}`, 25, 66);
    doc.text(`Email: ${pi.email}`, 25, 72);
    doc.text(`Phone: ${pi.phone}`, 120, 66);
    doc.text(`DOB: ${pi.dob}`, 120, 60);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('2. Income Details', 20, 85);
    doc.setFontSize(10);
    doc.setTextColor(60);
    let y = 93;
    const inc = formData.incomeDetails;
    if (inc.grossSalary) { doc.text(`Gross Salary: ${formatCurrency(Number(inc.grossSalary))}`, 25, y); y += 6; }
    if (inc.housePropertyIncome) { doc.text(`House Property Income: ${formatCurrency(Number(inc.housePropertyIncome))}`, 25, y); y += 6; }
    if (inc.otherIncome) { doc.text(`Other Income: ${formatCurrency(Number(inc.otherIncome))}`, 25, y); y += 6; }
    if (inc.interestIncome) { doc.text(`Interest Income: ${formatCurrency(Number(inc.interestIncome))}`, 25, y); y += 6; }
    doc.setTextColor(0);
    doc.text(`Total Income: ${formatCurrency(totalIncome)}`, 25, y + 2);

    y += 14;
    doc.setFontSize(14);
    doc.text('3. Deductions', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(60);
    const ded = formData.deductions;
    if (ded.section80C) { doc.text(`80C: ${formatCurrency(Math.min(Number(ded.section80C), 150000))}`, 25, y); y += 6; }
    if (ded.section80D) { doc.text(`80D: ${formatCurrency(Number(ded.section80D))}`, 25, y); y += 6; }
    if (ded.section80CCD) { doc.text(`80CCD(1B): ${formatCurrency(Math.min(Number(ded.section80CCD), 50000))}`, 25, y); y += 6; }
    if (ded.section80E) { doc.text(`80E: ${formatCurrency(Number(ded.section80E))}`, 25, y); y += 6; }
    if (ded.section80G) { doc.text(`80G: ${formatCurrency(Number(ded.section80G))}`, 25, y); y += 6; }
    doc.setTextColor(0);
    doc.text(`Total Deductions: ${formatCurrency(totalDeductions)}`, 25, y + 2);

    y += 14;
    doc.setFontSize(14);
    doc.text('4. Tax Computation', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`New Regime Tax: ${formatCurrency(newRegimeTax.totalTax)}`, 25, y);
    doc.text(`Old Regime Tax: ${formatCurrency(oldRegimeTax.totalTax)}`, 120, y);
    y += 8;
    doc.setTextColor(124, 58, 237);
    doc.setFontSize(12);
    const better = newRegimeTax.totalTax <= oldRegimeTax.totalTax ? 'New' : 'Old';
    const savings = Math.abs(newRegimeTax.totalTax - oldRegimeTax.totalTax);
    doc.text(`Recommended: ${better} Regime (saves ${formatCurrency(savings)})`, 25, y);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Disclaimer: This is a summary for reference only. Please file on incometax.gov.in', 20, 280);
    doc.text('Generated by SmartTax — Educational Project', 20, 285);

    doc.save(`SmartTax_${itrType}_Summary_AY2026-27.pdf`);
    toast.success('PDF downloaded!');
  };

  const handleSubmit = async () => {
    await saveProgress(4, 'filed');
    toast.success('ITR filing saved as "Filed"! 🎉');
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-[#0f0f0f] text-[#e8dfee]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c3aed]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#e8dfee] bg-[#0f0f0f] overflow-x-hidden font-sans">
      
      {/* Background blobs */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-[#7c3aed]/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[400px] bg-[#6f00be]/5 blur-[100px] rounded-full"></div>
      </div>

      {/* Main Container */}
      <main className="pt-8 pb-32 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        
        {/* Stepper Progress Bar */}
        <div className="mb-12 relative max-w-3xl mx-auto">
          <div className="flex justify-between items-center relative z-10">
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-2">
              <div
                onClick={() => currentStep > 1 && setCurrentStep(1)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 cursor-pointer transition-all ${
                  currentStep > 1
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : currentStep === 1
                    ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-[#d2bbff] accent-glow pulse-active'
                    : 'bg-[#221e28] border-[#4a4455]/40 text-[#ccc3d8]'
                }`}
              >
                <span className="material-symbols-outlined text-base">person</span>
              </div>
              <span className={`text-xs font-semibold ${currentStep >= 1 ? 'text-[#d2bbff]' : 'text-[#ccc3d8]/60'}`}>Info</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-2">
              <div
                onClick={() => currentStep > 2 && setCurrentStep(2)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 cursor-pointer transition-all ${
                  currentStep > 2
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : currentStep === 2
                    ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-[#d2bbff] accent-glow pulse-active'
                    : 'bg-[#221e28] border-[#4a4455]/40 text-[#ccc3d8]'
                }`}
              >
                <span className="material-symbols-outlined text-base">payments</span>
              </div>
              <span className={`text-xs font-semibold ${currentStep >= 2 ? 'text-[#d2bbff]' : 'text-[#ccc3d8]/60'}`}>Income</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-2">
              <div
                onClick={() => currentStep > 3 && setCurrentStep(3)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 cursor-pointer transition-all ${
                  currentStep > 3
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : currentStep === 3
                    ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-[#d2bbff] accent-glow pulse-active'
                    : 'bg-[#221e28] border-[#4a4455]/40 text-[#ccc3d8]'
                }`}
              >
                <span className="material-symbols-outlined text-base">account_balance</span>
              </div>
              <span className={`text-xs font-semibold ${currentStep >= 3 ? 'text-[#d2bbff]' : 'text-[#ccc3d8]/60'}`}>Deductions</span>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${
                  currentStep === 4
                    ? 'bg-[#7c3aed]/20 border-[#7c3aed] text-[#d2bbff] accent-glow pulse-active'
                    : 'bg-[#221e28] border-[#4a4455]/40 text-[#ccc3d8]'
                }`}
              >
                <span className="material-symbols-outlined text-base">rate_review</span>
              </div>
              <span className={`text-xs font-semibold ${currentStep === 4 ? 'text-[#d2bbff]' : 'text-[#ccc3d8]/60'}`}>Review</span>
            </div>
          </div>
          {/* Progress bar line */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-[#4a4455]/30 -z-10">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-[#7c3aed] transition-all duration-500"
              style={{
                width: `${((currentStep - 1) / 3) * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Form Selection Form Form type selector */}
        {currentStep === 1 && (
          <div className="glass-card p-6 rounded-2xl max-w-3xl mx-auto mb-8 border border-[#4a4455]/20 animate-fadeIn">
            <label className="block text-xs font-semibold text-[#ccc3d8] uppercase tracking-wider mb-2 ml-1">Select ITR Form</label>
            <div className="flex flex-wrap gap-3">
              {['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'].map((type) => (
                <button
                  key={type}
                  onClick={() => { setItrType(type); triggerPulse(); }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
                    itrType === type
                      ? 'border-[#7c3aed] bg-[#7c3aed]/10 text-[#d2bbff]'
                      : 'border-[#4a4455]/30 text-[#ccc3d8] hover:border-[#4a4455]/80'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Forms */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <div className="glass-card p-8 rounded-3xl border border-[#4a4455]/20 animate-fadeIn space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-[#e8dfee]">Personal Details</h3>
                  <p className="text-sm text-[#ccc3d8] mt-1">Verify your compliance credentials.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Full Name</label>
                    <input
                      value={formData.personalInfo.fullName}
                      onChange={(e) => updateField('personalInfo', 'fullName', e.target.value)}
                      className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-3 px-4 text-[#e8dfee] placeholder:text-[#958da1] focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">PAN Number</label>
                    <input
                      value={formData.personalInfo.pan}
                      disabled
                      className="w-full bg-[#100d16]/80 border border-[#4a4455]/20 rounded-xl py-3 px-4 text-[#958da1] cursor-not-allowed"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Date of Birth</label>
                    <input
                      value={formData.personalInfo.dob}
                      onChange={(e) => updateField('personalInfo', 'dob', e.target.value)}
                      className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-3 px-4 text-[#e8dfee] placeholder:text-[#958da1] focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all"
                      type="date"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Phone Number</label>
                    <input
                      value={formData.personalInfo.phone}
                      onChange={(e) => updateField('personalInfo', 'phone', e.target.value)}
                      className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-3 px-4 text-[#e8dfee] placeholder:text-[#958da1] focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all"
                      type="tel"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Street Address</label>
                    <input
                      value={formData.personalInfo.address}
                      onChange={(e) => updateField('personalInfo', 'address', e.target.value)}
                      className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-3 px-4 text-[#e8dfee] placeholder:text-[#958da1] focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all"
                      placeholder="Flat/House No, Building, Area"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">City</label>
                    <input
                      value={formData.personalInfo.city}
                      onChange={(e) => updateField('personalInfo', 'city', e.target.value)}
                      className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-3 px-4 text-[#e8dfee] placeholder:text-[#958da1] focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">State</label>
                    <input
                      value={formData.personalInfo.state}
                      onChange={(e) => updateField('personalInfo', 'state', e.target.value)}
                      className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-3 px-4 text-[#e8dfee] placeholder:text-[#958da1] focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Pincode</label>
                    <input
                      value={formData.personalInfo.pincode}
                      onChange={(e) => updateField('personalInfo', 'pincode', e.target.value)}
                      maxLength={6}
                      className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-3 px-4 text-[#e8dfee] placeholder:text-[#958da1] focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all"
                      type="text"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#4a4455]/20 space-y-4">
                  <h4 className="font-bold text-[#d2bbff]">Bank Account details (For Refunds)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs text-[#ccc3d8] ml-1">Bank Name</label>
                      <input
                        value={formData.personalInfo.bankName}
                        onChange={(e) => updateField('personalInfo', 'bankName', e.target.value)}
                        placeholder="SBI, ICICI..."
                        className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-2 px-3 text-[#e8dfee] text-sm focus:ring-1 focus:ring-[#7c3aed]"
                        type="text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-[#ccc3d8] ml-1">Account Number</label>
                      <input
                        value={formData.personalInfo.accountNumber}
                        onChange={(e) => updateField('personalInfo', 'accountNumber', e.target.value)}
                        className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-2 px-3 text-[#e8dfee] text-sm focus:ring-1 focus:ring-[#7c3aed]"
                        type="text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs text-[#ccc3d8] ml-1">IFSC Code</label>
                      <input
                        value={formData.personalInfo.ifsc}
                        onChange={(e) => updateField('personalInfo', 'ifsc', e.target.value.toUpperCase())}
                        placeholder="SBIN0001234"
                        className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-2 px-3 text-[#e8dfee] text-sm focus:ring-1 focus:ring-[#7c3aed]"
                        type="text"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Income Details */}
            {currentStep === 2 && (
              <div className="glass-card p-8 rounded-3xl border border-[#4a4455]/20 animate-fadeIn space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-[#e8dfee]">Income Details ({itrType})</h3>
                  <p className="text-sm text-[#ccc3d8] mt-1">Declare all active and passive streams.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5 input-focus-glow transition-all">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Gross Salary (Annual)</label>
                    <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                      <input
                        value={formData.incomeDetails.grossSalary}
                        onChange={(e) => updateField('incomeDetails', 'grossSalary', e.target.value)}
                        className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 input-focus-glow transition-all">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">House Property Income</label>
                    <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                      <input
                        value={formData.incomeDetails.housePropertyIncome}
                        onChange={(e) => updateField('incomeDetails', 'housePropertyIncome', e.target.value)}
                        className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 input-focus-glow transition-all">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Other Income (Interests, Dividends)</label>
                    <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                      <input
                        value={formData.incomeDetails.otherIncome}
                        onChange={(e) => updateField('incomeDetails', 'otherIncome', e.target.value)}
                        className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 input-focus-glow transition-all">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Interest Income</label>
                    <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                      <input
                        value={formData.incomeDetails.interestIncome}
                        onChange={(e) => updateField('incomeDetails', 'interestIncome', e.target.value)}
                        className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>

                  {/* ITR-2 Specific */}
                  {itrType === 'ITR-2' && (
                    <>
                      <div className="space-y-1.5 input-focus-glow transition-all">
                        <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Short Term Capital Gains (STCG)</label>
                        <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                          <input
                            value={formData.incomeDetails.capitalGainsSTCG}
                            onChange={(e) => updateField('incomeDetails', 'capitalGainsSTCG', e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                            placeholder="0"
                            type="number"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 input-focus-glow transition-all">
                        <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Long Term Capital Gains (LTCG)</label>
                        <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                          <input
                            value={formData.incomeDetails.capitalGainsLTCG}
                            onChange={(e) => updateField('incomeDetails', 'capitalGainsLTCG', e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                            placeholder="0"
                            type="number"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 input-focus-glow transition-all">
                        <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Foreign Income</label>
                        <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                          <input
                            value={formData.incomeDetails.foreignIncome}
                            onChange={(e) => updateField('incomeDetails', 'foreignIncome', e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                            placeholder="0"
                            type="number"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ITR-3 Specific */}
                  {itrType === 'ITR-3' && (
                    <>
                      <div className="space-y-1.5 input-focus-glow transition-all">
                        <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Business/Profession Income</label>
                        <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                          <input
                            value={formData.incomeDetails.businessIncome}
                            onChange={(e) => updateField('incomeDetails', 'businessIncome', e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                            placeholder="0"
                            type="number"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 input-focus-glow transition-all">
                        <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Business Expenses</label>
                        <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                          <input
                            value={formData.incomeDetails.businessExpenses}
                            onChange={(e) => updateField('incomeDetails', 'businessExpenses', e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                            placeholder="0"
                            type="number"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ITR-4 Specific */}
                  {itrType === 'ITR-4' && (
                    <>
                      <div className="space-y-1.5 input-focus-glow transition-all">
                        <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Gross Presumptive Turnover</label>
                        <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                          <input
                            value={formData.incomeDetails.presumptiveTurnover}
                            onChange={(e) => updateField('incomeDetails', 'presumptiveTurnover', e.target.value)}
                            className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                            placeholder="0"
                            type="number"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Presumptive Rate</label>
                        <select
                          value={formData.incomeDetails.presumptiveRate}
                          onChange={(e) => updateField('incomeDetails', 'presumptiveRate', e.target.value)}
                          className="w-full bg-[#100d16]/40 border border-[#4a4455]/30 rounded-xl py-3.5 px-4 text-[#e8dfee] text-sm focus:ring-1 focus:ring-[#7c3aed]"
                        >
                          <option value="8">8% — Business (Sec 44AD)</option>
                          <option value="6">6% — Digital Receipts (Sec 44AD)</option>
                          <option value="50">50% — Profession (Sec 44ADA)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {/* Regime Comparison Cards */}
                <div className="pt-6 border-t border-[#4a4455]/20">
                  <h4 className="font-bold text-[#e8dfee] mb-4">Regime Comparison Comparison</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Old Regime Card */}
                    <div
                      onClick={() => setSelectedRegime('old')}
                      className={`glass-card rounded-2xl p-5 border border-[#4a4455]/20 cursor-pointer transition-all ${
                        selectedRegime === 'old' ? 'regime-selected shadow-lg' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#ccc3d8]">Old Regime</span>
                        {recommendedRegime === 'old' && (
                          <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded font-bold">RECOMMENDED</span>
                        )}
                      </div>
                      <div className="text-2xl font-extrabold text-white mt-1">
                        {formatCurrency(oldRegimeTax.totalTax)}
                      </div>
                      <p className="text-[11px] text-[#ccc3d8] mt-2 italic">Standard deductions applicable.</p>
                    </div>

                    {/* New Regime Card */}
                    <div
                      onClick={() => setSelectedRegime('new')}
                      className={`glass-card rounded-2xl p-5 border border-[#4a4455]/20 cursor-pointer transition-all relative overflow-hidden ${
                        selectedRegime === 'new' ? 'regime-selected shadow-lg' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {recommendedRegime === 'new' && (
                        <div className="absolute -right-3 -top-3 bg-emerald-500 text-white font-bold text-[8px] px-4 py-1.5 rotate-12 shadow-lg">
                          RECOMMENDED
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#ccc3d8]">New Regime</span>
                      </div>
                      <div className="text-2xl font-extrabold text-white mt-1">
                        {formatCurrency(newRegimeTax.totalTax)}
                      </div>
                      {taxSavings > 0 && recommendedRegime === 'new' && (
                        <p className="text-[11px] text-emerald-400 font-semibold mt-2">Saves {formatCurrency(taxSavings)} more</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Deductions */}
            {currentStep === 3 && (
              <div className="glass-card p-8 rounded-3xl border border-[#4a4455]/20 animate-fadeIn space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-[#e8dfee]">Deductions (Old Regime)</h3>
                  <p className="text-sm text-[#ccc3d8] mt-1">Optimize old regime tax slabs with savings receipts.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5 input-focus-glow transition-all">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Section 80C — PPF, ELSS, Insurance (Max ₹1.5L)</label>
                    <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                      <input
                        value={formData.deductions.section80C}
                        onChange={(e) => updateField('deductions', 'section80C', Math.min(150000, Number(e.target.value)))}
                        className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 input-focus-glow transition-all">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Section 80D — Medical Premium (Self/Parents)</label>
                    <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                      <input
                        value={formData.deductions.section80D}
                        onChange={(e) => updateField('deductions', 'section80D', e.target.value)}
                        className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 input-focus-glow transition-all">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Section 80CCD — Additional NPS Contribution (Max ₹50k)</label>
                    <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                      <input
                        value={formData.deductions.section80CCD}
                        onChange={(e) => updateField('deductions', 'section80CCD', Math.min(50000, Number(e.target.value)))}
                        className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 input-focus-glow transition-all">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Section 80E — Education Loan Interest</label>
                    <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                      <input
                        value={formData.deductions.section80E}
                        onChange={(e) => updateField('deductions', 'section80E', e.target.value)}
                        className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 input-focus-glow transition-all">
                    <label className="block text-xs font-semibold text-[#ccc3d8] ml-1">Section 80G — Eligible Donations</label>
                    <div className="relative glass-card rounded-xl border border-[#4a4455]/30">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d2bbff] font-bold">₹</span>
                      <input
                        value={formData.deductions.section80G}
                        onChange={(e) => updateField('deductions', 'section80G', e.target.value)}
                        className="w-full bg-transparent border-none rounded-xl py-3 pl-10 pr-4 text-[#e8dfee] focus:ring-0 text-lg"
                        placeholder="0"
                        type="number"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="glass-card p-8 rounded-3xl border border-[#4a4455]/20 animate-fadeIn space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-[#e8dfee]">Review & Submit</h3>
                  <p className="text-sm text-[#ccc3d8] mt-1">Ensure all details are accurate before marking filed.</p>
                </div>

                <div className="space-y-4">
                  {/* Summary Block 1 */}
                  <div className="p-5 bg-[#221e28]/50 rounded-2xl border border-[#4a4455]/20">
                    <h4 className="text-xs font-bold text-[#d2bbff] uppercase tracking-wider mb-2">Filing Mode</h4>
                    <p className="text-lg font-bold text-white">{itrType} Form — FY 2025-26</p>
                  </div>
                  {/* Summary Block 2 */}
                  <div className="p-5 bg-[#221e28]/50 rounded-2xl border border-[#4a4455]/20">
                    <h4 className="text-xs font-bold text-[#d2bbff] uppercase tracking-wider mb-2">Taxpayer Information</h4>
                    <p className="text-sm font-semibold text-white">{formData.personalInfo.fullName}</p>
                    <p className="text-xs text-[#ccc3d8] mt-1">PAN: {formData.personalInfo.pan} | Email: {formData.personalInfo.email}</p>
                  </div>
                  {/* Summary Block 3 */}
                  <div className="p-5 bg-[#221e28]/50 rounded-2xl border border-[#4a4455]/20 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-[#d2bbff] uppercase tracking-wider mb-1">Financial Totals</h4>
                      <p className="text-xs text-[#ccc3d8]">Total Income / Deductions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">Gross: {formatCurrency(totalIncome)}</p>
                      <p className="text-xs font-bold text-emerald-400 mt-1">Deductions: - {formatCurrency(totalDeductions)}</p>
                    </div>
                  </div>

                  {/* side-by-side Regime summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className={`p-5 rounded-2xl border ${selectedRegime === 'new' ? 'border-[#7c3aed] bg-[#7c3aed]/5' : 'border-[#4a4455]/20 bg-[#221e28]/20 opacity-70'}`}>
                      <h4 className="text-xs font-bold text-[#ccc3d8] uppercase">New Regime Tax</h4>
                      <p className="text-2xl font-extrabold text-white mt-1">{formatCurrency(newRegimeTax.totalTax)}</p>
                    </div>
                    <div className={`p-5 rounded-2xl border ${selectedRegime === 'old' ? 'border-[#7c3aed] bg-[#7c3aed]/5' : 'border-[#4a4455]/20 bg-[#221e28]/20 opacity-70'}`}>
                      <h4 className="text-xs font-bold text-[#ccc3d8] uppercase">Old Regime Tax</h4>
                      <p className="text-2xl font-extrabold text-white mt-1">{formatCurrency(oldRegimeTax.totalTax)}</p>
                    </div>
                  </div>
                </div>

                {/* Submissions buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[#4a4455]/20">
                  <button
                    onClick={downloadPDF}
                    className="flex-1 py-4 glass-card rounded-xl font-bold hover:bg-white/5 transition-all text-sm flex items-center justify-center gap-2 border border-[#4a4455]/30 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    Download PDF Summary
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-4 bg-[#7c3aed] text-white rounded-xl font-bold hover:brightness-125 transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#7c3aed]/25 active:scale-95 btn-pulse"
                  >
                    <span className="material-symbols-outlined text-[18px]">done_all</span>
                    Submit &amp; Mark Filed
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Calculation Summary Panel */}
          <div className="lg:col-span-4 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <div className="sticky top-24 space-y-6">
              
              {/* Live Preview Panel */}
              <div className="glass-card rounded-3xl p-8 border border-[#4a4455]/20 overflow-hidden relative shadow-2xl">
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-[#7c3aed]/10 blur-3xl rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 space-y-8">
                  <div>
                    <h4 className="text-xs font-bold text-[#d2bbff] uppercase tracking-widest mb-6">Live computation</h4>
                    
                    <div className="space-y-5">
                      <div className="flex justify-between items-end border-b border-[#4a4455]/20 pb-4">
                        <span className="text-[#ccc3d8] text-sm">Taxable Income</span>
                        <span className={`text-lg font-bold text-white ${pulse ? 'value-pulse' : ''}`}>
                          {formatCurrency(totalIncome)}
                        </span>
                      </div>
                      <div className="flex justify-between items-end border-b border-[#4a4455]/20 pb-4">
                        <span className="text-[#ccc3d8] text-sm">Regime Deductions</span>
                        <span className="text-emerald-400 text-sm font-bold">
                          - {selectedRegime === 'new' ? formatCurrency(75000) : formatCurrency(totalDeductions)}
                        </span>
                      </div>
                      <div className="pt-2">
                        <span className="text-[#d2bbff] text-xs font-bold uppercase tracking-wider">Total Tax Payable (FY 25-26)</span>
                        <div className={`text-4xl font-extrabold text-[#d2bbff] mt-1 ${pulse ? 'value-pulse' : ''}`}>
                          {selectedRegime === 'new' ? formatCurrency(newRegimeTax.totalTax) : formatCurrency(oldRegimeTax.totalTax)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#221e28]/50 rounded-2xl p-4 flex gap-3 items-start border border-[#4a4455]/20">
                    <span className="material-symbols-outlined text-[#d2bbff] text-[20px]">lightbulb</span>
                    <p className="text-xs text-[#ccc3d8] leading-relaxed">
                      Based on current parameters, the <span className="text-[#d2bbff] font-bold">New Regime</span> is recommended for you, offering a tax savings of <span className="text-emerald-400 font-bold">{formatCurrency(taxSavings)}</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Security info card */}
              <div className="flex items-center gap-4 px-4 bg-[#221e28]/20 border border-[#4a4455]/10 p-4 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-[#100d16] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#ccc3d8] text-[18px]">security</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">AES-256 secure filing</p>
                  <p className="text-[10px] text-[#ccc3d8]/80">Compliance calculations are fully isolated.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* Bottom Sticky Action Footer */}
      <footer className="fixed bottom-0 left-0 w-full z-20 bg-[#100d16]/95 backdrop-blur-2xl border-t border-[#4a4455]/20 h-20 px-6 md:px-12 lg:px-24 flex items-center justify-between">
        
        {/* Back Button */}
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#4a4455]/30 text-[#ccc3d8] hover:bg-white/5 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back</span>
        </button>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-[#ccc3d8]/70 text-xs">
          <span className="material-symbols-outlined text-sm text-[#d2bbff]">cloud_done</span>
          <span>Filing progress autosaved</span>
        </div>

        {/* Next Step Button */}
        {currentStep < 4 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7c3aed] text-white font-bold hover:brightness-110 transition-all active:scale-95 btn-pulse text-sm shadow-lg shadow-[#7c3aed]/25"
          >
            <span>{saving ? 'Saving...' : 'Next Step'}</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:brightness-110 transition-all active:scale-95 text-sm shadow-lg shadow-emerald-500/25"
          >
            <span>Submit ITR</span>
            <span className="material-symbols-outlined text-[18px]">done_all</span>
          </button>
        )}
      </footer>

    </div>
  );
};

export default ItrWizard;
