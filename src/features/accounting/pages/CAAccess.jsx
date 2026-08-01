import React, { useState } from "react";
import { toast } from "react-toastify";
import { UserCog, Plus } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import auditorService from "../services/auditorService";

const emptyForm = { username: "", email: "", first_name: "", last_name: "", password: "", firm_name: "", membership_number: "", contact_number: "" };

const CAAccess = () => {
  const {
    items: auditors,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(auditorService.getAuditors);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleInvite = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      toast.error("Username and a temporary password are required.");
      return;
    }
    setSaving(true);
    try {
      await auditorService.inviteAuditor({
        user: { username: form.username, email: form.email, first_name: form.first_name, last_name: form.last_name, password: form.password },
        firm_name: form.firm_name || null,
        membership_number: form.membership_number || null,
        contact_number: form.contact_number || null,
      });
      toast.success("CA account created. Share the username/password with them securely.");
      setShowModal(false);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      console.error("Failed to invite CA:", err);
      toast.error(err?.response?.data?.error || "Failed to create CA account.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (auditor) => {
    try {
      await auditorService.updateAuditor(auditor.id, { status: auditor.status === "active" ? "inactive" : "active" });
      toast.success(auditor.status === "active" ? "CA access revoked." : "CA access restored.");
      refetch();
    } catch (err) {
      console.error("Failed to update CA status:", err);
      toast.error("Failed to update CA status.");
    }
  };

  const columns = [
    { header: "Name", accessor: (row) => `${row.user_detail?.first_name || ""} ${row.user_detail?.last_name || ""}`.trim() || row.user_detail?.username },
    { header: "Username", accessor: (row) => row.user_detail?.username },
    { header: "Email", accessor: (row) => row.user_detail?.email || "-" },
    { header: "Firm", accessor: (row) => row.firm_name || "-" },
    { header: "Membership No.", accessor: (row) => row.membership_number || "-" },
    {
      header: "Access",
      accessor: (row) => (
        <button
          type="button" onClick={() => handleToggleActive(row)}
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${row.status === "active" ? "bg-success-tint text-success-hex" : "bg-cn-bg text-ink-400"}`}
        >
          {row.status === "active" ? "Active" : "Revoked"}
        </button>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <UserCog size={22} className="text-violet-700" />
            CA / Auditor Access
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">
            Give your Chartered Accountant a read-only login for reports, the audit package, and compliance documents — no access to students, HR, or any other module.
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Invite CA
        </Button>
      </div>

      <Table columns={columns} data={auditors} loading={loading} emptyMessage="No CA accounts created yet" />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Invite CA / Auditor">
        <div className="flex flex-col gap-3.5 w-[380px] max-w-full">
          <div className="flex gap-3">
            <BlackInputField label="First name" fieldName="first_name" value={form.first_name} onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} />
            <BlackInputField label="Last name" fieldName="last_name" value={form.last_name} onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))} />
          </div>
          <BlackInputField label="Username" fieldName="username" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} required />
          <BlackInputField label="Email" fieldName="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          <BlackInputField label="Temporary password" fieldName="password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
          <BlackInputField label="Firm name (optional)" fieldName="firm_name" value={form.firm_name} onChange={(e) => setForm((p) => ({ ...p, firm_name: e.target.value }))} />
          <div className="flex gap-3">
            <BlackInputField label="ICAI membership # (optional)" fieldName="membership_number" value={form.membership_number} onChange={(e) => setForm((p) => ({ ...p, membership_number: e.target.value }))} />
            <BlackInputField label="Contact number (optional)" fieldName="contact_number" value={form.contact_number} onChange={(e) => setForm((p) => ({ ...p, contact_number: e.target.value }))} />
          </div>
          <p className="text-[11.5px] text-ink-400">This account can only view financial reports, download the audit package, and view compliance documents — nothing else, and no editing anywhere.</p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleInvite} loading={saving}>Create CA account</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CAAccess;
