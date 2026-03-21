// Hebrew (עברית) Translation File
export const he = {
  // Common UI
  common: {
    save: "שמור",
    cancel: "בטל",
    delete: "מחק",
    edit: "ערוך",
    add: "הוסף",
    create: "צור",
    update: "עדכן",
    search: "חפש",
    filter: "סנן",
    close: "סגור",
    back: "חזרה",
    backToHome: "חזרה לדף הבית",
    next: "הבא",
    previous: "הקודם",
    loading: "טוען...",
    loadingData: "טוען נתונים...",
    saving: "שומר...",
    deleting: "מוחק...",
    creating: "יוצר...",
    confirm: "אשר",
    yes: "כן",
    no: "לא",
    ok: "אישור",
    actions: "פעולות",
    options: "אפשרויות",
    more: "עוד",
    refresh: "רענן",
    download: "הורד",
    upload: "העלה",
    print: "הדפס",
    share: "שתף",
    copy: "העתק",
    copied: "הועתק!",
    view: "צפה",
    preview: "תצוגה מקדימה",
    settings: "הגדרות",
    help: "עזרה",
    error: "שגיאה",
    success: "הצלחה!",
    logout: "יציאה",
    required: "שדה חובה",
    optional: "אופציונלי",
    notAvailable: "לא זמין",
    selectAll: "בחר הכל",
    unselectAll: "בטל בחירה",
    noResults: "לא נמצאו תוצאות",
    notSpecified: "לא צוין",
    showPassword: "הצג סיסמה",
    hidePassword: "הסתר סיסמה",
    showMore: "הצג עוד",
    showLess: "הצג פחות",
    all: "הכל",
    song: "שיר",
    closeModal: "סגור חלון",
  },

  // Navigation
  nav: {
    home: "בית",
    my: "שלי",
    personal: "אישי",
    shared: "משותפים",
    songs: "שירים",
    lineups: "ליינאפים",
    artists: "אמנים",
    myArtists: "האמנים שלי",
    users: "משתמשים",
    admin: "אדמין",
    settings: "הגדרות",
    billing: "חיוב",
    profile: "פרופיל",
    logout: "יציאה",
    dashboard: "לוח בקרה",
    pendingInvitations: "הזמנות ממתינות",
  },

  // App layout
  appLayout: {
    impersonation: {
      bannerPrefix: "אתה כרגע מייצג את:",
      unknownUser: "משתמש לא מזוהה",
      backToOriginalButton: "חזרה לחשבון המקורי",
    },
    mainContentAriaLabel: "תוכן ראשי",
  },

  // Authentication
  auth: {
    login: "התחבר",
    loginTitle: "התחברות למערכת",
    register: "הרשם",
    registerTitle: "הרשמה למערכת",
    email: "אימייל",
    password: "סיסמה",
    newPassword: "סיסמה חדשה",
    confirmPassword: "אימות סיסמה",
    forgotPassword: "שכחתי סיסמה",
    resetPassword: "איפוס סיסמה",
    updatePassword: "עדכן סיסמה",
    rememberMe: "זכור אותי",
    loginButton: "כניסה",
    registerButton: "הרשמה",
    loggingIn: "מתחבר...",
    registering: "נרשם...",
    logoutSuccess: "התנתקת בהצלחה",
    loginError: "שגיאה בהתחברות",
    invalidCredentials: "אימייל או סיסמה שגויים",
    emailRequired: "יש להזין אימייל",
    passwordRequired: "יש להזין סיסמה",
    passwordTooShort: "הסיסמה קצרה מדי",
    passwordsDontMatch: "הסיסמאות אינן תואמות",
    passwordMismatch: "הסיסמאות אינן תואמות",
    fullName: "שם מלא",
    role: "תפקיד (זמר, גיטריסט, מתופף...)",
    fullNameRequired: "נא להזין שם מלא",
    termsRequired: "יש לאשר שקראת את התקנון",
    registerSuccess: "נרשמת בהצלחה! אפשר להתחבר כעת.",
    registerError: "שגיאה בהרשמה",
    resetEmailSent: "נשלח מייל לאיפוס אם המשתמש קיים",
    resetError: "שגיאה בעת שליחת האיפוס",
    noAvatar: "ללא תמונה",
    uploadAvatar: "העלאת תמונה",
    choosePassword: "בחר סיסמה",
    subtitle: "התחבר או הירשם כדי לנהל את הליינאפ שלך",
    iReadThe: "קראתי את",
    terms: "התקנון",
    passwordUpdated: "הסיסמה עודכנה בהצלחה!",
    backToLogin: "חזרה להתחברות",
    loginNow: "התחבר עכשיו",
    createAccount: "צור חשבון חדש",
    twoFactor: "אימות דו-שלבי",
    twoFactorCode: "קוד אימות",
    verify: "אמת",
    verifying: "מאמת...",
    resetting: "מאפס...",

    termsDialog: {
      ariaLabel: "תקנון השימוש של Ari Stage",
      title: "תקנון שימוש - Ari Stage",
      lastUpdated:
        "עודכן לאחרונה: 23/01/2026. השימוש באתר או באפליקציה Ari Stage מהווה הסכמה לתנאים המפורטים להלן.",
      confirmButton: "מאשר",
      sections: [
        {
          title: "1. מה השירות",
          paragraphs: [
            'Ari Stage היא מערכת לניהול ליינאפים, שירים וחומרים נלווים ("השירות"). ניתן להשתמש בשירות לצורך עבודה אישית או ניהול צוות.',
          ],
        },
        {
          title: "2. חשבון משתמש",
          items: [
            "עליך לספק פרטים נכונים ועדכניים ולשמור על סודיות הסיסמה.",
            "אתה אחראי לכל פעילות שמתבצעת בחשבונך, לרבות העלאת תכנים.",
            "אנו רשאים להשעות או לסגור חשבון במקרה של שימוש לרעה או הפרת תנאים.",
          ],
        },
        {
          title: "3. תכנים שהמשתמש מעלה",
          items: [
            "התכנים, למשל שמות שירים, טקסטים, קבצים, תמונות ו-PDFs, הם באחריותך בלבד.",
            "אתה מצהיר שיש לך זכויות להשתמש ולהעלות את התכנים, ושאינם מפרים זכויות יוצרים, פרטיות או סימני מסחר.",
            "אינך רשאי להעלות תוכן בלתי חוקי, פוגעני, מטעה או כזה שמסכן את אבטחת השירות.",
          ],
        },
        {
          title: "4. שימוש מותר ואסור",
          items: [
            "מותר להשתמש בשירות למטרות ניהול ושיתוף חומרים הקשורים להופעות, חזרות והפקה.",
            "אסור לבצע ניסיונות חדירה, סריקות חולשות, עקיפת הרשאות או שימוש שמעמיס באופן חריג על המערכת.",
            "אסור לאסוף מידע על משתמשים אחרים ללא הרשאה.",
          ],
        },
        {
          title: "5. תשלומים ומנויים",
          paragraphs: [
            "חלק מהפיצ'רים עשויים להיות בתשלום. אם קיימים מסלולים או מנויים, התנאים, המחירים והחיובים יוצגו במעמד הרכישה. אי-תשלום עשוי לגרום להגבלת גישה לפיצ'רים מסוימים.",
          ],
        },
        {
          title: "6. זמינות ושינויים",
          paragraphs: [
            "אנו שואפים לזמינות גבוהה אך איננו מתחייבים שהשירות יהיה ללא תקלות או ללא הפסקות. אנו רשאים לעדכן, לשנות או להפסיק חלקים מן השירות.",
          ],
        },
        {
          title: "7. פרטיות",
          paragraphs: [
            "אנו משתמשים במידע לצורך אספקת השירות, אבטחה ושיפור חוויית המשתמש. ייתכן שנשתמש בעוגיות או באחסון מקומי כגון localStorage לצרכים תפעוליים. לא נמסור מידע אישי לצדדים שלישיים אלא אם נדרש לפי דין או לצורך תפעול השירות.",
          ],
        },
        {
          title: "8. אחריות והגבלת אחריות",
          paragraphs: [
            'השירות מסופק "כמות שהוא". ככל שהדין מאפשר, Ari Stage לא תהיה אחראית לנזקים עקיפים או תוצאתיים, לאובדן נתונים או לאובדן רווחים הנובעים משימוש בשירות.',
          ],
        },
        {
          title: "9. יצירת קשר",
          paragraphs: [
            "לשאלות, דיווח על בעיה או בקשות, ניתן ליצור קשר דרך ערוצי התמיכה המופיעים באתר.",
          ],
        },
        {
          title: "10. הסכמה לתנאים",
          paragraphs: [
            "בהרשמה לשירות, אתה מאשר שקראת והבנת את התקנון ומסכים לפעול לפיו.",
          ],
        },
      ],
    },

    impersonationTokenExpired: "פג תוקף הטוקן לייצוג משתמש. התחבר מחדש.",
    sessionExpiredReLogin: "התחברות פגה. התחבר מחדש.",
    impersonationNoOriginalAccount: "לא נמצא חשבון מקורי לחזרה",
    impersonationBackToOriginal: "חזרת לחשבון המקורי",
  },

  // Invitations
  invitations: {
    invalidLink: "קישור הזמנה לא תקין",
    processing: "מטפל בהזמנה...",
    joinedTitle: "הצטרפת למאגר!",
    joinedPleaseLogin: "הצטרפת בהצלחה למאגר! אנא התחבר כדי להמשיך.",
    createAccountToJoin: "הצטרף למאגר על ידי יצירת חשבון חדש.",
    joinedSuccess: "הצטרפת בהצלחה למאגר!",
    handleError: "שגיאה בטיפול בהזמנה",
    joinPoolTitle: "הצטרף למאגר",
    yourEmail: "האימייל שלך",
    redirectingToLogin: "מעביר לדף ההתחברות...",

    acceptedToast: "הזמנה אושרה",
    rejectedToast: "הזמנה נדחתה",
    acceptError: "שגיאה באישור ההזמנה",
    rejectError: "שגיאה בדחיית ההזמנה",

    pendingModal: {
      title: "הזמנות ממתינות",
      subtitle: "בחר הזמנה לאישור או דחייה",
      loading: "טוען הזמנות...",
      empty: "אין הזמנות ממתינות",
      unknownUser: "משתמש",
      inviterHint: "מזמין אותך להצטרף למאגר שלו",
    },
  },

  landing: {
    heroSubtitle:
      "הבית הרשמי לזמרים, נגנים ומפיקים — כל השירים, כל הלינאפים וכל האירועים שלך מנוהלים במקום אחד, בצורה חכמה, מהירה ומקצועית.",
    loginButton: "התחברות",
    freeTrialButton: "התחל ניסיון חינם",
    demoButton: "צפה בדמו",
    screenshotAlt: "צילום מסך של האפליקציה",
    whyTitle: "למה דווקא Ari Stage?",
    features: {
      smartSongBank: {
        title: "מאגר שירים חכם",
        description:
          "כל השירים שלך במקום אחד — כולל BPM, סולם, תגיות, אורך השיר, הערות, וכל מה שצריך כדי לעלות לבמה בביטחון.",
      },
      oneClickSharing: {
        title: "שיתוף לינאפ בלחיצה",
        description:
          "שלח לינק לכל הצוות — זמרים, נגנים והפקה — שמתעדכן אונליין עד הרגע האחרון. כל שינוי שאתה עושה מתעדכן לכולם בשנייה. מושלם להופעות.",
      },
      smartLineups: {
        title: "לינאפים חכמים",
        description:
          "גרירה ושחרור, סדר מהיר, חישוב זמני הופעה אוטומטיים, שמירה, שיתוף וייצוא — הכל כמה פעמים שתרצה.",
      },
      realtimeUpdates: {
        title: "עדכונים בזמן אמת",
        description:
          "כל שינוי שאתה מבצע — שיר שנוסף, זמן שהשתנה, הערה שנוספה — מתעדכן אצל כולם באותו רגע. בלי בלאגן, בלי וואטסאפים.",
      },
      eventManagement: {
        title: "ניהול הופעות ואירועים",
        description:
          "שליטה מלאה בכל האירועים שלך: תאריכים, סטים, זמנים, ליינים, חזרות — הכל במקום אחד מקצועי וקל לתפעול.",
      },
      aiAutomation: {
        title: "אוטומציה ו-AI בהופעות",
        description:
          "בקרוב: בינה שתבנה לך ליינאפים אוטומטיים לפי BPM, אנרגיה, סגנון ושלב האירוע. עוזר אישי לכל הופעה.",
      },
    },
  },

  footer: {
    navAriaLabel: "קישורי נגישות ופרטיות",
    accessibilityLink: "הצהרת נגישות",
    cookieSettingsLink: "הגדרות עוגיות",
    closeSection: "סגור",
    copyright: "© {year} Ari Stage. כל הזכויות שמורות.",
    about: {
      title: "אודות",
      paragraphs: [
        "Ari Stage היא פלטפורמה לניהול ותיאום תהליכים סביב הופעות, אמנים, שיתופים וקבצים - במקום אחד, בצורה פשוטה וברורה.",
        "המטרה שלנו היא לחסוך זמן בהתנהלות היומיומית: להוציא פחות הודעות, לאתר קבצים מהר, ולעבוד מסודר עם צוותים ואנשים שונים.",
      ],
      highlight: "יש לך רעיון לשיפור? נשמח לשמוע בתפריט תמיכה.",
    },
    support: {
      title: "תמיכה",
      intro: "צריכים עזרה? הנה כמה צעדים מהירים לפני שפונים:",
      quickSteps: [
        "נסו לרענן את הדף (Ctrl+R).",
        "אם מדובר בבעיה בטעינת נתונים, בדקו חיבור אינטרנט והתחברות מחדש.",
        "אם העלאת קובץ נכשלה, נסו שם קובץ באנגלית/מספרים וגודל קטן יותר.",
      ],
      fastHelpTitle: "כדי שנוכל לעזור מהר:",
      fastHelpItems: [
        "מה ניסית לעשות בדיוק?",
        "מה הופיע על המסך (שגיאה/התנהגות)?",
        "באיזה מכשיר/דפדפן?",
      ],
      outro:
        "אם יש לכם ערוץ פנימי (וואטסאפ/מייל צוותי) - שלחו שם צילום מסך ותיאור קצר.",
    },
    terms: {
      title: "תנאים",
      summaryTitle: "תנאי שימוש (תמצית)",
      intro:
        "השימוש במערכת הוא כמות שהוא ונועד לסייע בניהול מידע, קבצים ותהליכים. אנחנו עושים מאמץ לשמור על זמינות ותקינות, אבל ייתכנו תקלות זמניות.",
      items: [
        "המשתמש אחראי על התכנים שהוא מעלה או משתף ועל הרשאות השיתוף.",
        "אין להעלות תוכן לא חוקי, פוגעני או מפר זכויות יוצרים.",
        "ניתן לשנות, לעדכן או להסיר תכונות ושירותים מעת לעת.",
      ],
      outro:
        "רוצים שננסח תנאים משפטיים מלאים? מומלץ להתאים זאת לעורך דין בהתאם לשימוש העסקי שלכם.",
    },
    privacy: {
      title: "פרטיות",
      summaryTitle: "מדיניות פרטיות (תמצית)",
      intro:
        "אנחנו שומרים מידע שנדרש להפעלת השירות: פרטי משתמש, הגדרות ונתונים שאתם יוצרים במערכת (כמו קבצים או תוכן). אנו משתמשים במידע כדי לספק את השירות, לשפר אותו ולשמור על אבטחה.",
      items: [
        "שיתוף מידע מתבצע בהתאם להרשאות שהוגדרו (משתמשים או צוותים).",
        "ייתכן שימוש ביומני מערכת לצורכי אבטחה, ניטור ותחקור תקלות.",
        "ניתן לבקש מחיקה או ייצוא של מידע בהתאם למדיניות הארגון והחוק החל.",
      ],
      outro:
        "אם אתם צריכים ניסוח רשמי מלא (כולל עוגיות או מעקב), כדאי להוסיף סעיפים בהתאם לכלים שבהם אתם משתמשים בפועל.",
    },
  },

  // Songs
  songs: {
    title: "שירים",
    addSong: "הוסף שיר",
    editSong: "ערוך שיר",
    deleteSong: "מחק שיר",
    songTitle: "כותרת",
    artist: "אמן",
    bpm: "BPM",
    key: "טונליות",
    duration: "משך",
    notes: "הערות",
    lyrics: "מילים",
    chart: "צ'ארט",
    charts: "צ'ארטים",
    uploadChart: "העלה צ'ארט",
    deleteChart: "מחק צ'ארט",
    viewChart: "צפה בצ'ארט",
    privateChart: "צ'ארט פרטי",
    chartsUi: {
      moduleDisabled: "מודול צ'ארטים כבוי",
      myChartsWithCount: "הצ'ארטים שלי ({count})",
      uploadFile: "העלה קובץ",
      invalidFileType: "רק קבצי PDF או תמונה (JPG, PNG, GIF) מותרים",
      uploadSuccess: "הקובץ הועלה בהצלחה",
      uploadError: "שגיאה בהעלאת הקובץ",
      deleteTitle: "מחיקת צ'ארט",
      deleteMessage: "בטוח שאתה רוצה למחוק את הצ'ארט?",
      deleteSuccess: "הצ'ארט נמחק בהצלחה",
      deleteError: "שגיאה במחיקת הצ'ארט",
      viewerTitle: "צפייה בצ'ארט",
      chartAlt: "צ'ארט",
      defaultFileName: "צ'ארט",
    },
    noSongs: "אין שירים",
    noSongsAvailable: "אין שירים זמינים",
    searchSongs: "חפש שירים",
    mySongs: "השירים שלי",
    sharedSongs: "שירים משותפים",
    songDetails: "פרטי שיר",
    addToLineup: "הוסף לליינאפ",
    removeFromLineup: "הסר מליינאפ",
    songAdded: "השיר נוסף בהצלחה",
    songUpdated: "השיר עודכן בהצלחה",
    songDeleted: "השיר נמחק בהצלחה",
    confirmDelete: "האם למחוק את השיר?",
    deleteWarning: "פעולה זו אינה ניתנת לשחזור",

    notesPresets: {
      happy: "שמח",
      upbeat: "קצבי",
      calm: "שקט",
      emotional: "מרגש",
      light: "קליל",
    },

    addSongsModuleDisabled: "מודול הוספת שירים כבוי",
  },

  // Lineups
  lineups: {
    title: "ליינאפים",
    addLineup: "צור ליינאפ",
    editLineup: "ערוך ליינאפ",
    deleteLineup: "מחק ליינאפ",
    lineupTitle: "כותרת הליינאפ",
    date: "תאריך",
    time: "שעה",
    location: "מיקום",
    description: "תיאור",
    songs: "שירים",
    noLineups: "אין ליינאפים",
    noLineupsAvailable: "אין ליינאפים זמינים",
    noSongsInLineup: "אין שירים בליינאפ",
    noSongsInThisLineup: "אין שירים בליינאפ זה",
    searchLineups: "חפש ליינאפים",
    myLineups: "הליינאפים שלי",
    sharedLineups: "ליינאפים משותפים",
    lineupDetails: "פרטי ליינאפ",
    addSongsToLineup: "הוסף שירים",
    addSongsHint: "לחץ על הכפתור הירוק למעלה כדי להוסיף שירים",
    reorderSongs: "סדר מחדש",
    dragMode: "מצב גרירה",
    dragModeActive: "גרירה פעילה",
    totalDuration: "משך כולל",
    songCount: "מספר שירים",
    lineupCreated: "הליינאפ נוצר בהצלחה",
    lineupUpdated: "הליינאפ עודכן בהצלחה",
    lineupDeleted: "הליינאפ נמחק בהצלחה",
    confirmDeleteLineup: "האם למחוק את הליינאפ?",
    shareLineup: "שתף ליינאפ",
    shareShort: "שיתוף",
    creatingShare: "יוצר...",
    shareUrl: "קישור לשיתוף",
    revokeShare: "בטל שיתוף",
    lineupShared: "הליינאפ שותף בהצלחה",
    shareRevoked: "השיתוף בוטל",
    copyLink: "העתק קישור",
    linkCopied: "הקישור הועתק",
    publicView: "תצוגה ציבורית",
    publicNotFound: "הליינאפ לא נמצא או שהקישור לא תקין",
    downloadAllCharts: "הורד כל הצ'ארטים",
    downloadAllLyrics: "הורד כל המילים",
    downloadCharts: "הורד צ'ארטים",
    downloadLyrics: "הורד מילים",
    printLineup: "הדפס ליינאפ",
    songsCount: "{count} שירים",
    unspecifiedDate: "לא צוין תאריך",
    unspecifiedTime: "לא צוין שעה",
    unspecifiedLocation: "לא צוין מיקום",
    lineupNamePlaceholder: "שם הליינאפ *",
    locationPlaceholder: "מיקום",
    descriptionOptionalPlaceholder: "תיאור (אופציונלי)",

    moduleDisabledTitle: "מודול ליינאפים כבוי",
    moduleDisabledHint: "ניתן להפעיל אותו מחדש בטאב “מודלים” באדמין.",

    artistSongsTab: "שירים של אמנים",
    selectArtistPrompt: "בחר אמן להצגת שירים שלו",

    messages: {
      loadLineupError: "שגיאה בטעינת הליינאפ",
      addSongError: "שגיאה בהוספת שיר",
      removeSongError: "שגיאה במחיקת שיר",

      downloadChartsPreparing: "בטעינת צ'ארטים...",
      noChartsToDownload: "אין צ'ארטים להורדה בליינאפ זה",
      downloadChartsSuccess: "הצ'ארטים הורדו בהצלחה",
      downloadChartsError: "שגיאה בהורדת הצ'ארטים",

      downloadLyricsPreparing: "מכין קובץ מילים...",
      downloadLyricsSuccess: "המילים הורדו בהצלחה",
      downloadLyricsError: "שגיאה בהורדת מילים",

      reorderError: "שגיאה בסידור שירים",

      confirmCreateShareLink: "האם ליצור קישור שיתוף?",
      confirmRevokeShareLink: "לבטל את השיתוף?",
      shareLinkCreated: "קישור השיתוף נוצר!",
      shareLinkCreateError: "שגיאה ביצירת קישור",
    },
  },

  // Artists
  artists: {
    title: "אמנים",
    myArtists: "האמנים שלי",
    inviteArtist: "הזמן אמן",
    removeArtist: "הסר אמן",
    artistProfile: "פרופיל אמן",
    artistName: "שם האמן",
    artistRole: "תפקיד",
    artistEmail: "אימייל",
    noArtists: "אין אמנים",
    searchArtists: "חפש אמנים",
    connectedArtists: "אמנים מחוברים",
    invitedBy: "הוזמן על ידי",
    invitedAt: "הוזמן בתאריך",
    invitationSent: "ההזמנה נשלחה",
    invitationAccepted: "ההזמנה התקבלה",
    pendingInvitation: "הזמנה ממתינה",
    acceptInvitation: "קבל הזמנה",
    declineInvitation: "דחה הזמנה",
    cancelInvitation: "בטל הזמנה",
    confirmRemoveArtist: "האם להסיר את האמן?",
    removeWarning: "הסרת האמן תסיר גם את כל השירים והליינאפים המשותפים",
    leaveArtist: "עזוב אמן",
    confirmLeave: "האם לעזוב את האמן?",
    leaveSuccess: "עזבת את האמן בהצלחה",
    artistCollection: "מאגר האמנים",
    sharedContent: "תוכן משותף",
    unnamedArtist: "אמן ללא שם",
    uninviteTooltip: "בטל שיתוף מאגר",
    uninviteConfirmTitle: "ביטול שיתוף",
    uninviteConfirmMessage:
      "בטוח שאתה רוצה לבטל את השיתוף עם {artistName}? האמן לא יוכל עוד לצפות בליינאפים והשירים שלך.",
    uninviteSuccess: "השיתוף בוטל בהצלחה",
    uninviteError: "שגיאה בביטול השיתוף",
    artistAlt: "אמן",

    profileAccessDenied: "אין לך גישה לפרופיל זה",
    artistNotFound: "אמן לא נמצא",
    loadDataError: "לא ניתן לטעון את הנתונים",

    sharedPoolsTitle: "משותפים",
    loadingArtists: "טוען אמנים...",
    noInvitedPools: "אין מאגרים שהוזמנת אליהם כרגע",
    noInvitedPoolsHint: "אמנים יופיעו כאן כאשר הם יזמינו אותך למאגר שלהם",
    goToArtistPageAria: "מעבר לעמוד של {name}",

    leavePoolConfirmTitle: "ביטול השתתפות",
    leavePoolConfirmMessageSingle:
      "בטוח שאתה רוצה לבטל את השתתפותך במאגר הזה? לא תוכל עוד לצפות בליינאפים והשירים של המארח.",
    leavePoolConfirmMessageAll:
      "בטוח שאתה רוצה לבטל את כל השתתפויותיך במאגרים? לא תוכל עוד לצפות בליינאפים והשירים של המארחים.",
    leavePoolSuccessSingle: "השתתפותך במאגר בוטלה בהצלחה",
    leavePoolSuccessAll: "כל השתתפויותיך בוטלו בהצלחה",
    leavePoolError: "שגיאה בביטול ההשתתפות",

    unknownArtist: "אמן לא ידוע",

    noArtistsInPool: "אין אמנים במאגר שלך כרגע",
    inviteToPoolHint: "הזמן אמנים למאגר שלך באמצעות הכפתור למעלה",
    inviteToPoolTitle: "הזמן אמן למאגר שלך",
    inviteToPoolDescription:
      "הזן את כתובת האימייל של האמן. הוא יקבל מייל עם קישור להצטרפות למאגר שלך.",
    sendInvite: "שלח הזמנה",
    sendingInvite: "שולח...",
  },

  // Users
  users: {
    title: "ניהול משתמשים",
    loadingUsers: "טוען משתמשים...",
    searchPlaceholder: "חפש לפי שם, אימייל או תפקיד...",
    invited: "מוזמן",
    inviteArtistTooltip: "הזמן אמן למאגר שלך",
    noUsers: "אין משתמשים 😴",

    newUser: "משתמש חדש",
    editUser: "עריכת משתמש",
    fullNamePlaceholder: "שם מלא *",
    emailPlaceholder: "אימייל *",
    passwordPlaceholder: "סיסמה *",

    loadError: "שגיאה בטעינת משתמשים",
    saveError: "שגיאה בשמירת הנתונים",
    inviteArtistError: "שגיאה בהזמנת האמן",

    deleteConfirmTitle: "מחיקה",
    deleteConfirmMessage: "בטוח למחוק משתמש זה?",
    impersonateConfirmTitle: "ייצוג משתמש",
    impersonateConfirmMessage: "להיכנס לחשבון שלו?",
    inviteArtistConfirmTitle: "הזמנת אמן",
    inviteArtistConfirmMessage:
      "להזמין את {artistName} למאגר שלך? האמן יוכל לצפות בליינאפים והשירים שלך (קריאה בלבד).",
  },

  // Admin
  admin: {
    title: "פאנל ניהול",
    dashboard: "לוח בקרה",
    users: "משתמשים",
    subscriptions: "מנויים",
    plans: "מסלולים",
    files: "קבצים",
    logs: "לוגים",
    errors: "שגיאות",
    monitoring: "ניטור מערכת",
    models: "מודלים",
    security: "אבטחה",
    systemSettings: "הגדרות מערכת",
    totalUsers: 'סה"כ משתמשים',
    activeUsers: "משתמשים פעילים",
    newUsers: "משתמשים חדשים",
    totalSubscriptions: 'סה"כ מנויים',
    activeSubscriptions: "מנויים פעילים",
    expiredSubscriptions: "מנויים שפג תוקפם",
    trialUsers: "משתמשי ניסיון",
    expiringSoon: "פג תוקף בקרוב",
    openIssues: "תקלות פתוחות",
    systemHealth: "תקינות מערכת",
    cpuUsage: "שימוש CPU",
    memoryUsage: "שימוש זיכרון",
    diskUsage: "שימוש דיסק",
    uptime: "זמן פעילות",
    lastBackup: "גיבוי אחרון",
    featureFlags: "Feature Flags",
    enabledModules: "מודולים מופעלים",
    disabledModules: "מודולים מכובים",
    userRole: "תפקיד משתמש",
    subscriptionType: "סוג מנוי",
    subscriptionStatus: "סטטוס מנוי",
    expiresAt: "תוקף עד",
    createdAt: "נוצר בתאריך",
    lastSeenAt: "נראה לאחרונה",
    impersonate: "התחזה",
    editUser: "ערוך משתמש",
    deleteUser: "מחק משתמש",
    confirmDeleteUser: "האם למחוק את המשתמש?",
    userDeleted: "המשתמש נמחק",
    refreshData: "רענן נתונים",

    messages: {
      noPermission: "אין הרשאה",
      saveUserError: "שגיאה בשמירת המשתמש",
      deleteUserError: "שגיאה במחיקת המשתמש",
      impersonateUserError: "שגיאה בייצוג משתמש",
    },

    usersTab: {
      dashboard: {
        total: "משתמשים",
        admins: "אדמין/מנהל",
        active7d: "פעילים (7 ימים)",
        new30d: "חדשים (30 ימים)",
      },
      lastSeen: {
        never: "לא היה פעיל",
        justNow: "לפני רגע",
        minutesAgo: "לפני {minutes} דק׳",
        hoursAgo: "לפני {hours} שעות",
        daysAgo: "לפני {days} ימים",
      },
      roles: {
        user: "משתמש",
        manager: "מנהל",
        admin: "אדמין",
      },
      form: {
        fullNamePlaceholder: "שם מלא",
      },
      unsupported: {
        title: "חסר endpoint אדמין",
        endpoint: "GET /admin/users",
      },
      loading: "טוען משתמשים...",
      empty: "אין משתמשים להצגה",
    },

    modelsTab: {
      dashboard: {
        modules: "מודולים",
      },
      header: {
        title: "מודלים (Modules)",
        description: "הפעלה/כיבוי מודולים דרך Feature Flags (`module.*`)",
      },
      form: {
        keyLabel: "מפתח",
        keyPlaceholder: "module.myFeature",
        labelLabel: "תווית",
        labelPlaceholder: "לדוגמה: הוספת שירים",
        descriptionLabel: "תיאור",
        descriptionPlaceholder: "תיאור (אופציונלי) — אם ריק נשתמש ב-Label",
        enabledLabel: "מופעל",
        addButton: "הוסף מודול",
        adding: "מוסיף...",
      },
      badges: {
        default: "default",
        db: "db",
      },
      actions: {
        toggle: "הפעלה/כיבוי",
      },
      messages: {
        updateError: "שגיאה בעדכון (feature flag)",
        keyMustStartWithModule: 'Key חייב להתחיל ב-"module."',
        invalidKey: "Key לא חוקי (רק אותיות/ספרות/._-)",
        fillLabelOrDescription: "יש למלא לפחות Label או Description",
        moduleAdded: "מודול נוסף",
      },
      modules: {
        offlineOnline: {
          label: "Offline / Online",
          description: "מצב Offline/Online, קאש (PWA), וזיהוי חיבור רשת",
        },
        charts: {
          label: "צ'ארטים",
          description: "ניהול צ'ארטים וקבצי תווים",
        },
        lyrics: {
          label: "מילים",
          description: "ניהול מילים לשירים",
        },
        addSongs: {
          label: "הוספת שירים",
          description: "יצירה/עריכה/מחיקה של שירים",
        },
        lineups: {
          label: "ליינאפים",
          description: "ניהול ליינאפים ושירים בליינאפ",
        },
        plans: {
          label: "מסלולים",
          description: "ניהול מסלולים / תוכניות תמחור",
        },
        pendingInvitations: {
          label: "הזמנות ממתינות",
          description: "צפייה והחלטה על הזמנות ממתינות",
        },
        inviteArtist: {
          label: "הזמנת אמן - אישי",
          description: "שליחת/ביטול הזמנה לאמן",
        },
        invitedMeArtists: {
          label: "אמנים שהזמינו אותי - משותפים",
          description: "הצגת המאגר: מי הזמין אותי",
        },
        payments: {
          label: "תשלומים",
          description: "יצירת תשלום ואישור תשלום להפעלת מנוי",
        },
        shareLineup: {
          label: "שיתוף ליינאפ",
          description: "שיתוף וצפייה בליינאפ ציבורי באמצעות קישור",
        },
      },
      unsupported: {
        title: "Endpoint לא זמין",
        endpoint: "GET /feature-flags",
      },
      loading: "טוען מודלים...",
      empty: "אין מודלים להצגה",
      clearSearch: "נקה חיפוש",
    },

    plansTab: {
      sections: {
        subscriptionSettings: "הגדרות מנוי",
        planManagement: "ניהול מסלולים",
        payments: "תשלומים",
      },
      subscriptionSettings: {
        trialDaysDescription:
          "קובע כמה ימים יש למשתמש במצב ניסיון (trial) לפני שפג תוקף.",
        trialDaysLabel: "ימי ניסיון",
      },
      readOnly: "קריאה בלבד",
      actions: {
        addPlan: "הוסף מסלול",
        disable: "השבת",
        disablePlan: "השבת מסלול",
        toggleEnabled: "הפעלה / כיבוי",
      },
      loading: {
        plans: "טוען מסלולים...",
        payments: "טוען תשלומים...",
      },
      empty: {
        plans: "אין מסלולים להצגה",
        payments: "אין תשלומים להצגה",
      },
      dashboard: {
        totalPlans: "מסלולים",
        enabledPlans: "מופעלים",
        totalPayments: "תשלומים",
        successPayments: "תשלומים מוצלחים",
      },
      form: {
        titleCreate: "הוספת מסלול",
        titleEdit: "עריכת מסלול",
        labels: {
          key: "מפתח",
          name: "שם",
          description: "תיאור",
          currency: "מטבע",
          monthlyPrice: "מחיר חודשי",
          yearlyPrice: "מחיר שנתי",
          enabled: "מופעל",
        },
        errors: {
          keyRequired: "שדה מפתח הוא חובה",
          nameRequired: "שדה שם הוא חובה",
          currencyRequired: "שדה מטבע הוא חובה",
          monthlyInvalid: "מחיר חודשי לא תקין",
          yearlyInvalid: "מחיר שנתי לא תקין",
          saveFailed: "שגיאה בשמירה",
        },
      },
      messages: {
        noPermissionViewPlans: "אין הרשאה לצפייה במסלולים",
        loadPlansFailed: "שגיאה בטעינת מסלולים",
        loadPaymentsFailed: "שגיאה בטעינת תשלומים",
        planAdded: "מסלול נוסף",
        planUpdated: "מסלול עודכן",
        updated: "עודכן",
        updateEnabledFailed: "שגיאה בעדכון מצב מופעל",
        planDisabled: "המסלול הושבת",
        disablePlanFailed: "שגיאה בהשבתת מסלול",
        planDeleted: "המסלול נמחק בהצלחה",
        deletePlanFailed: "שגיאה במחיקת מסלול",
        invalidTrialDays: "ימי ניסיון לא תקינים",
        trialDaysUpdated: "ימי ניסיון עודכנו",
        noPermissionUpdateTrialDays: "אין הרשאה לעדכן ימי ניסיון",
        updateTrialDaysFailed: "שגיאה בעדכון ימי ניסיון",
      },
      deleteConfirm: {
        title: "מחיקת מסלול",
        message:
          'האם אתה בטוח שברצונך למחוק את המסלול "{name}"? הפעולה אינה הפיכה.',
      },
      payments: {
        headers: {
          user: "משתמש",
          email: "אימייל",
          amount: "סכום (ILS)",
          plan: "מסלול",
          status: "סטטוס",
          date: "תאריך",
        },
      },
    },

    subscriptionsTab: {
      dashboard: {
        total: 'סה"כ',
        paid: "מנויים (לא trial)",
        trial: "trial",
        expiringSoon7d: "פג תוקף בקרוב (7 ימים)",
      },
      loading: "טוען מנויים...",
      empty: "אין נתונים להצגה",
      userNoName: "משתמש ללא שם",
      actions: {
        edit: "ערוך מנוי",
        save: "שמור מנוי",
      },
      form: {
        planLabel: "מסלול מנוי",
        statusLabel: "סטטוס מנוי",
        startLabel: "התחלה",
        endLabel: "סיום",
        note: "שינוי זה מעדכן רק שדות מנוי של המשתמש (plan/status/start/end) ולא משנה מחירי מסלולים.",
      },
      messages: {
        updated: "המנוי עודכן",
        updateFailed: "שגיאה בעדכון מנוי",
      },
      status: {
        active: "פעיל",
        trial: "trial",
        expired: "פג תוקף",
      },
      planOptions: {
        trial: "trial",
        legacySuffix: "(ישן)",
        disabledSuffix: " (מכובה)",
      },
    },
    monitoringTab: {
      loading: "טוען ניטור...",
    },
    securityTab: {
      loading: "טוען נתוני אבטחה...",
      loadFailed: "לא ניתן לטעון נתוני אבטחה",
      views: {
        overview: "מבט כללי",
        events: "אירועים אחרונים",
        sessions: "סשנים פעילים",
        locked: "חשבונות נעולים",
      },
      sections: {
        topFailedLogins: "התחברויות כושלות - 24 שעות אחרונות",
        riskIndicators: "אינדיקטורי סיכון",
      },
      topFailedLogins: {
        attempts: "{count} ניסיונות",
      },
      riskIndicators: {
        bruteForce: "ניסיונות brute force",
        suspiciousIPs: "כתובות IP חשודות",
        unusualHours: "התחברויות בשעות חריגות",
      },
      labels: {
        ip: "IP",
        userId: "User ID",
      },
      dashboard: {
        totalEvents: {
          title: "אירועי אבטחה",
          description: 'סה"כ אירועי אבטחה היום',
        },
        failedLogins: {
          title: "התחברויות כושלות",
          description: "ניסיונות התחברות כושלים היום",
        },
        twoFAUsers: {
          title: "משתמשים עם 2FA",
          description: "משתמשים עם אימות דו-שלבי",
        },
        riskIndicators: {
          title: "אינדיקטורי סיכון",
          description: "חריגות אבטחה זוהו",
        },
      },
      messages: {
        loadFailed: "שגיאה בטעינת נתוני אבטחה",
        sessionRevoked: "הסשן בוטל בהצלחה",
        revokeFailed: "שגיאה בביטול הסשן",
        accountUnlocked: "החשבון שוחרר בהצלחה",
        unlockFailed: "שגיאה בשחרור החשבון",
      },
      sessions: {
        actions: {
          revoke: "בטל סשן",
        },
        labels: {
          created: "נוצר",
          expires: "פג תוקף",
          lastUsed: "שימוש אחרון",
        },
        empty: "אין סשנים פעילים",
      },
      locked: {
        actions: {
          unlock: "שחרר חשבון",
        },
        labels: {
          lockedAt: "ננעל",
          remainingMinutes: "נותרו {minutes} דקות",
        },
        empty: "אין חשבונות נעולים",
      },
    },

    filesTab: {
      header: {
        title: "קבצים בשרת (Uploads)",
      },
      filters: {
        byUser: "סינון לפי משתמש",
        allUsers: "כל המשתמשים",
        clear: "נקה סינון",
      },
      badges: {
        files: "קבצים: {count}",
        totalKnownSize: 'סה"כ: {size}',
        unknownSize: "לא ידוע: {count}",
      },
      dashboard: {
        totalFiles: 'סה"כ קבצים',
        shown: "מוצגים",
        knownSize: "נפח ידוע",
        unknownSize: "בלי גודל",
      },
      confirm: {
        deleteFile: "בטוח למחוק קובץ זה מהשרת?",
      },
      messages: {
        deleteEndpointRequired: "נדרש endpoint בצד שרת: DELETE /admin/files",
        deleteFileError: "שגיאה במחיקת הקובץ",
        missingStoragePath: "לא ניתן למחוק: חסר storage_path",
      },
      loading: "טוען קבצים...",
      unsupported: "נדרש endpoint בצד שרת",
      empty: "אין קבצים להצגה",
      clearSearch: "נקה חיפוש",
    },

    errorsTab: {
      dashboard: {
        total: 'סה"כ תקלות',
        open: "פתוחות",
        resolved: "נסגרו",
        shown: "מוצגות",
      },
      confirm: {
        resolveTitle: "סגירת תקלה",
        resolveMessage: "לסמן תקלה כנסגרה?",
      },
      messages: {
        resolveError: "שגיאה בסגירת התקלה",
      },
      states: {
        open: "פתוחה",
        resolved: "נסגרה",
      },
      actions: {
        resolve: "סגור",
      },
      issueFallback: "תקלה",
      loading: "טוען תקלות...",
      unsupported: "נדרש endpoint בצד שרת",
      empty: "אין תקלות להצגה",
      clearSearch: "נקה חיפוש",
    },

    logsTab: {
      userFallback: "משתמש",
      dashboard: {
        total: 'סה"כ לוגים',
        onPage: "בדף",
        errorsOnPage: "שגיאות (בדף)",
        activeFilters: "פילטרים פעילים",
      },
      filters: {
        level: "רמה",
        action: "פעולה",
        user: "משתמש",
        from: "מ-",
        to: "עד",
        pageSize: "גודל עמוד",
      },
      levels: {
        info: "מידע",
        warn: "אזהרה",
        error: "שגיאה",
      },
      actions: {
        cleanup: "ניקוי לוגים",
        clearFilters: "נקה פילטרים",
      },
      pagination: {
        showing: "מציג {from}-{to} מתוך {total}",
      },
      table: {
        time: "זמן",
        level: "רמה",
        action: "פעולה",
        explanation: "פירוט",
      },
      actor: {
        user: "משתמש {id}",
        system: "מערכת",
      },
      logActionFallback: "LOG",
      details: {
        title: "פרטי לוג",
        timestamp: "תאריך/שעה",
        userId: "מזהה משתמש",
        action: "פעולה",
        level: "רמה",
        context: "הקשר",
      },
      cleanup: {
        title: "ניקוי לוגים",
        description: "פעולה זו מוחקת לוגים מהמערכת. כדי לאשר, הקלד",
        confirmPhrase: "מחק לוגים",
        olderThanDays: "ישן יותר (ימים)",
        olderThanDaysHint: "אם beforeDate ריק, יימחקו לוגים ישנים מ-X ימים.",
        beforeDate: "לפני תאריך",
        beforeDateHint: "אם ממולא — מתעלם מ-olderThanDays.",
        confirmation: "אישור",
        deleting: "מנקה...",
        delete: "מחק לוגים",
      },
      messages: {
        mustTypeDeleteLogs: 'יש להקליד בדיוק "DELETE LOGS" כדי לאשר',
        mustTypeConfirmationPhrase: 'יש להקליד בדיוק "{phrase}" כדי לאשר',
        deletedLogs: "נמחקו {count} לוגים",
        cleanupError: "שגיאה בניקוי לוגים",
      },
      loading: "טוען לוגים...",
      unsupported: "Endpoint לא זמין",
      empty: "אין לוגים להצגה",
    },
  },

  // Settings
  settings: {
    title: "הגדרות",
    profile: "פרופיל",
    account: "חשבון",
    appearance: "מראה",
    language: "שפה",
    notifications: "התראות",
    privacy: "פרטיות",
    security: "אבטחה",
    fullName: "שם מלא",
    email: "אימייל",
    changePassword: "שנה סיסמה",
    currentPassword: "סיסמה נוכחית",
    newPassword: "סיסמה חדשה",
    newPasswordOptional: "סיסמה חדשה (השאר ריק אם לא משנים)",
    confirmNewPassword: "אמת סיסמה חדשה",
    avatar: "תמונת פרופיל",
    uploadAvatar: "העלה תמונה",
    changeAvatar: "החלף תמונה",
    deleteAvatar: "מחק תמונה",
    confirmDeleteAvatar: "למחוק את תמונת הפרופיל?",
    avatarDeleteSuccess: "התמונה נמחקה בהצלחה",
    avatarDeleteError: "שגיאה במחיקת התמונה",
    theme: "ערכת נושא",
    darkMode: "מצב כהה",
    lightMode: "מצב בהיר",
    systemTheme: "עברית (RTL)",
    languageAuto: "אוטומטי (לפי שפת הדפדפן)",
    languageHebrew: "עברית (RTL)",
    languageEnglish: "English (LTR)",
    saveChanges: "שמור שינויים",
    saveSuccess: "הפרטים נשמרו בהצלחה",
    changesSaved: "השינויים נשמרו",
    saveFailed: "שמירה נכשלה",
    loadError: "שגיאה בטעינת הנתונים",
    updateError: "שגיאה בעדכון הנתונים",
    artistRole: "תפקיד (גיטריסט, מפיק, בסיסט...)",
    subscription: "מנוי",
    subscriptionStatus: "סטטוס מנוי",
    subscriptionRequired: "המנוי אינו פעיל. כדי לשמור שינויים יש לשדרג מנוי",
    subscriptionRequiredForDelete:
      "המנוי אינו פעיל. כדי למחוק תמונה יש לשדרג מנוי",
    currentPlan: "מסלול נוכחי",
    upgradePlan: "שדרוג מנוי",
    upgradeDescription: "לחץ כדי לשדרג ולחזור לשימוש מלא במערכת",
    upgradeButton: "שדרג מנוי",
    trialStatus: "מצב ניסיון",
    trialDaysLeft: "נותרו {days} ימי ניסיון",
    trialCalculationError: "לא ניתן לחשב ימי ניסיון (חסר תאריך סיום)",
    daysRemaining: "ימים נותרו",
    trialEnded: "תקופת הניסיון הסתיימה",
    active: "פעיל",
    expired: "הסתיים",
    twoFactorAuth: "אימות דו-שלבי",
    enableTwoFactor: "הפעל אימות דו-שלבי",
    disableTwoFactor: "כבה אימות דו-שלבי",
  },

  // System Settings (Admin)
  systemSettings: {
    title: "הגדרות מערכת",
    i18n: "הגדרות שפות (i18n)",
    i18nDescription: "ניהול שפות זמינות במערכת ושפת ברירת מחדל",
    defaultMode: "מצב שפת ברירת מחדל",
    defaultModeBrowser: "דינמי (לפי שפת הדפדפן)",
    defaultModeFixed: "קבוע (שפה נבחרת כברירת מחדל)",
    defaultModeHelp:
      "בחר האם שפת ברירת המחדל של המערכת תיקבע אוטומטית לפי שפת הדפדפן או תהיה שפה קבועה.",
    defaultLocale: "שפת ברירת מחדל של המערכת",
    fallbackLocale: "שפת ברירת מחדל לגיבוי",
    enabledLocales: "שפות זמינות למשתמשים",
    browserDetection: "זיהוי שפת דפדפן",
    browserDetectionInfo:
      "המערכת מזהה אוטומטית את שפת הדפדפן של המשתמש. אם השפה שזוהתה נמצאת ברשימת השפות המופעלות, היא תוצג. אחרת, תוצג שפת ברירת המחדל של המערכת.",
    defaultLocaleHelp:
      "משתמשים חדשים עם זיהוי דפדפן אוטומטי יקבלו שפה זו כברירת מחדל אם הדפדפן שלהם מציע שפה שאינה מופעלת",
    defaultLocaleHelpFixed:
      "כאשר מצב ברירת המחדל הוא קבוע, משתמשים חדשים (ומשתמשים על מצב אוטומטי) יקבלו שפה זו כברירת המחדל שלהם.",
    fallbackLocaleHelp:
      "כאשר מצב ברירת המחדל הוא דינמי, שפה זו תשמש כגיבוי אם שפת הדפדפן אינה מופעלת.",
    enabled: "מופעל",
    disabled: "כבוי",
    defaultLocaleLabel: "ברירת מחדל",
    languageHebrew: "עברית (Hebrew)",
    languageEnglish: "English (אנגלית)",
    rtl: "RTL",
    ltr: "LTR",
    saveSettings: "שמור הגדרות",
    settingsSaved: "ההגדרות נשמרו בהצלחה",
    saveFailed: "שגיאה בשמירת הגדרות",
    loadFailed: "שגיאה בטעינת הגדרות",
    cancelChanges: "בטל שינויים",
    defaultMustBeEnabled: "שפת ברירת המחדל חייבת להיות ברשימת השפות המופעלות",
    cannotDisableDefault:
      "לא ניתן לכבות את שפת ברירת המחדל. שנה את ברירת המחדל קודם.",
    atLeastOneLocale: "חייבת להיות לפחות שפה אחת מופעלת",
  },

  // Charts
  charts: {
    title: "צ'ארטים",
    uploadChart: "העלה צ'ארט",
    deleteChart: "מחק צ'ארט",
    viewChart: "צפה בצ'ארט",
    downloadChart: "הורד צ'ארט",
    noCharts: "אין צ'ארטים",
    chartUploaded: "הצ'ארט הועלה בהצלחה",
    chartDeleted: "הצ'ארט נמחק בהצלחה",
    privateChart: "צ'ארט פרטי",
    publicChart: "צ'ארט ציבורי",
    chartVisibility: "נראות צ'ארט",
    makePrivate: "הפוך לפרטי",
    makePublic: "הפוך לציבורי",
  },

  // Lyrics
  lyrics: {
    title: "מילים",
    addLyrics: "הוסף מילים",
    editLyrics: "ערוך מילים",
    deleteLyrics: "מחק מילים",
    viewLyrics: "צפה במילים",
    noLyrics: "אין מילים",
    lyricsAdded: "המילים נוספו",
    lyricsUpdated: "המילים עודכנו",
    lyricsDeleted: "המילים נמחקו",
    downloadLyrics: "הורד מילים",

    moduleDisabled: "מודול מילים כבוי",
    statusHas: "(קיים)",
    statusNone: "(אין)",
    modalTitle: "מילים - {songTitle}",
    placeholderEdit: "הדבק/כתוב כאן את המילים...",
    confirmDeleteMessage: "בטוח שאתה רוצה למחוק את המילים לשיר הזה?",
    saveError: "שגיאה בשמירת מילים",
    deleteError: "שגיאה במחיקת מילים",
    readOnlyHint: "למוזמנים יש הרשאת צפייה בלבד.",
  },

  // Files
  files: {
    title: "קבצים",
    upload: "העלה קובץ",
    download: "הורד קובץ",
    delete: "מחק קובץ",
    fileName: "שם קובץ",
    fileSize: "גודל קובץ",
    fileType: "סוג קובץ",
    uploadDate: "תאריך העלאה",
    noFiles: "אין קבצים",
    selectFile: "בחר קובץ",
    dragDropFile: "גרור קובץ לכאן",
    fileUploaded: "הקובץ הועלה",
    fileDeleted: "הקובץ נמחק",
    uploadFailed: "העלאה נכשלה",
    maxFileSize: "גודל מקסימלי",
    allowedTypes: "סוגי קבצים מותרים",
  },

  // Errors & Messages
  errors: {
    generic: "אירעה שגיאה",
    networkError: "שגיאת רשת",
    serverError: "שגיאת שרת",
    unauthorized: "אין הרשאה",
    forbidden: "גישה נדחתה",
    notFound: "לא נמצא",
    validationError: "שגיאת ולידציה",
    required: "שדה חובה",
    invalidEmail: "אימייל לא תקין",
    invalidFormat: "פורמט לא תקין",
    tooShort: "קצר מדי",
    tooLong: "ארוך מדי",
    connectionLost: "החיבור אבד",
    retrying: "מנסה שוב...",
    tryAgain: "נסה שוב",
    somethingWrong: "משהו השתבש",
    contactSupport: "צור קשר עם התמיכה",

    forbiddenAction: "אין לך הרשאה לבצע פעולה זו",
    serverTryLater: "שגיאת שרת. נסה שוב מאוחר יותר",
    timeout: "הבקשה לקחה יותר מדי זמן",
    networkCheck: "בעיית רשת. בדוק חיבור ונסה שוב",
  },

  // Success Messages
  success: {
    saved: "נשמר בהצלחה",
    updated: "עודכן בהצלחה",
    deleted: "נמחק בהצלחה",
    created: "נוצר בהצלחה",
    uploaded: "הועלה בהצלחה",
    copied: "הועתק בהצלחה",
    sent: "נשלח בהצלחה",
    completed: "הושלם בהצלחה",
  },

  // Subscription & Billing
  billing: {
    title: "חיוב ומנוי",
    subscription: "מנוי",
    plan: "מסלול",
    trial: "ניסיון",
    pro: "Pro",
    premium: "Premium",
    free: "חינם",
    status: "סטטוס",
    active: "פעיל",
    expired: "פג תוקף",
    renewalDate: "תאריך חידוש",
    cancelSubscription: "בטל מנוי",
    upgradeSubscription: "שדרג מנוי",
    downgradeSubscription: "הורד מנוי",
    billingHistory: "היסטוריית חיובים",
    paymentMethod: "אמצעי תשלום",
    addPaymentMethod: "הוסף אמצעי תשלום",
    invoice: "חשבונית",
    downloadInvoice: "הורד חשבונית",
    subscriptionBlocked: "המנוי שלך חסום",
    subscriptionBlockedMessage:
      "המנוי שלך פג תוקף. אנא שדרג כדי להמשיך להשתמש במערכת.",
    trialEndedTitle: "תקופת הניסיון הסתיימה",
    upgradeNow: "שדרג עכשיו",

    loadingPlans: "טוען מסלולים...",
    trialUpgradePrompt: "כדי להמשיך להשתמש במערכת יש לשדרג מנוי • מחיר:",
    pricePerMonth: "{price} ₪ לחודש",
    actionRequiresSubscription: "הפעולה הזו דורשת מנוי פעיל",

    upgradeModal: {
      noPlanAvailable: "אין מסלול זמין לשדרוג כרגע",
      planNotAvailable: "המסלול הנבחר אינו זמין כרגע",
      upgradeError: "אירעה שגיאה בשדרוג המנוי (בדיקה). נסה שוב.",

      titleExpired: "המנוי פג תוקף",
      titleTrial: "את/ה בתקופת ניסיון",
      titleUpgrade: "שדרוג מנוי",
      subtitleExpired: "כדי להמשיך להשתמש במערכת, יש לחדש מנוי",
      subtitleChoosePlan: "בחר/י מסלול וחזור/י לשימוש מלא במערכת",

      currentPlan: "מסלול נוכחי",
      statusEnded: "הסתיים",
      statusTrialUntil: "ניסיון עד",
      statusValidUntil: "בתוקף עד",

      choosePlan: "בחר/י מסלול",
      changeAnytime: "אפשר לבחור מסלול אחר בכל רגע",
      billingPeriod: "תקופת חיוב",
      canChangeBeforePayment: "ניתן לשנות לפני תשלום",

      billingMonthly: "חודשי",
      billingYearly: "שנתי",
      cadencePerMonth: "לחודש",
      cadencePerYear: "לשנה",
      monthlyEquivalent: "≈ {amount} {currency} לחודש",
      savings: "חיסכון {amount} {currency}",

      selected: "נבחר",
      total: 'סה"כ',
      paymentSummary: "סיכום תשלום",
      amountDue: "לתשלום",
      pricePerMonthShort: "{currency} {price} לחודש",
      pricePerYearShort: "{currency} {price} לשנה",

      upgrading: "מבצע שדרוג (בדיקה)...",
      proceedToPayment: "המשך לתשלום",
      proceedToPaymentWithAmount: "המשך לתשלום - {amount} {currency} {cadence}",
    },

    subscriptionRequiredTitle: "נדרש מנוי פעיל",
    subscriptionRequiredMessage1:
      "הגישה לחשבון שלך חסומה כרגע כי אין מנוי פעיל.",
    subscriptionRequiredMessage2: "ניתן לעבור לתשלום כדי להמשיך להשתמש במערכת.",
    subscriptionExpiredOn: "תוקף המנוי הסתיים בתאריך {date}",
    availablePlans: "מסלולים זמינים",
    noPlansAvailable: "אין מסלולים זמינים כרגע",
    loadPlansError: "שגיאה בטעינת מסלולים",
    goToPayment: "לתשלום",
  },

  contact: {
    subjectLabel: "נושא ההודעה",
    messageLabel: "תוכן ההודעה",
    phoneLabel: "טלפון לחזרה",
    subjectPlaceholder: "מה הנושא?",
    messagePlaceholder: "איך אפשר לעזור?",
    phonePlaceholder: "050-0000000",
    sending: "שולח...",
    sendButton: "שלח הודעה",
    successMessage: "ההודעה נשלחה בהצלחה! נחזור אליך בהקדם.",
    errorMessage: "שגיאה בשליחת ההודעה",
  },

  cookies: {
    consent: {
      title: "שימוש בעוגיות",
      description:
        'אתר זה משתמש בעוגיות כדי לשפר את חוויית המשתמש, לנתח תנועה באתר ולספק תכנים מותאמים אישית. על ידי לחיצה על "אישור" אתה מסכים לשימוש בעוגיות. ניתן לשנות את ההעדפות בכל עת דרך קישור "הגדרות עוגיות" בתחתית העמוד.',
      acceptButton: "אישור",
      declineButton: "ביטול",
      savedAnnouncement: "העדפות עוגיות נשמרו",
    },
    settings: {
      title: "הגדרות עוגיות",
      currentPreferencesTitle: "העדפות נוכחיות",
      acceptedStatus: "✓ שימוש בעוגיות מאושר",
      declinedStatus: "✗ שימוש בעוגיות נדחה",
      unsetStatus: "לא נקבעה העדפה",
      explanationTitle: "מה זה אומר?",
      explanation:
        "עוגיות הן קבצים קטנים שנשמרים במחשב שלך ומאפשרים לאתר לזכור את ההעדפות שלך, לנתח את השימוש באתר ולשפר את חוויית המשתמש. אתה יכול לבחור לאשר או לדחות את השימוש בעוגיות.",
      acceptButton: "אישור שימוש בעוגיות",
      declineButton: "דחיית שימוש בעוגיות",
      acceptedAnnouncement: "העדפות עוגיות עודכנו - שימוש בעוגיות מאושר",
      declinedAnnouncement: "העדפות עוגיות עודכנו - שימוש בעוגיות נדחה",
    },
  },

  // Offline/Online Status
  offline: {
    title: "אופליין",
    message: "אתה במצב אופליין",
    reconnecting: "מתחבר מחדש...",
    online: "חזרת לרשת",
    workingOffline: "עובד במצב אופליין",
    actionBlocked: "לא ניתן לבצע פעולה במצב אופליין",
    ready: "האפליקציה מוכנה לשימוש Offline",

    statusOfflineLabel: "אופליין",
    statusOnlineLabel: "אונליין",
    forcedOfflineTitle: "מצב Offline כפוי פעיל",
    noInternetTitle: "אין חיבור אינטרנט",
    onlineTitle: "אונליין",

    cacheModal: {
      title: "תוכן זמין במצב Offline",
      description:
        "מוצגים כאן כל הקבצים והכתובות שכבר נשמרו בקאש בדפדפן. מה שלא ביקרו בו או נטען עדיין לא יופיע כאן.",
      loading: "טוען...",
      empty:
        "אין תוכן מקאש כרגע. טען כמה דפים או נתונים במצב Online ואז נסה שוב.",
      refresh: "רענן",
      fillCacheButton: "איך למלא קאש?",
      fillCacheToast:
        "כדי להוסיף עוד תוכן ל-Offline: תטייל באתר במצב Online פעם אחת",
    },
  },

  shared: {
    songs: "שירים משותפים",
    lineups: "לינאפים משותפים",
    artists: "אמנים משותפים",
  },

  // Time & Dates
  time: {
    now: "כעת",
    today: "היום",
    yesterday: "אתמול",
    tomorrow: "מחר",
    thisWeek: "השבוע",
    lastWeek: "שבוע שעבר",
    thisMonth: "החודש",
    lastMonth: "חודש שעבר",
    thisYear: "השנה",
    lastYear: "שנה שעברה",
    minutes: "דקות",
    hours: "שעות",
    days: "ימים",
    weeks: "שבועות",
    months: "חודשים",
    years: "שנים",
    ago: "לפני",
  },

  // Accessibility
  a11y: {
    skipToContent: "דלג לתוכן",
    openMenu: "פתח תפריט",
    closeMenu: "סגור תפריט",
    toggleMenu: "החלף תפריט",
    expandSection: "הרחב מקטע",
    collapseSection: "כווץ מקטע",
    accessibilityStatement: "הצהרת נגישות",
    cookieConsent: "הסכמה לעוגיות",
    cookieSettings: "הגדרות עוגיות",
    essentialCookies: "עוגיות חיוניות",
    analyticsCookies: "עוגיות אנליטיקה",
    acceptAll: "קבל הכל",
    rejectAll: "דחה הכל",
    customizePreferences: "התאם העדפות",
  },

  accessibility: {
    title: "הצהרת נגישות",
    intro:
      "Ari Stage מחויבת להנגשת השירותים הדיגיטליים שלה לכלל האוכלוסייה, כולל אנשים עם מוגבלויות.",
    compliance: {
      title: "רמת תאימות",
      description:
        "אתר זה עומד בדרישות התקן הישראלי ת״י 5568 (התאמה לנגישות תכנים באינטרנט ברמה AA) ותואם את הנחיות WCAG 2.0 ברמה AA.",
      lastUpdatedLabel: "עדכון אחרון:",
      lastUpdatedText: "פברואר 2026",
      lastUpdatedDateTime: "2026-02",
    },
    features: {
      title: "תכונות נגישות באתר",
      items: [
        {
          icon: "🎹",
          title: "ניווט מקלדת מלא",
          description:
            "כל הפונקציות באתר נגישות באמצעות מקלדת בלבד. השתמש במקש Tab לניווט בין אלמנטים, Enter או רווח להפעלה, ו-Esc לסגירת חלונות.",
        },
        {
          icon: "👁️",
          title: "סמני מיקוד ברורים",
          description:
            "כל האלמנטים האינטראקטיביים מסומנים בבירור כאשר הם במיקוד, כך שמשתמשי מקלדת יכולים לדעת איפה הם נמצאים.",
        },
        {
          icon: "🔊",
          title: "תמיכה בקוראי מסך",
          description:
            "האתר תומך בקוראי מסך מובילים כמו NVDA, JAWS ו-VoiceOver. כל התכנים, הפעולות וההודעות מוכרזות כראוי.",
        },
        {
          icon: "📝",
          title: "תוויות וטפסים נגישים",
          description:
            "כל שדות הטופס מתוייגים בצורה ברורה, הודעות שגיאה מוכרזות מיידית, והוראות למילוי מסופקות לפני כל שדה.",
        },
        {
          icon: "↔️",
          title: "תמיכה ב-RTL ו-LTR",
          description:
            "האתר תומך בעברית (RTL) ובאנגלית (LTR) עם התאמה אוטומטית של כיווניות התצוגה והמבנה.",
        },
        {
          icon: "⏩",
          title: "דילוג לתוכן",
          description:
            "קישור דלג לתוכן הראשי מופיע בתחילת כל עמוד, ומאפשר למשתמשי מקלדת לדלג ישירות לתוכן העיקרי ללא צורך לעבור את התפריט.",
        },
        {
          icon: "🎨",
          title: "ניגודיות צבעים",
          description:
            "כל הצבעים באתר עומדים בדרישות הניגודיות של WCAG 2.0 ברמה AA, ומבטיחים קריאות מירבית.",
        },
        {
          icon: "🍪",
          title: "בקרת עוגיות",
          description:
            "המשתמשים יכולים לבחור האם לאשר או לדחות שימוש בעוגיות, ולשנות את ההעדפה בכל עת דרך הגדרות העוגיות בתחתית העמוד.",
        },
      ],
    },
    technologies: {
      title: "טכנולוגיות נגישות",
      intro: "האתר בנוי עם טכנולוגיות מודרניות התומכות בנגישות:",
      items: [
        "HTML5 סמנטי עם landmarks מוגדרים",
        "ARIA attributes לשיפור חוויית קוראי מסך",
        "Focus management לחלונות וטפסים",
        "Live regions להודעות דינמיות",
        "Keyboard traps במודלים",
      ],
    },
    knownIssues: {
      title: "בעיות ידועות ושיפורים עתידיים",
      description:
        "אנו עובדים באופן מתמיד על שיפור הנגישות של האתר. כרגע אין בעיות נגישות ידועות המונעות שימוש באתר. אם נתקלת בבעיה, נשמח לשמוע ממך.",
    },
    testing: {
      title: "בדיקות נגישות",
      intro: "האתר נבדק עם:",
      items: [
        "קוראי מסך: NVDA, JAWS, VoiceOver",
        "כלי בדיקה אוטומטיים: axe DevTools, WAVE",
        "בדיקות מקלדת מלאה",
        "בדיקות ניגודיות צבעים",
        "בדיקות עם משתמשים עם מוגבלויות",
      ],
    },
    contact: {
      title: "צור קשר",
      intro:
        "אם נתקלת בבעיית נגישות באתר, או אם יש לך הצעות לשיפור, נשמח לשמוע ממך:",
      emailLabel: "אימייל:",
      phoneLabel: "טלפון:",
      responseCommitment:
        "אנו מתחייבים להשיב לכל פנייה תוך 5 ימי עסקים ולטפל בבעיות נגישות בהקדם האפשרי.",
    },
    footer: {
      lastUpdatedPrefix: "הצהרת נגישות זו עודכנה לאחרונה ב-",
      lastUpdatedText: "פברואר 2026",
      lastUpdatedDateTime: "2026-02",
    },
  },
};

export default he;
