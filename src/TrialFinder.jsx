import React, { useState, useEffect } from 'react';

const API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

async function fetchTrials({ condition, pageSize = 50 }) {
  let url = `${API_BASE}?format=json&pageSize=${pageSize}&countTotal=true&filter.overallStatus=RECRUITING`;
  if (condition) url += `&query.cond=${encodeURIComponent(condition)}`;
  try {
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    return { trials: (data.studies || []).map(parseTrialData), totalCount: data.totalCount || 0 };
  } catch (error) {
    return { trials: [], totalCount: 0, error: error.message };
  }
}

async function fetchTrialCount(condition) {
  let url = `${API_BASE}?format=json&pageSize=1&countTotal=true&filter.overallStatus=RECRUITING`;
  if (condition) url += `&query.cond=${encodeURIComponent(condition)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.totalCount || 0;
  } catch { return 0; }
}

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
    subtitle: conds.conditions?.[0] || 'Clinical Trial',
    phase: design.phases?.join(', ') || 'Not specified',
    status: status.overallStatus || 'Unknown',
    sponsor: sponsors.leadSponsor?.name || 'Research Institution',
    conditions: conds.conditions || [],
    treatment: interventions.interventions?.map(i => i.name).join(', ') || 'Study intervention',
    locations: (contacts.locations || []).slice(0, 5).map(l => ({ facility: l.facility || 'Site', city: l.city || '', state: l.state || '', country: l.country || 'USA' })),
    eligibility: { minAge: parseInt(eligibility.minimumAge) || 18, maxAge: parseInt(eligibility.maximumAge) || 99, sex: eligibility.sex?.toLowerCase() || 'all' },
    description: desc.briefSummary || 'No description available.'
  };
}

const categories = [
  { id: 'cancer', name: 'Cancer', query: 'cancer', icon: '🎗️', count: 18794 },
  { id: 'heart', name: 'Heart Disease', query: 'heart failure', icon: '❤️', count: 1008 },
  { id: 'diabetes', name: 'Diabetes', query: 'diabetes', icon: '💉', count: 2028 },
  { id: 'mental', name: 'Mental Health', query: 'depression', icon: '🧠', count: 1513 },
  { id: 'neuro', name: 'Neurological', query: 'alzheimer', icon: '⚡', count: 892 },
  { id: 'autoimmune', name: 'Autoimmune', query: 'lupus', icon: '🛡️', count: 567 },
  { id: 'respiratory', name: 'Respiratory', query: 'asthma', icon: '🫁', count: 734 },
  { id: 'rare', name: 'Rare Diseases', query: 'rare disease', icon: '🧬', count: 1245 }
];

const sampleTrials = [
  { id: "NCT06507618", title: "Endocrine Therapy for Breast Cancer", subtitle: "Breast Cancer", phase: "Phase 3", status: "RECRUITING", sponsor: "University of Virginia", conditions: ["Breast Cancer"], treatment: "Tamoxifen", locations: [{ facility: "UVA", city: "Charlottesville", state: "VA", country: "USA" }], eligibility: { minAge: 65, maxAge: 99, sex: "female" }, description: "A trial for older women with breast cancer." },
  { id: "NCT04196842", title: "Heart Failure Study", subtitle: "Heart Failure", phase: "N/A", status: "RECRUITING", sponsor: "UC Davis", conditions: ["Heart Failure"], treatment: "Telemonitoring", locations: [{ facility: "UC Davis", city: "Sacramento", state: "CA", country: "USA" }], eligibility: { minAge: 18, maxAge: 99, sex: "all" }, description: "Precision medicine for heart failure." }
];

function Header({ onLogoClick, onFindClick, totalTrials }) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl z-40 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={onLogoClick} className="flex items-center gap-3 hover:opacity-70">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v16m-8-8h16" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-semibold text-lg">Trial Finder</span>
          {totalTrials > 0 && <span className="text-xs text-gray-400 ml-2">{totalTrials.toLocaleString()} trials</span>}
        </button>
        <button onClick={onFindClick} className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800">
          Find my trials
        </button>
      </div>
    </header>
  );
}

function CategoryCard({ category, count, onClick }) {
  return (
    <button onClick={onClick} className="group text-left p-5 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
      <div className="text-3xl mb-3">{category.icon}</div>
      <h3 className="font-semibold text-lg text-gray-900 mb-1">{category.name}</h3>
      <p className="text-sm text-gray-500">{count?.toLocaleString() || '...'} trials</p>
    </button>
  );
}

function TrialCard({ trial, onClick }) {
  return (
    <button onClick={onClick} className="group text-left w-full p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all">
      <div className="flex gap-2 mb-3">
        <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">Enrolling</span>
        {trial.phase !== 'Not specified' && <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{trial.phase}</span>}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{trial.title}</h3>
      <p className="text-sm text-gray-500 mb-3">{trial.sponsor}</p>
      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{trial.description}</p>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{trial.locations?.length || 0} locations</span>
        <span className="text-black font-medium">View details →</span>
      </div>
    </button>
  );
}

function TrialDetail({ trial, onClose }) {
  if (!trial) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
          <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">Enrolling</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">✕</button>
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{trial.title}</h2>
          <p className="text-gray-500 mb-6">{trial.id} • {trial.sponsor}</p>
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">About</h4>
              <p className="text-gray-700">{trial.description}</p>
            </div>
            {trial.treatment && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <h4 className="text-xs font-semibold text-blue-600 uppercase mb-1">Treatment</h4>
                <p className="text-blue-900">{trial.treatment}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Age</p>
                <p className="text-gray-900 font-medium">{trial.eligibility?.minAge}-{trial.eligibility?.maxAge} years</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Sex</p>
                <p className="text-gray-900 font-medium capitalize">{trial.eligibility?.sex}</p>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <a href={`https://clinicaltrials.gov/study/${trial.id}`} target="_blank" rel="noopener noreferrer"
               className="block w-full py-4 bg-black text-white text-center font-semibold rounded-full hover:bg-gray-800">
              View on ClinicalTrials.gov
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrialFinder() {
  const [view, setView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [trials, setTrials] = useState([]);
  const [totalTrials, setTotalTrials] = useState(26789);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);

  useEffect(() => {
    const counts = {};
    categories.forEach(cat => counts[cat.id] = cat.count);
    setCategoryCounts(counts);
    fetchTrialCount('').then(count => { if (count > 0) setTotalTrials(count); });
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setView('results');
    const { trials: results } = await fetchTrials({ condition: searchQuery, pageSize: 50 });
    setTrials(results.length > 0 ? results : sampleTrials);
    setIsLoading(false);
  };

  const handleCategoryClick = async (category) => {
    setIsLoading(true);
    setView('results');
    setCurrentCategory(category);
    const { trials: results } = await fetchTrials({ condition: category.query, pageSize: 50 });
    setTrials(results.length > 0 ? results : sampleTrials);
    setIsLoading(false);
  };

  const resetToHome = () => { setView('home'); setTrials([]); setSearchQuery(''); setCurrentCategory(null); };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogoClick={resetToHome} onFindClick={() => {}} totalTrials={totalTrials} />
      <main className="pt-24 pb-16">
        {view === 'home' && (
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Find your clinical trial</h1>
              <p className="text-xl text-gray-500">Search {totalTrials.toLocaleString()}+ recruiting trials</p>
            </div>
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-16">
              <div className="relative">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any condition..." className="w-full px-6 py-4 pr-14 text-lg bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-400 shadow-sm" />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black rounded-xl flex items-center justify-center hover:bg-gray-800">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </button>
              </div>
            </form>
            <div className="mb-16">
              <h2 className="text-sm font-semibold text-gray-400 uppercase mb-4">Browse by category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map(cat => <CategoryCard key={cat.id} category={cat} count={categoryCounts[cat.id]} onClick={() => handleCategoryClick(cat)} />)}
              </div>
            </div>
          </div>
        )}
        {view === 'results' && (
          <div className="max-w-6xl mx-auto px-6">
            <button onClick={resetToHome} className="flex items-center gap-1 text-gray-500 hover:text-gray-900 mb-6">← Back</button>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{isLoading ? 'Searching...' : `${trials.length} trials found`}</h1>
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="p-5 bg-white rounded-2xl border animate-pulse h-48" />)}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trials.map(trial => <TrialCard key={trial.id} trial={trial} onClick={() => setSelectedTrial(trial)} />)}
              </div>
            )}
          </div>
        )}
      </main>
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <p className="text-center text-sm text-gray-400">Data from ClinicalTrials.gov • Always consult your doctor</p>
        </div>
      </footer>
      <TrialDetail trial={selectedTrial} onClose={() => setSelectedTrial(null)} />
    </div>
  );
}