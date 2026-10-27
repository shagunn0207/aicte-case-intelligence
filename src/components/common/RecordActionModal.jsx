import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { postCaseAction } from '../../services/caseApi';

/**
 * Modal for recording a procedural action on a case.
 * Uses the `postCaseAction` API defined in src/services/caseApi.js.
 * Required field: `action_taken`.
 * Optional fields: `action_by`, `remarks`, `next_action`, `new_status`.
 */
export default function RecordActionModal({ isOpen, onClose, caseId, onRefresh }) {
  const [form, setForm] = useState({
    action_taken: '',
    action_by: '',
    remarks: '',
    next_action: '',
    new_status: ''
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.action_taken.trim()) {
      setError('Action taken is required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        action_taken: form.action_taken,
        ...(form.action_by && { action_by: form.action_by }),
        ...(form.remarks && { remarks: form.remarks }),
        ...(form.next_action && { next_action: form.next_action }),
        ...(form.new_status && { new_status: form.new_status })
      };
      await postCaseAction(caseId, payload);
      if (onRefresh) await onRefresh();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record action');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Record Action</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <p className="text-sm text-rose-600 mb-2" role="alert">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Taken (required) */}
          <div>
            <label className="block text-xs font-medium mb-1">Action Taken *</label>
            <input
              name="action_taken"
              value={form.action_taken}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded p-2 text-xs"
              required
            />
          </div>
          {/* Action By (optional) */}
          <div>
            <label className="block text-xs font-medium mb-1">Action By</label>
            <input
              name="action_by"
              value={form.action_by}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded p-2 text-xs"
            />
          </div>
          {/* Remarks (optional) */}
          <div>
            <label className="block text-xs font-medium mb-1">Remarks</label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-300 rounded p-2 text-xs"
            />
          </div>
          {/* Next Action (optional) */}
          <div>
            <label className="block text-xs font-medium mb-1">Next Action</label>
            <input
              name="next_action"
              value={form.next_action}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded p-2 text-xs"
            />
          </div>
          {/* New Status (optional) */}
          <div>
            <label className="block text-xs font-medium mb-1">New Status</label>
            <input
              name="new_status"
              value={form.new_status}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded p-2 text-xs"
            />
          </div>
          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1 text-xs bg-slate-200 rounded hover:bg-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1 text-xs bg-aicte-navy text-white rounded hover:bg-aicte-navy-light disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <CheckCircle2 className="inline w-3 h-3 mr-1 animate-spin" /> Saving...
                </>
              ) : (
                'Save Action'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
