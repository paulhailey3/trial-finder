import React, { useState, useEffect } from 'react';

// API Configuration
const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

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
  { id: 'autoimmune', label: 'Autoimmune', icon: '🛡️', searchTerm: 'autoimmune OR rheumatoid OR lupus', color: 'from-emerald-500 to-teal-600' }
];

// Visitor intent options
const visitorIntents = [
  { id: 'patient', label: "I'm looking for treatment options", icon: '🏥', description: 'Find trials that might help with your condition' },
  { id: 'caregiver', label: "I'm helping someone find options", icon: '💝', description: 'Research trials for a loved one' },
  { id: 'curious', label: "I'm curious about clinical trials", icon: '🔍', description: 'Learn how trials work and what to expect' },
  { id: 'researcher', label: "I'm a healthcare professional", icon: '👨‍⚕️', description: 'Explore ongoing research in your field' }
];

// Status badge colors
const statusColors = {
  'RECRUITING': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'ACTIVE_NOT_RECRUITING': 'bg-blue-100 text-blue-800 border-blue-200',
  'COMPLETED': 'bg-gray-100 text-gray-600 border-gray-200',
  'NOT_YET_RECRUITING': 'bg-amber-100 text-amber-800 border-amber-200'
};

// Welcome Modal Component
function WelcomeModal({ isOpen, onComplete }) {
  const [selectedIntent, setSelectedIntent] = useState(null);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (selectedIntent) {
      localStorage.setItem('trialFinderIntent', selectedIntent);
      onComplete(selectedIntent);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-10 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Trial Finder</h1>
          <p className="text-white/80 text-lg">Connecting you with clinical research opportunities</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-2 text-center">
            What brings you here today?
          </h2>
          <p className="text-slate-500 text-center mb-6">
            This helps us personalize your experience
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visitorIntents.map((intent) => (
              <button
                key={intent.id}
                onClick={() => setSelectedIntent(intent.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedIntent === intent.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{intent.icon}</span>
                  <div>
                    <p className="font-medium text-slate-800">{intent.label}</p>
                    <p className="text-sm text-slate-500">{intent.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedIntent}
            className={`w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all ${
              selectedIntent
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Get Started
          </button>

          <p className="text-center text-sm text-slate-400 mt-4">
            Data sourced from <a href="https://clinicaltrials.gov" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">ClinicalTrials.gov</a>
          </p>
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

// Guided Assistant Modal
function GuidedAssistant({ isOpen, onClose, onSearch }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ category: '', goal: '', age: '' });

  const questions = [
    {
      question: "What condition are you researching?",
      key: 'category',
      options: categories.map(c => ({ value: c.searchTerm, label: `${c.icon} ${c.label}` }))
    },
    {
      question: "What's your primary goal?",
      key: 'goal',
      options: [
        { value: 'new_treatment', label: '🔬 Find newer treatment options' },
        { value: 'current_not_working', label: "💭 Current treatment isn't working" },
        { value: 'preventive', label: '🛡️ Preventive care or early detection' },
        { value: 'exploring', label: "🔍 Just exploring what's available" }
      ]
    },
    {
      question: "What age group?",
      key: 'age',
      options: [
        { value: 'child', label: '👶 Child (under 18)' },
        { value: 'adult', label: '👤 Adult (18-64)' },
        { value: 'senior', label: '👴 Senior (65+)' },
        { value: 'any', label: '📋 Any age' }
      ]
    }
  ];

  if (!isOpen) return null;

  const currentQ = questions[step];
  const isLastStep = step === questions.length - 1;

  const handleSelect = (value) => {
    const newAnswers = { ...answers, [currentQ.key]: value };
    setAnswers(newAnswers);

    if (isLastStep) {
      onSearch(newAnswers.category);
      onClose();
      setStep(0);
      setAnswers({ category: '', goal: '', age: '' });
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Find the right trial</h3>
                <p className="text-white/70 text-sm">Question {step + 1} of {questions.length}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Progress */}
          <div className="h-1 bg-white/20 rounded-full">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h4 className="text-xl font-semibold text-slate-800 mb-4">{currentQ.question}</h4>
          <div className="space-y-2">
            {currentQ.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="w-full px-4 py-3.5 text-left bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border-2 border-transparent rounded-xl transition-all"
              >
                <span className="font-medium text-slate-700">{opt.label}</span>
              </button>
            ))}
          </div>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="mt-4 text-sm text-slate-500 hover:text-slate-700">
              ← Go back
            </button>
          )}
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
  const [showWelcome, setShowWelcome] = useState(false);
  const [userIntent, setUserIntent] = useState(null);
  const [view, setView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [trials, setTrials] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);

  // Check for returning visitor
  useEffect(() => {
    const savedIntent = localStorage.getItem('trialFinderIntent');
    if (savedIntent) {
      setUserIntent(savedIntent);
    } else {
      setShowWelcome(true);
    }
  }, []);

  const handleWelcomeComplete = (intent) => {
    setUserIntent(intent);
    setShowWelcome(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Welcome Modal */}
      <WelcomeModal isOpen={showWelcome} onComplete={handleWelcomeComplete} />

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
              onClick={() => setShowAssistant(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Help me find trials</span>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
      <GuidedAssistant isOpen={showAssistant} onClose={() => setShowAssistant(false)} onSearch={handleSearch} />
    </div>
  );
}
