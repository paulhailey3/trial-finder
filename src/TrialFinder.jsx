import React, { useState, useEffect } from 'react';

// API Configuration
const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

// Fetch trial count from ClinicalTrials.gov API
async function fetchTrialCount({ condition, ageRange, location }) {
  let url = `${API_BASE}?format=json&pageSize=1&countTotal=true&filter.overallStatus=RECRUITING`;
  if (condition) url += `&query.cond=${encodeURIComponent(condition)}`;
  if (ageRange) {
    if (ageRange === 'child') url += `&filter.advanced=AREA[MinimumAge]RANGE[MIN,17 years]`;
    else if (ageRange === 'adult') url += `&filter.advanced=AREA[MinimumAge]RANGE[18 years,64 years]`;
    else if (ageRange === 'senior') url += `&filter.advanced=AREA[MinimumAge]RANGE[65 years,MAX]`;
  }
  if (location) url += `&query.locn=${encodeURIComponent(location)}`;

  try {
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    return data.totalCount || 0;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

// Fetch trials from ClinicalTrials.gov API
async function fetchTrials({ condition, pageSize = 20 }) {
  let url = `${API_BASE}?format=json&pageSize=${pageSize}&countTotal=true&filter.overallStatus=RECRUITING`;
  if (condition) url += `&query.cond=${encodeURIComponent(condition)}`;

  try {
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    return { trials: (data.studies || []).map(parseTrialData), totalCount: data.totalCount || 0 };
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

  return {
    id: id.nctId || '',
    title: id.briefTitle || 'Untitled Study',
    phase: design.phases?.join(', ') || 'Not specified',
    status: status.overallStatus || 'Unknown',
    sponsor: sponsors.leadSponsor?.name || 'Unknown Sponsor',
    conditions: conds.conditions || [],
    interventions: interventions.interventions?.map(i => i.name).join(', ') || 'Not specified',
    description: desc.briefSummary || 'No description available',
    eligibility: {
      criteria: eligibility.eligibilityCriteria || 'Not specified',
      minAge: eligibility.minimumAge || 'Not specified',
      maxAge: eligibility.maximumAge || 'Not specified',
      sex: eligibility.sex || 'All'
    },
    locations: (contacts.locations || []).slice(0, 5).map(loc => ({
      facility: loc.facility || 'Unknown Facility',
      city: loc.city || '',
      state: loc.state || '',
      country: loc.country || ''
    })),
    contact: contacts.centralContacts?.[0] || null
  };
}

// Categories for browsing
const categories = [
  { id: 'cancer', label: 'Cancer', icon: '🎗️', searchTerm: 'cancer', color: 'from-rose-500 to-pink-600' },
  { id: 'heart', label: 'Heart Disease', icon: '❤️', searchTerm: 'heart disease OR cardiovascular', color: 'from-red-500 to-rose-600' },
  { id: 'diabetes', label: 'Diabetes', icon: '💉', searchTerm: 'diabetes', color: 'from-blue-500 to-indigo-600' },
  { id: 'mental', label: 'Mental Health', icon: '🧠', searchTerm: 'depression OR anxiety OR mental health', color: 'from-purple-500 to-violet-600' },
  { id: 'neuro', label: 'Neurological', icon: '⚡', searchTerm: 'alzheimer OR parkinson OR multiple sclerosis', color: 'from-amber-500 to-orange-600' },
  { id: 'autoimmune', label: 'Autoimmune', icon: '🛡️', searchTerm: 'autoimmune OR rheumatoid OR lupus', color: 'from-emerald-500 to-teal-600' },
  { id: 'rare', label: 'Rare Diseases', icon: '🦋', searchTerm: 'rare disease OR orphan', color: 'from-pink-500 to-fuchsia-600' },
  { id: 'infectious', label: 'Infectious Disease', icon: '🦠', searchTerm: 'infectious disease OR viral OR bacterial', color: 'from-lime-500 to-green-600' }
];

// Status badge colors - Professional medical styling
const statusColors = {
  'RECRUITING': 'bg-teal-50 text-teal-700 border-teal-200',
  'ACTIVE_NOT_RECRUITING': 'bg-blue-50 text-blue-700 border-blue-200',
  'COMPLETED': 'bg-slate-100 text-slate-600 border-slate-200',
  'NOT_YET_RECRUITING': 'bg-amber-50 text-amber-700 border-amber-200'
};

// Animated number component
function AnimatedNumber({ value, duration = 1000 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === null) return;

    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (value - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

// Professional Educational Onboarding Flow Component
function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [trialCount, setTrialCount] = useState(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [totalTrials, setTotalTrials] = useState(null);
  const [customCondition, setCustomCondition] = useState('');

  // Fetch initial total count
  useEffect(() => {
    fetchTrialCount({}).then(count => setTotalTrials(count));
  }, []);

  const steps = [
    {
      type: 'intro',
      title: "Welcome to the Clinical Trials Explorer",
      subtitle: "Your resource for learning about research opportunities",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-6 border border-blue-100">
            <div className="text-center mb-6">
              <div className="text-5xl font-light text-blue-900 mb-2">
                {totalTrials ? <AnimatedNumber value={totalTrials} /> : '400,000+'}
              </div>
              <p className="text-slate-600">active clinical studies worldwide</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white rounded-xl border border-slate-100">
                <div className="text-lg font-semibold text-blue-900">Learn</div>
                <p className="text-xs text-slate-500">About new treatments</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100">
                <div className="text-lg font-semibold text-blue-900">Explore</div>
                <p className="text-xs text-slate-500">Your options</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100">
                <div className="text-lg font-semibold text-blue-900">Discuss</div>
                <p className="text-xs text-slate-500">With your doctor</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-amber-800 font-medium mb-1">Important</p>
                <p className="text-sm text-amber-700">This tool helps you learn about clinical trials. Always discuss any treatment decisions with your healthcare provider.</p>
              </div>
            </div>
          </div>

          <p className="text-slate-600 text-center text-sm">
            Answer a few questions to find trials relevant to your situation. This usually takes about 2 minutes.
          </p>
        </div>
      )
    },
    {
      type: 'question',
      key: 'userType',
      title: "Who are you exploring trials for?",
      subtitle: "This helps us personalize your experience",
      education: "Clinical trial information can be valuable for patients, caregivers, and healthcare professionals alike. Understanding who is searching helps us present information in the most helpful way.",
      options: [
        { value: 'patient', label: "I'm a patient", icon: '👤', desc: 'Looking for options for myself' },
        { value: 'caregiver', label: "I'm a caregiver or family member", icon: '👨‍👩‍👧', desc: 'Researching for a loved one' },
        { value: 'provider', label: "I'm a healthcare provider", icon: '⚕️', desc: 'Exploring options for patients' },
        { value: 'researcher', label: "I'm researching or learning", icon: '📚', desc: 'General interest or education' }
      ]
    },
    {
      type: 'question',
      key: 'primaryGoal',
      title: "What would you like to accomplish?",
      subtitle: "Understanding your goals helps us guide you better",
      education: "People explore clinical trials for many reasons — whether looking for new treatment options, wanting to stay informed about advances in care, or seeking ways to contribute to medical progress.",
      options: [
        { value: 'learn_options', label: 'Learn about treatment options', icon: '🔍', desc: 'Understand what experimental treatments exist' },
        { value: 'find_specific', label: 'Find a specific trial', icon: '🎯', desc: 'I know what I\'m looking for' },
        { value: 'discuss_doctor', label: 'Prepare for a doctor visit', icon: '💬', desc: 'Gather information to discuss with my provider' },
        { value: 'general_info', label: 'Learn how trials work', icon: '📖', desc: 'Understand the clinical trial process' }
      ]
    },
    {
      type: 'question',
      key: 'treatmentStatus',
      title: "What is the current treatment situation?",
      subtitle: "This helps us identify the most relevant opportunities",
      education: "Clinical trials are available at every stage of care — from prevention studies for those at risk, to trials for newly diagnosed patients, to options for those who've tried other treatments.",
      options: [
        { value: 'newly_diagnosed', label: 'Newly diagnosed', icon: '📋', desc: 'Recently received a diagnosis' },
        { value: 'current_treatment', label: 'Currently in treatment', icon: '💊', desc: 'Undergoing treatment now' },
        { value: 'seeking_alternatives', label: 'Looking for alternatives', icon: '🔄', desc: 'Current treatment isn\'t working well' },
        { value: 'prevention', label: 'Prevention or early detection', icon: '🛡️', desc: 'Interested in preventive studies' },
        { value: 'not_applicable', label: 'Not applicable', icon: '➡️', desc: 'Just exploring generally' }
      ]
    },
    {
      type: 'question',
      key: 'condition',
      title: "What health condition are you researching?",
      subtitle: "Select a category or enter a specific condition",
      education: "Clinical trials cover virtually every health condition. Breakthrough treatments for many conditions — from cancer immunotherapies to gene therapies — started as clinical trials.",
      options: [
        { value: 'cancer', label: 'Cancer', icon: '🎗️', desc: 'Oncology trials' },
        { value: 'heart disease OR cardiovascular', label: 'Heart & Cardiovascular', icon: '❤️', desc: 'Cardiac conditions' },
        { value: 'diabetes', label: 'Diabetes & Metabolic', icon: '💉', desc: 'Metabolic disorders' },
        { value: 'depression OR anxiety OR mental health', label: 'Mental Health', icon: '🧠', desc: 'Psychiatric conditions' },
        { value: 'alzheimer OR parkinson OR neurological', label: 'Neurological', icon: '⚡', desc: 'Brain & nervous system' },
        { value: 'autoimmune OR rheumatoid', label: 'Autoimmune & Inflammatory', icon: '🛡️', desc: 'Immune system conditions' }
      ],
      allowCustom: true,
      customPlaceholder: "Or type a specific condition (e.g., 'breast cancer', 'lupus', 'asthma')..."
    },
    {
      type: 'question',
      key: 'age',
      title: "What is the patient's age group?",
      subtitle: "Trials have specific eligibility requirements",
      education: "Age requirements ensure treatments are tested appropriately for different populations. Many trials welcome a range of ages, and there are specialized studies for pediatric, adult, and geriatric patients.",
      options: [
        { value: 'child', label: 'Child (under 18)', icon: '👶', desc: 'Pediatric trials' },
        { value: 'adult', label: 'Adult (18-64)', icon: '👤', desc: 'Adult trials' },
        { value: 'senior', label: 'Senior (65+)', icon: '👴', desc: 'Older adult trials' },
        { value: 'any', label: 'Prefer not to specify', icon: '👥', desc: 'Show all age groups' }
      ]
    },
    {
      type: 'multiselect',
      key: 'priorities',
      title: "What matters most to you?",
      subtitle: "Select all that apply — this helps us highlight relevant information",
      education: "Everyone's priorities are different. Understanding what's important to you helps us present trial information in the most useful way.",
      options: [
        { value: 'location', label: 'Close to home', icon: '📍', desc: 'Minimize travel' },
        { value: 'cost', label: 'No cost for treatment', icon: '💵', desc: 'Free study medication/care' },
        { value: 'time', label: 'Minimal time commitment', icon: '⏰', desc: 'Fewer visits required' },
        { value: 'cutting_edge', label: 'Latest innovations', icon: '🔬', desc: 'Newest treatments' },
        { value: 'standard_care', label: 'Option for standard care', icon: '⚖️', desc: 'May receive proven treatment' },
        { value: 'quality_of_life', label: 'Quality of life focus', icon: '🌟', desc: 'Side effect management' }
      ]
    },
    {
      type: 'summary',
      title: "Your Personalized Results",
      subtitle: "Based on your responses"
    }
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  // Update trial count when answers change
  useEffect(() => {
    if (answers.condition) {
      setIsLoadingCount(true);
      fetchTrialCount({
        condition: answers.condition,
        ageRange: answers.age !== 'any' ? answers.age : null
      }).then(count => {
        setTrialCount(count);
        setIsLoadingCount(false);
      });
    }
  }, [answers.condition, answers.age]);

  const handleSelect = (key, value) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    setTimeout(() => {
      if (step < steps.length - 1) {
        setStep(step + 1);
      }
    }, 300);
  };

  const handleMultiSelect = (key, value) => {
    const current = answers[key] || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setAnswers({ ...answers, [key]: newValue });
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete(answers);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header with Progress - Professional Medical Styling */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Clinical Trials Explorer</h3>
                <p className="text-blue-200 text-sm">Step {step + 1} of {steps.length}</p>
              </div>
            </div>

            {/* Live Trial Counter */}
            {answers.condition && (
              <div className="bg-white/10 rounded-lg px-4 py-2 text-right">
                <div className="text-blue-200 text-xs">Matching trials</div>
                <div className="text-white font-semibold text-lg">
                  {isLoadingCount ? (
                    <span className="animate-pulse">...</span>
                  ) : trialCount !== null ? (
                    <AnimatedNumber value={trialCount} />
                  ) : '—'}
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-blue-950/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">{currentStep.title}</h2>
          <p className="text-slate-500 mb-6">{currentStep.subtitle}</p>

          {/* Educational Tip */}
          {currentStep.education && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-blue-800">{currentStep.education}</p>
              </div>
            </div>
          )}

          {/* Intro Content */}
          {currentStep.type === 'intro' && currentStep.content}

          {/* Question Options */}
          {currentStep.type === 'question' && (
            <div className="space-y-3">
              {currentStep.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(currentStep.key, opt.value)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    answers[currentStep.key] === opt.value
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{opt.label}</p>
                      <p className="text-sm text-slate-500">{opt.desc}</p>
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

          {/* Multi-select Options */}
          {currentStep.type === 'multiselect' && (
            <div className="space-y-3">
              {currentStep.options.map((opt) => {
                const isSelected = (answers[currentStep.key] || []).includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleMultiSelect(currentStep.key, opt.value)}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{opt.label}</p>
                        <p className="text-sm text-slate-500">{opt.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => setStep(step + 1)}
                className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Summary */}
          {currentStep.type === 'summary' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-6 text-center border border-teal-100">
                <div className="text-5xl font-light text-blue-900 mb-2">
                  {isLoadingCount ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : trialCount !== null ? (
                    <AnimatedNumber value={trialCount} duration={1500} />
                  ) : '—'}
                </div>
                <p className="text-slate-600">clinical trials match your criteria</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="font-medium text-slate-800 mb-3">Your search summary</h4>
                <div className="space-y-2 text-sm">
                  {answers.userType && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span className="text-slate-600">
                        Searching as: {answers.userType === 'patient' ? 'Patient' :
                          answers.userType === 'caregiver' ? 'Caregiver/Family' :
                          answers.userType === 'provider' ? 'Healthcare Provider' : 'Researcher'}
                      </span>
                    </div>
                  )}
                  {answers.condition && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span className="text-slate-600">Condition: {answers.condition}</span>
                    </div>
                  )}
                  {answers.age && answers.age !== 'any' && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                      <span className="text-slate-600">Age group: {
                        answers.age === 'child' ? 'Under 18' :
                        answers.age === 'adult' ? '18-64' : '65+'
                      }</span>
                    </div>
                  )}
                  {answers.priorities && answers.priorities.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5"></span>
                      <span className="text-slate-600">Priorities: {answers.priorities.map(p => {
                        const labels = {
                          location: 'Close to home',
                          cost: 'No cost',
                          time: 'Minimal time',
                          cutting_edge: 'Latest innovations',
                          standard_care: 'Standard care option',
                          quality_of_life: 'Quality of life'
                        };
                        return labels[p];
                      }).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-amber-800 font-medium mb-1">Remember</p>
                    <p className="text-sm text-amber-700">
                      Use this information to have an informed conversation with your doctor.
                      Only your healthcare provider can determine if a clinical trial is right for you.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-1">What's next?</p>
                    <p className="text-sm text-blue-700">
                      Browse trials to learn about available research studies. Click any trial to see details,
                      eligibility requirements, and locations. Save interesting trials to discuss with your healthcare team.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
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
          ) : (
            <div></div>
          )}

          {currentStep.type === 'intro' && (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-3 bg-blue-900 text-white font-medium rounded-xl hover:bg-blue-800 transition-colors flex items-center gap-2"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {currentStep.type === 'summary' && (
            <button
              onClick={handleComplete}
              className="px-6 py-3 bg-teal-600 text-white font-medium rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              Explore Trials
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

// Trial Card Component - Professional Medical Styling
function TrialCard({ trial, onClick }) {
  const statusLabel = trial.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${statusColors[trial.status] || 'bg-slate-100 text-slate-600'}`}>
          {statusLabel}
        </span>
        <span className="text-xs text-slate-400 font-mono">{trial.id}</span>
      </div>

      <h3 className="font-medium text-slate-800 mb-2 line-clamp-2 group-hover:text-blue-900 transition-colors">
        {trial.title}
      </h3>

      <p className="text-sm text-slate-500 mb-2">{trial.conditions.slice(0, 2).join(', ')}</p>

      <p className="text-sm text-slate-600 line-clamp-2 mb-4">{trial.description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {trial.locations.length} location{trial.locations.length !== 1 ? 's' : ''}
        </div>
        <span className="text-blue-700 text-sm font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
          View details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  );
}

// Trial Detail Modal - Professional Medical Styling
function TrialDetail({ trial, onClose }) {
  if (!trial) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${statusColors[trial.status] || 'bg-slate-100'}`}>
              {trial.status.replace(/_/g, ' ')}
            </span>
            <span className="text-sm text-slate-400 font-mono">{trial.id}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">{trial.title}</h2>
          <p className="text-slate-500 mb-6">Sponsored by {trial.sponsor}</p>

          {/* About Section */}
          <div className="bg-blue-50 rounded-xl p-5 mb-6 border border-blue-100">
            <h3 className="font-medium text-slate-800 mb-2">About this study</h3>
            <p className="text-slate-600 text-sm">{trial.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Treatment
              </h4>
              <p className="text-slate-600 text-sm">{trial.interventions}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Eligibility
              </h4>
              <p className="text-slate-600 text-sm">
                Ages: {trial.eligibility.minAge} - {trial.eligibility.maxAge}<br />
                Sex: {trial.eligibility.sex}
              </p>
            </div>
          </div>

          {/* Locations */}
          {trial.locations.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Study Locations
              </h4>
              <div className="space-y-2">
                {trial.locations.map((loc, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="font-medium text-slate-700 text-sm">{loc.facility}</p>
                    <p className="text-xs text-slate-500">{[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm text-amber-700">
                <strong>Talk to your doctor</strong> before considering this trial. Eligibility is determined by the study team based on medical evaluation.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <a
              href={`https://clinicaltrials.gov/study/${trial.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-blue-900 text-white text-center font-medium rounded-xl hover:bg-blue-800 transition-colors"
            >
              View Full Details on ClinicalTrials.gov
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton
function TrialSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-6 w-20 bg-slate-200 rounded-md"></div>
        <div className="h-4 w-24 bg-slate-100 rounded"></div>
      </div>
      <div className="h-5 w-full bg-slate-200 rounded mb-2"></div>
      <div className="h-5 w-3/4 bg-slate-200 rounded mb-3"></div>
      <div className="h-4 w-1/2 bg-slate-100 rounded mb-4"></div>
      <div className="h-12 w-full bg-slate-100 rounded"></div>
    </div>
  );
}

// Main Component - Professional Medical Styling
export default function TrialFinder() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingAnswers, setOnboardingAnswers] = useState(null);
  const [view, setView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [trials, setTrials] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState(null);

  // Check for returning visitor
  useEffect(() => {
    const savedAnswers = localStorage.getItem('trialFinderAnswers');
    if (savedAnswers) {
      setOnboardingAnswers(JSON.parse(savedAnswers));
    } else {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = async (answers) => {
    setOnboardingAnswers(answers);
    localStorage.setItem('trialFinderAnswers', JSON.stringify(answers));
    setShowOnboarding(false);

    // Automatically search with the onboarding answers
    if (answers.condition) {
      handleSearch(answers.condition);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setView('results');
    setSearchQuery(query);

    const result = await fetchTrials({ condition: query, pageSize: 20 });
    setTrials(result.trials);
    setTotalCount(result.totalCount);
    setIsLoading(false);
  };

  const handleCategoryClick = (category) => {
    handleSearch(category.searchTerm);
  };

  const resetToHome = () => {
    setView('home');
    setSearchQuery('');
    setTrials([]);
  };

  const startNewSearch = () => {
    localStorage.removeItem('trialFinderAnswers');
    setOnboardingAnswers(null);
    setShowOnboarding(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Onboarding Flow */}
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}

      {/* Header - Professional Medical Styling */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={resetToHome}>
              <div className="bg-blue-900 p-2.5 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">Clinical Trials Explorer</h1>
                <p className="text-xs text-slate-500">Powered by ClinicalTrials.gov</p>
              </div>
            </div>

            <button
              onClick={startNewSearch}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">New Search</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {view === 'home' && (
          <>
            {/* Hero Section - Professional Medical Styling */}
            <div className="text-center mb-10">
              <h2 className="text-3xl font-semibold text-slate-800 mb-3">
                Explore Clinical Trial Opportunities
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Learn about research studies and experimental treatments.
                Find information to discuss with your healthcare provider.
              </p>
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 max-w-2xl mx-auto">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-blue-800">
                  <strong>Educational resource:</strong> This tool helps you learn about clinical trials.
                  Always consult with your healthcare provider before making any treatment decisions.
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-10 border border-slate-200 max-w-3xl mx-auto">
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }} className="flex gap-3">
                <div className="flex-1 relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search conditions, treatments, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="mb-10">
              <h3 className="text-lg font-medium text-slate-800 mb-4 text-center">Browse by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-center group"
                  >
                    <span className="text-2xl mb-2 block">{cat.icon}</span>
                    <span className="font-medium text-sm text-slate-700 group-hover:text-blue-900">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Section - Professional Medical Styling */}
            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="font-medium text-slate-800 mb-1">Safety First</h4>
                <p className="text-slate-600 text-sm">All trials are reviewed by ethics boards and regulatory agencies.</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-medium text-slate-800 mb-1">Often No Cost</h4>
                <p className="text-slate-600 text-sm">Study-related care and treatments are typically provided free.</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <h4 className="font-medium text-slate-800 mb-1">Always Voluntary</h4>
                <p className="text-slate-600 text-sm">You can leave any trial at any time, for any reason.</p>
              </div>
            </div>
          </>
        )}

        {view === 'results' && (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <button onClick={resetToHome} className="flex items-center text-sm text-slate-500 hover:text-slate-700 mb-2">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to search
                </button>
                <h2 className="text-2xl font-semibold text-slate-800">
                  {isLoading ? 'Searching...' : `${totalCount.toLocaleString()} trials found`}
                </h2>
                <p className="text-slate-500">Results for "{searchQuery}"</p>
              </div>
            </div>

            {/* Results Info Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-blue-800">
                  These results are for informational purposes. Click on any trial to learn more,
                  then discuss with your healthcare provider to determine if participation might be appropriate.
                </p>
              </div>
            </div>

            {/* Results Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <TrialSkeleton key={i} />)}
              </div>
            ) : trials.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trials.map(trial => (
                  <TrialCard key={trial.id} trial={trial} onClick={() => setSelectedTrial(trial)} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-10 text-center border border-slate-200">
                <svg className="w-14 h-14 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No trials found</h3>
                <p className="text-slate-600 mb-4">Try different keywords or browse by category</p>
                <button onClick={resetToHome} className="px-5 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors">
                  Start over
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer - Professional Medical Styling */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center space-y-3">
            <p className="text-slate-600 text-sm">
              Data sourced from <a href="https://clinicaltrials.gov" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">ClinicalTrials.gov</a>,
              a service of the U.S. National Library of Medicine.
            </p>
            <p className="text-slate-500 text-xs">
              This tool provides educational information only and does not constitute medical advice.
              Always consult your healthcare provider before participating in any clinical trial.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TrialDetail trial={selectedTrial} onClose={() => setSelectedTrial(null)} />
    </div>
  );
}
