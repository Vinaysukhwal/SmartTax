/**
 * ITR Recommender Page
 * 
 * A 5-question quiz that recommends the correct ITR form.
 * Quiz-style UI with Next/Back buttons.
 * Shows result with recommended form, description, and required documents.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineDocumentText, HiOutlineCheckCircle } from 'react-icons/hi';

const ItrRecommenderPage = () => {
  // Current question index (0-4)
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // User's answers
  const [answers, setAnswers] = useState({});

  // Whether to show results
  const [showResult, setShowResult] = useState(false);

  /**
   * Quiz questions — 5 simple questions to determine the right ITR form
   */
  const questions = [
    {
      id: 'incomeSource',
      question: 'What is your primary source of income?',
      options: [
        { value: 'salary', label: '💼 Salary / Pension' },
        { value: 'business', label: '🏪 Business / Profession' },
        { value: 'freelance', label: '💻 Freelancing / Consulting' },
        { value: 'capital_gains', label: '📈 Capital Gains (Stocks, Property)' },
      ],
    },
    {
      id: 'annualIncome',
      question: 'What is your approximate annual income?',
      options: [
        { value: 'below_50l', label: 'Below ₹50 Lakhs' },
        { value: 'above_50l', label: 'Above ₹50 Lakhs' },
      ],
    },
    {
      id: 'capitalGains',
      question: 'Do you have any capital gains (stocks, mutual funds, property)?',
      options: [
        { value: 'no', label: '❌ No capital gains' },
        { value: 'yes', label: '✅ Yes, I have capital gains' },
      ],
    },
    {
      id: 'foreignIncome',
      question: 'Do you have any foreign income or foreign assets?',
      options: [
        { value: 'no', label: '❌ No foreign income/assets' },
        { value: 'yes', label: '✅ Yes, I have foreign income/assets' },
      ],
    },
    {
      id: 'businessType',
      question: 'If you have business income, what type?',
      options: [
        { value: 'none', label: '❌ No business income' },
        { value: 'presumptive', label: '📋 Presumptive income (44AD/44ADA) — turnover ≤ ₹2 Cr' },
        { value: 'regular', label: '📊 Regular business with books of accounts' },
        { value: 'fno', label: '📉 F&O Trading' },
      ],
    },
  ];

  /**
   * Determine the recommended ITR form based on answers
   */
  const getRecommendation = () => {
    const { incomeSource, annualIncome, capitalGains, foreignIncome, businessType } = answers;

    // ITR-4: Presumptive income (44AD/44ADA)
    if (businessType === 'presumptive' && annualIncome === 'below_50l' && foreignIncome === 'no') {
      return 'ITR-4';
    }

    // ITR-3: Regular business / F&O trading
    if (businessType === 'regular' || businessType === 'fno' || incomeSource === 'business') {
      return 'ITR-3';
    }

    // ITR-2: Capital gains, foreign income, income > 50L, or multiple properties
    if (capitalGains === 'yes' || foreignIncome === 'yes' || annualIncome === 'above_50l') {
      return 'ITR-2';
    }

    // ITR-1: Simple salary income ≤ 50L, no capital gains, no business
    return 'ITR-1';
  };

  /**
   * ITR form details for displaying results
   */
  const itrDetails = {
    'ITR-1': {
      name: 'ITR-1 (Sahaj)',
      description: 'For salaried individuals with income up to ₹50 lakhs from salary, one house property, and other sources.',
      who: 'Salaried employees with simple tax situations',
      documents: [
        'Form 16 (from employer)',
        'Form 26AS / AIS (Annual Tax Statement)',
        'Bank interest certificates',
        'Rent receipts (if claiming HRA)',
        'Investment proofs for 80C, 80D',
      ],
      color: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    'ITR-2': {
      name: 'ITR-2',
      description: 'For individuals with capital gains, multiple house properties, foreign income/assets, or income above ₹50 lakhs.',
      who: 'Investors, NRIs, individuals with capital gains',
      documents: [
        'Form 16, Form 26AS / AIS',
        'Capital gains statements (brokers)',
        'Property sale/purchase deeds',
        'Foreign asset details',
        'Bank statements for all accounts',
        'Investment proofs for deductions',
      ],
      color: 'bg-purple-50 border-purple-200 text-purple-700',
    },
    'ITR-3': {
      name: 'ITR-3',
      description: 'For individuals with income from business or profession, including F&O trading. Requires maintenance of books of accounts.',
      who: 'Business owners, professionals, F&O traders',
      documents: [
        'Profit & Loss statement',
        'Balance Sheet',
        'Form 16 (if also salaried)',
        'Form 26AS / AIS',
        'Bank statements (all accounts)',
        'GST returns (if applicable)',
        'Business expense bills',
      ],
      color: 'bg-orange-50 border-orange-200 text-orange-700',
    },
    'ITR-4': {
      name: 'ITR-4 (Sugam)',
      description: 'For individuals opting for presumptive taxation under Section 44AD (business) or 44ADA (profession) with turnover up to ₹2 Crore.',
      who: 'Freelancers, small business owners, consultants',
      documents: [
        'Form 26AS / AIS',
        'Bank statements (business account)',
        'Gross receipts / invoices',
        'Investment proofs for deductions',
        'GST returns (if applicable)',
      ],
      color: 'bg-green-50 border-green-200 text-green-700',
    },
  };

  /**
   * Handle selecting an answer
   */
  const handleAnswer = (value) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: value });
  };

  /**
   * Go to next question or show results
   */
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  /**
   * Go back to previous question
   */
  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
    } else if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  /**
   * Reset the quiz
   */
  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
  };

  // Get current question data
  const question = questions[currentQuestion];
  const selectedAnswer = answers[question?.id];
  const recommendation = showResult ? getRecommendation() : null;
  const details = recommendation ? itrDetails[recommendation] : null;

  return (
    <div className="page-container animate-fadeIn">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ITR Form Recommender</h1>
          <p className="text-gray-600 mt-2">Answer 5 simple questions to find the right ITR form</p>
        </div>

        {!showResult ? (
          <>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="card animate-slideUp" key={currentQuestion}>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{question.question}</h2>

              <div className="space-y-3">
                {question.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswer(option.value)}
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedAnswer === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handleBack}
                  disabled={currentQuestion === 0}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <HiOutlineArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedAnswer}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {currentQuestion === questions.length - 1 ? 'See Result' : 'Next'}
                  <HiOutlineArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Results Card */
          <div className="animate-slideUp">
            <div className={`card border-2 ${details.color} mb-6`}>
              <div className="flex items-center space-x-3 mb-4">
                <HiOutlineCheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Recommended Form</p>
                  <h2 className="text-2xl font-bold text-gray-900">{details.name}</h2>
                </div>
              </div>
              <p className="text-gray-600 mb-2">{details.description}</p>
              <p className="text-sm text-gray-500">
                <strong>Best for:</strong> {details.who}
              </p>
            </div>

            {/* Documents Needed */}
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <HiOutlineDocumentText className="w-5 h-5 mr-2 text-primary-500" />
                Documents You'll Need
              </h3>
              <ul className="space-y-2">
                {details.documents.map((doc, index) => (
                  <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/file-itr" className="btn-primary flex-1 text-center flex items-center justify-center">
                Start Filing {recommendation}
                <HiOutlineArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <button onClick={handleReset} className="btn-secondary flex-1">
                Retake Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItrRecommenderPage;
