const apiKeys = {
  login: "admin/login",
  refreshToken: "admin/refresh-token",
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
  registerDietitian: "admin/dietitians/register",
  awsKeys: "dietitian/aws-keys",

  //diet chart requests
  dietFormRequests: "admin/diet-form-requests",
  dietFormPreview: "admin/diet-form-requests", // usage: apiGet("dietFormPreview", `/${id}/preview`)
  paidDietCharts: "admin/paid-diet-charts",

  dashboardStats: "admin/dashboard-stats",
  dashboardRevenue: "admin/dashboard-revenue",
  dashboardUserGrowth: "admin/dashboard-user-growth",
  dashboardConsultations: "admin/dashboard-consultations",
  systemOverview: "admin/system-overview",

  //user management
  existingUserList: "admin/existing-users",
  changeUserStatus: "admin/toggle-block-user",
  removeUser: "admin/delete-user",
  getUserCompleteDetails: "admin/user/",

  //profile
  profile: "admin/profile",

  //change password
  changePassword: "admin/change-password",

  //coupon management
  coupons: "admin/coupons",

  // AI-generated diet plans (new flow: form → AI → admin review → send)
  aiDietPlans: "admin/diet-plans",

  // Earnings
  earnings: "admin/earnings",

  // Broadcast email
  broadcastRecipients: "admin/broadcast/recipients",
  broadcastSend: "admin/broadcast/send",
  broadcastHistory: "admin/broadcast/history",
  broadcastDetail: "admin/broadcast/history",

  // Career
  careerJobs: "admin/career/jobs",
  careerApplications: "admin/career/applications",
};

export default apiKeys;
