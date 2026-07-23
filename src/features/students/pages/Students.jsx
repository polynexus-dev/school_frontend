import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search, UserPlus, ScanFace, ArrowUpCircle, ShieldCheck } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import studentService from "../services/studentService";
import classSectionService from "../services/classSectionService";
import guardianService from "../../guardians/services/guardianService";
import ConsentModal from "../components/ConsentModal";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";

// Field names below (full_name, date_of_birth, class_section, admission_number
// on Student; full_name/phone/email/relationship on Guardian; student/guardian/
// is_primary on GuardianLink) are the frontend's best assumption for the
// serializer shape — the endpoints themselves are confirmed by the contract,
// exact field names are not. Adjust here once the real serializers land.

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const RELATIONSHIP_OPTIONS = [
  { label: "Mother", value: "Mother" },
  { label: "Father", value: "Father" },
  { label: "Grandmother", value: "Grandmother" },
  { label: "Grandfather", value: "Grandfather" },
  { label: "Legal Guardian", value: "Guardian" },
  { label: "Other", value: "Other" },
];

const emptyForm = {
  id: null,
  full_name: "",
  date_of_birth: "",
  class_section: "",
  admission_number: "",
};

const emptyGuardianForm = {
  full_name: "",
  relationship: "Mother",
  phone: "",
  email: "",
};

const Students = () => {
  const navigate = useNavigate();

  const [view, setView] = useState("list"); // 'list' | 'enroll'
  const [isEditing, setIsEditing] = useState(false);
  const [classSections, setClassSections] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const {
    items: students,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch: fetchStudents,
  } = usePaginatedList(studentService.getStudents);

  const [form, setForm] = useState(emptyForm);
  const [guardianForm, setGuardianForm] = useState(emptyGuardianForm);
  const [showSecondGuardian, setShowSecondGuardian] = useState(false);
  const [secondGuardianForm, setSecondGuardianForm] = useState(emptyGuardianForm);

  const [consentStudent, setConsentStudent] = useState(null);
  const [guardianLinkCount, setGuardianLinkCount] = useState(null);

  const fetchClassSections = async () => {
    try {
      const res = await classSectionService.getClassSections();
      setClassSections(asList(res.data));
    } catch (err) {
      console.error("Failed to fetch class sections:", err);
    }
  };

  const fetchGuardianLinkCount = async () => {
    try {
      const res = await guardianService.getGuardianLinks();
      setGuardianLinkCount(asList(res.data).length);
    } catch (err) {
      console.error("Failed to fetch guardian links:", err);
    }
  };

  useEffect(() => {
    fetchClassSections();
    fetchGuardianLinkCount();
  }, []);

  const classSectionLabel = (cs) => cs?.name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;

  const classSectionOptions = useMemo(
    () => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })),
    [classSections]
  );

  const classSectionLabelById = (id) => {
    const cs = classSections.find((c) => String(c.id) === String(id));
    return cs ? classSectionLabel(cs) : "—";
  };

  // Search only matches within the currently loaded page (the backend has
  // no search filter on this endpoint) — this is a client-side narrowing of
  // the visible 25 rows, not a roster-wide search.
  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.full_name || s.name || "").toLowerCase().includes(q) ||
      (s.admission_number || "").toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      header: "Student",
      accessor: (row) => {
        const name = row.full_name || row.name || "Unnamed";
        const initials = name
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        return (
          <div className="flex items-center gap-3 py-1">
            <span
              className="w-8 h-8 rounded-[10px] flex items-center justify-center font-bold text-xs shrink-0 text-white"
              style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
            >
              {initials || "S"}
            </span>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => openEdit(row)}
                className="font-semibold text-violet-700 hover:text-violet-950 hover:underline block truncate text-left cursor-pointer bg-transparent border-none p-0 focus:outline-none"
              >
                {name}
              </button>
              <span className="text-[11px] text-ink-400 block truncate">
                DOB {row.date_of_birth || "—"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Admission No.",
      accessor: (row) => <span className="font-mono text-xs font-semibold text-ink-700">{row.admission_number || "auto"}</span>,
    },
    {
      header: "Class & Section",
      accessor: (row) => <span className="text-ink-700 font-medium">{classSectionLabelById(row.class_section)}</span>,
    },
    {
      header: "Face registered",
      accessor: (row) => (
        <span
          className={`inline-flex items-center gap-1 text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${
            row.is_face_registered ? "bg-success-tint text-success-hex" : "bg-warning-tint text-warning-hex"
          }`}
        >
          {row.is_face_registered ? "REGISTERED" : "PENDING"}
        </span>
      ),
    },
  ];

  const resetForm = () => {
    setForm(emptyForm);
    setGuardianForm(emptyGuardianForm);
    setSecondGuardianForm(emptyGuardianForm);
    setShowSecondGuardian(false);
    setErrors({});
    setIsEditing(false);
  };

  const openEnroll = () => {
    resetForm();
    setView("enroll");
  };

  const openEdit = (row) => {
    setForm({
      id: row.id,
      full_name: row.full_name || row.name || "",
      date_of_birth: row.date_of_birth || "",
      class_section: row.class_section ? String(row.class_section) : "",
      admission_number: row.admission_number || "",
    });
    setIsEditing(true);
    setErrors({});
    setView("enroll");
  };

  const handleCancel = () => {
    resetForm();
    setView("list");
  };

  const handleDelete = async (row) => {
    const name = row.full_name || row.name || "this student";
    if (!window.confirm(`Remove ${name} from the roster? This cannot be undone.`)) return;
    try {
      await studentService.deleteStudent(row.id);
      toast.success("Student removed.");
      fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove student.");
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.full_name.trim()) newErrors.full_name = "Required";
    if (!form.date_of_birth) newErrors.date_of_birth = "Required";
    if (!form.class_section) newErrors.class_section = "Required";
    if (!isEditing) {
      if (!guardianForm.full_name.trim()) newErrors.guardian_full_name = "Required";
      if (!guardianForm.phone.trim()) newErrors.guardian_phone = "Required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const inviteGuardian = async (studentId, guardianData, isPrimary) => {
    const guardianRes = await guardianService.createGuardian({
      full_name: guardianData.full_name,
      relationship: guardianData.relationship,
      phone: guardianData.phone,
      email: guardianData.email,
    });
    const guardianId = guardianRes.data?.id;
    await guardianService.createGuardianLink({
      student: studentId,
      guardian: guardianId,
      relationship: guardianData.relationship,
      is_primary: isPrimary,
    });
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await studentService.updateStudent(form.id, {
          full_name: form.full_name,
          date_of_birth: form.date_of_birth,
          class_section: Number(form.class_section),
        });
        toast.success("Student details updated.");
      } else {
        const studentRes = await studentService.createStudent({
          full_name: form.full_name,
          date_of_birth: form.date_of_birth,
          class_section: Number(form.class_section),
        });
        const studentId = studentRes.data?.id;

        // Best-effort: the student record is already saved at this point even
        // if a guardian invite below fails partway — not fully transactional
        // from the frontend's side. Surfacing a clear error lets the office
        // staff finish the guardian invite manually from the roster.
        try {
          await inviteGuardian(studentId, guardianForm, true);
          if (showSecondGuardian && secondGuardianForm.full_name.trim()) {
            await inviteGuardian(studentId, secondGuardianForm, false);
          }
          toast.success("Student enrolled and guardian invite sent.");
        } catch (guardianErr) {
          console.error("Guardian invite failed:", guardianErr);
          toast.warning("Student enrolled, but the guardian invite failed. Add the guardian from Parents & Linking.");
        }
        fetchGuardianLinkCount();
      }

      resetForm();
      setView("list");
      fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error(isEditing ? "Failed to update student." : "Failed to enroll student.");
    } finally {
      setSaving(false);
    }
  };

  // `count` is the true total across every page; `students` here is only the
  // current page (25 rows), so face-pending is an on-page approximation.
  const recentlyEnrolledCount = count;
  const pendingFaceCount = students.filter((s) => !s.is_face_registered).length;

  if (view === "enroll") {
    return (
      <div className="w-full">
        <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-2xl text-violet-950">
              {isEditing ? "Edit student details" : "New student enrollment"}
            </h1>
            <p className="text-ink-500 text-[13px] mt-1">Academic year 2026–27</p>
          </div>
          <Button variant="outline" onClick={handleCancel}>
            ← Back to list
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Form */}
          <div className="flex-[1.4] w-full bg-cn-surface border border-cn-border rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-violet-700 text-white flex items-center justify-center text-xs font-extrabold">1</span>
              <span className="font-heading font-semibold text-[15px] text-ink-900">Student details</span>
              <span className="flex-1 h-px bg-cn-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BlackInputField
                label="Full Name"
                fieldName="full_name"
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                required
                error={errors.full_name}
              />
              <BlackInputField
                label="Date of Birth"
                fieldName="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))}
                required
                error={errors.date_of_birth}
              />
              <SelectBox
                label="Class & Section"
                fieldName="class_section"
                value={form.class_section}
                onChange={(e) => setForm((p) => ({ ...p, class_section: e.target.value }))}
                options={classSectionOptions}
                required
                error={errors.class_section}
              />
              <div>
                <label className="block text-sm font-medium mb-1 text-dark">Admission No.</label>
                <div className="w-full px-4 py-2 border border-cn-border rounded-md bg-cn-bg text-[0.85rem] text-ink-500">
                  {isEditing ? form.admission_number || "—" : "Auto-generated on save"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-1">
              <span className="w-6 h-6 rounded-full bg-violet-700 text-white flex items-center justify-center text-xs font-extrabold">2</span>
              <span className="font-heading font-semibold text-[15px] text-ink-900">Guardians to invite</span>
              <span className="flex-1 h-px bg-cn-border" />
            </div>

            {isEditing ? (
              <p className="text-xs text-ink-500 -mt-2">
                Guardian invites are managed from <b className="text-violet-700">Parents &amp; Linking</b>.
              </p>
            ) : (
              <>
                <div className="border border-cn-border rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-ink-900">Primary guardian</span>
                    <span className="bg-success-tint text-success-hex rounded-lg px-2.5 py-1 text-[11px] font-extrabold">PRIMARY</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <BlackInputField
                      label="Full Name"
                      fieldName="full_name"
                      value={guardianForm.full_name}
                      onChange={(e) => setGuardianForm((p) => ({ ...p, full_name: e.target.value }))}
                      required
                      error={errors.guardian_full_name}
                    />
                    <SelectBox
                      label="Relationship"
                      fieldName="relationship"
                      value={guardianForm.relationship}
                      onChange={(e) => setGuardianForm((p) => ({ ...p, relationship: e.target.value }))}
                      options={RELATIONSHIP_OPTIONS}
                    />
                    <BlackInputField
                      label="Phone"
                      id="contact_number"
                      fieldName="phone"
                      value={guardianForm.phone}
                      onChange={(e) => setGuardianForm((p) => ({ ...p, phone: e.target.value }))}
                      required
                      error={errors.guardian_phone}
                    />
                    <BlackInputField
                      label="Email (optional)"
                      fieldName="email"
                      type="email"
                      value={guardianForm.email}
                      onChange={(e) => setGuardianForm((p) => ({ ...p, email: e.target.value }))}
                    />
                  </div>
                </div>

                {!showSecondGuardian ? (
                  <button
                    type="button"
                    onClick={() => setShowSecondGuardian(true)}
                    className="border border-dashed border-violet-300 rounded-2xl p-3.5 flex items-center gap-2 text-violet-700 text-[13.5px] font-bold cursor-pointer hover:bg-violet-50 transition"
                  >
                    <span className="text-lg leading-none">+</span> Add second guardian (optional)
                  </button>
                ) : (
                  <div className="border border-cn-border rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-ink-900">Second guardian</span>
                      <button type="button" className="text-xs text-error-hex font-semibold cursor-pointer" onClick={() => setShowSecondGuardian(false)}>
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <BlackInputField
                        label="Full Name"
                        fieldName="full_name"
                        value={secondGuardianForm.full_name}
                        onChange={(e) => setSecondGuardianForm((p) => ({ ...p, full_name: e.target.value }))}
                      />
                      <SelectBox
                        label="Relationship"
                        fieldName="relationship"
                        value={secondGuardianForm.relationship}
                        onChange={(e) => setSecondGuardianForm((p) => ({ ...p, relationship: e.target.value }))}
                        options={RELATIONSHIP_OPTIONS}
                      />
                      <BlackInputField
                        label="Phone"
                        id="contact_number"
                        fieldName="phone"
                        value={secondGuardianForm.phone}
                        onChange={(e) => setSecondGuardianForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                      <BlackInputField
                        label="Email (optional)"
                        fieldName="email"
                        type="email"
                        value={secondGuardianForm.email}
                        onChange={(e) => setSecondGuardianForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit} loading={saving}>
                {isEditing ? "Save changes" : "Enroll & send invites →"}
              </Button>
            </div>
          </div>

          {/* Consent + stats panel */}
          <div className="flex-1 w-full flex flex-col gap-4">
            <div className="bg-cn-surface border border-cn-border rounded-2xl p-5 flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-violet-700 text-white flex items-center justify-center text-xs font-extrabold">3</span>
                <span className="font-heading font-semibold text-[15px] text-ink-900">Consent (DPDP Act 2023)</span>
              </div>
              <p className="text-xs text-ink-500 leading-relaxed">
                Recorded against the primary guardian at first login. Face data needs an explicit opt-in — it is
                never assumed.
              </p>
              <div className="flex flex-col gap-2">
                <div className="border border-cn-border rounded-xl p-3 flex items-center gap-3">
                  <span className="w-5 h-5 rounded-md bg-violet-700 text-white flex items-center justify-center text-[11px] font-extrabold">✓</span>
                  <span className="flex-1 text-[13px] font-semibold text-ink-900">App notifications &amp; academic records</span>
                  <span className="text-[11px] font-extrabold text-success-hex">REQUIRED</span>
                </div>
                <div className="border border-cn-border rounded-xl p-3 flex items-center gap-3">
                  <span className="w-5 h-5 rounded-md border-2 border-ink-400 bg-white" />
                  <span className="flex-1 text-[13px] font-semibold text-ink-900">Bus GPS tracking &amp; boarding alerts</span>
                  <span className="text-[11px] font-extrabold text-ink-500">OPT-IN</span>
                </div>
                <div className="border border-amber-200 bg-warning-tint rounded-xl p-3 flex items-center gap-3">
                  <span className="w-5 h-5 rounded-md border-2 border-amber-500 bg-white" />
                  <span className="flex-1 text-[13px] font-semibold text-ink-900">Face recognition for attendance</span>
                  <span className="text-[11px] font-extrabold text-warning-hex">PENDING</span>
                </div>
              </div>
              <div className="bg-violet-50 rounded-xl p-3 text-[12px] text-violet-900 leading-relaxed">
                Until face consent is given, this student appears in <b>manual roll-call only</b>. The guardian can
                grant it anytime from the app. Once linked, use <b>Manage consent</b> from the roster to record it.
              </div>
            </div>

            <div className="bg-cn-surface border border-cn-border rounded-2xl p-5 flex flex-col gap-3">
              <span className="font-heading font-semibold text-[14px] text-ink-900">Roster snapshot</span>
              <div className="flex gap-3">
                <div className="flex-1 bg-cn-bg rounded-xl p-3.5 text-center">
                  <div className="font-heading font-extrabold text-2xl text-violet-950">{recentlyEnrolledCount}</div>
                  <div className="text-[10px] font-bold text-ink-500 tracking-wide">ENROLLED</div>
                </div>
                <div className="flex-1 bg-cn-bg rounded-xl p-3.5 text-center">
                  <div className="font-heading font-extrabold text-2xl text-violet-950">{guardianLinkCount ?? "—"}</div>
                  <div className="text-[10px] font-bold text-ink-500 tracking-wide">GUARDIAN LINKS</div>
                </div>
                <div className="flex-1 bg-warning-tint rounded-xl p-3.5 text-center">
                  <div className="font-heading font-extrabold text-2xl text-warning-hex">{pendingFaceCount}</div>
                  <div className="text-[10px] font-bold text-warning-hex tracking-wide">FACE PENDING</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Students</h1>
          <p className="text-ink-500 text-[13px] mt-1">Enrollment, roster and DPDP consent</p>
        </div>
        <Button variant="outline" icon={<ScanFace size={16} />} onClick={() => navigate("/students/face-registration")}>
          Face Registration
        </Button>
        <Button variant="outline" icon={<ArrowUpCircle size={16} />} onClick={() => navigate("/students/promote-class")}>
          Promote Class
        </Button>
        <Button variant="primary" icon={<UserPlus size={16} />} onClick={openEnroll}>
          Enroll student
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or admission no…"
          className="w-full h-[42px] pl-10 pr-4 text-[13px] bg-white border border-cn-border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
        />
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
      </div>

      <Table
        columns={columns}
        data={filteredStudents}
        loading={loading}
        onView={(row) => setConsentStudent(row)}
        viewLabel="Manage consent"
        viewIcon={ShieldCheck}
        onEdit={openEdit}
        onDelete={handleDelete}
        emptyMessage="No students enrolled yet"
        emptyDescription="Click “Enroll student” to add your first admission for this academic year."
      />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <ConsentModal isOpen={!!consentStudent} onClose={() => setConsentStudent(null)} student={consentStudent} />
    </div>
  );
};

export default Students;
