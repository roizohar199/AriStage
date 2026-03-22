import {
  Play,
  Music2,
  ListMusic,
  Share2,
  Timer,
  Cloud,
  Wand2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation.ts";

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const featureCards = [
    {
      key: "smartSongBank",
      icon: ListMusic,
    },
    {
      key: "oneClickSharing",
      icon: Share2,
    },
    {
      key: "smartLineups",
      icon: Music2,
    },
    {
      key: "realtimeUpdates",
      icon: Cloud,
    },
    {
      key: "eventManagement",
      icon: Timer,
    },
    {
      key: "aiAutomation",
      icon: Wand2,
    },
  ] as const;

  return (
    <div className="min-h-screen text-neutral-100 flex flex-col">
      {/* HERO */}
      <section className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 px-6 pt-10 md:pt-0">
        {/* טקסט */}
        <div className="text-center md:text-start max-w-lg">
          <h1 className="text-4xl md:text-6xl font-extrabold text-brand-primary drop-shadow-xl">
            {t("common.appName")}
          </h1>

          <p className="text-neutral-300 mt-4 text-lg md:text-xl leading-relaxed">
            {t("landing.heroSubtitle")}
          </p>

          {/* כפתורים */}
          <div className="mt-8 flex flex-col md:flex-col gap-4 justify-center md:justify-start">
            {/* התחברות */}
            <button
              onClick={() => navigate("/login")}
              className="bg-brand-primary text-neutral-950 font-bold px-4 py-2 rounded-2xl transition flex items-center justify-center gap-2 shadow-xl text-sm hover:bg-brand-primaryLight"
            >
              {t("landing.loginButton")}
            </button>

            {/* ניסיון חינם */}
            <button
              onClick={() => navigate("/login?tab=register")}
              className="bg-neutral-800 px-4 py-2 rounded-2xl hover:bg-neutral-700 transition shadow-md text-sm"
            >
              {t("landing.freeTrialButton")}
            </button>

            {/* דמו */}
            <button
              onClick={() => {
                const el = document.getElementById("why");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-brand-primary/20 flex flex-row-reverse px-4 py-2 rounded-2xl text-brand-primary
              hover:bg-brand-primary/50 hover:text-neutral-100 transition flex items-center justify-center gap-2 text-sm"
            >
              <Play size={18} />
              {t("landing.demoButton")}
            </button>
          </div>
        </div>

        {/* טלפון */}
        <div className="relative w-[280px] md:w-[700px] h-[560px] md:h-[680px] bg-black rounded-[40px] border-4 border-neutral-800 shadow-[0_0_50px_rgba(255,125,0,0.3)] overflow-hidden">
          <img
            src="/screen.png"
            alt={t("landing.screenshotAlt")}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-2 rounded-full bg-neutral-700/80"></div>
        </div>
      </section>

      {/* למה אנחנו – גרסה חדשה ומוכרת */}
      <section id="why" className="py-12 px-5 rounded-2xl mt-10">
        <h2 className="text-center text-3xl font-bold mb-12 text-brand-primary">
          {t("landing.whyTitle")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {featureCards.map(({ key, icon: Icon }) => (
            <div key={key} className="bg-neutral-800 p-6 rounded-2xl shadow-md">
              <Icon size={38} className="text-brand-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {t(`landing.features.${key}.title`)}
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                {t(`landing.features.${key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
