import React, { useState, useEffect } from 'react';
import { updateCase } from '../../services/caseApi';

export default function EditCaseModal({ isOpen, onClose, caseData, onRefresh }) {
  const [form, setForm] = useState({
    status: '',
    assigned_officer: '',
    due_date: '',
    next_action: '',
    category: '',
    remarks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (caseData) {
      setForm({
        status: caseData.status || '',
        assigned_officer: caseData.assigned_officer || '',
        due_date: caseData.due_date ? caseData.due_date.split('T')[0] : '',
        next_action: caseData.next_action || '',
        category: caseData.category || '',
        remarks: caseData.remarks || ''
      });
    }
  }, [caseData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await updateCase(caseData.case_id, form);
      if (onRefresh) await onRefresh();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update case');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Case – {caseData?.case_id}</h2>
        {error && <p className="text-sm text-rose-600 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">Status</label>
            <input name="status" value={form.status} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Assigned Officer</label>
            <input name="assigned_officer" value={form.assigned_officer} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Due Date</label>
            <input type="date" name="due_date" value={form.due_date} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Next Action</label>
            <input name="next_action" value={form.next_action} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Category</label>
            <input name="category" value={form.category} onChange={handleChange} className="w-full border border-slate-300 rounded p-2 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Remarks</label>
            <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={3} className="w-full border border-slate-300 rounded p-2 text-xs" />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-3 py-1 text-xs bg-slate-200 rounded hover:bg-slate-300">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-3 py-1 text-xs bg-aicte-navy text-white rounded hover:bg-aicte-navy-light disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
