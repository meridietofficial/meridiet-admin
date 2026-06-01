export const routesConfig = {
  "/": {
    path: "/",
    redirect: "/",
    protected: false,
    //   access: [TALENT_ROLE],
  },
  "/dashboard": {
    path: "/dashboard",
    redirect: "/dashboard",
    protected: true,
    access: [TALENT_ROLE],
  },
  "/my-jobs": {
    path: "/my-jobs",
    redirect: "/",
    protected: true,
    access: [TALENT_ROLE],
  },
  "/chats": {
    path: "/chats",
    redirect: "/",
    protected: true,
    access: [TALENT_ROLE],
  },
  "/chats/[id]": {
    path: "/chats/[id]",
    redirect: "/",
    protected: true,
    access: [TALENT_ROLE],
  },
  "/payment": {
    path: "/payment",
    redirect: "/",
    protected: true,
    access: [TALENT_ROLE],
  },
  "/profile": {
    path: "/profile",
    redirect: "/",
    protected: true,
    access: [TALENT_ROLE],
  },
  "/notifications": {
    path: "/notifications",
    redirect: "/",
    protected: true,
    access: [TALENT_ROLE],
  },
  "/settings": {
    path: "/settings",
    redirect: "/",
    protected: true,
    access: [TALENT_ROLE],
  },
  "/help-support": {
    path: "/help-support",
    redirect: "/",
    protected: true,
    access: [TALENT_ROLE],
  },
  "/logout": {
    path: "/logout",
    redirect: "/",
    protected: true,
    access: [TALENT_ROLE],
  },
};
