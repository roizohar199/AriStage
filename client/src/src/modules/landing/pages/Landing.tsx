import React from "react";
import {
  ArrowRight,
  Play,
  Smartphone,
  Music2,
  ListMusic,
  Share2,
  Timer,
  Cloud,
  Wand2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* HERO */}
      <section className="flex-1 flex flex-col md:flex-row items-center justify-center gap-10 px-6 pt-10 md:pt-0">
        {/* טקסט */}
        <div className="text-center md:text-right max-w-lg">
          <h1 className="text-4xl md:text-6xl font-extrabold text-brand-orange drop-shadow-xl">
            Ari Stage
          </h1>

          <p className="text-neutral-300 mt-4 text-lg md:text-xl leading-relaxed">
            הבית הרשמי לזמרים, נגנים ומפיקים — כל השירים, כל הלינאפים וכל
            האירועים שלך מנוהלים במקום אחד, בצורה חכמה, מהירה ומקצועית.
          </p>

          {/* כפתורים */}
          <div className="mt-8 flex flex-col md:flex-col gap-4 justify-center md:justify-start">
            {/* התחברות */}
            <button
              onClick={() => navigate("/login")}
              className="bg-brand-orange text-black font-bold py-2 rounded-xl 
              hover:bg-orange-500 transition flex items-center justify-center gap-2 shadow-xl"
            >
              התחברות
            </button>

            {/* ניסיון חינם */}
            <button
              onClick={() => navigate("/login?tab=register")}
              className="bg-neutral-800 border border-neutral-700 py-2 rounded-xl 
              hover:bg-neutral-700 transition shadow-md"
            >
              התחל ניסיון חינם
            </button>

            {/* דמו */}
            <button
              onClick={() => {
                const el = document.getElementById("why");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex flex-row-reverse py-2 rounded-xl border border-brand-orange text-brand-orange
              hover:bg-brand-orange/20 transition flex items-center justify-center gap-2"
            >
              <Play size={18} />
              צפה בדמו
            </button>
          </div>
        </div>

        {/* טלפון */}
        <div className="relative w-[280px] md:w-[700px] h-[560px] md:h-[680px] bg-black rounded-[40px] border-4 border-neutral-800 shadow-[0_0_50px_rgba(255,125,0,0.3)] overflow-hidden">
          <img
            src="/screen.png"
            alt="App Screenshot"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-2 rounded-full bg-neutral-700/80"></div>
        </div>
      </section>

      {/* למה אנחנו – גרסה חדשה ומוכרת */}
      <section
        id="why"
        className="py-12 px-5 bg-neutral-900 rounded-2xl border border-neutral-700 mt-10"
      >
        <h2 className="text-center text-3xl font-bold mb-12 text-brand-orange">
          למה דווקא Ari Stage?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {/* מאגר שירים */}
          <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 hover:border-brand-orange transition shadow-md">
            <ListMusic size={38} className="text-brand-orange mb-4" />
            <h3 className="text-xl font-semibold mb-2">מאגר שירים חכם</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              כל השירים שלך במקום אחד — כולל BPM, סולם, תגיות, אורך השיר, הערות,
              וכל מה שצריך כדי לעלות לבמה בביטחון.
            </p>
          </div>

          {/* שיתוף לינאפים אונליין */}
          <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 hover:border-brand-orange transition shadow-md">
            <Share2 size={38} className="text-brand-orange mb-4" />
            <h3 className="text-xl font-semibold mb-2">שיתוף לינאפ בלחיצה</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              שלח לינק לכל הצוות — זמרים, נגנים והפקה — שמתעדכן אונליין עד הרגע
              האחרון. כל שינוי שאתה עושה מתעדכן לכולם בשנייה. מושלם להופעות.
            </p>
          </div>

          {/* ליינאפים חכמים */}
          <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 hover:border-brand-orange transition shadow-md">
            <Music2 size={38} className="text-brand-orange mb-4" />
            <h3 className="text-xl font-semibold mb-2">לינאפים חכמים</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              גרירה ושחרור, סדר מהיר, חישוב זמני הופעה אוטומטיים, שמירה, שיתוף
              וייצוא — הכל כמה פעמים שתרצה.
            </p>
          </div>

          {/* עדכון בזמן אמת */}
          <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 hover:border-brand-orange transition shadow-md">
            <Cloud size={38} className="text-brand-orange mb-4" />
            <h3 className="text-xl font-semibold mb-2">עדכונים בזמן אמת</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              כל שינוי שאתה מבצע — שיר שנוסף, זמן שהשתנה, הערה שנוספה — מתעדכן
              אצל כולם באותו רגע. בלי בלאגן, בלי וואטסאפים.
            </p>
          </div>

          {/* ניהול אירועים */}
          <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 hover:border-brand-orange transition shadow-md">
            <Timer size={38} className="text-brand-orange mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              ניהול הופעות ואירועים
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              שליטה מלאה בכל האירועים שלך: תאריכים, סטים, זמנים, ליינים, חזרות —
              הכל במקום אחד מקצועי וקל לתפעול.
            </p>
          </div>

          {/* אוטומציה חכמה */}
          <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 hover:border-brand-orange transition shadow-md">
            <Wand2 size={38} className="text-brand-orange mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              אוטומציה ו-AI בהופעות
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              בקרוב: בינה שתבנה לך ליינאפים אוטומטיים לפי BPM, אנרגיה, סגנון
              ושלב האירוע. עוזר אישי לכל הופעה.
            </p>
          </div>
        </div>
      </section>

      <footer className="text-center py-6 text-neutral-500 text-sm mt-4">
        © {new Date().getFullYear()} Ari Stage. כל הזכויות שמורות.
      </footer>
    </div>
  );
}
