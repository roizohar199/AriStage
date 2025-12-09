import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User, Music, LogOut, Check, X } from "lucide-react";
import api from "@/modules/shared/lib/api.js";
import { useConfirm } from "@/modules/shared/hooks/useConfirm.jsx";
import { useToast } from "@/modules/shared/components/ToastProvider.jsx";
import { io } from "socket.io-client";

export default function Artists() {
  const navigate = useNavigate();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const { showToast } = useToast();
  
  const [artists, setArtists] = useState([]);
  const [pendingInvitation, setPendingInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Socket.IO connection
  const socket = useMemo(() => {
    const url = import.meta.env.VITE_API_URL || "http://localhost:5000";
    return io(url, {
      withCredentials: true,
      // לא מגדירים transports – Socket.IO מנהל לבד polling → websocket
    });
  }, []);

  useEffect(() => {
    loadArtists();
    
    // הצטרפות ל-rooms של Socket.IO
    const user = JSON.parse(localStorage.getItem("ari_user") || "{}");
    if (user?.id) {
      socket.emit("join-user", user.id);
    }
    
    // Socket.IO listeners לעדכונים בזמן אמת
    socket.on("user:invitation-accepted", () => {
      loadArtists(); // רענון רשימת האמנים
      // עדכון מיידי - הסרת ההזמנה הממתינה
      setPendingInvitation(null);
    });
    
    socket.on("user:invitation-rejected", () => {
      loadArtists(); // רענון רשימת האמנים
      // עדכון מיידי - הסרת ההזמנה הממתינה
      setPendingInvitation(null);
    });
    
    socket.on("user:left-collection", () => {
      loadArtists(); // רענון רשימת האמנים
    });
    
    // האזנה לעדכוני הזמנות חדשות
    socket.on("invitation:pending", () => {
      loadArtists(); // רענון רשימת האמנים
    });
    
    return () => {
      socket.off("user:invitation-accepted");
      socket.off("user:invitation-rejected");
      socket.off("user:left-collection");
      socket.off("invitation:pending");
      socket.disconnect();
    };
  }, [socket]);

  const loadArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // טוען את המארחים שהזמינו אותי (מאגר אמנים) - רק אם ההזמנה אושרה
      const { data: myCollection } = await api.get("/users/my-collection", {
        skipErrorToast: true,
      });
      
      // טוען הזמנות ממתינות לאישור
      const { data: pending } = await api.get("/users/pending-invitation", {
        skipErrorToast: true,
      });
      
      // myCollection עכשיו מחזיר רשימה של מארחים
      const artistsList = Array.isArray(myCollection) ? myCollection : (myCollection ? [myCollection] : []);
      
      setArtists(artistsList);
      // pending עכשיו מחזיר רשימה של הזמנות ממתינות
      setPendingInvitation(Array.isArray(pending) && pending.length > 0 ? pending[0] : null);
    } catch (err) {
      console.error("שגיאה בטעינת אמנים:", err);
      setError("לא ניתן לטעון את רשימת האמנים");
    } finally {
      setLoading(false);
    }
  };

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

  const handleAcceptInvitation = async (hostId) => {
    const ok = await confirm(
      "אישור הזמנה",
      "בטוח שאתה רוצה לאשר את ההזמנה? תוכל לצפות בליינאפים והשירים של המארח."
    );
    if (!ok) return;

    try {
      setProcessing(true);
      await api.post("/users/accept-invitation", { hostId });
      showToast("הזמנה אושרה בהצלחה", "success");
      // עדכון מיידי - הסרת ההזמנה הממתינה
      setPendingInvitation(null);
      // עדכון מיידי של BottomNav דרך custom event
      window.dispatchEvent(new CustomEvent("pending-invitations-updated"));
      // רענון רשימת האמנים (יכול לקחת קצת זמן)
      loadArtists();
    } catch (err) {
      console.error("❌ שגיאה באישור הזמנה:", err);
      const errorMsg = err?.response?.data?.message || "שגיאה באישור ההזמנה";
      showToast(errorMsg, "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectInvitation = async (hostId) => {
    const ok = await confirm(
      "דחיית הזמנה",
      "בטוח שאתה רוצה לדחות את ההזמנה? לא תוכל לצפות בליינאפים והשירים של המארח."
    );
    if (!ok) return;

    try {
      setProcessing(true);
      await api.post("/users/reject-invitation", { hostId });
      showToast("הזמנה נדחתה", "success");
      // עדכון מיידי - הסרת ההזמנה הממתינה
      setPendingInvitation(null);
      // עדכון מיידי של BottomNav דרך custom event
      window.dispatchEvent(new CustomEvent("pending-invitations-updated"));
      // רענון רשימת האמנים
      loadArtists();
    } catch (err) {
      console.error("❌ שגיאה בדחיית הזמנה:", err);
      const errorMsg = err?.response?.data?.message || "שגיאה בדחיית ההזמנה";
      showToast(errorMsg, "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen text-white pb-20">
      <ConfirmModalComponent />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* כותרת */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-orange mb-2">
            אמנים במאגר שלי
          </h1>
          <p className="text-neutral-400 text-sm">
            רשימת האמנים שאתה מחובר למאגר שלהם
          </p>
        </div>

        {/* טעינה */}
        {loading && (
          <div className="bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-800">
            <div className="text-neutral-400">טוען אמנים...</div>
          </div>
        )}

        {/* שגיאה */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-6 text-center">
            <div className="text-red-400">{error}</div>
          </div>
        )}

        {/* הזמנות ממתינות לאישור */}
        {!loading && !error && pendingInvitation && (
          <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-2xl p-6 mb-4">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              <div className="flex-shrink-0">
                {pendingInvitation.avatar ? (
                  <img
                    src={pendingInvitation.avatar}
                    alt={pendingInvitation.full_name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-yellow-500 shadow-lg"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-yellow-500 flex items-center justify-center"
                  style={{
                    display: pendingInvitation.avatar ? "none" : "flex",
                  }}
                >
                  <User size={32} className="text-neutral-500" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-yellow-400 mb-2">
                  הזמנה חדשה למאגר
                </h3>
                <p className="text-neutral-300 mb-1">
                  <strong>{pendingInvitation.full_name || "אמן"}</strong> מזמין אותך להצטרף למאגר שלו
                </p>
                {pendingInvitation.artist_role && (
                  <p className="text-neutral-400 text-sm mb-3">
                    תפקיד: {pendingInvitation.artist_role}
                  </p>
                )}
                <p className="text-neutral-400 text-sm">
                  לאחר האישור, תוכל לצפות בליינאפים והשירים שלו
                </p>
              </div>
              
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={() => handleAcceptInvitation(pendingInvitation.id)}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
                >
                  <Check size={18} />
                  {processing ? "מעבד..." : "אשר"}
                </button>
                <button
                  onClick={() => handleRejectInvitation(pendingInvitation.id)}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
                >
                  <X size={18} />
                  {processing ? "מעבד..." : "דחה"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* רשימת אמנים */}
        {!loading && !error && (
          <>
            {artists.length === 0 && !pendingInvitation ? (
              <div className="bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-800">
                <Music size={48} className="mx-auto mb-4 text-neutral-600" />
                <p className="text-neutral-400 text-lg">
                  אין אמנים במאגר שלך כרגע
                </p>
                <p className="text-neutral-500 text-sm mt-2">
                  אמנים יופיעו כאן כאשר הם יזמינו אותך למאגר שלהם
                </p>
              </div>
            ) : artists.length > 0 && (
              <div className="space-y-4">
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="bg-neutral-900 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center shadow-lg hover:shadow-xl transition border border-neutral-800"
                  >
                    {/* תמונת פרופיל */}
                    <div className="flex-shrink-0">
                      {artist.avatar ? (
                        <img
                          src={artist.avatar}
                          alt={artist.full_name}
                          className="w-24 h-24 rounded-full object-cover border-2 border-brand-orange shadow-lg"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-brand-orange flex items-center justify-center"
                        style={{
                          display: artist.avatar ? "none" : "flex",
                        }}
                      >
                        <User size={40} className="text-neutral-500" />
                      </div>
                    </div>

                    {/* פרטי האמן */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => navigate(`/artist/${artist.id}`)}
                        className="text-2xl font-bold text-white mb-2 hover:text-brand-orange transition cursor-pointer text-right"
                      >
                        {artist.full_name || "אמן ללא שם"}
                      </button>

                      {/* תיאור תפקיד */}
                      {artist.artist_role && (
                        <div className="mb-3">
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-orange rounded-lg text-black font-semibold text-sm">
                            <Music size={16} />
                            {artist.artist_role}
                          </span>
                        </div>
                      )}

                      {/* פרטים נוספים */}
                      <div className="flex flex-wrap gap-3 mt-3 text-sm">
                        {artist.email && (
                          <span className="text-neutral-400">
                            {artist.email}
                          </span>
                        )}
                        {artist.role && (
                          <span className="px-2 py-1 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-300">
                            {artist.role}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* כפתור ביטול השתתפות */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => handleLeaveCollection(artist.id)}
                        disabled={leaving}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
                      >
                        <LogOut size={18} />
                        {leaving ? "מבטל..." : "בטל השתתפות"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

