import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Search, Plus } from "lucide-react";
import Button from "../../../components/Button";
import BlackInputField from "../../../components/BlackInputField";
import guardianService from "../services/guardianService";

// Scaffold page — layout matches "Admin Web.dc.html" screen 4 (parent–student
// linking manager). Pending requests + guardian search are wired to the real
// GET /api/guardian-links/ and GET /api/guardians/ endpoints. There is no
// PATCH/PUT endpoint for guardian-links in the confirmed contract yet, so
// Approve/Reject/Ask-for-ID only update local UI state — TODO once an
// approval endpoint exists. Creating a brand-new link (the "+ New link" form)
// IS fully wired, since POST /api/guardian-links/ is confirmed.

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

const emptyNewLinkForm = { guardian_id: "", student_id: "", relationship: "Mother", is_primary: true };

const GuardianLinking = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selectedGuardian, setSelectedGuardian] = useState(null);
  const [familyLinks, setFamilyLinks] = useState([]);
  const [loadingFamily, setLoadingFamily] = useState(false);

  const [showNewLinkForm, setShowNewLinkForm] = useState(false);
  const [newLinkForm, setNewLinkForm] = useState(emptyNewLinkForm);
  const [creatingLink, setCreatingLink] = useState(false);

  const fetchPendingLinks = async () => {
    setLoading(true);
    try {
      const res = await guardianService.getGuardianLinks({ status: "pending" });
      let list = asList(res.data);
      // Defensive fallback in case the backend doesn't yet support ?status=
      // filtering and just returns everything.
      list = list.filter((l) => !l.status || l.status === "pending");
      setLinks(list);
    } catch (err) {
      console.error("Failed to load guardian links:", err);
      toast.error("Failed to load pending guardian requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLinks();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await guardianService.getGuardians({ search: searchQuery });
        setSearchResults(asList(res.data));
      } catch (err) {
        console.error("Guardian search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const loadFamilyDetail = async (guardian) => {
    setSelectedGuardian(guardian);
    setLoadingFamily(true);
    try {
      const res = await guardianService.getGuardianLinks({ guardian: guardian.id });
      setFamilyLinks(asList(res.data));
    } catch (err) {
      console.error("Failed to load family detail:", err);
      toast.error("Failed to load family detail.");
    } finally {
      setLoadingFamily(false);
    }
  };

  const [approvingAll, setApprovingAll] = useState(false);

  const handleApprove = async (linkId) => {
    try {
      await guardianService.verifyGuardianLink(linkId);
      toast.success("Guardian link approved.");
      fetchPendingLinks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve link.");
    }
  };

  const handleReject = async (linkId) => {
    try {
      await guardianService.rejectGuardianLink(linkId);
      toast.success("Guardian link rejected.");
      fetchPendingLinks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject link.");
    }
  };

  const handleApproveAll = async () => {
    if (visibleLinks.length === 0) return;
    setApprovingAll(true);
    try {
      await Promise.all(visibleLinks.map((link) => guardianService.verifyGuardianLink(link.id)));
      toast.success("All guardian links approved.");
      fetchPendingLinks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve some links.");
      fetchPendingLinks();
    } finally {
      setApprovingAll(false);
    }
  };

  const handleDismiss = (linkId, action) => {
    if (action === "approved") {
      handleApprove(linkId);
    } else if (action === "rejected") {
      handleReject(linkId);
    } else {
      toast.info(`Marked as "${action}" locally.`);
    }
  };

  const visibleLinks = links.filter((l) => !dismissedIds.includes(l.id));

  const handleCreateLink = async () => {
    if (!newLinkForm.guardian_id || !newLinkForm.student_id) {
      toast.error("Guardian ID and Student ID are both required.");
      return;
    }
    setCreatingLink(true);
    try {
      await guardianService.createGuardianLink({
        guardian: Number(newLinkForm.guardian_id),
        student: Number(newLinkForm.student_id),
        relationship: newLinkForm.relationship,
        is_primary: newLinkForm.is_primary,
      });
      toast.success("Guardian link created.");
      setNewLinkForm(emptyNewLinkForm);
      setShowNewLinkForm(false);
      fetchPendingLinks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create guardian link.");
    } finally {
      setCreatingLink(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <h1 className="font-heading font-bold text-2xl text-violet-950">Parent–student linking</h1>
        <div className="relative w-[280px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parent, student, phone…"
            className="w-full h-[38px] pl-9 pr-3 text-[13px] bg-white border border-cn-border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-cn-border rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto custom-scrollbar-light">
              {searching && <div className="p-3 text-xs text-ink-400">Searching…</div>}
              {!searching && searchResults.length === 0 && (
                <div className="p-3 text-xs text-ink-400">No guardians found.</div>
              )}
              {searchResults.map((g) => (
                <div
                  key={g.id}
                  onClick={() => {
                    loadFamilyDetail(g);
                    setSearchQuery("");
                  }}
                  className="p-2.5 text-[13px] font-semibold text-ink-900 hover:bg-violet-50 cursor-pointer"
                >
                  {g.full_name || g.name} <span className="text-ink-400 font-normal">· {g.phone}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1" />
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowNewLinkForm((p) => !p)}>
          New link
        </Button>
      </div>

      {showNewLinkForm && (
        <div className="bg-cn-surface border border-violet-200 rounded-2xl p-5 mb-6 flex flex-col gap-3">
          <span className="font-heading font-semibold text-[15px] text-ink-900">Create a new guardian link</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <BlackInputField
              label="Guardian ID"
              fieldName="guardian_id"
              value={newLinkForm.guardian_id}
              onChange={(e) => setNewLinkForm((p) => ({ ...p, guardian_id: e.target.value }))}
              placeholder="e.g. 42"
            />
            <BlackInputField
              label="Student ID"
              fieldName="student_id"
              value={newLinkForm.student_id}
              onChange={(e) => setNewLinkForm((p) => ({ ...p, student_id: e.target.value }))}
              placeholder="e.g. 108"
            />
            <BlackInputField
              label="Relationship"
              fieldName="relationship"
              value={newLinkForm.relationship}
              onChange={(e) => setNewLinkForm((p) => ({ ...p, relationship: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink-700 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={newLinkForm.is_primary}
              onChange={(e) => setNewLinkForm((p) => ({ ...p, is_primary: e.target.checked }))}
            />
            Primary guardian
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewLinkForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateLink} loading={creatingLink}>
              Create link
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Pending requests */}
        <div className="flex-1 w-full flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-heading font-semibold text-[15px] text-ink-900">Pending requests</span>
              <span className="bg-warning-tint border border-amber-200 text-warning-hex rounded-lg px-2 py-0.5 text-[11.5px] font-extrabold">
                {visibleLinks.length}
              </span>
            </div>
            {visibleLinks.length > 0 && (
              <button
                type="button"
                onClick={handleApproveAll}
                disabled={approvingAll}
                className="text-xs text-violet-700 hover:text-violet-950 font-bold cursor-pointer hover:underline disabled:opacity-55"
              >
                {approvingAll ? "Approving all..." : "Approve all"}
              </button>
            )}
          </div>

          {loading && <div className="text-ink-400 text-sm">Loading…</div>}
          {!loading && visibleLinks.length === 0 && (
            <div className="bg-cn-surface border border-cn-border rounded-2xl p-6 text-center text-ink-400 text-sm">
              No pending guardian-link requests.
            </div>
          )}

          {visibleLinks.map((link) => {
            const guardianName = link.guardian?.full_name || link.guardian_name || `Guardian #${link.guardian}`;
            const studentName = link.student?.full_name || link.student_name || `Student #${link.student}`;
            const phoneMismatch = link.phone_match_flag === false || link.phone_mismatch;
            return (
              <div
                key={link.id}
                className={`bg-cn-surface rounded-2xl p-4 flex flex-col gap-3 border ${
                  phoneMismatch ? "border-amber-300" : "border-cn-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0"
                    style={{ background: "linear-gradient(135deg, #0891B2, #67E8F9)" }}
                  >
                    {initialsOf(guardianName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-ink-900 truncate">
                      {guardianName} · claims {link.relationship || "Guardian"}
                    </div>
                    <div className="text-[12px] text-ink-500 truncate">
                      requests link to <b className="text-ink-900">{studentName}</b>
                    </div>
                  </div>
                </div>

                {phoneMismatch && (
                  <div className="bg-warning-tint rounded-lg p-2.5 text-[12px] text-warning-hex font-semibold leading-relaxed">
                    ⚠ Phone number does not match admission records. Verify ID at the office before approving.
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="compact" onClick={() => handleDismiss(link.id, "rejected")}>
                    Reject
                  </Button>
                  {phoneMismatch && (
                    <Button variant="secondary" className="flex-1" size="compact" onClick={() => handleDismiss(link.id, "ask for ID")}>
                      Ask for ID
                    </Button>
                  )}
                  <Button variant="primary" className="flex-1" size="compact" onClick={() => handleDismiss(link.id, "approved")}>
                    Approve
                  </Button>
                </div>
              </div>
            );
          })}

          <div className="bg-violet-50 rounded-xl p-3 text-[12px] text-violet-900 leading-relaxed">
            Every approval is logged with the admin's name and time once the approval endpoint is wired. Unlinking
            removes the parent's access instantly.
          </div>
        </div>

        {/* Family detail */}
        <div className="flex-[1.1] w-full bg-cn-surface border border-cn-border rounded-2xl p-6 flex flex-col gap-4">
          {!selectedGuardian ? (
            <div className="flex-1 flex items-center justify-center text-ink-400 text-sm text-center py-16">
              Search for a guardian above to view their linked children and activity.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3.5">
                <div
                  className="w-13 h-13 rounded-2xl flex items-center justify-center font-heading font-bold text-white text-lg shrink-0"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", width: 52, height: 52 }}
                >
                  {initialsOf(selectedGuardian.full_name || selectedGuardian.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold text-[17px] text-ink-900 truncate">
                    {selectedGuardian.full_name || selectedGuardian.name}
                  </div>
                  <div className="text-[12.5px] text-ink-500 mt-0.5 truncate">
                    {selectedGuardian.relationship || "Guardian"} · {selectedGuardian.phone || "—"}
                  </div>
                </div>
              </div>

              <div className="text-[11.5px] font-extrabold text-ink-500 tracking-wide">
                LINKED CHILDREN · {loadingFamily ? "…" : familyLinks.length}
              </div>
              <div className="flex flex-col gap-2.5">
                {familyLinks.map((link) => (
                  <div key={link.id} className="border border-cn-border rounded-2xl p-3.5 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center font-bold text-white text-[13px] shrink-0"
                      style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
                    >
                      {initialsOf(link.student?.full_name || link.student_name || "?")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-bold text-ink-900 truncate">
                        {link.student?.full_name || link.student_name || `Student #${link.student}`}
                      </div>
                      <div className="text-[11.5px] text-ink-500">
                        {link.is_primary ? "Primary guardian" : "Secondary guardian"}
                        {link.pickup_only ? " · pickup-only" : ""}
                      </div>
                    </div>
                  </div>
                ))}
                {!loadingFamily && familyLinks.length === 0 && (
                  <div className="text-ink-400 text-sm">No linked children found for this guardian.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuardianLinking;
