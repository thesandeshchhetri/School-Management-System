"use client";

export default function PrintControls() {
  return (
    <div id="receipt-controls" className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        🖨️ Print receipt
      </button>
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}
