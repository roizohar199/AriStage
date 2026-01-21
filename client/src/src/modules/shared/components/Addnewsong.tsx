import React, { useState, useEffect, useRef } from "react";
import BaseModal from "./BaseModal.tsx";
import DesignActionButtonBig from "./DesignActionButtonBig";

/* ---------- Types ---------- */

export interface SongForm {
  title: string;
  artist: string;
  bpm: string;
  key_sig: string;
  duration_sec: string;
  notes: string;
}

interface AddNewSongProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: SongForm, editingId?: number | null) => Promise<void>;
  initialForm?: SongForm;
  editingId?: number | null;
}

/* ---------- Constants ---------- */

const notesList = ["שמח", "קצבי", "שקט", "מרגש", "קליל"];

const notesKeys = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const scaleModes = [
  "Major",
  "Minor",
  "Harmonic Minor",
  "Melodic Minor",
  "Dorian",
  "Phrygian",
  "Lydian",
  "Mixolydian",
  "Aeolian",
];

/* ---------- Helpers ---------- */

function safeKey(key: string) {
  if (!key) return "C Major";
  const trimmed = key.trim();

  // Find the longest matching mode at the end of the string (case-insensitive)
  let foundMode = "";
  let root = "";
  for (const mode of scaleModes.sort((a, b) => b.length - a.length)) {
    if (trimmed.toLowerCase().endsWith(mode.toLowerCase())) {
      foundMode = mode;
      root = trimmed.slice(0, -mode.length).trim();
      break;
    }
  }
  if (!foundMode) {
    // fallback
    const parts = trimmed.split(" ");
    root = notesKeys.includes(parts[0]) ? parts[0] : "C";
    foundMode = "Major";
  } else {
    root = notesKeys.includes(root) ? root : "C";
  }
  return `${root} ${foundMode}`;
}

const getRoot = (key_sig: string) => {
  const safe = safeKey(key_sig);
  // The root is always the first word before the first space
  return safe.split(" ")[0];
};

const getMode = (key_sig: string) => {
  const safe = safeKey(key_sig);
  // The mode is everything after the first space
  return safe.substring(safe.indexOf(" ") + 1);
};

function safeDuration(d: string | number) {
  if (!d) return "00:00";
  const str = typeof d === "number" ? String(d) : d;
  if (!str.includes(":")) return "00:00";
  const [m, s] = str.split(":");
  return `${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
}

const getMinutes = (d: string) => safeDuration(d).split(":")[0];
const getSeconds = (d: string) => safeDuration(d).split(":")[1];

/* ---------- Component ---------- */

export const AddNewSong: React.FC<AddNewSongProps> = ({
  open,
  onClose,
  onSubmit,
  initialForm = {
    title: "",
    artist: "",
    bpm: "",
    key_sig: "C Major", // דיפולט ל-Major
    duration_sec: "00:00",
    notes: "",
  },
  editingId,
}) => {
  const [form, setForm] = useState<SongForm>(initialForm);

  // dropmenu states & ref for outside clicks
  const [rootOpen, setRootOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setRootOpen(false);
        setModeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setForm({
      ...initialForm,
      key_sig: safeKey(initialForm.key_sig),
      duration_sec: safeDuration(initialForm.duration_sec),
    });
  }, [initialForm, editingId, open]);

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={editingId ? "עריכת שיר 🎧" : "הוסף שיר חדש"}
      maxWidth="max-w-md"
    >
      <h2 className="text-xl font-bold mb-4">
        {editingId ? "עריכת שיר 🎧" : "הוסף שיר חדש"}
      </h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSubmit(form, editingId);
        }}
        className="space-y-4"
      >
        {/* שם השיר */}
        <input
          placeholder="שם השיר *"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
          required
        />

        {/* אמן */}
        <input
          placeholder="אמן"
          value={form.artist}
          onChange={(e) => setForm({ ...form, artist: e.target.value })}
          className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
        />

        {/* BPM */}
        <input
          placeholder="BPM"
          type="number"
          min={1}
          max={350}
          value={form.bpm}
          onChange={(e) =>
            setForm({
              ...form,
              bpm: e.target.value.replace(/\D/g, ""),
            })
          }
          className="w-full bg-neutral-800 p-2 rounded-2xl text-sm"
        />

        {/* סולם */}
        <div>
          <p className="text-sm text-neutral-400 mb-1">סולם השיר:</p>

          <div className="flex gap-2" ref={dropdownRef}>
            {/* Root Dropmenu */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => {
                  setRootOpen((v) => !v);
                  setModeOpen(false);
                }}
                className="w-full text-left bg-neutral-800 p-2 rounded-2xl text-sm"
              >
                {getRoot(form.key_sig)}
              </button>
              {rootOpen && (
                <div className="absolute mt-1 w-full bg-neutral-800 rounded-2xl max-h-44 overflow-auto z-20">
                  {notesKeys.map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => {
                        setForm({
                          ...form,
                          key_sig: `${note} ${getMode(form.key_sig)}`,
                        });
                        setRootOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-700 text-sm"
                    >
                      {note}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mode Dropmenu */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => {
                  setModeOpen((v) => !v);
                  setRootOpen(false);
                }}
                className="w-full text-left bg-neutral-800 p-2 rounded-2xl text-sm"
              >
                {getMode(form.key_sig)}
              </button>
              {modeOpen && (
                <div className="absolute mt-1 w-full bg-neutral-800 rounded-2xl max-h-44 overflow-auto z-20">
                  {scaleModes.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setForm({
                          ...form,
                          key_sig: `${getRoot(form.key_sig)} ${mode}`,
                        });
                        setModeOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-700 text-sm"
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* משך זמן */}
        <div>
          <p className="text-sm text-neutral-400 mb-1">משך זמן:</p>
          <div className="flex flex-justify-between flex-row-reverse gap-2 items-center">
            <input
              type="number"
              min={0}
              max={59}
              value={getMinutes(form.duration_sec)}
              onChange={(e) =>
                setForm({
                  ...form,
                  duration_sec: `${e.target.value}:${getSeconds(
                    form.duration_sec,
                  )}`,
                })
              }
              className="w-full bg-neutral-800 p-2 rounded-2xl text-sm text-center"
            />
            <span>:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={getSeconds(form.duration_sec)}
              onChange={(e) =>
                setForm({
                  ...form,
                  duration_sec: `${getMinutes(form.duration_sec)}:${
                    e.target.value
                  }`,
                })
              }
              className="w-full bg-neutral-800 p-2 rounded-2xl text-sm text-center"
            />
          </div>
        </div>

        {/* תגיות */}
        <div>
          <p className="text-sm text-neutral-400 mb-1">תגית:</p>
          <div className="flex flex-wrap gap-2">
            {notesList.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => setForm({ ...form, notes: tag })}
                className={`px-3 py-1 rounded-2xl text-sm ${
                  form.notes === tag
                    ? "bg-brand-orange border-brand-orange text-black"
                    : "bg-neutral-800 text-neutral-300"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <DesignActionButtonBig type="submit">
          {editingId ? "עדכון" : "שמור"}
        </DesignActionButtonBig>
      </form>
    </BaseModal>
  );
};
