import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Download, Send, Sparkles, Plus, Trash2 } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import Modal from "../../../components/Modal";
import reportCardService from "../services/reportCardService";
import reportCardCompetencyService from "../services/reportCardCompetencyService";
import examTermService from "../services/examTermService";
import classSectionService from "../../students/services/classSectionService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

const STATUS_TONE = {
  draft: "bg-warning-tint text-warning-hex",
  published: "bg-success-tint text-success-hex",
};

const LEVEL_OPTIONS = [
  { label: "Beginner", value: "beginner" },
  { label: "Proficient", value: "proficient" },
  { label: "Advanced", value: "advanced" },
];
const LEVEL_TONE = {
  beginner: "bg-cn-bg text-ink-500",
  proficient: "bg-warning-tint text-warning-hex",
  advanced: "bg-success-tint text-success-hex",
};
const emptyCompetencyForm = { competency: "", level: "proficient", note: "" };

const ReportCards = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isParent = roleName === "Parent";
  const isStudent = roleName === "Student";
  // Both only ever see their own (Parent: linked child's) published cards —
  // no class filter makes sense for either, backend already scopes the list.
  const isSelfView = isParent || isStudent;

  const [examTerms, setExamTerms] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [examTerm, setExamTerm] = useState("");
  const [classSection, setClassSection] = useState("");
  const [cards, setCards] = useState([]);
  // Self-view roles fetch their (small) full list once, unfiltered, so the
  // exam-term dropdown's own options don't shrink to whatever's currently
  // displayed — filtering then happens client-side against this copy.
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const [competencyRow, setCompetencyRow] = useState(null);
  const [competencies, setCompetencies] = useState([]);
  const [loadingCompetencies, setLoadingCompetencies] = useState(false);
  const [competencyForm, setCompetencyForm] = useState(emptyCompetencyForm);
  const [savingCompetency, setSavingCompetency] = useState(false);

  useEffect(() => {
    // Both the exam-terms and class-sections endpoints are Teacher+ only —
    // Parent/Student never see those filters (isSelfView hides them), so
    // skip fetching entirely rather than 403 on a page they're allowed to view.
    if (isSelfView) return;
    const loadFilters = async () => {
      try {
        const [termsRes, csRes] = await Promise.all([examTermService.getExamTerms(), classSectionService.getClassSections()]);
        setExamTerms(termsRes.data);
        setClassSections(csRes.data);
      } catch (err) {
        console.error("Failed to load report card filters:", err);
      }
    };
    loadFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      // Self-view roles always fetch the full unfiltered list (it's just
      // their own — Parent's linked child's — small history) and filter by
      // exam term client-side, so the dropdown's own options stay complete.
      const params = {};
      if (!isSelfView && examTerm) params.exam_term = examTerm;
      const res = await reportCardService.getReportCards(params);
      let list = asList(res.data);
      if (isSelfView) {
        setAllCards(list);
        if (examTerm) list = list.filter((c) => String(c.exam_term) === String(examTerm));
      } else if (classSection) {
        // ReportCardViewSet has no class_section filter param — narrow client-side instead.
        list = list.filter((c) => String(c.class_section) === String(classSection));
      }
      setCards(list);
    } catch (err) {
      console.error("Failed to load report cards:", err);
      toast.error("Failed to load report cards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examTerm, classSection]);

  const examTermOptions = useMemo(() => {
    if (isSelfView) {
      const seen = new Map();
      allCards.forEach((c) => seen.set(String(c.exam_term), c.exam_term_name));
      return [{ label: "All exam terms", value: "" }, ...Array.from(seen, ([value, label]) => ({ value, label }))];
    }
    return [{ label: "All exam terms", value: "" }, ...examTerms.map((t) => ({ label: t.name, value: String(t.id) }))];
  }, [isSelfView, allCards, examTerms]);
  const classSectionOptions = useMemo(() => [{ label: "All classes", value: "" }, ...classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) }))], [classSections]);

  const handleDownload = async (row) => {
    setDownloadingId(row.id);
    try {
      const res = await reportCardService.downloadReportCardPdf(row.id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-card-${row.admission_no || row.student}-${row.exam_term_name || row.exam_term}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download report card:", err);
      toast.error("Failed to download report card PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await reportCardService.publishReportCards(Number(examTerm), Number(classSection));
      toast.success(`Published ${res.data.published_count} report card(s) — guardians notified.`);
      fetchCards();
    } catch (err) {
      console.error("Failed to publish report cards:", err);
      toast.error(err?.response?.data?.error || "Failed to publish report cards.");
    } finally {
      setPublishing(false);
    }
  };

  const openCompetencies = async (row) => {
    setCompetencyRow(row);
    setCompetencyForm(emptyCompetencyForm);
    setLoadingCompetencies(true);
    try {
      const res = await reportCardCompetencyService.getCompetencies(row.id);
      setCompetencies(asList(res.data));
    } catch (err) {
      console.error("Failed to load competency tags:", err);
      toast.error("Failed to load competency tags.");
    } finally {
      setLoadingCompetencies(false);
    }
  };

  const handleAddCompetency = async () => {
    if (!competencyForm.competency.trim()) {
      toast.error("Enter a competency name (e.g. 'Collaboration').");
      return;
    }
    setSavingCompetency(true);
    try {
      const res = await reportCardCompetencyService.createCompetency({
        report_card: competencyRow.id,
        competency: competencyForm.competency.trim(),
        level: competencyForm.level,
        note: competencyForm.note.trim(),
      });
      setCompetencies((prev) => [...prev, res.data]);
      setCompetencyForm(emptyCompetencyForm);
    } catch (err) {
      console.error("Failed to add competency tag:", err);
      toast.error(err?.response?.data?.non_field_errors?.[0] || "Failed to add competency tag (it may already exist on this report card).");
    } finally {
      setSavingCompetency(false);
    }
  };

  const handleDeleteCompetency = async (competency) => {
    try {
      await reportCardCompetencyService.deleteCompetency(competency.id);
      setCompetencies((prev) => prev.filter((c) => c.id !== competency.id));
    } catch (err) {
      console.error("Failed to remove competency tag:", err);
      toast.error("Failed to remove competency tag.");
    }
  };

  const columns = [
    { header: "Student", accessor: (row) => row.student_name },
    { header: "Admission No.", accessor: (row) => row.admission_no },
    ...(isSelfView ? [] : [{ header: "Class", accessor: (row) => row.class_section_name || "—" }]),
    { header: "Exam Term", accessor: (row) => row.exam_term_name },
    { header: "Rank", accessor: (row) => row.rank ?? "—" },
    { header: "Marks", accessor: (row) => `${row.total_marks} / ${row.total_max_marks}` },
    { header: "Percentage", accessor: (row) => `${row.percentage}%` },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex items-center text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${STATUS_TONE[row.status] || "bg-cn-bg text-ink-500"}`}>
          {row.status.toUpperCase()}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleDownload(row)}
            disabled={downloadingId === row.id}
            className="inline-flex items-center gap-1 text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer disabled:opacity-50"
          >
            <Download size={13} />
            {downloadingId === row.id ? "Downloading…" : "Download PDF"}
          </button>
          {!isSelfView && (
            <button
              type="button"
              onClick={() => openCompetencies(row)}
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer"
            >
              <Sparkles size={13} />
              Competencies
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Report cards</h1>
          <p className="text-ink-500 text-[13px] mt-1">
            {isParent ? "Your child's published report cards" : isStudent ? "Your published report cards" : "Subject-wise marks, rank and percentage per exam term"}
          </p>
        </div>
        <SelectBox className="w-52" label="Exam term" fieldName="exam_term" value={examTerm} onChange={(e) => setExamTerm(e.target.value)} options={examTermOptions} />
        {!isSelfView && (
          <>
            <SelectBox className="w-56" label="Class & Section" fieldName="class_section" value={classSection} onChange={(e) => setClassSection(e.target.value)} options={classSectionOptions} />
            <Button
              variant="outline"
              icon={<Send size={15} />}
              onClick={handlePublish}
              loading={publishing}
              disabled={!examTerm || !classSection}
              title={!examTerm || !classSection ? "Pick a specific exam term and class/section to publish" : undefined}
            >
              Publish report cards
            </Button>
          </>
        )}
      </div>

      <Table columns={columns} data={cards} loading={loading} emptyMessage="No report cards found" />

      <Modal
        isOpen={!!competencyRow}
        onClose={() => setCompetencyRow(null)}
        title={competencyRow ? `NEP competency tags — ${competencyRow.student_name}` : ""}
      >
        <div className="flex flex-col gap-4 w-[480px] max-w-full">
          <p className="text-[12.5px] text-ink-500">
            360° co-scholastic tags alongside marks/rank — e.g. "Collaboration: Proficient". Shown to the guardian on this report card once published.
          </p>

          {loadingCompetencies ? (
            <div className="text-ink-400 text-sm py-4 text-center">Loading…</div>
          ) : (
            <div className="flex flex-col gap-2">
              {competencies.length === 0 && <div className="text-ink-400 text-[13px] py-2">No competency tags yet.</div>}
              {competencies.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 bg-cn-bg rounded-lg px-3 py-2">
                  <div>
                    <span className="font-semibold text-[13px] text-ink-900">{c.competency}</span>
                    <span className={`ml-2 inline-flex items-center text-[10.5px] font-bold rounded-full px-2 py-0.5 ${LEVEL_TONE[c.level] || "bg-cn-bg text-ink-500"}`}>
                      {c.level_display}
                    </span>
                    {c.note && <p className="text-[12px] text-ink-500 mt-0.5">{c.note}</p>}
                  </div>
                  <button type="button" onClick={() => handleDeleteCompetency(c)} className="text-error-hex hover:opacity-70 cursor-pointer shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-cn-border pt-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <BlackInputField
                label="Competency"
                fieldName="competency"
                value={competencyForm.competency}
                onChange={(e) => setCompetencyForm((p) => ({ ...p, competency: e.target.value }))}
                placeholder="e.g. Critical Thinking"
                className="flex-1"
              />
              <SelectBox
                label="Level"
                fieldName="level"
                value={competencyForm.level}
                onChange={(e) => setCompetencyForm((p) => ({ ...p, level: e.target.value }))}
                options={LEVEL_OPTIONS}
                className="w-40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-dark">Note (optional)</label>
              <textarea
                rows={2}
                value={competencyForm.note}
                onChange={(e) => setCompetencyForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="Optional qualitative observation"
                className="w-full px-4 py-2 border border-slate-300 rounded-md bg-transparent text-[0.85rem] text-dark outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="primary" icon={<Plus size={15} />} onClick={handleAddCompetency} loading={savingCompetency}>
                Add tag
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReportCards;
