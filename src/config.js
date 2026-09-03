export const APP_CONFIG = {
  appName: "tridorian Course Catalog",
  brandName: "TRIDORIAN",
  tagline: "The next generation Agentic SDLC course platform.",
  adminEmails: [
    "taylor.granstaff@tridorian.com",
    "taylor@tridorian.com"
  ],
  allowedDomains: [], // empty allows any Google account
  previewModuleLimitPercent: 0.20, // 20% of modules free/previewable without login
  googleClientId: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID) || "601897044120-nv8j0idm63m92us8189sbulev16m2js2.apps.googleusercontent.com",
  enableAiTheming: true,
  defaultThemeModel: "gemini-2.5-flash",
  proxyUrl: (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PROXY_URL) || "/api"
};
