import api from "../../../services/api";

// GET/POST/PUT/DELETE /api/hostel/hostels/, /rooms/, /allocations/ — all
// Admin-only (HostelAllocationViewSet has no Teacher access at all).
const getHostels = async () => {
  const response = await api.get("hostel/hostels/");
  return { status: response.status, data: response.data };
};

const createHostel = async (payload) => {
  const response = await api.post("hostel/hostels/", payload);
  return { status: response.status, data: response.data };
};

const getRooms = async (hostelId) => {
  const response = await api.get("hostel/rooms/", { params: { hostel: hostelId } });
  return { status: response.status, data: response.data };
};

const createRoom = async (payload) => {
  const response = await api.post("hostel/rooms/", payload);
  return { status: response.status, data: response.data };
};

const getAllocations = async (params = {}) => {
  const response = await api.get("hostel/allocations/", { params });
  return { status: response.status, data: response.data };
};

const createAllocation = async (payload) => {
  const response = await api.post("hostel/allocations/", payload);
  return { status: response.status, data: response.data };
};

const vacateAllocation = async (id, notes) => {
  const response = await api.post(`hostel/allocations/${id}/vacate/`, notes ? { notes } : {});
  return { status: response.status, data: response.data };
};

const hostelService = { getHostels, createHostel, getRooms, createRoom, getAllocations, createAllocation, vacateAllocation };

export default hostelService;
