import React, { useEffect, useState, useCallback, useMemo } from "react";
import { User, LogOut, Music, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/modules/shared/lib/api.js";
import { useToast } from "@/modules/shared/components/ToastProvider.jsx";
import { useConfirm } from "@/modules/shared/confirm/useConfirm.ts";
import { useAuth } from "@/modules/shared/contexts/AuthContext.tsx";
import SharedArtistsStats from "../components/SharedArtistsStats";
import ArtistCard from "@/modules/shared/components/ArtistCard";

type Artist = {
  id: string;
  avatar?: string;
  full_name?: string;
  artist_role?: string;
  email?: string;
};

type Song = {
  id: number;
  title: string;
  artist: string;
  is_owner?: boolean;
  owner_id?: number;
  user_id?: number;
};

type Lineup = {
  id: number;
  title: string;
  created_by?: number;
  owner_id?: number;
  is_owner?: boolean;
};

export default function MyArtist() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { subscriptionBlocked } = useAuth();
  // הזמנות ממתינות הוסרו
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [lineups, setLineups] = useState<Lineup[]>([]);

  const loadArtists = useCallback(async () => {
    try {
      setArtistsLoading(true);
      const { data: myCollection } = await api.get("/users/my-collection", {
        skipErrorToast: true,
      });
      const artistsList = Array.isArray(myCollection)
        ? myCollection
        : myCollection
        ? [myCollection]
        : [];
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

  const loadSongs = useCallback(async () => {
    try {
      const { data } = await api.get("/songs");
      setSongs(data || []);
    } catch (err) {
      console.error("שגיאה בטעינת שירים:", err);
      setSongs([]);
    }
  }, []);

  const loadLineups = useCallback(async () => {
    try {
      // טעינת הליינאפים שלי
      const { data: myLineups } = await api.get("/lineups");

      // טעינת ליינאפים משותפים (אמנים שהזמינו אותי)
      const { data: sharedLineups } = await api.get("/lineups/shared-with-me");

      // איחוד שני הרשימות
      const allLineups = [...(myLineups || []), ...(sharedLineups || [])];

      setLineups(allLineups);
    } catch (err) {
      console.error("שגיאה בטעינת ליינאפים:", err);
      setLineups([]);
    }
  }, []);

  useEffect(() => {
    loadArtists();
    checkGuestStatus();
    loadSongs();
    loadLineups();
  }, [loadArtists, checkGuestStatus, loadSongs, loadLineups]);

  // חישוב סטטיסטיקות אמנים משותפים
  const sharedStats = useMemo(() => {
    // סינון שירים שאני לא owner שלהם
    const sharedSongs = songs.filter((s) => {
      // בדיקה אם השדה is_owner קיים
      if (s.is_owner === undefined) {
        console.warn("שדה is_owner חסר בשיר:", s);
        return false;
      }
      return s.is_owner === false;
    });

    // סינון ליינאפים שאני לא owner שלהם
    // כעת אנחנו טוענים גם ליינאפים משותפים דרך /lineups/shared-with-me
    // אז כל הליינאפים עם is_owner === false הם משותפים
    const sharedLineups = lineups.filter((l) => {
      // בדיקה אם השדה is_owner קיים
      if (l.is_owner === undefined) {
        console.warn("שדה is_owner חסר בליינאפ:", l);
        return false;
      }
      return l.is_owner === false;
    });

    // ספירת אמנים ייחודיים מתוך owner_id של שירים וליינאפים
    const artistIds = new Set<number>();

    sharedSongs.forEach((s) => {
      const ownerId = s.owner_id || s.user_id;
      if (ownerId) {
        artistIds.add(Number(ownerId));
      } else {
        console.warn("שדה owner_id/user_id חסר בשיר:", s);
      }
    });

    sharedLineups.forEach((l) => {
      const ownerId = l.owner_id || l.created_by;
      if (ownerId) {
        artistIds.add(Number(ownerId));
      } else {
        console.warn("שדה owner_id/created_by חסר בליינאפ:", l);
      }
    });

    return {
      artists: artistIds.size,
      songs: sharedSongs.length,
      lineups: sharedLineups.length,
    };
  }, [songs, lineups]);

  const handleLeaveCollection = async (hostId: string | null = null) => {
    const message = hostId
      ? "בטוח שאתה רוצה לבטל את השתתפותך במאגר הזה? לא תוכל עוד לצפות בליינאפים והשירים של המארח."
      : "בטוח שאתה רוצה לבטל את כל השתתפויותיך במאגרים? לא תוכל עוד לצפות בליינאפים והשירים של המארחים.";
    const ok = await confirm({
      title: "ביטול השתתפות",
      message,
    });
    if (!ok) return;
    try {
      setLeaving(true);
      await api.post("/users/leave-collection", hostId ? { hostId } : {});
      showToast(
        hostId ? "השתתפותך במאגר בוטלה בהצלחה" : "כל השתתפויותיך בוטלו בהצלחה",
        "success"
      );
      loadArtists();
    } catch (err: any) {
      const errorMsg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response?.data?.message
          ? err.response.data.message
          : "שגיאה בביטול ההשתתפות";
      showToast(errorMsg, "error");
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="min-h-screen text-white p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">משותפים</h1>
      </header>

      {/* דאשבורד סטטיסטיקות */}
      <div className="mb-6">
        <SharedArtistsStats stats={sharedStats} />
      </div>

      <div className="space-y-4 bg-neutral-900 mt-8 mb-6 rounded-2xl flex flex-col gap-8 ">
        {/* אמנים שהזמינו אותי למאגר שלהם */}
        <section>
          {artistsLoading ? (
            <div className="text-neutral-400 text-center py-4">
              טוען אמנים...
            </div>
          ) : artists.length === 0 ? (
            <div className="bg-neutral-800 rounded-2xl p-6 text-center">
              <User size={32} className="mx-auto mb-3 text-neutral-600" />
              <p className="text-neutral-400 text-sm">
                אין מאגרים שהוזמנת אליהם כרגע
              </p>
              <p className="text-neutral-500 text-xs mt-1">
                אמנים יופיעו כאן כאשר הם יזמינו אותך למאגר שלהם
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`מעבר לעמוד של ${
                    artist.full_name || "אמן ללא שם"
                  }`}
                  onClick={() => {
                    if (subscriptionBlocked) {
                      window.openUpgradeModal?.();
                      return;
                    }
                    navigate(`/artist/${artist.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      if (subscriptionBlocked) {
                        e.preventDefault();
                        window.openUpgradeModal?.();
                        return;
                      }
                      navigate(`/artist/${artist.id}`);
                    }
                  }}
                  // No visual/layout classes here. ArtistCard handles all visuals.
                >
                  <ArtistCard
                    artist={artist}
                    onUninvite={(e: React.MouseEvent) => {
                      if (e) e.stopPropagation();
                      handleLeaveCollection(artist.id);
                    }}
                    disableActions={leaving}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {/* ...existing code... */}
    </div>
  );
}
