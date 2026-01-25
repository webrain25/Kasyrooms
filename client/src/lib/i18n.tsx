import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Lang = "it" | "en" | "fr" | "de" | "es";

export const translations: Record<Lang, Record<string, string>> = {
  en: {
    // Header
    favorites: "Favorites",
    login: "Log in",
    signup: "Sign up",
    becomeModel: "Become a Model",
    logout: "Logout",
    welcome: "Welcome",
    searchPlaceholder: "Search models...",
    // Filters (alias)
    "filters.online": "Online",
    "filters.top": "Top Rated",
    "filters.new": "New Models",
    "filters.trending": "Trending",
    "filters.favorites": "Favorites",
    // Filters
    "filter.online": "Online Now",
    "filter.top": "Top Rated",
    "filter.new": "New Models",
    "filter.trending": "Trending",
    "filter.favorites": "Favorites",
    
    // Hero/Buttons
    browseModels: "Browse Models",
    startPrivateShow: "Start Private Show",
    startChat: "Start Chat",
    viewAll: "View all",
    
    // Pages
    allModels: "All Models",
    "models.subtitle": "Discover all our amazing models",
    noModelsFound: "No models found",
    clearFilters: "Clear Filters",
    helpCenter: "Help Center",
    contactUs: "Contact Us",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    cookiePolicy: "Cookie Policy",
    becomeAModel: "Become a Model",
    yourFavorites: "Your Favorites",
    noFavoritesYet: "No favorites yet",
    tapHeartToAdd: "Tap the heart on a model to add to favorites",
    
    // Login/Register
    welcomeBack: "Welcome Back",
    signInToAccount: "Sign in to your account to access premium content",
    username: "Username",
    email: "Email",
    password: "Password",
    enterUsername: "Enter your username",
    enterPassword: "Enter your password",
    signingIn: "Signing in...",
    signIn: "Sign In",
    dontHaveAccount: "Don't have an account?",
    signUpHere: "Sign up here",
    loginSuccessful: "Login successful",
    loginFailed: "Login failed",
    invalidCredentials: "Use username 'testuser' with any password",

    // Register page
    "register.title": "Join Kasyrooms",
    "register.subtitle": "Create your account to access exclusive content",
    "register.firstName": "First name",
    "register.firstName.placeholder": "Jane",
    "register.lastName": "Last name",
    "register.lastName.placeholder": "Doe",
    "register.dob": "Date of birth",
    "register.username.placeholder": "Choose a username",
    "register.email.placeholder": "Enter your email",
    "register.password.placeholder": "Create a password",
    "register.confirmPassword": "Confirm Password",
    "register.confirmPassword.placeholder": "Confirm your password",
    "register.creating": "Creating account…",
    "register.create": "Create Account",
    "register.haveAccount": "Already have an account?",
    "register.signInHere": "Sign in here",
    "register.toast.passwordMismatch.title": "Password mismatch",
    "register.toast.passwordMismatch.desc": "Passwords do not match",
    "register.toast.accountCreated.title": "Account created",
    "register.toast.accountCreated.desc": "Welcome to Kasyrooms!",
    "register.toast.failed.title": "Registration failed",
    "register.toast.failed.desc": "Please try again later",
    
    // Model info
    yearsOld: "years old",
    watching: "watching",
    languages: "Languages",
    specialties: "Specialties",
    online: "Online",
    offline: "Offline",

    // Not Found
    "notFound.title": "404 Page Not Found",
    "notFound.subtitle": "The page you're looking for doesn't exist.",

    // Age gate modal
    "ageCompliance.modal.title": "Confirm age",
    "ageCompliance.modal.body": "This site contains adult content. Do you confirm you are at least 18 years old (or legal age in your country)?",
    "ageCompliance.modal.yes": "Yes, I'm 18+",
    "ageCompliance.modal.no": "No",
    "ageCompliance.modal.blocked": "Session ended. To access content you must be at least 18 years old.",
    "ageCompliance.modal.exit": "Exit",

    // KYC
    "kyc.title": "KYC Onboarding",
    "kyc.loggedAs": "Logged as",
    "kyc.validation.title": "Validation",
    "kyc.validation.fullName": "Full name required",
    "kyc.validation.docType": "Select a document type",
    "kyc.submitted.title": "Submitted",
    "kyc.submitted.desc": "KYC application created. You can now upload images.",
    "kyc.submissionFailed.title": "Submission failed",
    "kyc.upload.missingApp.title": "Missing application",
    "kyc.upload.missingApp.desc": "Submit the KYC form first to get an application ID.",
    "kyc.upload.noFile.title": "No file selected",
    "kyc.upload.noFile.desc": "Choose an image file to upload.",
    "kyc.uploaded.title": "Uploaded",
    "kyc.uploaded.descSuffix": "uploaded successfully.",
    "kyc.upload.kind.front": "Front",
    "kyc.upload.kind.back": "Back",
    "kyc.upload.kind.selfie": "Selfie",
    "kyc.uploadFailed.title": "Upload failed",
    "kyc.form.fullName": "Full Name",
    "kyc.form.fullName.placeholder": "Jane Doe",
    "kyc.form.dob": "Date of Birth",
    "kyc.form.country": "Country",
    "kyc.form.country.placeholder": "Country",
    "kyc.form.docType": "Document Type",
    "kyc.form.docType.select": "Select…",
    "kyc.form.docType.passport": "Passport",
    "kyc.form.docType.idCard": "ID Card",
    "kyc.form.docType.driver": "Driver License",
    "kyc.form.docFrontUrl": "Document Front URL",
    "kyc.form.docBackUrl": "Document Back URL",
    "kyc.form.selfieUrl": "Selfie URL",
    "kyc.form.url.placeholder": "https://...",
    "kyc.form.notes": "Notes (optional)",
    "kyc.form.notes.placeholder": "Anything to add",
    "kyc.form.submit": "Submit Application",
    "kyc.form.submitting": "Submitting…",
    "kyc.applicationId": "Application ID",
    "kyc.noImage": "No image",
    "kyc.upload": "Upload",
    "kyc.uploading": "Uploading…",

    // DMCA Submit
    "dmcaSubmit.title": "Submit a DMCA Takedown Notice",
    "dmcaSubmit.validation.title": "Validation",
    "dmcaSubmit.validation.noUrls": "Add at least one infringing URL.",
    "dmcaSubmit.submitted.title": "Submitted",
    "dmcaSubmit.submitted.desc": "DMCA notice submitted. We'll review shortly.",
    "dmcaSubmit.failed.title": "Submission failed",
    "dmcaSubmit.form.name": "Your Name",
    "dmcaSubmit.form.email": "Your Email",
    "dmcaSubmit.form.originalUrl": "Original Content URL",
    "dmcaSubmit.form.infringingUrls": "Infringing URLs (one per line or comma-separated)",
    "dmcaSubmit.form.signature": "Signature (type your full name)",
    "dmcaSubmit.form.notes": "Additional Notes (optional)",
    "dmcaSubmit.form.submit": "Submit Notice",
    "dmcaSubmit.form.submitting": "Submitting…",
    "dmcaSubmit.placeholder.name": "Jane Doe",
    "dmcaSubmit.placeholder.email": "you@example.com",
    "dmcaSubmit.placeholder.originalUrl": "https://your-site.com/original",
    "dmcaSubmit.placeholder.infringingUrls": "https://example.com/infringing-1\nhttps://example.com/infringing-2",
    "dmcaSubmit.placeholder.signature": "Jane Doe",
    "dmcaSubmit.placeholder.notes": "Context or clarification",

    // Model profile
    "modelProfile.notFound.title": "Model Not Found",
    "modelProfile.notFound.subtitle": "The model you're looking for doesn't exist.",
    "modelProfile.goBack": "Go Back",
    "modelProfile.unavailable": "Unavailable",
    "modelProfile.busy": "Busy",
    "modelProfile.blocked": "Blocked",
    "modelProfile.sendMessage.title": "Send a Message",
    "modelProfile.sendMessage.placeholder": "Type your message",
    "modelProfile.sendMessage.sending": "Sending…",
    "modelProfile.sendMessage.send": "Send",
    "modelProfile.blockedNotice": "You are blocked by this model.",
    "modelProfile.tip.title": "Send a Tip",
    "modelProfile.tip.placeholder": "Amount",
    "modelProfile.tip.help": "Tips are charged from your wallet balance.",
    "modelProfile.tip.sending": "Sending…",
    "modelProfile.tip.send": "Send Tip",
    "modelProfile.moderation.title": "Moderation",
    "modelProfile.moderation.placeholder": "Reason to report",
    "modelProfile.moderation.sending": "Sending…",
    "modelProfile.moderation.report": "Report",
    "modelProfile.block": "Block",
    "modelProfile.stats.rating": "Rating",
    "modelProfile.stats.viewers": "Viewers",
    "modelProfile.alert.blocked": "You are blocked by this model.",
    "modelProfile.alert.offline": "This model is offline.",
    "modelProfile.alert.busy": "This model is currently busy.",
    "modelProfile.alert.typeMessage": "Please type a message",
    "modelProfile.alert.messageFailed": "Message failed",
    "modelProfile.alert.messageSent": "Message sent",
    "modelProfile.alert.enterReason": "Please enter a reason",
    "modelProfile.alert.reportSent": "Report sent",
    "modelProfile.alert.tipInvalid": "Enter a valid amount",
    "modelProfile.alert.insufficientFunds": "Insufficient funds",
    "modelProfile.alert.tipFailed": "Tip failed",
    "modelProfile.alert.thanksTip": "Thanks for tipping!",
    "modelProfile.alert.blockedDone": "Blocked",
    
    // Footer
    securePayments: "Secure Payments",
    acceptPaymentMethods: "We accept all major payment methods",
    
    // Common
    search: "Search",
    sortBy: "Sort By",
    status: "Status",
    all: "All",
    name: "Name",
    rating: "Rating",
    viewers: "Viewers",
    age: "Age",
    showing: "Showing",
    of: "of",
    models: "models",

    // Loading
    "common.loading.auth": "Loading authentication…",

    // Favorites page
    "favorites.title": "Your Favorites",
    "favorites.empty.title": "No favorites yet",
    "favorites.empty.subtitle": "Tap the heart on a model to add to favorites",

    // Common (grid/messages)
    "common.errors.loadModels": "Unable to load models",
    "common.errors.tryLater": "Please try again later",
      // Home section subtitles
      "home.online.subtitle": "Models currently live and available",
      "home.top.subtitle": "The best performers on our platform",
      "home.new.subtitle": "Fresh faces joining our community",
      "home.trending.subtitle": "Most popular models right now",
      "home.favorites.subtitle": "Your bookmarked models",
      "home.all.subtitle": "Browse all available models",
    "common.noModels.title": "No models found",
    "common.noModels.subtitle": "Try adjusting your filters",

    // Model Card
    "modelCard.startChat": "Start Chat",
    "modelCard.online": "Online",
    "modelCard.offline": "Offline",
    "modelCard.watching": "watching",
    "modelCard.new": "New",

    // Footer
    "footer.about.description": "Premium video chat platform connecting you with verified models worldwide.",
    "footer.quickLinks.title": "Quick Links",
    "footer.quickLinks.browse": "Browse Models",
    
    "footer.quickLinks.becomeModel": "Become a Model",
    
    "footer.support.title": "Support",
    "footer.support.help": "Help Center",
    "footer.support.contact": "Contact Us",
    "footer.support.terms": "Terms of Service",
    "footer.support.privacy": "Privacy Policy",
    "footer.support.cookies": "Cookie Policy",
    "footer.payments.title": "Secure Payments",
  "footer.payments.description": "Accepted payments: Visa and Mastercard",
    "footer.payments.secure": "SSL Encrypted & Secure",
    "footer.links.privacy": "Privacy",
    "footer.links.terms": "Terms",
  "footer.links.cookies": "Cookies",
  "footer.links.policies": "Related policies",
    "footer.copyright": "All rights reserved. | 18+ Only",

    // Become Model Page
    "becomeModel.title": "Become a Model",
    "becomeModel.subtitle": "Join our platform and monetize your talent.",
    "becomeModel.benefitsTitle": "Why join Kasyrooms",
    "becomeModel.benefits.0.title": "Earn More",
    "becomeModel.benefits.0.description": "Competitive payouts and bonuses.",
    "becomeModel.benefits.1.title": "Grow Your Brand",
    "becomeModel.benefits.1.description": "Reach a global audience with better visibility.",
    "becomeModel.benefits.2.title": "Supportive Community",
    "becomeModel.benefits.2.description": "We help you succeed with guidance and tools.",
    "becomeModel.benefits.3.title": "Pro Tools",
    "becomeModel.benefits.3.description": "HD streaming and advanced room controls.",
    "becomeModel.requirementsTitle": "Requirements",
    "becomeModel.requirements.0": "18+ years old",
    "becomeModel.requirements.1": "Valid ID for verification",
    "becomeModel.requirements.2": "Stable internet connection",
    "becomeModel.requirements.3": "A webcam and microphone",
    "becomeModel.stepsTitle": "How to get started",
    "becomeModel.stepTitle": "Step",
    "becomeModel.steps.0": "Create your account",
    "becomeModel.steps.1": "Verify your identity",
    "becomeModel.steps.2": "Set up your profile",
    "becomeModel.steps.3": "Start streaming",
    "becomeModel.ctaTitle": "Ready to become a model?",
    "becomeModel.ctaSubtitle": "Apply now and start earning today.",
    "becomeModel.ctaButton": "Apply Now",

    // Help Page
    "help.title": "Help Center",
    "help.subtitle": "Find answers to common questions and guides.",
  "support.title": "Support",
  "support.intro": "Access resources, policies and assistance for every need.",
  "support.help": "Help Center",
  "support.faq": "FAQ",
  "support.contact": "Contact",
  "support.email": "Email",
  "support.needMore": "Need more help? Write to",
  "faq.title": "Frequently Asked Questions",
  "faq.intro": "Click a question to see the answer.",
  "faq.q1": "How do I create an account?",
  "faq.q2": "How does a session with a model work?",
  "faq.q3": "Can I pause a session?",
  "faq.q4": "Is there a welcome bonus?",
  "faq.q5": "What happens if I leave or lose connection during a session?",
  "faq.q6": "How can I top up my balance?",
  "faq.q7": "Do purchased credits expire?",
  "faq.q8": "Are chats and sessions private?",
  "faq.q9": "How do I become a model?",
  "faq.q10": "How can I contact support?",
  "faq.a1": "Click Sign Up, fill in the required fields, and confirm your email to activate your account.",
  "faq.a2": "Go to the model’s profile and start the session. Time starts immediately and the cost is automatically deducted from your balance.",
  "faq.a3": "No. Once started, a session can’t be paused or stopped.",
  "faq.a4": "Yes. All new users receive a one-time welcome bonus that must be used before real credits.",
  "faq.a5": "The timer keeps running. When you come back, you continue with the remaining available time.",
  "faq.a6": "You can top up your balance from the Wallet section by choosing one of the available payment methods.",
  "faq.a7": "No. Purchased credits do not expire.",
  "faq.a8": "Yes. All communications are private and are not recorded.",
  "faq.a9": "Visit the Become a Model page and complete the registration and verification process.",
  "faq.a10": "You can contact support via the Contact page or by email for any need.",
  "faq.stillNeed": "Still need assistance?",
  "contact.title": "Contact Us",
  "contact.subtitle": "We're here to help you succeed.",
  "contact.form.name": "Name",
  "contact.form.email": "Email",
  "contact.form.message": "Message",
  "contact.form.send": "Send Message",
  "terms.sections.acceptance.title": "Acceptance of Terms",
  "terms.sections.acceptance.content": "By accessing the platform you agree to these terms.",
  "terms.sections.services.title": "Services Provided",
  "terms.sections.services.content": "We provide a moderated adult-oriented live video chat and interactive communication platform that enables registered users to browse performer profiles, view public live streams, engage in private sessions, exchange real‑time messages and purchase premium features. We do not create or script performer content; each performer is an independent content creator responsible for complying with law and these Terms. We do not facilitate escorting, physical meetings or any illegal activity.",
  "terms.sections.registration.title": "Account Registration & Eligibility",
  "terms.sections.registration.content": "You must be at least 18 years old (or the age of majority in your jurisdiction if higher) and legally permitted to view adult content. You agree to provide accurate, current and complete information and to keep it updated. You are responsible for safeguarding your credentials and all activity under your account. We reserve the right to request age / identity re‑verification at any time and to suspend accounts pending satisfactory evidence.",
  "terms.sections.conduct.title": "Acceptable Use & Prohibited Conduct",
  "terms.sections.conduct.content": "You agree not to: (1) stream or request illegal, exploitative, violent, defamatory, non‑consensual or copyright‑infringing content; (2) impersonate others or misrepresent affiliation; (3) harass, threaten, stalk or dox performers or users; (4) attempt to obtain personal contact details or arrange physical meetings; (5) upload malware, perform scraping, reverse engineer security, flood chat or otherwise disrupt service; (6) engage in any activity involving minors (real or simulated) or that sexualises minors; (7) promote prostitution, trafficking, self‑harm or hate. We apply a zero‑tolerance policy and may report unlawful conduct to authorities.",
  "terms.sections.payment.title": "Payments, Virtual Items & Refunds",
  "terms.sections.payment.content": "Purchases of credits, tokens or subscriptions are final once delivered to your account unless mandatory consumer rights apply. Pricing and available premium features may change prospectively. Chargebacks or fraudulent payment activity may result in suspension. Third‑party payment processors handle billing; we do not store full card details. Any promotional or bonus credits may expire or be revoked if misuse or policy violations occur.",
  "terms.sections.intellectual.title": "Intellectual Property & Licensing",
  "terms.sections.intellectual.content": "All platform software, branding and design are owned by us or our licensors. Performers retain rights in their self‑produced content but grant us a worldwide, non‑exclusive, royalty‑free licence to host, transmit, transcode, display and distribute that content solely for platform operation, marketing (non‑sensitive thumbnails / excerpts) and legal compliance. You may not record, capture, redistribute or publish streams or private sessions without explicit written permission from the rights holder.",
  "terms.sections.privacy.title": "Privacy & Data Protection",
  "terms.sections.privacy.content": "Personal data is processed in accordance with our Privacy Policy (GDPR Art. 6 bases include contract performance, legitimate interests in platform security and consent where required for marketing / cookies). Users must not solicit performers' personal data beyond what is voluntarily shared within platform boundaries.",
  "terms.sections.termination.title": "Suspension & Termination",
  "terms.sections.termination.content": "We may suspend or terminate accounts (with or without notice) for: (i) material or repeated breaches of these Terms; (ii) suspected fraud, piracy or abuse; (iii) legal / regulatory request; (iv) prolonged inactivity coupled with unresolved risk flags. Upon termination you lose access to purchased virtual items without compensation except where mandatory law requires otherwise.",
  "terms.sections.limitation.title": "Disclaimers & Limitation of Liability",
  "terms.sections.limitation.content": "The service is provided 'AS IS' without warranties of uninterrupted availability, merchantability or fitness. To the fullest extent permitted by law we exclude liability for indirect, incidental, punitive or consequential damages, loss of data, goodwill or profits. Our aggregate liability for any claim shall not exceed the greater of (a) the amount paid by you in the preceding 6 months or (b) EUR 100. Nothing limits liability for fraud, death, personal injury or statutory rights that cannot be excluded.",
  "terms.sections.changes.title": "Changes to Terms",
  "terms.sections.changes.content": "We may modify these Terms with prospective effect. Material changes will be signalled via on‑site notice or email. Continued use after the effective date constitutes acceptance. If you object you must stop using the platform and may request account closure.",
  "privacy.sections.introduction.title": "Introduction",
  "privacy.sections.introduction.content": "This Privacy Policy (revision date 14/10/2025) describes how we collect, use, disclose and protect personal data of users and performers on our adult video chat platform. We act as Data Controller for web platform operations under GDPR / UK GDPR and as Data Processor where we process performer content on their documented instructions.",
  "privacy.sections.collection.title": "Data We Collect",
  "privacy.sections.collection.content": "(a) Account Data (username, email, age/verification info); (b) Profile & Preference Data; (c) Transaction & Payment Meta (token purchases – processed by third‑party gateways, we do not store full card numbers); (d) Usage & Log Data (IP, device, browser, timestamps, session events, fraud indicators); (e) Chat & Interaction Content (messages, tipping events, moderation flags); (f) Cookies & similar technologies (see Cookie Policy); (g) Performer Verification Documents (stored with restricted access & encryption).",
  "privacy.sections.usage.title": "How We Use Data",
  "privacy.sections.usage.content": "Purposes & legal bases: (1) Provide & administer platform features (contract performance); (2) Personalize listings & recommendations (legitimate interest / consent where required); (3) Payment processing & fraud prevention (contract + legitimate interest); (4) Moderation, trust & safety, age verification (legal obligations + legitimate interest); (5) Security monitoring, incident response (legitimate interest); (6) Compliance with legal requests (legal obligation); (7) Marketing communications (consent / soft opt‑in); (8) Analytics & product improvement (legitimate interest, aggregated / pseudonymised).",
  "privacy.sections.sharing.title": "Disclosures & International Transfers",
  "privacy.sections.sharing.content": "We share data with: payment processors, cloud hosting, analytics, anti‑fraud, email delivery and KYC vendors under contractual DPAs. Cross‑border transfers use Standard Contractual Clauses or equivalent safeguards. We may disclose limited data to law enforcement upon valid request or to enforce our rights. We do not sell personal data for monetary consideration.",
  "privacy.sections.cookies.title": "Cookies & Tracking",
  "privacy.sections.cookies.content": "We use essential cookies (session, load balancing, security), analytics (traffic & performance), functional (remember preferences, language), and marketing/retargeting tags (only after consent). Users in jurisdictions requiring prior consent can manage preferences via our Cookie settings interface.",
  "privacy.sections.security.title": "Security Measures",
  "privacy.sections.security.content": "Security controls include encryption in transit (TLS), hashed & salted credentials, role‑based access, audit logging, WAF & automated abuse detection. No system is 100% secure; users should keep credentials confidential.",
  "privacy.sections.retention.title": "Data Retention",
  "privacy.sections.retention.content": "We retain: account & transactional records for as long as the account is active + up to 6 years for compliance; logs up to 12 months (unless required longer for investigations); performer KYC for statutory periods (typically 5–10 years depending on jurisdiction). We anonymise or aggregate data when no longer needed in identifiable form.",
  "privacy.sections.rights.title": "User Rights",
  "privacy.sections.rights.content": "Subject to law you may request: access, rectification, erasure, restriction, portability, objection to processing (including profiling) and withdrawal of consent. You may lodge a complaint with your supervisory authority. Contact privacy requests at privacy@kasyrooms.com.",
  "privacy.sections.children.title": "Age & Minor Protection",
  "privacy.sections.children.content": "The platform is strictly 18+. We prohibit any material involving minors (real, simulated, inferred). Verified age checks are enforced for performers. Attempts to bypass age gates may result in reporting.",
  "privacy.sections.changes.title": "Policy Updates",
  "privacy.sections.changes.content": "We will post revisions with a new revision date. Material changes may be highlighted via site notice or email. Continued use indicates acceptance of the updated policy.",

    // Terms & Privacy
    "terms.title": "Terms of Service",
    "terms.subtitle": "Last updated:",
  "terms.contact.title": "Need legal help or clarifications?",
  "terms.contact.content": "Write to our legal team at",
  "terms.related.title": "Related policies",
    "privacy.title": "Privacy Policy",
    "privacy.subtitle": "Last updated:",
    "privacy.contact.title": "Questions about this policy?",
    "privacy.contact.content": "Contact our privacy team at",

    // Cookies Page
  "cookies.title": "Cookie Policy",
  "cookies.subtitle": "Manage your cookie preferences for the video chat platform.",
  "cookies.lastUpdated": "Last updated:",
    "cookies.what.title": "What are cookies?",
    "cookies.what.content": "Cookies are small text files used to remember your preferences and improve your experience.",
    "cookies.preferences.title": "Cookie Preferences",
    "cookies.required": "Required",
    "cookies.optional": "Optional",
    "cookies.acceptAll": "Accept All",
    "cookies.savePreferences": "Save Preferences",
    "cookies.rejectAll": "Reject All",
    "cookies.usage.title": "How we use cookies",
    "cookies.usage.sections.performance.title": "Performance",
    "cookies.usage.sections.performance.content": "We measure site performance to improve reliability.",
    "cookies.usage.sections.personalization.title": "Personalization",
    "cookies.usage.sections.personalization.content": "We remember your settings to personalize your experience.",
    "cookies.usage.sections.advertising.title": "Advertising",
    "cookies.usage.sections.advertising.content": "We may show relevant ads based on your interactions.",
    "cookies.managing.title": "Managing cookies",
    "cookies.managing.content": "You can control cookies in your browser settings at any time.",
  "cookies.types.essential.title": "Essential",
  "cookies.types.essential.description": "Required for core navigation, authentication, load balancing and security.",
  "cookies.types.analytics.title": "Analytics",
  "cookies.types.analytics.description": "Help us understand performance, crashes and feature usage.",
  "cookies.types.marketing.title": "Marketing",
  "cookies.types.marketing.description": "Used (upon consent) for measuring campaigns and retargeting.",
  "cookies.types.functional.title": "Functional",
  "cookies.types.functional.description": "Remember preferences like language, layout and volume settings.",
  "cookies.banner.message": "We use essential cookies and, with your consent, functional, analytics and marketing cookies. You can change your choice any time from Cookie settings.",
  "cookies.banner.customize": "Customize",
  "cookies.banner.necessary": "Technical/necessary (always on)",
  "common.back": "Back",
  // DMCA
  "dmca.title": "DMCA / Copyright Policy",
  "dmca.subtitle": "Report alleged copyright infringement affecting content on the platform.",
  "dmca.intro": "We respect intellectual property rights and respond to properly formatted notices under the Digital Millennium Copyright Act (DMCA) and analogous global regimes.",
  "dmca.notice.title": "Submitting a Notice",
  "dmca.notice.content": "If you believe content infringes your copyright, send a written notice including: (1) identification of the copyrighted work; (2) the specific URL(s) of allegedly infringing material; (3) your contact information; (4) a statement of good‑faith belief; (5) a statement under penalty of perjury that you are authorized; (6) a physical or electronic signature.",
  "dmca.counter.title": "Counter Notification",
  "dmca.counter.content": "If your content was removed and you believe this was a mistake or authorized, you may submit a counter notice containing: identification of removed material, your contact info, consent to jurisdiction, and a statement under penalty of perjury. We may restore content after 10 business days unless the original claimant seeks a court order.",
  "dmca.repeat.title": "Repeat Infringers",
  "dmca.repeat.content": "Accounts with repeated or flagrant infringement may be terminated.",
  "dmca.misuse.title": "Abuse Warning",
  "dmca.misuse.content": "Knowingly submitting false notices or counter notices may result in liability for damages.",
  "dmca.contact.title": "Designated Agent",
  "dmca.contact.content": "Email: copyright@kasyrooms.com (preferred). Subject line: DMCA Notice.",
  // Community Guidelines
  "guidelines.title": "Community Guidelines",
  "guidelines.subtitle": "Standards that keep the platform safe, respectful and lawful.",
  "guidelines.intro": "These Guidelines supplement the Terms and apply to all users and performers. Violations may result in warnings, suspensions or termination.",
  "guidelines.section.safety.title": "Safety & Consent",
  "guidelines.section.safety.content": "All interaction must be consensual. Strictly no minors (real, simulated or youthful appearance suggesting a minor). No doxing, threats, blackmail or coercion.",
  "guidelines.section.prohibited.title": "Prohibited Content",
  "guidelines.section.prohibited.content": "Disallowed: exploitation, bestiality, non‑consensual acts, self‑harm promotion, trafficking, hate or extremist propaganda, and solicitation of off‑platform sexual services.",
  "guidelines.section.privacy.title": "Privacy & Personal Data",
  "guidelines.section.privacy.content": "Do not request or reveal personal contact details (phone, address, private socials) or identification documents. Report attempts to solicit them.",
  "guidelines.section.payments.title": "Payments & Tips",
  "guidelines.section.payments.content": "All compensation must flow through official platform mechanisms. Off‑platform payment requests are prohibited to protect users from fraud.",
  "guidelines.section.reporting.title": "Reporting & Enforcement",
  "guidelines.section.reporting.content": "Use the report tools or email safety@kasyrooms.com. Provide timestamps, usernames and context. We triage by severity; urgent child safety matters escalated immediately.",
  "guidelines.section.updates.title": "Updates",
  "guidelines.section.updates.content": "We may refine these Guidelines; continued use after publication constitutes acceptance.",
  // Refund Policy
  "refund.title": "Refund Policy",
  "refund.subtitle": "How we handle purchases of virtual credits, tips and subscriptions.",
  "refund.intro": "Virtual items (credits, tokens, tips, time‑based access) are generally non‑refundable once delivered. This policy explains limited circumstances where a refund or adjustment may apply.",
  "refund.section.finality.title": "All Sales Final",
  "refund.section.finality.content": "Upon successful processing and crediting to your account, purchases are final except where mandatory consumer rights require otherwise.",
  "refund.section.unauthorized.title": "Unauthorized Use",
  "refund.section.unauthorized.content": "Report suspected unauthorized transactions within 48h to billing@kasyrooms.com. We may temporarily lock the account while investigating.",
  "refund.section.technical.title": "Technical Failures",
  "refund.section.technical.content": "If a paid private session fails due to a platform outage (not user connectivity) and less than 5 minutes of paid access occurred, contact support with timestamps for possible credit reissue.",
  "refund.section.chargebacks.title": "Chargebacks",
  "refund.section.chargebacks.content": "Initiating unfounded chargebacks may result in suspension. We encourage contacting support first to resolve discrepancies.",
  "refund.section.subscriptions.title": "Subscription Renewal",
  "refund.section.subscriptions.content": "Subscriptions renew automatically unless cancelled before the renewal timestamp. Partial period refunds are not provided after renewal.",
  "refund.section.process.title": "Request Process",
  "refund.section.process.content": "Submit: account ID, transaction ID, date, amount, explanation, and evidence (screenshots, logs). We aim to respond within 3 business days.",
  "refund.section.law.title": "Statutory Rights",
  "refund.section.law.content": "Nothing limits rights that cannot be excluded under applicable consumer protection law.",
  // Age Compliance
  "ageCompliance.title": "Age Verification (18+) & 2257",
  },
  it: {
    // Header  
    favorites: "Preferiti",
    login: "Accedi",
    signup: "Registrati",
    becomeModel: "Diventa Modella",
    logout: "Esci",
    welcome: "Benvenuto",
    searchPlaceholder: "Cerca modelle...",
    // Filters (alias)
    "filters.online": "Online",
    "filters.top": "Top Valutate",
    "filters.new": "Nuove Modelle",
    "filters.trending": "Di Tendenza",
    "filters.favorites": "Preferiti",
    // Filters
    "filter.online": "Online Ora",
      // Home section subtitles
      "home.online.subtitle": "Modelle attualmente online e disponibili",
      "home.top.subtitle": "Le migliori performer sulla nostra piattaforma",
      "home.new.subtitle": "Nuovi volti che si uniscono alla community",
      "home.trending.subtitle": "Modelle più popolari in questo momento",
      "home.favorites.subtitle": "Le tue modelle salvate",
      "home.all.subtitle": "Sfoglia tutte le modelle disponibili",
    "filter.top": "Top Valutate",
    "filter.new": "Nuove Modelle",
    "filter.trending": "Di Tendenza",
    "filter.favorites": "Preferiti",
    
    // Hero/Buttons
    browseModels: "Scopri le Modelle",
    startPrivateShow: "Avvia Private Show",
    startChat: "Inizia Chat",
    viewAll: "Vedi tutto",
    
    // Pages
    allModels: "Tutte le Modelle",
    "models.subtitle": "Scopri tutte le nostre fantastiche modelle",
    noModelsFound: "Nessuna modella trovata",
    clearFilters: "Cancella Filtri",
    helpCenter: "Centro Assistenza",
    contactUs: "Contattaci",
    termsOfService: "Termini di Servizio",
    privacyPolicy: "Privacy Policy",
    cookiePolicy: "Cookie Policy",
    becomeAModel: "Diventa Modella",
    yourFavorites: "I Tuoi Preferiti",
    noFavoritesYet: "Nessun preferito ancora",
    tapHeartToAdd: "Tocca il cuore su una modella per aggiungerla ai preferiti",
    
    // Login/Register
    welcomeBack: "Bentornato",
    signInToAccount: "Accedi al tuo account per accedere ai contenuti premium",
    username: "Nome utente",
    email: "Email",
    password: "Password",
    enterUsername: "Inserisci il tuo nome utente",
    enterPassword: "Inserisci la tua password",
    signingIn: "Accesso in corso...",
    signIn: "Accedi",
    dontHaveAccount: "Non hai un account?",
    signUpHere: "Registrati qui",
    loginSuccessful: "Accesso riuscito",
    loginFailed: "Accesso fallito",
    invalidCredentials: "Usa nome utente 'testuser' con qualsiasi password",

    // Register page
    "register.title": "Unisciti a Kasyrooms",
    "register.subtitle": "Crea il tuo account per accedere a contenuti esclusivi",
    "register.firstName": "Nome",
    "register.firstName.placeholder": "Mario",
    "register.lastName": "Cognome",
    "register.lastName.placeholder": "Rossi",
    "register.dob": "Data di nascita",
    "register.username.placeholder": "Scegli un nome utente",
    "register.email.placeholder": "Inserisci la tua email",
    "register.password.placeholder": "Crea una password",
    "register.confirmPassword": "Conferma Password",
    "register.confirmPassword.placeholder": "Conferma la password",
    "register.creating": "Creazione account…",
    "register.create": "Crea Account",
    "register.haveAccount": "Hai già un account?",
    "register.signInHere": "Accedi qui",
    "register.toast.passwordMismatch.title": "Password non corrispondenti",
    "register.toast.passwordMismatch.desc": "Le password non corrispondono",
    "register.toast.accountCreated.title": "Account creato",
    "register.toast.accountCreated.desc": "Benvenuto su Kasyrooms!",
    "register.toast.failed.title": "Registrazione fallita",
    "register.toast.failed.desc": "Riprova più tardi",
    
    // Model info
    yearsOld: "anni",
    watching: "stanno guardando",
    languages: "Lingue",
    specialties: "Specialità",
    online: "Online",
    offline: "Offline",

    // Not Found
    "notFound.title": "404 Pagina non trovata",
    "notFound.subtitle": "La pagina che cerchi non esiste.",

    // Age gate modal
    "ageCompliance.modal.title": "Conferma età",
    "ageCompliance.modal.body": "Questo sito contiene contenuti per adulti. Confermi di avere almeno 18 anni (o l'età legale nel tuo Paese)?",
    "ageCompliance.modal.yes": "Sì, ho 18+",
    "ageCompliance.modal.no": "No",
    "ageCompliance.modal.blocked": "Sessione terminata. Per accedere ai contenuti devi avere almeno 18 anni.",
    "ageCompliance.modal.exit": "Esci",

    // KYC
    "kyc.title": "Onboarding KYC",
    "kyc.loggedAs": "Loggato come",
    "kyc.validation.title": "Validazione",
    "kyc.validation.fullName": "Nome completo obbligatorio",
    "kyc.validation.docType": "Seleziona un tipo di documento",
    "kyc.submitted.title": "Inviato",
    "kyc.submitted.desc": "Domanda KYC creata. Ora puoi caricare le immagini.",
    "kyc.submissionFailed.title": "Invio fallito",
    "kyc.upload.missingApp.title": "Applicazione mancante",
    "kyc.upload.missingApp.desc": "Invia prima il form KYC per ottenere un ID applicazione.",
    "kyc.upload.noFile.title": "Nessun file selezionato",
    "kyc.upload.noFile.desc": "Scegli un'immagine da caricare.",
    "kyc.uploaded.title": "Caricato",
    "kyc.uploaded.descSuffix": "caricato con successo.",
    "kyc.upload.kind.front": "Fronte",
    "kyc.upload.kind.back": "Retro",
    "kyc.upload.kind.selfie": "Selfie",
    "kyc.uploadFailed.title": "Caricamento fallito",
    "kyc.form.fullName": "Nome completo",
    "kyc.form.fullName.placeholder": "Mario Rossi",
    "kyc.form.dob": "Data di nascita",
    "kyc.form.country": "Paese",
    "kyc.form.country.placeholder": "Paese",
    "kyc.form.docType": "Tipo documento",
    "kyc.form.docType.select": "Seleziona…",
    "kyc.form.docType.passport": "Passaporto",
    "kyc.form.docType.idCard": "Carta d'identità",
    "kyc.form.docType.driver": "Patente",
    "kyc.form.docFrontUrl": "URL documento fronte",
    "kyc.form.docBackUrl": "URL documento retro",
    "kyc.form.selfieUrl": "URL selfie",
    "kyc.form.url.placeholder": "https://...",
    "kyc.form.notes": "Note (opzionale)",
    "kyc.form.notes.placeholder": "Aggiungi dettagli",
    "kyc.form.submit": "Invia domanda",
    "kyc.form.submitting": "Invio…",
    "kyc.applicationId": "ID applicazione",
    "kyc.noImage": "Nessuna immagine",
    "kyc.upload": "Carica",
    "kyc.uploading": "Caricamento…",

    // DMCA Submit
    "dmcaSubmit.title": "Invia una segnalazione DMCA",
    "dmcaSubmit.validation.title": "Validazione",
    "dmcaSubmit.validation.noUrls": "Aggiungi almeno un URL contestato.",
    "dmcaSubmit.submitted.title": "Inviato",
    "dmcaSubmit.submitted.desc": "Segnalazione DMCA inviata. La valuteremo a breve.",
    "dmcaSubmit.failed.title": "Invio fallito",
    "dmcaSubmit.form.name": "Il tuo nome",
    "dmcaSubmit.form.email": "La tua email",
    "dmcaSubmit.form.originalUrl": "URL contenuto originale",
    "dmcaSubmit.form.infringingUrls": "URL contestati (uno per riga o separati da virgola)",
    "dmcaSubmit.form.signature": "Firma (scrivi il tuo nome completo)",
    "dmcaSubmit.form.notes": "Note aggiuntive (opzionale)",
    "dmcaSubmit.form.submit": "Invia segnalazione",
    "dmcaSubmit.form.submitting": "Invio…",
    "dmcaSubmit.placeholder.name": "Mario Rossi",
    "dmcaSubmit.placeholder.email": "tuo@example.com",
    "dmcaSubmit.placeholder.originalUrl": "https://tuo-sito.com/originale",
    "dmcaSubmit.placeholder.infringingUrls": "https://example.com/infringing-1\nhttps://example.com/infringing-2",
    "dmcaSubmit.placeholder.signature": "Mario Rossi",
    "dmcaSubmit.placeholder.notes": "Contesto o chiarimenti",

    // Model profile
    "modelProfile.notFound.title": "Modella non trovata",
    "modelProfile.notFound.subtitle": "La modella che cerchi non esiste.",
    "modelProfile.goBack": "Indietro",
    "modelProfile.unavailable": "Non disponibile",
    "modelProfile.busy": "Occupata",
    "modelProfile.blocked": "Bloccato",
    "modelProfile.sendMessage.title": "Invia un messaggio",
    "modelProfile.sendMessage.placeholder": "Scrivi un messaggio",
    "modelProfile.sendMessage.sending": "Invio…",
    "modelProfile.sendMessage.send": "Invia",
    "modelProfile.blockedNotice": "Sei bloccato da questa modella.",
    "modelProfile.tip.title": "Lascia una mancia",
    "modelProfile.tip.placeholder": "Importo",
    "modelProfile.tip.help": "Le mance vengono addebitate dal saldo del tuo wallet.",
    "modelProfile.tip.sending": "Invio…",
    "modelProfile.tip.send": "Invia mancia",
    "modelProfile.moderation.title": "Moderazione",
    "modelProfile.moderation.placeholder": "Motivo segnalazione",
    "modelProfile.moderation.sending": "Invio…",
    "modelProfile.moderation.report": "Segnala",
    "modelProfile.block": "Blocca",
    "modelProfile.stats.rating": "Valutazione",
    "modelProfile.stats.viewers": "Spettatori",
    "modelProfile.alert.blocked": "Sei bloccato da questa modella.",
    "modelProfile.alert.offline": "Questa modella è offline.",
    "modelProfile.alert.busy": "Questa modella è occupata.",
    "modelProfile.alert.typeMessage": "Scrivi un messaggio",
    "modelProfile.alert.messageFailed": "Invio messaggio fallito",
    "modelProfile.alert.messageSent": "Messaggio inviato",
    "modelProfile.alert.enterReason": "Inserisci un motivo",
    "modelProfile.alert.reportSent": "Segnalazione inviata",
    "modelProfile.alert.tipInvalid": "Inserisci un importo valido",
    "modelProfile.alert.insufficientFunds": "Fondi insufficienti",
    "modelProfile.alert.tipFailed": "Mancia non riuscita",
    "modelProfile.alert.thanksTip": "Grazie per la mancia!",
    "modelProfile.alert.blockedDone": "Bloccato",
    
    // Footer
    securePayments: "Pagamenti Sicuri",
    acceptPaymentMethods: "Accettiamo tutti i principali metodi di pagamento",
    
    // Common
    search: "Cerca",
    sortBy: "Ordina per",
    status: "Stato",
    all: "Tutti",
    name: "Nome",
    rating: "Valutazione",
    viewers: "Spettatori",
    age: "Età",
    showing: "Mostrando",
    of: "di",
    models: "modelle",

    // Loading
    "common.loading.auth": "Caricamento autenticazione…",

    // Preferiti page
    "favorites.title": "I Tuoi Preferiti",
    "favorites.empty.title": "Nessun preferito ancora",
    "favorites.empty.subtitle": "Tocca il cuore su una modella per aggiungerla ai preferiti",

    // Common (grid/messages)
    "common.errors.loadModels": "Impossibile caricare le modelle",
    "common.errors.tryLater": "Riprova più tardi",
    "common.noModels.title": "Nessuna modella trovata",
    "common.noModels.subtitle": "Prova a modificare i filtri",

    // Model Card
    "modelCard.startChat": "Inizia Chat",
    "modelCard.online": "Online",
    "modelCard.offline": "Offline",
    "modelCard.watching": "stanno guardando",
    "modelCard.new": "Nuova",

    // Footer
    "footer.about.description": "Piattaforma di video chat premium che ti connette con modelle verificate in tutto il mondo.",
    "footer.quickLinks.title": "Link Rapidi",
    "footer.quickLinks.browse": "Scopri le Modelle",
    
    "footer.quickLinks.becomeModel": "Diventa Modella",
    
    "footer.support.title": "Supporto",
    "footer.support.help": "Centro Assistenza",
    "footer.support.contact": "Contattaci",
    "footer.support.terms": "Termini di Servizio",
    "footer.support.privacy": "Privacy Policy",
    "footer.support.cookies": "Cookie Policy",
    "footer.payments.title": "Pagamenti Sicuri",
  "footer.payments.description": "Metodi accettati: Visa e Mastercard",
    "footer.payments.secure": "Crittografia SSL & Sicurezza",
    "footer.links.privacy": "Privacy",
    "footer.links.terms": "Termini",
  "footer.links.cookies": "Cookie",
  "footer.links.policies": "Policy legali",
    "footer.copyright": "Tutti i diritti riservati. | Solo 18+",

    // Diventa Modella
    "becomeModel.title": "Diventa Modella",
    "becomeModel.subtitle": "Unisciti alla piattaforma e monetizza il tuo talento.",
    "becomeModel.benefitsTitle": "Perché unirti a Kasyrooms",
    "becomeModel.benefits.0.title": "Guadagna di più",
    "becomeModel.benefits.0.description": "Pagamenti competitivi e bonus.",
    "becomeModel.benefits.1.title": "Cresci il tuo brand",
    "becomeModel.benefits.1.description": "Raggiungi un pubblico globale con maggiore visibilità.",
    "becomeModel.benefits.2.title": "Community di supporto",
    "becomeModel.benefits.2.description": "Ti aiutiamo a crescere con strumenti e guide.",
    "becomeModel.benefits.3.title": "Strumenti Pro",
    "becomeModel.benefits.3.description": "Streaming HD e controlli avanzati.",
    "becomeModel.requirementsTitle": "Requisiti",
    "becomeModel.requirements.0": "18+ anni",
    "becomeModel.requirements.1": "Documento valido per verifica",
    "becomeModel.requirements.2": "Connessione internet stabile",
    "becomeModel.requirements.3": "Webcam e microfono",
    "becomeModel.stepsTitle": "Come iniziare",
    "becomeModel.stepTitle": "Passo",
    "becomeModel.steps.0": "Crea il tuo account",
    "becomeModel.steps.1": "Verifica la tua identità",
    "becomeModel.steps.2": "Imposta il profilo",
    "becomeModel.steps.3": "Inizia a trasmettere",
    "becomeModel.ctaTitle": "Pronta a diventare modella?",
    "becomeModel.ctaSubtitle": "Candidati ora e inizia a guadagnare.",
    "becomeModel.ctaButton": "Candidati Ora",

    // Help
    "help.title": "Centro Assistenza",
    "help.subtitle": "Trova risposte a domande frequenti e guide.",
  "support.title": "Supporto",
  "support.intro": "Accedi a risorse, policy e assistenza per ogni esigenza.",
  "support.help": "Centro Assistenza",
  "support.faq": "FAQ",
  "support.contact": "Contatti",
  "support.email": "Email",
  "support.needMore": "Serve ancora aiuto? Scrivi a",
  "faq.title": "Domande Frequenti",
  "faq.intro": "Clicca su una domanda per vedere la risposta.",
  "faq.q1": "Come creo un account?",
  "faq.q2": "Come funziona una sessione con una modella?",
  "faq.q3": "Posso mettere in pausa una sessione?",
  "faq.q4": "È previsto un bonus di benvenuto?",
  "faq.q5": "Cosa succede se esco o perdo la connessione durante una sessione?",
  "faq.q6": "Come posso ricaricare il mio saldo?",
  "faq.q7": "I crediti acquistati hanno scadenza?",
  "faq.q8": "Le chat e le sessioni sono private?",
  "faq.q9": "Come divento una modella?",
  "faq.q10": "Come posso contattare l’assistenza?",
  "faq.a1": "Clicca su Registrati, compila i campi richiesti e conferma l’email per attivare l’account.",
  "faq.a2": "Accedi al profilo della modella e avvia la sessione. Il tempo parte subito e il costo viene scalato automaticamente dal tuo saldo.",
  "faq.a3": "No. Una volta avviata, la sessione non può essere messa in pausa né interrotta.",
  "faq.a4": "Sì. Tutti i nuovi utenti ricevono un bonus iniziale utilizzabile una sola volta, che deve essere consumato prima dei crediti reali.",
  "faq.a5": "Il timer continua a scorrere. Rientrando, riprendi con il tempo residuo disponibile.",
  "faq.a6": "Puoi ricaricare il saldo dalla sezione Wallet scegliendo uno dei metodi di pagamento disponibili.",
  "faq.a7": "No. I crediti acquistati non scadono.",
  "faq.a8": "Sì. Tutte le comunicazioni sono private e non vengono registrate.",
  "faq.a9": "Visita la pagina Diventa Modella e completa il processo di registrazione e verifica.",
  "faq.a10": "Puoi contattare il supporto tramite la pagina Contatti o via email per qualsiasi necessità.",
  "faq.stillNeed": "Hai ancora bisogno di assistenza?",
  "contact.title": "Contattaci",
  "contact.subtitle": "Siamo qui per aiutarti a crescere.",
  "contact.form.name": "Nome",
  "contact.form.email": "Email",
  "contact.form.message": "Messaggio",
  "contact.form.send": "Invia Messaggio",
  "terms.sections.acceptance.title": "Accettazione dei Termini",
  "terms.sections.acceptance.content": "Accedendo alla Piattaforma accetti integralmente i presenti Termini (versione 14/10/2025). Se non li condividi devi interrompere immediatamente l'uso. I Termini regolano l'accesso ai servizi di videochat dal vivo per adulti.",
  "terms.sections.services.title": "Servizi Forniti",
  "terms.sections.services.content": "Forniamo una piattaforma di videochat interattiva per adulti con: streaming pubblico, sessioni private, chat in tempo reale, mance, acquisto di crediti o abbonamenti e strumenti di moderazione. Le performer sono creatrici di contenuti indipendenti. Non organizziamo incontri fisici né promuoviamo attività illegali.",
  "terms.sections.registration.title": "Registrazione & Requisiti",
  "terms.sections.registration.content": "L'uso richiede età ≥ 18 anni (o maggiore età locale). Devi fornire dati veritieri e mantenerli aggiornati. Conserva le credenziali al sicuro. Possiamo richiedere in ogni momento verifica aggiuntiva di età/identità.",
  "terms.sections.conduct.title": "Condotta Consentita & Divieti",
  "terms.sections.conduct.content": "È vietato: contenuti illegali o non consensuali; materiale che coinvolge minori (reali o simulati); incitamento all'odio o violenza; stalking, doxing, minacce; richieste di incontri fisici; distribuzione non autorizzata di stream; malware, scraping, aggirare sicurezza, flooding; promozione di tratta, prostituzione o autolesionismo.",
  "terms.sections.payment.title": "Pagamenti e Rimborsi",
  "terms.sections.payment.content": "Acquisti di crediti, token o abbonamenti sono definitivi salvo diritti inderogabili del consumatore. Elaborazione affidata a processori terzi certificati; non memorizziamo i dettagli completi della carta. Chargeback fraudolenti comportano sospensione o chiusura dell'account.",
  "terms.sections.intellectual.title": "Proprietà Intellettuale",
  "terms.sections.intellectual.content": "Software, interfaccia e marchi appartengono a noi o licenzianti. Le performer conservano i diritti sui contenuti propri concedendo licenza mondiale non esclusiva per hosting, transcodifica, anteprime e promozione limitata. Vietata la registrazione o ridistribuzione non autorizzata dei flussi.",
  "terms.sections.privacy.title": "Privacy",
  "terms.sections.privacy.content": "Il trattamento dei dati personali avviene secondo la nostra Privacy Policy (basi giuridiche: esecuzione del contratto, obblighi legali, legittimo interesse in sicurezza e consenso ove richiesto).",
  "terms.sections.termination.title": "Sospensione & Chiusura",
  "terms.sections.termination.content": "Possiamo sospendere o chiudere gli account per violazioni, frode, richieste legali o rischi di sicurezza. Alla chiusura decadono i crediti residui salvo inderogabili norme di legge.",
  "terms.sections.limitation.title": "Limitazione di Responsabilità",
  "terms.sections.limitation.content": "Il servizio è fornito 'COSÌ COM'È'. Nella misura massima consentita escludiamo responsabilità per danni indiretti, perdita di dati, lucro cessante. Il limite complessivo di responsabilità non supera quanto pagato nei 6 mesi precedenti o EUR 100 (il maggiore). Restano salvi dolo, colpa grave e diritti inderogabili.",
  "terms.sections.changes.title": "Modifiche",
  "terms.sections.changes.content": "Eventuali modifiche avranno effetto prospettico e saranno comunicate con avviso in piattaforma o email. L'uso continuato dopo l'efficacia costituisce accettazione.",
  "privacy.sections.introduction.title": "Introduzione",
  "privacy.sections.introduction.content": "Questa Privacy Policy (data revisione 14/10/2025) descrive come trattiamo i dati personali di utenti e performer. Siamo Titolare del trattamento per le operazioni della piattaforma e Responsabile solo per elaborazioni effettuate per conto di performer secondo istruzioni documentate.",
  "privacy.sections.collection.title": "Categorie di Dati Raccolti",
  "privacy.sections.collection.content": "(a) Dati Account (username, email, età/verifica); (b) Profilo & Preferenze; (c) Metadati Transazioni (forniti da processor – non memorizziamo numeri completi carta); (d) Dati Tecnici & Log (IP, dispositivo, browser, eventi, indicatori frode); (e) Chat & Interazioni; (f) Cookie / tecnologie simili; (g) Documenti KYC performer criptati.",
  "privacy.sections.usage.title": "Finalità & Basi Giuridiche",
  "privacy.sections.usage.content": "Erogazione servizi (contratto); Personalizzazione e sicurezza (legittimo interesse); Pagamenti e prevenzione frodi (contratto / legittimo interesse); Adempimenti legali; Marketing e cookie non essenziali (consenso); Analisi aggregate (legittimo interesse).",
  "privacy.sections.sharing.title": "Destinatari & Trasferimenti",
  "privacy.sections.sharing.content": "Processor: hosting cloud, anti‑frode, analytics, email, KYC, pagamento. Trasferimenti extra UE basati su SCC oppure decisioni di adeguatezza. Nessuna vendita di dati a terzi per corrispettivo monetario.",
  "privacy.sections.cookies.title": "Cookie & Tecnologie",
  "privacy.sections.cookies.content": "Cookie necessari per sessione e sicurezza; analytics per prestazioni; funzionali per ricordare lingua/preferenze; marketing solo previo consenso. Gestione tramite pannello Cookie.",
  "privacy.sections.security.title": "Sicurezza",
  "privacy.sections.security.content": "Crittografia TLS, hashing credenziali, accessi minimi, logging, monitoraggio WAF, sistemi anti‑abuso. Nessuna garanzia di sicurezza assoluta.",
  "privacy.sections.retention.title": "Conservazione",
  "privacy.sections.retention.content": "Account & transazioni: vita dell'account + fino a 6 anni; log: fino a 12 mesi; KYC: durata legale (5–10 anni). Pseudonimizzazione o anonimizzazione al termine della necessità.",
  "privacy.sections.rights.title": "Diritti Interessati",
  "privacy.sections.rights.content": "Accesso, rettifica, cancellazione, limitazione, portabilità, opposizione, revoca del consenso, reclamo all'Autorità Garante. Contatto: privacy@kasyrooms.com.",
  "privacy.sections.children.title": "Protezione Minori",
  "privacy.sections.children.content": "Piattaforma solo 18+. Qualsiasi tentativo di usare materiale con minori comporta blocco e segnalazione.",
  "privacy.sections.changes.title": "Aggiornamenti",
  "privacy.sections.changes.content": "Pubblicheremo le revisioni con nuova data. Uso continuato = accettazione.",

    // Terms & Privacy
    "terms.title": "Termini di Servizio",
    "terms.subtitle": "Ultimo aggiornamento:",
  "terms.contact.title": "Serve assistenza legale o chiarimenti?",
  "terms.contact.content": "Scrivi al nostro team legale a",
  "terms.related.title": "Altre policy legali",
    "privacy.title": "Privacy Policy",
    "privacy.subtitle": "Ultimo aggiornamento:",
    "privacy.contact.title": "Domande su questa policy?",
    "privacy.contact.content": "Contatta il nostro team privacy a",

    // Cookies
    "cookies.title": "Cookie Policy",
  "cookies.subtitle": "Gestisci le preferenze cookie per la piattaforma di videochat.",
  "cookies.lastUpdated": "Ultimo aggiornamento:",
    "cookies.what.title": "Cosa sono i cookie?",
    "cookies.what.content": "I cookie sono piccoli file di testo usati per ricordare le tue preferenze e migliorare l'esperienza.",
    "cookies.preferences.title": "Preferenze Cookie",
    "cookies.required": "Obbligatorio",
    "cookies.optional": "Opzionale",
    "cookies.acceptAll": "Accetta Tutto",
    "cookies.savePreferences": "Salva Preferenze",
    "cookies.rejectAll": "Rifiuta Tutto",
    "cookies.usage.title": "Come usiamo i cookie",
    "cookies.usage.sections.performance.title": "Prestazioni",
    "cookies.usage.sections.performance.content": "Misuriamo le prestazioni del sito per migliorarne l'affidabilità.",
    "cookies.usage.sections.personalization.title": "Personalizzazione",
    "cookies.usage.sections.personalization.content": "Ricordiamo le tue impostazioni per personalizzare l'esperienza.",
    "cookies.usage.sections.advertising.title": "Pubblicità",
    "cookies.usage.sections.advertising.content": "Possiamo mostrare annunci rilevanti in base alle interazioni.",
    "cookies.managing.title": "Gestione cookie",
    "cookies.managing.content": "Puoi controllare i cookie dalle impostazioni del browser in qualsiasi momento.",
  "cookies.types.essential.title": "Essenziali",
  "cookies.types.essential.description": "Necessari per autenticazione, bilanciamento carico e sicurezza.",
  "cookies.types.analytics.title": "Analytics",
  "cookies.types.analytics.description": "Statistiche su prestazioni, errori e utilizzo funzioni.",
  "cookies.types.marketing.title": "Marketing",
  "cookies.types.marketing.description": "(Su consenso) per misurare campagne e retargeting.",
  "cookies.types.functional.title": "Funzionali",
  "cookies.types.functional.description": "Memorizzano lingua, layout e preferenze utente.",
  "cookies.banner.message": "Usiamo cookie tecnici e, previo consenso, cookie funzionali, analitici e marketing. Puoi cambiare scelta in qualsiasi momento dalle impostazioni cookie.",
  "cookies.banner.customize": "Personalizza",
  "cookies.banner.necessary": "Tecnici/necessari (sempre attivi)",
  "common.back": "Indietro",
  // DMCA
  "dmca.title": "Policy Copyright / DMCA",
  "dmca.subtitle": "Segnala presunte violazioni di copyright sui contenuti della piattaforma.",
  "dmca.intro": "Rispettiamo i diritti di proprietà intellettuale e rispondiamo a notifiche formali conformi al DMCA e normative equivalenti.",
  "dmca.notice.title": "Inviare una Notifica",
  "dmca.notice.content": "Se ritieni che un contenuto violi i tuoi diritti, invia una notifica scritta con: (1) opera tutelata identificata; (2) URL specifici del materiale contestato; (3) tuoi contatti; (4) dichiarazione di buona fede; (5) dichiarazione sotto pena di falsa testimonianza di autorizzazione; (6) firma fisica o elettronica.",
  "dmca.counter.title": "Contro‑Notifica",
  "dmca.counter.content": "Se il tuo contenuto è stato rimosso per errore o autorizzazione valida, puoi inviare contro‑notifica con identificazione materiale rimosso, contatti, consenso alla giurisdizione e dichiarazione sotto pena di falsa testimonianza. Potremmo ripristinare dopo 10 giorni lavorativi salvo azione giudiziaria del segnalante.",
  "dmca.repeat.title": "Recidivi",
  "dmca.repeat.content": "Account con violazioni ripetute o gravi possono essere chiusi.",
  "dmca.misuse.title": "Avvertenza Abuso",
  "dmca.misuse.content": "L'invio intenzionalmente falso di notifiche o contro‑notifiche può comportare responsabilità per danni.",
  "dmca.contact.title": "Agente Designato",
  "dmca.contact.content": "Email: copyright@kasyrooms.com (oggetto: DMCA Notice).",
  // Community Guidelines
  "guidelines.title": "Linee Guida della Community",
  "guidelines.subtitle": "Standard che mantengono la piattaforma sicura, rispettosa e conforme.",
  "guidelines.intro": "Queste Linee Guida integrano i Termini e si applicano a tutti gli utenti e performer. Le violazioni possono comportare avvisi, sospensioni o chiusura.",
  "guidelines.section.safety.title": "Sicurezza & Consenso",
  "guidelines.section.safety.content": "Ogni interazione deve essere consensuale. Vietato qualsiasi coinvolgimento di minori (reale, simulato o aspetto giovanile che suggerisca minore). Niente doxing, minacce, ricatti o coazione.",
  "guidelines.section.prohibited.title": "Contenuti Vietati",
  "guidelines.section.prohibited.content": "Non ammessi: sfruttamento, bestialità, atti non consensuali, promozione autolesionismo, tratta, incitamento all'odio o propaganda estremista, richiesta di servizi sessuali off‑platform.",
  "guidelines.section.privacy.title": "Privacy & Dati Personali",
  "guidelines.section.privacy.content": "Non chiedere o divulgare recapiti personali (telefono, indirizzo, social privati) o documenti di identità. Segnala tentativi di richiesta.",
  "guidelines.section.payments.title": "Pagamenti & Mance",
  "guidelines.section.payments.content": "Tutti i compensi devono transitare tramite i meccanismi ufficiali. Richieste di pagamenti diretti esterni vietate per prevenire frodi.",
  "guidelines.section.reporting.title": "Segnalazioni & Enforcement",
  "guidelines.section.reporting.content": "Usa gli strumenti di segnalazione o scrivi a safety@kasyrooms.com fornendo timestamp, username e contesto. I casi di sicurezza minori vengono trattati con massima priorità.",
  "guidelines.section.updates.title": "Aggiornamenti",
  "guidelines.section.updates.content": "Possiamo aggiornare queste Linee; uso continuato = accettazione.",
  // Refund Policy
  "refund.title": "Politica di Rimborso",
  "refund.subtitle": "Come gestiamo acquisti di crediti virtuali, mance e abbonamenti.",
  "refund.intro": "Gli elementi virtuali (crediti, token, mance, accesso a tempo) non sono rimborsabili una volta accreditati salvo eccezioni legali o casi specifici descritti qui.",
  "refund.section.finality.title": "Vendite Finali",
  "refund.section.finality.content": "Una volta elaborato con successo e accreditato sull'account, l'acquisto è definitivo salvo diritti inderogabili del consumatore.",
  "refund.section.unauthorized.title": "Uso Non Autorizzato",
  "refund.section.unauthorized.content": "Segnala transazioni sospette entro 48h a billing@kasyrooms.com. L'account può essere temporaneamente bloccato durante l'indagine.",
  "refund.section.technical.title": "Errori Tecnici",
  "refund.section.technical.content": "Se una sessione privata pagata fallisce per disservizio della piattaforma (non connettività utente) e dura meno di 5 minuti effettivi, contatta il supporto con orari per possibile riaccredito.",
  "refund.section.chargebacks.title": "Chargeback",
  "refund.section.chargebacks.content": "Chargeback infondati possono comportare sospensione. Invitiamo a contattare prima il supporto per chiarimenti.",
  "refund.section.subscriptions.title": "Rinnovo Abbonamenti",
  "refund.section.subscriptions.content": "Gli abbonamenti si rinnovano automaticamente salvo cancellazione prima del rinnovo. Non forniamo rimborsi proporzionali dopo il rinnovo.",
  "refund.section.process.title": "Procedura Richiesta",
  "refund.section.process.content": "Invia: ID account, ID transazione, data, importo, spiegazione ed evidenze (screenshot, log). Risposta in ~3 giorni lavorativi.",
  "refund.section.law.title": "Diritti di Legge",
  "refund.section.law.content": "Nulla limita diritti che non possono essere esclusi dalla normativa applicabile.",
  // Age Compliance
  "ageCompliance.title": "Conformità 18+ e 2257",
  },
  fr: {
      // Home section subtitles
      "home.online.subtitle": "Modèles actuellement en direct et disponibles",
      "home.top.subtitle": "Les meilleures performances de notre plateforme",
      "home.new.subtitle": "Nouveaux visages rejoignant la communauté",
      "home.trending.subtitle": "Modèles les plus populaires en ce moment",
      "home.favorites.subtitle": "Vos modèles enregistrés",
      "home.all.subtitle": "Parcourir tous les modèles disponibles",
    favorites: "Favoris", login: "Connexion", signup: "Inscription", becomeModel: "Devenir Modèle", logout: "Déconnexion", welcome: "Bienvenue", searchPlaceholder: "Rechercher des modèles...", browseModels: "Parcourir les Modèles", startPrivateShow: "Démarrer le show privé", startChat: "Commencer Chat", viewAll: "Voir tout", allModels: "Tous les Modèles", noModelsFound: "Aucun modèle trouvé", clearFilters: "Effacer les filtres", helpCenter: "Centre d'aide", contactUs: "Nous contacter", termsOfService: "Conditions d'utilisation", privacyPolicy: "Politique de confidentialité", cookiePolicy: "Politique des cookies", becomeAModel: "Devenir Modèle", yourFavorites: "Vos Favoris", noFavoritesYet: "Pas encore de favoris", tapHeartToAdd: "Appuyez sur le cœur d'un modèle pour l'ajouter aux favoris", welcomeBack: "Bon retour", signInToAccount: "Connectez-vous à votre compte pour accéder au contenu premium", username: "Nom d'utilisateur", password: "Mot de passe", enterUsername: "Entrez votre nom d'utilisateur", enterPassword: "Entrez votre mot de passe", signingIn: "Connexion...", signIn: "Se connecter", dontHaveAccount: "Vous n'avez pas de compte ?", signUpHere: "Inscrivez-vous ici", loginSuccessful: "Connexion réussie", loginFailed: "Échec de la connexion", invalidCredentials: "Utilisez le nom d'utilisateur 'testuser' avec n'importe quel mot de passe", yearsOld: "ans", watching: "regardent", languages: "Langues", specialties: "Spécialités", online: "En ligne", offline: "Hors ligne", securePayments: "Paiements sécurisés", acceptPaymentMethods: "Nous acceptons tous les principaux modes de paiement", search: "Rechercher", sortBy: "Trier par", status: "Statut", all: "Tous", name: "Nom", rating: "Évaluation", viewers: "Spectateurs", age: "Âge", showing: "Affichage", of: "de", models: "modèles"
    ,"filters.online": "En ligne", "filters.top": "Les mieux notés", "filters.new": "Nouveaux modèles", "filters.trending": "Tendance", "filters.favorites": "Favoris"
    ,"filter.online": "En ligne maintenant", "filter.top": "Les mieux notés", "filter.new": "Nouveaux modèles", "filter.trending": "Tendance", "filter.favorites": "Favoris"

    ,"favorites.title": "Vos Favoris"
    ,"favorites.empty.title": "Pas encore de favoris"
    ,"favorites.empty.subtitle": "Appuyez sur le cœur d'un modèle pour l'ajouter aux favoris"
    ,"common.errors.loadModels": "Impossible de charger les modèles"
    ,"common.errors.tryLater": "Veuillez réessayer plus tard"
    ,"common.noModels.title": "Aucun modèle trouvé"
    ,"common.noModels.subtitle": "Essayez d'ajuster vos filtres"
    ,"modelCard.startChat": "Commencer Chat"
    ,"modelCard.online": "En ligne"
    ,"modelCard.offline": "Hors ligne"
    ,"modelCard.watching": "regardent"
    ,"modelCard.new": "Nouveau"

    ,"footer.about.description": "Plateforme de chat vidéo premium vous connectant à des modèles vérifiés dans le monde entier."
    ,"footer.quickLinks.title": "Liens rapides"
    ,"footer.quickLinks.browse": "Parcourir les Modèles"
    
    ,"footer.quickLinks.becomeModel": "Devenir Modèle"
    
    ,"footer.support.title": "Support"
    ,"footer.support.help": "Centre d'aide"
    ,"footer.support.contact": "Nous contacter"
    ,"footer.support.terms": "Conditions d'utilisation"
    ,"footer.support.privacy": "Politique de confidentialité"
    ,"footer.support.cookies": "Politique des cookies"
    ,"footer.payments.title": "Paiements sécurisés"
  ,"footer.payments.description": "Paiements acceptés : Visa et Mastercard"
    ,"footer.payments.secure": "Chiffré SSL et sécurisé"
    ,"footer.links.privacy": "Confidentialité"
    ,"footer.links.terms": "Conditions"
  ,"footer.links.cookies": "Cookies"
  ,"footer.links.policies": "Politiques connexes"
    ,"footer.copyright": "Tous droits réservés. | 18+ seulement"

    // Support / FAQ
    ,"support.title": "Support"
    ,"support.intro": "Accédez aux ressources, aux politiques et à l’assistance pour chaque besoin."
    ,"support.help": "Centre d'aide"
    ,"support.faq": "FAQ"
    ,"support.contact": "Contact"
    ,"support.email": "E-mail"
    ,"support.needMore": "Besoin de plus d’aide ? Écrivez à"
    ,"faq.title": "Foire aux questions"
    ,"faq.intro": "Cliquez sur une question pour voir la réponse."
    ,"faq.q1": "Comment créer un compte ?"
    ,"faq.a1": "Cliquez sur S’inscrire, remplissez les champs requis et confirmez votre e-mail pour activer le compte."
    ,"faq.q2": "Comment fonctionne une session avec un modèle ?"
    ,"faq.a2": "Ouvrez le profil du modèle et démarrez la session. Le temps démarre immédiatement et le coût est déduit automatiquement de votre solde."
    ,"faq.q3": "Puis-je mettre une session en pause ?"
    ,"faq.a3": "Non. Une fois démarrée, une session ne peut pas être mise en pause ni interrompue."
    ,"faq.q4": "Y a-t-il un bonus de bienvenue ?"
    ,"faq.a4": "Oui. Tous les nouveaux utilisateurs reçoivent un bonus utilisable une seule fois, à consommer avant les crédits payants."
    ,"faq.q5": "Que se passe-t-il si je quitte ou perds la connexion pendant une session ?"
    ,"faq.a5": "Le minuteur continue de tourner. En revenant, vous reprenez avec le temps restant."
    ,"faq.q6": "Comment recharger mon solde ?"
    ,"faq.a6": "Vous pouvez recharger votre solde depuis la section Wallet en choisissant un moyen de paiement disponible."
    ,"faq.q7": "Les crédits achetés expirent-ils ?"
    ,"faq.a7": "Non. Les crédits achetés n’expirent pas."
    ,"faq.q8": "Les chats et les sessions sont-ils privés ?"
    ,"faq.a8": "Oui. Toutes les communications sont privées et ne sont pas enregistrées."
    ,"faq.q9": "Comment devenir modèle ?"
    ,"faq.a9": "Visitez la page Devenir Modèle et terminez le processus d’inscription et de vérification."
    ,"faq.q10": "Comment contacter l’assistance ?"
    ,"faq.a10": "Vous pouvez contacter le support via la page Contact ou par e-mail pour toute demande."
    ,"faq.stillNeed": "Besoin d’assistance supplémentaire ?"

    ,"becomeModel.title": "Devenir Modèle"
    ,"becomeModel.subtitle": "Rejoignez notre plateforme et monétisez votre talent."
    ,"becomeModel.benefitsTitle": "Pourquoi rejoindre Kasyrooms"
    ,"becomeModel.benefits.0.title": "Gagnez plus"
    ,"becomeModel.benefits.0.description": "Rémunérations compétitives et bonus."
    ,"becomeModel.benefits.1.title": "Développez votre marque"
    ,"becomeModel.benefits.1.description": "Touchez un public mondial."
    ,"becomeModel.benefits.2.title": "Communauté solidaire"
    ,"becomeModel.benefits.2.description": "Nous vous aidons avec des outils et conseils."
    ,"becomeModel.benefits.3.title": "Outils pro"
    ,"becomeModel.benefits.3.description": "Streaming HD et contrôles avancés."
    ,"becomeModel.requirementsTitle": "Exigences"
    ,"becomeModel.requirements.0": "18+ ans"
    ,"becomeModel.requirements.1": "Pièce d'identité valide"
    ,"becomeModel.requirements.2": "Connexion internet stable"
    ,"becomeModel.requirements.3": "Webcam et micro"
    ,"becomeModel.stepsTitle": "Comment commencer"
    ,"becomeModel.stepTitle": "Étape"
    ,"becomeModel.steps.0": "Créez votre compte"
    ,"becomeModel.steps.1": "Vérifiez votre identité"
    ,"becomeModel.steps.2": "Configurez votre profil"
    ,"becomeModel.steps.3": "Commencez à diffuser"
    ,"becomeModel.ctaTitle": "Prêt(e) à devenir modèle ?"
    ,"becomeModel.ctaSubtitle": "Postulez maintenant et commencez à gagner."
    ,"becomeModel.ctaButton": "Postuler"

    ,"help.title": "Centre d'aide"
    ,"help.subtitle": "Trouvez des réponses et des guides."

  ,"terms.title": "Conditions d'utilisation"
  ,"terms.sections.acceptance.title": "Acceptation des Conditions"
  ,"terms.sections.acceptance.content": "En accédant à la Plateforme vous acceptez intégralement les présentes Conditions (version 14/10/2025). Si vous ne les acceptez pas, cessez immédiatement toute utilisation. Elles régissent l'accès à un service de vidéo‑chat en direct pour adultes." 
  ,"terms.sections.services.title": "Services Fournis"
  ,"terms.sections.services.content": "Nous fournissons une plateforme modérée de vidéo‑chat pour adultes : flux publics, sessions privées, messagerie temps réel, pourboires, achat de crédits/abonnements et outils de modération. Les performers sont des créateurs indépendants responsables du respect de la loi et des présentes Conditions. Nous n'organisons pas de rencontres physiques ni d'activités illégales." 
  ,"terms.sections.registration.title": "Inscription & Admissibilité"
  ,"terms.sections.registration.content": "Vous devez avoir 18 ans révolus (ou majorité légale plus élevée). Vous fournissez des informations exactes et les maintenez à jour. Protégez vos identifiants. Nous pouvons exiger une re‑vérification d'âge/identité." 
  ,"terms.sections.conduct.title": "Utilisation Acceptable & Interdictions"
  ,"terms.sections.conduct.content": "Interdits: (1) contenus illégaux, non consensuels, impliquant des mineurs; (2) harcèlement, menaces, doxing; (3) sollicitation de données personnelles ou rencontres; (4) enregistrements ou redistribution non autorisés; (5) injection de malware, scraping, contournement sécurité; (6) incitation haine/traite/prostitution forcée, auto‑mutilation. Tolérance zéro pour violations graves." 
  ,"terms.sections.payment.title": "Paiements, Crédits & Remboursements"
  ,"terms.sections.payment.content": "Les achats de crédits, tokens ou abonnements sont définitifs une fois livrés sauf droits consommateurs impératifs. Les processeurs tiers gèrent la facturation; nous ne stockons pas les numéros de carte complets. Les rétrofacturations frauduleuses peuvent entraîner suspension." 
  ,"terms.sections.intellectual.title": "Propriété Intellectuelle"
  ,"terms.sections.intellectual.content": "Logiciel, marque et design: propriété de nous ou nos concédants. Les performers conservent leurs droits et nous accordent une licence mondiale non exclusive, sans redevance, pour héberger, transcoder, diffuser et présenter des extraits promotionnels. Enregistrements / captures non autorisés interdits." 
  ,"terms.sections.privacy.title": "Confidentialité"
  ,"terms.sections.privacy.content": "Le traitement des données personnelles suit notre Politique de Confidentialité (bases légales: exécution du contrat, intérêt légitime sécurité, obligations légales, consentement marketing/cookies)." 
  ,"terms.sections.termination.title": "Suspension & Résiliation"
  ,"terms.sections.termination.content": "Nous pouvons suspendre ou résilier sans préavis pour violations matérielles, fraude, demandes légales, risques sécurité. Les crédits restants peuvent être perdus sauf dispositions impératives." 
  ,"terms.sections.limitation.title": "Limitation de Responsabilité"
  ,"terms.sections.limitation.content": "Service fourni 'EN L'ÉTAT'. Dans la mesure légale permise nous excluons dommages indirects, perte de bénéfices, données ou réputation. Plafond de responsabilité: montants payés sur 6 derniers mois ou 100 EUR (le plus élevé). Aucune limitation pour fraude ou droits impératifs." 
  ,"terms.sections.changes.title": "Modifications"
  ,"terms.sections.changes.content": "Nous pouvons modifier les Conditions avec effet prospectif. Avis par message sur le site ou email. Poursuite d'utilisation = acceptation." 
    ,"terms.subtitle": "Dernière mise à jour :"
  ,"terms.contact.title": "Besoin d'aide juridique ou de précisions ?"
  ,"terms.contact.content": "Écrivez à notre équipe juridique à"
  ,"terms.related.title": "Politiques connexes"
  ,"privacy.title": "Politique de confidentialité"
  ,"privacy.sections.introduction.title": "Introduction"
  ,"privacy.sections.introduction.content": "Cette Politique (révision 14/10/2025) explique comment nous collectons, utilisons, divulguons et protégeons les données personnelles des utilisateurs et performers. Nous sommes Responsable de traitement pour l'exploitation de la Plateforme et Sous‑traitant pour certains traitements effectués pour le compte des performers." 
  ,"privacy.sections.collection.title": "Données Collectées"
  ,"privacy.sections.collection.content": "(a) Compte (pseudo, email, âge / vérification); (b) Profil & Préférences; (c) Métadonnées de transactions (paiements gérés par processeurs tiers); (d) Journaux techniques (IP, appareil, navigateur, événements, signaux fraude); (e) Contenu d'interaction & chat; (f) Cookies; (g) Documents KYC chiffrés." 
  ,"privacy.sections.usage.title": "Utilisation & Bases Légales"
  ,"privacy.sections.usage.content": "Fourniture services (contrat); personnalisation & sécurité (intérêt légitime); prévention fraude & paiement (contrat / intérêt légitime); obligations légales; marketing & cookies non essentiels (consentement); analyses agrégées (intérêt légitime)." 
  ,"privacy.sections.sharing.title": "Partage & Transferts"
  ,"privacy.sections.sharing.content": "Partage restreint avec hébergement cloud, anti‑fraude, analytics, email, KYC, processeurs de paiement sous clauses contractuelles. Transferts internationaux via clauses types ou équivalents. Aucune vente de données contre rémunération." 
  ,"privacy.sections.cookies.title": "Cookies & Suivi"
  ,"privacy.sections.cookies.content": "Cookies essentiels (session, sécurité), analytics (performance), fonctionnels (langue, préférences), marketing/retargeting après consentement. Gestion via l'interface Cookies." 
  ,"privacy.sections.security.title": "Sécurité"
  ,"privacy.sections.security.content": "Chiffrement TLS, hachage salé des identifiants, contrôle d'accès, journalisation, WAF, détection automatisée d'abus. Aucune sécurité absolue garantie." 
  ,"privacy.sections.retention.title": "Durées de Conservation"
  ,"privacy.sections.retention.content": "Compte & transactions: durée de l'activité + jusqu'à 6 ans; logs jusqu'à 12 mois; KYC 5–10 ans selon loi. Anonymisation ou agrégation ensuite." 
  ,"privacy.sections.rights.title": "Droits des Personnes"
  ,"privacy.sections.rights.content": "Accès, rectification, effacement, limitation, portabilité, opposition, retrait du consentement, plainte auprès de l'autorité. Contact: privacy@kasyrooms.com." 
  ,"privacy.sections.children.title": "Protection des Mineurs"
  ,"privacy.sections.children.content": "Plateforme strictement réservée aux 18+. Contenu impliquant des mineurs (réels ou simulés) interdit et signalé." 
  ,"privacy.sections.changes.title": "Mises à Jour"
  ,"privacy.sections.changes.content": "Les révisions seront publiées avec nouvelle date. Usage continu = acceptation." 
    ,"privacy.subtitle": "Dernière mise à jour :"
    ,"privacy.contact.title": "Des questions sur cette politique ?"
    ,"privacy.contact.content": "Contactez notre équipe confidentialité à"

  ,"cookies.title": "Politique des cookies"
  ,"cookies.lastUpdated": "Dernière mise à jour :"
  ,"cookies.types.essential.title": "Essentiels"
  ,"cookies.types.essential.description": "Nécessaires à l'authentification, routage et sécurité de base." 
  ,"cookies.types.analytics.title": "Analytics"
  ,"cookies.types.analytics.description": "Mesure performance, erreurs et stabilité." 
  ,"cookies.types.marketing.title": "Marketing"
  ,"cookies.types.marketing.description": "Suivi campagnes & retargeting (sur consentement)." 
  ,"cookies.types.functional.title": "Fonctionnels"
  ,"cookies.types.functional.description": "Mémorisent langue, préférences d'affichage et paramètres utilisateur." 
  ,"cookies.banner.message": "Nous utilisons des cookies essentiels et, avec votre consentement, des cookies fonctionnels, analytiques et marketing. Vous pouvez modifier votre choix à tout moment depuis les paramètres des cookies."
  ,"cookies.banner.customize": "Personnaliser"
  ,"cookies.banner.necessary": "Techniques/nécessaires (toujours actifs)"
  ,"common.back": "Retour"
    ,"cookies.subtitle": "Gérez vos préférences de cookies."
    ,"cookies.what.title": "Que sont les cookies ?"
    ,"cookies.what.content": "Les cookies mémorisent vos préférences pour améliorer l'expérience."
    ,"cookies.preferences.title": "Préférences de cookies"
    ,"cookies.required": "Requis"
    ,"cookies.optional": "Optionnel"
    ,"cookies.acceptAll": "Tout accepter"
    ,"cookies.savePreferences": "Enregistrer"
    ,"cookies.rejectAll": "Tout refuser"
    ,"cookies.usage.title": "Comment nous utilisons les cookies"
    ,"cookies.usage.sections.performance.title": "Performance"
    ,"cookies.usage.sections.performance.content": "Nous mesurons les performances du site."
    ,"cookies.usage.sections.personalization.title": "Personnalisation"
    ,"cookies.usage.sections.personalization.content": "Nous retenons vos paramètres."
    ,"cookies.usage.sections.advertising.title": "Publicité"
    ,"cookies.usage.sections.advertising.content": "Nous pouvons afficher des annonces pertinentes."
    ,"cookies.managing.title": "Gérer les cookies"
    ,"cookies.managing.content": "Vous pouvez les contrôler dans votre navigateur."

    ,"contact.title": "Nous contacter"
    ,"contact.subtitle": "Nous serions ravis de vous entendre."
    ,"contact.form.title": "Envoyez-nous un message"
    ,"contact.form.firstName": "Prénom"
    ,"contact.form.firstNamePlaceholder": "Votre prénom"
    ,"contact.form.lastName": "Nom"
    ,"contact.form.lastNamePlaceholder": "Votre nom"
    ,"contact.form.email": "Email"
    ,"contact.form.emailPlaceholder": "votre@email.com"
    ,"contact.form.subject": "Sujet"
    ,"contact.form.subjectPlaceholder": "Choisissez un sujet"
    ,"contact.form.subjects.general": "Général"
    ,"contact.form.subjects.technical": "Problème technique"
    ,"contact.form.subjects.billing": "Facturation"
    ,"contact.form.subjects.model": "Devenir modèle"
    ,"contact.form.message": "Message"
    ,"contact.form.messagePlaceholder": "Saisissez votre message..."
    ,"contact.form.submit": "Envoyer le message"
    ,"contact.info.email.title": "Email"
    ,"contact.info.email.description": "Nous vous répondrons sous 24 à 48 heures."
    ,"contact.info.phone.title": "Téléphone"
    ,"contact.info.phone.description": "Lun-Ven 9:00 - 18:00 (CET)"
    ,"contact.info.address.title": "Adresse"
    ,"contact.info.address.description": "Nous opérons à l'échelle mondiale avec des équipes distribuées."
    ,"contact.info.hours.title": "Horaires de travail"
    ,"contact.info.hours.weekdays": "Lun - Ven : 9:00 - 18:00"
    ,"contact.info.hours.weekend": "Sam - Dim : 10:00 - 16:00"
    ,"contact.form.name": "Nom"
    ,"contact.form.send": "Envoyer le message"
  ,"dmca.title": "Politique DMCA / Copyright"
  ,"dmca.subtitle": "Signaler une atteinte présumée aux droits d'auteur concernant du contenu sur la plateforme."
  ,"dmca.intro": "Nous respectons les droits de propriété intellectuelle et répondons aux notifications correctement formulées en vertu du DMCA et des régimes équivalents."
  ,"dmca.notice.title": "Soumettre une Notification"
  ,"dmca.notice.content": "Pour notifier une violation: (1) identifiez l'œuvre protégée; (2) indiquez les URL précises du contenu litigieux; (3) fournissez vos coordonnées complètes; (4) déclarez de bonne foi que l'usage contesté n'est pas autorisé; (5) déclarez sous peine de parjure être le titulaire ou mandaté; (6) signez physiquement ou électroniquement. Envoyez à copyright@kasyrooms.com."
  ,"dmca.counter.title": "Contre‑Notification"
  ,"dmca.counter.content": "Si votre contenu a été retiré par erreur ou autorisation valide: envoyez une contre‑notification indiquant le matériel retiré, son emplacement avant retrait, vos coordonnées, consentement à la juridiction compétente et une déclaration sous peine de parjure de bonne foi. Sauf action judiciaire du plaignant, le contenu peut être rétabli après ~10 jours ouvrables."
  ,"dmca.repeat.title": "Infractions Répétées"
  ,"dmca.repeat.content": "Les comptes présentant des atteintes répétées ou flagrantes aux droits d'auteur peuvent être résiliés."
  ,"dmca.misuse.title": "Avertissement Abus"
  ,"dmca.misuse.content": "L'envoi délibéré de notifications ou contre‑notifications frauduleuses peut engager votre responsabilité pour dommages."
  ,"dmca.contact.title": "Agent Désigné"
  ,"dmca.contact.content": "Email (préféré): copyright@kasyrooms.com — Objet: DMCA Notice."
  ,"guidelines.title": "Règles Communautaires"
  ,"guidelines.subtitle": "Normes qui garantissent un espace sûr, respectueux et conforme."
  ,"guidelines.intro": "Ces Règles complètent les Conditions et s'appliquent à tous les utilisateurs et performers. Les violations peuvent entraîner avertissements, suspension ou résiliation."
  ,"guidelines.section.safety.title": "Sécurité & Consentement"
  ,"guidelines.section.safety.content": "Toute interaction doit être pleinement consentie. Aucune présence de mineurs (réels, simulés ou apparence juvénile). Interdits: doxing, menaces, chantage, coercition."
  ,"guidelines.section.prohibited.title": "Contenus Interdits"
  ,"guidelines.section.prohibited.content": "Non autorisés: exploitation, bestialité, actes non consensuels, promotion d'automutilation, traite, discours de haine ou propagande extrémiste, sollicitation de services sexuels hors plateforme."
  ,"guidelines.section.privacy.title": "Vie Privée & Données"
  ,"guidelines.section.privacy.content": "Ne demandez ni ne divulguez coordonnées personnelles (adresse, téléphone, comptes privés) ou documents d'identité. Signalez toute tentative."
  ,"guidelines.section.payments.title": "Paiements & Pourboires"
  ,"guidelines.section.payments.content": "Toute rémunération passe par les mécanismes officiels. Les demandes de paiement direct hors plateforme sont interdites pour prévenir les fraudes."
  ,"guidelines.section.reporting.title": "Signalement & Application"
  ,"guidelines.section.reporting.content": "Utilisez les outils de signalement ou écrivez à safety@kasyrooms.com avec horodatage, pseudonyme et contexte. Les urgences impliquant la protection des mineurs sont traitées en priorité absolue."
  ,"guidelines.section.updates.title": "Mises à Jour"
  ,"guidelines.section.updates.content": "Nous pouvons réviser ces Règles; l'utilisation continue après publication vaut acceptation."
  ,"refund.title": "Politique de Remboursement"
  ,"refund.subtitle": "Traitement des achats de crédits virtuels, pourboires et abonnements."
  ,"refund.intro": "Les éléments virtuels (crédits, tokens, pourboires, accès temporisé) ne sont en principe pas remboursables une fois livrés, sauf exceptions limitées décrites ci‑dessous ou droits légaux impératifs."
  ,"refund.section.finality.title": "Caractère Définitif"
  ,"refund.section.finality.content": "Une fois créditée sur votre compte, la transaction est finale sauf obligation légale contraire."
  ,"refund.section.unauthorized.title": "Utilisation Non Autorisée"
  ,"refund.section.unauthorized.content": "Signalez toute opération non autorisée dans les 48 h à billing@kasyrooms.com. Un verrou temporaire du compte peut s'appliquer pendant l'enquête."
  ,"refund.section.technical.title": "Défaillances Techniques"
  ,"refund.section.technical.content": "Si une session privée payante échoue à cause d'une panne plateforme (hors connexion utilisateur) et dure moins de 5 minutes, contactez le support avec horodatages pour éventuel réémission de crédits."
  ,"refund.section.chargebacks.title": "Rétrofacturations"
  ,"refund.section.chargebacks.content": "Les rétrofacturations infondées peuvent entraîner suspension. Contactez d'abord le support pour résoudre un différend."
  ,"refund.section.subscriptions.title": "Renouvellement d'Abonnements"
  ,"refund.section.subscriptions.content": "Les abonnements se renouvellent automatiquement sauf annulation avant l'échéance. Aucun remboursement partiel après renouvellement."
  ,"refund.section.process.title": "Processus de Demande"
  ,"refund.section.process.content": "Fournissez: ID compte, ID transaction, date, montant, motif, pièces (captures écran, logs). Réponse visée: 3 jours ouvrés."
  ,"refund.section.law.title": "Droits Légaux"
  ,"refund.section.law.content": "Aucune disposition n'altère vos droits impératifs en matière de protection des consommateurs."
  ,"ageCompliance.title": "Vérification d'âge (18+) & 2257"

  // Missing keys (kept in sync with EN)
  ,"email": "E-mail"
  ,"common.loading.auth": "Chargement de l’authentification…"

  ,"models.subtitle": "Découvrez tous nos modèles incroyables"
  ,"notFound.title": "404 Page introuvable"
  ,"notFound.subtitle": "La page que vous cherchez n'existe pas."

  ,"ageCompliance.modal.title": "Confirmer l'âge"
  ,"ageCompliance.modal.body": "Ce site contient du contenu pour adultes. Confirmez-vous avoir au moins 18 ans (ou l'âge légal dans votre pays) ?"
  ,"ageCompliance.modal.yes": "Oui, j'ai 18+"
  ,"ageCompliance.modal.no": "Non"
  ,"ageCompliance.modal.blocked": "Session terminée. Pour accéder au contenu, vous devez avoir au moins 18 ans."
  ,"ageCompliance.modal.exit": "Quitter"

  ,"register.title": "Rejoindre Kasyrooms"
  ,"register.subtitle": "Créez votre compte pour accéder à du contenu exclusif"
  ,"register.firstName": "Prénom"
  ,"register.firstName.placeholder": "Jane"
  ,"register.lastName": "Nom"
  ,"register.lastName.placeholder": "Doe"
  ,"register.dob": "Date de naissance"
  ,"register.username.placeholder": "Choisissez un nom d'utilisateur"
  ,"register.email.placeholder": "Entrez votre e-mail"
  ,"register.password.placeholder": "Créez un mot de passe"
  ,"register.confirmPassword": "Confirmer le mot de passe"
  ,"register.confirmPassword.placeholder": "Confirmez votre mot de passe"
  ,"register.creating": "Création du compte…"
  ,"register.create": "Créer un compte"
  ,"register.haveAccount": "Vous avez déjà un compte ?"
  ,"register.signInHere": "Connectez-vous ici"
  ,"register.toast.passwordMismatch.title": "Mot de passe différent"
  ,"register.toast.passwordMismatch.desc": "Les mots de passe ne correspondent pas"
  ,"register.toast.accountCreated.title": "Compte créé"
  ,"register.toast.accountCreated.desc": "Bienvenue sur Kasyrooms !"
  ,"register.toast.failed.title": "Inscription échouée"
  ,"register.toast.failed.desc": "Veuillez réessayer plus tard"

  ,"kyc.title": "Onboarding KYC"
  ,"kyc.loggedAs": "Connecté en tant que"
  ,"kyc.validation.title": "Validation"
  ,"kyc.validation.fullName": "Nom complet requis"
  ,"kyc.validation.docType": "Sélectionnez un type de document"
  ,"kyc.submitted.title": "Envoyé"
  ,"kyc.submitted.desc": "Demande KYC créée. Vous pouvez maintenant télécharger des images."
  ,"kyc.submissionFailed.title": "Envoi échoué"
  ,"kyc.upload.missingApp.title": "Demande manquante"
  ,"kyc.upload.missingApp.desc": "Soumettez d'abord le formulaire KYC pour obtenir un ID de demande."
  ,"kyc.upload.noFile.title": "Aucun fichier sélectionné"
  ,"kyc.upload.noFile.desc": "Choisissez une image à télécharger."
  ,"kyc.uploaded.title": "Téléversé"
  ,"kyc.uploaded.descSuffix": "téléversé avec succès."
  ,"kyc.upload.kind.front": "Recto"
  ,"kyc.upload.kind.back": "Verso"
  ,"kyc.upload.kind.selfie": "Selfie"
  ,"kyc.uploadFailed.title": "Échec du téléchargement"
  ,"kyc.form.fullName": "Nom complet"
  ,"kyc.form.fullName.placeholder": "Jane Doe"
  ,"kyc.form.dob": "Date de naissance"
  ,"kyc.form.country": "Pays"
  ,"kyc.form.country.placeholder": "Pays"
  ,"kyc.form.docType": "Type de document"
  ,"kyc.form.docType.select": "Sélectionner…"
  ,"kyc.form.docType.passport": "Passeport"
  ,"kyc.form.docType.idCard": "Carte d'identité"
  ,"kyc.form.docType.driver": "Permis de conduire"
  ,"kyc.form.docFrontUrl": "URL du document (recto)"
  ,"kyc.form.docBackUrl": "URL du document (verso)"
  ,"kyc.form.selfieUrl": "URL du selfie"
  ,"kyc.form.url.placeholder": "https://..."
  ,"kyc.form.notes": "Notes (optionnel)"
  ,"kyc.form.notes.placeholder": "Quelque chose à ajouter"
  ,"kyc.form.submit": "Envoyer la demande"
  ,"kyc.form.submitting": "Envoi…"
  ,"kyc.applicationId": "ID de demande"
  ,"kyc.noImage": "Aucune image"
  ,"kyc.upload": "Téléverser"
  ,"kyc.uploading": "Téléversement…"

  ,"dmcaSubmit.title": "Soumettre une demande de retrait DMCA"
  ,"dmcaSubmit.validation.title": "Validation"
  ,"dmcaSubmit.validation.noUrls": "Ajoutez au moins une URL contrefaisante."
  ,"dmcaSubmit.submitted.title": "Envoyé"
  ,"dmcaSubmit.submitted.desc": "Demande DMCA envoyée. Nous examinerons sous peu."
  ,"dmcaSubmit.failed.title": "Envoi échoué"
  ,"dmcaSubmit.form.name": "Votre nom"
  ,"dmcaSubmit.form.email": "Votre e-mail"
  ,"dmcaSubmit.form.originalUrl": "URL du contenu original"
  ,"dmcaSubmit.form.infringingUrls": "URLs contrefaisantes (une par ligne ou séparées par des virgules)"
  ,"dmcaSubmit.form.signature": "Signature (tapez votre nom complet)"
  ,"dmcaSubmit.form.notes": "Notes supplémentaires (optionnel)"
  ,"dmcaSubmit.form.submit": "Envoyer la demande"
  ,"dmcaSubmit.form.submitting": "Envoi…"
  ,"dmcaSubmit.placeholder.name": "Jane Doe"
  ,"dmcaSubmit.placeholder.email": "vous@exemple.com"
  ,"dmcaSubmit.placeholder.originalUrl": "https://votre-site.com/original"
  ,"dmcaSubmit.placeholder.infringingUrls": "https://exemple.com/contrefaisant-1\nhttps://exemple.com/contrefaisant-2"
  ,"dmcaSubmit.placeholder.signature": "Jane Doe"
  ,"dmcaSubmit.placeholder.notes": "Contexte ou clarification"

  ,"modelProfile.notFound.title": "Modèle introuvable"
  ,"modelProfile.notFound.subtitle": "Le modèle que vous cherchez n'existe pas."
  ,"modelProfile.goBack": "Retour"
  ,"modelProfile.unavailable": "Indisponible"
  ,"modelProfile.busy": "Occupé"
  ,"modelProfile.blocked": "Bloqué"
  ,"modelProfile.sendMessage.title": "Envoyer un message"
  ,"modelProfile.sendMessage.placeholder": "Tapez votre message"
  ,"modelProfile.sendMessage.sending": "Envoi…"
  ,"modelProfile.sendMessage.send": "Envoyer"
  ,"modelProfile.blockedNotice": "Vous êtes bloqué par ce modèle."
  ,"modelProfile.tip.title": "Envoyer un pourboire"
  ,"modelProfile.tip.placeholder": "Montant"
  ,"modelProfile.tip.help": "Les pourboires sont prélevés sur le solde de votre wallet."
  ,"modelProfile.tip.sending": "Envoi…"
  ,"modelProfile.tip.send": "Envoyer"
  ,"modelProfile.moderation.title": "Modération"
  ,"modelProfile.moderation.placeholder": "Motif du signalement"
  ,"modelProfile.moderation.sending": "Envoi…"
  ,"modelProfile.moderation.report": "Signaler"
  ,"modelProfile.block": "Bloquer"
  ,"modelProfile.stats.rating": "Note"
  ,"modelProfile.stats.viewers": "Spectateurs"
  ,"modelProfile.alert.blocked": "Vous êtes bloqué par ce modèle."
  ,"modelProfile.alert.offline": "Ce modèle est hors ligne."
  ,"modelProfile.alert.busy": "Ce modèle est actuellement occupé."
  ,"modelProfile.alert.typeMessage": "Veuillez saisir un message"
  ,"modelProfile.alert.messageFailed": "Échec de l'envoi du message"
  ,"modelProfile.alert.messageSent": "Message envoyé"
  ,"modelProfile.alert.enterReason": "Veuillez indiquer un motif"
  ,"modelProfile.alert.reportSent": "Signalement envoyé"
  ,"modelProfile.alert.tipInvalid": "Saisissez un montant valide"
  ,"modelProfile.alert.insufficientFunds": "Fonds insuffisants"
  ,"modelProfile.alert.tipFailed": "Échec du pourboire"
  ,"modelProfile.alert.thanksTip": "Merci pour le pourboire !"
  ,"modelProfile.alert.blockedDone": "Bloqué"
  },
  de: {
      // Home section subtitles
      "home.online.subtitle": "Modelle, die gerade live und verfügbar sind",
      "home.top.subtitle": "Die besten Performer auf unserer Plattform",
      "home.new.subtitle": "Neue Gesichter in unserer Community",
      "home.trending.subtitle": "Zurzeit beliebteste Modelle",
      "home.favorites.subtitle": "Ihre gespeicherten Modelle",
      "home.all.subtitle": "Alle verfügbaren Modelle durchsuchen",
    favorites: "Favoriten", login: "Anmelden", signup: "Registrieren", becomeModel: "Model werden", logout: "Abmelden", welcome: "Willkommen", searchPlaceholder: "Modelle suchen...", browseModels: "Modelle ansehen", startPrivateShow: "Privatshow starten", startChat: "Chat starten", viewAll: "Alle anzeigen", allModels: "Alle Modelle", noModelsFound: "Keine Modelle gefunden", clearFilters: "Filter löschen", helpCenter: "Hilfezentrum", contactUs: "Kontakt", termsOfService: "Nutzungsbedingungen", privacyPolicy: "Datenschutzrichtlinie", cookiePolicy: "Cookie-Richtlinie", becomeAModel: "Model werden", yourFavorites: "Ihre Favoriten", noFavoritesYet: "Noch keine Favoriten", tapHeartToAdd: "Tippen Sie auf das Herz eines Models, um es zu den Favoriten hinzuzufügen", welcomeBack: "Willkommen zurück", signInToAccount: "Melden Sie sich in Ihrem Konto an, um auf Premium-Inhalte zuzugreifen", username: "Benutzername", password: "Passwort", enterUsername: "Geben Sie Ihren Benutzernamen ein", enterPassword: "Geben Sie Ihr Passwort ein", signingIn: "Anmeldung...", signIn: "Anmelden", dontHaveAccount: "Haben Sie kein Konto?", signUpHere: "Hier registrieren", loginSuccessful: "Anmeldung erfolgreich", loginFailed: "Anmeldung fehlgeschlagen", invalidCredentials: "Verwenden Sie den Benutzernamen 'testuser' mit einem beliebigen Passwort", yearsOld: "Jahre alt", watching: "schauen zu", languages: "Sprachen", specialties: "Spezialitäten", online: "Online", offline: "Offline", securePayments: "Sichere Zahlungen", acceptPaymentMethods: "Wir akzeptieren alle gängigen Zahlungsmethoden", search: "Suchen", sortBy: "Sortieren nach", status: "Status", all: "Alle", name: "Name", rating: "Bewertung", viewers: "Zuschauer", age: "Alter", showing: "Zeige", of: "von", models: "Modelle"
    ,"filters.online": "Online", "filters.top": "Top bewertet", "filters.new": "Neue Modelle", "filters.trending": "Im Trend", "filters.favorites": "Favoriten"
    ,"filter.online": "Jetzt online", "filter.top": "Top bewertet", "filter.new": "Neue Modelle", "filter.trending": "Im Trend", "filter.favorites": "Favoriten"

    ,"favorites.title": "Ihre Favoriten"
    ,"favorites.empty.title": "Noch keine Favoriten"
    ,"favorites.empty.subtitle": "Tippen Sie auf das Herz, um Favoriten hinzuzufügen"
    ,"common.errors.loadModels": "Modelle konnten nicht geladen werden"
    ,"common.errors.tryLater": "Bitte versuchen Sie es später erneut"
    ,"common.noModels.title": "Keine Modelle gefunden"
    ,"common.noModels.subtitle": "Passen Sie Ihre Filter an"
    ,"modelCard.startChat": "Chat starten"
    ,"modelCard.online": "Online"
    ,"modelCard.offline": "Offline"
    ,"modelCard.watching": "schauen zu"
    ,"modelCard.new": "Neu"

    ,"footer.about.description": "Premium-Videochat-Plattform, die Sie mit verifizierten Modellen weltweit verbindet."
    ,"footer.quickLinks.title": "Schnellzugriffe"
    ,"footer.quickLinks.browse": "Modelle ansehen"
    
    ,"footer.quickLinks.becomeModel": "Model werden"
    
    ,"footer.support.title": "Support"
    ,"footer.support.help": "Hilfezentrum"
    ,"footer.support.contact": "Kontakt"
    ,"footer.support.terms": "Nutzungsbedingungen"
    ,"footer.support.privacy": "Datenschutz"
    ,"footer.support.cookies": "Cookies"
    ,"footer.payments.title": "Sichere Zahlungen"
  ,"footer.payments.description": "Akzeptierte Zahlungen: Visa und Mastercard"
    ,"footer.payments.secure": "SSL-verschlüsselt & sicher"
    ,"footer.links.privacy": "Datenschutz"
    ,"footer.links.terms": "Bedingungen"
  ,"footer.links.cookies": "Cookies"
  ,"footer.links.policies": "Verwandte Richtlinien"
    ,"footer.copyright": "Alle Rechte vorbehalten. | Nur 18+"

    // Support / FAQ
    ,"support.title": "Support"
    ,"support.intro": "Zugriff auf Ressourcen, Richtlinien und Hilfe für jedes Anliegen."
    ,"support.help": "Hilfezentrum"
    ,"support.faq": "FAQ"
    ,"support.contact": "Kontakt"
    ,"support.email": "E-Mail"
    ,"support.needMore": "Noch mehr Hilfe nötig? Schreibe an"
    ,"faq.title": "Häufig gestellte Fragen"
    ,"faq.intro": "Klicke auf eine Frage, um die Antwort zu sehen."
    ,"faq.q1": "Wie erstelle ich ein Konto?"
    ,"faq.a1": "Klicke auf Registrieren, fülle die erforderlichen Felder aus und bestätige deine E-Mail, um dein Konto zu aktivieren."
    ,"faq.q2": "Wie funktioniert eine Session mit einem Model?"
    ,"faq.a2": "Öffne das Profil des Models und starte die Session. Die Zeit läuft sofort und die Kosten werden automatisch von deinem Guthaben abgezogen."
    ,"faq.q3": "Kann ich eine Session pausieren?"
    ,"faq.a3": "Nein. Sobald sie gestartet ist, kann eine Session weder pausiert noch beendet werden."
    ,"faq.q4": "Gibt es einen Willkommensbonus?"
    ,"faq.a4": "Ja. Alle neuen Nutzer erhalten einen einmaligen Willkommensbonus, der vor echten Credits verbraucht werden muss."
    ,"faq.q5": "Was passiert, wenn ich während einer Session gehe oder die Verbindung verliere?"
    ,"faq.a5": "Der Timer läuft weiter. Wenn du zurückkommst, machst du mit der verbleibenden Zeit weiter."
    ,"faq.q6": "Wie kann ich mein Guthaben aufladen?"
    ,"faq.a6": "Du kannst dein Guthaben im Wallet-Bereich aufladen und eine der verfügbaren Zahlungsmethoden wählen."
    ,"faq.q7": "Verfallen gekaufte Credits?"
    ,"faq.a7": "Nein. Gekaufte Credits verfallen nicht."
    ,"faq.q8": "Sind Chats und Sessions privat?"
    ,"faq.a8": "Ja. Alle Kommunikationen sind privat und werden nicht aufgezeichnet."
    ,"faq.q9": "Wie werde ich ein Model?"
    ,"faq.a9": "Besuche die Seite „Model werden“ und schließe Registrierung und Verifizierung ab."
    ,"faq.q10": "Wie kann ich den Support kontaktieren?"
    ,"faq.a10": "Du kannst den Support über die Kontaktseite oder per E-Mail erreichen."
    ,"faq.stillNeed": "Brauchst du noch Hilfe?"

    ,"becomeModel.title": "Model werden"
    ,"becomeModel.subtitle": "Treten Sie unserer Plattform bei und monetarisieren Sie Ihr Talent."
    ,"becomeModel.benefitsTitle": "Warum Kasyrooms"
    ,"becomeModel.benefits.0.title": "Mehr verdienen"
    ,"becomeModel.benefits.0.description": "Wettbewerbsfähige Auszahlungen und Boni."
    ,"becomeModel.benefits.1.title": "Marke aufbauen"
    ,"becomeModel.benefits.1.description": "Erreichen Sie ein globales Publikum."
    ,"becomeModel.benefits.2.title": "Unterstützende Community"
    ,"becomeModel.benefits.2.description": "Wir helfen mit Tools und Guidance."
    ,"becomeModel.benefits.3.title": "Profi-Tools"
    ,"becomeModel.benefits.3.description": "HD-Streaming und erweiterte Steuerungen."
    ,"becomeModel.requirementsTitle": "Voraussetzungen"
    ,"becomeModel.requirements.0": "18+ Jahre"
    ,"becomeModel.requirements.1": "Gültiger Ausweis"
    ,"becomeModel.requirements.2": "Stabile Internetverbindung"
    ,"becomeModel.requirements.3": "Webcam und Mikrofon"
    ,"becomeModel.stepsTitle": "So starten Sie"
    ,"becomeModel.stepTitle": "Schritt"
    ,"becomeModel.steps.0": "Konto erstellen"
    ,"becomeModel.steps.1": "Identität verifizieren"
    ,"becomeModel.steps.2": "Profil einrichten"
    ,"becomeModel.steps.3": "Streaming starten"
    ,"becomeModel.ctaTitle": "Bereit, Model zu werden?"
    ,"becomeModel.ctaSubtitle": "Jetzt bewerben und heute verdienen."
    ,"becomeModel.ctaButton": "Jetzt bewerben"

    ,"help.title": "Hilfezentrum"
    ,"help.subtitle": "Finden Sie Antworten und Anleitungen."

    ,"terms.title": "Nutzungsbedingungen"
  ,"terms.sections.acceptance.title": "Annahme der Bedingungen"
  ,"terms.sections.acceptance.content": "Durch Zugriff auf die Plattform akzeptieren Sie diese Bedingungen (Revision 14/10/2025). Lehnen Sie sie ab, dürfen Sie den Dienst nicht nutzen. Die Plattform bietet Live‑Videochat für Erwachsene." 
  ,"terms.sections.services.title": "Bereitgestellte Dienste"
  ,"terms.sections.services.content": "Moderierte Erwachsenen‑Videochat‑Plattform: öffentliche Streams, private Sessions, Echtzeit‑Chat, Trinkgelder, Kauf von Credits/Abos, Moderationswerkzeuge. Performer sind unabhängige Anbieter verantwortlich für Rechtskonformität. Keine Vermittlung physischer Treffen oder illegaler Aktivitäten." 
  ,"terms.sections.registration.title": "Registrierung & Voraussetzungen"
  ,"terms.sections.registration.content": "Mindestalter 18 Jahre (oder höheres gesetzliches Erwachsenenalter). Korrekte, aktuelle Angaben; Zugangsdaten schützen. Alters-/Identitäts‑Nachprüfung kann verlangt werden." 
  ,"terms.sections.conduct.title": "Zulässige Nutzung & Verbote"
  ,"terms.sections.conduct.content": "Verboten: (1) illegale, nicht einvernehmliche oder minderjährige Inhalte; (2) Belästigung, Drohung, Doxing; (3) Erfragen persönlicher Kontaktinfos oder Treffen; (4) unautorisierte Aufzeichnung / Weitergabe; (5) Malware, Scraping, Umgehung von Sicherheit, Flooding; (6) Förderung von Hass, Menschenhandel, erzwungener Prostitution, Selbstverletzung. Null‑Toleranz für schwere Verstöße." 
  ,"terms.sections.payment.title": "Zahlungen, Virtuelle Güter & Erstattungen"
  ,"terms.sections.payment.content": "Käufe von Credits, Tokens oder Abos sind final sobald geliefert – vorbehaltlich zwingender Verbraucherrechte. Rückbuchungen bei Betrugsverdacht führen zu Sperrung. Drittanbieterprozessoren verarbeiten Zahlungen; wir speichern keine vollständigen Kartendaten." 
  ,"terms.sections.intellectual.title": "Geistiges Eigentum & Lizenz"
  ,"terms.sections.intellectual.content": "Plattformsoftware, Marken & Design gehören uns oder Lizenzgebern. Performer behalten Rechte an eigenen Inhalten und gewähren eine weltweite, nicht exklusive, lizenzgebührenfreie Lizenz für Hosting, Transkodierung, Streaming & begrenzte Promotion (Thumbnails/Ausschnitte). Nicht autorisierte Aufzeichnung verboten." 
  ,"terms.sections.privacy.title": "Datenschutz"
  ,"terms.sections.privacy.content": "Verarbeitung personenbezogener Daten gemäß Datenschutzerklärung (Rechtsgrundlagen: Vertrag, berechtigtes Interesse Sicherheit, gesetzliche Pflichten, Einwilligung für Marketing/Cookies)." 
  ,"terms.sections.termination.title": "Sperrung & Kündigung"
  ,"terms.sections.termination.content": "Sperrung/Kündigung ohne Vorankündigung bei wesentlichen Verstößen, Betrug, gesetzlichen Anforderungen oder Sicherheitsrisiko möglich. Verbleibende Credits können verfallen, soweit gesetzlich zulässig." 
  ,"terms.sections.limitation.title": "Haftungsbeschränkung"
  ,"terms.sections.limitation.content": "Dienst wird 'WIE BESEHEN' bereitgestellt. Soweit rechtlich zulässig Ausschluss indirekter, zufälliger, Folge‑ oder Strafschäden sowie entgangener Gewinne, Daten‑ oder Reputationsverluste. Gesamthaftung ≤ Beträge der letzten 6 Monate oder 100 EUR (der höhere). Keine Beschränkung bei Vorsatz oder unabdingbaren Rechten." 
  ,"terms.sections.changes.title": "Änderungen"
  ,"terms.sections.changes.content": "Prospektive Änderungen mit Hinweis per Website oder Email; weitere Nutzung = Zustimmung." 
    ,"terms.subtitle": "Zuletzt aktualisiert:"
  ,"terms.contact.title": "Benötigen Sie rechtliche Hilfe oder Klarstellungen?"
  ,"terms.contact.content": "Schreiben Sie an unser Rechtsteam unter"
  ,"terms.related.title": "Verwandte Richtlinien"
    ,"privacy.title": "Datenschutzrichtlinie"
  ,"privacy.sections.introduction.title": "Einleitung"
  ,"privacy.sections.introduction.content": "Diese Richtlinie (Revision 14/10/2025) erläutert Erhebung, Nutzung, Offenlegung und Schutz personenbezogener Daten von Nutzern & Performern. Wir sind Verantwortlicher für Plattformbetrieb und Auftragsverarbeiter für bestimmte performerbezogene Prozesse." 
  ,"privacy.sections.collection.title": "Erhobene Daten"
  ,"privacy.sections.collection.content": "(a) Kontodaten (Alias, Email, Alters-/Verifikationsinfo); (b) Profil & Präferenzen; (c) Transaktions‑Metadaten (Zahlungsabwicklung durch Drittprozessoren); (d) Nutzungs‑ & Logdaten (IP, Gerät, Browser, Ereignisse, Betrugsindikatoren); (e) Chat & Interaktionsinhalte; (f) Cookies/ähnliche Technologien; (g) Verschlüsselte KYC‑Dokumente." 
  ,"privacy.sections.usage.title": "Verwendung & Rechtsgrundlagen"
  ,"privacy.sections.usage.content": "Leistung & Betrieb (Vertrag); Personalisierung & Sicherheit (berechtigtes Interesse); Betrugsprävention & Zahlung (Vertrag/berechtigtes Interesse); gesetzliche Pflichten; Marketing & nicht essentielle Cookies (Einwilligung); Analytik & Produktverbesserung (berechtigtes Interesse, aggregiert/pseudonymisiert)." 
  ,"privacy.sections.sharing.title": "Weitergabe & Übermittlungen"
  ,"privacy.sections.sharing.content": "Weitergabe an Zahlungsprozessoren, Hosting, Analytics, Anti‑Fraud, Email & KYC‑Dienstleister unter DPA. Internationale Übermittlungen über Standardvertragsklauseln oder gleichwertige Schutzmechanismen. Kein Verkauf personenbezogener Daten gegen Entgelt." 
  ,"privacy.sections.cookies.title": "Cookies & Tracking"
  ,"privacy.sections.cookies.content": "Essentielle (Session, Sicherheit), Analytics (Performance), Funktionale (Sprache/Präferenzen), Marketing/Retargeting nur nach Einwilligung. Verwaltung über Cookie‑Einstellungen." 
  ,"privacy.sections.security.title": "Sicherheit"
  ,"privacy.sections.security.content": "TLS‑Verschlüsselung, gehashte & gesalzene Credentials, rollenbasierte Zugriffe, Audit Logs, WAF, automatisierte Missbrauchserkennung. Absolute Sicherheit nicht garantiert." 
  ,"privacy.sections.retention.title": "Aufbewahrung"
  ,"privacy.sections.retention.content": "Konto & Transaktionen: Dauer der Aktivität + bis 6 Jahre; Logs bis 12 Monate; KYC 5–10 Jahre rechtsabhängig. Danach Anonymisierung/Aggregation." 
  ,"privacy.sections.rights.title": "Betroffenenrechte"
  ,"privacy.sections.rights.content": "Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit, Widerspruch, Widerruf Einwilligung, Beschwerde bei Aufsicht. Kontakt: privacy@kasyrooms.com." 
  ,"privacy.sections.children.title": "Jugendschutz"
  ,"privacy.sections.children.content": "Strikt 18+. Inhalte mit Minderjährigen (real/simuliert) verboten und werden gemeldet." 
  ,"privacy.sections.changes.title": "Änderungen"
  ,"privacy.sections.changes.content": "Neue Revisionen mit Datum; fortgesetzte Nutzung bedeutet Zustimmung." 
    ,"privacy.subtitle": "Zuletzt aktualisiert:"
    ,"privacy.contact.title": "Fragen zu dieser Richtlinie?"
    ,"privacy.contact.content": "Kontaktieren Sie unser Datenschutzteam unter"

    ,"cookies.title": "Cookie-Richtlinie"
  ,"cookies.lastUpdated": "Letzte Aktualisierung:"
  ,"cookies.types.essential.title": "Essentiell"
  ,"cookies.types.essential.description": "Erforderlich für Authentifizierung, Routing und Basissicherheit." 
  ,"cookies.types.analytics.title": "Analytics"
  ,"cookies.types.analytics.description": "Leistungs‑, Fehler‑ und Stabilitätsmessung." 
  ,"cookies.types.marketing.title": "Marketing"
  ,"cookies.types.marketing.description": "Kampagnen‑Tracking & Retargeting (mit Einwilligung)." 
  ,"cookies.types.functional.title": "Funktional"
  ,"cookies.types.functional.description": "Speichert Sprache, Anzeigepräferenzen & Layout." 
  ,"cookies.banner.message": "Wir verwenden essentielle Cookies und mit Ihrer Einwilligung funktionale, Analyse- und Marketing-Cookies. Sie können Ihre Auswahl jederzeit in den Cookie-Einstellungen ändern."
  ,"cookies.banner.customize": "Anpassen"
  ,"cookies.banner.necessary": "Technisch/notwendig (immer aktiv)"
  ,"common.back": "Zurück"
    ,"cookies.subtitle": "Verwalten Sie Ihre Cookie-Einstellungen."
    ,"cookies.what.title": "Was sind Cookies?"
    ,"cookies.what.content": "Cookies speichern Einstellungen, um die Nutzung zu verbessern."
    ,"cookies.preferences.title": "Cookie-Einstellungen"
    ,"cookies.required": "Erforderlich"
    ,"cookies.optional": "Optional"
    ,"cookies.acceptAll": "Alle akzeptieren"
    ,"cookies.savePreferences": "Speichern"
    ,"cookies.rejectAll": "Alle ablehnen"
    ,"cookies.usage.title": "Wie wir Cookies verwenden"
    ,"cookies.usage.sections.performance.title": "Leistung"
    ,"cookies.usage.sections.performance.content": "Wir messen die Leistung der Website."
    ,"cookies.usage.sections.personalization.title": "Personalisierung"
    ,"cookies.usage.sections.personalization.content": "Wir merken uns Ihre Einstellungen."
    ,"cookies.usage.sections.advertising.title": "Werbung"
    ,"cookies.usage.sections.advertising.content": "Wir können relevante Anzeigen zeigen."
    ,"cookies.managing.title": "Cookies verwalten"
    ,"cookies.managing.content": "Steuern Sie Cookies in Ihrem Browser."

    ,"contact.title": "Kontakt"
    ,"contact.subtitle": "Wir freuen uns, von Ihnen zu hören."
    ,"contact.form.title": "Senden Sie uns eine Nachricht"
    ,"contact.form.firstName": "Vorname"
    ,"contact.form.firstNamePlaceholder": "Ihr Vorname"
    ,"contact.form.lastName": "Nachname"
    ,"contact.form.lastNamePlaceholder": "Ihr Nachname"
    ,"contact.form.email": "E-Mail"
    ,"contact.form.emailPlaceholder": "ihr@email.de"
    ,"contact.form.subject": "Betreff"
    ,"contact.form.subjectPlaceholder": "Thema auswählen"
    ,"contact.form.subjects.general": "Allgemein"
    ,"contact.form.subjects.technical": "Technisches Problem"
    ,"contact.form.subjects.billing": "Abrechnung"
    ,"contact.form.subjects.model": "Model werden"
    ,"contact.form.message": "Nachricht"
    ,"contact.form.messagePlaceholder": "Ihre Nachricht..."
    ,"contact.form.submit": "Nachricht senden"
    ,"contact.info.email.title": "E-Mail"
    ,"contact.info.email.description": "Wir melden uns innerhalb von 24–48 Stunden."
    ,"contact.info.phone.title": "Telefon"
    ,"contact.info.phone.description": "Mo–Fr 9:00 - 18:00 (CET)"
    ,"contact.info.address.title": "Adresse"
    ,"contact.info.address.description": "Wir arbeiten weltweit mit verteilten Teams."
    ,"contact.info.hours.title": "Arbeitszeiten"
    ,"contact.info.hours.weekdays": "Mo - Fr: 9:00 - 18:00"
    ,"contact.info.hours.weekend": "Sa - So: 10:00 - 16:00"
    ,"contact.form.name": "Name"
    ,"contact.form.send": "Nachricht senden"
  ,"dmca.title": "DMCA / Urheberrecht Richtlinie"
  ,"dmca.subtitle": "Melden Sie mutmaßliche Urheberrechtsverletzungen für Inhalte auf der Plattform."
  ,"dmca.intro": "Wir respektieren geistige Eigentumsrechte und reagieren auf ordnungsgemäße Mitteilungen nach dem DMCA und gleichwertigen Regelungen."
  ,"dmca.notice.title": "Mitteilung einreichen"
  ,"dmca.notice.content": "Zur Meldung einer Verletzung: (1) benennen Sie das geschützte Werk; (2) geben Sie die genaue(n) URL(s) des beanstandeten Materials an; (3) fügen Sie vollständige Kontaktdaten bei; (4) erklären Sie in gutem Glauben, dass die Nutzung nicht autorisiert ist; (5) erklären Sie an Eides statt, zur Geltendmachung berechtigt zu sein; (6) unterschreiben Sie physisch oder elektronisch. Senden an copyright@kasyrooms.com."
  ,"dmca.counter.title": "Gegendarstellung"
  ,"dmca.counter.content": "Wurde Ihr Inhalt irrtümlich oder unberechtigt entfernt, senden Sie eine Gegendarstellung mit Identifizierung des entfernten Materials, dessen früherem Standort, Ihren Kontaktdaten, Zustimmung zur zuständigen Gerichtsbarkeit und einer eidesstattlichen Erklärung in gutem Glauben. Sofern der ursprüngliche Anspruchsteller keine Klage einreicht, kann der Inhalt nach ca. 10 Werktagen wiederhergestellt werden."
  ,"dmca.repeat.title": "Wiederholte Verstöße"
  ,"dmca.repeat.content": "Konten mit wiederholten oder gravierenden Urheberrechtsverletzungen können gekündigt werden."
  ,"dmca.misuse.title": "Hinweis zu Missbrauch"
  ,"dmca.misuse.content": "Vorsätzlich falsche Mitteilungen oder Gegendarstellungen können eine Haftung auf Schadensersatz begründen."
  ,"dmca.contact.title": "Bevollmächtigter Ansprechpartner"
  ,"dmca.contact.content": "E‑Mail: copyright@kasyrooms.com (Betreff: DMCA Notice)."
  ,"guidelines.title": "Community Richtlinien"
  ,"guidelines.subtitle": "Standards für ein sicheres, respektvolles und rechtskonformes Umfeld."
  ,"guidelines.intro": "Diese Richtlinien ergänzen die Nutzungsbedingungen und gelten für alle Nutzer und Performer. Verstöße können Verwarnungen, Sperrungen oder Kündigungen nach sich ziehen."
  ,"guidelines.section.safety.title": "Sicherheit & Einwilligung"
  ,"guidelines.section.safety.content": "Alle Interaktionen müssen einvernehmlich sein. Keine Minderjährigen (real, simuliert oder jugendliches Erscheinungsbild). Verboten sind Doxing, Drohungen, Erpressung und Nötigung."
  ,"guidelines.section.prohibited.title": "Verbotene Inhalte"
  ,"guidelines.section.prohibited.content": "Nicht zulässig: Ausbeutung, Sodomie, nicht einvernehmliche Handlungen, Förderung von Selbstverletzung, Menschenhandel, Hassrede oder extremistische Propaganda sowie das Anbahnen bezahlter sexueller Dienste außerhalb der Plattform."
  ,"guidelines.section.privacy.title": "Privatsphäre & personenbezogene Daten"
  ,"guidelines.section.privacy.content": "Fordern oder veröffentlichen Sie keine privaten Kontaktdaten (Adresse, Telefon, private Social‑Accounts) oder Ausweisdokumente. Melden Sie entsprechende Versuche."
  ,"guidelines.section.payments.title": "Zahlungen & Trinkgelder"
  ,"guidelines.section.payments.content": "Vergütungen erfolgen ausschließlich über die offiziellen Zahlungswege. Off‑Platform‑Zahlungsanfragen sind zum Schutz vor Betrug untersagt."
  ,"guidelines.section.reporting.title": "Melden & Durchsetzung"
  ,"guidelines.section.reporting.content": "Nutzen Sie die Meldefunktionen oder schreiben Sie an safety@kasyrooms.com mit Zeitstempeln, Nutzernamen und Kontext. Fälle mit Kinderschutzpriorität werden umgehend eskaliert."
  ,"guidelines.section.updates.title": "Aktualisierungen"
  ,"guidelines.section.updates.content": "Wir können diese Richtlinien anpassen; die fortgesetzte Nutzung nach Veröffentlichung gilt als Zustimmung."
  ,"refund.title": "Erstattungsrichtlinie"
  ,"refund.subtitle": "Umgang mit Käufen von virtuellen Credits, Trinkgeldern und Abonnements."
  ,"refund.intro": "Virtuelle Artikel (Credits, Tokens, Trinkgelder, zeitbasierter Zugang) sind nach Bereitstellung grundsätzlich nicht erstattungsfähig, außer in den unten beschriebenen Ausnahmefällen oder soweit zwingendes Recht dies vorsieht."
  ,"refund.section.finality.title": "Endgültigkeit"
  ,"refund.section.finality.content": "Nach erfolgreicher Verarbeitung und Gutschrift auf Ihrem Konto sind Käufe endgültig, vorbehaltlich zwingender Verbraucherrechte."
  ,"refund.section.unauthorized.title": "Unbefugte Nutzung"
  ,"refund.section.unauthorized.content": "Melden Sie verdächtige, nicht autorisierte Vorgänge innerhalb von 48 Stunden an billing@kasyrooms.com. Während der Prüfung kann eine temporäre Kontosperre erfolgen."
  ,"refund.section.technical.title": "Technische Ausfälle"
  ,"refund.section.technical.content": "Scheitert eine bezahlte private Sitzung aufgrund einer Plattformstörung (nicht Nutzerverbindung) und es fanden weniger als 5 Minuten bezahlter Zugriff statt, kontaktieren Sie den Support mit Zeitstempeln zur möglichen Wieder­gutschrift."
  ,"refund.section.chargebacks.title": "Rückbuchungen"
  ,"refund.section.chargebacks.content": "Unbegründete Rückbuchungen können zur Sperrung führen. Bitte kontaktieren Sie zunächst den Support, um Unstimmigkeiten zu klären."
  ,"refund.section.subscriptions.title": "Abo‑Verlängerung"
  ,"refund.section.subscriptions.content": "Abonnements verlängern sich automatisch, sofern nicht vor dem Verlängerungszeitpunkt gekündigt wird. Teilrückerstattungen nach der Verlängerung erfolgen nicht."
  ,"refund.section.process.title": "Antragsprozess"
  ,"refund.section.process.content": "Übermitteln Sie: Konto‑ID, Transaktions‑ID, Datum, Betrag, Begründung sowie Nachweise (Screenshots, Logs). Antwortziel: 3 Werktage."
  ,"refund.section.law.title": "Gesetzliche Rechte"
  ,"refund.section.law.content": "Nichts beschränkt Rechte, die nach geltendem Verbraucherrecht nicht ausgeschlossen werden können."
  ,"ageCompliance.title": "Altersnachweis (18+) & 2257"

  // Missing keys (kept in sync with EN)
  ,"email": "E-Mail"
  ,"common.loading.auth": "Authentifizierung wird geladen…"

  ,"models.subtitle": "Entdecken Sie all unsere großartigen Modelle"
  ,"notFound.title": "404 Seite nicht gefunden"
  ,"notFound.subtitle": "Die Seite, die du suchst, existiert nicht."

  ,"ageCompliance.modal.title": "Alter bestätigen"
  ,"ageCompliance.modal.body": "Diese Seite enthält Inhalte für Erwachsene. Bestätigst du, dass du mindestens 18 Jahre alt bist (oder volljährig in deinem Land)?"
  ,"ageCompliance.modal.yes": "Ja, ich bin 18+"
  ,"ageCompliance.modal.no": "Nein"
  ,"ageCompliance.modal.blocked": "Sitzung beendet. Um Inhalte zu sehen, musst du mindestens 18 Jahre alt sein."
  ,"ageCompliance.modal.exit": "Beenden"

  ,"register.title": "Kasyrooms beitreten"
  ,"register.subtitle": "Erstelle ein Konto, um exklusiven Inhalt zu sehen"
  ,"register.firstName": "Vorname"
  ,"register.firstName.placeholder": "Jane"
  ,"register.lastName": "Nachname"
  ,"register.lastName.placeholder": "Doe"
  ,"register.dob": "Geburtsdatum"
  ,"register.username.placeholder": "Wähle einen Benutzernamen"
  ,"register.email.placeholder": "Gib deine E-Mail ein"
  ,"register.password.placeholder": "Erstelle ein Passwort"
  ,"register.confirmPassword": "Passwort bestätigen"
  ,"register.confirmPassword.placeholder": "Bestätige dein Passwort"
  ,"register.creating": "Konto wird erstellt…"
  ,"register.create": "Konto erstellen"
  ,"register.haveAccount": "Hast du schon ein Konto?"
  ,"register.signInHere": "Hier anmelden"
  ,"register.toast.passwordMismatch.title": "Passwörter stimmen nicht überein"
  ,"register.toast.passwordMismatch.desc": "Die Passwörter stimmen nicht überein"
  ,"register.toast.accountCreated.title": "Konto erstellt"
  ,"register.toast.accountCreated.desc": "Willkommen bei Kasyrooms!"
  ,"register.toast.failed.title": "Registrierung fehlgeschlagen"
  ,"register.toast.failed.desc": "Bitte später erneut versuchen"

  ,"kyc.title": "KYC-Onboarding"
  ,"kyc.loggedAs": "Angemeldet als"
  ,"kyc.validation.title": "Validierung"
  ,"kyc.validation.fullName": "Vollständiger Name erforderlich"
  ,"kyc.validation.docType": "Wählen Sie einen Dokumenttyp"
  ,"kyc.submitted.title": "Gesendet"
  ,"kyc.submitted.desc": "KYC-Antrag erstellt. Sie können jetzt Bilder hochladen."
  ,"kyc.submissionFailed.title": "Übermittlung fehlgeschlagen"
  ,"kyc.upload.missingApp.title": "Antrag fehlt"
  ,"kyc.upload.missingApp.desc": "Senden Sie zuerst das KYC-Formular, um eine Antrags-ID zu erhalten."
  ,"kyc.upload.noFile.title": "Keine Datei ausgewählt"
  ,"kyc.upload.noFile.desc": "Wählen Sie eine Bilddatei zum Hochladen."
  ,"kyc.uploaded.title": "Hochgeladen"
  ,"kyc.uploaded.descSuffix": "erfolgreich hochgeladen."
  ,"kyc.upload.kind.front": "Vorderseite"
  ,"kyc.upload.kind.back": "Rückseite"
  ,"kyc.upload.kind.selfie": "Selfie"
  ,"kyc.uploadFailed.title": "Upload fehlgeschlagen"
  ,"kyc.form.fullName": "Vollständiger Name"
  ,"kyc.form.fullName.placeholder": "Jane Doe"
  ,"kyc.form.dob": "Geburtsdatum"
  ,"kyc.form.country": "Land"
  ,"kyc.form.country.placeholder": "Land"
  ,"kyc.form.docType": "Dokumenttyp"
  ,"kyc.form.docType.select": "Auswählen…"
  ,"kyc.form.docType.passport": "Reisepass"
  ,"kyc.form.docType.idCard": "Personalausweis"
  ,"kyc.form.docType.driver": "Führerschein"
  ,"kyc.form.docFrontUrl": "Dokument-URL (Vorderseite)"
  ,"kyc.form.docBackUrl": "Dokument-URL (Rückseite)"
  ,"kyc.form.selfieUrl": "Selfie-URL"
  ,"kyc.form.url.placeholder": "https://..."
  ,"kyc.form.notes": "Notizen (optional)"
  ,"kyc.form.notes.placeholder": "Optionaler Hinweis"
  ,"kyc.form.submit": "Antrag senden"
  ,"kyc.form.submitting": "Wird gesendet…"
  ,"kyc.applicationId": "Antrags-ID"
  ,"kyc.noImage": "Kein Bild"
  ,"kyc.upload": "Hochladen"
  ,"kyc.uploading": "Hochladen…"

  ,"dmcaSubmit.title": "DMCA-Löschantrag einreichen"
  ,"dmcaSubmit.validation.title": "Validierung"
  ,"dmcaSubmit.validation.noUrls": "Fügen Sie mindestens eine verletzende URL hinzu."
  ,"dmcaSubmit.submitted.title": "Gesendet"
  ,"dmcaSubmit.submitted.desc": "DMCA-Hinweis eingereicht. Wir prüfen ihn in Kürze."
  ,"dmcaSubmit.failed.title": "Übermittlung fehlgeschlagen"
  ,"dmcaSubmit.form.name": "Ihr Name"
  ,"dmcaSubmit.form.email": "Ihre E-Mail"
  ,"dmcaSubmit.form.originalUrl": "URL des Originalinhalts"
  ,"dmcaSubmit.form.infringingUrls": "Verletzende URLs (eine pro Zeile oder kommagetrennt)"
  ,"dmcaSubmit.form.signature": "Unterschrift (vollständigen Namen eingeben)"
  ,"dmcaSubmit.form.notes": "Zusätzliche Notizen (optional)"
  ,"dmcaSubmit.form.submit": "Hinweis senden"
  ,"dmcaSubmit.form.submitting": "Wird gesendet…"
  ,"dmcaSubmit.placeholder.name": "Jane Doe"
  ,"dmcaSubmit.placeholder.email": "sie@beispiel.de"
  ,"dmcaSubmit.placeholder.originalUrl": "https://ihre-seite.de/original"
  ,"dmcaSubmit.placeholder.infringingUrls": "https://beispiel.de/verstoß-1\nhttps://beispiel.de/verstoß-2"
  ,"dmcaSubmit.placeholder.signature": "Jane Doe"
  ,"dmcaSubmit.placeholder.notes": "Kontext oder Klarstellung"

  ,"modelProfile.notFound.title": "Model nicht gefunden"
  ,"modelProfile.notFound.subtitle": "Das Model, das du suchst, existiert nicht."
  ,"modelProfile.goBack": "Zurück"
  ,"modelProfile.unavailable": "Nicht verfügbar"
  ,"modelProfile.busy": "Beschäftigt"
  ,"modelProfile.blocked": "Blockiert"
  ,"modelProfile.sendMessage.title": "Nachricht senden"
  ,"modelProfile.sendMessage.placeholder": "Nachricht eingeben"
  ,"modelProfile.sendMessage.sending": "Wird gesendet…"
  ,"modelProfile.sendMessage.send": "Senden"
  ,"modelProfile.blockedNotice": "Du wurdest von diesem Model blockiert."
  ,"modelProfile.tip.title": "Trinkgeld senden"
  ,"modelProfile.tip.placeholder": "Betrag"
  ,"modelProfile.tip.help": "Trinkgelder werden von deinem Wallet-Guthaben abgebucht."
  ,"modelProfile.tip.sending": "Wird gesendet…"
  ,"modelProfile.tip.send": "Senden"
  ,"modelProfile.moderation.title": "Moderation"
  ,"modelProfile.moderation.placeholder": "Grund für die Meldung"
  ,"modelProfile.moderation.sending": "Wird gesendet…"
  ,"modelProfile.moderation.report": "Melden"
  ,"modelProfile.block": "Blockieren"
  ,"modelProfile.stats.rating": "Bewertung"
  ,"modelProfile.stats.viewers": "Zuschauer"
  ,"modelProfile.alert.blocked": "Du wurdest von diesem Model blockiert."
  ,"modelProfile.alert.offline": "Dieses Model ist offline."
  ,"modelProfile.alert.busy": "Dieses Model ist gerade beschäftigt."
  ,"modelProfile.alert.typeMessage": "Bitte gib eine Nachricht ein"
  ,"modelProfile.alert.messageFailed": "Nachricht fehlgeschlagen"
  ,"modelProfile.alert.messageSent": "Nachricht gesendet"
  ,"modelProfile.alert.enterReason": "Bitte gib einen Grund ein"
  ,"modelProfile.alert.reportSent": "Meldung gesendet"
  ,"modelProfile.alert.tipInvalid": "Gib einen gültigen Betrag ein"
  ,"modelProfile.alert.insufficientFunds": "Nicht genügend Guthaben"
  ,"modelProfile.alert.tipFailed": "Trinkgeld fehlgeschlagen"
  ,"modelProfile.alert.thanksTip": "Danke für das Trinkgeld!"
  ,"modelProfile.alert.blockedDone": "Blockiert"
  },
  es: {
      // Home section subtitles
      "home.online.subtitle": "Modelos actualmente en directo y disponibles",
      "home.top.subtitle": "Los mejores artistas de nuestra plataforma",
      "home.new.subtitle": "Nuevas caras que se unen a la comunidad",
      "home.trending.subtitle": "Modelos más populares ahora mismo",
      "home.favorites.subtitle": "Tus modelos guardados",
      "home.all.subtitle": "Explora todos los modelos disponibles",
    favorites: "Favoritos", login: "Iniciar sesión", signup: "Registrarse", becomeModel: "Hazte Modelo", logout: "Cerrar sesión", welcome: "Bienvenido", searchPlaceholder: "Buscar modelos...", browseModels: "Ver Modelos", startPrivateShow: "Iniciar show privado", startChat: "Iniciar Chat", viewAll: "Ver todo", allModels: "Todos los Modelos", noModelsFound: "No se encontraron modelos", clearFilters: "Limpiar filtros", helpCenter: "Centro de ayuda", contactUs: "Contáctanos", termsOfService: "Términos de servicio", privacyPolicy: "Política de privacidad", cookiePolicy: "Política de cookies", becomeAModel: "Hazte Modelo", yourFavorites: "Tus Favoritos", noFavoritesYet: "Aún no tienes favoritos", tapHeartToAdd: "Toca el corazón en un modelo para agregarlo a favoritos", welcomeBack: "Bienvenido de vuelta", signInToAccount: "Inicia sesión en tu cuenta para acceder al contenido premium", username: "Nombre de usuario", password: "Contraseña", enterUsername: "Ingresa tu nombre de usuario", enterPassword: "Ingresa tu contraseña", signingIn: "Iniciando sesión...", signIn: "Iniciar sesión", dontHaveAccount: "¿No tienes una cuenta?", signUpHere: "Regístrate aquí", loginSuccessful: "Inicio de sesión exitoso", loginFailed: "Error en el inicio de sesión", invalidCredentials: "Usa el nombre de usuario 'testuser' con cualquier contraseña", yearsOld: "años", watching: "viendo", languages: "Idiomas", specialties: "Especialidades", online: "En línea", offline: "Desconectado", securePayments: "Pagos seguros", acceptPaymentMethods: "Aceptamos todos los métodos de pago principales", search: "Buscar", sortBy: "Ordenar por", status: "Estado", all: "Todos", name: "Nombre", rating: "Calificación", viewers: "Espectadores", age: "Edad", showing: "Mostrando", of: "de", models: "modelos"
    ,"filters.online": "En línea", "filters.top": "Mejor valorados", "filters.new": "Nuevos modelos", "filters.trending": "Tendencia", "filters.favorites": "Favoritos"
    ,"filter.online": "En línea ahora", "filter.top": "Mejor valorados", "filter.new": "Nuevos modelos", "filter.trending": "Tendencia", "filter.favorites": "Favoritos"

    ,"favorites.title": "Tus Favoritos"
    ,"favorites.empty.title": "Aún no tienes favoritos"
    ,"favorites.empty.subtitle": "Toca el corazón para añadir a favoritos"
    ,"common.errors.loadModels": "No se pudieron cargar los modelos"
    ,"common.errors.tryLater": "Inténtalo de nuevo más tarde"
    ,"common.noModels.title": "No se encontraron modelos"
    ,"common.noModels.subtitle": "Intenta ajustar los filtros"
    ,"modelCard.startChat": "Iniciar Chat"
    ,"modelCard.online": "En línea"
    ,"modelCard.offline": "Desconectado"
    ,"modelCard.watching": "viendo"
    ,"modelCard.new": "Nuevo"

    ,"footer.about.description": "Plataforma premium de video chat que te conecta con modelos verificados en todo el mundo."
    ,"footer.quickLinks.title": "Enlaces rápidos"
    ,"footer.quickLinks.browse": "Ver Modelos"
    
    ,"footer.quickLinks.becomeModel": "Hazte Modelo"
    
    ,"footer.support.title": "Soporte"
    ,"footer.support.help": "Centro de ayuda"
    ,"footer.support.contact": "Contáctanos"
    ,"footer.support.terms": "Términos de servicio"
    ,"footer.support.privacy": "Política de privacidad"
    ,"footer.support.cookies": "Política de cookies"
    ,"footer.payments.title": "Pagos seguros"
  ,"footer.payments.description": "Pagos aceptados: Visa y Mastercard"
    ,"footer.payments.secure": "Cifrado SSL y seguro"
    ,"footer.links.privacy": "Privacidad"
    ,"footer.links.terms": "Términos"
  ,"footer.links.cookies": "Cookies"
  ,"footer.links.policies": "Políticas relacionadas"
    ,"footer.copyright": "Todos los derechos reservados. | Solo 18+"

    // Support / FAQ
    ,"support.title": "Soporte"
    ,"support.intro": "Accede a recursos, políticas y asistencia para cualquier necesidad."
    ,"support.help": "Centro de ayuda"
    ,"support.faq": "FAQ"
    ,"support.contact": "Contacto"
    ,"support.email": "Correo"
    ,"support.needMore": "¿Necesitas más ayuda? Escribe a"
    ,"faq.title": "Preguntas frecuentes"
    ,"faq.intro": "Haz clic en una pregunta para ver la respuesta."
    ,"faq.q1": "¿Cómo creo una cuenta?"
    ,"faq.a1": "Haz clic en Registrarse, completa los campos requeridos y confirma tu correo para activar la cuenta."
    ,"faq.q2": "¿Cómo funciona una sesión con una modelo?"
    ,"faq.a2": "Entra en el perfil de la modelo e inicia la sesión. El tiempo empieza de inmediato y el coste se descuenta automáticamente de tu saldo."
    ,"faq.q3": "¿Puedo pausar una sesión?"
    ,"faq.a3": "No. Una vez iniciada, la sesión no se puede pausar ni interrumpir."
    ,"faq.q4": "¿Hay un bono de bienvenida?"
    ,"faq.a4": "Sí. Todos los nuevos usuarios reciben un bono de bienvenida de un solo uso, que debe consumirse antes que los créditos reales."
    ,"faq.q5": "¿Qué pasa si salgo o pierdo la conexión durante una sesión?"
    ,"faq.a5": "El temporizador sigue corriendo. Al volver, continúas con el tiempo restante disponible."
    ,"faq.q6": "¿Cómo puedo recargar mi saldo?"
    ,"faq.a6": "Puedes recargar tu saldo desde la sección Wallet eligiendo uno de los métodos de pago disponibles."
    ,"faq.q7": "¿Los créditos comprados caducan?"
    ,"faq.a7": "No. Los créditos comprados no caducan."
    ,"faq.q8": "¿Los chats y las sesiones son privados?"
    ,"faq.a8": "Sí. Todas las comunicaciones son privadas y no se registran."
    ,"faq.q9": "¿Cómo me convierto en modelo?"
    ,"faq.a9": "Visita la página Hazte Modelo y completa el proceso de registro y verificación."
    ,"faq.q10": "¿Cómo puedo contactar con soporte?"
    ,"faq.a10": "Puedes contactar con soporte a través de la página de Contacto o por correo para cualquier necesidad."
    ,"faq.stillNeed": "¿Aún necesitas ayuda?"

    ,"becomeModel.title": "Hazte Modelo"
    ,"becomeModel.subtitle": "Únete a nuestra plataforma y monetiza tu talento."
    ,"becomeModel.benefitsTitle": "Por qué unirte a Kasyrooms"
    ,"becomeModel.benefits.0.title": "Gana más"
    ,"becomeModel.benefits.0.description": "Pagos competitivos y bonificaciones."
    ,"becomeModel.benefits.1.title": "Haz crecer tu marca"
    ,"becomeModel.benefits.1.description": "Alcanza una audiencia global."
    ,"becomeModel.benefits.2.title": "Comunidad solidaria"
    ,"becomeModel.benefits.2.description": "Te ayudamos con herramientas y guías."
    ,"becomeModel.benefits.3.title": "Herramientas Pro"
    ,"becomeModel.benefits.3.description": "Streaming HD y controles avanzados."
    ,"becomeModel.requirementsTitle": "Requisitos"
    ,"becomeModel.requirements.0": "18+ años"
    ,"becomeModel.requirements.1": "Documento válido"
    ,"becomeModel.requirements.2": "Conexión a internet estable"
    ,"becomeModel.requirements.3": "Cámara web y micrófono"
    ,"becomeModel.stepsTitle": "Cómo empezar"
    ,"becomeModel.stepTitle": "Paso"
    ,"becomeModel.steps.0": "Crea tu cuenta"
    ,"becomeModel.steps.1": "Verifica tu identidad"
    ,"becomeModel.steps.2": "Configura tu perfil"
    ,"becomeModel.steps.3": "Empieza a transmitir"
    ,"becomeModel.ctaTitle": "¿Listo para ser modelo?"
    ,"becomeModel.ctaSubtitle": "Aplica ahora y empieza a ganar."
    ,"becomeModel.ctaButton": "Aplicar ahora"

    ,"help.title": "Centro de ayuda"
    ,"help.subtitle": "Encuentra respuestas y guías."

    ,"terms.title": "Términos de servicio"
  ,"terms.sections.acceptance.title": "Aceptación de los Términos"
  ,"terms.sections.acceptance.content": "Al acceder a la Plataforma aceptas estos Términos (revisión 14/10/2025). Si no estás de acuerdo, debes dejar de usar el servicio. La Plataforma ofrece videochat en vivo para adultos." 
  ,"terms.sections.services.title": "Servicios Prestados"
  ,"terms.sections.services.content": "Plataforma moderada para adultos: streams públicos, sesiones privadas, chat en tiempo real, propinas, compra de créditos/suscripciones y herramientas de moderación. Los performers son creadores independientes responsables de cumplir la ley y estos Términos. No facilitamos encuentros físicos ni actividades ilegales." 
  ,"terms.sections.registration.title": "Registro & Elegibilidad"
  ,"terms.sections.registration.content": "Debes tener al menos 18 años (o mayoría legal superior). Debes proporcionar datos exactos y mantenerlos actualizados. Protege tus credenciales. Podemos solicitar re‑verificación de edad/identidad." 
  ,"terms.sections.conduct.title": "Uso Aceptable & Prohibiciones"
  ,"terms.sections.conduct.content": "Prohibido: (1) contenido ilegal, no consentido o que involucre menores; (2) acoso, amenazas, doxing; (3) solicitar datos personales o encuentros; (4) grabación o redistribución no autorizada; (5) malware, scraping, eludir seguridad; (6) incitar odio, trata, prostitución forzada, autolesiones. Tolerancia cero para violaciones graves." 
  ,"terms.sections.payment.title": "Pagos, Ítems Virtuales & Reembolsos"
  ,"terms.sections.payment.content": "Compras de créditos, tokens o suscripciones son finales una vez entregadas salvo derechos imperativos del consumidor. Procesadores de pago terceros gestionan la facturación; no almacenamos números completos de tarjeta. Contracargos fraudulentos pueden causar suspensión." 
  ,"terms.sections.intellectual.title": "Propiedad Intelectual & Licencia"
  ,"terms.sections.intellectual.content": "El software, marca y diseño de la plataforma nos pertenecen o a nuestros licenciantes. Los performers conservan sus derechos y nos otorgan una licencia mundial no exclusiva y libre de regalías para alojar, transcodificar, transmitir y usar miniaturas/extractos promocionales. Grabaciones no autorizadas prohibidas." 
  ,"terms.sections.privacy.title": "Privacidad"
  ,"terms.sections.privacy.content": "El tratamiento de datos personales sigue nuestra Política de Privacidad (bases: ejecución contractual, interés legítimo en seguridad, obligaciones legales, consentimiento para marketing/cookies)." 
  ,"terms.sections.termination.title": "Suspensión & Terminación"
  ,"terms.sections.termination.content": "Podemos suspender o cerrar cuentas sin previo aviso por violaciones materiales, fraude, requerimientos legales o riesgos de seguridad. Los créditos restantes pueden perderse salvo disposición legal obligatoria." 
  ,"terms.sections.limitation.title": "Limitación de Responsabilidad"
  ,"terms.sections.limitation.content": "Servicio proporcionado 'TAL CUAL'. En la medida permitida excluimos daños indirectos, lucro cesante, pérdida de datos o reputación. Límite total: montos pagados en los últimos 6 meses o 100 EUR (el mayor). Sin limitación para fraude o derechos irrenunciables." 
  ,"terms.sections.changes.title": "Cambios"
  ,"terms.sections.changes.content": "Podemos modificar los Términos con efecto prospectivo. Aviso vía sitio o email. Uso continuado = aceptación." 
    ,"terms.subtitle": "Última actualización:"
  ,"terms.contact.title": "¿Necesitas ayuda legal o aclaraciones?"
  ,"terms.contact.content": "Escribe a nuestro equipo legal en"
  ,"terms.related.title": "Políticas relacionadas"
    ,"privacy.title": "Política de privacidad"
  ,"privacy.sections.introduction.title": "Introducción"
  ,"privacy.sections.introduction.content": "Esta Política (revisión 14/10/2025) explica cómo recopilamos, usamos, divulgamos y protegemos datos personales de usuarios y performers. Somos Responsable del tratamiento para operación de la Plataforma y Encargado para ciertos procesos bajo instrucciones documentadas de performers." 
  ,"privacy.sections.collection.title": "Datos Recopilados"
  ,"privacy.sections.collection.content": "(a) Cuenta (alias, email, edad/verificación); (b) Perfil & Preferencias; (c) Metadatos de transacción (pagos gestionados por terceros); (d) Registros técnicos (IP, dispositivo, navegador, eventos, señales de fraude); (e) Contenido de interacción & chat; (f) Cookies; (g) Documentos KYC cifrados." 
  ,"privacy.sections.usage.title": "Uso & Bases Legales"
  ,"privacy.sections.usage.content": "Proveer servicios (contrato); personalización & seguridad (interés legítimo); prevención de fraude & pagos (contrato/interés legítimo); obligaciones legales; marketing & cookies no esenciales (consentimiento); analítica agregada (interés legítimo)." 
  ,"privacy.sections.sharing.title": "Compartición & Transferencias"
  ,"privacy.sections.sharing.content": "Compartimos de forma limitada con hosting cloud, anti‑fraude, analytics, email, KYC, procesadores de pago bajo cláusulas contractuales. Transferencias internacionales mediante cláusulas tipo o mecanismos equivalentes. No vendemos datos personales a cambio de dinero." 
  ,"privacy.sections.cookies.title": "Cookies & Seguimiento"
  ,"privacy.sections.cookies.content": "Cookies esenciales (sesión, seguridad), analytics (rendimiento), funcionales (idioma, preferencias), marketing/retargeting tras consentimiento. Gestión mediante la interfaz de Cookies." 
  ,"privacy.sections.security.title": "Seguridad"
  ,"privacy.sections.security.content": "Cifrado TLS, credenciales hash con sal, control de acceso, registros de auditoría, WAF, detección automatizada de abusos. No se garantiza seguridad absoluta." 
  ,"privacy.sections.retention.title": "Conservación"
  ,"privacy.sections.retention.content": "Cuenta & transacciones: duración de actividad + hasta 6 años; logs hasta 12 meses; KYC 5–10 años según ley. Luego anonimización o agregación." 
  ,"privacy.sections.rights.title": "Derechos del Interesado"
  ,"privacy.sections.rights.content": "Acceso, rectificación, supresión, limitación, portabilidad, oposición, retiro del consentimiento, reclamación ante autoridad. Contacto: privacy@kasyrooms.com." 
  ,"privacy.sections.children.title": "Protección de Menores"
  ,"privacy.sections.children.content": "Plataforma estrictamente 18+. Cualquier material que involucre menores (real o simulado) prohibido y denunciado." 
  ,"privacy.sections.changes.title": "Actualizaciones"
  ,"privacy.sections.changes.content": "Se publicarán revisiones con nueva fecha. Uso continuado = aceptación." 
    ,"privacy.subtitle": "Última actualización:"
    ,"privacy.contact.title": "¿Preguntas sobre esta política?"
    ,"privacy.contact.content": "Contacta a nuestro equipo de privacidad en"

    ,"cookies.title": "Política de cookies"
  ,"cookies.lastUpdated": "Última actualización:"
  ,"cookies.types.essential.title": "Esenciales"
  ,"cookies.types.essential.description": "Necesarios para autenticación, enrutamiento y seguridad básica." 
  ,"cookies.types.analytics.title": "Analítica"
  ,"cookies.types.analytics.description": "Miden rendimiento, errores y estabilidad." 
  ,"cookies.types.marketing.title": "Marketing"
  ,"cookies.types.marketing.description": "Seguimiento de campañas & retargeting (con consentimiento)." 
  ,"cookies.types.functional.title": "Funcionales"
  ,"cookies.types.functional.description": "Recuerdan idioma, preferencias de visualización y configuraciones." 
  ,"cookies.banner.message": "Usamos cookies esenciales y, con tu consentimiento, cookies funcionales, analíticas y de marketing. Puedes cambiar tu elección en cualquier momento desde la configuración de cookies."
  ,"cookies.banner.customize": "Personalizar"
  ,"cookies.banner.necessary": "Técnicas/necesarias (siempre activas)"
  ,"common.back": "Atrás"
    ,"cookies.subtitle": "Administra tus preferencias de cookies."
    ,"cookies.what.title": "¿Qué son las cookies?"
    ,"cookies.what.content": "Las cookies recuerdan tus preferencias para mejorar la experiencia."
    ,"cookies.preferences.title": "Preferencias de cookies"
    ,"cookies.required": "Requerido"
    ,"cookies.optional": "Opcional"
    ,"cookies.acceptAll": "Aceptar todo"
    ,"cookies.savePreferences": "Guardar"
    ,"cookies.rejectAll": "Rechazar todo"
    ,"cookies.usage.title": "Cómo usamos las cookies"
    ,"cookies.usage.sections.performance.title": "Rendimiento"
    ,"cookies.usage.sections.performance.content": "Medimos el rendimiento del sitio."
    ,"cookies.usage.sections.personalization.title": "Personalización"
    ,"cookies.usage.sections.personalization.content": "Recordamos tu configuración."
    ,"cookies.usage.sections.advertising.title": "Publicidad"
    ,"cookies.usage.sections.advertising.content": "Podemos mostrar anuncios relevantes."
    ,"cookies.managing.title": "Gestionar cookies"
    ,"cookies.managing.content": "Contrólalas en tu navegador."

    ,"contact.title": "Contáctanos"
    ,"contact.subtitle": "Nos encantará saber de ti."
    ,"contact.form.title": "Envíanos un mensaje"
    ,"contact.form.firstName": "Nombre"
    ,"contact.form.firstNamePlaceholder": "Tu nombre"
    ,"contact.form.lastName": "Apellido"
    ,"contact.form.lastNamePlaceholder": "Tu apellido"
    ,"contact.form.email": "Correo"
    ,"contact.form.emailPlaceholder": "tu@email.com"
    ,"contact.form.subject": "Asunto"
    ,"contact.form.subjectPlaceholder": "Elige un asunto"
    ,"contact.form.subjects.general": "General"
    ,"contact.form.subjects.technical": "Problema técnico"
    ,"contact.form.subjects.billing": "Facturación"
    ,"contact.form.subjects.model": "Hazte modelo"
    ,"contact.form.message": "Mensaje"
    ,"contact.form.messagePlaceholder": "Escribe tu mensaje..."
    ,"contact.form.submit": "Enviar mensaje"
    ,"contact.info.email.title": "Correo"
    ,"contact.info.email.description": "Te responderemos en 24–48 horas."
    ,"contact.info.phone.title": "Teléfono"
    ,"contact.info.phone.description": "Lun–Vie 9:00 - 18:00 (CET)"
    ,"contact.info.address.title": "Dirección"
    ,"contact.info.address.description": "Operamos globalmente con equipos distribuidos."
    ,"contact.info.hours.title": "Horario laboral"
    ,"contact.info.hours.weekdays": "Lun - Vie: 9:00 - 18:00"
    ,"contact.info.hours.weekend": "Sáb - Dom: 10:00 - 16:00"
    ,"contact.form.name": "Nombre"
    ,"contact.form.send": "Enviar mensaje"
  ,"dmca.title": "Política de Copyright / DMCA"
  ,"dmca.subtitle": "Reporta presuntas infracciones de derechos de autor en contenidos de la plataforma."
  ,"dmca.intro": "Respetamos los derechos de propiedad intelectual y respondemos a avisos correctamente formulados bajo el DMCA y regímenes equivalentes."
  ,"dmca.notice.title": "Presentar un Aviso"
  ,"dmca.notice.content": "Para notificar una infracción: (1) identifica la obra protegida; (2) indica las URL exactas del contenido denunciado; (3) aporta tus datos de contacto; (4) declara de buena fe que el uso no está autorizado; (5) declaras bajo juramento que estás autorizado; (6) firma física o electrónicamente. Enviar a copyright@kasyrooms.com."
  ,"dmca.counter.title": "Contra‑Notificación"
  ,"dmca.counter.content": "Si tu contenido fue retirado por error o con autorización válida: envía una contra‑notificación con identificación del material retirado, ubicación previa, tus datos, consentimiento a la jurisdicción competente y una declaración jurada de buena fe. Salvo acción legal del reclamante, el contenido puede restablecerse tras ~10 días hábiles."
  ,"dmca.repeat.title": "Infractores Reincidentes"
  ,"dmca.repeat.content": "Las cuentas con infracciones repetidas o graves de copyright pueden ser canceladas."
  ,"dmca.misuse.title": "Advertencia de Abuso"
  ,"dmca.misuse.content": "El envío deliberado de avisos o contra‑notificaciones falsas puede generar responsabilidad por daños."
  ,"dmca.contact.title": "Agente Designado"
  ,"dmca.contact.content": "Correo: copyright@kasyrooms.com (Asunto: DMCA Notice)."
  ,"guidelines.title": "Guías de la Comunidad"
  ,"guidelines.subtitle": "Normas que garantizan un espacio seguro, respetuoso y conforme a la ley."
  ,"guidelines.intro": "Estas Guías complementan los Términos y aplican a todos los usuarios y performers. Las infracciones pueden conllevar advertencias, suspensión o cancelación."
  ,"guidelines.section.safety.title": "Seguridad y Consentimiento"
  ,"guidelines.section.safety.content": "Toda interacción debe ser plenamente consentida. Prohibidos menores (reales, simulados o apariencia juvenil). Prohibido: doxing, amenazas, chantaje, coerción."
  ,"guidelines.section.prohibited.title": "Contenidos Prohibidos"
  ,"guidelines.section.prohibited.content": "No se permite: explotación, bestialismo, actos no consentidos, promoción de autolesiones, trata, discurso de odio o propaganda extremista, ni solicitar servicios sexuales fuera de la plataforma."
  ,"guidelines.section.privacy.title": "Privacidad y Datos"
  ,"guidelines.section.privacy.content": "No solicites ni divulgues datos de contacto personales (dirección, teléfono, cuentas privadas) ni documentos de identidad. Informa cualquier intento."
  ,"guidelines.section.payments.title": "Pagos y Propinas"
  ,"guidelines.section.payments.content": "Toda compensación debe realizarse mediante los mecanismos oficiales. Las solicitudes de pago directo fuera de la plataforma están prohibidas para prevenir fraudes."
  ,"guidelines.section.reporting.title": "Reporte y Aplicación"
  ,"guidelines.section.reporting.content": "Usa las herramientas de reporte o escribe a safety@kasyrooms.com con marcas de tiempo, alias y contexto. Las urgencias relacionadas con protección de menores se priorizan."
  ,"guidelines.section.updates.title": "Actualizaciones"
  ,"guidelines.section.updates.content": "Podemos revisar estas Guías; el uso continuado tras su publicación implica aceptación."
  ,"refund.title": "Política de Reembolsos"
  ,"refund.subtitle": "Tratamiento de compras de créditos virtuales, propinas y suscripciones."
  ,"refund.intro": "Los elementos virtuales (créditos, tokens, propinas, acceso temporizado) no son reembolsables en principio una vez entregados, salvo las excepciones limitadas indicadas abajo o derechos legales imperativos."
  ,"refund.section.finality.title": "Carácter Definitivo"
  ,"refund.section.finality.content": "Una vez abonada en tu cuenta, la transacción es final, salvo obligación legal en contrario."
  ,"refund.section.unauthorized.title": "Uso No Autorizado"
  ,"refund.section.unauthorized.content": "Reporta operaciones no autorizadas dentro de las 48 h a billing@kasyrooms.com. Puede aplicarse un bloqueo temporal de la cuenta durante la investigación."
  ,"refund.section.technical.title": "Fallos Técnicos"
  ,"refund.section.technical.content": "Si una sesión privada de pago falla por caída de la plataforma (no por conexión del usuario) y dura menos de 5 minutos, contacta soporte con marcas de tiempo para una posible reemisión de créditos."
  ,"refund.section.chargebacks.title": "Contracargos"
  ,"refund.section.chargebacks.content": "Los contracargos infundados pueden resultar en suspensión. Contacta primero con soporte para resolver el desacuerdo."
  ,"refund.section.subscriptions.title": "Renovación de Suscripciones"
  ,"refund.section.subscriptions.content": "Las suscripciones se renuevan automáticamente salvo cancelación previa al vencimiento. No hay reembolsos parciales tras la renovación."
  ,"refund.section.process.title": "Proceso de Solicitud"
  ,"refund.section.process.content": "Aporta: ID de cuenta, ID de transacción, fecha, importe, motivo y evidencias (capturas, logs). Objetivo de respuesta: 3 días hábiles."
  ,"refund.section.law.title": "Derechos Legales"
  ,"refund.section.law.content": "Nada limita los derechos que no pueden excluirse por la normativa aplicable."
  ,"ageCompliance.title": "Verificación de edad (18+) y 2257"

  // Missing keys (kept in sync with EN)
  ,"email": "Correo"
  ,"common.loading.auth": "Cargando autenticación…"

  ,"models.subtitle": "Descubre todos nuestros increíbles modelos"
  ,"notFound.title": "404 Página no encontrada"
  ,"notFound.subtitle": "La página que buscas no existe."

  ,"ageCompliance.modal.title": "Confirmar edad"
  ,"ageCompliance.modal.body": "Este sitio contiene contenido para adultos. ¿Confirmas que tienes al menos 18 años (o la mayoría de edad en tu país)?"
  ,"ageCompliance.modal.yes": "Sí, soy 18+"
  ,"ageCompliance.modal.no": "No"
  ,"ageCompliance.modal.blocked": "Sesión finalizada. Para acceder al contenido debes tener al menos 18 años."
  ,"ageCompliance.modal.exit": "Salir"

  ,"register.title": "Únete a Kasyrooms"
  ,"register.subtitle": "Crea tu cuenta para acceder a contenido exclusivo"
  ,"register.firstName": "Nombre"
  ,"register.firstName.placeholder": "Jane"
  ,"register.lastName": "Apellido"
  ,"register.lastName.placeholder": "Doe"
  ,"register.dob": "Fecha de nacimiento"
  ,"register.username.placeholder": "Elige un nombre de usuario"
  ,"register.email.placeholder": "Introduce tu correo"
  ,"register.password.placeholder": "Crea una contraseña"
  ,"register.confirmPassword": "Confirmar contraseña"
  ,"register.confirmPassword.placeholder": "Confirma tu contraseña"
  ,"register.creating": "Creando cuenta…"
  ,"register.create": "Crear cuenta"
  ,"register.haveAccount": "¿Ya tienes una cuenta?"
  ,"register.signInHere": "Inicia sesión aquí"
  ,"register.toast.passwordMismatch.title": "Las contraseñas no coinciden"
  ,"register.toast.passwordMismatch.desc": "Las contraseñas no coinciden"
  ,"register.toast.accountCreated.title": "Cuenta creada"
  ,"register.toast.accountCreated.desc": "¡Bienvenido a Kasyrooms!"
  ,"register.toast.failed.title": "Registro fallido"
  ,"register.toast.failed.desc": "Inténtalo de nuevo más tarde"

  ,"kyc.title": "Onboarding KYC"
  ,"kyc.loggedAs": "Conectado como"
  ,"kyc.validation.title": "Validación"
  ,"kyc.validation.fullName": "Se requiere nombre completo"
  ,"kyc.validation.docType": "Selecciona un tipo de documento"
  ,"kyc.submitted.title": "Enviado"
  ,"kyc.submitted.desc": "Solicitud KYC creada. Ya puedes subir imágenes."
  ,"kyc.submissionFailed.title": "Envío fallido"
  ,"kyc.upload.missingApp.title": "Falta solicitud"
  ,"kyc.upload.missingApp.desc": "Envía primero el formulario KYC para obtener un ID de solicitud."
  ,"kyc.upload.noFile.title": "Ningún archivo seleccionado"
  ,"kyc.upload.noFile.desc": "Elige una imagen para subir."
  ,"kyc.uploaded.title": "Subido"
  ,"kyc.uploaded.descSuffix": "subido correctamente."
  ,"kyc.upload.kind.front": "Frente"
  ,"kyc.upload.kind.back": "Reverso"
  ,"kyc.upload.kind.selfie": "Selfie"
  ,"kyc.uploadFailed.title": "Error al subir"
  ,"kyc.form.fullName": "Nombre completo"
  ,"kyc.form.fullName.placeholder": "Jane Doe"
  ,"kyc.form.dob": "Fecha de nacimiento"
  ,"kyc.form.country": "País"
  ,"kyc.form.country.placeholder": "País"
  ,"kyc.form.docType": "Tipo de documento"
  ,"kyc.form.docType.select": "Seleccionar…"
  ,"kyc.form.docType.passport": "Pasaporte"
  ,"kyc.form.docType.idCard": "Documento de identidad"
  ,"kyc.form.docType.driver": "Permiso de conducir"
  ,"kyc.form.docFrontUrl": "URL del documento (frente)"
  ,"kyc.form.docBackUrl": "URL del documento (reverso)"
  ,"kyc.form.selfieUrl": "URL del selfie"
  ,"kyc.form.url.placeholder": "https://..."
  ,"kyc.form.notes": "Notas (opcional)"
  ,"kyc.form.notes.placeholder": "Algo que añadir"
  ,"kyc.form.submit": "Enviar solicitud"
  ,"kyc.form.submitting": "Enviando…"
  ,"kyc.applicationId": "ID de solicitud"
  ,"kyc.noImage": "Sin imagen"
  ,"kyc.upload": "Subir"
  ,"kyc.uploading": "Subiendo…"

  ,"dmcaSubmit.title": "Enviar un aviso de retirada DMCA"
  ,"dmcaSubmit.validation.title": "Validación"
  ,"dmcaSubmit.validation.noUrls": "Añade al menos una URL infractora."
  ,"dmcaSubmit.submitted.title": "Enviado"
  ,"dmcaSubmit.submitted.desc": "Aviso DMCA enviado. Lo revisaremos en breve."
  ,"dmcaSubmit.failed.title": "Envío fallido"
  ,"dmcaSubmit.form.name": "Tu nombre"
  ,"dmcaSubmit.form.email": "Tu correo"
  ,"dmcaSubmit.form.originalUrl": "URL del contenido original"
  ,"dmcaSubmit.form.infringingUrls": "URLs infractoras (una por línea o separadas por comas)"
  ,"dmcaSubmit.form.signature": "Firma (escribe tu nombre completo)"
  ,"dmcaSubmit.form.notes": "Notas adicionales (opcional)"
  ,"dmcaSubmit.form.submit": "Enviar aviso"
  ,"dmcaSubmit.form.submitting": "Enviando…"
  ,"dmcaSubmit.placeholder.name": "Jane Doe"
  ,"dmcaSubmit.placeholder.email": "tu@ejemplo.com"
  ,"dmcaSubmit.placeholder.originalUrl": "https://tu-sitio.com/original"
  ,"dmcaSubmit.placeholder.infringingUrls": "https://ejemplo.com/infractor-1\nhttps://ejemplo.com/infractor-2"
  ,"dmcaSubmit.placeholder.signature": "Jane Doe"
  ,"dmcaSubmit.placeholder.notes": "Contexto o aclaración"

  ,"modelProfile.notFound.title": "Modelo no encontrado"
  ,"modelProfile.notFound.subtitle": "El modelo que buscas no existe."
  ,"modelProfile.goBack": "Volver"
  ,"modelProfile.unavailable": "No disponible"
  ,"modelProfile.busy": "Ocupado"
  ,"modelProfile.blocked": "Bloqueado"
  ,"modelProfile.sendMessage.title": "Enviar un mensaje"
  ,"modelProfile.sendMessage.placeholder": "Escribe tu mensaje"
  ,"modelProfile.sendMessage.sending": "Enviando…"
  ,"modelProfile.sendMessage.send": "Enviar"
  ,"modelProfile.blockedNotice": "Estás bloqueado por este modelo."
  ,"modelProfile.tip.title": "Enviar propina"
  ,"modelProfile.tip.placeholder": "Importe"
  ,"modelProfile.tip.help": "Las propinas se cobran de tu saldo del wallet."
  ,"modelProfile.tip.sending": "Enviando…"
  ,"modelProfile.tip.send": "Enviar"
  ,"modelProfile.moderation.title": "Moderación"
  ,"modelProfile.moderation.placeholder": "Motivo de la denuncia"
  ,"modelProfile.moderation.sending": "Enviando…"
  ,"modelProfile.moderation.report": "Denunciar"
  ,"modelProfile.block": "Bloquear"
  ,"modelProfile.stats.rating": "Valoración"
  ,"modelProfile.stats.viewers": "Espectadores"
  ,"modelProfile.alert.blocked": "Estás bloqueado por este modelo."
  ,"modelProfile.alert.offline": "Este modelo está desconectado."
  ,"modelProfile.alert.busy": "Este modelo está ocupado actualmente."
  ,"modelProfile.alert.typeMessage": "Por favor escribe un mensaje"
  ,"modelProfile.alert.messageFailed": "Error al enviar el mensaje"
  ,"modelProfile.alert.messageSent": "Mensaje enviado"
  ,"modelProfile.alert.enterReason": "Por favor introduce un motivo"
  ,"modelProfile.alert.reportSent": "Denuncia enviada"
  ,"modelProfile.alert.tipInvalid": "Introduce un importe válido"
  ,"modelProfile.alert.insufficientFunds": "Fondos insuficientes"
  ,"modelProfile.alert.tipFailed": "Error al enviar la propina"
  ,"modelProfile.alert.thanksTip": "¡Gracias por la propina!"
  ,"modelProfile.alert.blockedDone": "Bloqueado"
  },
};

type I18nCtx = { lang: Lang; t: (k: string) => string; setLang: (l: Lang) => void };

const I18nContext = createContext<I18nCtx | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved) setLang(saved);
  }, []);
  useEffect(() => { localStorage.setItem("lang", lang); }, [lang]);
  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {}
  }, [lang]);

  const t = useMemo(() => (k: string) => translations[lang][k] ?? translations.en[k] ?? k, [lang]);
  return <I18nContext.Provider value={{ lang, t, setLang }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
