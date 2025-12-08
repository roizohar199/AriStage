import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Music, Users, CalendarCheck, ShieldCheck, User, UserPlus, X, Search, UserX, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/modules/shared/lib/api.js"; // 👈 חשוב! משתמשים ב־axios של המערכת
import { useConfirm } from "@/modules/shared/hooks/useConfirm.jsx";
import { useToast } from "@/modules/shared/components/ToastProvider.jsx";
import { io } from "socket.io-client";

// ======================================================
// 🧩 קומפוננטה: DashboardStats
// ======================================================
function DashboardStats({ stats, role }) {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-brand-orange mb-4 text-center">
        {role === "admin" ? "נתוני מערכת כוללת" : "הנתונים האישיים שלך"}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {/* שירים */}
        <div className="flex flex-col items-center">
          <Music size={32} className="text-brand-orange mb-2" />
          <span className="text-2xl font-bold">{stats.songs}</span>
          <span className="text-sm text-neutral-300">
            שירים {role === "admin" ? "במערכת" : "שלך"}
          </span>
        </div>

        {/* ליינאפים */}
        <div className="flex flex-col items-center">
          <CalendarCheck size={32} className="text-brand-orange mb-2" />
          <span className="text-2xl font-bold">{stats.lineups}</span>
          <span className="text-sm text-neutral-300">
            ליינאפים {role === "admin" ? "במערכת" : "שיצרת"}
          </span>
        </div>

        {/* נתוני אדמין */}
        {role === "admin" && (
          <>
            <div className="flex flex-col items-center">
              <Users size={32} className="text-brand-orange mb-2" />
              <span className="text-2xl font-bold">{stats.users}</span>
              <span className="text-sm text-neutral-300">משתמשים בארגון</span>
            </div>

            <div className="flex flex-col items-center">
              <ShieldCheck size={32} className="text-brand-orange mb-2" />
              <span className="text-2xl font-bold">{stats.activeAdmins}</span>
              <span className="text-sm text-neutral-300">מנהלים פעילים</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ======================================================
// 🏠 קומפוננטה ראשית: Home
// ======================================================
export default function Home() {
  const navigate = useNavigate();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [artists, setArtists] = useState([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [myInvitedArtists, setMyInvitedArtists] = useState([]);
  const [myInvitedArtistsLoading, setMyInvitedArtistsLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState([]);

  // Socket.IO connection
  const socket = useMemo(() => {
    const url = import.meta.env.VITE_API_URL || "http://10.0.0.99:5000";
    return io(url, { transports: ["websocket"] });
  }, []);

  // פונקציות טעינה - מוגדרות מחוץ ל-useEffect כדי שיהיו נגישות
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/dashboard-stats", {
        skipErrorToast: true,
      });
      setStats(data.stats);
      setRole(data.role);
    } catch (err) {
      console.error(err);
      setError("לא ניתן לטעון נתונים");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadArtists = useCallback(async () => {
    try {
      setArtistsLoading(true);
      const { data: myCollection } = await api.get("/users/my-collection", {
        skipErrorToast: true,
      });
      
      // myCollection עכשיו מחזיר רשימה של מארחים
      const artistsList = Array.isArray(myCollection) ? myCollection : (myCollection ? [myCollection] : []);
      
      setArtists(artistsList);
    } catch (err) {
      console.error("שגיאה בטעינת אמנים:", err);
    } finally {
      setArtistsLoading(false);
    }
  }, []);

  const checkGuestStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/users/check-guest", {
        skipErrorToast: true,
      });
      setIsGuest(data.isGuest);
    } catch (err) {
      console.error("שגיאה בבדיקת סטטוס אורח:", err);
    }
  }, []);

  const loadMyInvitedArtists = useCallback(async () => {
    try {
      setMyInvitedArtistsLoading(true);
      const { data } = await api.get("/users/connected-to-me", {
        skipErrorToast: true,
      });
      setMyInvitedArtists(data || []);
    } catch (err) {
      console.error("שגיאה בטעינת אמנים שהזמנתי:", err);
    } finally {
      setMyInvitedArtistsLoading(false);
    }
  }, []);

  const loadPendingInvitations = useCallback(async () => {
    try {
      const { data } = await api.get("/users/pending-invitation", {
        skipErrorToast: true,
      });
      setPendingInvitations(Array.isArray(data) ? data : []);
    } catch (err) {
      // שקט - לא להציג שגיאה אם אין הרשאה
      setPendingInvitations([]);
    }
  }, []);

  // טעינה ראשונית והגדרת Socket.IO
  useEffect(() => {
    load();
    loadArtists();
    checkGuestStatus();
    loadMyInvitedArtists();
    loadPendingInvitations();
    
    // הצטרפות ל-rooms של Socket.IO
    const user = JSON.parse(localStorage.getItem("ari_user") || "{}");
    if (user?.id) {
      socket.emit("join-user", user.id);
      socket.emit("join-user-updates", user.id);
      
      // בדיקה אם המשתמש הוא מארח
      api.get("/users/check-guest", { skipErrorToast: true })
        .then(({ data }) => {
          if (data.isHost) {
            socket.emit("join-host", user.id);
          }
        })
        .catch(() => {});
    }
    
    // Socket.IO listeners
    socket.on("user:invited", () => {
      loadMyInvitedArtists(); // רענון רשימת אמנים
      load(); // רענון סטטיסטיקות
    });
    
    socket.on("user:uninvited", () => {
      loadMyInvitedArtists(); // רענון רשימת אמנים
      load(); // רענון סטטיסטיקות
    });
    
    // רענון סטטיסטיקות כאשר יש שינויים בשירים או ליינאפים
    socket.on("song:created", () => {
      load(); // רענון סטטיסטיקות
    });
    
    socket.on("song:deleted", () => {
      load(); // רענון סטטיסטיקות
    });
    
    socket.on("lineup:created", () => {
      load(); // רענון סטטיסטיקות
    });
    
    socket.on("lineup:deleted", () => {
      load(); // רענון סטטיסטיקות
    });
    
    socket.on("invitation:pending", () => {
      loadPendingInvitations(); // רענון הזמנות ממתינות
    });
    
    socket.on("user:invitation-accepted", () => {
      loadPendingInvitations(); // רענון הזמנות ממתינות
      loadArtists(); // רענון רשימת האמנים
    });
    
    socket.on("user:invitation-rejected", () => {
      loadPendingInvitations(); // רענון הזמנות ממתינות
    });
    
    // האזנה ל-custom events לעדכון אוטומטי אחרי כל פעולה
    const handleDataRefresh = (event) => {
      const { type, action } = event.detail || {};
      // רענון סטטיסטיקות אחרי כל פעולה
      load();
      
      // רענון ספציפי לפי סוג הפעולה
      if (type === "song") {
        // שירים - רק סטטיסטיקות
      } else if (type === "lineup") {
        // ליינאפים - רק סטטיסטיקות
      } else if (type === "lineup-song") {
        // שירים בליינאפ - רק סטטיסטיקות
      }
    };
    
    window.addEventListener("data-refresh", handleDataRefresh);
    
    return () => {
      socket.off("user:invited");
      socket.off("user:uninvited");
      socket.off("song:created");
      socket.off("song:deleted");
      socket.off("lineup:created");
      socket.off("lineup:deleted");
      socket.off("invitation:pending");
      socket.off("user:invitation-accepted");
      socket.off("user:invitation-rejected");
      window.removeEventListener("data-refresh", handleDataRefresh);
      // לא מנתקים את ה-socket כאן כי הוא משותף
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]); // הפונקציות מוגדרות עם useCallback אז הן יציבות

  const handleLeaveCollection = async (hostId = null) => {
    const message = hostId 
      ? "בטוח שאתה רוצה לבטל את השתתפותך במאגר הזה? לא תוכל עוד לצפות בליינאפים והשירים של המארח."
      : "בטוח שאתה רוצה לבטל את כל השתתפויותיך במאגרים? לא תוכל עוד לצפות בליינאפים והשירים של המארחים.";
    const ok = await confirm(
      "ביטול השתתפות במאגר",
      message
    );
    if (!ok) return;

    try {
      setLeaving(true);
      await api.post("/users/leave-collection", hostId ? { hostId } : {});
      showToast(hostId ? "השתתפותך במאגר בוטלה בהצלחה" : "כל השתתפויותיך בוטלו בהצלחה", "success");
      loadArtists(); // רענון רשימת האמנים
    } catch (err) {
      console.error("❌ שגיאה בביטול השתתפות:", err);
      const errorMsg = err?.response?.data?.message || "שגיאה בביטול ההשתתפות";
      showToast(errorMsg, "error");
    } finally {
      setLeaving(false);
    }
  };

  const uninviteArtist = async (artistId, artistName) => {
    const ok = await confirm(
      "ביטול שיתוף מאגר",
      `לבטל את השיתוף עם ${artistName}? האמן לא יוכל עוד לצפות בליינאפים והשירים שלך.`
    );
    if (!ok) return;

    try {
      setInviteLoading(true);
      await api.post("/users/uninvite-artist", { artist_id: artistId });
      showToast("השיתוף בוטל בהצלחה", "success");
      loadMyInvitedArtists(); // רענון רשימת האמנים
    } catch (err) {
      console.error("❌ שגיאה בביטול שיתוף:", err);
      const errorMsg = err?.response?.data?.message || "שגיאה בביטול השיתוף";
      showToast(errorMsg, "error");
    } finally {
      setInviteLoading(false);
    }
  };

  const sendInvitation = async (e) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteEmail.includes("@")) {
      alert("נא להזין כתובת אימייל תקינה");
      return;
    }

    try {
      setInviteLoading(true);
      const { data } = await api.post("/users/send-invitation", {
        email: inviteEmail,
      });
      
      alert(data.message || "הזמנה נשלחה בהצלחה!");
      setInviteEmail("");
      setShowInviteModal(false);
      loadArtists();
      loadMyInvitedArtists();
    } catch (err) {
      console.error("❌ שגיאה בשליחת הזמנה:", err);
      const errorMsg = err?.response?.data?.message || "שגיאה בשליחת ההזמנה";
      alert(errorMsg);
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen text-white flex flex-col items-center pb-20"
    >
      <ConfirmModalComponent />
      
      {/* התראה על הזמנות ממתינות */}
      {pendingInvitations.length > 0 && (
        <div className="w-[90%] max-w-2xl mt-16 mb-4">
          <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-xl p-4 text-right">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-400 mb-1">
                  יש לך {pendingInvitations.length} הזמנה{pendingInvitations.length > 1 ? "ות" : ""} ממתינות לאישור
                </h3>
                <p className="text-neutral-300 text-sm">
                  {pendingInvitations[0]?.full_name || "משתמש"} מזמין אותך להצטרף למאגר שלו
                </p>
              </div>
              <button
                onClick={() => navigate("/artists")}
                className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2 rounded-lg transition-all whitespace-nowrap"
              >
                צפה והאשר
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* כותרת */}
      <h1 className={`text-3xl font-bold text-brand-orange ${pendingInvitations.length > 0 ? 'mt-4' : 'mt-16'} mb-2 drop-shadow-[0_0_10px_rgba(255,136,0,0.3)] text-center`}>
        ברוך הבא ל־Ari Stage
      </h1>

      <p className="text-neutral-400 text-sm mb-2 text-center">
        {role === "admin"
          ? "מערכת הניהול שלך להפקות, משתמשים וליינאפים."
          : "הכלי שלך לניהול השירים והליינאפים שלך."}
      </p>

      {/* כרטיס מרכזי */}
      <div className="bg-neutral-900 w-[90%] max-w-2xl p-8 rounded-2xl border border-neutral-800 backdrop-blur-xl shadow-xl text-center">
        <div className="bg-neutral-800 border border-brand-orange rounded-xl shadow-lg mx-auto max-w-xl p-4 text-right">
          <h3 className="text-lg font-semibold text-brand-orange mb-2">
            למה לבחור ב־Ari Stage?
          </h3>

          <ul className="list-disc list-inside text-neutral-300 text-sm">
            <li>ניהול הופעות, שירים וליינאפים במקום אחד.</li>
            <li>שיתוף פעולה קל עם צוותים ומנהלים.</li>
            <li>גישה לסטטיסטיקות מתקדמות לשיפור תהליכי עבודה.</li>
            <li>מערכת מאובטחת ונוחה לשימוש מכל מכשיר.</li>
            <li>מתאים לאמנים, מנהלים ומפיקים בכל הרמות.</li>
          </ul>
        </div>

        {/* טעינה */}
        {loading && (
          <div className="glass w-full mt-8 p-6 rounded-2xl text-center text-neutral-400">
            טוען נתונים...
          </div>
        )}

        {/* שגיאה */}
        {error && (
          <div className="glass w-full mt-8 p-6 rounded-2xl text-center text-red-400">
            {error}
          </div>
        )}

        {/* סטטיסטיקות */}
        {stats && <DashboardStats stats={stats} role={role} />}

        {/* המאגרים שלי - אמנים שהזמנתי */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-brand-orange text-center flex-1">
              המאגרים שלי
            </h2>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              title="הזמן אמן למאגר שלך"
            >
              <UserPlus size={18} />
              הזמן אמן
            </button>
          </div>

          <p className="text-neutral-400 text-sm mb-4 text-center">
            אמנים שהזמנתי למאגר שלי - הם יכולים לצפות בליינאפים והשירים שלי
          </p>

          {myInvitedArtistsLoading ? (
            <div className="text-neutral-400 text-center py-4">
              טוען אמנים...
            </div>
          ) : myInvitedArtists.length === 0 ? (
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 text-center">
              <User size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">
                אין אמנים במאגר שלך כרגע
              </p>
              <p className="text-neutral-500 text-xs mt-1">
                הזמן אמנים למאגר שלך באמצעות הכפתור למעלה
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myInvitedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                >
                  {/* תמונת פרופיל */}
                  <div className="flex-shrink-0">
                    {artist.avatar ? (
                      <img
                        src={artist.avatar}
                        alt={artist.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-brand-orange"
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="w-16 h-16 rounded-full bg-neutral-700 border-2 border-brand-orange flex items-center justify-center"
                      style={{
                        display: artist.avatar ? "none" : "flex",
                      }}
                    >
                      <User size={24} className="text-neutral-500" />
                    </div>
                  </div>

                  {/* פרטי האמן */}
                  <div className="flex-1 min-w-0 text-right">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {artist.full_name || "אמן ללא שם"}
                    </h3>

                    {/* תיאור תפקיד */}
                    {artist.artist_role && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-orange rounded-lg text-black font-semibold text-xs">
                          <Music size={12} />
                          {artist.artist_role}
                        </span>
                      </div>
                    )}

                    {/* פרטים נוספים */}
                    {artist.email && (
                      <p className="text-neutral-400 text-xs">{artist.email}</p>
                    )}
                  </div>

                  {/* כפתור ביטול שיתוף */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => uninviteArtist(artist.id, artist.full_name || "האמן")}
                      disabled={inviteLoading}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-all"
                      title="בטל שיתוף מאגר"
                    >
                      <UserX size={16} />
                      ביטול שיתוף
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* מאגרים שהוזמנתי אליהם - אמנים שהזמינו אותי */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-brand-orange mb-4 text-center">
            מאגרים שהוזמנתי אליהם
          </h2>

          <p className="text-neutral-400 text-sm mb-4 text-center">
            אמנים שהזמינו אותי למאגר שלהם - אני יכול לצפות בליינאפים והשירים שלהם
          </p>

          {artistsLoading ? (
            <div className="text-neutral-400 text-center py-4">
              טוען אמנים...
            </div>
          ) : artists.length === 0 ? (
            <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 text-center">
              <User size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">
                אין מאגרים שהוזמנת אליהם כרגע
              </p>
              <p className="text-neutral-500 text-xs mt-1">
                אמנים יופיעו כאן כאשר הם יזמינו אותך למאגר שלהם
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                >
                  {/* תמונת פרופיל */}
                  <div className="flex-shrink-0">
                    {artist.avatar ? (
                      <img
                        src={artist.avatar}
                        alt={artist.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-brand-orange"
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className="w-16 h-16 rounded-full bg-neutral-700 border-2 border-brand-orange flex items-center justify-center"
                      style={{
                        display: artist.avatar ? "none" : "flex",
                      }}
                    >
                      <User size={24} className="text-neutral-500" />
                    </div>
                  </div>

                  {/* פרטי האמן */}
                  <div className="flex-1 min-w-0 text-right">
                    {isGuest ? (
                      <button
                        onClick={() => navigate(`/artist/${artist.id}`)}
                        className="text-lg font-bold text-white mb-1 hover:text-brand-orange transition cursor-pointer text-right"
                      >
                        {artist.full_name || "אמן ללא שם"}
                      </button>
                    ) : (
                      <h3 className="text-lg font-bold text-white mb-1">
                        {artist.full_name || "אמן ללא שם"}
                      </h3>
                    )}

                    {/* תיאור תפקיד */}
                    {artist.artist_role && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-orange rounded-lg text-black font-semibold text-xs">
                          <Music size={12} />
                          {artist.artist_role}
                        </span>
                      </div>
                    )}

                    {/* פרטים נוספים */}
                    {artist.email && (
                      <p className="text-neutral-400 text-xs">{artist.email}</p>
                    )}
                  </div>

                  {/* כפתור ביטול השתתפות */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleLeaveCollection(artist.id)}
                      disabled={leaving}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all text-sm"
                    >
                      <LogOut size={16} />
                      {leaving ? "מבטל..." : "בטל השתתפות"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* פוטר */}
        <p className="text-neutral-600 text-xs mt-10 mb-2">
          © {new Date().getFullYear()} Ari Stage. כל הזכויות שמורות.
        </p>
      </div>

      {/* מודאל הזמנת אמן */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl w-full max-w-md p-6 relative shadow-xl border border-neutral-800">
            <button
              onClick={() => {
                setShowInviteModal(false);
                setInviteEmail("");
              }}
              className="absolute top-3 left-3 text-neutral-400 hover:text-white"
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-bold mb-4 text-center">
              הזמן אמן למאגר שלך
            </h2>

            <p className="text-neutral-400 text-sm mb-4 text-center">
              הזן את כתובת האימייל של האמן. הוא יקבל מייל עם קישור להצטרפות למאגר שלך.
            </p>

            <form onSubmit={sendInvitation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  כתובת אימייל
                </label>
                <input
                  type="email"
                  placeholder="artist@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-xl bg-neutral-800 border border-neutral-700 p-3 text-sm placeholder-neutral-500 focus:border-brand-orange focus:outline-none"
                  dir="ltr"
                  required
                  disabled={inviteLoading}
                />
              </div>

              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-lg flex items-center justify-center gap-2"
              >
                {inviteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    שולח...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    שלח הזמנה
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
