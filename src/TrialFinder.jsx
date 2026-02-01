import React, { useState } from 'react';

// Sample trial data with categories
const sampleTrials = [
  {
    nctId: "NCT05432109",
    title: "New Immunotherapy Combination for Lung Cancer",
    phase: "Phase 3",
    status: "Recruiting",
    sponsor: "National Cancer Institute",
    category: "cancer",
    condition: "Lung Cancer",
    intervention: "Pembrolizumab + Experimental Drug XYZ-123",
    locations: [
      { facility: "Memorial Sloan Kettering", city: "New York", state: "NY" },
      { facility: "MD Anderson Cancer Center", city: "Houston", state: "TX" },
      { facility: "Mayo Clinic", city: "Rochester", state: "MN" }
    ],
    eligibility: { minAge: 18, maxAge: 85, sex: "All" },
    summary: "Testing a new combination treatment that helps your immune system fight lung cancer. For patients who haven't tried immunotherapy before.",
    featured: true
  },
  {
    nctId: "NCT05987654",
    title: "Weekly Injection for Better Blood Sugar Control",
    phase: "Phase 2",
    status: "Recruiting",
    sponsor: "Novo Nordisk",
    category: "diabetes",
    condition: "Type 2 Diabetes",
    intervention: "NN-Glucose-2024 (weekly injection)",
    locations: [
      { facility: "Cleveland Clinic", city: "Cleveland", state: "OH" },
      { facility: "Johns Hopkins Hospital", city: "Baltimore", state: "MD" }
    ],
    eligibility: { minAge: 30, maxAge: 70, sex: "All" },
    summary: "Testing a once-weekly shot that may control blood sugar better than current options. For people already on metformin.",
    featured: true
  },
  {
    nctId: "NCT06123456",
    title: "Gene Therapy to Restore Vision",
    phase: "Phase 1/2",
    status: "Recruiting",
    sponsor: "Spark Therapeutics",
    category: "eye",
    condition: "Inherited Vision Loss",
    intervention: "AAV-RPE65 Gene Therapy",
    locations: [
      { facility: "Bascom Palmer Eye Institute", city: "Miami", state: "FL" },
      { facility: "Wilmer Eye Institute", city: "Baltimore", state: "MD" }
    ],
    eligibility: { minAge: 8, maxAge: 65, sex: "All" },
    summary: "A one-time gene treatment to fix a genetic condition causing vision loss. Requires genetic testing first.",
    featured: false
  },  {
    nctId: "NCT07234567",
    title: "Mindfulness Program for Anxiety",
    phase: "Phase 3",
    status: "Recruiting",
    sponsor: "NIMH",
    category: "mental_health",
    condition: "Anxiety",
    intervention: "8-week Mindfulness Program",
    locations: [
      { facility: "UCLA Health", city: "Los Angeles", state: "CA" },
      { facility: "Mass General Hospital", city: "Boston", state: "MA" }
    ],
    eligibility: { minAge: 18, maxAge: 65, sex: "All" },
    summary: "Testing whether mindfulness and meditation can reduce anxiety as well as medication. Weekly group sessions for 8 weeks.",
    featured: true
  },
  {
    nctId: "NCT08345678",
    title: "Monthly Shot to Prevent Migraines",
    phase: "Phase 3",
    status: "Recruiting",
    sponsor: "Eli Lilly",
    category: "neurological",
    condition: "Chronic Migraines",
    intervention: "Monthly preventive injection",
    locations: [
      { facility: "Cleveland Clinic", city: "Cleveland", state: "OH" },
      { facility: "Mayo Clinic", city: "Phoenix", state: "AZ" }
    ],
    eligibility: { minAge: 18, maxAge: 70, sex: "All" },
    summary: "Testing a monthly shot to prevent migraines before they start. For people with 8+ migraine days per month.",
    featured: false
  },
  {
    nctId: "NCT09456789",
    title: "New Treatment for Heart Failure",
    phase: "Phase 3",
    status: "Recruiting",
    sponsor: "AstraZeneca",
    category: "heart",
    condition: "Heart Failure",
    intervention: "Daily oral medication",
    locations: [
      { facility: "Cleveland Clinic", city: "Cleveland", state: "OH" },
      { facility: "Duke University Hospital", city: "Durham", state: "NC" }
    ],
    eligibility: { minAge: 40, maxAge: 80, sex: "All" },
    summary: "Testing a new daily pill that may improve heart function and reduce hospitalizations for heart failure patients.",
    featured: true
  },
  {
    nctId: "NCT10567890",
    title: "Immunotherapy for Breast Cancer",
    phase: "Phase 2",
    status: "Recruiting",
    sponsor: "Genentech",
    category: "cancer",
    condition: "Breast Cancer",
    intervention: "Combination immunotherapy",
    locations: [
      { facility: "Dana-Farber Cancer Institute", city: "Boston", state: "MA" },
      { facility: "UCSF Medical Center", city: "San Francisco", state: "CA" }
    ],
    eligibility: { minAge: 18, maxAge: 75, sex: "Female" },
    summary: "Testing a new immunotherapy combination for triple-negative breast cancer. May be an option after other treatments.",
    featured: false
  }
];

// Categories for browsing
const categories = [
  { id: 'cancer', label: 'Cancer', icon: '🎗️', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  { id: 'heart', label: 'Heart & Blood', icon: '❤️', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'diabetes', label: 'Diabetes', icon: '💉', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'mental_health', label: 'Mental Health', icon: '🧠', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'neurological', label: 'Brain & Nerves', icon: '⚡', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'eye', label: 'Eyes & Vision', icon: '👁️', color: 'bg-green-100 text-green-700 border-green-200' }
];

// Dropdown options
const conditionOptions = {
  cancer: ['Any Cancer', 'Lung Cancer', 'Breast Cancer', 'Prostate Cancer', 'Colon Cancer', 'Skin Cancer', 'Leukemia', 'Lymphoma'],
  heart: ['Any Heart Condition', 'Heart Failure', 'High Blood Pressure', 'Arrhythmia', 'Coronary Artery Disease'],
  diabetes: ['Any Diabetes', 'Type 1 Diabetes', 'Type 2 Diabetes', 'Pre-diabetes'],
  mental_health: ['Any Mental Health', 'Anxiety', 'Depression', 'PTSD', 'Bipolar Disorder', 'OCD'],
  neurological: ['Any Neurological', 'Migraines', 'Epilepsy', 'Parkinsons', 'Multiple Sclerosis', 'Alzheimers'],
  eye: ['Any Eye Condition', 'Inherited Vision Loss', 'Macular Degeneration', 'Glaucoma', 'Diabetic Eye Disease']
};

const phases = [
  { value: '', label: 'Any Phase' },
  { value: 'Phase 1', label: 'Phase 1 - Early testing' },
  { value: 'Phase 2', label: 'Phase 2 - Testing effectiveness' },
  { value: 'Phase 3', label: 'Phase 3 - Comparing to standard care' },
  { value: 'Phase 4', label: 'Phase 4 - After FDA approval' }
];

const ageRanges = [
  { value: '', label: 'Any Age' },
  { value: '0-17', label: 'Child (under 18)' },
  { value: '18-40', label: 'Young Adult (18-40)' },
  { value: '41-65', label: 'Adult (41-65)' },
  { value: '65+', label: 'Senior (65+)' }
];

// Status colors
const statusColors = {
  "Recruiting": "bg-green-100 text-green-700",
  "Active": "bg-blue-100 text-blue-700",
  "Completed": "bg-gray-100 text-gray-600"
};

const phaseColors = {
  "Phase 1": "bg-purple-100 text-purple-700",
  "Phase 1/2": "bg-purple-100 text-purple-700",
  "Phase 2": "bg-indigo-100 text-indigo-700",
  "Phase 3": "bg-blue-100 text-blue-700",
  "Phase 4": "bg-teal-100 text-teal-700"
};

// Trial Card Component
function TrialCard({ trial, onSelect }) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden cursor-pointer"
      onClick={() => onSelect(trial)}
    >
      <div className="p-5">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[trial.status]}`}>
            {trial.status}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${phaseColors[trial.phase]}`}>
            {trial.phase}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{trial.title}</h3>
        <p className="text-sm text-gray-500 mb-3">{trial.condition} • {trial.sponsor}</p>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{trial.summary}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {trial.locations.length} location{trial.locations.length > 1 ? 's' : ''}
          </div>
          <span className="text-blue-600 text-sm font-medium">View details →</span>
        </div>
      </div>
    </div>
  );
}

// Trial Detail Modal
function TrialDetail({ trial, onClose }) {
  if (!trial) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[trial.status]}`}>
              {trial.status}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${phaseColors[trial.phase]}`}>
              {trial.phase}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{trial.title}</h2>
          <p className="text-gray-500 mb-4">{trial.nctId} • Sponsored by {trial.sponsor}</p>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What is this study about?</h3>
            <p className="text-blue-800">{trial.summary}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Treatment
              </h3>
              <p className="text-gray-700">{trial.intervention}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Who can join
              </h3>
              <p className="text-gray-700">
                Ages {trial.eligibility.minAge}-{trial.eligibility.maxAge}<br />
                {trial.eligibility.sex === 'All' ? 'Men and women' : trial.eligibility.sex}
              </p>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Study locations
            </h3>
            <div className="space-y-2">
              {trial.locations.map((loc, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-gray-900">{loc.facility}</p>
                  <p className="text-sm text-gray-600">{loc.city}, {loc.state}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">💡 Good to know</h3>
            <ul className="text-green-800 text-sm space-y-1">
              <li>• Study-related care and treatment are typically free</li>
              <li>• You can leave the study at any time</li>
              <li>• Talk to your doctor before enrolling</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <a
              href={`https://clinicaltrials.gov/study/${trial.nctId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-blue-600 text-white text-center font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              View full details on ClinicalTrials.gov
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
  const [answers, setAnswers] = useState({
    category: '',
    concern: '',
    age: '',
    priority: ''
  });

  const questions = [
    {
      question: "What health area are you exploring?",
      key: 'category',
      options: categories.map(c => ({ value: c.id, label: `${c.icon} ${c.label}` }))
    },
    {
      question: "What's your main goal?",
      key: 'concern',
      options: [
        { value: 'new_treatment', label: '🔬 Access newer treatments' },
        { value: 'not_working', label: "😔 Current treatment isn't working" },
        { value: 'fewer_side', label: '💊 Fewer side effects' },
        { value: 'exploring', label: '🔍 Just exploring options' }
      ]
    },
    {
      question: "What's your age range?",
      key: 'age',
      options: ageRanges.filter(a => a.value).map(a => ({ value: a.value, label: a.label }))
    },
    {
      question: "What matters most to you?",
      key: 'priority',
      options: [
        { value: 'location', label: '📍 Close to home' },
        { value: 'reputable', label: '🏥 Well-known research center' },
        { value: 'phase3', label: '✅ More established treatments (Phase 3)' },
        { value: 'any', label: '🤷 No strong preference' }
      ]
    }
  ];

  if (!isOpen) return null;

  const currentQ = questions[step];
  const isLastStep = step === questions.length - 1;

  const handleSelect = (value) => {
    setAnswers(prev => ({ ...prev, [currentQ.key]: value }));
    if (isLastStep) {
      onSearch({ ...answers, [currentQ.key]: value });
      onClose();
      setStep(0);
      setAnswers({ category: '', concern: '', age: '', priority: '' });
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Finding the right trial</h3>
                <p className="text-white/80 text-sm">Question {step + 1} of {questions.length}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1 bg-white/20 rounded-full">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-4">{currentQ.question}</h4>

          <div className="space-y-2">
            {currentQ.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border-2 border-transparent rounded-xl transition-all"
              >
                <span className="font-medium text-gray-900">{opt.label}</span>
              </button>
            ))}
          </div>

          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Go back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function TrialFinder() {
  const [viewMode, setViewMode] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedAge, setSelectedAge] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);

  const featuredTrials = sampleTrials.filter(t => t.featured);

  const handleSearch = (filters = {}) => {
    let filtered = [...sampleTrials];

    const category = filters.category || selectedCategory;
    const condition = filters.condition || selectedCondition;
    const phase = filters.phase || selectedPhase;
    const age = filters.age || selectedAge;
    const query = filters.query || searchQuery;

    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }

    if (condition && !condition.includes('Any')) {
      filtered = filtered.filter(t =>
        t.condition.toLowerCase().includes(condition.toLowerCase())
      );
    }

    if (phase) {
      filtered = filtered.filter(t => t.phase === phase);
    }

    if (age) {
      const [min, max] = age.includes('+')
        ? [parseInt(age), 120]
        : age.split('-').map(Number);
      filtered = filtered.filter(t =>
        t.eligibility.minAge <= max && t.eligibility.maxAge >= min
      );
    }

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.condition.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q)
      );
    }

    setResults(filtered);
    setViewMode('results');
  };

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    setSelectedCondition('');
    setViewMode('category');
  };

  const handleAssistantSearch = (answers) => {
    setSelectedCategory(answers.category);
    setSelectedAge(answers.age);
    if (answers.priority === 'phase3') {
      setSelectedPhase('Phase 3');
    }
    handleSearch({
      category: answers.category,
      age: answers.age,
      phase: answers.priority === 'phase3' ? 'Phase 3' : ''
    });
  };

  const resetSearch = () => {
    setSelectedCategory('');
    setSelectedCondition('');
    setSelectedPhase('');
    setSelectedAge('');
    setSearchQuery('');
    setResults([]);
    setViewMode('home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={resetSearch}
            >
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Trial Finder</h1>
                <p className="text-xs text-gray-500">Find clinical trials for you</p>
              </div>
            </div>

            <button
              onClick={() => setShowAssistant(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-medium hover:bg-purple-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden sm:inline">Help me find trials</span>
              <span className="sm:hidden">Help</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Home View */}
        {viewMode === 'home' && (
          <>
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Search for trials</h2>

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition or keyword</label>
                  <input
                    type="text"
                    placeholder="e.g., lung cancer, diabetes, migraine..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="w-full lg:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                  <select
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    {phases.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full lg:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <select
                    value={selectedAge}
                    onChange={(e) => setSelectedAge(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    {ageRanges.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => handleSearch()}
                    className="w-full lg:w-auto px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Browse by Category */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by category</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`p-4 rounded-xl border-2 ${cat.color} hover:scale-105 transition-all text-center`}
                  >
                    <span className="text-2xl mb-1 block">{cat.icon}</span>
                    <span className="font-medium text-sm">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Trials */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured trials</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredTrials.map(trial => (
                  <TrialCard
                    key={trial.nctId}
                    trial={trial}
                    onSelect={setSelectedTrial}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Category View */}
        {viewMode === 'category' && (
          <>
            <button
              onClick={resetSearch}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to all categories
            </button>

            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {categories.find(c => c.id === selectedCategory)?.icon}{' '}
                {categories.find(c => c.id === selectedCategory)?.label} Trials
              </h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specific condition</label>
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    {(conditionOptions[selectedCategory] || []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                  <select
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    {phases.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <select
                    value={selectedAge}
                    onChange={(e) => setSelectedAge(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    {ageRanges.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => handleSearch()}
                className="mt-4 px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                Search trials
              </button>
            </div>
          </>
        )}

        {/* Results View */}
        {viewMode === 'results' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <button
                  onClick={resetSearch}
                  className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  New search
                </button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {results.length} {results.length === 1 ? 'trial' : 'trials'} found
                </h2>
              </div>
            </div>

            {results.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map(trial => (
                  <TrialCard
                    key={trial.nctId}
                    trial={trial}
                    onSelect={setSelectedTrial}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matching trials found</h3>
                <p className="text-gray-600 mb-4">Try broadening your search or browse by category</p>
                <button
                  onClick={resetSearch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Start over
                </button>
              </div>
            )}
          </>
        )}

        {/* Info Cards */}
        {viewMode === 'home' && (
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Safe & monitored</h3>
              <p className="text-gray-600 text-sm">All trials are reviewed by ethics boards. Your safety is the top priority.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Usually free</h3>
              <p className="text-gray-600 text-sm">Study-related care, tests, and treatment are typically provided at no cost to you.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Always voluntary</h3>
              <p className="text-gray-600 text-sm">You can leave any trial at any time, for any reason. No pressure, no penalty.</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-center text-gray-500 text-sm">
            Data sourced from <a href="https://clinicaltrials.gov" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ClinicalTrials.gov</a>.
            Always consult your doctor before joining any clinical trial.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <TrialDetail trial={selectedTrial} onClose={() => setSelectedTrial(null)} />
      <GuidedAssistant
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
        onSearch={handleAssistantSearch}
      />
    </div>
  );
}
