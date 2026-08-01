import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Plus, Undo2, Boxes } from "lucide-react";
import Button from "../../../components/Button";
import Table from "../../../components/Table";
import Modal from "../../../components/Modal";
import SelectBox from "../../../components/SelectBox";
import BlackInputField from "../../../components/BlackInputField";
import inventoryService from "../services/inventoryService";

const asList = (data) => (Array.isArray(data) ? data : data?.results || []);

const STATUS_TONE = {
  available: "bg-success-tint text-success-hex",
  assigned: "bg-violet-50 text-violet-700",
  under_repair: "bg-warning-tint text-warning-hex",
  retired: "bg-cn-bg text-ink-400",
};

const emptyCategoryForm = { name: "", description: "" };
const emptyAssetForm = { asset_tag: "", name: "", category: "", serial_number: "", location: "", purchase_date: "", purchase_cost: "", useful_life_years: "", depreciation_method: "straight_line", salvage_value: "0" };

const DEPRECIATION_METHODS = [
  { label: "Straight Line", value: "straight_line" },
  { label: "Written Down Value", value: "written_down_value" },
];
const emptyAssignForm = { asset: "", assigned_to_label: "", notes: "" };

const Inventory = () => {
  const [tab, setTab] = useState("assets");

  const [categories, setCategories] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [actingId, setActingId] = useState(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetForm, setAssetForm] = useState(emptyAssetForm);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState(emptyAssignForm);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    try {
      const res = await inventoryService.getCategories();
      setCategories(asList(res.data));
    } catch (err) {
      console.error("Failed to load asset categories:", err);
    }
  };

  const loadAssets = async (category) => {
    setLoadingAssets(true);
    try {
      const res = await inventoryService.getAssets(category ? { category } : {});
      setAssets(asList(res.data));
    } catch (err) {
      console.error("Failed to load assets:", err);
      toast.error("Failed to load assets.");
    } finally {
      setLoadingAssets(false);
    }
  };

  const loadAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const res = await inventoryService.getAssignments({ active: "1" });
      setAssignments(asList(res.data));
    } catch (err) {
      console.error("Failed to load asset assignments:", err);
      toast.error("Failed to load asset assignments.");
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadAssets();
    loadAssignments();
  }, []);

  useEffect(() => {
    loadAssets(categoryFilter);
  }, [categoryFilter]);

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    setSaving(true);
    try {
      await inventoryService.createCategory(categoryForm);
      toast.success("Category added.");
      setShowCategoryModal(false);
      setCategoryForm(emptyCategoryForm);
      loadCategories();
    } catch (err) {
      console.error("Failed to add category:", err);
      toast.error("Failed to add category — that name may already exist.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsset = async () => {
    if (!assetForm.asset_tag.trim() || !assetForm.name.trim() || !assetForm.category) {
      toast.error("Asset tag, name and category are required.");
      return;
    }
    setSaving(true);
    try {
      await inventoryService.createAsset({
        ...assetForm,
        category: Number(assetForm.category),
        purchase_cost: assetForm.purchase_cost || null,
        purchase_date: assetForm.purchase_date || null,
        useful_life_years: assetForm.useful_life_years || null,
        salvage_value: assetForm.salvage_value || 0,
      });
      toast.success("Asset added.");
      setShowAssetModal(false);
      setAssetForm(emptyAssetForm);
      loadAssets(categoryFilter);
    } catch (err) {
      console.error("Failed to add asset:", err);
      toast.error(err?.response?.data?.asset_tag?.[0] || "Failed to add asset — that asset tag may already be in use.");
    } finally {
      setSaving(false);
    }
  };

  const openAssignModal = (asset) => {
    setAssignForm({ asset: String(asset.id), assigned_to_label: "", notes: "" });
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!assignForm.asset || !assignForm.assigned_to_label.trim()) {
      toast.error("Asset and an assignee/location are both required.");
      return;
    }
    setSaving(true);
    try {
      await inventoryService.createAssignment({
        asset: Number(assignForm.asset),
        location: assignForm.assigned_to_label.trim(),
        notes: assignForm.notes || null,
      });
      toast.success("Asset assigned.");
      setShowAssignModal(false);
      loadAssignments();
      loadAssets(categoryFilter);
    } catch (err) {
      console.error("Failed to assign asset:", err);
      toast.error(err?.response?.data?.[0] || "Failed to assign — this asset may already have an active assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async (assignment) => {
    if (!window.confirm(`Mark ${assignment.asset_label} as returned?`)) return;
    setActingId(assignment.id);
    try {
      await inventoryService.returnAssignment(assignment.id);
      toast.success("Asset marked as returned.");
      loadAssignments();
      loadAssets(categoryFilter);
    } catch (err) {
      console.error("Failed to return asset:", err);
      toast.error("Failed to return asset.");
    } finally {
      setActingId(null);
    }
  };

  const categoryOptions = useMemo(() => categories.map((c) => ({ label: c.name, value: String(c.id) })), [categories]);
  const categoryFilterOptions = useMemo(() => [{ label: "All categories", value: "" }, ...categoryOptions], [categoryOptions]);
  const assetOptions = useMemo(
    () => assets.filter((a) => a.status !== "assigned").map((a) => ({ label: `${a.asset_tag} — ${a.name}`, value: String(a.id) })),
    [assets]
  );

  const assetColumns = [
    { header: "Tag", accessor: "asset_tag" },
    { header: "Name", accessor: "name" },
    { header: "Category", accessor: "category_name" },
    { header: "Location", accessor: "location" },
    {
      header: "Status",
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_TONE[row.status] || ""}`}>
          {row.status.replace("_", " ")}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: (row) =>
        row.status === "available" ? (
          <button type="button" onClick={() => openAssignModal(row)} className="text-[11.5px] font-bold text-violet-700 hover:underline cursor-pointer">
            Assign
          </button>
        ) : null,
    },
  ];

  const assignmentColumns = [
    { header: "Asset", accessor: "asset_label" },
    { header: "Assigned to", accessor: (row) => row.assigned_to_name || row.location || "-" },
    { header: "Assigned on", accessor: "assigned_on" },
    {
      header: "Actions",
      accessor: (row) => (
        <button type="button" onClick={() => handleReturn(row)} disabled={actingId === row.id} className="text-[11.5px] font-bold text-error-hex hover:underline cursor-pointer">
          <Undo2 size={13} className="inline mr-1" />
          Return
        </button>
      ),
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950 flex items-center gap-2">
            <Boxes size={22} className="text-violet-700" />
            Inventory
          </h1>
          <p className="text-ink-500 text-[13px] mt-1">Asset register and assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "assets" ? "primary" : "outline"} size="compact" onClick={() => setTab("assets")}>
            Assets
          </Button>
          <Button variant={tab === "assignments" ? "primary" : "outline"} size="compact" onClick={() => setTab("assignments")}>
            Assignments
          </Button>
        </div>
      </div>

      {tab === "assets" && (
        <>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <SelectBox className="w-56" label="" fieldName="category_filter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={categoryFilterOptions} />
            <Button variant="outline" icon={<Plus size={16} />} onClick={() => setShowCategoryModal(true)}>
              Add category
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowAssetModal(true)}>
              Add asset
            </Button>
          </div>
          <Table columns={assetColumns} data={assets} loading={loadingAssets} emptyMessage="No assets registered yet" />
        </>
      )}

      {tab === "assignments" && (
        <Table columns={assignmentColumns} data={assignments} loading={loadingAssignments} emptyMessage="No active assignments" />
      )}

      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="Add asset category">
        <div className="flex flex-col gap-3 w-[300px] max-w-full">
          <BlackInputField label="Name" fieldName="name" value={categoryForm.name} onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} required />
          <BlackInputField label="Description" fieldName="description" value={categoryForm.description} onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveCategory} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAssetModal} onClose={() => setShowAssetModal(false)} title="Add asset">
        <div className="flex flex-col gap-3 w-[340px] max-w-full">
          <BlackInputField label="Asset tag" fieldName="asset_tag" value={assetForm.asset_tag} onChange={(e) => setAssetForm((p) => ({ ...p, asset_tag: e.target.value }))} required />
          <BlackInputField label="Name" fieldName="name" value={assetForm.name} onChange={(e) => setAssetForm((p) => ({ ...p, name: e.target.value }))} required />
          <SelectBox label="Category" fieldName="category" value={assetForm.category} onChange={(e) => setAssetForm((p) => ({ ...p, category: e.target.value }))} options={categoryOptions} required />
          <BlackInputField label="Serial number" fieldName="serial_number" value={assetForm.serial_number} onChange={(e) => setAssetForm((p) => ({ ...p, serial_number: e.target.value }))} />
          <BlackInputField label="Location" fieldName="location" value={assetForm.location} onChange={(e) => setAssetForm((p) => ({ ...p, location: e.target.value }))} />
          <BlackInputField label="Purchase date" fieldName="purchase_date" type="date" value={assetForm.purchase_date} onChange={(e) => setAssetForm((p) => ({ ...p, purchase_date: e.target.value }))} />
          <BlackInputField label="Purchase cost" fieldName="purchase_cost" type="number" value={assetForm.purchase_cost} onChange={(e) => setAssetForm((p) => ({ ...p, purchase_cost: e.target.value }))} />
          <BlackInputField label="Useful life (years, optional)" fieldName="useful_life_years" type="number" value={assetForm.useful_life_years} onChange={(e) => setAssetForm((p) => ({ ...p, useful_life_years: e.target.value }))} placeholder="Leave blank to exclude from depreciation" />
          <SelectBox label="Depreciation method" fieldName="depreciation_method" value={assetForm.depreciation_method} onChange={(e) => setAssetForm((p) => ({ ...p, depreciation_method: e.target.value }))} options={DEPRECIATION_METHODS} />
          <BlackInputField label="Salvage value" fieldName="salvage_value" type="number" value={assetForm.salvage_value} onChange={(e) => setAssetForm((p) => ({ ...p, salvage_value: e.target.value }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowAssetModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAsset} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign asset">
        <div className="flex flex-col gap-3 w-[320px] max-w-full">
          <SelectBox label="Asset" fieldName="asset" value={assignForm.asset} onChange={(e) => setAssignForm((p) => ({ ...p, asset: e.target.value }))} options={assetOptions} />
          <BlackInputField
            label="Assign to (staff name or room)"
            fieldName="assigned_to_label"
            value={assignForm.assigned_to_label}
            onChange={(e) => setAssignForm((p) => ({ ...p, assigned_to_label: e.target.value }))}
            required
          />
          <BlackInputField label="Notes" fieldName="notes" value={assignForm.notes} onChange={(e) => setAssignForm((p) => ({ ...p, notes: e.target.value }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssign} loading={saving}>
              Assign
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;
