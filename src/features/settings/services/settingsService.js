import api from "../../../services/api";

/**
 * Change the logged in user's password.
 */
export const changePassword = async ({ old_password, new_password }) => {
  const response = await api.post("change-password/", { old_password, new_password });
  return response.data;
};

/**
 * Fetch tenant school profile and branding settings.
 */
export const getSchoolProfile = async () => {
  const response = await api.get("school-profile/");
  return response.data;
};

/**
 * Update tenant school profile (Name, Contact Email, Address, Timezone, Permitted Domain).
 */
export const updateSchoolProfile = async (profileData) => {
  const response = await api.patch("school-profile/", profileData);
  return response.data;
};

/**
 * Fetch academic years.
 */
export const getAcademicYears = async () => {
  const response = await api.get("academic-years/");
  return response.data;
};

/**
 * Create an academic year.
 */
export const createAcademicYear = async (data) => {
  const response = await api.post("academic-years/", data);
  return response.data;
};

/**
 * Fetch class sections.
 */
export const getClassSections = async () => {
  const response = await api.get("class-sections/");
  return response.data;
};

/**
 * Create a class section.
 */
export const createClassSection = async (data) => {
  const response = await api.post("class-sections/", data);
  return response.data;
};

/**
 * Fetch subjects.
 */
export const getSubjects = async () => {
  const response = await api.get("subjects/");
  return response.data;
};

/**
 * Create a subject.
 */
export const createSubject = async (data) => {
  const response = await api.post("subjects/", data);
  return response.data;
};
