/**
 * SmartDashboard.jsx
 * 
 * Premium tax document scanner and auto-fill analyzer dashboard.
 * Dark theme (#0f0f0f) with glowing purple (#7c3aed) accents.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import API from '../config/api';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { jsPDF } from 'jspdf';
import {
  HiOutlineCloudUpload,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineReceiptTax,
  HiOutlineSparkles,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineChevronRight,
  HiOutlineDownload,
  HiOutlinePencilAlt,
} from 'react-icons/hi';

const SmartDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Component states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanJobId, setScanJobId] = useState(null);
  const [scanResults, setScanResults] = useState([]);
  const [computedData, setComputedData] = useState(null);
  const [selectedDocIndex, setSelectedDocIndex] = useState(null);

  // File Drop Handler
  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      progress: 0,
      status: 'idle', // idle, uploading, success, error
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    toast.success(`${acceptedFiles.length} file(s) added!`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
  });

  // Remove File from list
  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Start Multi-file upload and scan job
  const startScanning = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one document.');
      return;
    }

    setScanning(true);
    toast.loading('Starting scanner job...', { id: 'scan-toast' });

    try {
      // 1. Prepare FormData
      const formData = new FormData();
      uploadedFiles.forEach((f) => {
        formData.append('files', f.file);
      });

      // Update local file statuses to uploading
      setUploadedFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'uploading', progress: 30 }))
      );

      // 2. Upload files
      const uploadResponse = await API.post('/scan/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { jobId } = uploadResponse.data;
      setScanJobId(jobId);

      // Update progress to 100% upload and switch to scanning
      setUploadedFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'scanning', progress: 100 }))
      );

      // 3. Poll Scan Job Status until completed
      pollJobStatus(jobId);

    } catch (error) {
      console.error('Scan startup failed:', error);
      toast.error('Failed to initiate document scan.', { id: 'scan-toast' });
      setScanning(false);
      setUploadedFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error', progress: 0 }))
      );
    }
  };

  // Poll Job Status in intervals
  const pollJobStatus = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const response = await API.get(`/scan/status/${jobId}`);
        const job = response.data;

        // Sync individual file progress/status
        setUploadedFiles((prev) =>
          prev.map((localFile) => {
            const serverFile = job.files.find((sf) => sf.name === localFile.name);
            return serverFile
              ? {
                  ...localFile,
                  status:
                    serverFile.status === 'scanning'
                      ? 'scanning'
                      : serverFile.status === 'success'
                      ? 'success'
                      : 'error',
                }
              : localFile;
          })
        );

        if (job.status === 'completed') {
          clearInterval(interval);
          setScanResults(job.results);
          setScanning(false);

          const successfulResults = job.results.filter((r) => r.data);
          if (successfulResults.length === 0) {
            toast.error('Data extraction failed for all uploaded documents. Please check file formats/quality.', { id: 'scan-toast' });
          } else if (successfulResults.length < job.results.length) {
            toast.success(`Successfully analyzed ${successfulResults.length} of ${job.results.length} documents (some failed).`, { id: 'scan-toast' });
            calculateTax(successfulResults.map((r) => r.data));
          } else {
            toast.success('All documents analyzed successfully! 🚀', { id: 'scan-toast' });
            calculateTax(successfulResults.map((r) => r.data));
          }
        } else if (job.status === 'failed') {
          clearInterval(interval);
          toast.error(`Scanning job failed: ${job.error}`, { id: 'scan-toast' });
          setScanning(false);
        }
      } catch (error) {
        console.error('Polling status error:', error);
        clearInterval(interval);
        toast.error('Error tracking scan progress.', { id: 'scan-toast' });
        setScanning(false);
      }
    }, 2000);
  };

  // Calculate Tax details based on scanned document data
  const calculateTax = async (documentsData) => {
    try {
      const response = await API.post('/scan/calculate', { documentsData });
      setComputedData(response.data);
    } catch (error) {
      toast.error('Tax calculations failed.');
    }
  };

  // Save Autofilled draft return and navigate to wizard review
  const handleAutoFill = async () => {
    if (!computedData) return;
    
    const loadingToast = toast.loading('Pre-filling ITR draft details...');
    try {
      await API.post('/scan/prefill-itr', { autofillData: computedData });
      toast.success('ITR Form pre-filled successfully! 🎉', { id: loadingToast });
      navigate('/file-itr'); // Navigates to ITR Wizard which loads step 4
    } catch (error) {
      toast.error('Failed to pre-fill ITR wizard.', { id: loadingToast });
    }
  };

  // Download Summary PDF
  const downloadSummaryPDF = () => {
    if (!computedData) return;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(124, 58, 237);
    doc.text('SmartTax — Smart Scan Tax Summary', 20, 25);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 20, 33);
    doc.text(`AY: 2026-27 | FY: 2025-26`, 20, 39);
    doc.setDrawColor(200);
    doc.line(20, 43, 190, 43);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('1. Income Summary', 20, 52);
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Salary Income: INR ${computedData.salaryIncome.net.toLocaleString()}`, 25, 60);
    doc.text(`Interest Income: INR ${computedData.otherIncome.interest.toLocaleString()}`, 25, 66);
    doc.text(`Dividend Income: INR ${computedData.otherIncome.dividend.toLocaleString()}`, 25, 72);
    doc.text(`Capital Gains: INR ${computedData.otherIncome.capitalGains.toLocaleString()}`, 25, 78);
    doc.setFontSize(11);
    doc.setTextColor(0);
    const grossTotal = computedData.salaryIncome.net + computedData.otherIncome.interest + computedData.otherIncome.dividend + computedData.otherIncome.capitalGains;
    doc.text(`Gross Total Income: INR ${grossTotal.toLocaleString()}`, 25, 86);

    doc.setFontSize(14);
    doc.text('2. Deductions Claimed', 20, 98);
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Standard Deduction: INR ${computedData.salaryIncome.standard.toLocaleString()}`, 25, 106);
    doc.text(`80C Investments: INR ${computedData.deductions['80c'].toLocaleString()}`, 25, 112);
    doc.text(`80D Health Insurance: INR ${computedData.deductions['80d'].toLocaleString()}`, 25, 118);
    doc.text(`80CCD NPS Contribution: INR ${computedData.deductions['nps'].toLocaleString()}`, 25, 124);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('3. Regime Comparison & Computation', 20, 136);
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Old Regime Tax Payable: INR ${computedData.taxComputation.oldRegime.total.toLocaleString()}`, 25, 144);
    doc.text(`New Regime Tax Payable: INR ${computedData.taxComputation.newRegime.total.toLocaleString()}`, 25, 150);
    
    doc.setTextColor(124, 58, 237);
    doc.setFontSize(12);
    const recommended = computedData.taxComputation.recommended === 'new' ? 'New Regime' : 'Old Regime';
    const difference = Math.abs(computedData.taxComputation.oldRegime.total - computedData.taxComputation.newRegime.total);
    doc.text(`Recommended: ${recommended} (Saves INR ${difference.toLocaleString()})`, 25, 159);

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`Total TDS Already Paid: INR ${computedData.taxComputation.tdsAlreadyPaid.toLocaleString()}`, 25, 168);
    if (computedData.taxComputation.refundDue > 0) {
      doc.setTextColor(16, 185, 129);
      doc.text(`REFUND DUE: INR ${computedData.taxComputation.refundDue.toLocaleString()}`, 25, 176);
    } else {
      doc.setTextColor(239, 68, 68);
      doc.text(`BALANCE PAYABLE: INR ${computedData.taxComputation.balancePayable.toLocaleString()}`, 25, 176);
    }

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Disclaimer: This auto-filled tax summary is generated based on uploaded documents.', 20, 275);
    doc.text('SmartTax — Premium AI Tax Console', 20, 280);

    doc.save('SmartTax_AutoFill_Summary.pdf');
    toast.success('Summary PDF downloaded!');
  };

  // Recharts Chart Data Prep
  const getChartData = () => {
    if (!computedData) return [];
    return [
      {
        name: 'Old Regime',
        Taxable: computedData.taxComputation.oldRegime.taxableIncome,
        Tax: computedData.taxComputation.oldRegime.total,
        TDS: computedData.taxComputation.tdsAlreadyPaid,
      },
      {
        name: 'New Regime',
        Taxable: computedData.taxComputation.newRegime.taxableIncome,
        Tax: computedData.taxComputation.newRegime.total,
        TDS: computedData.taxComputation.tdsAlreadyPaid,
      },
    ];
  };

  // Confidence Score styling mapping
  const getConfidenceBadge = (score) => {
    switch (score) {
      case 'High':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">High</span>;
      case 'Medium':
        return <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Medium</span>;
      case 'Low':
      default:
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Low</span>;
    }
  };

  return (
    <div className="min-h-screen text-[#e8dfee] bg-[#0f0f0f] font-sans pb-24">
      {/* Mesh Background */}
      <div className="absolute inset-0 -z-10 bg-mesh pointer-events-none"></div>
      <style>{`
        .bg-mesh {
          background-image: 
            radial-gradient(at 10% 10%, rgba(124, 58, 237, 0.08) 0px, transparent 60%),
            radial-gradient(at 90% 90%, rgba(111, 0, 190, 0.05) 0px, transparent 60%);
        }
        .pulse-scanner {
          animation: scan-pulse 2s infinite ease-in-out;
        }
        @keyframes scan-pulse {
          0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(124, 58, 237, 0); }
          100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#4a4455]/20 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#e8dfee] flex items-center gap-2">
              <HiOutlineSparkles className="text-[#d2bbff] animate-pulse" />
              Smart Auto-Fill Console
            </h1>
            <p className="text-sm text-[#ccc3d8]/80 mt-1">
              Upload compliance documents to let our multimodal Gemini API process and auto-fill your ITR return.
            </p>
          </div>
          {(uploadedFiles.length > 0 || scanResults.length > 0 || computedData) && (
            <button
              onClick={() => {
                setUploadedFiles([]);
                setScanResults([]);
                setComputedData(null);
                setSelectedDocIndex(null);
                setScanJobId(null);
                toast.success('Console reset successfully! 🧹');
              }}
              className="px-5 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300 transition-all active:scale-95 text-sm font-bold flex items-center gap-2 self-start md:self-end"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              <span>Clear Console / Reset</span>
            </button>
          )}
        </div>

        {/* SECTION 1: Document Upload Zone */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div
              {...getRootProps()}
              className={`glass-card rounded-[2rem] p-8 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-[#7c3aed] bg-[#7c3aed]/5'
                  : 'border-[#4a4455]/30 hover:border-[#7c3aed]/50 hover:bg-[#7c3aed]/2'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-16 h-16 rounded-full bg-[#7c3aed]/10 flex items-center justify-center text-[#d2bbff] mb-4">
                <HiOutlineCloudUpload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Drag & Drop tax files here</h3>
              <p className="text-xs text-[#ccc3d8]/60 mt-1.5">
                Supports Form 16, Form 26AS, AIS, Bank Interest Certificates, & Capital Gains (PDF, JPG, PNG)
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                {['Form 16', 'Form 26AS', 'AIS', 'Form 16A', 'Bank Cert', 'Capital Gains'].map((chip) => (
                  <span
                    key={chip}
                    className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg bg-[#221e28] border border-[#4a4455]/20 text-[#ccc3d8]"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* Selected files list */}
            {uploadedFiles.length > 0 && (
              <div className="glass-card rounded-2xl p-4 border border-[#4a4455]/20 space-y-3">
                <h4 className="text-xs font-bold text-[#ccc3d8] uppercase tracking-wider">Queue ({uploadedFiles.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#100d16] border border-[#4a4455]/20"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="material-symbols-outlined text-[#ccc3d8] flex-shrink-0">draft</span>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-[#e8dfee] truncate">{file.name}</p>
                          <p className="text-[10px] text-[#ccc3d8]/60">{file.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === 'uploading' && (
                          <div className="w-4 h-4 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {file.status === 'scanning' && (
                          <span className="text-[10px] font-semibold text-[#d2bbff] animate-pulse">Scanning...</span>
                        )}
                        {file.status === 'success' && <HiOutlineCheckCircle className="text-emerald-400 w-5 h-5" />}
                        {file.status === 'error' && <HiOutlineXCircle className="text-red-400 w-5 h-5" />}
                        {file.status === 'idle' && (
                          <button
                            onClick={() => removeFile(idx)}
                            className="p-1 hover:text-red-400 rounded-lg text-[#ccc3d8]"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col justify-center">
            <button
              onClick={startScanning}
              disabled={scanning || uploadedFiles.length === 0}
              className={`w-full py-6 rounded-3xl font-extrabold text-lg flex flex-col items-center justify-center gap-2 border-2 transition-all duration-300 ${
                scanning
                  ? 'border-[#7c3aed]/20 bg-[#7c3aed]/5 text-[#ccc3d8] cursor-not-allowed'
                  : uploadedFiles.length === 0
                  ? 'border-[#4a4455]/20 bg-[#221e28]/20 text-[#ccc3d8]/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#7c3aed] to-[#ddb7ff] text-white border-transparent pulse-scanner hover:brightness-110 active:scale-[0.98]'
              }`}
            >
              {scanning ? (
                <>
                  <div className="w-10 h-10 border-4 border-[#d2bbff] border-t-transparent rounded-full animate-spin mb-1"></div>
                  <span>AI Scanning Active...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-4xl mb-1">magic_button</span>
                  <span>Scan All Documents</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* SECTION 2: Scanning Status Preview */}
        {scanResults.length > 0 && (
          <section className="glass-card rounded-[2rem] p-8 border border-[#4a4455]/20 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Extracted Documents Details</h2>
              <p className="text-xs text-[#ccc3d8]/70 mt-1">Review raw data and extraction confidence scores.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scanResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedDocIndex(idx)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    selectedDocIndex === idx
                      ? 'border-[#7c3aed] bg-[#7c3aed]/5'
                      : 'border-[#4a4455]/20 bg-[#100d16] hover:border-[#4a4455]/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#e8dfee] truncate max-w-[150px]" title={res.fileName}>
                        {res.fileName}
                      </h4>
                      <p className="text-[10px] text-[#ccc3d8]/70 font-semibold uppercase mt-0.5">{res.type}</p>
                    </div>
                    {getConfidenceBadge(res.confidence)}
                  </div>
                  
                  <div className="text-xs text-[#ccc3d8] space-y-1 border-t border-[#4a4455]/10 pt-3">
                    {res.data ? (
                      <>
                        {res.data.grossSalary !== undefined && <p>Salary: ₹{(res.data.grossSalary || 0).toLocaleString()}</p>}
                        {res.data.totalTDS !== undefined && <p>TDS: ₹{(res.data.totalTDS || 0).toLocaleString()}</p>}
                        {res.data.interestIncome !== undefined && <p>Interest: ₹{(res.data.interestIncome || 0).toLocaleString()}</p>}
                        {res.data.stcg !== undefined && <p>STCG: ₹{(res.data.stcg || 0).toLocaleString()}</p>}
                        {res.data.ltcg !== undefined && <p>LTCG: ₹{(res.data.ltcg || 0).toLocaleString()}</p>}
                      </>
                    ) : (
                      <p className="text-red-400 italic">Failed to read fields</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Document Data details */}
            {selectedDocIndex !== null && scanResults[selectedDocIndex] && (
              <div className="p-6 rounded-2xl bg-[#100d16]/80 border border-[#4a4455]/30 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[#d2bbff]">
                    Raw Extracted Fields: {scanResults[selectedDocIndex].fileName}
                  </h4>
                  <button onClick={() => setSelectedDocIndex(null)} className="text-xs text-[#ccc3d8] hover:text-white">
                    Close Preview
                  </button>
                </div>
                <pre className="text-xs text-[#ccc3d8] font-mono overflow-auto max-h-60 p-4 rounded-xl bg-black/40 border border-[#4a4455]/10 leading-relaxed">
                  {JSON.stringify(scanResults[selectedDocIndex].data, null, 2)}
                </pre>
              </div>
            )}
          </section>
        )}

        {/* SECTION 3 & 4: Income & Deductions Summary Cards */}
        {computedData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Income Summary Card */}
            <section className="glass-card rounded-[2rem] p-8 border border-[#4a4455]/20 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <HiOutlineDocumentText className="text-[#d2bbff] text-xl" />
                  Income Summary
                </h3>
                <div className="space-y-4 text-sm font-semibold">
                  <div className="flex justify-between items-center border-b border-[#4a4455]/10 pb-3">
                    <span className="text-[#ccc3d8]/80">Salary Income (Net)</span>
                    <span>₹{computedData.salaryIncome.net.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#4a4455]/10 pb-3">
                    <span className="text-[#ccc3d8]/80">Interest Income</span>
                    <span>₹{computedData.otherIncome.interest.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#4a4455]/10 pb-3">
                    <span className="text-[#ccc3d8]/80">Dividend Income</span>
                    <span>₹{computedData.otherIncome.dividend.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#4a4455]/10 pb-3">
                    <span className="text-[#ccc3d8]/80">Capital Gains</span>
                    <span>₹{computedData.otherIncome.capitalGains.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-[#100d16] p-4 rounded-xl mt-6 border border-[#4a4455]/20">
                <span className="text-base font-extrabold text-[#d2bbff]">GROSS TOTAL</span>
                <span className="text-lg font-black text-white">
                  ₹{(
                    computedData.salaryIncome.net +
                    computedData.otherIncome.interest +
                    computedData.otherIncome.dividend +
                    computedData.otherIncome.capitalGains
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </section>

            {/* Deductions Claimed Card */}
            <section className="glass-card rounded-[2rem] p-8 border border-[#4a4455]/20 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <HiOutlineShieldCheck className="text-[#d2bbff] text-xl" />
                  Deductions Claimed
                </h3>
                <div className="space-y-4 text-sm font-semibold">
                  <div className="flex justify-between items-center border-b border-[#4a4455]/10 pb-3">
                    <span className="text-[#ccc3d8]/80">Standard Deduction</span>
                    <span>₹{computedData.salaryIncome.standard.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#4a4455]/10 pb-3">
                    <span className="text-[#ccc3d8]/80">80C Investments</span>
                    <span>₹{computedData.deductions['80c'].toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#4a4455]/10 pb-3">
                    <span className="text-[#ccc3d8]/80">80D Health Insurance</span>
                    <span>₹{computedData.deductions['80d'].toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#4a4455]/10 pb-3">
                    <span className="text-[#ccc3d8]/80">80CCD NPS Contribution</span>
                    <span>₹{computedData.deductions['nps'].toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-[#100d16] p-4 rounded-xl mt-6 border border-[#4a4455]/20">
                <span className="text-base font-extrabold text-[#d2bbff]">TOTAL DEDUCTIONS</span>
                <span className="text-lg font-black text-white">
                  ₹{(
                    computedData.salaryIncome.standard +
                    computedData.deductions['80c'] +
                    computedData.deductions['80d'] +
                    computedData.deductions['nps']
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </section>
          </div>
        )}

        {/* SECTION 5: Tax Computation Card (Comparison) */}
        {computedData && (
          <section className="glass-card rounded-[2rem] p-8 border border-[#4a4455]/20 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <HiOutlineReceiptTax className="text-[#d2bbff] text-xl" />
                Tax Computation (FY 2025-26 Comparison)
              </h3>
              <p className="text-xs text-[#ccc3d8]/70">Comparative tax regimes calculation models.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Regime details */}
              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                {/* Old Regime Panel */}
                <div className="p-5 rounded-2xl bg-[#100d16] border border-[#4a4455]/10 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#ccc3d8] uppercase tracking-wider mb-4">Old Regime</h4>
                    <div className="space-y-3 text-xs font-semibold">
                      <div className="flex justify-between">
                        <span className="text-[#ccc3d8]/60">Taxable:</span>
                        <span>₹{computedData.taxComputation.oldRegime.taxableIncome.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#ccc3d8]/60">Base Tax:</span>
                        <span>₹{computedData.taxComputation.oldRegime.tax.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#ccc3d8]/60">Cess:</span>
                        <span>₹{computedData.taxComputation.oldRegime.cess.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-extrabold text-white border-t border-[#4a4455]/10 pt-3 mt-4 flex justify-between items-center">
                    <span className="text-xs text-[#ccc3d8]/60">TOTAL:</span>
                    <span>₹{computedData.taxComputation.oldRegime.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* New Regime Panel */}
                <div className="p-5 rounded-2xl bg-[#100d16] border border-[#4a4455]/10 flex flex-col justify-between relative overflow-hidden">
                  {computedData.taxComputation.recommended === 'new' && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white font-bold text-[8px] px-3 py-1 rounded-bl-lg uppercase tracking-wide">
                      Best
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-[#ccc3d8] uppercase tracking-wider mb-4">New Regime</h4>
                    <div className="space-y-3 text-xs font-semibold">
                      <div className="flex justify-between">
                        <span className="text-[#ccc3d8]/60">Taxable:</span>
                        <span>₹{computedData.taxComputation.newRegime.taxableIncome.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#ccc3d8]/60">Base Tax:</span>
                        <span>₹{computedData.taxComputation.newRegime.tax.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#ccc3d8]/60">Cess:</span>
                        <span>₹{computedData.taxComputation.newRegime.cess.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-extrabold text-white border-t border-[#4a4455]/10 pt-3 mt-4 flex justify-between items-center">
                    <span className="text-xs text-[#ccc3d8]/60">TOTAL:</span>
                    <span>₹{computedData.taxComputation.newRegime.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Animated Recharts Comparison */}
              <div className="lg:col-span-7 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#ccc3d8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#ccc3d8" fontSize={10} tickFormatter={(val) => `₹${val / 1000}k`} width={50} />
                    <Tooltip
                      contentStyle={{ background: '#15121b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      labelStyle={{ fontWeight: 'bold', color: '#e8dfee' }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="Taxable" name="Taxable Income" fill="#4a4455" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Tax" name="Final Tax Due" radius={[6, 6, 0, 0]}>
                      <Cell fill="#7c3aed" />
                      <Cell fill="#ddb7ff" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Savings Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-400 text-3xl">local_mall</span>
                <div>
                  <h4 className="font-extrabold text-emerald-400 text-sm">
                    Recommended Regime: {computedData.taxComputation.recommended === 'new' ? 'New' : 'Old'} Regime
                  </h4>
                  <p className="text-xs text-[#ccc3d8]/90 mt-0.5">
                    {computedData.taxComputation.recommended === 'new'
                      ? `The New Tax Regime saves you ₹${Math.abs(
                          computedData.taxComputation.oldRegime.total - computedData.taxComputation.newRegime.total
                        ).toLocaleString('en-IN')} more in tax liabilities!`
                      : `The Old Tax Regime saves you ₹${Math.abs(
                          computedData.taxComputation.oldRegime.total - computedData.taxComputation.newRegime.total
                        ).toLocaleString('en-IN')} more by applying your investments!`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#ccc3d8]/60 uppercase tracking-widest font-bold">Tax Savings</p>
                <p className="text-2xl font-black text-emerald-400">
                  ₹{Math.abs(
                    computedData.taxComputation.oldRegime.total - computedData.taxComputation.newRegime.total
                  ).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 6: TDS Details Table */}
        {computedData && computedData.tdsDetails.breakdown.length > 0 && (
          <section className="glass-card rounded-[2rem] p-8 border border-[#4a4455]/20 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Extracted TDS Deductions (Tax Credits)</h3>
              <p className="text-xs text-[#ccc3d8]/70 mt-1">Verification statuses for extracted tax deductions.</p>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-[#4a4455]/20 bg-[#100d16]">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#4a4455]/20 text-[#ccc3d8]/60 font-bold uppercase text-[10px] tracking-wider bg-[#15121b]">
                    <th className="p-4">Deductor</th>
                    <th className="p-4">TAN</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4">Quarter</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#4a4455]/10 font-medium">
                  {computedData.tdsDetails.breakdown.map((tds, idx) => (
                    <tr key={idx} className="hover:bg-white/2 transition-colors">
                      <td className="p-4 text-white font-bold">{tds.deductor}</td>
                      <td className="p-4 font-mono text-xs">{tds.tan || 'Not found'}</td>
                      <td className="p-4 text-right text-emerald-400 font-bold">₹{tds.amount.toLocaleString()}</td>
                      <td className="p-4 text-xs font-semibold">{tds.quarter}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SECTION 7: Action Buttons */}
        {computedData && (
          <div className="flex flex-wrap justify-end gap-3.5 pt-4">
            <button
              onClick={downloadSummaryPDF}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-[#221e28] border border-[#4a4455]/30 font-bold hover:bg-[#3c3742] transition-colors"
            >
              <HiOutlineDownload className="w-5 h-5 text-[#d2bbff]" />
              <span>Download Tax Summary PDF</span>
            </button>
            <button
              onClick={handleAutoFill}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#ddb7ff] text-white font-black hover:brightness-115 active:scale-95 transition-all shadow-lg shadow-[#7c3aed]/25"
            >
              <HiOutlineSparkles className="w-5 h-5 animate-pulse" />
              <span>Auto Fill ITR Form</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartDashboard;
