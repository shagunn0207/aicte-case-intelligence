/**
 * Formatting and helper utilities for AICTE Case Intelligence
 */

export const BUREAU_DEFINITIONS = {
  PGRC: {
    code: 'PGRC',
    name: 'Public Grievance Redressal Cell',
    shortName: 'Grievance Cell',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    dotColor: 'bg-rose-500'
  },
  RB: {
    code: 'RB',
    name: 'Regulation Bureau',
    shortName: 'Regulation Bureau',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    dotColor: 'bg-blue-500'
  },
  AB: {
    code: 'AB',
    name: 'Approval Bureau',
    shortName: 'Approval Bureau',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    dotColor: 'bg-indigo-500'
  },
  VIG: {
    code: 'VIG',
    name: 'Vigilance Cell',
    shortName: 'Vigilance Cell',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    dotColor: 'bg-purple-500'
  },
  SDC: {
    code: 'SDC',
    name: 'Skill Development Cell',
    shortName: 'Skill Dev',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    dotColor: 'bg-teal-500'
  }
};

export const STATUS_DEFINITIONS = {
  'Under Review': {
    label: 'Under Review',
    color: 'bg-amber-50 text-amber-800 border-amber-200',
    dotColor: 'bg-amber-500'
  },
  'In Progress': {
    label: 'In Progress',
    color: 'bg-sky-50 text-sky-800 border-sky-200',
    dotColor: 'bg-sky-500'
  },
  'Coordination Required': {
    label: 'Coordination Required',
    color: 'bg-rose-50 text-rose-800 border-rose-200',
    dotColor: 'bg-rose-500'
  },
  'Continue Independently': {
    label: 'Continue Independently',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    dotColor: 'bg-slate-500'
  },
  'Not Related': {
    label: 'Not Related',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotColor: 'bg-emerald-500'
  },
  'Further Review Required': {
    label: 'Further Review Required',
    color: 'bg-orange-50 text-orange-800 border-orange-200',
    dotColor: 'bg-orange-500'
  },
  'Pending Review': {
    label: 'Pending Review',
    color: 'bg-amber-50 text-amber-800 border-amber-300',
    dotColor: 'bg-amber-500'
  },
  'Active Coordination': {
    label: 'Active Coordination',
    color: 'bg-blue-50 text-blue-800 border-blue-300',
    dotColor: 'bg-blue-600'
  },
  'Resolved': {
    label: 'Resolved',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dotColor: 'bg-emerald-600'
  }
};

export const REVIEW_DECISION_OPTIONS = [
  {
    id: 'Coordination Required',
    title: 'Coordination Required',
    tagline: 'Joint cross-bureau inquiry or aligned action needed',
    description: 'Evidence suggests linked issues. Bureaus should synchronize timelines, documents, and proceedings.',
    colorClass: 'border-rose-400 bg-rose-50 text-rose-900',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    iconName: 'Users'
  },
  {
    id: 'Not Related',
    title: 'Not Related',
    tagline: 'No actionable convergence / false positive match',
    description: 'Shared keywords or entity tokens do not represent an operational overlap. Proceed independently.',
    colorClass: 'border-slate-400 bg-slate-50 text-slate-900',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    iconName: 'XCircle'
  },
  {
    id: 'Further Review Required',
    title: 'Further Review Required',
    tagline: 'Escalate to Senior Officer / seek additional documents',
    description: 'Current evidence is ambiguous or incomplete. Escalate to Regional Officer before final determination.',
    colorClass: 'border-amber-400 bg-amber-50 text-amber-900',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    iconName: 'AlertTriangle'
  }
];

export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (err) {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (err) {
    return dateString;
  }
}

export function getConfidenceMeta(score) {
  const num = typeof score === 'number' ? score : parseFloat(score) || 0;
  if (num >= 85) {
    return {
      level: 'High Overlap',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      meterColor: 'bg-rose-500',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300'
    };
  }
  if (num >= 65) {
    return {
      level: 'Moderate Overlap',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      meterColor: 'bg-amber-500',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
    };
  }
  return {
    level: 'Low Similarity',
    textColor: 'text-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    meterColor: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300'
  };
}
