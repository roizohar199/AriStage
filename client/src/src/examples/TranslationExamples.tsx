/**
 * Translation Usage Examples
 *
 * This file demonstrates various ways to use the translation system
 * Copy and adapt these patterns in your components
 */

import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/modules/shared/components/ToastProvider";
import { useConfirm } from "@/modules/shared/confirm/useConfirm";
import { useState } from "react";
import DesignActionButton from "@/modules/shared/components/DesignActionButton";

/**
 * Example 1: Basic Translation Usage
 * Using the useTranslation hook in a simple component
 */
export function BasicExample() {
  const { t, translations, locale, isRTL } = useTranslation();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{t("common.settings")}</h1>
      <p className="text-sm">
        Current Language: {locale} ({isRTL ? "RTL" : "LTR"})
      </p>

      {/* Using direct translations object */}
      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        {translations.common.save}
      </button>

      {/* Using t() function with path */}
      <button className="mt-2 px-4 py-2 bg-gray-500 text-white rounded">
        {t("common.cancel")}
      </button>

      {/* With fallback for missing keys */}
      <p>{t("some.missing.key", "Default Text")}</p>
    </div>
  );
}

/**
 * Example 2: Form with Translations
 * A complete form using translation keys
 */
export function FormExample() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: "",
    artist: "",
    bpm: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      showToast(t("songs.songAdded"), "success");
      setForm({ title: "", artist: "", bpm: "" });
    } catch (error) {
      showToast(t("errors.saveFailed"), "error");
    }
  };

  return (
    <div className="max-w-md p-6 bg-neutral-800 rounded-xl">
      <h2 className="text-xl font-bold mb-4">{t("songs.addSong")}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-2">
            {t("songs.songTitle")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={t("songs.songTitle")}
            className="w-full px-3 py-2 bg-neutral-900 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-2">{t("songs.artist")}</label>
          <input
            type="text"
            value={form.artist}
            onChange={(e) => setForm({ ...form, artist: e.target.value })}
            placeholder={t("songs.artist")}
            className="w-full px-3 py-2 bg-neutral-900 rounded"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">{t("songs.bpm")}</label>
          <input
            type="number"
            value={form.bpm}
            onChange={(e) => setForm({ ...form, bpm: e.target.value })}
            placeholder={t("songs.bpm")}
            className="w-full px-3 py-2 bg-neutral-900 rounded"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-brand-primary text-white rounded"
          >
            {t("common.save")}
          </button>
          <button
            type="button"
            onClick={() => setForm({ title: "", artist: "", bpm: "" })}
            className="px-4 py-2 bg-neutral-700 text-white rounded"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Example 3: List with Actions
 * Using translations for list items and action buttons
 */
export function ListExample() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [songs] = useState([
    { id: 1, title: "Song 1", artist: "Artist 1" },
    { id: 2, title: "Song 2", artist: "Artist 2" },
    { id: 3, title: "Song 3", artist: "Artist 3" },
  ]);

  const handleDelete = async (song: any) => {
    console.log("Deleting song:", song.id);
    const ok = await confirm({
      title: t("songs.deleteSong"),
      message: t("songs.confirmDelete"),
    });

    if (ok) {
      // Simulated delete
      showToast(t("songs.songDeleted"), "success");
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t("songs.title")}</h2>
        <button className="px-4 py-2 bg-brand-primary text-white rounded">
          {t("songs.addSong")}
        </button>
      </div>

      {songs.length === 0 ? (
        <p className="text-neutral-400 text-center py-8">
          {t("songs.noSongs")}
        </p>
      ) : (
        <div className="space-y-2">
          {songs.map((song) => (
            <div
              key={song.id}
              className="flex items-center justify-between p-4 bg-neutral-800 rounded"
            >
              <div>
                <div className="font-semibold">{song.title}</div>
                <div className="text-sm text-neutral-400">{song.artist}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm bg-neutral-700 rounded">
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => handleDelete(song)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded"
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Navigation Menu
 * Creating a dynamic navigation menu with translations
 */
export function NavigationExample() {
  const { t } = useTranslation();

  const navItems = [
    { key: "home", path: "/home", label: t("nav.home") },
    { key: "songs", path: "/my", label: t("nav.songs") },
    { key: "lineups", path: "/lineups", label: t("nav.lineups") },
    { key: "artists", path: "/artists", label: t("nav.artists") },
    { key: "settings", path: "/settings", label: t("nav.settings") },
  ];

  return (
    <nav className="space-y-1">
      {navItems.map((item) => (
        <a
          key={item.key}
          href={item.path}
          className="block px-4 py-2 rounded hover:bg-neutral-800"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

/**
 * Example 5: Settings Panel
 * Complete settings panel with all translations
 */
export function SettingsExample() {
  const { t, locale } = useTranslation();
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    fullName: "",
    email: "",
    theme: "dark",
    language: locale,
  });

  const handleSave = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      showToast(t("settings.changesSaved"), "success");
    } catch (error) {
      showToast(t("settings.saveFailed"), "error");
    }
  };

  return (
    <div className="max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-6">{t("settings.title")}</h1>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-neutral-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            {t("settings.profile")}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">
                {t("settings.fullName")}
              </label>
              <input
                type="text"
                value={settings.fullName}
                onChange={(e) =>
                  setSettings({ ...settings, fullName: e.target.value })
                }
                className="w-full px-3 py-2 bg-neutral-900 rounded"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                {t("settings.email")}
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
                className="w-full px-3 py-2 bg-neutral-900 rounded"
              />
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-neutral-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">
            {t("settings.appearance")}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">
                {t("settings.theme")}
              </label>
              <select
                value={settings.theme}
                onChange={(e) =>
                  setSettings({ ...settings, theme: e.target.value })
                }
                className="w-full px-3 py-2 bg-neutral-900 rounded"
              >
                <option value="dark">{t("settings.darkMode")}</option>
                <option value="light">{t("settings.lightMode")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-2">
                {t("settings.language")}
              </label>
              <select
                value={settings.language}
                onChange={(e) =>
                  setSettings({ ...settings, language: e.target.value as any })
                }
                className="w-full px-3 py-2 bg-neutral-900 rounded"
              >
                <option value="auto">{t("settings.languageAuto")}</option>
                <option value="he-IL">{t("settings.languageHebrew")}</option>
                <option value="en-US">{t("settings.languageEnglish")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <DesignActionButton onClick={handleSave}>
            {t("settings.saveChanges")}
          </DesignActionButton>
          <button className="px-4 py-2 bg-neutral-700 rounded">
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Example 6: Error Handling
 * Using translations for error messages
 */
export function ErrorHandlingExample() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleApiCall = async () => {
    try {
      // Simulated API call that might fail
      const random = Math.random();
      if (random < 0.5) {
        throw new Error("Network error");
      }

      showToast(t("success.saved"), "success");
    } catch (error: any) {
      // Different error messages based on error type
      if (error.message.includes("Network")) {
        showToast(t("errors.networkError"), "error");
      } else if (error.response?.status === 401) {
        showToast(t("errors.unauthorized"), "error");
      } else if (error.response?.status === 403) {
        showToast(t("errors.forbidden"), "error");
      } else if (error.response?.status === 404) {
        showToast(t("errors.notFound"), "error");
      } else {
        showToast(t("errors.generic"), "error");
      }
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleApiCall}
        className="px-4 py-2 bg-brand-primary text-white rounded"
      >
        {t("common.tryAgain")}
      </button>
    </div>
  );
}
