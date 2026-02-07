import React, { useState, useEffect } from 'react';

// API Configuration
const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

// Fetch trials with detailed criteria
async function fetchMatchingTrials({ condition, age, location, phase, pageSize = 10 }) {
  let url = `${API_BASE}?format=json&pageSize=${pageSize}&countTotal=true&filter.overallStatus=RECRUITING`;

  if (condition) url += `&query.cond=${encodeURIComponent(condition)}`;
  if (location) url += `&query.locn=${encodeURIComponent(location)}`;
  if (phase && phase !== 'any') {
    const phaseMap = { 'early': 'PHASE1,PHASE2', 'late': 'PHASE3,PHASE4' };
    if (phaseMap[phase]) url += `&filter.phase=${phaseMap[phase]}`;
  }

  try {
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    return {
      trials: (data.studies || []).map(parseTrialData),
      totalCount: data.totalCount || 0
    };
  } catch (error) {
    console.error('API Error:', error);
    return { trials: [], totalCount: 0, error: error.message };
  }
}

// Parse API response into our format
function parseTrialData(study) {
  const p = study.protocolSection || {};
  const id = p.identificationModule || {};
  const status = p.statusModule || {};
  const design = p.designModule || {};
  const sponsors = p.sponsorCollaboratorsModule || {};
  const conds = p.conditionsModule || {};
  const interventions = p.armsInterventionsModule || {};
  const eligibility = p.eligibilityModule || {};
  const contacts = p.contactsLocationsModule || {};
  const desc = p.descriptionModule || {};

  // Extract contact info
  const centralContact = contacts.centralContacts?.[0];
  const locationContacts = contacts.locations?.[0]?.contacts?.[0];
  const bestContact = centralContact || locationContacts;

  return {
    id: id.nctId || '',
    title: id.briefTitle || 'Untitled Study',
    officialTitle: id.officialTitle || '',
    phase: design.phases?.join(', ') || 'Not specified',
    status: status.overallStatus || 'Unknown',
    sponsor: sponsors.leadSponsor?.name || 'Unknown Sponsor',
    sponsorType: sponsors.leadSponsor?.class || 'Unknown',
    conditions: conds.conditions || [],
    interventions: interventions.interventions?.map(i => ({
      name: i.name,
      type: i.type,
      description: i.description
    })) || [],
    interventionNames: interventions.interventions?.map(i => i.name).join(', ') || 'Not specified',
    description: desc.briefSummary || 'No description available',
    detailedDescription: desc.detailedDescription || '',
    eligibility: {
      criteria: eligibility.eligibilityCriteria || 'Not specified',
      minAge: eligibility.minimumAge || 'Not specified',
      maxAge: eligibility.maximumAge || 'Not specified',
      sex: eligibility.sex || 'All',
      healthyVolunteers: eligibility.healthyVolunteers || 'No'
    },
    locations: (contacts.locations || []).slice(0, 10).map(loc => ({
      facility: loc.facility || 'Unknown Facility',
      city: loc.city || '',
      state: loc.state || '',
      country: loc.country || '',
      zip: loc.zip || '',
      contacts: loc.contacts || []
    })),
    contact: bestContact ? {
      name: bestContact.name || '',
      phone: bestContact.phone || '',
      email: bestContact.email || ''
    } : null,
    enrollment: status.enrollmentInfo?.count || null,
    startDate: status.startDateStruct?.date || '',
    completionDate: status.primaryCompletionDateStruct?.date || ''
  };
}

// Score trial match quality based on user criteria
function scoreTrialMatch(trial, criteria) {
  let score = 0;
  let matchReasons = [];

  // Location match
  if (criteria.location && trial.locations.length > 0) {
    const locationLower = criteria.location.toLowerCase();
    const hasNearbyLocation = trial.locations.some(loc =>
      loc.city?.toLowerCase().includes(locationLower) ||
      loc.state?.toLowerCase().includes(locationLower) ||
      loc.country?.toLowerCase().includes(locationLower)
    );
    if (hasNearbyLocation) {
      score += 30;
      matchReasons.push('Location near you');
    }
  }

  // Phase preference
  if (criteria.phasePreference === 'proven' && trial.phase.includes('3')) {
    score += 20;
    matchReasons.push('Phase 3 - more established');
  } else if (criteria.phasePreference === 'cutting_edge' && (trial.phase.includes('1') || trial.phase.includes('2'))) {
    score += 20;
    matchReasons.push('Early phase - newest treatments');
  }

  // Has contact info (easier to reach)
  if (trial.contact?.email || trial.contact?.phone) {
    score += 15;
    matchReasons.push('Direct contact available');
  }

  // Academic medical center (often higher quality)
  if (trial.sponsorType === 'OTHER' || trial.sponsor?.toLowerCase().includes('university') ||
      trial.sponsor?.toLowerCase().includes('hospital') || trial.sponsor?.toLowerCase().includes('medical center')) {
    score += 10;
    matchReasons.push('Academic institution');
  }

  // Currently enrolling with multiple locations
  if (trial.locations.length >= 3) {
    score += 10;
    matchReasons.push('Multiple locations');
  }

  // Has healthy volunteer option if user is caregiver researching prevention
  if (criteria.purpose === 'prevention' && trial.eligibility.healthyVolunteers === 'Yes') {
    score += 15;
    matchReasons.push('Accepts healthy volunteers');
  }

  return { score, matchReasons };
}

// Focused Onboarding Flow
function FocusedOnboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [customCondition, setCustomCondition] = useState('');

  const steps = [
    {
      type: 'intro',
      title: "Find Your Best Trial Matches",
      subtitle: "Answer 4 quick questions to get personalized recommendations"
    },
    {
      type: 'question',
      key: 'condition',
      title: "What condition are you researching?",
      subtitle: "Select a category or type your specific condition",
      options: [
        { value: 'breast cancer', label: 'Breast Cancer', icon: '🎗️' },
        { value: 'lung cancer', label: 'Lung Cancer', icon: '🫁' },
        { value: 'type 2 diabetes', label: 'Type 2 Diabetes', icon: '💉' },
        { value: 'alzheimer', label: "Alzheimer's Disease", icon: '🧠' },
        { value: 'rheumatoid arthritis', label: 'Rheumatoid Arthritis', icon: '🦴' },
        { value: 'depression', label: 'Depression', icon: '💭' }
      ],
      allowCustom: true,
      customPlaceholder: "Or type your specific condition..."
    },
    {
      type: 'question',
      key: 'location',
      title: "Where would you like to receive treatment?",
      subtitle: "Enter a city, state, or leave blank for all locations",
      freeText: true,
      placeholder: "e.g., Boston, MA or California"
    },
    {
      type: 'question',
      key: 'phasePreference',
      title: "What type of treatment interests you?",
      subtitle: "This helps us prioritize trials",
      options: [
        {
          value: 'cutting_edge',
          label: 'Newest innovations',
          icon: '🔬',
          desc: 'Early-phase trials with experimental treatments'
        },
        {
          value: 'proven',
          label: 'More established treatments',
          icon: '✅',
          desc: 'Later-phase trials with more safety data'
        },
        {
          value: 'any',
          label: 'Show me all options',
          icon: '📋',
          desc: "I want to see different types"
        }
      ]
    },
    {
      type: 'question',
      key: 'purpose',
      title: "What best describes your situation?",
      subtitle: "This helps us find the most relevant trials",
      options: [
        {
          value: 'active_treatment',
          label: 'Looking for treatment options',
          icon: '💊',
          desc: "Currently dealing with this condition"
        },
        {
          value: 'prevention',
          label: 'Interested in prevention',
          icon: '🛡️',
          desc: 'Want to prevent or detect early'
        },
        {
          value: 'alternatives',
          label: 'Current treatment not working',
          icon: '🔄',
          desc: 'Need different options'
        }
      ]
    }
  ];

  const currentStep = steps[step];
  const progress = ((step) / (steps.length - 1)) * 100;

  const handleSelect = (key, value) => {
    setAnswers({ ...answers, [key]: value });
    setTimeout(() => setStep(step + 1), 200);
  };

  const handleFreeText = (key, value) => {
    setAnswers({ ...answers, [key]: value });
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const isLastStep = step === steps.length - 1;
  const canProceed = currentStep.type === 'intro' ||
    (currentStep.freeText) ||
    answers[currentStep.key];

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Trial Matcher</h3>
                <p className="text-blue-200 text-sm">
                  {step === 0 ? 'Get started' : `Question ${step} of ${steps.length - 1}`}
                </p>
              </div>
            </div>
          </div>

          {step > 0 && (
            <div className="h-1.5 bg-blue-950/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">{currentStep.title}</h2>
          <p className="text-slate-500 mb-6">{currentStep.subtitle}</p>

          {/* Intro */}
          {currentStep.type === 'intro' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-5 border border-teal-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 mb-1">We'll show you 3-4 best matches</h4>
                    <p className="text-sm text-slate-600">
                      Instead of overwhelming you with hundreds of trials, we'll identify the ones most worth your time to explore.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <div className="text-2xl mb-1">📍</div>
                  <p className="text-xs text-slate-600">Location-matched</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <div className="text-2xl mb-1">✓</div>
                  <p className="text-xs text-slate-600">Clear next steps</p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <div className="text-2xl mb-1">📞</div>
                  <p className="text-xs text-slate-600">Contact info</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> This tool helps you learn about trials. Always discuss with your doctor before participating.
                </p>
              </div>
            </div>
          )}

          {/* Question with options */}
          {currentStep.type === 'question' && currentStep.options && (
            <div className="space-y-2">
              {currentStep.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(currentStep.key, opt.value)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    answers[currentStep.key] === opt.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{opt.label}</p>
                      {opt.desc && <p className="text-sm text-slate-500">{opt.desc}</p>}
                    </div>
                    {answers[currentStep.key] === opt.value && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}

              {currentStep.allowCustom && (
                <div className="relative mt-4">
                  <input
                    type="text"
                    placeholder={currentStep.customPlaceholder}
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    className="w-full p-4 pl-12 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customCondition.trim()) {
                        handleSelect(currentStep.key, customCondition.trim());
                      }
                    }}
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {customCondition.trim() && (
                    <button
                      onClick={() => handleSelect(currentStep.key, customCondition.trim())}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Search
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Free text input */}
          {currentStep.type === 'question' && currentStep.freeText && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder={currentStep.placeholder}
                value={answers[currentStep.key] || ''}
                onChange={(e) => handleFreeText(currentStep.key, e.target.value)}
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-lg"
              />
              <p className="text-sm text-slate-500">
                💡 Tip: Being specific helps us find trials near you
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-800 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          ) : <div />}

          {(currentStep.type === 'intro' || currentStep.freeText) && (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-blue-900 text-white font-medium rounded-xl hover:bg-blue-800 transition-colors flex items-center gap-2"
            >
              {currentStep.type === 'intro' ? 'Get Started' : (isLastStep ? 'Find My Matches' : 'Continue')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Results page showing 3-4 matched trials
function MatchedTrialsResults({ criteria, onStartOver }) {
  const [trials, setTrials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [totalFound, setTotalFound] = useState(0);

  useEffect(() => {
    async function loadTrials() {
      setIsLoading(true);

      const result = await fetchMatchingTrials({
        condition: criteria.condition,
        location: criteria.location,
        phase: criteria.phasePreference,
        pageSize: 15 // Fetch more to score and pick best
      });

      // Score and sort trials
      const scoredTrials = result.trials.map(trial => ({
        ...trial,
        ...scoreTrialMatch(trial, criteria)
      }));

      // Sort by score and take top 4
      scoredTrials.sort((a, b) => b.score - a.score);
      const topTrials = scoredTrials.slice(0, 4);

      setTrials(topTrials);
      setTotalFound(result.totalCount);
      setIsLoading(false);
    }

    loadTrials();
  }, [criteria]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-slate-700">Finding your best matches...</h3>
          <p className="text-slate-500 mt-1">Analyzing trials for {criteria.condition}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Your Trial Matches</h1>
              <p className="text-sm text-slate-500">
                Top {trials.length} of {totalFound.toLocaleString()} trials for {criteria.condition}
              </p>
            </div>
            <button
              onClick={onStartOver}
              className="px-4 py-2 text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-colors"
            >
              New Search
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Summary */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">How we selected these trials</p>
              <p className="text-sm text-blue-700">
                We analyzed {totalFound.toLocaleString()} recruiting trials and selected these {trials.length} based on:
                {criteria.location && ` location (${criteria.location}),`}
                {criteria.phasePreference === 'cutting_edge' && ' newest treatments,'}
                {criteria.phasePreference === 'proven' && ' established treatments,'}
                {' '}contact availability, and institutional quality.
              </p>
            </div>
          </div>
        </div>

        {/* Trial Cards */}
        <div className="space-y-6">
          {trials.map((trial, index) => (
            <MatchedTrialCard
              key={trial.id}
              trial={trial}
              rank={index + 1}
              onViewDetails={() => setSelectedTrial(trial)}
            />
          ))}
        </div>

        {trials.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center border border-slate-200">
            <svg className="w-14 h-14 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-slate-800 mb-2">No matching trials found</h3>
            <p className="text-slate-600 mb-4">Try broadening your search criteria</p>
            <button onClick={onStartOver} className="px-5 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors">
              Try Again
            </button>
          </div>
        )}

        {/* What's Next Section */}
        {trials.length > 0 && (
          <div className="mt-10 bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-6 border border-teal-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">What to do next</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">1️⃣</span>
                </div>
                <h4 className="font-medium text-slate-800 mb-1">Review these trials</h4>
                <p className="text-sm text-slate-600">Click "View Details" to understand each trial's requirements</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">2️⃣</span>
                </div>
                <h4 className="font-medium text-slate-800 mb-1">Talk to your doctor</h4>
                <p className="text-sm text-slate-600">Print or save trial info to discuss at your next appointment</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">3️⃣</span>
                </div>
                <h4 className="font-medium text-slate-800 mb-1">Reach out</h4>
                <p className="text-sm text-slate-600">Use the contact info to ask questions or express interest</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Trial Detail Modal */}
      {selectedTrial && (
        <TrialDetailModal
          trial={selectedTrial}
          criteria={criteria}
          onClose={() => setSelectedTrial(null)}
        />
      )}
    </div>
  );
}

// Individual matched trial card
function MatchedTrialCard({ trial, rank, onViewDetails }) {
  const phaseColors = {
    'PHASE1': 'bg-purple-100 text-purple-700',
    'PHASE2': 'bg-blue-100 text-blue-700',
    'PHASE3': 'bg-teal-100 text-teal-700',
    'PHASE4': 'bg-green-100 text-green-700',
  };

  const getPhaseColor = () => {
    if (trial.phase.includes('1')) return phaseColors['PHASE1'];
    if (trial.phase.includes('2')) return phaseColors['PHASE2'];
    if (trial.phase.includes('3')) return phaseColors['PHASE3'];
    if (trial.phase.includes('4')) return phaseColors['PHASE4'];
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 text-white rounded-lg flex items-center justify-center font-semibold">
              #{rank}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPhaseColor()}`}>
                  {trial.phase || 'Phase N/A'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{trial.id}</span>
              </div>
              <h3 className="font-medium text-slate-800 leading-snug">{trial.title}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Match reasons */}
        {trial.matchReasons && trial.matchReasons.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {trial.matchReasons.map((reason, i) => (
              <span key={i} className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {reason}
              </span>
            ))}
          </div>
        )}

        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{trial.description}</p>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>{trial.sponsor}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span>{trial.locations.length} location{trial.locations.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Your Next Steps */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <h4 className="font-medium text-slate-700 text-sm mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Your Next Steps
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <span className="text-teal-600 font-medium">1.</span>
              <span className="text-slate-600">
                <strong>Review eligibility</strong> – Check if age ({trial.eligibility.minAge} - {trial.eligibility.maxAge}) and other criteria fit
              </span>
            </div>
            {trial.contact?.phone && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-teal-600 font-medium">2.</span>
                <span className="text-slate-600">
                  <strong>Call to ask questions</strong> – {trial.contact.phone}
                </span>
              </div>
            )}
            {trial.contact?.email && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-teal-600 font-medium">{trial.contact?.phone ? '3' : '2'}.</span>
                <span className="text-slate-600">
                  <strong>Email for more info</strong> – {trial.contact.email}
                </span>
              </div>
            )}
            {!trial.contact?.phone && !trial.contact?.email && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-teal-600 font-medium">2.</span>
                <span className="text-slate-600">
                  <strong>Discuss with your doctor</strong> – They can help contact the study team
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <a
          href={`https://clinicaltrials.gov/study/${trial.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-500 hover:text-blue-700 flex items-center gap-1"
        >
          View on ClinicalTrials.gov
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <button
          onClick={onViewDetails}
          className="px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
        >
          View Full Details
        </button>
      </div>
    </div>
  );
}

// Detailed trial modal
function TrialDetailModal({ trial, criteria, onClose }) {
  const printRef = React.useRef();

  const handlePrint = () => {
    const content = printRef.current;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${trial.title} - Trial Information</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            p { margin: 8px 0; line-height: 1.5; }
            .meta { color: #666; font-size: 14px; }
            .section { margin-bottom: 20px; }
            ul { margin: 8px 0; padding-left: 20px; }
            li { margin: 4px 0; }
          </style>
        </head>
        <body>
          <h1>${trial.title}</h1>
          <p class="meta">NCT ID: ${trial.id} | Status: Recruiting | Phase: ${trial.phase}</p>
          <p class="meta">Sponsor: ${trial.sponsor}</p>

          <div class="section">
            <h2>About This Study</h2>
            <p>${trial.description}</p>
          </div>

          <div class="section">
            <h2>Treatment Being Studied</h2>
            <p>${trial.interventionNames}</p>
          </div>

          <div class="section">
            <h2>Eligibility</h2>
            <p>Ages: ${trial.eligibility.minAge} to ${trial.eligibility.maxAge}</p>
            <p>Sex: ${trial.eligibility.sex}</p>
          </div>

          <div class="section">
            <h2>Locations (${trial.locations.length})</h2>
            <ul>
              ${trial.locations.map(loc => `<li>${loc.facility} - ${[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}</li>`).join('')}
            </ul>
          </div>

          ${trial.contact ? `
          <div class="section">
            <h2>Contact Information</h2>
            ${trial.contact.name ? `<p>Name: ${trial.contact.name}</p>` : ''}
            ${trial.contact.phone ? `<p>Phone: ${trial.contact.phone}</p>` : ''}
            ${trial.contact.email ? `<p>Email: ${trial.contact.email}</p>` : ''}
          </div>
          ` : ''}

          <div class="section">
            <h2>Questions to Ask Your Doctor</h2>
            <ul>
              <li>Am I eligible for this trial based on my medical history?</li>
              <li>How might this treatment interact with my current medications?</li>
              <li>What are the potential benefits and risks?</li>
              <li>How often would I need to visit the study site?</li>
              <li>What happens if I want to leave the trial?</li>
            </ul>
          </div>

          <p class="meta" style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
            Printed from Clinical Trials Explorer | Full details: https://clinicaltrials.gov/study/${trial.id}
          </p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
        ref={printRef}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-md text-xs font-medium">
              Recruiting
            </span>
            <span className="text-sm text-slate-400 font-mono">{trial.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
              title="Print for doctor visit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">{trial.title}</h2>
          <p className="text-slate-500 mb-6">Sponsored by {trial.sponsor} | Phase: {trial.phase}</p>

          {/* Match indicators */}
          {trial.matchReasons && trial.matchReasons.length > 0 && (
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-teal-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Why this trial matches your search
              </h4>
              <div className="flex flex-wrap gap-2">
                {trial.matchReasons.map((reason, i) => (
                  <span key={i} className="px-3 py-1 bg-white text-teal-700 text-sm rounded-full border border-teal-200">
                    {reason}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* About Section */}
          <div className="bg-blue-50 rounded-xl p-5 mb-6 border border-blue-100">
            <h3 className="font-medium text-slate-800 mb-2">About this study</h3>
            <p className="text-slate-600 text-sm">{trial.description}</p>
          </div>

          {/* Treatment */}
          <div className="mb-6">
            <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Treatment Being Studied
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-slate-700">{trial.interventionNames}</p>
            </div>
          </div>

          {/* Eligibility */}
          <div className="mb-6">
            <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Eligibility Requirements
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Age Range</p>
                  <p className="font-medium text-slate-700">{trial.eligibility.minAge} - {trial.eligibility.maxAge}</p>
                </div>
                <div>
                  <p className="text-slate-500">Sex</p>
                  <p className="font-medium text-slate-700">{trial.eligibility.sex}</p>
                </div>
                <div>
                  <p className="text-slate-500">Healthy Volunteers</p>
                  <p className="font-medium text-slate-700">{trial.eligibility.healthyVolunteers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Locations */}
          {trial.locations.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Study Locations ({trial.locations.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {trial.locations.map((loc, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="font-medium text-slate-700 text-sm">{loc.facility}</p>
                    <p className="text-xs text-slate-500">{[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          {trial.contact && (trial.contact.phone || trial.contact.email) && (
            <div className="mb-6">
              <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Information
              </h3>
              <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                {trial.contact.name && (
                  <p className="text-sm text-slate-700 mb-1"><strong>Contact:</strong> {trial.contact.name}</p>
                )}
                {trial.contact.phone && (
                  <p className="text-sm text-slate-700 mb-1">
                    <strong>Phone:</strong>{' '}
                    <a href={`tel:${trial.contact.phone}`} className="text-blue-700 hover:underline">
                      {trial.contact.phone}
                    </a>
                  </p>
                )}
                {trial.contact.email && (
                  <p className="text-sm text-slate-700">
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${trial.contact.email}`} className="text-blue-700 hover:underline">
                      {trial.contact.email}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Questions to ask */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
            <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Questions to Ask Your Doctor
            </h4>
            <ul className="text-sm text-amber-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></span>
                Am I eligible for this trial based on my medical history?
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></span>
                How might this treatment interact with my current medications?
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></span>
                What are the potential benefits and risks compared to standard treatment?
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></span>
                How often would I need to visit the study site?
              </li>
            </ul>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://clinicaltrials.gov/study/${trial.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-blue-900 text-white text-center font-medium rounded-xl hover:bg-blue-800 transition-colors"
            >
              View Full Details on ClinicalTrials.gov
            </a>
            <button
              onClick={handlePrint}
              className="py-3 px-6 border-2 border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print for Doctor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function TrialFinder() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [searchCriteria, setSearchCriteria] = useState(null);

  // Check for saved search
  useEffect(() => {
    const saved = localStorage.getItem('trialFinderCriteria');
    if (saved) {
      setSearchCriteria(JSON.parse(saved));
      setShowOnboarding(false);
    }
  }, []);

  const handleOnboardingComplete = (answers) => {
    setSearchCriteria(answers);
    localStorage.setItem('trialFinderCriteria', JSON.stringify(answers));
    setShowOnboarding(false);
  };

  const handleStartOver = () => {
    localStorage.removeItem('trialFinderCriteria');
    setSearchCriteria(null);
    setShowOnboarding(true);
  };

  if (showOnboarding) {
    return <FocusedOnboarding onComplete={handleOnboardingComplete} />;
  }

  return <MatchedTrialsResults criteria={searchCriteria} onStartOver={handleStartOver} />;
}
