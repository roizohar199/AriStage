import { useState, useEffect } from "react";
import BaseModal from "./BaseModal.tsx";
import DesignActionButtonBig from "./DesignActionButtonBig";
import { Input, Select } from "./FormControls";
import { useTranslation } from "@/hooks/useTranslation.ts";

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

export const AddNewSong = ({
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
}: AddNewSongProps) => {
  const { t } = useTranslation();
  const scaleModeLabels: Record<string, string> = {
    Major: t("songs.scaleMode.major"),
    Minor: t("songs.scaleMode.minor"),
    "Harmonic Minor": t("songs.scaleMode.harmonicMinor"),
    "Melodic Minor": t("songs.scaleMode.melodicMinor"),
    Dorian: t("songs.scaleMode.dorian"),
    Phrygian: t("songs.scaleMode.phrygian"),
    Lydian: t("songs.scaleMode.lydian"),
    Mixolydian: t("songs.scaleMode.mixolydian"),
    Aeolian: t("songs.scaleMode.aeolian"),
  };
  const [form, setForm] = useState<SongForm>(initialForm);
  const notesList = [
    t("songs.notesPresets.happy"),
    t("songs.notesPresets.upbeat"),
    t("songs.notesPresets.calm"),
    t("songs.notesPresets.emotional"),
    t("songs.notesPresets.light"),
  ];

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
      title={editingId ? t("songs.editSong") : t("songs.addSong")}
      maxWidth="max-w-md"
    >
      <h2 className="text-xl font-bold mb-4 text-neutral-100">
        {editingId ? t("songs.editSong") : t("songs.addSong")}
      </h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSubmit(form, editingId);
        }}
        className="space-y-4"
      >
        {/* שם השיר */}
        <Input
          placeholder={`${t("songs.songTitle")} *`}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mb-0"
          required
        />

        {/* אמן */}
        <Input
          placeholder={t("songs.artist")}
          value={form.artist}
          onChange={(e) => setForm({ ...form, artist: e.target.value })}
          className="mb-0"
        />

        {/* BPM */}
        <Input
          placeholder={t("songs.bpm")}
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
          className="mb-0"
        />

        {/* סולם */}
        <div>
          <p className="text-sm text-neutral-400 mb-1 ">{t("songs.key")}:</p>

          <div className="flex gap-2 flex-row-reverse">
            <div className="flex-1 ">
              <Select
                value={getRoot(form.key_sig)}
                onChange={(value) =>
                  setForm({
                    ...form,
                    key_sig: `${value} ${getMode(form.key_sig)}`,
                  })
                }
                options={notesKeys.map((note) => ({
                  value: note,
                  label: note,
                }))}
                className="mb-0 "
              />
            </div>
            <div className="flex-1">
              <Select
                value={getMode(form.key_sig)}
                onChange={(value) =>
                  setForm({
                    ...form,
                    key_sig: `${getRoot(form.key_sig)} ${value}`,
                  })
                }
                options={scaleModes.map((mode) => ({
                  value: mode,
                  label: scaleModeLabels[mode] ?? mode,
                }))}
                className="mb-0"
              />
            </div>
          </div>
        </div>

        {/* משך זמן */}
        <div>
          <p className="text-sm text-neutral-400 mb-1">
            {t("songs.duration")}:
          </p>
          <div className="w-fit flex justify-between flex-row-reverse gap-2 items-center">
            <Input
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
              className="w-full text-center mb-0"
            />
            <span>:</span>
            <Input
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
              className="w-full text-center mb-0"
            />
          </div>
        </div>

        {/* תגיות */}
        <div>
          <p className="text-sm text-neutral-400 mb-1">{t("songs.notes")}:</p>
          <div className="flex flex-wrap gap-2">
            {notesList.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => setForm({ ...form, notes: tag })}
                className={`px-3 py-1 rounded-2xl text-sm shadow-surface ${
                  form.notes === tag
                    ? "bg-brand-primary border-brand-primary text-black"
                    : "bg-neutral-900 text-neutral-300 hover:bg-neutral-950"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <DesignActionButtonBig type="submit">
          {editingId ? t("common.update") : t("common.save")}
        </DesignActionButtonBig>
      </form>
    </BaseModal>
  );
};
