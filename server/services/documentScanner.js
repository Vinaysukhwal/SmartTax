/**
 * Document Scanner Service
 * 
 * Automatically parses uploaded tax documents (PDFs and Images) and uses
 * Google's Gemini API (Vision/Multimodal) to extract financial details in a
 * structured JSON format.
 * 
 * Supports:
 * - Form 16 (Part A & B)
 * - Form 26AS
 * - AIS (Annual Information Statement)
 * - Form 16A
 * - Bank Interest Certificate
 * - Capital Gains Statement
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');

// Initialize Gemini client (will throw error at runtime if API key is missing)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }
  return new GoogleGenerativeAI(apiKey);
};

// System instruction specifying standard fields to extract for each document type
const SYSTEM_PROMPT = `You are an expert Indian tax document reader.
Extract ALL financial data from this document and return ONLY a valid JSON object.
Categorize the document type into one of the following: "Form 16", "Form 26AS", "AIS", "Form 16A", "Bank Interest Certificate", "Capital Gains Statement".

For each document type, extract the following fields if present:

1. For "Form 16" extract:
   - employerName (string)
   - employerTAN (string)
   - employeePAN (string)
   - assessmentYear (string, e.g., "2026-27")
   - grossSalary (number)
   - basicSalary (number)
   - allowances (object with hra, lta, specialAllowance, etc.)
   - professionalTax (number)
   - standardDeduction (number, default 75000)
   - netTaxableSalary (number)
   - totalTDS (number)
   - tdsQuarterWise (array of objects with quarter, amount, certificateNumber)

2. For "Form 26AS" extract:
   - pan (string)
   - totalTDS (array of objects with deductorName, tan, amount, section, status e.g. "Verified")
   - advanceTax (number)
   - selfAssessmentTax (number)
   - refunds (array of objects with amount, date, status)
   - highValueTransactions (array of objects with details, amount)

3. For "AIS" extract:
   - salaryIncome (number)
   - interestIncome (number, savings and FD)
   - dividendIncome (number)
   - securitiesTransactions (array of objects with companyName, buyValue, sellValue, gains)
   - mutualFundTransactions (array of objects with schemeName, buyValue, sellValue, gains)
   - propertyTransactions (array of objects with details, value)
   - foreignRemittances (array of objects with details, amount)

4. For "Form 16A" extract:
   - deductorName (string)
   - deductorTAN (string)
   - paymentNature (string)
   - amountPaid (number)
   - tdsDeducted (number)
   - certificateNumber (string)

5. For "Bank Interest Certificate" extract:
   - bankName (string)
   - accountNumberLast4 (string)
   - savingsInterest (number)
   - fdInterest (number)
   - tdsDeducted (number)

6. For "Capital Gains Statement" extract:
   - stcg (number)
   - ltcg (number)
   - sttPaid (number)
   - totalBuyValue (number)
   - totalSellValue (number)
   - profitLossSummary (string)

Determine a confidenceScore (string: "High", "Medium", "Low") for the overall extraction quality.

Return ONLY a JSON object matching the extracted details. Do not wrap in markdown or explanation. Just the raw JSON object.`;

/**
 * Scan a document buffer
 * 
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimeType - File MIME type (e.g. application/pdf, image/png)
 * @param {string} originalName - Original filename for logging/heuristics
 * @returns {Promise<object>} - Extracted structured data
 */
const scanDocument = async (fileBuffer, mimeType, originalName = '') => {
  try {
    const genAI = getGeminiClient();
    let localText = '';
    let isScanned = true;

    // Step 1: For PDF, attempt local text extraction first (fast & cost-effective)
    if (mimeType === 'application/pdf') {
      try {
        const parsed = await pdfParse(fileBuffer);
        localText = parsed.text || '';
        // If we have substantial text, it's a digital text PDF, not a scanned image PDF
        if (localText.trim().length > 150) {
          isScanned = false;
        }
      } catch (err) {
        console.warn(`Local PDF parse failed for ${originalName}, falling back to full vision processing:`, err.message);
      }
    }

    let result;
    const promptText = `Analyze this tax document (${originalName}). Extract the fields according to the instructions. Ensure all financial numbers are numbers (not strings with commas).`;

    const runGemini = async (modelName) => {
      const activeModel = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      if (mimeType.startsWith('image/') || (mimeType === 'application/pdf' && isScanned)) {
        console.log(`Sending file ${originalName} (${mimeType}) directly to Gemini Multimodal Vision API using ${modelName}...`);
        return await activeModel.generateContent([
          {
            inlineData: {
              data: fileBuffer.toString('base64'),
              mimeType: mimeType,
            },
          },
          promptText,
          { text: SYSTEM_PROMPT }
        ]);
      } else {
        console.log(`Sending locally extracted text from digital PDF ${originalName} to Gemini using ${modelName}...`);
        return await activeModel.generateContent([
          `Here is the text extracted from the tax document:\n\n${localText}\n\n`,
          promptText,
          { text: SYSTEM_PROMPT }
        ]);
      }
    };

    // Step 2: Invoke Gemini with automatic model fallback for free tier limits
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        result = await runGemini(modelName);
        if (result) break;
      } catch (err) {
        lastError = err;
        const errStr = err.message || '';
        if (
          errStr.includes('quota') || 
          errStr.includes('429') || 
          errStr.includes('limit') || 
          errStr.includes('Requests') || 
          errStr.includes('Quota') || 
          errStr.includes('ResourceExhausted')
        ) {
          console.warn(`[Quota Exceeded] ${modelName} failed. Trying next model...`, err.message);
          continue;
        } else {
          throw err;
        }
      }
    }

    if (!result) {
      throw lastError || new Error('All Gemini model fallbacks exhausted.');
    }

    const responseText = result.response.text();
    console.log(`Gemini response received for ${originalName}. Attempting to parse JSON.`);

    // Parse the JSON response
    const parsedData = JSON.parse(responseText.trim());
    return parsedData;

  } catch (error) {
    console.error(`Error in documentScanner for ${originalName}:`, error);
    throw new Error(`Failed to extract data: ${error.message}`);
  }
};

module.exports = {
  scanDocument,
};
