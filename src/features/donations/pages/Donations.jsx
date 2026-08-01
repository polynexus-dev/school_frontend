import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { HeartHandshake, Plus, FileCheck, Download, Paperclip } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import BlackInputField from "../../../components/BlackInputField";
import SelectBox from "../../../components/SelectBox";
import Pagination from "../../../components/Pagination";
import usePaginatedList from "../../../hooks/usePaginatedList";
import donationService from "../services/donationService";
import accountingService from "../../accounting/services/accountingService";
import AttachmentsModal from "../../accounting/components/AttachmentsModal";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const MODES = [
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Net Banking", value: "net_banking" },
  { label: "Cheque", value: "cheque" },
];

const DONATION_TYPES = [
  { label: "General / Other (Non-Corpus)", value: "general" },
  { label: "Corpus", value: "corpus" },
  { label: "Specific Grant", value: "specific_grant" },
];

const ID_TYPES = [
  { label: "PAN", value: "pan" },
  { label: "Aadhaar", value: "aadhaar" },
  { label: "Passport", value: "passport" },
  { label: "Driving License", value: "driving_license" },
  { label: "Elector's Photo ID", value: "election_id" },
  { label: "Ration Card", value: "ration_card" },
  { label: "Other", value: "other" },
];

const DONATION_TYPE_LABEL = { general: "General", corpus: "Corpus", specific_grant: "Specific Grant" };

const emptyForm = {
  donor_name: "", donor_pan: "", donor_id_type: "pan", donor_id_number: "", donor_address: "", donor_contact: "",
  amount: "", date: new Date().toISOString().slice(0, 10), mode: "cash", purpose: "",
  donation_type: "general", is_anonymous: false, is_80g_eligible: true, related_party: "",
};

const Donations = () => {
  const {
    items: donations,
    page,
    setPage,
    totalPages,
    count,
    pageSize,
    loading,
    refetch,
  } = usePaginatedList(donationService.getDonations);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [trustees, setTrustees] = useState([]);

  const [compliantDonation, setCompliantDonation] = useState(null); // Donation being 10BD/10BE-managed
  const [attachingDonation, setAttachingDonation] = useState(null);
  const [ackNumber, setAckNumber] = useState("");
  const [acting, setActing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    accountingService.getTrustees({ page_size: 200, is_active: true })
      .then((res) => setTrustees(asList(res.data)))
      .catch((err) => console.error("Failed to load trustees:", err));
  }, []);

  const trusteeOptions = useMemo(() => [{ label: "None", value: "" }, ...trustees.map((t) => ({ label: t.name, value: String(t.id) }))], [trustees]);

  const totalOnPage = donations.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const handleSave = async () => {
    if (!form.donor_name.trim() || !form.amount || !form.date) {
      toast.error("Donor name, amount and date are required.");
      return;
    }
    setSaving(true);
    try {
      await donationService.createDonation({
        ...form,
        amount: Number(form.amount),
        donor_pan: form.donor_pan || null,
        donor_id_number: form.donor_id_type === "pan" ? null : form.donor_id_number || null,
        related_party: form.related_party ? Number(form.related_party) : null,
      });
      toast.success("Donation recorded and posted to the ledger.");
      setShowModal(false);
      setForm(emptyForm);
      refetch();
    } catch (err) {
      console.error("Failed to record donation:", err);
      toast.error(err?.response?.data?.error || "Failed to record donation.");
    } finally {
      setSaving(false);
    }
  };

  const openComplianceModal = (donation) => {
    setCompliantDonation(donation);
    setAckNumber(donation.form_10bd_acknowledgment_number || "");
  };

  const handleRecordAck = async () => {
    if (!ackNumber.trim()) {
      toast.error("Enter the Form 10BD acknowledgment number.");
      return;
    }
    setActing(true);
    try {
      const res = await donationService.recordForm10BDAck(compliantDonation.id, ackNumber.trim());
      toast.success("Form 10BD acknowledgment recorded.");
      setCompliantDonation(res.data);
      refetch();
    } catch (err) {
      console.error("Failed to record 10BD acknowledgment:", err);
      toast.error(err?.response?.data?.error || "Failed to record acknowledgment.");
    } finally {
      setActing(false);
    }
  };

  const handleDownloadCertificate = async () => {
    setDownloading(true);
    try {
      await donationService.downloadCertificate10BE(compliantDonation.id, compliantDonation.receipt_number);
      toast.success("10BE certificate downloaded.");
    } catch (err) {
      console.error("Failed to download 10BE certificate:", err);
      toast.error(err?.response?.data?.error || "Failed to download certificate.");
    } finally {
      setDownloading(false);
    }
  };

  const columns = [
    { header: "Receipt #", accessor: "receipt_number" },
    { header: "Date", accessor: "date" },
    { header: "Donor", accessor: "donor_name" },
    { header: "PAN", accessor: (row) => row.donor_pan || "-" },
    { header: "Amount", accessor: (row) => `₹${Number(row.amount).toLocaleString("en-IN")}` },
    { header: "Type", accessor: (row) => DONATION_TYPE_LABEL[row.donation_type] || row.donation_type },
    { header: "Mode", accessor: (row) => row.mode.replace("_", " ") },
    {
      header: "80G",
      accessor: (row) => (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${row.is_80g_eligible ? "bg-success-tint text-success-hex" : "bg-cn-bg text-ink-400"}`}>
          {row.is_80g_eligible ? "Eligible" : "Not eligible"}
        </span>
      ),
    },
    {
      header: "10BD/10BE",
      accessor: (row) => (
        <button type="button" onClick={() => openComplianceModal(row)} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer inline-flex items-center gap-1">
          <FileCheck size={13} /> {row.form_10bd_acknowledgment_number ? "Filed" : "Manage"}
        </button>
      ),
    },
    {
      header: "Files",
      accessor: (row) => (
        <button type="button" onClick={() => setAttachingDonation(row)} className="text-ink-500 hover:text-violet-700 cursor-pointer" title="Attachments">
          <Paperclip size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <HeartHandshake size={22} className="text-violet-700" />
            Donations
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">12A/80G donation register &amp; Form 10BD/10BE compliance</p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowModal(true)}>
          Record donation
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
          <div className="font-heading font-extrabold text-2xl text-ink-900">{count}</div>
          <div className="text-[13px] text-ink-500 mt-1 font-medium">Total donations</div>
        </div>
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-5">
          <div className="font-heading font-extrabold text-2xl text-ink-900">₹{totalOnPage.toLocaleString("en-IN")}</div>
          <div className="text-[13px] text-ink-500 mt-1 font-medium">Total received (this page)</div>
        </div>
      </div>

      <Table columns={columns} data={donations} loading={loading} emptyMessage="No donations recorded yet" />
      <Pagination page={page} totalPages={totalPages} count={count} pageSize={pageSize} onPageChange={setPage} loading={loading} />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record donation">
        <div className="flex flex-col gap-3.5 w-[420px] max-w-full">
          <BlackInputField label="Donor name" fieldName="donor_name" value={form.donor_name} onChange={(e) => setForm((p) => ({ ...p, donor_name: e.target.value }))} required />
          <BlackInputField label="Donor address (optional)" fieldName="donor_address" value={form.donor_address} onChange={(e) => setForm((p) => ({ ...p, donor_address: e.target.value }))} />
          <BlackInputField label="Donor contact (optional)" fieldName="donor_contact" value={form.donor_contact} onChange={(e) => setForm((p) => ({ ...p, donor_contact: e.target.value }))} />

          <div className="flex gap-3">
            <SelectBox label="Donor ID type" fieldName="donor_id_type" value={form.donor_id_type} onChange={(e) => setForm((p) => ({ ...p, donor_id_type: e.target.value }))} options={ID_TYPES} />
            {form.donor_id_type === "pan" ? (
              <BlackInputField label="Donor PAN" fieldName="donor_pan" value={form.donor_pan} onChange={(e) => setForm((p) => ({ ...p, donor_pan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" />
            ) : (
              <BlackInputField label="ID number" fieldName="donor_id_number" value={form.donor_id_number} onChange={(e) => setForm((p) => ({ ...p, donor_id_number: e.target.value }))} />
            )}
          </div>

          <div className="flex gap-3">
            <BlackInputField label="Amount (₹)" fieldName="amount" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
            <BlackInputField label="Date" fieldName="date" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
          </div>
          <div className="flex gap-3">
            <SelectBox label="Mode" fieldName="mode" value={form.mode} onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))} options={MODES} />
            <SelectBox label="Type of donation" fieldName="donation_type" value={form.donation_type} onChange={(e) => setForm((p) => ({ ...p, donation_type: e.target.value }))} options={DONATION_TYPES} />
          </div>
          <BlackInputField label="Purpose (optional)" fieldName="purpose" value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} placeholder="e.g. Library Fund" />
          <SelectBox
            label="Related party (optional)" fieldName="related_party" value={form.related_party}
            onChange={(e) => setForm((p) => ({ ...p, related_party: e.target.value }))} options={trusteeOptions}
          />

          <label className="flex items-center gap-2 text-[13px] text-ink-700 cursor-pointer">
            <input type="checkbox" checked={form.is_80g_eligible} onChange={(e) => setForm((p) => ({ ...p, is_80g_eligible: e.target.checked }))} />
            80G eligible
          </label>
          <label className="flex items-center gap-2 text-[13px] text-ink-700 cursor-pointer">
            <input type="checkbox" checked={form.is_anonymous} onChange={(e) => setForm((p) => ({ ...p, is_anonymous: e.target.checked }))} />
            Anonymous donation (no donor identity maintained — Sec 115BBC)
          </label>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!compliantDonation} onClose={() => setCompliantDonation(null)} title={`Form 10BD/10BE · ${compliantDonation?.receipt_number || ""}`}>
        <div className="flex flex-col gap-3.5 w-[380px] max-w-full">
          <p className="text-[12.5px] text-ink-500">
            Once Form 10BD has been filed for this donation on the income tax e-filing portal, record the acknowledgment number here to unlock the Form 10BE donor certificate.
          </p>
          <BlackInputField
            label="Form 10BD acknowledgment / ARN"
            fieldName="ack_number"
            value={ackNumber}
            onChange={(e) => setAckNumber(e.target.value)}
            placeholder="e.g. ARN2026070112345"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleRecordAck} loading={acting}>
              Save acknowledgment
            </Button>
          </div>
          <div className="pt-3 border-t border-cn-border">
            <Button
              variant="primary" icon={<Download size={15} />} onClick={handleDownloadCertificate}
              loading={downloading} disabled={!compliantDonation?.form_10bd_acknowledgment_number}
            >
              Download 10BE certificate
            </Button>
            {!compliantDonation?.form_10bd_acknowledgment_number && (
              <p className="text-[11.5px] text-error-hex mt-2">Record the acknowledgment number first.</p>
            )}
          </div>
        </div>
      </Modal>

      <AttachmentsModal
        isOpen={!!attachingDonation} onClose={() => setAttachingDonation(null)}
        recordType="donation" recordId={attachingDonation?.id}
        title={`Attachments · ${attachingDonation?.receipt_number || ""}`}
      />
    </div>
  );
};

export default Donations;
