import React, { useEffect, useState } from "react";
import { User, Music } from "lucide-react";
import api from "@/modules/shared/lib/api.js";

export default function Artists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // טוען את האמן שהזמין אותי (מאגר אמנים)
      const { data: myCollection } = await api.get("/users/my-collection", {
        skipErrorToast: true,
      });
      
      // אם יש אמן שהזמין אותי, נוסיף אותו לרשימה
      const artistsList = [];
      if (myCollection) {
        artistsList.push(myCollection);
      }
      
      setArtists(artistsList);
    } catch (err) {
      console.error("שגיאה בטעינת אמנים:", err);
      setError("לא ניתן לטעון את רשימת האמנים");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen text-white pb-20">
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

        {/* רשימת אמנים */}
        {!loading && !error && (
          <>
            {artists.length === 0 ? (
              <div className="bg-neutral-900 rounded-2xl p-8 text-center border border-neutral-800">
                <Music size={48} className="mx-auto mb-4 text-neutral-600" />
                <p className="text-neutral-400 text-lg">
                  אין אמנים במאגר שלך כרגע
                </p>
                <p className="text-neutral-500 text-sm mt-2">
                  אמנים יופיעו כאן כאשר הם יזמינו אותך למאגר שלהם
                </p>
              </div>
            ) : (
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
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {artist.full_name || "אמן ללא שם"}
                      </h2>

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

