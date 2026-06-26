import API from "../helpers/api";

export const getAdminProfile = async () => {
  try {
    const response = await API.apiGet("profile");
    const apiResponse = response.data;
    if (apiResponse.success && apiResponse.data) {
      return { success: true, data: apiResponse.data, message: apiResponse.message };
    }
    return { success: false, data: null, message: apiResponse.message || "Failed to fetch profile" };
  } catch (error) {
    throw error;
  }
};

export const updateAdminProfile = async (profileData) => {
  try {
    const response = await API.apiPut("profile", profileData);
    const apiResponse = response.data;
    if (apiResponse.success) {
      return { success: true, data: apiResponse.data, message: apiResponse.message };
    }
    return { success: false, data: null, message: apiResponse.message || "Failed to update profile" };
  } catch (error) {
    throw error;
  }
};
