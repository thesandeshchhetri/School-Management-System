"use client";

export default function ReportPrintControls({
  exams,
  currentExamId,
}: {
  exams: { id: string; name: string }[];
  currentExamId?: string;
}) {
  return (
    <div id="report-controls" className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200 bg-white">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        🖨️ Print report card
      </button>
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        ← Back
      </button>
      {exams.length > 1 && (
        <select
          defaultValue={currentExamId ?? ""}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          onChange={(e) => {
            const url = new URL(window.location.href);
            if (e.target.value) url.searchParams.set("examId", e.target.value);
            else url.searchParams.delete("examId");
            window.location.href = url.toString();
          }}
        >
          <option value="">All exams</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
