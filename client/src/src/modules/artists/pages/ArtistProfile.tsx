import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, Music, ListMusic, ArrowLeft, CalendarDays, MapPin, Clock } from "lucide-react";
import api from "@/modules/shared/lib/api.js";

export default function ArtistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // טעינת פרטי המארחים
      const { data: myCollection } = await api.get("/users/my-collection", {
        skipErrorToast: true,
      });

      // myCollection מחזיר רשימה של מארחים
      const hostsList = Array.isArray(myCollection) ? myCollection : (myCollection ? [myCollection] : []);

      if (hostsList.length === 0) {
        setError("אין לך גישה לפרופיל זה - לא אישרת הצטרפות למאגר");
        return;
      }

      // אם יש id ב-URL, מצא את המארח המתאים
      let selectedHost = null;
      if (id) {
        selectedHost = hostsList.find((host) => host.id === Number(id));
        if (!selectedHost) {
          setError("אין לך גישה לפרופיל זה - המארח לא נמצא ברשימת המארחים שלך");
          return;
        }
      } else {
        // אם אין id, קח את המארח הראשון
        selectedHost = hostsList[0];
      }

      setArtist(selectedHost);

      // טעינת ליינאפים של המארח (לא של המשתמש הנוכחי)
      const { data: lineupsData } = await api.get(`/lineups/by-user/${selectedHost.id}`, {
        skipErrorToast: true,
      });
      setLineups(lineupsData || []);
    } catch (err) {
      console.error("שגיאה בטעינת נתונים:", err);
      setError("לא ניתן לטעון את הנתונים");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "לא צוין תאריך";
    return new Date(date).toLocaleDateString("he-IL");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-400">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white p-4">
        <div className="bg-neutral-900 rounded-2xl p-8 border border-neutral-800 text-center max-w-md">
          <div className="text-red-400 text-xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">שגיאה</h2>
          <p className="text-neutral-400 mb-6">{error || "אמן לא נמצא"}</p>
          <button
            onClick={() => navigate("/home")}
            className="bg-brand-orange hover:bg-brand-orangeLight text-black font-semibold px-6 py-3 rounded-lg"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen text-white pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* כפתור חזרה */}
        <button
          onClick={() => navigate("/home")}
          className="mb-6 bg-neutral-900 hover:bg-neutral-800 p-2 rounded-full"
        >
          <ArrowLeft size={20} />
        </button>

        {/* כותרת */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* תמונת פרופיל */}
            <div className="flex-shrink-0">
              {artist.avatar ? (
                <img
                  src={artist.avatar}
                  alt={artist.full_name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-brand-orange shadow-lg"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <div
                className="w-32 h-32 rounded-full bg-neutral-800 border-4 border-brand-orange flex items-center justify-center"
                style={{
                  display: artist.avatar ? "none" : "flex",
                }}
              >
                <User size={48} className="text-neutral-500" />
              </div>
            </div>

            {/* פרטי האמן */}
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-bold text-white mb-3">
                {artist.full_name || "אמן ללא שם"}
              </h1>

              {artist.artist_role && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange rounded-lg text-black font-semibold text-base">
                    <Music size={18} />
                    {artist.artist_role}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-3 mt-4 text-sm">
                {artist.email && (
                  <span className="text-neutral-400">{artist.email}</span>
                )}
                {artist.role && (
                  <span className="px-3 py-1 bg-neutral-800 rounded-lg border border-neutral-700 text-neutral-300">
                    {artist.role}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* הודעה - מצב צפייה בלבד */}
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-xl p-4 mb-6">
          <p className="text-blue-300 text-sm text-center">
            אתה במצב צפייה בלבד - אין אפשרות לערוך או למחוק
          </p>
        </div>

        {/* ליינאפים */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-brand-orange mb-4 flex items-center gap-2">
            <ListMusic size={24} />
            ליינאפים ({lineups.length})
          </h2>

          {lineups.length === 0 ? (
            <div className="bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-800">
              <ListMusic size={48} className="mx-auto mb-4 text-neutral-600" />
              <p className="text-neutral-400">אין ליינאפים זמינים</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lineups.map((lineup) => (
                <div
                  key={lineup.id}
                  onClick={() => navigate(`/lineup/${lineup.id}`)}
                  className="bg-neutral-900 rounded-2xl p-6 cursor-pointer hover:bg-neutral-800 transition border border-neutral-800"
                >
                  <h3 className="text-xl font-bold text-white mb-3">
                    {lineup.title}
                  </h3>

                  <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
                    {lineup.date && (
                      <span className="flex items-center gap-2">
                        <CalendarDays size={16} />
                        {formatDate(lineup.date)}
                      </span>
                    )}
                    {lineup.time && (
                      <span className="flex items-center gap-2">
                        <Clock size={16} />
                        {lineup.time}
                      </span>
                    )}
                    {lineup.location && (
                      <span className="flex items-center gap-2">
                        <MapPin size={16} />
                        {lineup.location}
                      </span>
                    )}
                  </div>

                  {lineup.description && (
                    <p className="text-neutral-300 mt-3 text-sm">
                      {lineup.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

