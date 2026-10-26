import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Filter,
  CheckCircle,
  FileCheck,
  AlertCircle,
  PlusCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { BureauBadge } from '../common/StatusBadge';
import { formatDate } from '../../utils/formatters';

export default function ActionTimeline({
  timeline = [],
  bureauFilterOptions = [],
  onAddAction,
  readOnly = true,
  className = ''
}) {
  const [selectedBureau, setSelectedBureau] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActionType, setNewActionType] = useState('Inter-Bureau Coordination Note');
  const [newActionActor, setNewActionActor] = useState('Coordination Officer');
  const [newActionDesc, setNewActionDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter events
  const filteredEvents = (timeline || []).filter(item => {
    if (selectedBureau === 'ALL') return true;
    return item.bureau === selectedBureau;
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newActionDesc.trim()) return;

    if (onAddAction) {
      setIsSubmitting(true);
      try {
        await onAddAction({
          type: newActionType,
          actor: newActionActor,
          description: newActionDesc.trim()
        });
        setNewActionDesc('');
        setShowAddForm(false);
      } catch (err) {
        alert("Failed to record timeline action: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Top Header & Filters */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-aicte-blue" />
          <h4 className="text-sm font-bold text-slate-900">
            Chronological Action & Coordination Timeline
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">
            ({filteredEvents.length} Verified Events)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {bureauFilterOptions.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Filter events by bureau"
                value={selectedBureau}
                onChange={(e) => setSelectedBureau(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-aicte-blue"
              >
                <option value="ALL">All Bureaus / System</option>
                {bureauFilterOptions.map((code) => (
                  <option key={code} value={code}>
                    {code} Bureau Events
                  </option>
                ))}
              </select>
            </div>
          )}

          {!readOnly && onAddAction && (
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-aicte-blue" />
              {showAddForm ? "Cancel Note" : "Log Coordination Event"}
            </button>
          )}
        </div>
      </div>

      {/* Add New Event inline form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="text-xs font-bold uppercase text-slate-700 tracking-wider">
            Record New Procedural / Coordination Event
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Event Type</label>
              <select
                value={newActionType}
                onChange={(e) => setNewActionType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
              >
                <option value="Inter-Bureau Coordination Note">Inter-Bureau Coordination Note</option>
                <option value="Joint Inquiry Meeting">Joint Inquiry Meeting</option>
                <option value="Evidence Cross-Verification">Evidence Cross-Verification</option>
                <option value="Status Update">Status Update</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Recording Official / Desk</label>
              <input
                type="text"
                value={newActionActor}
                onChange={(e) => setNewActionActor(e.target.value)}
                placeholder="e.g. Desk Officer PGRC / SHC Lead"
                className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-600 font-medium mb-1">Event Narrative / Justification</label>
            <textarea
              rows={2}
              value={newActionDesc}
              onChange={(e) => setNewActionDesc(e.target.value)}
              placeholder="Detail the procedural development or coordination finding..."
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs text-slate-800"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newActionDesc.trim()}
              className="px-3.5 py-1 rounded bg-aicte-navy text-white text-xs font-semibold hover:bg-aicte-navy-light disabled:opacity-50"
            >
              {isSubmitting ? "Recording..." : "Save Event to Timeline"}
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="p-4 sm:p-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No historical timeline events recorded for the selected bureau filter.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {filteredEvents.map((event, idx) => (
              <div key={event.id || idx} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-aicte-navy flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-aicte-navy group-hover:scale-125 transition-transform" />
                </div>

                <div className="bg-slate-50 hover:bg-white border border-slate-200 rounded-lg p-3.5 transition-all shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {event.type}
                      </span>
                      {event.bureau && (
                        <BureauBadge code={event.bureau} />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {event.description}
                  </p>

                  {event.actor && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Action taken by: <strong className="font-semibold text-slate-700">{event.actor}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
