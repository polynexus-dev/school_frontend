import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus, BookOpen, Undo2, User, ExternalLink } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import libraryService from "../services/libraryService";
import classSectionService from "../../students/services/classSectionService";
import studentService from "../../students/services/studentService";
import useUser from "../../auth/hooks/useUser";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);
const classSectionLabel = (cs) => cs?.display_name || `Class ${cs?.grade ?? "?"} - ${cs?.section ?? "?"}`;
const emptyBookForm = { title: "", author: "", isbn: "", publisher: "", category: "", description: "" };
const emptyIssueForm = { book: "", class_section: "", student: "", accession_number: "", due_date: "" };

const Library = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const roleName = user?.data?.role || "Admin";
  const isAdmin = !["Teacher", "Parent", "Conductor"].includes(roleName);

  const [tab, setTab] = useState("books");

  // Books tab
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [search, setSearch] = useState("");
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState(emptyBookForm);
  const [savingBook, setSavingBook] = useState(false);

  // Copies modal (per book)
  const [copiesBook, setCopiesBook] = useState(null);
  const [copies, setCopies] = useState([]);
  const [newAccession, setNewAccession] = useState("");
  const [addingCopy, setAddingCopy] = useState(false);

  // Issues tab
  const [issues, setIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState(emptyIssueForm);
  const [sectionStudents, setSectionStudents] = useState([]);
  const [availableCopies, setAvailableCopies] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState(null);

  // Student Profile Quick View Modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  const openStudentProfile = async (studentId, fallbackName = "") => {
    if (!studentId) {
      toast.info(`Borrower: ${fallbackName}`);
      return;
    }
    setShowProfileModal(true);
    setLoadingStudent(true);
    setSelectedStudent(null);
    try {
      const res = await studentService.getStudent(studentId);
      setSelectedStudent(res.data);
    } catch (err) {
      console.error("Failed to load student profile:", err);
      toast.error("Failed to load student profile.");
    } finally {
      setLoadingStudent(false);
    }
  };

  const loadBooks = async (q) => {
    setLoadingBooks(true);
    try {
      const res = await libraryService.getBooks(q ? { search: q } : {});
      setBooks(asList(res.data));
    } catch (err) {
      console.error("Failed to load books:", err);
      toast.error("Failed to load books.");
    } finally {
      setLoadingBooks(false);
    }
  };

  const loadIssues = async () => {
    setLoadingIssues(true);
    try {
      const res = await libraryService.getIssues();
      setIssues(asList(res.data));
    } catch (err) {
      console.error("Failed to load issues:", err);
      toast.error("Failed to load book issues.");
    } finally {
      setLoadingIssues(false);
    }
  };

  useEffect(() => {
    loadBooks();
    loadIssues();
    classSectionService.getClassSections().then((res) => setClassSections(asList(res.data))).catch(() => {});
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => loadBooks(search), 350);
    return () => clearTimeout(handle);
  }, [search]);

  const handleSaveBook = async () => {
    if (!bookForm.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSavingBook(true);
    try {
      await libraryService.createBook(bookForm);
      toast.success("Book added.");
      setShowBookModal(false);
      setBookForm(emptyBookForm);
      loadBooks(search);
    } catch (err) {
      console.error("Failed to add book:", err);
      toast.error("Failed to add book.");
    } finally {
      setSavingBook(false);
    }
  };

  const openCopies = async (book) => {
    setCopiesBook(book);
    setNewAccession("");
    try {
      const res = await libraryService.getCopies(book.id);
      setCopies(asList(res.data));
    } catch (err) {
      console.error("Failed to load copies:", err);
      toast.error("Failed to load copies.");
    }
  };

  const handleAddCopy = async () => {
    if (!newAccession.trim()) {
      toast.error("Accession number is required.");
      return;
    }
    setAddingCopy(true);
    try {
      await libraryService.createCopy({ book: copiesBook.id, accession_number: newAccession.trim() });
      toast.success("Copy added.");
      setNewAccession("");
      const res = await libraryService.getCopies(copiesBook.id);
      setCopies(asList(res.data));
      loadBooks(search);
    } catch (err) {
      console.error("Failed to add copy:", err);
      toast.error(err?.response?.data?.accession_number?.[0] || "Failed to add copy — accession number may already exist.");
    } finally {
      setAddingCopy(false);
    }
  };

  const openIssueModal = () => {
    setIssueForm(emptyIssueForm);
    setSectionStudents([]);
    setAvailableCopies([]);
    setShowIssueModal(true);
  };

  const handleClassSectionChange = async (classSectionId) => {
    setIssueForm((p) => ({ ...p, class_section: classSectionId, student: "" }));
    if (!classSectionId) {
      setSectionStudents([]);
      return;
    }
    try {
      const res = await studentService.getStudents({ class_section: classSectionId });
      setSectionStudents(asList(res.data));
    } catch (err) {
      console.error("Failed to load students:", err);
      toast.error("Failed to load students for this class.");
    }
  };

  const handleBookChangeForIssue = async (bookId) => {
    if (!bookId) {
      setAvailableCopies([]);
      return;
    }
    try {
      const res = await libraryService.getCopies(bookId);
      setAvailableCopies(asList(res.data).filter((c) => c.status === "available"));
    } catch (err) {
      console.error("Failed to load available copies:", err);
    }
  };

  const handleIssue = async () => {
    if (!issueForm.student || !issueForm.accession_number || !issueForm.due_date) {
      toast.error("Student, book copy and due date are all required.");
      return;
    }
    setSaving(true);
    try {
      await libraryService.createIssue({
        book_copy: Number(issueForm.accession_number),
        borrower: Number(issueForm.student),
        due_date: issueForm.due_date,
      });
      toast.success("Book issued.");
      setShowIssueModal(false);
      loadIssues();
      loadBooks(search);
    } catch (err) {
      console.error("Failed to issue book:", err);
      toast.error(err?.response?.data?.error || "Failed to issue book — the copy may already be issued.");
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async (issue) => {
    setActingId(issue.id);
    try {
      const res = await libraryService.returnBook(issue.id);
      const fine = res.data.fine_amount;
      toast.success(fine && Number(fine) > 0 ? `Returned — fine of Rs. ${fine} applies.` : "Returned, no fine.");
      loadIssues();
      loadBooks(search);
    } catch (err) {
      console.error("Failed to return book:", err);
      toast.error(err?.response?.data?.error || "Failed to mark as returned.");
    } finally {
      setActingId(null);
    }
  };

  const classSectionOptions = useMemo(() => classSections.map((cs) => ({ label: classSectionLabel(cs), value: String(cs.id) })), [classSections]);
  const studentOptions = useMemo(
    () => sectionStudents.map((s) => ({ label: `${s.full_name || s.name} (${s.admission_number || s.admission_no})`, value: String(s.id) })),
    [sectionStudents]
  );
  const bookOptionsForIssue = useMemo(() => books.map((b) => ({ label: b.title, value: String(b.id) })), [books]);
  const copyOptions = useMemo(() => availableCopies.map((c) => ({ label: c.accession_number, value: String(c.id) })), [availableCopies]);

  const bookColumns = [
    { header: "Title", accessor: (row) => <span className="font-semibold text-ink-900">{row.title}</span> },
    { header: "Author", accessor: (row) => row.author || "—" },
    { header: "Category", accessor: (row) => row.category || "—" },
    { header: "Copies", accessor: (row) => `${row.available_copies} / ${row.total_copies} available` },
    {
      header: "Actions",
      accessor: (row) => (
        <button type="button" onClick={() => openCopies(row)} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer">
          <BookOpen size={13} className="inline mr-1" />
          Copies
        </button>
      ),
    },
  ];

  const issueColumns = [
    { header: "Book", accessor: "book_title" },
    {
      header: "Borrower",
      accessor: (row) => (
        <button
          type="button"
          onClick={() => openStudentProfile(row.student_id, row.borrower_name)}
          className="font-bold text-violet-700 hover:text-violet-900 hover:underline cursor-pointer text-left inline-flex items-center gap-1"
        >
          {row.borrower_name}
        </button>
      ),
    },
    { header: "Issued", accessor: "issued_date" },
    { header: "Due", accessor: "due_date" },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`inline-flex items-center text-[11.5px] font-bold rounded-full px-2.5 py-0.5 ${row.status === "returned" ? "bg-success-tint text-success-hex" : row.is_overdue ? "bg-error-tint text-error-hex" : "bg-warning-tint text-warning-hex"}`}>
          {row.status === "returned" ? "RETURNED" : row.is_overdue ? `OVERDUE (${row.days_overdue}d)` : "ISSUED"}
        </span>
      ),
    },
    { header: "Fine", accessor: (row) => (Number(row.fine_amount) > 0 ? `Rs. ${row.fine_amount}` : "—") },
    {
      header: "Actions",
      accessor: (row) =>
        row.status === "issued" ? (
          <button type="button" onClick={() => handleReturn(row)} disabled={actingId === row.id} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer">
            <Undo2 size={13} className="inline mr-1" />
            Return
          </button>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Library</h1>
          <p className="text-ink-500 text-[13px] mt-1">Books catalog, copies and issue/return tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "books" ? "primary" : "outline"} size="compact" onClick={() => setTab("books")}>
            Books
          </Button>
          <Button variant={tab === "issues" ? "primary" : "outline"} size="compact" onClick={() => setTab("issues")}>
            Issues
          </Button>
        </div>
      </div>

      {tab === "books" && (
        <>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or author…"
              className="flex-1 min-w-[220px] max-w-[320px] h-[38px] px-4 text-[13px] bg-white border border-cn-border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
            />
            {isAdmin && (
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowBookModal(true)}>
                Add book
              </Button>
            )}
          </div>
          <Table columns={bookColumns} data={books} loading={loadingBooks} emptyMessage="No books in the catalog yet" />
        </>
      )}

      {tab === "issues" && (
        <>
          <div className="flex justify-end mb-4">
            <Button variant="primary" icon={<Plus size={16} />} onClick={openIssueModal}>
              Issue a book
            </Button>
          </div>
          <Table columns={issueColumns} data={issues} loading={loadingIssues} emptyMessage="No books issued yet" />
        </>
      )}

      {/* Add Book Modal */}
      <Modal isOpen={showBookModal} onClose={() => setShowBookModal(false)} title="Add book">
        <div className="flex flex-col gap-3 w-[360px] max-w-full">
          <BlackInputField label="Title" fieldName="title" value={bookForm.title} onChange={(e) => setBookForm((p) => ({ ...p, title: e.target.value }))} required />
          <BlackInputField label="Author" fieldName="author" value={bookForm.author} onChange={(e) => setBookForm((p) => ({ ...p, author: e.target.value }))} />
          <div className="flex gap-3">
            <BlackInputField label="ISBN" fieldName="isbn" value={bookForm.isbn} onChange={(e) => setBookForm((p) => ({ ...p, isbn: e.target.value }))} />
            <BlackInputField label="Category" fieldName="category" value={bookForm.category} onChange={(e) => setBookForm((p) => ({ ...p, category: e.target.value }))} />
          </div>
          <BlackInputField label="Publisher" fieldName="publisher" value={bookForm.publisher} onChange={(e) => setBookForm((p) => ({ ...p, publisher: e.target.value }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowBookModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveBook} loading={savingBook}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Copies Modal */}
      <Modal isOpen={!!copiesBook} onClose={() => setCopiesBook(null)} title={`Copies — ${copiesBook?.title || ""}`}>
        <div className="flex flex-col gap-3 w-[400px] max-w-full">
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {copies.length === 0 && <p className="text-ink-400 text-[13px] py-3 text-center">No copies registered yet.</p>}
            {copies.map((c) => (
              <div key={c.id} className="flex flex-col border border-cn-border rounded-xl p-3 bg-white gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-violet-950">{c.accession_number}</span>
                  <span
                    className={`text-[11px] font-bold uppercase rounded-full px-2.5 py-0.5 ${
                      c.status === "available"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : c.current_issue?.is_overdue
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {c.status === "available"
                      ? "AVAILABLE"
                      : c.current_issue?.is_overdue
                      ? `OVERDUE (${c.current_issue.days_overdue}d)`
                      : "ISSUED"}
                  </span>
                </div>

                {c.status === "issued" && c.current_issue && (
                  <div className="text-[12px] bg-violet-50/50 rounded-lg p-2.5 mt-0.5 border border-violet-100/80 flex flex-col gap-1">
                    <div className="flex items-center justify-between text-ink-700">
                      <span className="text-ink-500 font-medium text-[11.5px]">Issued to:</span>
                      <button
                        type="button"
                        onClick={() => openStudentProfile(c.current_issue.student_id, c.current_issue.borrower_name)}
                        className="font-bold text-violet-700 hover:text-violet-900 hover:underline cursor-pointer text-right"
                      >
                        {c.current_issue.borrower_name}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-500">Issued on: {c.current_issue.issued_date}</span>
                      <span className={c.current_issue.is_overdue ? "text-rose-600 font-bold" : "text-ink-600 font-medium"}>
                        Due: {c.current_issue.due_date}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {isAdmin && (
            <div className="flex gap-2 pt-2 border-t border-cn-border">
              <BlackInputField fieldName="accession" placeholder="New accession number" value={newAccession} onChange={(e) => setNewAccession(e.target.value)} />
              <Button variant="primary" onClick={handleAddCopy} loading={addingCopy}>
                Add
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Issue Modal */}
      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title="Issue a book">
        <div className="flex flex-col gap-3 w-[340px] max-w-full">
          <SelectBox label="Book" fieldName="book" value={issueForm.book} onChange={(e) => { setIssueForm((p) => ({ ...p, book: e.target.value, accession_number: "" })); handleBookChangeForIssue(e.target.value); }} options={bookOptionsForIssue} />
          <SelectBox
            label="Copy (available only)"
            fieldName="accession_number"
            value={issueForm.accession_number}
            onChange={(e) => setIssueForm((p) => ({ ...p, accession_number: e.target.value }))}
            options={copyOptions.length ? copyOptions : [{ label: "No available copies", value: "" }]}
          />
          <SelectBox label="Class" fieldName="class_section" value={issueForm.class_section} onChange={(e) => handleClassSectionChange(e.target.value)} options={classSectionOptions} />
          <SelectBox
            label="Student"
            fieldName="student"
            value={issueForm.student}
            onChange={(e) => setIssueForm((p) => ({ ...p, student: e.target.value }))}
            options={studentOptions.length ? studentOptions : [{ label: "Pick a class first", value: "" }]}
          />
          <BlackInputField label="Due date" fieldName="due_date" type="date" value={issueForm.due_date} onChange={(e) => setIssueForm((p) => ({ ...p, due_date: e.target.value }))} required />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowIssueModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleIssue} loading={saving}>
              Issue
            </Button>
          </div>
        </div>
      </Modal>

      {/* Student Profile Quick View Modal */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="Student Profile">
        <div className="flex flex-col gap-4 w-[420px] max-w-full">
          {loadingStudent ? (
            <div className="py-8 text-center text-ink-500 text-sm">Loading student profile…</div>
          ) : selectedStudent ? (
            <div className="flex flex-col gap-4">
              {/* Card Header */}
              <div className="flex items-center gap-3.5 bg-violet-50/60 p-4 rounded-xl border border-violet-100">
                <div className="w-12 h-12 rounded-full bg-violet-700 text-white font-extrabold text-lg flex items-center justify-center shadow-xs shrink-0">
                  {(selectedStudent.full_name || selectedStudent.name || "S").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-base text-violet-950 truncate">
                      {selectedStudent.full_name || selectedStudent.name}
                    </h3>
                    <span className="text-[10.5px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedStudent.status || "Active"}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-violet-800 font-medium mt-0.5">
                    Admission No: <span className="font-bold">{selectedStudent.admission_number || selectedStudent.admission_no || "—"}</span>
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                <div className="bg-cn-surface border border-cn-border rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-ink-400 text-[11px] font-semibold uppercase">Class & Section</span>
                  <span className="font-bold text-ink-900">{selectedStudent.class_section_name || `Class ${selectedStudent.class_section}`}</span>
                </div>

                <div className="bg-cn-surface border border-cn-border rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-ink-400 text-[11px] font-semibold uppercase">Roll Number</span>
                  <span className="font-bold text-ink-900">{selectedStudent.roll_number || "—"}</span>
                </div>

                <div className="bg-cn-surface border border-cn-border rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-ink-400 text-[11px] font-semibold uppercase">Gender & DOB</span>
                  <span className="font-bold text-ink-900">
                    {selectedStudent.gender || "—"} • {selectedStudent.date_of_birth || "—"}
                  </span>
                </div>

                <div className="bg-cn-surface border border-cn-border rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-ink-400 text-[11px] font-semibold uppercase">Blood Group</span>
                  <span className="font-bold text-ink-900">{selectedStudent.blood_group || "—"}</span>
                </div>
              </div>

              {/* Location / City */}
              {(selectedStudent.current_city || selectedStudent.current_state) && (
                <div className="bg-cn-surface border border-cn-border rounded-xl p-3 flex flex-col gap-1 text-[12.5px]">
                  <span className="text-ink-400 text-[11px] font-semibold uppercase">Location</span>
                  <span className="font-bold text-ink-900">
                    {[selectedStudent.current_city, selectedStudent.current_state, selectedStudent.current_pincode].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end gap-2 pt-2 border-t border-cn-border">
                <Button variant="outline" onClick={() => setShowProfileModal(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowProfileModal(false);
                    navigate(`/students/${selectedStudent.id}/progress`);
                  }}
                >
                  View Academic Progress →
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-ink-500 text-sm">No profile data found.</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Library;
