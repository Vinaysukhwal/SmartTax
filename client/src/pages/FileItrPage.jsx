/**
 * File ITR Page — 4-Step Filing Wizard
 * 
 * Steps:
 * 1. Personal Info — Name, PAN, DOB, address, bank details
 * 2. Income Details — Income fields vary by ITR type
 * 3. Deductions — 80C, 80D, 80CCD, 80E, 80G
 * 4. Review & Submit — Summary, tax computation, download PDF
 * 
 * Progress is saved at each step via API.
 * Users can resume from where they left off.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../config/api';
import { calculateNewRegimeTax, calculateOldRegimeTax, formatCurrency } from '../utils/taxCalculations';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineCurrencyRupee,
  HiOutlineShieldCheck,
  HiOutlineClipboardCheck,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineDownload,
  HiOutlineSave,
} from 'react-icons/hi';

const FileItrPage = () => {
  const { user } = useAuth();

  // Current wizard step (1-4)
  const [currentStep, setCurrentStep] = useState(1);

  // Selected ITR type
  const [itrType, setItrType] = useState('ITR-1');

  // Form data across all steps
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
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
    // Step 2: Income Details
    incomeDetails: {
      grossSalary: '',
      housePropertyIncome: '',
      otherIncome: '',
      interestIncome: '',
      // ITR-2 specific
      capitalGainsSTCG: '',
      capitalGainsLTCG: '',
      foreignIncome: '',
      // ITR-3 specific
      businessIncome: '',
      businessExpenses: '',
      // ITR-4 specific
      presumptiveTurnover: '',
      presumptiveRate: '8', // 8% for business, 50% for profession
    },
    // Step 3: Deductions
    deductions: {
      section80C: '',
      section80D: '',
      section80CCD: '',
      section80E: '',
      section80G: '',
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step labels and icons
  const steps = [
    { number: 1, label: 'Personal Info', icon: HiOutlineUser },
    { number: 2, label: 'Income', icon: HiOutlineCurrencyRupee },
    { number: 3, label: 'Deductions', icon: HiOutlineShieldCheck },
    { number: 4, label: 'Review', icon: HiOutlineClipboardCheck },
  ];

  /**
   * Load existing filing data on mount (to resume progress)
   */
  useEffect(() => {
    const loadFiling = async () => {
      try {
        const response = await API.get(`/itr/get/${user.id}`);
        if (response.data) {
          const filing = response.data;
          setItrType(filing.itrType);
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

  /**
   * Update a field in a specific form section
   */
  const updateField = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  /**
   * Save current progress to the database
   */
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

  /**
   * Clear all details and reset filing draft to defaults
   */
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all ITR wizard details? This will delete your current draft.')) return;
    
    const clearedData = {
      personalInfo: {
        fullName: user?.name || '',
        pan: user?.pan || '',
        dob: '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
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
    };

    setFormData(clearedData);
    setCurrentStep(1);
    
    setSaving(true);
    try {
      await API.post('/itr/save', {
        itrType: 'ITR-1',
        currentStep: 1,
        status: 'in-progress',
        formData: clearedData,
      });
      toast.success('All ITR wizard details cleared!');
    } catch (error) {
      toast.error('Failed to clear details on the server');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Navigate to next step (and save)
   */
  const handleNext = async () => {
    if (currentStep < 4) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await saveProgress(nextStep);
    }
  };

  /**
   * Navigate to previous step
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Calculate total income based on ITR type
   */
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

  /**
   * Calculate total deductions
   */
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

  /**
   * Generate PDF summary of the filing
   */
  const downloadPDF = () => {
    const doc = new jsPDF();
    const totalIncome = calculateTotalIncome();
    const totalDeductions = calculateTotalDeductions();
    const newTax = calculateNewRegimeTax(totalIncome);
    const oldTax = calculateOldRegimeTax(totalIncome, totalDeductions);

    // PDF Header
    doc.setFontSize(20);
    doc.setTextColor(26, 86, 219);
    doc.text('SmartTax — ITR Filing Summary', 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 20, 33);
    doc.text(`Form: ${itrType} | AY: 2026-27 | FY: 2025-26`, 20, 39);

    // Line separator
    doc.setDrawColor(200);
    doc.line(20, 43, 190, 43);

    // Personal Info
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

    // Income Details
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

    // Deductions
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

    // Tax Computation
    y += 14;
    doc.setFontSize(14);
    doc.text('4. Tax Computation', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`New Regime Tax: ${formatCurrency(newTax.totalTax)}`, 25, y);
    doc.text(`Old Regime Tax: ${formatCurrency(oldTax.totalTax)}`, 120, y);
    y += 8;
    doc.setTextColor(26, 86, 219);
    doc.setFontSize(12);
    const better = newTax.totalTax <= oldTax.totalTax ? 'New' : 'Old';
    const savings = Math.abs(newTax.totalTax - oldTax.totalTax);
    doc.text(`Recommended: ${better} Regime (saves ${formatCurrency(savings)})`, 25, y);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Disclaimer: This is a summary for reference only. Please file on incometax.gov.in', 20, 280);
    doc.text('Generated by SmartTax — Educational Project', 20, 285);

    // Download
    doc.save(`SmartTax_${itrType}_Summary_AY2026-27.pdf`);
    toast.success('PDF downloaded!');
  };

  /**
   * Mark filing as completed
   */
  const handleSubmit = async () => {
    await saveProgress(4, 'filed');
    toast.success('ITR filing saved as "Filed"! 🎉');
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fadeIn">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">File Income Tax Return</h1>
          <p className="text-gray-600 mt-1">AY 2026-27 (FY 2025-26)</p>
        </div>

        {/* ITR Type Selector */}
        <div className="card mb-6">
          <label className="input-label">Select ITR Form</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4'].map((type) => (
              <button
                key={type}
                onClick={() => setItrType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  itrType === type
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-between mb-8 px-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  currentStep >= step.number
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs mt-1.5 font-medium ${
                  currentStep >= step.number ? 'text-primary-600' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-2 mb-5 ${
                  currentStep > step.number ? 'bg-primary-500' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="card animate-slideUp" key={currentStep}>
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="input-label">Full Name</label>
                  <input type="text" value={formData.personalInfo.fullName} onChange={(e) => updateField('personalInfo', 'fullName', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="input-label">PAN Number</label>
                  <input type="text" value={formData.personalInfo.pan} disabled className="input-field bg-gray-50" />
                </div>
                <div>
                  <label className="input-label">Date of Birth</label>
                  <input type="date" value={formData.personalInfo.dob} onChange={(e) => updateField('personalInfo', 'dob', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Phone</label>
                  <input type="tel" value={formData.personalInfo.phone} onChange={(e) => updateField('personalInfo', 'phone', e.target.value)} className="input-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="input-label">Address</label>
                  <input type="text" value={formData.personalInfo.address} onChange={(e) => updateField('personalInfo', 'address', e.target.value)} className="input-field" placeholder="Street address" />
                </div>
                <div>
                  <label className="input-label">City</label>
                  <input type="text" value={formData.personalInfo.city} onChange={(e) => updateField('personalInfo', 'city', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="input-label">State</label>
                  <input type="text" value={formData.personalInfo.state} onChange={(e) => updateField('personalInfo', 'state', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Pincode</label>
                  <input type="text" value={formData.personalInfo.pincode} onChange={(e) => updateField('personalInfo', 'pincode', e.target.value)} className="input-field" maxLength={6} />
                </div>
                <div className="md:col-span-2"><hr className="my-2" /><h3 className="font-medium text-gray-700 mb-3">Bank Account Details</h3></div>
                <div>
                  <label className="input-label">Bank Name</label>
                  <input type="text" value={formData.personalInfo.bankName} onChange={(e) => updateField('personalInfo', 'bankName', e.target.value)} className="input-field" placeholder="e.g., SBI" />
                </div>
                <div>
                  <label className="input-label">Account Number</label>
                  <input type="text" value={formData.personalInfo.accountNumber} onChange={(e) => updateField('personalInfo', 'accountNumber', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="input-label">IFSC Code</label>
                  <input type="text" value={formData.personalInfo.ifsc} onChange={(e) => updateField('personalInfo', 'ifsc', e.target.value.toUpperCase())} className="input-field" placeholder="e.g., SBIN0001234" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Income Details */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Income Details</h2>
              <p className="text-sm text-gray-500 mb-6">Form: {itrType}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Common fields */}
                <div>
                  <label className="input-label">Gross Salary Income (₹)</label>
                  <input type="number" value={formData.incomeDetails.grossSalary} onChange={(e) => updateField('incomeDetails', 'grossSalary', e.target.value)} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="input-label">House Property Income (₹)</label>
                  <input type="number" value={formData.incomeDetails.housePropertyIncome} onChange={(e) => updateField('incomeDetails', 'housePropertyIncome', e.target.value)} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="input-label">Other Income (₹)</label>
                  <input type="number" value={formData.incomeDetails.otherIncome} onChange={(e) => updateField('incomeDetails', 'otherIncome', e.target.value)} className="input-field" placeholder="0" />
                </div>
                <div>
                  <label className="input-label">Interest Income (₹)</label>
                  <input type="number" value={formData.incomeDetails.interestIncome} onChange={(e) => updateField('incomeDetails', 'interestIncome', e.target.value)} className="input-field" placeholder="0" />
                </div>

                {/* ITR-2 specific */}
                {itrType === 'ITR-2' && (
                  <>
                    <div>
                      <label className="input-label">Short Term Capital Gains (₹)</label>
                      <input type="number" value={formData.incomeDetails.capitalGainsSTCG} onChange={(e) => updateField('incomeDetails', 'capitalGainsSTCG', e.target.value)} className="input-field" placeholder="0" />
                    </div>
                    <div>
                      <label className="input-label">Long Term Capital Gains (₹)</label>
                      <input type="number" value={formData.incomeDetails.capitalGainsLTCG} onChange={(e) => updateField('incomeDetails', 'capitalGainsLTCG', e.target.value)} className="input-field" placeholder="0" />
                    </div>
                    <div>
                      <label className="input-label">Foreign Income (₹)</label>
                      <input type="number" value={formData.incomeDetails.foreignIncome} onChange={(e) => updateField('incomeDetails', 'foreignIncome', e.target.value)} className="input-field" placeholder="0" />
                    </div>
                  </>
                )}

                {/* ITR-3 specific */}
                {itrType === 'ITR-3' && (
                  <>
                    <div>
                      <label className="input-label">Business/Profession Income (₹)</label>
                      <input type="number" value={formData.incomeDetails.businessIncome} onChange={(e) => updateField('incomeDetails', 'businessIncome', e.target.value)} className="input-field" placeholder="0" />
                    </div>
                    <div>
                      <label className="input-label">Business Expenses (₹)</label>
                      <input type="number" value={formData.incomeDetails.businessExpenses} onChange={(e) => updateField('incomeDetails', 'businessExpenses', e.target.value)} className="input-field" placeholder="0" />
                    </div>
                  </>
                )}

                {/* ITR-4 specific */}
                {itrType === 'ITR-4' && (
                  <>
                    <div>
                      <label className="input-label">Gross Turnover / Receipts (₹)</label>
                      <input type="number" value={formData.incomeDetails.presumptiveTurnover} onChange={(e) => updateField('incomeDetails', 'presumptiveTurnover', e.target.value)} className="input-field" placeholder="0" />
                    </div>
                    <div>
                      <label className="input-label">Presumptive Rate (%)</label>
                      <select value={formData.incomeDetails.presumptiveRate} onChange={(e) => updateField('incomeDetails', 'presumptiveRate', e.target.value)} className="input-field">
                        <option value="8">8% — Business (Sec 44AD)</option>
                        <option value="6">6% — Digital receipts (Sec 44AD)</option>
                        <option value="50">50% — Profession (Sec 44ADA)</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Income Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-lg">
                  <span className="font-medium text-gray-700">Total Gross Income</span>
                  <span className="font-bold text-primary-600">{formatCurrency(calculateTotalIncome())}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Deductions */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Deductions</h2>
              <p className="text-sm text-gray-500 mb-6">Available under Old Tax Regime only</p>
              <div className="space-y-5">
                <div>
                  <label className="input-label">Section 80C — Max ₹1,50,000</label>
                  <input type="number" value={formData.deductions.section80C} onChange={(e) => updateField('deductions', 'section80C', e.target.value)} className="input-field" placeholder="PPF, ELSS, LIC, FD, etc." max={150000} />
                  <p className="text-xs text-gray-500 mt-1">PPF, ELSS, LIC premium, NSC, tax-saving FD, tuition fees, home loan principal</p>
                </div>
                <div>
                  <label className="input-label">Section 80D — Health Insurance</label>
                  <input type="number" value={formData.deductions.section80D} onChange={(e) => updateField('deductions', 'section80D', e.target.value)} className="input-field" placeholder="Self + parents premium" />
                  <p className="text-xs text-gray-500 mt-1">₹25,000 self + ₹25,000 parents (₹50,000 if senior citizen)</p>
                </div>
                <div>
                  <label className="input-label">Section 80CCD(1B) — NPS — Max ₹50,000</label>
                  <input type="number" value={formData.deductions.section80CCD} onChange={(e) => updateField('deductions', 'section80CCD', e.target.value)} className="input-field" placeholder="Additional NPS contribution" max={50000} />
                </div>
                <div>
                  <label className="input-label">Section 80E — Education Loan Interest</label>
                  <input type="number" value={formData.deductions.section80E} onChange={(e) => updateField('deductions', 'section80E', e.target.value)} className="input-field" placeholder="No upper limit" />
                </div>
                <div>
                  <label className="input-label">Section 80G — Donations</label>
                  <input type="number" value={formData.deductions.section80G} onChange={(e) => updateField('deductions', 'section80G', e.target.value)} className="input-field" placeholder="Donations to eligible charities" />
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-lg">
                  <span className="font-medium text-gray-700">Total Deductions</span>
                  <span className="font-bold text-green-600">{formatCurrency(calculateTotalDeductions())}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Review & Submit</h2>

              {/* Summary */}
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Form Type</h4>
                  <p className="text-lg font-bold text-primary-600">{itrType} — AY 2026-27</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Personal Info</h4>
                  <p className="text-sm text-gray-600">{formData.personalInfo.fullName} | PAN: {formData.personalInfo.pan}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <h4 className="font-medium text-gray-700">Gross Income</h4>
                    <span className="font-bold">{formatCurrency(calculateTotalIncome())}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <h4 className="font-medium text-gray-700">Total Deductions</h4>
                    <span className="font-bold text-green-600">- {formatCurrency(calculateTotalDeductions())}</span>
                  </div>
                </div>

                {/* Tax Computation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-1">New Regime Tax</h4>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(calculateNewRegimeTax(calculateTotalIncome()).totalTax)}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-1">Old Regime Tax</h4>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(calculateOldRegimeTax(calculateTotalIncome(), calculateTotalDeductions()).totalTax)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button onClick={downloadPDF} className="btn-secondary flex items-center justify-center flex-1">
                  <HiOutlineDownload className="w-5 h-5 mr-2" />
                  Download PDF Summary
                </button>
                <button onClick={handleSubmit} className="btn-primary flex items-center justify-center flex-1">
                  <HiOutlineSave className="w-5 h-5 mr-2" />
                  Mark as Filed
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons (Steps 1-3) */}
          {currentStep < 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <div className="flex gap-2">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="btn-secondary disabled:opacity-50 flex items-center"
                >
                  <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all flex items-center"
                  title="Clear all details and start fresh"
                >
                  Clear Details
                </button>
              </div>
              <button onClick={handleNext} className="btn-primary flex items-center">
                {saving ? 'Saving...' : 'Save & Continue'}
                <HiOutlineArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}
          {currentStep === 4 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <button onClick={handleBack} className="btn-secondary flex items-center">
                <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
                Back to Deductions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileItrPage;
