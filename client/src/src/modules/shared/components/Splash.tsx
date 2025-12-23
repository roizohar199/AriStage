export default function Splash() {
  return (
    <div className="flex items-center justify-center h-screen bg-neutral-900">
      <div className="flex flex-col items-center gap-6">
        {/* טקסט Ari Stage כמו במסך התחברות */}
        <h1 className="text-4xl font-extrabold text-transparent bg-brand-orange bg-clip-text drop-shadow-lg">
          Ari Stage
        </h1>

        {/* Loader עגול */}
        <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full"></div>
      </div>
    </div>
  );
}
