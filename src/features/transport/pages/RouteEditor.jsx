import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Button from "../../../components/Button";
import api from "../../../services/api";
import useUser from "../../auth/hooks/useUser";

const RouteEditor = () => {
  const { user } = useUser();
  const profile = user?.data;
  const roleName = profile?.role || "Admin";

  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [stopsByRoute, setStopsByRoute] = useState({});
  const [dragIndex, setDragIndex] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);

  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");

  const fetchRoutesAndStops = async () => {
    setLoading(true);
    try {
      const routesRes = await api.get("transport/routes/");
      const fetchedRoutes = Array.isArray(routesRes.data) ? routesRes.data : routesRes.data?.results || [];

      const adaptedRoutes = fetchedRoutes.map((r) => ({
        id: r.id,
        name: r.name,
        status: r.is_active ? "ACTIVE" : "INACTIVE",
        bus: r.vehicle_number || "No bus assigned",
        driver: "Assigned Driver",
        students: 0,
        stops: [],
        arrival: "Arrive 8:00 AM",
      }));

      setRoutes(adaptedRoutes);

      const stopsData = {};
      for (const route of adaptedRoutes) {
        const stopsRes = await api.get("transport/stops/", { params: { route: route.id } });
        const fetchedStops = Array.isArray(stopsRes.data) ? stopsRes.data : stopsRes.data?.results || [];

        stopsData[route.id] = fetchedStops
          .sort((a, b) => a.sequence - b.sequence)
          .map((s) => ({
            id: s.id,
            name: s.name,
            coords: `${s.lat || "0.0"}, ${s.lng || "0.0"}`,
            time: s.expected_time || "7:00 AM",
            count: s.expected_count || 0,
          }));
      }
      setStopsByRoute(stopsData);

      if (adaptedRoutes.length > 0) {
        setSelectedRouteId(adaptedRoutes[0].id);
      }
    } catch (err) {
      console.error("Failed to load routes/stops:", err);
      toast.error("Failed to load transport details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutesAndStops();
  }, []);

  useEffect(() => {
    const fetchChildren = async () => {
      if (roleName === "Parent") {
        try {
          const res = await api.get("students/");
          const kids = Array.isArray(res.data) ? res.data : res.data?.results || [];
          setChildren(kids);
          if (kids.length > 0) {
            setSelectedChildId(String(kids[0].id));
          }
        } catch (err) {
          console.error("Failed to fetch children:", err);
        }
      }
    };
    fetchChildren();
  }, [roleName]);

  useEffect(() => {
    if (roleName === "Parent" && selectedChildId && children.length > 0) {
      const activeChild = children.find((c) => String(c.id) === selectedChildId);
      if (activeChild && activeChild.bus_route) {
        setSelectedRouteId(activeChild.bus_route);
      }
    }
  }, [selectedChildId, children, roleName]);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);
  const stops = stopsByRoute[selectedRouteId] || [];

  const handleDrop = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setStopsByRoute((prev) => {
      const list = [...(prev[selectedRouteId] || [])];
      const [moved] = list.splice(dragIndex, 1);
      list.splice(targetIndex, 0, moved);
      return { ...prev, [selectedRouteId]: list };
    });
    setDragIndex(null);
    setDirty(true);
  };

  const handleRemoveStop = (stopId) => {
    setStopsByRoute((prev) => ({
      ...prev,
      [selectedRouteId]: (prev[selectedRouteId] || []).filter((s) => s.id !== stopId),
    }));
    setDirty(true);
  };

  const handleAddStop = () => {
    const newStop = { id: `new-${Date.now()}`, name: "New stop", coords: "—", time: "—", count: 0 };
    setStopsByRoute((prev) => ({ ...prev, [selectedRouteId]: [...(prev[selectedRouteId] || []), newStop] }));
    setDirty(true);
  };

  const handleSave = () => {
    // TODO: persist stop order/time changes once a bus-route/stop endpoint exists.
    toast.success("Stop order saved locally (no transport endpoint in contract yet to persist this).");
    setDirty(false);
  };

  if (loading) {
    return (
      <div className="w-full text-center py-20 text-sm text-ink-400">
        Loading transport details...
      </div>
    );
  }

  if (routes.length === 0 && roleName === "Parent") {
    return (
      <div className="w-full">
        <div className="pb-4 border-b border-cn-border mb-6">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Routes &amp; stops</h1>
        </div>
        <div className="bg-cn-surface border border-cn-border rounded-2xl p-10 text-center text-ink-400 text-sm">
          No transport routes registered for your children.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-cn-border mb-6 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-heading font-bold text-2xl text-violet-950">Routes &amp; stops</h1>
          <p className="text-ink-500 text-[13px] mt-1">
            {roleName === "Parent" ? "Assigned school bus routes for your children" : `${routes.length} buses configured`}
          </p>
        </div>
        <div className="flex-1" />
        {roleName !== "Parent" && <Button variant="primary">+ New route</Button>}
      </div>

      {roleName === "Parent" && children.length > 0 && (
        <div className="flex items-center gap-3.5 mb-6 bg-violet-50/70 border border-violet-100 rounded-2xl p-4">
          <span className="text-[13.5px] font-bold text-violet-950">Select Child:</span>
          <div className="flex gap-2">
            {children.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setSelectedChildId(String(child.id))}
                className={`px-4 py-1.5 rounded-xl text-[12.5px] font-bold transition cursor-pointer ${
                  selectedChildId === String(child.id)
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-white border border-cn-border text-ink-700 hover:bg-slate-50"
                }`}
              >
                {child.full_name || child.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Route list */}
        <div className="w-full lg:w-[300px] flex flex-col gap-2.5 shrink-0">
          {routes.map((route) => {
            const isSelected = route.id === selectedRouteId;
            const isDraft = route.status === "DRAFT";
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setSelectedRouteId(route.id)}
                className={`text-left bg-cn-surface rounded-2xl p-4 border transition cursor-pointer ${
                  isSelected ? "border-violet-600 shadow-[0_6px_18px_rgba(109,40,217,.1)]" : "border-cn-border"
                } ${isDraft ? "opacity-70" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex-1 text-[14px] font-bold text-ink-900 truncate">{route.name}</span>
                  <span
                    className={`rounded-lg px-2 py-0.5 text-[10.5px] font-extrabold ${
                      isDraft ? "bg-cn-bg border border-cn-border text-ink-400" : "bg-success-tint border border-green-200 text-success-hex"
                    }`}
                  >
                    {route.status}
                  </span>
                </div>
                <div className="text-[12px] text-ink-500 mt-1.5">
                  {route.bus ? `${route.bus} · ${stopsByRoute[route.id]?.length || 0} stops` : "No bus assigned"}
                </div>
              </button>
            );
          })}
          {roleName !== "Parent" && (
            <div className="bg-violet-50 rounded-xl p-3 text-[12px] text-violet-900 leading-relaxed">
              Changing a stop time notifies affected parents and the conductor before the next trip.
            </div>
          )}
        </div>

        {/* Route detail */}
        <div className="flex-1 w-full bg-cn-surface border border-cn-border rounded-2xl flex flex-col overflow-hidden">
          {!selectedRoute ? (
            <div className="p-10 text-center text-ink-400 text-sm">Select a route to view its stops.</div>
          ) : (
            <>
              <div className="p-5 border-b border-cn-border flex items-center gap-3.5 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold text-[16px] text-ink-900 truncate">
                    {selectedRoute.name} · morning pickup
                  </div>
                  <div className="text-[12px] text-ink-500 mt-0.5">{selectedRoute.arrival || "No timing configured yet"}</div>
                </div>
                <span className="h-9 rounded-xl border border-cn-border text-violet-900 flex items-center px-3.5 text-[12.5px] font-bold">
                  {selectedRoute.bus || "Bus —"}
                </span>
                {roleName !== "Parent" && (
                  <span className="h-9 rounded-xl border border-cn-border text-violet-900 flex items-center px-3.5 text-[12.5px] font-bold">
                    {selectedRoute.driver || "Driver —"} ▾
                  </span>
                )}
              </div>

              <div className="flex-1 p-5 flex flex-col gap-2 overflow-y-auto custom-scrollbar-light">
                {stops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    draggable={roleName !== "Parent"}
                    onDragStart={roleName !== "Parent" ? () => setDragIndex(idx) : undefined}
                    onDragOver={roleName !== "Parent" ? (e) => e.preventDefault() : undefined}
                    onDrop={roleName !== "Parent" ? () => handleDrop(idx) : undefined}
                    className="flex items-center gap-3.5"
                  >
                    <div className="flex flex-col items-center w-3.5 shrink-0 self-stretch">
                      <span className="w-3 h-3 rounded-full bg-violet-700 shrink-0" />
                      {idx < stops.length - 1 && <span className="w-0.5 flex-1 bg-violet-200 mt-1" />}
                    </div>
                    <div className={`flex-1 border border-cn-border rounded-2xl px-4 py-3 flex items-center gap-3.5 transition ${roleName !== "Parent" ? "cursor-move hover:border-violet-300" : ""}`}>
                      {roleName !== "Parent" && <span className="text-violet-300 text-base shrink-0">⠿</span>}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-bold text-ink-900 truncate">{stop.name}</div>
                        <div className="text-[11.5px] text-ink-500">{stop.coords}</div>
                      </div>
                      <span className="border border-cn-border rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-ink-900 shrink-0">
                        {stop.time}
                      </span>
                      {roleName !== "Parent" && (
                        <>
                          <span className="text-[12px] text-ink-500 w-[74px] text-right shrink-0">
                            <b className="text-ink-900">{stop.count}</b> students
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStop(stop.id)}
                            className="text-[12px] font-bold text-error-hex shrink-0 cursor-pointer"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {stops.length === 0 && <div className="text-ink-400 text-sm py-6 text-center">No stops on this route yet.</div>}

                {roleName !== "Parent" && (
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="mt-2 self-start border border-dashed border-violet-300 rounded-2xl px-4 py-2.5 text-violet-700 text-[13px] font-bold cursor-pointer hover:bg-violet-50 transition flex items-center gap-2"
                  >
                    <span className="text-base leading-none">+</span> Add stop
                  </button>
                )}
              </div>

              {roleName !== "Parent" && (
                <div className="border-t border-cn-border px-5 py-3.5 flex items-center gap-3 bg-cn-bg">
                  <span className="text-[12.5px] text-ink-500">{dirty ? "Unsaved changes" : "All changes saved"}</span>
                  <div className="flex-1" />
                  <Button variant="outline" onClick={() => setDirty(false)} disabled={!dirty}>
                    Discard
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={!dirty}>
                    Save &amp; notify parents
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteEditor;
