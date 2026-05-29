/**
 * Scan and Auto-Fill Routes
 * 
 * Handles tax document upload, background scanning status, tax calculation,
 * and pre-filling the user's draft ITR return.
 */

const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const { scanDocument } = require('../services/documentScanner');
const { compileAutoFillData } = require('../services/autoFillEngine');
const ItrFiling = require('../models/ItrFiling');

const router = express.Router();

// Multer memory storage configuration (saves writing and clean-up of temp files on disk)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file limit
});

// In-memory job state tracker
const scanJobs = new Map();

/**
 * POST /api/scan/upload
 * 
 * Upload multiple files for scanning.
 * Returns a jobId for polling status.
 */
router.post('/upload', auth, upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const jobState = {
      jobId,
      status: 'processing',
      progress: 0,
      filesCount: req.files.length,
      files: req.files.map((file) => ({
        name: file.originalname,
        status: 'scanning',
      })),
      results: [],
      error: null,
    };

    scanJobs.set(jobId, jobState);

    // Trigger scanning asynchronously (without awaiting, returns jobId immediately)
    processScanning(jobId, req.files, req.user);

    res.json({ jobId });
  } catch (error) {
    console.error('Upload scanner error:', error);
    res.status(500).json({ message: 'Error uploading files' });
  }
});

/**
 * GET /api/scan/status/:jobId
 * 
 * Poll progress and get final results.
 */
router.get('/status/:jobId', auth, (req, res) => {
  const job = scanJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found.' });
  }
  res.json(job);
});

/**
 * POST /api/scan/extract
 * 
 * Standalone direct extraction from a single uploaded file.
 */
router.post('/extract', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided.' });
    }

    const data = await scanDocument(req.file.buffer, req.file.mimetype, req.file.originalname);
    res.json(data);
  } catch (error) {
    console.error('Extract endpoint error:', error);
    res.status(500).json({ message: error.message || 'Data extraction failed.' });
  }
});

/**
 * POST /api/autofill/calculate
 * 
 * Calculates regime differences and compiles tax results based on scanned data.
 */
router.post('/calculate', auth, (req, res) => {
  try {
    const { documentsData } = req.body;
    if (!documentsData || !Array.isArray(documentsData)) {
      return res.status(400).json({ message: 'documentsData array is required.' });
    }

    const compiledData = compileAutoFillData(documentsData, req.user);
    res.json(compiledData);
  } catch (error) {
    console.error('Calculation endpoint error:', error);
    res.status(500).json({ message: 'Calculation error.' });
  }
});

/**
 * POST /api/autofill/prefill-itr
 * 
 * Formats the final calculated data and saves it to the user's MongoDB draft filing.
 */
router.post('/prefill-itr', auth, async (req, res) => {
  try {
    const { autofillData } = req.body;
    if (!autofillData) {
      return res.status(400).json({ message: 'autofillData is required.' });
    }

    const assessmentYear = '2026-27'; // FY 2025-26

    // Map compiled autofill data into MongoDB ItrFiling schema
    const mappedFormData = {
      personalInfo: {
        fullName: autofillData.personalInfo.name || '',
        pan: autofillData.personalInfo.pan || '',
        dob: autofillData.personalInfo.dob || '',
        email: autofillData.personalInfo.email || '',
        phone: autofillData.personalInfo.phone || '',
        address: autofillData.personalInfo.address || '',
        city: autofillData.personalInfo.city || '',
        state: autofillData.personalInfo.state || '',
        pincode: autofillData.personalInfo.pincode || '',
        bankName: autofillData.personalInfo.bankName || '',
        accountNumber: autofillData.personalInfo.accountNumber || '',
        ifsc: autofillData.personalInfo.ifsc || '',
      },
      incomeDetails: {
        grossSalary: autofillData.salaryIncome.gross || 0,
        otherIncome: autofillData.otherIncome.dividend || 0, // Dividends map to other
        interestIncome: autofillData.otherIncome.interest || 0,
        capitalGainsSTCG: autofillData.otherIncome.capitalGains ? Math.round(autofillData.otherIncome.capitalGains / 2) : 0, // Split STCG/LTCG approximation
        capitalGainsLTCG: autofillData.otherIncome.capitalGains ? Math.round(autofillData.otherIncome.capitalGains / 2) : 0,
      },
      deductions: {
        section80C: autofillData.deductions['80c'] || 0,
        section80D: autofillData.deductions['80d'] || 0,
        section80CCD: autofillData.deductions['nps'] || 0,
        section80E: autofillData.deductions['80e'] || 0,
        section80G: autofillData.deductions['80g'] || 0,
      },
      taxComputation: autofillData.taxComputation || {},
    };

    // Determine standard ITR type recommendation based on details
    let recommendedITR = 'ITR-1';
    if (autofillData.otherIncome.capitalGains > 0) {
      recommendedITR = 'ITR-2'; // ITR-2 handles capital gains
    }

    const filing = await ItrFiling.findOneAndUpdate(
      {
        userId: req.user.id,
        assessmentYear,
      },
      {
        itrType: recommendedITR,
        status: 'in-progress',
        currentStep: 4, // Directly place them at step 4 (Review step)
        formData: mappedFormData,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json({
      message: 'ITR draft pre-filled successfully!',
      filing,
    });
  } catch (error) {
    console.error('Prefill endpoint error:', error);
    res.status(500).json({ message: 'Failed to pre-fill ITR draft return.' });
  }
});

/**
 * Process uploaded files in the background using Gemini Vision
 */
async function processScanning(jobId, files, user) {
  const job = scanJobs.get(jobId);
  if (!job) return;

  try {
    let completedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`[Job ${jobId}] Starting scan for file: ${file.originalname}`);
        
        // Scan via Gemini service
        const extracted = await scanDocument(file.buffer, file.mimetype, file.originalname);
        
        // Update individual file status
        job.files[i].status = 'success';
        job.results.push({
          fileName: file.originalname,
          type: extracted.documentType || 'Unknown',
          data: extracted,
          confidence: extracted.confidenceScore || 'High',
        });
      } catch (err) {
        console.error(`[Job ${jobId}] Failed file: ${file.originalname}`, err);
        job.files[i].status = 'failed';
        job.results.push({
          fileName: file.originalname,
          type: 'Failed',
          data: null,
          confidence: 'Low',
          error: err.message,
        });
      }

      completedCount++;
      // Update overall progress percentage
      job.progress = Math.round((completedCount / files.length) * 100);
      scanJobs.set(jobId, { ...job });
    }

    job.status = 'completed';
    job.progress = 100;
    scanJobs.set(jobId, { ...job });
    console.log(`[Job ${jobId}] background scanning completed successfully.`);

  } catch (error) {
    console.error(`[Job ${jobId}] background scanning crashed:`, error);
    job.status = 'failed';
    job.error = error.message;
    scanJobs.set(jobId, { ...job });
  }
}

module.exports = router;
