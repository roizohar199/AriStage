/**
 * Examples for applying useGuardAction to existing components
 * Copy these patterns to protect actions in your app
 */

import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useGuardAction } from "@/modules/shared/hooks/useGuardAction";
import { Input } from "@/modules/shared/components/FormControls";
import api from "@/modules/shared/lib/api";

// ============================================
// Example 1: Simple Add/Create Button
// ============================================
function AddSongButton() {
  const guardAction = useGuardAction();

  const handleAddSong = guardAction(async () => {
    const newSong = {
      title: "New Song",
      artist: "Artist Name",
    };
    await api.post("/songs", newSong);
  });

  return (
    <button onClick={handleAddSong} className="btn-primary">
      + Add Song
    </button>
  );
}

// ============================================
// Example 2: Edit with Parameters
// ============================================
function EditLineupButton({ lineupId }: { lineupId: number }) {
  const guardAction = useGuardAction();

  const handleEdit = guardAction(
    async (id: number) => {
      // Your edit logic
      await api.put(`/lineups/${id}`, { name: "Updated Name" });
    },
    {
      message: "עריכת ליינאפ זמינה רק עם מנוי פעיל",
    },
  );

  return <button onClick={() => handleEdit(lineupId)}>Edit</button>;
}

// ============================================
// Example 3: Delete with Confirmation
// ============================================
function DeleteSongButton({ songId }: { songId: number }) {
  const guardAction = useGuardAction();

  const handleDelete = guardAction(
    async (id: number) => {
      if (!confirm("Are you sure?")) return;
      await api.delete(`/songs/${id}`);
    },
    {
      message: "מחיקת שיר זמינה רק עם מנוי פעיל",
    },
  );

  return (
    <button onClick={() => handleDelete(songId)} className="btn-danger">
      Delete
    </button>
  );
}

// ============================================
// Example 4: File Upload
// ============================================
function UploadChartButton({ songId }: { songId: number }) {
  const guardAction = useGuardAction();

  const handleUpload = guardAction(
    async (file: File) => {
      const formData = new FormData();
      formData.append("chart", file);
      formData.append("songId", String(songId));
      await api.post("/songs/upload-chart", formData);
    },
    {
      message: "העלאת תווים זמינה רק עם מנוי פעיל",
    },
  );

  return (
    <input
      type="file"
      accept=".pdf"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }}
    />
  );
}

// ============================================
// Example 5: Form Submit
// ============================================
function CreateLineupForm() {
  const guardAction = useGuardAction();
  const [name, setName] = useState("");

  const handleSubmit = guardAction(
    async (e: FormEvent) => {
      e.preventDefault();
      await api.post("/lineups", { name });
      setName("");
    },
    {
      message: "יצירת ליינאפ זמינה רק עם מנוי פעיל",
    },
  );

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-0"
      />
      <button type="submit">Create Lineup</button>
    </form>
  );
}

// ============================================
// Example 6: Bulk Actions
// ============================================
function BulkDeleteButton({ selectedIds }: { selectedIds: number[] }) {
  const guardAction = useGuardAction();

  const handleBulkDelete = guardAction(
    async (ids: number[]) => {
      if (!confirm(`Delete ${ids.length} items?`)) return;
      await Promise.all(ids.map((id) => api.delete(`/songs/${id}`)));
    },
    {
      message: "מחיקה מרובה זמינה רק עם מנוי פעיל",
    },
  );

  return (
    <button
      onClick={() => handleBulkDelete(selectedIds)}
      disabled={selectedIds.length === 0}
    >
      Delete Selected ({selectedIds.length})
    </button>
  );
}

// ============================================
// Example 7: Inline Function in JSX
// ============================================
function SongCard({ song }: { song: { id: number; title: string } }) {
  const guardAction = useGuardAction();

  return (
    <div className="song-card">
      <h3>{song.title}</h3>
      <button
        onClick={guardAction(async () => {
          await api.post(`/songs/${song.id}/favorite`);
        })}
      >
        ⭐ Favorite
      </button>
    </div>
  );
}

// ============================================
// Example 8: Conditional Action
// ============================================
function TogglePublicButton({
  lineup,
}: {
  lineup: { id: number; is_public: boolean };
}) {
  const guardAction = useGuardAction();

  const handleToggle = guardAction(async () => {
    const newState = !lineup.is_public;
    await api.put(`/lineups/${lineup.id}`, { is_public: newState });
  });

  return (
    <button onClick={handleToggle}>
      {lineup.is_public ? "🔓 Make Private" : "🔒 Make Public"}
    </button>
  );
}

// ============================================
// Pattern: When NOT to use guardAction
// ============================================
// DON'T use for read operations (already handled by 402 response):
function SongList() {
  const [songs, setSongs] = useState<Array<{ id: number; title: string }>>([]);

  // ❌ Wrong - reading is always allowed
  // const guardAction = useGuardAction();
  // const loadSongs = guardAction(() => api.get("/songs"));

  // ✅ Correct - just fetch normally
  useEffect(() => {
    api
      .get("/songs")
      .then(({ data }) => setSongs(Array.isArray(data) ? data : []));
  }, []);

  return <div>{songs.length}</div>;
}

// DON'T use for navigation:
function NavigateButton() {
  const navigate = useNavigate();
  // ❌ Wrong - navigation is never blocked
  // const guardAction = useGuardAction();
  // const handleNavigate = guardAction(() => navigate("/lineups"));

  // ✅ Correct - navigate directly
  return <button onClick={() => navigate("/lineups")}>Go to Lineups</button>;
}

export {
  AddSongButton,
  EditLineupButton,
  DeleteSongButton,
  UploadChartButton,
  CreateLineupForm,
  BulkDeleteButton,
  SongCard,
  TogglePublicButton,
  SongList,
  NavigateButton,
};
