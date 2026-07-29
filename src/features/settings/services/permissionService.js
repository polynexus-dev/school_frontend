import api from "../../../services/api";

/**
 * Fetch all staff members and their current delegated module permissions.
 * Accessible by School Admin / Principal / Management.
 */
export const getStaffPermissions = async () => {
  const response = await api.get("/staff-permissions/");
  return response.data;
};

/**
 * Grant or withdraw module permissions for a specific staff member.
 * @param {number} userId - The staff user's ID.
 * @param {Array<string>} grantedModules - List of module keys to grant.
 */
export const updateStaffPermission = async (userId, grantedModules) => {
  const response = await api.put(`/staff-permissions/${userId}/`, {
    granted_modules: grantedModules,
  });
  return response.data;
};
