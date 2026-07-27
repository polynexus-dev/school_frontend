import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  MessageSquareWarning,
  Plus,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Lock,
  User,
  Send,
} from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import feedbackService from "../services/feedbackService";
import studentService from "../../students/services/studentService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const TYPE_OPTIONS = [
  { label: "Complaint", value: "complaint" },
  { label: "General Feedback", value: "feedback" },
  { label: "Suggestion", value: "suggestion" },
  { label: "Appreciation", value: "appreciation" },
];

const CATEGORY_OPTIONS = [
  { label: "Academics & Teaching", value: "academics" },
  { label: "Transport & Bus", value: "transport" },
  { label: "Hostel & Food", value: "hostel" },
  { label: "Fees & Billing", value: "fees" },
  { label: "Discipline & Safety", value: "discipline" },
  { label: "Infrastructure & Facilities", value: "infrastructure" },
  { label: "Other Issues", value: "other" },
];

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const STATUS_OPTIONS = [
  { label: "Pending Principal Review", value: "pending" },
  { label: "In Review by Principal", value: "in_review" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const emptyForm = {
  feedback_type: "complaint",
  category: "academics",
  student: "",
  subject: "",
  description: "",
  priority: "medium",
};

const ParentFeedback = () => {
  const { user } = useUser();
  const roleName = user?.data?.role || "Parent";
  const isPrincipal = ["Admin", "School Admin", "Superuser"].includes(roleName);
  const isParent = roleName === "Parent";

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Modal (Parent)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [parentStudents, setParentStudents] = useState([]);

  // Respond Modal (Principal)
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseMsg, setResponseMsg] = useState("");
  const [responseStatus, setResponseStatus] = useState("resolved");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await feedbackService.getFeedbacks();
      setFeedbacks(asList(res.data));
    } catch (err) {
      console.error("Failed to load feedbacks:", err);
      toast.error("Failed to load complaints and feedback.");
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await studentService.getStudents();
      setParentStudents(asList(res.data));
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  };

  useEffect(() => {
    loadFeedbacks();
    loadStudents();
  }, []);

  const handleCreateSubmit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error("Subject and description are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        feedback_type: form.feedback_type,
        category: form.category,
        subject: form.subject.trim(),
        description: form.description.trim(),
        priority: form.priority,
      };
      if (form.student) {
        payload.student = Number(form.student);
      }
      await feedbackService.createFeedback(payload);
      toast.success("Your message has been submitted directly to the Principal.");
      setShowCreateModal(false);
      setForm(emptyForm);
      loadFeedbacks();
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      toast.error("Failed to submit feedback.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrincipalRespond = async () => {
    if (!responseMsg.trim()) {
      toast.error("Please enter a response for the parent.");
      return;
    }
    setSubmittingResponse(true);
    try {
      await feedbackService.respondToFeedback(selectedFeedback.id, {
        principal_response: responseMsg.trim(),
        status: responseStatus,
      });
      toast.success("Response sent to the parent.");
      setSelectedFeedback(null);
      setResponseMsg("");
      loadFeedbacks();
    } catch (err) {
      console.error("Failed to respond to feedback:", err);
      toast.error("Failed to send response.");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const openRespondModal = (item) => {
    setSelectedFeedback(item);
    setResponseMsg(item.principal_response || "");
    setResponseStatus(item.status === "pending" ? "in_review" : item.status);
  };

  const filteredFeedbacks = feedbacks.filter((f) => (statusFilter === "all" ? true : f.status === statusFilter));

  const studentOptions = parentStudents.map((s) => ({
    label: `${s.full_name || s.name} (${s.class_section_name || `Class ${s.class_section}`})`,
    value: String(s.id),
  }));

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "urgent":
        return <span className="bg-rose-100 text-rose-800 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-rose-300">Urgent</span>;
      case "high":
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-amber-300">High</span>;
      case "medium":
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full border border-blue-300">Medium</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full border border-slate-300">Low</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="bg-amber-50 text-amber-700 text-[11.5px] font-bold rounded-full px-3 py-1 border border-amber-200 inline-flex items-center gap-1.5"><Clock size={13} /> Pending Review</span>;
      case "in_review":
        return <span className="bg-sky-50 text-sky-700 text-[11.5px] font-bold rounded-full px-3 py-1 border border-sky-200 inline-flex items-center gap-1.5"><ShieldCheck size={13} /> In Review</span>;
      case "resolved":
        return <span className="bg-emerald-50 text-emerald-700 text-[11.5px] font-bold rounded-full px-3 py-1 border border-emerald-200 inline-flex items-center gap-1.5"><CheckCircle2 size={13} /> Resolved</span>;
      case "closed":
        return <span className="bg-slate-100 text-slate-700 text-[11.5px] font-bold rounded-full px-3 py-1 border border-slate-200">Closed</span>;
      default:
        return status;
    }
  };

  const columns = [
    {
      header: "Subject / Category",
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-violet-950 text-[13.5px]">{row.subject}</span>
          <span className="text-[11.5px] text-ink-500 font-medium capitalize">
            {row.feedback_type_display || row.feedback_type} • {row.category_display || row.category}
          </span>
        </div>
      ),
    },
    ...(isPrincipal
      ? [
          {
            header: "Submitted By",
            accessor: (row) => (
              <div className="flex flex-col text-[12.5px]">
                <span className="font-semibold text-ink-900">{row.submitted_by_name || "Parent"}</span>
                {row.student_name && <span className="text-ink-400 text-[11px]">Re: {row.student_name}</span>}
              </div>
            ),
          },
        ]
      : []),
    { header: "Priority", accessor: (row) => getPriorityBadge(row.priority) },
    { header: "Submitted On", accessor: (row) => (row.created_at ? row.created_at.split("T")[0] : "—") },
    { header: "Status", accessor: (row) => getStatusBadge(row.status) },
    {
      header: "Action",
      accessor: (row) => (
        <button
          type="button"
          onClick={() => openRespondModal(row)}
          className="text-[12px] font-bold text-violet-700 hover:text-violet-950 hover:underline cursor-pointer"
        >
          {isPrincipal ? "Review & Respond →" : "View Details →"}
        </button>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-bold text-2xl text-violet-950">Principal's Complaint & Feedback Box</h1>
            <span className="bg-violet-100 text-violet-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-violet-200">
              Confidential
            </span>
          </div>
          <p className="text-ink-500 text-[13px] mt-1">Direct confidential communication channel to the Principal's Desk</p>
        </div>
        {!isPrincipal && (
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
            Submit Complaint / Feedback
          </Button>
        )}
      </div>

      {/* Confidential Notice Banner */}
      <div className="bg-violet-50/80 border border-violet-200/80 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-xs">
        <div className="p-2 bg-violet-700 text-white rounded-xl shrink-0 mt-0.5">
          <Lock size={18} />
        </div>
        <div className="flex-1 text-[13px] text-violet-950 leading-relaxed">
          <span className="font-extrabold">Confidentiality Guarantee:</span> Messages submitted in this box are delivered
          <span className="font-bold underline ml-1">exclusively to the Principal</span>. Teachers, staff members, and third parties have no access to this box.
        </div>
      </div>

      {/* Stats Cards for Principal */}
      {isPrincipal && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-cn-surface border border-cn-border rounded-2xl p-4 flex flex-col gap-1 shadow-xs">
            <span className="text-ink-400 text-[12px] font-semibold">Total Received</span>
            <span className="text-2xl font-extrabold text-violet-950">{feedbacks.length}</span>
          </div>
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 flex flex-col gap-1 shadow-xs">
            <span className="text-amber-700 text-[12px] font-bold">Pending Review</span>
            <span className="text-2xl font-extrabold text-amber-900">{feedbacks.filter((f) => f.status === "pending").length}</span>
          </div>
          <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 flex flex-col gap-1 shadow-xs">
            <span className="text-sky-700 text-[12px] font-bold">In Review</span>
            <span className="text-2xl font-extrabold text-sky-900">{feedbacks.filter((f) => f.status === "in_review").length}</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-1 shadow-xs">
            <span className="text-emerald-700 text-[12px] font-bold">Resolved</span>
            <span className="text-2xl font-extrabold text-emerald-900">{feedbacks.filter((f) => f.status === "resolved").length}</span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {["all", "pending", "in_review", "resolved"].map((st) => (
          <Button
            key={st}
            variant={statusFilter === st ? "primary" : "outline"}
            size="compact"
            onClick={() => setStatusFilter(st)}
          >
            <span className="capitalize">{st.replace("_", " ")}</span>
          </Button>
        ))}
      </div>

      {/* Main Table */}
      <Table columns={columns} data={filteredFeedbacks} loading={loading} emptyMessage="No complaints or feedback records found." />

      {/* Submit Complaint/Feedback Modal (Parent) */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Submit Complaint or Feedback to Principal">
        <div className="flex flex-col gap-4 w-[420px] max-w-full">
          <div className="grid grid-cols-2 gap-3">
            <SelectBox
              label="Type"
              fieldName="feedback_type"
              value={form.feedback_type}
              onChange={(e) => setForm((p) => ({ ...p, feedback_type: e.target.value }))}
              options={TYPE_OPTIONS}
            />
            <SelectBox
              label="Priority"
              fieldName="priority"
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              options={PRIORITY_OPTIONS}
            />
          </div>

          <SelectBox
            label="Category"
            fieldName="category"
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            options={CATEGORY_OPTIONS}
          />

          {studentOptions.length > 0 && (
            <SelectBox
              label="Regarding Student (Optional)"
              fieldName="student"
              value={form.student}
              onChange={(e) => setForm((p) => ({ ...p, student: e.target.value }))}
              options={[{ label: "General / Not Student Specific", value: "" }, ...studentOptions]}
            />
          )}

          <BlackInputField
            label="Subject"
            fieldName="subject"
            placeholder="Brief summary of your complaint or feedback"
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-black">Detailed Message / Description *</label>
            <textarea
              rows={4}
              placeholder="Describe your issue or feedback in detail for the Principal..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full p-3 text-[13px] border border-cn-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-cn-border">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={<Send size={15} />} onClick={handleCreateSubmit} loading={saving}>
              Send to Principal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review / Response Detail Modal */}
      <Modal isOpen={!!selectedFeedback} onClose={() => setSelectedFeedback(null)} title="Complaint & Feedback Details">
        {selectedFeedback && (
          <div className="flex flex-col gap-4 w-[460px] max-w-full">
            {/* Header info */}
            <div className="bg-violet-50/60 p-4 rounded-xl border border-violet-100 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-violet-200/60 text-violet-900">
                  {selectedFeedback.feedback_type_display} • {selectedFeedback.category_display}
                </span>
                {getStatusBadge(selectedFeedback.status)}
              </div>
              <h3 className="font-heading font-bold text-base text-violet-950 mt-1">{selectedFeedback.subject}</h3>
              <div className="text-[12px] text-ink-600 flex items-center justify-between">
                <span>By: <b>{selectedFeedback.submitted_by_name || "Parent"}</b></span>
                {selectedFeedback.student_name && <span>Re: <b>{selectedFeedback.student_name}</b></span>}
              </div>
            </div>

            {/* Description Body */}
            <div className="bg-cn-surface border border-cn-border rounded-xl p-3.5 flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase text-ink-400">Parent Message</span>
              <p className="text-[13px] text-ink-900 whitespace-pre-wrap leading-relaxed">{selectedFeedback.description}</p>
            </div>

            {/* Principal Response Section */}
            {isPrincipal ? (
              <div className="flex flex-col gap-3 pt-2 border-t border-cn-border">
                <SelectBox
                  label="Update Status"
                  fieldName="responseStatus"
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value)}
                  options={STATUS_OPTIONS}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-violet-950">Official Principal Response</label>
                  <textarea
                    rows={4}
                    placeholder="Write official response to parent..."
                    value={responseMsg}
                    onChange={(e) => setResponseMsg(e.target.value)}
                    className="w-full p-3 text-[13px] border border-cn-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" icon={<Send size={15} />} onClick={handlePrincipalRespond} loading={submittingResponse}>
                    Submit Response
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-cn-border">
                <span className="text-[12px] font-bold text-violet-950">Principal's Response</span>
                {selectedFeedback.principal_response ? (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col gap-1.5 text-[13px] text-emerald-950">
                    <p className="whitespace-pre-wrap leading-relaxed font-medium">{selectedFeedback.principal_response}</p>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-1 text-right">
                      — Responded by {selectedFeedback.responded_by_name || "Principal"} on {selectedFeedback.responded_at ? selectedFeedback.responded_at.split("T")[0] : "recent"}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-[12.5px] text-amber-800 flex items-center gap-2">
                    <Clock size={16} /> Awaiting Principal review and response.
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParentFeedback;
