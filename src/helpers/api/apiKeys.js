const apiKeys = {
  login: "admin/login",
  sendOTP: "admin/request-otp",
  verifyOTP:"admin/verify-otp",
  updatePassword: "admin/reset-password",
  updateEmail: "admin/profile",

  //dietitian management
  dietitianList: "admin/dietitians",
  dietitianRequests: "admin/dietitian-requests",
  verifyDietitian: "admin/dietitians/verify",
  toggleDietitianStatus: "admin/toggle-block-dietitian",
  deleteDietitian: "admin/delete-dietitian",

  //diet chart requests
  dietFormRequests: "admin/diet-form-requests",
  dietFormPreview: "admin/diet-form-requests", // usage: apiGet("dietFormPreview", `/${id}/preview`)

  //user management
  existingUserList: "admin/existing-users",
  changeUserStatus: "admin/toggle-block-user",
  removeUser: "admin/delete-user",
  getUserCompleteDetails: "admin/user/",

  //profile
  profile: "admin/profile",

  //change password
  changePassword: "admin/change-password",

};

export default apiKeys;
