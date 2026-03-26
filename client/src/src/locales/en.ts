// English Translation File
export const en = {
  // Common UI
  common: {
    appName: "Ari Stage",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    create: "Create",
    update: "Update",
    search: "Search",
    filter: "Filter",
    close: "Close",
    back: "Back",
    backToHome: "Back to home",
    next: "Next",
    previous: "Previous",
    loading: "Loading...",
    loadingData: "Loading data...",
    saving: "Saving...",
    deleting: "Deleting...",
    creating: "Creating...",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    ok: "OK",
    actions: "Actions",
    options: "Options",
    more: "More",
    refresh: "Refresh",
    download: "Download",
    upload: "Upload",
    print: "Print",
    share: "Share",
    copy: "Copy",
    copied: "Copied!",
    view: "View",
    preview: "Preview",
    settings: "Settings",
    help: "Help",
    error: "Error",
    success: "Success!",
    logout: "Logout",
    required: "Required field",
    optional: "Optional",
    notAvailable: "Not available",
    selectAll: "Select All",
    unselectAll: "Unselect All",
    noResults: "No results found",
    notSpecified: "Not specified",
    showPassword: "Show password",
    hidePassword: "Hide password",
    showMore: "Show More",
    showLess: "Show Less",
    all: "All",
    song: "Song",
    closeModal: "Close modal",
  },

  // Navigation
  nav: {
    home: "Home",
    my: "My",
    personal: "Personal",
    shared: "Shared",
    songs: "Songs",
    lineups: "Lineups",
    artists: "Artists",
    myArtists: "My Artists",
    users: "Users",
    admin: "Admin",
    settings: "Settings",
    billing: "Billing",
    profile: "Profile",
    logout: "Logout",
    dashboard: "Dashboard",
    pendingInvitations: "Pending Invitations",
  },

  // App layout
  appLayout: {
    impersonation: {
      bannerPrefix: "You are currently impersonating:",
      unknownUser: "Unknown user",
      backToOriginalButton: "Back to original account",
    },
    mainContentAriaLabel: "Main content",
  },

  // Authentication
  auth: {
    login: "Login",
    loginTitle: "Sign In",
    register: "Register",
    registerTitle: "Sign Up",
    email: "Email",
    password: "Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    forgotPassword: "Forgot Password",
    resetPassword: "Reset Password",
    updatePassword: "Update Password",
    rememberMe: "Remember Me",
    loginButton: "Sign In",
    registerButton: "Sign Up",
    loggingIn: "Signing in...",
    registering: "Registering...",
    logoutSuccess: "Successfully logged out",
    loginError: "Login error",
    invalidCredentials: "The email or password is incorrect",
    emailRequired: "Email is required",
    passwordRequired: "Password is required",
    passwordTooShort: "Password is too short",
    passwordMinLengthHint: "Password must be at least {min} characters",
    passwordLooksGood: "Password looks good",
    passwordsDontMatch: "Passwords don't match",
    passwordsMatch: "Passwords match",
    passwordMismatch: "Passwords do not match",
    fullName: "Full Name",
    role: "Role (Singer, Guitarist, Drummer...)",
    fullNameRequired: "Please enter full name",
    fullNameTooShort: "Full name must be at least 2 characters",
    termsRequired: "Please confirm you read the terms",
    registerSuccess: "Registered successfully! You can log in now.",
    registerError: "Registration error",
    resetEmailSent: "If the user exists, a reset email was sent",
    resetError: "Error sending reset request",
    noAvatar: "No avatar",
    uploadAvatar: "Upload Avatar",
    choosePassword: "Choose password",
    subtitle: "Sign in or register to manage your lineup",
    iReadThe: "I read the",
    terms: "Terms",
    passwordUpdated: "Password updated successfully!",
    backToLogin: "Back to login",
    loginNow: "Log in now",
    createAccount: "Create new account",
    twoFactor: "Two-Factor Authentication",
    twoFactorCode: "Verification Code",
    verify: "Verify",
    verifying: "Verifying...",
    resetting: "Resetting...",
    emailPlaceholder: "name@example.com",

    termsDialog: {
      ariaLabel: "Ari Stage terms of use",
      title: "Terms of Use - Ari Stage",
      lastUpdated:
        "Last updated: 23/01/2026. Using the Ari Stage site or app constitutes agreement to the terms below.",
      confirmButton: "I agree",
      sections: [
        {
          title: "1. What the service is",
          paragraphs: [
            'Ari Stage is a system for managing lineups, songs, and related materials (the "Service"). The Service may be used for personal work or team management.',
          ],
        },
        {
          title: "2. User account",
          items: [
            "You must provide accurate, current information and keep your password confidential.",
            "You are responsible for all activity on your account, including uploaded content.",
            "We may suspend or close an account in cases of misuse or breach of terms.",
          ],
        },
        {
          title: "3. Content uploaded by users",
          items: [
            "Content such as song names, text, files, images, and PDFs is your responsibility alone.",
            "You represent that you have the rights to use and upload the content and that it does not infringe copyright, privacy, or trademark rights.",
            "You may not upload unlawful, harmful, misleading, or security-threatening content.",
          ],
        },
        {
          title: "4. Permitted and prohibited use",
          items: [
            "You may use the Service to manage and share materials related to performances, rehearsals, and production.",
            "You may not attempt intrusion, vulnerability scanning, permission bypass, or unusually heavy use that strains the system.",
            "You may not collect information about other users without authorization.",
          ],
        },
        {
          title: "5. Payments and subscriptions",
          paragraphs: [
            "Some features may be paid. Where plans or subscriptions exist, pricing, billing, and related terms will be shown at the point of purchase. Non-payment may limit access to certain features.",
          ],
        },
        {
          title: "6. Availability and changes",
          paragraphs: [
            "We aim for high availability but do not guarantee uninterrupted or error-free service. We may update, change, or discontinue parts of the Service.",
          ],
        },
        {
          title: "7. Privacy",
          paragraphs: [
            "We use information to provide the Service, maintain security, and improve the user experience. We may use cookies or local storage such as localStorage for operational needs. We do not share personal information with third parties unless required by law or necessary to operate the Service.",
          ],
        },
        {
          title: "8. Responsibility and limitation of liability",
          paragraphs: [
            'The Service is provided "as is". To the extent permitted by law, Ari Stage is not liable for indirect or consequential damages, data loss, or lost profits arising from use of the Service.',
          ],
        },
        {
          title: "9. Contact",
          paragraphs: [
            "For questions, problem reports, or requests, you can reach us through the support channels listed on the site.",
          ],
        },
        {
          title: "10. Acceptance of terms",
          paragraphs: [
            "By registering for the Service, you confirm that you have read and understood these terms and agree to act accordingly.",
          ],
        },
      ],
    },

    impersonationTokenExpired:
      "Impersonation token expired. Please sign in again.",
    sessionExpiredReLogin: "Session expired. Please sign in again.",
    impersonationNoOriginalAccount: "No original account found to return to",
    impersonationBackToOriginal: "Returned to original account",
  },

  // Invitations
  invitations: {
    invalidLink: "Invalid invitation link",
    processing: "Processing invitation...",
    joinedTitle: "You joined the pool!",
    joinedPleaseLogin: "You joined successfully! Please log in to continue.",
    createAccountToJoin: "Join the pool by creating a new account.",
    joinedSuccess: "You joined successfully!",
    handleError: "Error handling invitation",
    joinPoolTitle: "Join the pool",
    yourEmail: "Your email",
    redirectingToLogin: "Redirecting to login...",

    acceptedToast: "Invitation accepted",
    rejectedToast: "Invitation rejected",
    acceptError: "Error accepting invitation",
    rejectError: "Error rejecting invitation",

    pendingModal: {
      title: "Pending invitations",
      subtitle: "Choose an invitation to accept or reject",
      loading: "Loading invitations...",
      empty: "No pending invitations",
      unknownUser: "User",
      inviterHint: "Invites you to join their pool",
    },
  },

  landing: {
    heroSubtitle:
      "The home base for singers, musicians, and producers - manage every song, lineup, and event in one smart, fast, professional place.",
    loginButton: "Log in",
    freeTrialButton: "Start free trial",
    demoButton: "Watch demo",
    screenshotAlt: "App screenshot",
    whyTitle: "Why Ari Stage?",
    features: {
      smartSongBank: {
        title: "Smart song library",
        description:
          "Keep all your songs in one place with BPM, key, tags, song length, notes, and everything else you need to step on stage with confidence.",
      },
      oneClickSharing: {
        title: "One-click lineup sharing",
        description:
          "Send one link to the whole team - singers, players, and production - and keep it updated online until the very last minute. Every change syncs for everyone in seconds.",
      },
      smartLineups: {
        title: "Smart lineups",
        description:
          "Drag and drop, fast reordering, automatic set timing, saving, sharing, and export - as many times as you need.",
      },
      realtimeUpdates: {
        title: "Real-time updates",
        description:
          "Every change you make - a new song, updated timing, added note - is reflected for everyone instantly. No chaos, no endless message threads.",
      },
      eventManagement: {
        title: "Event management",
        description:
          "Get full control over your events: dates, sets, timing, set lists, rehearsals - all in one professional, easy-to-run workspace.",
      },
      aiAutomation: {
        title: "Show automation and AI",
        description:
          "Coming soon: AI-built lineups based on BPM, energy, style, and stage flow. A personal assistant for every show.",
      },
    },
  },

  footer: {
    navAriaLabel: "Accessibility and privacy links",
    accessibilityLink: "Accessibility statement",
    cookieSettingsLink: "Cookie settings",
    closeSection: "Close",
    copyright: "© {year} Ari Stage. All rights reserved.",
    about: {
      title: "About",
      paragraphs: [
        "Ari Stage is a platform for managing and coordinating workflows around performances, artists, sharing, and files - all in one place, in a clear and simple way.",
        "Our goal is to save time in day-to-day work: send fewer messages, find files faster, and stay organized with teams and collaborators.",
      ],
      highlight:
        "Have an idea for improvement? We would be glad to hear it through the Support section.",
    },
    support: {
      title: "Support",
      intro: "Need help? Here are a few quick steps before reaching out:",
      quickSteps: [
        "Try refreshing the page (Ctrl+R).",
        "If the issue is related to loading data, check your internet connection and sign in again.",
        "If a file upload failed, try using an English or numeric filename and a smaller file size.",
      ],
      fastHelpTitle: "To help us assist faster:",
      fastHelpItems: [
        "What exactly were you trying to do?",
        "What appeared on the screen (error or behavior)?",
        "Which device or browser are you using?",
      ],
      outro:
        "If you have an internal support channel such as WhatsApp or team email, send a screenshot there with a short description.",
    },
    terms: {
      title: "Terms",
      summaryTitle: "Terms of use (summary)",
      intro:
        "The system is provided as is and is intended to support the management of information, files, and workflows. We make a reasonable effort to keep it available and functioning, but temporary issues may still occur.",
      items: [
        "Users are responsible for the content they upload or share and for the permissions they grant.",
        "Do not upload unlawful, harmful, or copyright-infringing content.",
        "Features and services may be changed, updated, or removed from time to time.",
      ],
      outro:
        "Need a full legal version of the terms? It is best to adapt them with legal counsel based on your business use.",
    },
    privacy: {
      title: "Privacy",
      summaryTitle: "Privacy policy (summary)",
      intro:
        "We store the information required to operate the service: user details, settings, and data you create in the system such as files or content. We use this information to provide the service, improve it, and maintain security.",
      items: [
        "Information sharing is handled according to configured permissions for users and teams.",
        "System logs may be used for security, monitoring, and troubleshooting.",
        "You may request deletion or export of data according to organizational policy and applicable law.",
      ],
      outro:
        "If you need a full formal policy, including cookies or tracking, add clauses that reflect the actual tools you use.",
    },
  },

  // Songs
  songs: {
    title: "Songs",
    addSong: "Add Song",
    editSong: "Edit Song",
    deleteSong: "Delete Song",
    songTitle: "Title",
    artist: "Artist",
    bpm: "BPM",
    key: "Key",
    duration: "Duration",
    notes: "Notes",
    lyrics: "Lyrics",
    chart: "Chart",
    charts: "Charts",
    uploadChart: "Upload Chart",
    deleteChart: "Delete Chart",
    viewChart: "View Chart",
    privateChart: "Private Chart",
    chartsUi: {
      moduleDisabled: "Charts module is disabled",
      myChartsWithCount: "My charts ({count})",
      uploadFile: "Upload file",
      invalidFileType: "Only PDF or image files (JPG, PNG, GIF) are allowed",
      uploadSuccess: "File uploaded successfully",
      uploadError: "Error uploading file",
      deleteTitle: "Delete chart",
      deleteMessage: "Are you sure you want to delete the chart?",
      deleteSuccess: "Chart deleted successfully",
      deleteError: "Error deleting chart",
      viewerTitle: "View chart",
      chartAlt: "Chart",
      defaultFileName: "chart",
    },
    noSongs: "No songs",
    noSongsAvailable: "No songs available",
    searchSongs: "Search songs",
    mySongs: "My Songs",
    sharedSongs: "Shared Songs",
    songDetails: "Song Details",
    addToLineup: "Add to Lineup",
    removeFromLineup: "Remove from Lineup",
    songAdded: "Song added successfully",
    songUpdated: "Song updated successfully",
    songDeleted: "Song deleted successfully",
    confirmDelete: "Delete this song?",
    deleteWarning: "This action cannot be undone",

    notesPresets: {
      happy: "Happy",
      upbeat: "Upbeat",
      calm: "Calm",
      emotional: "Emotional",
      light: "Light",
    },

    addSongsModuleDisabled: "Add songs module is disabled",

    scaleMode: {
      major: "Major",
      minor: "Minor",
      harmonicMinor: "Harmonic Minor",
      melodicMinor: "Melodic Minor",
      dorian: "Dorian",
      phrygian: "Phrygian",
      lydian: "Lydian",
      mixolydian: "Mixolydian",
      aeolian: "Aeolian",
    },
  },

  // Lineups
  lineups: {
    title: "Lineups",
    addLineup: "Create Lineup",
    editLineup: "Edit Lineup",
    deleteLineup: "Delete Lineup",
    lineupTitle: "Lineup Title",
    date: "Date",
    time: "Time",
    location: "Location",
    description: "Description",
    songs: "Songs",
    noLineups: "No lineups",
    noLineupsAvailable: "No lineups available",
    noSongsInLineup: "No songs in lineup",
    noSongsInThisLineup: "No songs in this lineup",
    searchLineups: "Search lineups",
    myLineups: "My Lineups",
    sharedLineups: "Shared Lineups",
    lineupDetails: "Lineup Details",
    addSongsToLineup: "Add Songs",
    addSongsHint: "Click the green button above to add songs",
    reorderSongs: "Reorder",
    dragMode: "Drag Mode",
    dragModeActive: "Drag mode on",
    totalDuration: "Total Duration",
    songCount: "Song Count",
    lineupCreated: "Lineup created successfully",
    lineupUpdated: "Lineup updated successfully",
    lineupDeleted: "Lineup deleted successfully",
    confirmDeleteLineup: "Delete this lineup?",
    shareLineup: "Share Lineup",
    shareShort: "Share",
    creatingShare: "Creating...",
    shareUrl: "Share Link",
    revokeShare: "Revoke Share",
    lineupShared: "Lineup shared successfully",
    shareRevoked: "Share revoked",
    copyLink: "Copy Link",
    linkCopied: "Link copied",
    publicView: "Public View",
    publicNotFound: "Lineup not found or link is invalid",
    downloadAllCharts: "Download All Charts",
    downloadAllLyrics: "Download All Lyrics",
    downloadCharts: "Download charts",
    downloadLyrics: "Download lyrics",
    printLineup: "Print Lineup",
    songsCount: "{count} songs",
    unspecifiedDate: "Date not specified",
    unspecifiedTime: "Time not specified",
    unspecifiedLocation: "Location not specified",
    lineupNamePlaceholder: "Lineup name *",
    locationPlaceholder: "Location",
    descriptionOptionalPlaceholder: "Description (optional)",
    datePlaceholder: "dd/mm/yyyy",
    timePlaceholder: "--:--",

    moduleDisabledTitle: "Lineups module is disabled",
    moduleDisabledHint: 'You can enable it again in the Admin "Models" tab.',

    artistSongsTab: "Artist songs",
    selectArtistPrompt: "Select an artist to view their songs",

    messages: {
      loadLineupError: "Error loading lineup",
      addSongError: "Error adding song",
      removeSongError: "Error removing song",

      downloadChartsPreparing: "Preparing charts...",
      noChartsToDownload: "No charts to download for this lineup",
      downloadChartsSuccess: "Charts downloaded successfully",
      downloadChartsError: "Error downloading charts",

      downloadLyricsPreparing: "Preparing lyrics file...",
      downloadLyricsSuccess: "Lyrics downloaded successfully",
      downloadLyricsError: "Error downloading lyrics",

      reorderError: "Error reordering songs",

      confirmCreateShareLink: "Create a share link?",
      confirmRevokeShareLink: "Revoke sharing?",
      shareLinkCreated: "Share link created",
      shareLinkCreateError: "Error creating share link",
    },
  },

  // Artists
  artists: {
    title: "Artists",
    myArtists: "My Artists",
    inviteArtist: "Invite Artist",
    removeArtist: "Remove Artist",
    artistProfile: "Artist Profile",
    artistName: "Artist Name",
    artistRole: "Role",
    artistEmail: "Email",
    noArtists: "No artists",
    searchArtists: "Search artists",
    connectedArtists: "Connected Artists",
    invitedBy: "Invited by",
    invitedAt: "Invited on",
    invitationSent: "Invitation sent",
    invitationAccepted: "Invitation accepted",
    pendingInvitation: "Pending Invitation",
    acceptInvitation: "Accept Invitation",
    declineInvitation: "Decline Invitation",
    cancelInvitation: "Cancel Invitation",
    confirmRemoveArtist: "Remove this artist?",
    removeWarning:
      "Removing the artist will also remove all shared songs and lineups",
    leaveArtist: "Leave Artist",
    confirmLeave: "Leave this artist?",
    leaveSuccess: "Left artist successfully",
    artistCollection: "Artist Collection",
    sharedContent: "Shared Content",
    unnamedArtist: "Unnamed artist",
    uninviteTooltip: "Cancel pool sharing",
    uninviteConfirmTitle: "Cancel sharing",
    uninviteConfirmMessage:
      "Are you sure you want to cancel sharing with {artistName}? The artist will no longer be able to view your lineups and songs.",
    uninviteSuccess: "Sharing canceled successfully",
    uninviteError: "Error canceling sharing",
    artistAlt: "Artist",

    profileAccessDenied: "You do not have access to this profile",
    artistNotFound: "Artist not found",
    loadDataError: "Unable to load data",

    sharedPoolsTitle: "Shared",
    loadingArtists: "Loading artists...",
    noInvitedPools: "No pools you were invited to yet",
    noInvitedPoolsHint:
      "Artists will appear here when they invite you to their pool",
    goToArtistPageAria: "Go to {name}'s page",

    leavePoolConfirmTitle: "Leave pool",
    leavePoolConfirmMessageSingle:
      "Are you sure you want to leave this pool? You will no longer be able to view the host's lineups and songs.",
    leavePoolConfirmMessageAll:
      "Are you sure you want to leave all pools? You will no longer be able to view the hosts' lineups and songs.",
    leavePoolSuccessSingle: "Left the pool successfully",
    leavePoolSuccessAll: "Left all pools successfully",
    leavePoolError: "Error leaving pool",

    unknownArtist: "Unknown artist",

    noArtistsInPool: "No artists in your pool yet",
    inviteToPoolHint: "Invite artists to your pool using the button above",
    inviteToPoolTitle: "Invite an artist to your pool",
    inviteToPoolDescription:
      "Enter the artist's email address. They will receive an email with a link to join your pool.",
    sendInvite: "Send invitation",
    sendingInvite: "Sending...",
    inviteEmailPlaceholder: "artist@example.com",
  },

  // Users
  users: {
    title: "User Management",
    loadingUsers: "Loading users...",
    searchPlaceholder: "Search by name, email, or role...",
    invited: "Invited",
    inviteArtistTooltip: "Invite artist to your pool",
    noUsers: "No users 😴",

    newUser: "New User",
    editUser: "Edit User",
    fullNamePlaceholder: "Full name *",
    emailPlaceholder: "Email *",
    passwordPlaceholder: "Password *",

    loadError: "Error loading users",
    saveError: "Error saving data",
    inviteArtistError: "Error inviting artist",

    deleteConfirmTitle: "Delete",
    deleteConfirmMessage: "Delete this user?",
    impersonateConfirmTitle: "Impersonate user",
    impersonateConfirmMessage: "Log into their account?",
    inviteArtistConfirmTitle: "Invite artist",
    inviteArtistConfirmMessage:
      "Invite {artistName} to your pool? The artist will be able to view your lineups and songs (read-only).",
  },

  // Admin
  admin: {
    title: "Admin Panel",
    dashboard: "Dashboard",
    users: "Users",
    subscriptions: "Subscriptions",
    plans: "Plans",
    files: "Files",
    logs: "Logs",
    errors: "Errors",
    monitoring: "System Monitoring",
    models: "Models",
    security: "Security",
    systemSettings: "System Settings",
    totalUsers: "Total Users",
    activeUsers: "Active Users",
    newUsers: "New Users",
    totalSubscriptions: "Total Subscriptions",
    activeSubscriptions: "Active Subscriptions",
    expiredSubscriptions: "Expired Subscriptions",
    trialUsers: "Trial Users",
    expiringSoon: "Expiring Soon",
    openIssues: "Open issues",
    systemHealth: "System Health",
    cpuUsage: "CPU Usage",
    memoryUsage: "Memory Usage",
    diskUsage: "Disk Usage",
    uptime: "Uptime",
    lastBackup: "Last Backup",
    featureFlags: "Feature Flags",
    enabledModules: "Enabled Modules",
    disabledModules: "Disabled Modules",
    userRole: "User Role",
    subscriptionType: "Subscription Type",
    subscriptionStatus: "Subscription Status",
    expiresAt: "Expires At",
    createdAt: "Created At",
    lastSeenAt: "Last Seen At",
    impersonate: "Impersonate",
    editUser: "Edit User",
    deleteUser: "Delete User",
    confirmDeleteUser: "Delete this user?",
    userDeleted: "User deleted",
    refreshData: "Refresh Data",

    messages: {
      noPermission: "No permission",
      saveUserError: "Error saving user",
      deleteUserError: "Error deleting user",
      impersonateUserError: "Error impersonating user",
    },

    usersTab: {
      dashboard: {
        total: "Users",
        admins: "Admin/Manager",
        active7d: "Active (7 days)",
        new30d: "New (30 days)",
      },
      lastSeen: {
        never: "Not active yet",
        justNow: "Just now",
        minutesAgo: "{minutes}m ago",
        hoursAgo: "{hours}h ago",
        daysAgo: "{days}d ago",
      },
      roles: {
        user: "User",
        manager: "Manager",
        admin: "Admin",
      },
      form: {
        fullNamePlaceholder: "Full name",
      },
      unsupported: {
        title: "Admin endpoint missing",
        endpoint: "GET /admin/users",
      },
      loading: "Loading users...",
      empty: "No users to display",
    },

    modelsTab: {
      dashboard: {
        modules: "Modules",
      },
      header: {
        title: "Models (Modules)",
        description: "Enable/disable modules via Feature Flags (`module.*`)",
      },
      form: {
        keyLabel: "Key",
        keyPlaceholder: "module.myFeature",
        labelLabel: "Label",
        labelPlaceholder: "e.g. Add songs",
        descriptionLabel: "Description",
        descriptionPlaceholder: "Optional — if empty, Label is used",
        enabledLabel: "Enabled",
        addButton: "Add module",
        adding: "Adding...",
      },
      badges: {
        default: "default",
        db: "db",
      },
      actions: {
        toggle: "Toggle",
      },
      messages: {
        updateError: "Error updating feature flag",
        keyMustStartWithModule: 'Key must start with "module."',
        invalidKey: "Invalid key (letters/digits/._- only)",
        fillLabelOrDescription: "Fill at least Label or Description",
        moduleAdded: "Module added",
      },
      modules: {
        offlineOnline: {
          label: "Offline / Online",
          description:
            "Offline/Online mode, cache (PWA), and network detection",
        },
        charts: {
          label: "Charts",
          description: "Manage charts and chord/chart files",
        },
        lyrics: {
          label: "Lyrics",
          description: "Manage lyrics for songs",
        },
        addSongs: {
          label: "Add Songs",
          description: "Create/edit/delete songs",
        },
        lineups: {
          label: "Lineups",
          description: "Manage lineups and lineup songs",
        },
        plans: {
          label: "Plans",
          description: "Manage plans / pricing",
        },
        pendingInvitations: {
          label: "Pending Invitations",
          description: "View and decide on pending invitations",
        },
        inviteArtist: {
          label: "Invite Artist (Personal)",
          description: "Send/cancel an artist invite",
        },
        invitedMeArtists: {
          label: "Artists Who Invited Me (Shared)",
          description: "View the pool: who invited me",
        },
        payments: {
          label: "Payments",
          description: "Create and approve payments to activate subscriptions",
        },
        shareLineup: {
          label: "Share Lineup",
          description: "Share and view a public lineup via link",
        },
      },
      unsupported: {
        title: "Endpoint not available",
        endpoint: "GET /feature-flags",
      },
      loading: "Loading modules...",
      empty: "No modules to display",
      clearSearch: "Clear search",
    },

    plansTab: {
      sections: {
        subscriptionSettings: "Subscription settings",
        planManagement: "Plan management",
        payments: "Payments",
      },
      subscriptionSettings: {
        trialDaysDescription:
          "Controls how many trial days a user gets before it expires.",
        trialDaysLabel: "Trial days",
        trialModeLabel: "Trial mode",
        trialModeEnabledHelp:
          "New registrations receive a trial and existing trial users keep their current access.",
        trialModeDisabledHelp:
          "New registrations go straight to billing, and users currently in trial are moved to expired.",
      },
      readOnly: "Read-only",
      actions: {
        addPlan: "Add plan",
        disable: "Disable",
        disablePlan: "Disable plan",
        toggleEnabled: "Enable / disable",
      },
      loading: {
        plans: "Loading plans...",
        payments: "Loading payments...",
      },
      empty: {
        plans: "No plans to display",
        payments: "No payments to display",
      },
      dashboard: {
        totalPlans: "Plans",
        enabledPlans: "Enabled",
        totalPayments: "Payments",
        successPayments: "Successful payments",
      },
      form: {
        titleCreate: "Add plan",
        titleEdit: "Edit plan",
        labels: {
          key: "Key",
          name: "Name",
          description: "Description",
          currency: "Currency",
          monthlyPrice: "Monthly price",
          yearlyPrice: "Yearly price",
          enabled: "Enabled",
          monthlyEnabled: "Monthly available",
          yearlyEnabled: "Yearly available",
        },
        errors: {
          keyRequired: "Key is required",
          nameRequired: "Name is required",
          currencyRequired: "Currency is required",
          monthlyInvalid: "Invalid monthly price",
          yearlyInvalid: "Invalid yearly price",
          saveFailed: "Error saving",
        },
        placeholders: {
          key: "Example: pro",
          name: "Example: Pro",
          currency: "Example: ILS",
        },
      },
      messages: {
        noPermissionViewPlans: "No permission to view plans",
        loadPlansFailed: "Error loading plans",
        loadPaymentsFailed: "Error loading payments",
        planAdded: "Plan added",
        planUpdated: "Plan updated",
        updated: "Updated",
        updateEnabledFailed: "Error updating enabled",
        planDisabled: "Plan disabled",
        disablePlanFailed: "Error disabling plan",
        planDeleted: "Plan deleted successfully",
        deletePlanFailed: "Error deleting plan",
        invalidTrialDays: "Invalid trial days",
        trialSettingsUpdated: "Trial settings updated",
        noPermissionUpdateTrialSettings:
          "No permission to update trial settings",
        updateTrialSettingsFailed: "Error updating trial settings",
      },
      deleteConfirm: {
        title: "Delete plan",
        message:
          'Are you sure you want to delete the plan "{name}"? This action cannot be undone.',
      },
      payments: {
        headers: {
          user: "User",
          email: "Email",
          amount: "Amount (ILS)",
          plan: "Plan",
          status: "Status",
          date: "Date",
        },
      },
    },

    subscriptionsTab: {
      dashboard: {
        total: "Total",
        paid: "Subscriptions (non-trial)",
        trial: "Trial",
        expiringSoon7d: "Expiring soon (7 days)",
      },
      loading: "Loading subscriptions...",
      empty: "No data to display",
      endpointLabel: "Subscription data is loaded from the users list",
      userNoName: "User without name",
      actions: {
        edit: "Edit subscription",
        save: "Save subscription",
      },
      form: {
        planLabel: "Subscription plan",
        statusLabel: "Subscription status",
        startLabel: "Start",
        endLabel: "End",
        placeholders: {
          start: "Start date",
          end: "End date",
        },
        note: "This change updates only the user's subscription fields (plan/status/start/end) and does not change plan prices.",
      },
      messages: {
        updated: "Subscription updated",
        updateFailed: "Error updating subscription",
      },
      status: {
        active: "Active",
        trial: "Trial",
        expired: "Expired",
      },
      planOptions: {
        trial: "Trial",
        legacySuffix: "(legacy)",
        disabledSuffix: " (disabled)",
      },
    },

    securityTab: {
      loading: "Loading security data...",
      loadFailed: "Unable to load security data",
      views: {
        overview: "Overview",
        events: "Recent events",
        sessions: "Active sessions",
        locked: "Locked accounts",
      },
      sections: {
        topFailedLogins: "Failed logins - last 24 hours",
        riskIndicators: "Risk indicators",
      },
      topFailedLogins: {
        attempts: "{count} attempts",
      },
      riskIndicators: {
        bruteForce: "Brute force attempts",
        suspiciousIPs: "Suspicious IPs",
        unusualHours: "Unusual hour logins",
      },
      labels: {
        ip: "IP",
        userId: "User ID",
      },
      dashboard: {
        totalEvents: {
          title: "Security events",
          description: "Total security events today",
        },
        failedLogins: {
          title: "Failed logins",
          description: "Failed login attempts today",
        },
        twoFAUsers: {
          title: "Users with 2FA",
          description: "Users with two-factor authentication",
        },
        riskIndicators: {
          title: "Risk indicators",
          description: "Security anomalies detected",
        },
      },
      messages: {
        loadFailed: "Error loading security data",
        sessionRevoked: "Session revoked successfully",
        revokeFailed: "Error revoking session",
        accountUnlocked: "Account unlocked successfully",
        unlockFailed: "Error unlocking account",
      },
      sessions: {
        actions: {
          revoke: "Revoke session",
        },
        labels: {
          created: "Created",
          expires: "Expires",
          lastUsed: "Last used",
        },
        empty: "No active sessions",
      },
      locked: {
        actions: {
          unlock: "Unlock account",
        },
        labels: {
          lockedAt: "Locked at",
          remainingMinutes: "{minutes} minutes remaining",
        },
        empty: "No locked accounts",
      },
    },

    monitoringTab: {
      loading: "Loading monitoring...",
      endpointLabel: "Basic monitoring data",
    },

    filesTab: {
      header: {
        title: "Files on server (Uploads)",
      },
      filters: {
        byUser: "Filter by user",
        allUsers: "All users",
        clear: "Clear filter",
      },
      badges: {
        files: "Files: {count}",
        totalKnownSize: "Total: {size}",
        unknownSize: "Unknown: {count}",
      },
      dashboard: {
        totalFiles: "Total files",
        shown: "Shown",
        knownSize: "Known size",
        unknownSize: "Missing size",
      },
      confirm: {
        deleteFile: "Delete this file from the server?",
      },
      messages: {
        deleteEndpointRequired:
          "Backend endpoint required: DELETE /admin/files",
        deleteFileError: "Error deleting file",
        missingStoragePath: "Cannot delete: missing storage_path",
      },
      loading: "Loading files...",
      unsupported: "Backend endpoint required",
      endpointLabel: "Server files service",
      empty: "No files to display",
      clearSearch: "Clear search",
    },

    errorsTab: {
      dashboard: {
        total: "Total issues",
        open: "Open",
        resolved: "Resolved",
        shown: "Shown",
      },
      confirm: {
        resolveTitle: "Resolve issue",
        resolveMessage: "Mark this issue as resolved?",
      },
      messages: {
        resolveError: "Error resolving issue",
      },
      states: {
        open: "open",
        resolved: "resolved",
      },
      actions: {
        resolve: "Resolve",
      },
      issueFallback: "Issue",
      loading: "Loading issues...",
      unsupported: "Backend endpoint required",
      endpointLabel: "Server issues service",
      empty: "No issues to display",
      clearSearch: "Clear search",
    },

    logsTab: {
      userFallback: "User",
      dashboard: {
        total: "Total logs",
        onPage: "On page",
        errorsOnPage: "Errors (on page)",
        activeFilters: "Active filters",
      },
      filters: {
        level: "Level",
        action: "Action",
        user: "User",
        from: "From",
        to: "To",
        pageSize: "Page size",
      },
      levels: {
        info: "info",
        warn: "warn",
        error: "error",
      },
      actions: {
        cleanup: "Cleanup logs",
        clearFilters: "Clear filters",
      },
      pagination: {
        showing: "Showing {from}-{to} of {total}",
      },
      table: {
        time: "Time",
        level: "Level",
        action: "Action",
        explanation: "Explanation",
      },
      actor: {
        user: "User {id}",
        system: "System",
      },
      logActionFallback: "LOG",
      details: {
        title: "Log details",
        timestamp: "Timestamp",
        userId: "User ID",
        action: "Action",
        level: "Level",
        context: "Context",
      },
      cleanup: {
        title: "Log cleanup",
        description:
          "This action deletes logs from the system. To confirm, type",
        confirmPhrase: "DELETE LOGS",
        olderThanDays: "Older than (days)",
        olderThanDaysHint:
          "If beforeDate is empty, deletes logs older than X days.",
        beforeDate: "Before date",
        beforeDateHint: "If set — ignores olderThanDays.",
        confirmation: "Confirmation",
        deleting: "Deleting...",
        delete: "Delete logs",
      },
      messages: {
        mustTypeDeleteLogs: 'Type exactly "DELETE LOGS" to confirm',
        mustTypeConfirmationPhrase: 'Type exactly "{phrase}" to confirm',
        deletedLogs: "Deleted {count} logs",
        cleanupError: "Error cleaning up logs",
      },
      loading: "Loading logs...",
      unsupported: "Endpoint unavailable",
      endpointLabel: "Server logs service",
      empty: "No logs to display",
    },
  },

  // Settings
  settings: {
    title: "Settings",
    profile: "Profile",
    account: "Account",
    appearance: "Appearance",
    language: "Language",
    notifications: "Notifications",
    privacy: "Privacy",
    security: "Security",
    fullName: "Full Name",
    email: "Email",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    newPasswordOptional: "New Password (leave empty if not changing)",
    confirmNewPassword: "Confirm New Password",
    avatar: "Avatar",
    uploadAvatar: "Upload Avatar",
    changeAvatar: "Change Avatar",
    deleteAvatar: "Delete Avatar",
    confirmDeleteAvatar: "Delete profile picture?",
    avatarDeleteSuccess: "Avatar deleted successfully",
    avatarDeleteError: "Error deleting avatar",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    systemTheme: "English (LTR)",
    languageAuto: "Auto (Browser Language)",
    languageHebrew: "Hebrew (עברית)",
    languageEnglish: "English (אנגלית)",
    saveChanges: "Save Changes",
    saveSuccess: "Settings saved successfully",
    changesSaved: "Changes saved",
    saveFailed: "Save failed",
    loadError: "Error loading data",
    updateError: "Error updating data",
    artistRole: "Role (Guitarist, Producer, Bassist...)",
    subscription: "Subscription",
    subscriptionStatus: "Subscription Status",
    subscriptionRequired:
      "Subscription is inactive. Please upgrade to save changes",
    subscriptionRequiredForDelete:
      "Subscription is inactive. Please upgrade to delete avatar",
    currentPlan: "Current Plan",
    upgradePlan: "Upgrade Plan",
    upgradeDescription: "Click to upgrade and return to full system usage",
    upgradeButton: "Upgrade Subscription",
    trialStatus: "Trial Mode",
    trialDaysLeft: "{days} trial days remaining",
    trialCalculationError: "Cannot calculate trial days (missing end date)",
    daysRemaining: "Days Remaining",
    trialEnded: "Trial Ended",
    renewalDateValue: "Next renewal: {date}",
    accessUntilDate: "Access remains active until {date}",
    paymentProviderValue: "Payment provider: {provider}",
    cancelScheduled:
      "Cancellation is scheduled for the end of the current billing period",
    cancelSubscriptionButton: "Cancel auto-renewal",
    cancellingSubscription: "Cancelling renewal...",
    cancelSubscriptionConfirm:
      "Cancel the PayPal auto-renewal at the end of the current billing period?",
    cancelSubscriptionSuccess:
      "Auto-renewal was cancelled. The subscription stays active until the end of the current billing period.",
    cancelSubscriptionError:
      "Unable to cancel the subscription renewal right now",
    active: "Active",
    expired: "Expired",
    twoFactorAuth: "Two-Factor Authentication",
    enableTwoFactor: "Enable Two-Factor",
    disableTwoFactor: "Disable Two-Factor",
  },

  // System Settings (Admin)
  systemSettings: {
    title: "System Settings",
    i18n: "Language Settings (i18n)",
    i18nDescription:
      "Manage available languages in the system and default language",
    defaultMode: "Default Language Mode",
    defaultModeBrowser: "Dynamic (Follow Browser Language)",
    defaultModeFixed: "Fixed (Use Selected Default Language)",
    defaultModeHelp:
      "Choose whether the system default language follows the browser automatically or is a fixed language.",
    defaultLocale: "System Default Language",
    fallbackLocale: "Fallback Default Language",
    enabledLocales: "Available Languages for Users",
    browserDetection: "Browser Language Detection",
    browserDetectionInfo:
      "The system automatically detects the user's browser language. If the detected language is in the list of enabled languages, it will be displayed. Otherwise, the system default language will be shown.",
    defaultLocaleHelp:
      "New users with browser detection will use this language as default if their browser language is not enabled.",
    defaultLocaleHelpFixed:
      "When default mode is fixed, new users (and users on auto) will use this language as their default.",
    fallbackLocaleHelp:
      "When default mode is dynamic, this language is used as a fallback if the browser language is not enabled.",
    enabled: "Enabled",
    disabled: "Disabled",
    defaultLocaleLabel: "Default",
    languageHebrew: "Hebrew (עברית)",
    languageEnglish: "English (אנגלית)",
    rtl: "RTL",
    ltr: "LTR",
    saveSettings: "Save Settings",
    settingsSaved: "Settings saved successfully",
    saveFailed: "Failed to save settings",
    loadFailed: "Failed to load settings",
    cancelChanges: "Cancel Changes",
    defaultMustBeEnabled:
      "The default language must be in the list of enabled languages",
    cannotDisableDefault:
      "Cannot disable the default language. Change the default first.",
    atLeastOneLocale: "At least one language must be enabled",
  },

  // Charts
  charts: {
    title: "Charts",
    uploadChart: "Upload Chart",
    deleteChart: "Delete Chart",
    viewChart: "View Chart",
    downloadChart: "Download Chart",
    noCharts: "No charts",
    chartUploaded: "Chart uploaded successfully",
    chartDeleted: "Chart deleted successfully",
    privateChart: "Private Chart",
    publicChart: "Public Chart",
    chartVisibility: "Chart Visibility",
    makePrivate: "Make Private",
    makePublic: "Make Public",
  },

  // Lyrics
  lyrics: {
    title: "Lyrics",
    addLyrics: "Add Lyrics",
    editLyrics: "Edit Lyrics",
    deleteLyrics: "Delete Lyrics",
    viewLyrics: "View Lyrics",
    noLyrics: "No lyrics",
    lyricsAdded: "Lyrics added",
    lyricsUpdated: "Lyrics updated",
    lyricsDeleted: "Lyrics deleted",
    downloadLyrics: "Download Lyrics",

    moduleDisabled: "Lyrics module is disabled",
    statusHas: "(exists)",
    statusNone: "(none)",
    modalTitle: "Lyrics - {songTitle}",
    placeholderEdit: "Paste/type lyrics here...",
    confirmDeleteMessage:
      "Are you sure you want to delete the lyrics for this song?",
    saveError: "Error saving lyrics",
    deleteError: "Error deleting lyrics",
    readOnlyHint: "Invited users have view-only permission.",
  },

  // Files
  files: {
    title: "Files",
    upload: "Upload File",
    download: "Download File",
    delete: "Delete File",
    fileName: "File Name",
    fileSize: "File Size",
    fileType: "File Type",
    uploadDate: "Upload Date",
    noFiles: "No files",
    selectFile: "Select File",
    dragDropFile: "Drag file here",
    fileUploaded: "File uploaded",
    fileDeleted: "File deleted",
    uploadFailed: "Upload failed",
    maxFileSize: "Max file size",
    allowedTypes: "Allowed file types",
  },

  // Errors & Messages
  errors: {
    generic: "An error occurred",
    networkError: "Network error",
    serverError: "Server error",
    unauthorized: "Unauthorized",
    forbidden: "Access denied",
    notFound: "Not found",
    validationError: "Validation error",
    required: "Required field",
    invalidEmail: "Invalid email",
    invalidFormat: "Invalid format",
    tooShort: "Too short",
    tooLong: "Too long",
    connectionLost: "Connection lost",
    retrying: "Retrying...",
    tryAgain: "Try again",
    somethingWrong: "Something went wrong",
    contactSupport: "Contact support",

    forbiddenAction: "You are not allowed to perform this action",
    serverTryLater: "Server error. Please try again later",
    timeout: "Request timed out",
    networkCheck: "Network error. Check your connection and try again",
  },

  // Success Messages
  success: {
    saved: "Saved successfully",
    updated: "Updated successfully",
    deleted: "Deleted successfully",
    created: "Created successfully",
    uploaded: "Uploaded successfully",
    copied: "Copied successfully",
    sent: "Sent successfully",
    completed: "Completed successfully",
  },

  // Subscription & Billing
  billing: {
    title: "Billing & Subscription",
    subscription: "Subscription",
    plan: "Plan",
    trial: "Trial",
    pro: "Pro",
    premium: "Premium",
    free: "Free",
    status: "Status",
    active: "Active",
    expired: "Expired",
    renewalDate: "Renewal Date",
    cancelSubscription: "Cancel Subscription",
    upgradeSubscription: "Upgrade Subscription",
    downgradeSubscription: "Downgrade Subscription",
    billingHistory: "Billing History",
    paymentMethod: "Payment Method",
    addPaymentMethod: "Add Payment Method",
    invoice: "Invoice",
    downloadInvoice: "Download Invoice",
    subscriptionBlocked: "Your subscription is blocked",
    subscriptionBlockedMessage:
      "Your subscription has expired. Please upgrade to continue using the system.",
    trialEndedTitle: "Your trial has ended",
    upgradeNow: "Upgrade Now",
    paypal: {
      processingTitle: "Validating PayPal subscription",
      processing: "Updating your subscription with PayPal. Please wait...",
      successTitle: "Subscription activated",
      success: "Your payment was approved and the subscription is now active.",
      cancelledTitle: "Payment flow cancelled",
      cancelled: "The PayPal approval flow was cancelled before activation.",
      errorTitle: "Could not validate subscription",
      activateError:
        "An error occurred while validating the PayPal subscription.",
      missingSubscriptionId:
        "Missing PayPal subscription id. Please start the upgrade flow again.",
      backToSettings: "Back to settings",
      popupBlocked:
        "Your browser blocked the PayPal popup. Allow popups and try again.",
      popupClosed:
        "The PayPal window was closed before approval was completed.",
    },

    loadingPlans: "Loading plans...",
    trialUpgradePrompt:
      "To continue using the system, upgrade your subscription • Price:",
    pricePerMonth: "₪ {price} / month",
    actionRequiresSubscription: "This action requires an active subscription",

    upgradeModal: {
      noPlanAvailable: "No plan available for upgrade right now",
      planNotAvailable: "The selected plan is not available right now",
      periodNotAvailable:
        "The selected billing period is not available for this plan",
      upgradeError:
        "An error occurred while upgrading (test). Please try again.",

      titleExpired: "Subscription expired",
      titleTrial: "You are on a trial",
      titleUpgrade: "Upgrade subscription",
      subtitleExpired: "To continue using the system, renew your subscription",
      subtitleChoosePlan: "Choose a plan and return to full access",

      currentPlan: "Current plan",
      statusEnded: "Ended",
      statusTrialUntil: "Trial until",
      statusValidUntil: "Valid until",

      choosePlan: "Choose a plan",
      changeAnytime: "You can change plans anytime",
      billingPeriod: "Billing period",
      canChangeBeforePayment: "Can be changed before payment",

      billingMonthly: "Monthly",
      billingYearly: "Yearly",
      onlyMonthlyAvailable: "Monthly only",
      onlyYearlyAvailable: "Yearly only",
      cadencePerMonth: "per month",
      cadencePerYear: "per year",
      monthlyEquivalent: "≈ {amount} {currency} / month",
      savings: "Save {amount} {currency}",

      selected: "Selected",
      total: "Total",
      paymentSummary: "Payment summary",
      amountDue: "Due",
      pricePerMonthShort: "{currency} {price} / month",
      pricePerYearShort: "{currency} {price} / year",

      upgrading: "Redirecting to PayPal...",
      awaitingPopupApproval: "Waiting for PayPal approval...",
      proceedToPayment: "Proceed to payment",
      proceedToPaymentWithAmount:
        "Proceed to payment - {amount} {currency} {cadence}",
      paypalRedirectNotice:
        "Payment approval continues in PayPal and then returns automatically to the app.",
      paypalPopupNotice:
        "A PayPal popup window is open. Approve the subscription there and it will close automatically.",
      popupPendingHelp:
        "Waiting for your approval in the PayPal window. Once approved, the app will refresh the subscription automatically.",
      paypalProviderTitle: "Secure payment with PayPal",
      paypalProviderDescription:
        "Approval happens in a dedicated PayPal popup, so you stay in the app without losing page context.",
      providerLabel: "Payment method",
      popupExperienceBadge: "Secure popup flow",
    },

    subscriptionRequiredTitle: "Active subscription required",
    subscriptionRequiredMessage1:
      "Access to your account is currently blocked because there is no active subscription.",
    subscriptionRequiredMessage2:
      "You can proceed to payment to continue using the system.",
    subscriptionExpiredOn: "Subscription expired on {date}",
    availablePlans: "Available plans",
    noPlansAvailable: "No plans available right now",
    loadPlansError: "Error loading plans",
    goToPayment: "Proceed to payment",
  },

  contact: {
    subjectLabel: "Message subject",
    messageLabel: "Message",
    phoneLabel: "Callback phone",
    subjectPlaceholder: "What is this about?",
    messagePlaceholder: "How can we help?",
    phonePlaceholder: "050-0000000",
    sending: "Sending...",
    sendButton: "Send message",
    successMessage:
      "Your message was sent successfully. We will get back to you soon.",
    errorMessage: "Error sending message",
  },

  cookies: {
    consent: {
      title: "Cookie usage",
      description:
        'This site uses cookies to improve your experience, analyze traffic, and provide personalized content. By clicking "Accept" you agree to the use of cookies. You can change your preferences at any time through the "Cookie Settings" link at the bottom of the page.',
      acceptButton: "Accept",
      declineButton: "Decline",
      savedAnnouncement: "Cookie preferences saved",
    },
    settings: {
      title: "Cookie settings",
      currentPreferencesTitle: "Current preferences",
      acceptedStatus: "✓ Cookie usage accepted",
      declinedStatus: "✗ Cookie usage declined",
      unsetStatus: "No preference selected",
      explanationTitle: "What does this mean?",
      explanation:
        "Cookies are small files stored on your device that allow the site to remember your preferences, analyze usage, and improve your experience. You can choose to accept or decline the use of cookies.",
      acceptButton: "Accept cookie usage",
      declineButton: "Decline cookie usage",
      acceptedAnnouncement:
        "Cookie preferences updated - cookie usage accepted",
      declinedAnnouncement:
        "Cookie preferences updated - cookie usage declined",
    },
  },

  // Offline/Online Status
  offline: {
    title: "Offline",
    message: "You are offline",
    reconnecting: "Reconnecting...",
    online: "Back online",
    workingOffline: "Working offline",
    actionBlocked: "Cannot perform this action while offline",
    ready: "The app is ready for offline use",

    statusOfflineLabel: "Offline",
    statusOnlineLabel: "Online",
    forcedOfflineTitle: "Forced offline mode is active",
    noInternetTitle: "No internet connection",
    onlineTitle: "Online",

    cacheModal: {
      title: "Content available offline",
      description:
        "This lists all files and URLs already stored in your browser cache. Anything you have not visited or loaded yet will not appear here.",
      loading: "Loading...",
      empty:
        "No cached content right now. Load a few pages or data while online and try again.",
      refresh: "Refresh",
      fillCacheButton: "How do I fill the cache?",
      fillCacheToast:
        "To add more offline content, browse the site once while online.",
      columnCache: "Cache",
      columnUrl: "URL",
    },
  },

  shared: {
    songs: "Shared songs",
    lineups: "Shared lineups",
    artists: "Shared artists",
  },

  // Time & Dates
  time: {
    now: "Now",
    today: "Today",
    yesterday: "Yesterday",
    tomorrow: "Tomorrow",
    thisWeek: "This Week",
    lastWeek: "Last Week",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    thisYear: "This Year",
    lastYear: "Last Year",
    minutes: "minutes",
    hours: "hours",
    days: "days",
    weeks: "weeks",
    months: "months",
    years: "years",
    ago: "ago",
  },

  // Accessibility
  a11y: {
    skipToContent: "Skip to main content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleMenu: "Toggle menu",
    expandSection: "Expand section",
    collapseSection: "Collapse section",
    accessibilityStatement: "Accessibility Statement",
    cookieConsent: "Cookie Consent",
    cookieSettings: "Cookie Settings",
    essentialCookies: "Essential Cookies",
    analyticsCookies: "Analytics Cookies",
    acceptAll: "Accept All",
    rejectAll: "Reject All",
    customizePreferences: "Customize Preferences",
    routeAnnouncer: {
      pageLoaded: "Page loaded",
      home: "Home",
      login: "Login",
      register: "Register",
      settings: "Settings",
      accessibility: "Accessibility Statement",
      myProfile: "My Profile",
      myLineups: "My Lineups",
      admin: "System Administration",
      artistPage: "Artist Page",
      personalArea: "Personal Area",
      sharing: "Sharing",
      invitation: "Invitation",
      resetPassword: "Reset Password",
      unknownPage: "New Page",
    },
  },

  accessibility: {
    title: "Accessibility statement",
    intro:
      "Ari Stage is committed to making its digital services accessible to everyone, including people with disabilities.",
    compliance: {
      title: "Compliance level",
      description:
        "This site meets the requirements of the Israeli Standard SI 5568 for accessible web content at AA level and aligns with WCAG 2.0 level AA guidelines.",
      lastUpdatedLabel: "Last updated:",
      lastUpdatedText: "February 2026",
      lastUpdatedDateTime: "2026-02",
    },
    features: {
      title: "Accessibility features on the site",
      items: [
        {
          icon: "🎹",
          title: "Full keyboard navigation",
          description:
            "All site functionality is available using only a keyboard. Use Tab to move between elements, Enter or Space to activate controls, and Esc to close dialogs.",
        },
        {
          icon: "👁️",
          title: "Clear focus indicators",
          description:
            "All interactive elements are clearly marked when focused so keyboard users always know where they are.",
        },
        {
          icon: "🔊",
          title: "Screen reader support",
          description:
            "The site supports leading screen readers such as NVDA, JAWS, and VoiceOver. Content, actions, and notifications are announced properly.",
        },
        {
          icon: "📝",
          title: "Accessible labels and forms",
          description:
            "All form fields are clearly labeled, validation messages are announced immediately, and guidance is provided before each field.",
        },
        {
          icon: "↔️",
          title: "RTL and LTR support",
          description:
            "The site supports Hebrew (RTL) and English (LTR) with automatic adjustment of layout direction and structure.",
        },
        {
          icon: "⏩",
          title: "Skip to content",
          description:
            "A skip-to-main-content link appears at the start of each page, allowing keyboard users to jump directly to the main content without moving through the menu.",
        },
        {
          icon: "🎨",
          title: "Color contrast",
          description:
            "All site colors meet WCAG 2.0 AA contrast requirements to ensure strong readability.",
        },
        {
          icon: "🍪",
          title: "Cookie controls",
          description:
            "Users can choose whether to accept or decline cookies and update their preference at any time through the cookie settings link in the footer.",
        },
      ],
    },
    technologies: {
      title: "Accessibility technologies",
      intro:
        "The site is built with modern technologies that support accessibility:",
      items: [
        "Semantic HTML5 with defined landmarks",
        "ARIA attributes to improve screen reader support",
        "Focus management for dialogs and forms",
        "Live regions for dynamic announcements",
        "Keyboard traps in modals",
      ],
    },
    knownIssues: {
      title: "Known issues and future improvements",
      description:
        "We continuously work to improve the site's accessibility. At the moment, there are no known accessibility issues that prevent use of the site. If you encounter a problem, we would like to hear from you.",
    },
    testing: {
      title: "Accessibility testing",
      intro: "The site has been tested with:",
      items: [
        "Screen readers: NVDA, JAWS, VoiceOver",
        "Automated testing tools: axe DevTools, WAVE",
        "Full keyboard testing",
        "Color contrast testing",
        "Testing with users with disabilities",
      ],
    },
    contact: {
      title: "Contact",
      intro:
        "If you encountered an accessibility issue on the site, or if you have suggestions for improvement, we would be glad to hear from you:",
      emailLabel: "Email:",
      phoneLabel: "Phone:",
      responseCommitment:
        "We commit to responding to every inquiry within 5 business days and addressing accessibility issues as quickly as possible.",
    },
    footer: {
      lastUpdatedPrefix: "This accessibility statement was last updated in ",
      lastUpdatedText: "February 2026",
      lastUpdatedDateTime: "2026-02",
    },
  },
};

export default en;
