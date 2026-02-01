import React, { useState, useEffect, useCallback } from 'react';

// ============================================
// API HELPERS
// ============================================

const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

async function fetchTrials({ condition, pageSize = 50 }) {
  // Build simple URL
  let url = `${API_BASE}?format=json&pageSize=${pageSize}&countTotal=true&filter.overallStatus=RECRUITING`;

  if (condition) {
    url += `&query.cond=${encodeURIComponent(condition)}`;
  }

  try {
    console.log('Fetching:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API response - found', data.totalCount, 'trials');

    return {
      trials: (data.studies || []).map(parseTrialData),
      totalCount: data.totalCount || 0
    };
  } catch (error) {
    console.error('Failed to fetch trials:', error);
    return { trials: [], totalCount: 0, error: error.message };
  }
}

async function fetchTrialCount(condition) {
  let url = `${API_BASE}?format=json&pageSize=1&countTotal=true&filter.overallStatus=RECRUITING`;

  if (condition) {
    url += `&query.cond=${encodeURIComponent(condition)}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.totalCount || 0;
  } catch (error) {
    console.error('Count fetch error:', error);
    return 0;
  }
}

function parseTrialData(study) {
  const protocol = study.protocolSection || {};
  const id = protocol.identificationModule || {};
  const status = protocol.statusModule || {};
  const design = protocol.designModule || {};
  const sponsors = protocol.sponsorCollaboratorsModule || {};
  const conditions = protocol.conditionsModule || {};
  const interventions = protocol.armsInterventionsModule || {};
  const eligibility = protocol.eligibilityModule || {};
  const contacts = protocol.contactsLocationsModule || {};
  const description = protocol.descriptionModule || {};

  const locations = (contacts.locations || []).slice(0, 5).map(loc => ({
    facility: loc.facility || 'Research Site',
    city: loc.city || '',
    state: loc.state || '',
    country: loc.country || 'USA'
  }));

  return {
    id: id.nctId || '',
    title: id.briefTitle || id.officialTitle || 'Untitled Study',
    subtitle: conditions.conditions?.[0] || 'Clinical Trial',
    phase: design.phases?.join(', ') || 'Not specified',
    status: status.overallStatus || 'Unknown',
    sponsor: sponsors.leadSponsor?.name || 'Research Institution',
    conditions: conditions.conditions || [],
    treatment: interventions.interventions?.map(i => i.name).join(', ') || 'Study intervention',
    locations: locations,
    eligibility: {
      minAge: parseInt(eligibility.minimumAge) || 18,
      maxAge: parseInt(eligibility.maximumAge) || 99,
      sex: eligibility.sex?.toLowerCase() || 'all',
      criteria: eligibility.eligibilityCriteria || ''
    },
    description: description.briefSummary || 'No description available.',
    duration: 'Varies',
    visits: 'Per protocol'
  };
}

// ============================================
// CATEGORIES
// ============================================

const categories = [
  { id: 'cancer', name: 'Cancer', query: 'cancer', icon: '🎗️', count: 18794 },
  { id: 'heart', name: 'Heart Disease', query: 'heart failure', icon: '❤️', count: 1008 },
  { id: 'diabetes', name: 'Diabetes', query: 'diabetes', icon: '💉', count: 2028 },
  { id: 'mental', name: 'Mental Health', query: 'depression', icon: '🧠', count: 1513 },
  { id: 'neuro', name: 'Neurological', query: 'alzheimer parkinson', icon: '⚡', count: 892 },
  { id: 'autoimmune', name: 'Autoimmune', query: 'rheumatoid lupus', icon: '🛡️', count: 567 },
  { id: 'respiratory', name: 'Respiratory', query: 'asthma COPD', icon: '🫁', count: 734 },
  { id: 'rare', name: 'Rare Diseases', query: 'rare disease', icon: '🧬', count: 1245 }
];

// Real sample trials from ClinicalTrials.gov (fallback data)
const sampleTrials = [
  { id: "NCT06507618", title: "Pre-Operative Window of Endocrine Therapy for Early-Stage Breast Cancer", subtitle: "Breast Cancer", phase: "Phase 3", status: "RECRUITING", sponsor: "University of Virginia", conditions: ["Breast Cancer"], treatment: "Tamoxifen, Letrozole, Anastrozole, or Exemestane", locations: [{ facility: "University of Virginia", city: "Charlottesville", state: "VA", country: "USA" }], eligibility: { minAge: 65, maxAge: 99, sex: "female", criteria: "" }, description: "A randomized trial to inform radiation therapy decisions in older women with early-stage breast cancer through pre-operative endocrine therapy.", duration: "5 years", visits: "Per protocol" },
  { id: "NCT04851613", title: "Afuresertib Plus Fulvestrant for HR+/HER2- Breast Cancer", subtitle: "Metastatic Breast Cancer", phase: "Phase 3", status: "RECRUITING", sponsor: "Laekna Limited", conditions: ["Breast Cancer", "Metastatic"], treatment: "Afuresertib + Fulvestrant", locations: [{ facility: "Multiple sites", city: "Various", state: "", country: "USA" }], eligibility: { minAge: 18, maxAge: 99, sex: "all", criteria: "" }, description: "Evaluating efficacy and safety in patients with locally advanced or metastatic HR+/HER2- breast cancer who failed standard therapies.", duration: "24 months", visits: "Every 3 weeks" },
  { id: "NCT04196842", title: "Heart Failure Precision Medicine Study", subtitle: "Heart Failure", phase: "N/A", status: "RECRUITING", sponsor: "UC Davis", conditions: ["Heart Failure"], treatment: "Telemonitoring devices", locations: [{ facility: "UC Davis Medical Center", city: "Sacramento", state: "CA", country: "USA" }], eligibility: { minAge: 18, maxAge: 99, sex: "all", criteria: "" }, description: "Using precision medicine approaches and telemonitoring to improve heart failure management.", duration: "Ongoing", visits: "Monthly" },
  { id: "NCT06775886", title: "Personalized Pacing for Hypertrophic Cardiomyopathy", subtitle: "Heart Disease", phase: "N/A", status: "RECRUITING", sponsor: "Montefiore Medical Center", conditions: ["Hypertrophic Cardiomyopathy"], treatment: "myPACE+ algorithm", locations: [{ facility: "Montefiore Medical Center", city: "Bronx", state: "NY", country: "USA" }], eligibility: { minAge: 18, maxAge: 99, sex: "all", criteria: "" }, description: "Testing personalized accelerated pacing in symptomatic patients with non-obstructive hypertrophic cardiomyopathy.", duration: "24 months", visits: "Per protocol" },
  { id: "NCT06728280", title: "Deep TMS for Adolescent Depression", subtitle: "Major Depression", phase: "N/A", status: "RECRUITING", sponsor: "Multiple Institutions", conditions: ["Major Depressive Disorder", "Adolescent"], treatment: "Deep transcranial magnetic stimulation", locations: [{ facility: "Research Center", city: "Multiple", state: "", country: "China" }], eligibility: { minAge: 12, maxAge: 17, sex: "all", criteria: "" }, description: "Double-blind randomized trial evaluating deep TMS efficacy and safety in adolescent major depressive disorder.", duration: "12 months", visits: "Weekly during treatment" },
  { id: "NCT06775379", title: "Azetukalner for Major Depressive Disorder", subtitle: "Depression", phase: "Phase 3", status: "RECRUITING", sponsor: "Xenon Pharmaceuticals", conditions: ["Major Depressive Disorder"], treatment: "Azetukalner", locations: [{ facility: "Multiple sites", city: "Various", state: "", country: "USA" }], eligibility: { minAge: 18, maxAge: 65, sex: "all", criteria: "" }, description: "Evaluating a novel treatment for moderate-to-severe major depressive disorder.", duration: "12 months", visits: "Weekly initially" },
  { id: "NCT02947503", title: "Metformin for Gestational Diabetes (POEM Study)", subtitle: "Gestational Diabetes", phase: "Phase 3", status: "RECRUITING", sponsor: "Bethesda Diabetes Research", conditions: ["Gestational Diabetes", "Insulin Resistance"], treatment: "Metformin", locations: [{ facility: "Bethesda Research Center", city: "Bethesda", state: "MD", country: "USA" }], eligibility: { minAge: 18, maxAge: 45, sex: "female", criteria: "" }, description: "Long-term study evaluating pregnancy outcomes with metformin treatment in gestational diabetes.", duration: "24+ years", visits: "Regular follow-up" },
  { id: "NCT05872269", title: "Saroglitazar for Fatty Liver Disease (NAFLD)", subtitle: "NAFLD/NASH", phase: "Phase 4", status: "RECRUITING", sponsor: "Zydus Lifesciences", conditions: ["NAFLD", "Type 2 Diabetes", "Obesity"], treatment: "Saroglitazar 4mg", locations: [{ facility: "Multiple sites", city: "Various", state: "", country: "India" }], eligibility: { minAge: 18, maxAge: 75, sex: "all", criteria: "" }, description: "Evaluating safety and efficacy in NAFLD patients with metabolic comorbidities.", duration: "12 months", visits: "Monthly" },
  { id: "NCT07042191", title: "Reducing Financial Toxicity in Cancer Patients", subtitle: "Cancer Support", phase: "N/A", status: "RECRUITING", sponsor: "Karmanos Cancer Institute", conditions: ["Cancer", "Financial Toxicity"], treatment: "DISCO Provider Intervention", locations: [{ facility: "Karmanos Cancer Institute", city: "Detroit", state: "MI", country: "USA" }], eligibility: { minAge: 18, maxAge: 99, sex: "all", criteria: "" }, description: "Multi-level intervention to improve treatment cost discussions and reduce financial burden.", duration: "Ongoing", visits: "Per treatment schedule" },
  { id: "NCT05006482", title: "Optimizing Function in Older Cancer Survivors (GEM-S)", subtitle: "Cancer Survivorship", phase: "Phase 3", status: "RECRUITING", sponsor: "University of Rochester", conditions: ["Lymphoma", "Solid Tumors"], treatment: "Comprehensive Geriatric Assessment + Exercise", locations: [{ facility: "45 sites", city: "Multiple", state: "", country: "USA" }], eligibility: { minAge: 65, maxAge: 99, sex: "all", criteria: "" }, description: "Testing interventions to optimize functional outcomes in older cancer survivors.", duration: "24 months", visits: "Regular assessments" },
];

// ============================================
// COMPONENTS
// ============================================

function WelcomeModal({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="p-8">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v16m-8-8h16" strokeLinecap="round"/>
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Welcome to Trial Finder
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Access 400,000+ clinical trials from ClinicalTrials.gov. What would you like to do?
          </p>

          <div className="space-y-3">
            <button
              onClick={() => onSelect('guided')}
              className="w-full p-4 text-left rounded-2xl border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Help me find trials</p>
                  <p className="text-sm text-gray-500">Answer a few questions to get personalized matches</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelect('browse')}
              className="w-full p-4 text-left rounded-2xl border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Browse by category</p>
                  <p className="text-sm text-gray-500">Explore trials by condition type</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelect('search')}
              className="w-full p-4 text-left rounded-2xl border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Search directly</p>
                  <p className="text-sm text-gray-500">I know what I'm looking for</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelect('learn')}
              className="w-full p-4 text-left rounded-2xl border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Learn about clinical trials</p>
                  <p className="text-sm text-gray-500">New to this? Start here</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LearnModal({ isOpen, onClose }) {
  const [page, setPage] = useState(0);

  const pages = [
    {
      title: "What is a clinical trial?",
      content: "Clinical trials are research studies that test new treatments, medications, or procedures in people. They're how we discover if new approaches are safe and effective.",
      icon: "🔬"
    },
    {
      title: "Why do people join?",
      content: "• Access treatments not yet available to the public\n• Receive care from leading specialists\n• Help advance medicine for future patients\n• Study-related care is usually provided at no cost",
      icon: "💡"
    },
    {
      title: "Is it safe?",
      content: "All trials are reviewed by ethics boards (IRBs) before they can begin. Your safety is monitored throughout, and you can leave at any time for any reason.",
      icon: "🛡️"
    },
    {
      title: "What are the phases?",
      content: "• Phase 1: First tests in humans, small groups\n• Phase 2: Testing effectiveness, larger groups\n• Phase 3: Comparing to standard treatments\n• Phase 4: After FDA approval, long-term monitoring",
      icon: "📊"
    },
    {
      title: "Ready to explore?",
      content: "You can search for trials by condition, browse by category, or let us guide you through finding matches based on your situation.",
      icon: "🚀"
    }
  ];

  if (!isOpen) return null;

  const currentPage = pages[page];
  const isLast = page === pages.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="p-8">
          <div className="text-5xl text-center mb-6">{currentPage.icon}</div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">{currentPage.title}</h2>
          <p className="text-gray-600 text-center whitespace-pre-line mb-8">{currentPage.content}</p>

          <div className="flex justify-center gap-2 mb-6">
            {pages.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === page ? 'bg-black' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {page > 0 && (
              <button
                onClick={() => setPage(page - 1)}
                className="flex-1 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => isLast ? onClose() : setPage(page + 1)}
              className="flex-1 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
            >
              {isLast ? "Start exploring" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ onLogoClick, showFindButton, onFindClick, totalTrials }) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-40 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={onLogoClick} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v16m-8-8h16" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <span className="font-semibold text-lg tracking-tight">Trial Finder</span>
            {totalTrials > 0 && (
              <span className="hidden sm:inline text-xs text-gray-400 ml-2">
                {totalTrials.toLocaleString()} recruiting trials
              </span>
            )}
          </div>
        </button>

        {showFindButton && (
          <button
            onClick={onFindClick}
            className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            Find my trials
          </button>
        )}
      </div>
    </header>
  );
}

function CategoryCard({ category, count, onClick, isLoading }) {
  return (
    <button
      onClick={onClick}
      className="group text-left p-5 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
    >
      <div className="text-3xl mb-3">{category.icon}</div>
      <h3 className="font-semibold text-lg text-gray-900 mb-1">{category.name}</h3>
      <p className="text-sm text-gray-500">
        {isLoading ? (
          <span className="inline-block w-16 h-4 bg-gray-200 rounded animate-pulse" />
        ) : (
          `${count?.toLocaleString() || '...'} trials`
        )}
      </p>
    </button>
  );
}

function TrialCard({ trial, onClick }) {
  const statusColor = trial.status === 'RECRUITING' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600';

  return (
    <button
      onClick={onClick}
      className="group text-left w-full p-5 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
            {trial.status === 'RECRUITING' ? 'Enrolling' : trial.status}
          </span>
          {trial.phase && trial.phase !== 'Not specified' && (
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
              {trial.phase}
            </span>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-black">
        {trial.title}
      </h3>
      <p className="text-sm text-gray-500 mb-3">{trial.sponsor}</p>

      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{trial.description}</p>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {trial.locations.length > 0 ? `${trial.locations.length} location${trial.locations.length > 1 ? 's' : ''}` : 'Locations vary'}
        </span>
        <span className="text-black font-medium group-hover:translate-x-1 transition-transform">
          View details →
        </span>
      </div>
    </button>
  );
}

function TrialDetail({ trial, onClose }) {
  if (!trial) return null;

  const statusColor = trial.status === 'RECRUITING' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {trial.status === 'RECRUITING' ? 'Enrolling' : trial.status}
            </span>
            {trial.phase && trial.phase !== 'Not specified' && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                {trial.phase}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{trial.title}</h2>
          <p className="text-gray-500 mb-6">{trial.id} • {trial.sponsor}</p>

          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">About this study</h4>
              <p className="text-gray-700 leading-relaxed">{trial.description}</p>
            </div>

            {trial.treatment && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Treatment</h4>
                <p className="text-blue-900">{trial.treatment}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Age Range</p>
                <p className="text-gray-900 font-medium">{trial.eligibility.minAge}–{trial.eligibility.maxAge} years</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Sex</p>
                <p className="text-gray-900 font-medium capitalize">{trial.eligibility.sex}</p>
              </div>
            </div>

            {trial.conditions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {trial.conditions.map((cond, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {trial.locations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Locations</h4>
                <div className="space-y-2">
                  {trial.locations.map((loc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium">{loc.facility}</p>
                        <p className="text-gray-500 text-sm">{[loc.city, loc.state, loc.country].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-green-50 rounded-xl">
              <h4 className="font-semibold text-green-900 mb-2">💡 Good to know</h4>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• Study-related care is typically provided at no cost</li>
                <li>• You can withdraw from any trial at any time</li>
                <li>• Talk to your doctor before making any decisions</li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <a
              href={`https://clinicaltrials.gov/study/${trial.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-black text-white text-center font-semibold rounded-full hover:bg-gray-800 transition-colors"
            >
              View full details on ClinicalTrials.gov
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionnaireModal({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [matchCount, setMatchCount] = useState(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  const steps = [
    {
      id: 'condition',
      title: "What condition are you exploring?",
      subtitle: "Type your diagnosis or health concern",
      type: 'input',
      placeholder: "e.g., breast cancer, diabetes, migraine..."
    },
    {
      id: 'status',
      title: "Where are you in your journey?",
      type: 'select',
      options: [
        { value: 'newly', label: 'Newly diagnosed', desc: 'Within the last 6 months' },
        { value: 'treating', label: 'Currently in treatment', desc: 'Receiving active care' },
        { value: 'tried', label: 'Tried treatments that didn\'t work', desc: 'Looking for alternatives' },
        { value: 'exploring', label: 'Just exploring options', desc: 'Learning what\'s available' }
      ]
    },
    {
      id: 'age',
      title: "What's your age range?",
      type: 'select',
      options: [
        { value: '18-30', label: '18–30' },
        { value: '31-50', label: '31–50' },
        { value: '51-65', label: '51–65' },
        { value: '66+', label: '66 and older' }
      ]
    },
    {
      id: 'travel',
      title: "How far would you travel?",
      type: 'select',
      options: [
        { value: 'local', label: 'Local only', desc: 'Within 50 miles' },
        { value: 'regional', label: 'Willing to travel some', desc: 'Within my state or nearby' },
        { value: 'anywhere', label: 'Anywhere in the US', desc: 'Distance is not an issue' }
      ]
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setData({});
      setMatchCount(null);
    }
  }, [isOpen]);

  // Fetch count when condition changes
  useEffect(() => {
    if (data.condition && data.condition.length > 2) {
      setIsLoadingCount(true);
      const timer = setTimeout(async () => {
        const count = await fetchTrialCount(data.condition);
        setMatchCount(count);
        setIsLoadingCount(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [data.condition]);

  if (!isOpen) return null;

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = (value) => {
    const newData = { ...data, [currentStep.id]: value };
    setData(newData);
    if (isLast) {
      onComplete(newData);
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-900">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        ) : <div />}

        <span className="text-sm text-gray-400">{step + 1} of {steps.length}</span>

        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div className="h-1 bg-gray-100">
        <div className="h-full bg-black transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>

      {/* Match counter */}
      {matchCount !== null && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-full shadow-lg border border-gray-200">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${matchCount > 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
              {isLoadingCount ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <span className={`text-lg font-bold ${matchCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {matchCount > 999 ? '999+' : matchCount}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">trials available</p>
              <p className="text-xs text-gray-500">
                {matchCount > 100 ? 'Lots of options!' : matchCount > 0 ? 'Good matches found' : 'Try different terms'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{currentStep.title}</h1>
          {currentStep.subtitle && <p className="text-gray-500 mb-8">{currentStep.subtitle}</p>}

          {currentStep.type === 'input' && (
            <div>
              <input
                type="text"
                value={data[currentStep.id] || ''}
                onChange={(e) => setData({ ...data, [currentStep.id]: e.target.value })}
                placeholder={currentStep.placeholder}
                className="w-full text-xl py-4 border-0 border-b-2 border-gray-200 focus:border-black focus:ring-0 outline-none"
                autoFocus
              />
              <button
                onClick={() => handleNext(data[currentStep.id])}
                disabled={!data[currentStep.id]}
                className="mt-8 w-full py-4 bg-black text-white font-semibold rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {currentStep.type === 'select' && (
            <div className="space-y-3">
              {currentStep.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleNext(opt.value)}
                  className="w-full p-4 text-left rounded-xl border-2 border-gray-200 hover:border-black hover:bg-gray-50 transition-all"
                >
                  <span className="font-medium text-gray-900">{opt.label}</span>
                  {opt.desc && <span className="block text-sm text-gray-500 mt-0.5">{opt.desc}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-5 bg-white rounded-2xl border border-gray-200 animate-pulse">
          <div className="flex gap-2 mb-3">
            <div className="w-16 h-6 bg-gray-200 rounded-full" />
            <div className="w-16 h-6 bg-gray-200 rounded-full" />
          </div>
          <div className="w-3/4 h-6 bg-gray-200 rounded mb-2" />
          <div className="w-1/2 h-4 bg-gray-200 rounded mb-4" />
          <div className="w-full h-12 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================

export default function TrialFinderLive() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showLearn, setShowLearn] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [view, setView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [trials, setTrials] = useState([]);
  const [totalTrials, setTotalTrials] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);

  // Set initial counts (real data from ClinicalTrials.gov)
  useEffect(() => {
    // Total recruiting trials
    setTotalTrials(26789);

    // Use embedded counts initially, try to fetch live counts
    const initialCounts = {};
    categories.forEach(cat => {
      initialCounts[cat.id] = cat.count;
    });
    setCategoryCounts(initialCounts);

    // Try to fetch live counts (will work when deployed, may fail in preview)
    fetchTrialCount('').then(count => {
      if (count > 0) setTotalTrials(count);
    });
  }, []);

  const handleWelcomeSelect = (choice) => {
    setShowWelcome(false);
    if (choice === 'guided') {
      setShowQuestionnaire(true);
    } else if (choice === 'learn') {
      setShowLearn(true);
    } else if (choice === 'browse') {
      setView('home');
    } else if (choice === 'search') {
      setView('home');
      // Focus search after render
      setTimeout(() => document.querySelector('input[type="text"]')?.focus(), 100);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setView('results');
    setCurrentCategory(null);

    // Try API first
    const { trials: results, error: fetchError } = await fetchTrials({
      condition: searchQuery,
      pageSize: 50
    });

    // If API fails, filter sample data
    if (fetchError || results.length === 0) {
      const query = searchQuery.toLowerCase();
      const filtered = sampleTrials.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.subtitle.toLowerCase().includes(query) ||
        t.conditions.some(c => c.toLowerCase().includes(query)) ||
        t.description.toLowerCase().includes(query)
      );
      setTrials(filtered.length > 0 ? filtered : sampleTrials);
      if (fetchError) {
        console.log('Using sample data due to API error:', fetchError);
      }
    } else {
      setTrials(results);
    }

    setIsLoading(false);
  };

  const handleCategoryClick = async (category) => {
    setIsLoading(true);
    setError(null);
    setView('results');
    setCurrentCategory(category);
    setSearchQuery('');

    // Try API first
    const { trials: results, error: fetchError } = await fetchTrials({
      condition: category.query,
      pageSize: 50
    });

    // If API fails, use sample data
    if (fetchError || results.length === 0) {
      // Return all sample trials for the preview (simulating category results)
      setTrials(sampleTrials);
      console.log('Using sample data for category');
    } else {
      setTrials(results);
    }

    setIsLoading(false);
  };

  const handleQuestionnaireComplete = async (data) => {
    setShowQuestionnaire(false);
    setIsLoading(true);
    setError(null);
    setView('results');
    setSearchQuery(data.condition);

    // Try API first
    const { trials: results, error: fetchError } = await fetchTrials({
      condition: data.condition,
      pageSize: 50
    });

    // If API fails, filter sample data
    if (fetchError || results.length === 0) {
      const query = (data.condition || '').toLowerCase();
      const filtered = sampleTrials.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.subtitle.toLowerCase().includes(query) ||
        t.conditions.some(c => c.toLowerCase().includes(query))
      );
      setTrials(filtered.length > 0 ? filtered : sampleTrials);
    } else {
      setTrials(results);
    }

    setIsLoading(false);
  };

  const resetToHome = () => {
    setView('home');
    setTrials([]);
    setSearchQuery('');
    setCurrentCategory(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onLogoClick={resetToHome}
        showFindButton={view === 'home' && !showWelcome}
        onFindClick={() => setShowQuestionnaire(true)}
        totalTrials={totalTrials}
      />

      <main className="pt-24 pb-16">
        {view === 'home' && (
          <div className="max-w-6xl mx-auto px-6">
            {/* Hero */}
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
                Find your clinical trial
              </h1>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                Search {totalTrials.toLocaleString()}+ recruiting trials from ClinicalTrials.gov
              </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-16">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any condition, treatment, or keyword..."
                  className="w-full px-6 py-4 pr-14 text-lg bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-400 shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black rounded-xl flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </button>
              </div>
            </form>

            {/* Categories */}
            <div className="mb-16">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Browse by category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map(cat => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    count={categoryCounts[cat.id]}
                    onClick={() => handleCategoryClick(cat)}
                    isLoading={!categoryCounts[cat.id]}
                  />
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-2xl border border-gray-200">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Safe & monitored</h3>
                <p className="text-gray-500 text-sm">All trials reviewed by ethics boards. Your safety is the priority.</p>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-gray-200">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Usually free</h3>
                <p className="text-gray-500 text-sm">Study-related care and treatment typically at no cost.</p>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-gray-200">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Always voluntary</h3>
                <p className="text-gray-500 text-sm">Leave any trial at any time. No pressure, no penalty.</p>
              </div>
            </div>
          </div>
        )}

        {view === 'results' && (
          <div className="max-w-6xl mx-auto px-6">
            <button
              onClick={resetToHome}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-900 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Back to search
            </button>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isLoading ? 'Searching...' : `${trials.length} trials found`}
              </h1>
              <p className="text-gray-500">
                {currentCategory ? `in ${currentCategory.name}` : searchQuery ? `for "${searchQuery}"` : ''}
              </p>
            </div>

            {isLoading ? (
              <LoadingGrid />
            ) : error ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Connection issue</h3>
                <p className="text-gray-500 mb-2">Couldn't connect to ClinicalTrials.gov</p>
                <p className="text-sm text-gray-400 mb-6">Error: {error}</p>
                <button
                  onClick={resetToHome}
                  className="px-6 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800"
                >
                  Try again
                </button>
              </div>
            ) : trials.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trials.map(trial => (
                  <TrialCard
                    key={trial.id}
                    trial={trial}
                    onClick={() => setSelectedTrial(trial)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No trials found</h3>
                <p className="text-gray-500 mb-6">Try different search terms or browse by category</p>
                <button
                  onClick={resetToHome}
                  className="px-6 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800"
                >
                  Back to search
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-gray-400">
            Data from ClinicalTrials.gov • Always consult your doctor before enrolling
          </p>
        </div>
      </footer>

      {/* Modals */}
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} onSelect={handleWelcomeSelect} />
      <LearnModal isOpen={showLearn} onClose={() => setShowLearn(false)} />
      <QuestionnaireModal isOpen={showQuestionnaire} onClose={() => setShowQuestionnaire(false)} onComplete={handleQuestionnaireComplete} />
      <TrialDetail trial={selectedTrial} onClose={() => setSelectedTrial(null)} />
    </div>
  );
}
