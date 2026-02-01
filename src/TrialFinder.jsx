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

// Status badge colors
const statusColors = {
  'RECRUITING': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'ACTIVE_NOT_RECRUITING': 'bg-blue-100 text-blue-800 border-blue-200',
  'COMPLETED': 'bg-gray-100 text-gray-600 border-gray-200',
  'NOT_YET_RECRUITING': 'bg-amber-100 text-amber-800 border-amber-200'
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

// Educational Onboarding Flow Component
function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [trialCount, setTrialCount] = useState(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [totalTrials, setTotalTrials] = useState(null);

  // Fetch initial total count
  useEffect(() => {
    fetchTrialCount({}).then(count => setTotalTrials(count));
  }, []);

  const steps = [
    {
      type: 'intro',
      title: "Let's find trials that could help you",
      subtitle: "Clinical trials are how new treatments become available to everyone",
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-indigo-600 mb-2">
                {totalTrials ? <AnimatedNumber value={totalTrials} /> : '400,000+'}
              </div>
              <p className="text-slate-600">clinical trials are recruiting right now</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold text-emerald-600">Free</div>
                <p className="text-xs text-slate-500">Study care at no cost</p>
              </div>
              <div>
                <div className="text-2xl font-semibold text-blue-600">Safe</div>
                <p className="text-xs text-slate-500">FDA regulated</p>
              </div>
              <div>
                <div className="text-2xl font-semibold text-purple-600">Voluntary</div>
                <p className="text-xs text-slate-500">Leave anytime</p>
              </div>
            </div>
          </div>
          <p className="text-slate-600 text-center">
            Answer a few quick questions and we'll narrow down the trials most relevant to you.
          </p>
        </div>
      )
    },
    {
      type: 'question',
      key: 'reason',
      title: "What brings you here today?",
      subtitle: "Understanding your motivation helps us find the right trials",
      education: "People join clinical trials for many reasons — access to new treatments, contributing to research, or when current options aren't working. All reasons are valid.",
      options: [
        { value: 'seeking_treatment', label: 'Looking for treatment options', icon: '🏥', desc: 'Current treatments aren\'t enough' },
        { value: 'newly_diagnosed', label: 'Recently diagnosed', icon: '📋', desc: 'Exploring all my options' },
        { value: 'helping_someone', label: 'Helping a loved one', icon: '💝', desc: 'Researching for someone I care about' },
        { value: 'prevention', label: 'Prevention or early detection', icon: '🛡️', desc: 'Family history or risk factors' }
      ]
    },
    {
      type: 'question',
      key: 'condition',
      title: "What condition are you researching?",
      subtitle: "This will help us filter to relevant trials",
      education: "Clinical trials exist for almost every health condition. Some of the biggest breakthroughs in medicine — from cancer immunotherapy to HIV treatments — came from clinical trials.",
      options: categories.slice(0, 6).map(c => ({
        value: c.searchTerm,
        label: c.label,
        icon: c.icon,
        desc: `Trials for ${c.label.toLowerCase()}`
      })),
      allowCustom: true,
      customPlaceholder: "Or type your condition..."
    },
    {
      type: 'question',
      key: 'age',
      title: "What age group?",
      subtitle: "Trials have specific eligibility criteria",
      education: "Age requirements ensure treatments are tested safely. Many trials welcome a wide range of ages, and there are specific trials designed for children, adults, and seniors.",
      options: [
        { value: 'child', label: 'Under 18', icon: '👶', desc: 'Pediatric trials' },
        { value: 'adult', label: '18-64 years', icon: '👤', desc: 'Adult trials' },
        { value: 'senior', label: '65 and over', icon: '👴', desc: 'Senior-focused trials' },
        { value: 'any', label: 'Any age', icon: '👥', desc: 'Show all trials' }
      ]
    },
    {
      type: 'summary',
      title: "Here's what we found",
      subtitle: "Trials matching your criteria"
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

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete(answers);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header with Progress */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Trial Finder</h3>
                <p className="text-white/70 text-sm">Step {step + 1} of {steps.length}</p>
              </div>
            </div>

            {/* Live Trial Counter */}
            {answers.condition && (
              <div className="bg-white/20 rounded-xl px-4 py-2 text-right">
                <div className="text-white/70 text-xs">Matching trials</div>
                <div className="text-white font-bold text-lg">
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
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{currentStep.title}</h2>
          <p className="text-slate-500 mb-6">{currentStep.subtitle}</p>

          {/* Educational Tip */}
          {currentStep.education && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex gap-3">
                <span className="text-xl">💡</span>
                <p className="text-sm text-amber-800">{currentStep.education}</p>
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
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
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
                      <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}

              {currentStep.allowCustom && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder={currentStep.customPlaceholder}
                    className="w-full p-4 pl-12 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleSelect(currentStep.key, e.target.value.trim());
                      }
                    }}
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {currentStep.type === 'summary' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 text-center">
                <div className="text-5xl font-bold text-emerald-600 mb-2">
                  {isLoadingCount ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : trialCount !== null ? (
                    <AnimatedNumber value={trialCount} duration={1500} />
                  ) : '—'}
                </div>
                <p className="text-slate-600">clinical trials match your criteria</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-medium text-slate-800 mb-3">Your search criteria:</h4>
                <div className="space-y-2 text-sm">
                  {answers.reason && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      <span className="text-slate-600">Goal: {answers.reason.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  {answers.condition && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      <span className="text-slate-600">Condition: {answers.condition}</span>
                    </div>
                  )}
                  {answers.age && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      <span className="text-slate-600">Age: {answers.age === 'any' ? 'Any age' : answers.age}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <span className="text-xl">ℹ️</span>
                  <p className="text-sm text-blue-800">
                    <strong>What happens next?</strong> You'll see a list of trials you may be eligible for.
                    Click any trial to learn more, then contact the study team directly if interested.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="text-slate-600 hover:text-slate-800 font-medium"
            >
              ← Back
            </button>
          ) : (
            <div></div>
          )}

          {currentStep.type === 'intro' && (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              Get Started →
            </button>
          )}

          {currentStep.type === 'summary' && (
            <button
              onClick={handleComplete}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              View My Trials →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Trial Card Component
function TrialCard({ trial, onClick }) {
  const statusLabel = trial.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[trial.status] || 'bg-slate-100 text-slate-600'}`}>
          {statusLabel}
        </span>
        <span className="text-xs text-slate-400 font-mono">{trial.id}</span>
      </div>

      <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
        {trial.title}
      </h3>

      <p className="text-sm text-slate-500 mb-3">{trial.conditions.slice(0, 2).join(', ')}</p>

      <p className="text-sm text-slate-600 line-clamp-2 mb-4">{trial.description}</p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {trial.locations.length} location{trial.locations.length !== 1 ? 's' : ''}
        </div>
        <span className="text-indigo-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
          View details →
        </span>
      </div>
    </div>
  );
}

// Trial Detail Modal
function TrialDetail({ trial, onClose }) {
  if (!trial) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[trial.status] || 'bg-slate-100'}`}>
              {trial.status.replace(/_/g, ' ')}
            </span>
            <span className="text-sm text-slate-400 font-mono">{trial.id}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{trial.title}</h2>
          <p className="text-slate-500 mb-6">Sponsored by {trial.sponsor}</p>

          {/* About Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-slate-800 mb-2">About this study</h3>
            <p className="text-slate-600">{trial.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-5">
              <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                <span className="text-lg">💊</span> Treatment
              </h4>
              <p className="text-slate-600 text-sm">{trial.interventions}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-5">
              <h4 className="font-medium text-slate-800 mb-2 flex items-center gap-2">
                <span className="text-lg">👤</span> Eligibility
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
              <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-lg">📍</span> Study Locations
              </h4>
              <div className="space-y-2">
                {trial.locations.map((loc, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3">
                    <p className="font-medium text-slate-700">{loc.facility}</p>
                    <p className="text-sm text-slate-500">{[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-3">
            <a
              href={`https://clinicaltrials.gov/study/${trial.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              View on ClinicalTrials.gov
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
    <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
        <div className="h-4 w-20 bg-slate-200 rounded"></div>
      </div>
      <div className="h-5 w-full bg-slate-200 rounded mb-2"></div>
      <div className="h-5 w-3/4 bg-slate-200 rounded mb-3"></div>
      <div className="h-4 w-1/2 bg-slate-200 rounded mb-4"></div>
      <div className="h-16 w-full bg-slate-100 rounded"></div>
    </div>
  );
}

// Main Component
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Onboarding Flow */}
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={resetToHome}>
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Trial Finder</h1>
                <p className="text-xs text-slate-500">Powered by ClinicalTrials.gov</p>
              </div>
            </div>

            <button
              onClick={startNewSearch}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Find trials for me</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {view === 'home' && (
          <>
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">
                Find Clinical Trials That Matter to You
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Search over 400,000 clinical studies from around the world.
                Discover new treatment options and contribute to medical research.
              </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 mb-12 border border-slate-100">
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
                    className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold text-slate-800 mb-6">Browse by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className={`p-5 rounded-2xl bg-gradient-to-br ${cat.color} text-white hover:shadow-xl hover:scale-105 transition-all text-center group`}
                  >
                    <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform">{cat.icon}</span>
                    <span className="font-medium text-sm">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Section */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">Safe & Regulated</h4>
                <p className="text-slate-600 text-sm">All trials are reviewed by ethics boards and regulatory agencies to ensure participant safety.</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">Usually No Cost</h4>
                <p className="text-slate-600 text-sm">Study-related care, tests, and treatments are typically provided at no cost to participants.</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-slate-800 mb-2">Always Voluntary</h4>
                <p className="text-slate-600 text-sm">You can leave any trial at any time, for any reason. No pressure, no penalty.</p>
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
                <h2 className="text-2xl font-bold text-slate-800">
                  {isLoading ? 'Searching...' : `${totalCount.toLocaleString()} trials found`}
                </h2>
                <p className="text-slate-500">Results for "{searchQuery}"</p>
              </div>
            </div>

            {/* Results Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => <TrialSkeleton key={i} />)}
              </div>
            ) : trials.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {trials.map(trial => (
                  <TrialCard key={trial.id} trial={trial} onClick={() => setSelectedTrial(trial)} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No trials found</h3>
                <p className="text-slate-600 mb-4">Try different keywords or browse by category</p>
                <button onClick={resetToHome} className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                  Start over
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-center text-slate-500 text-sm">
            Data sourced from <a href="https://clinicaltrials.gov" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">ClinicalTrials.gov</a>.
            Always consult your healthcare provider before participating in any clinical trial.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <TrialDetail trial={selectedTrial} onClose={() => setSelectedTrial(null)} />
    </div>
  );
}
