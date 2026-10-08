import Mascot from "@/components/Mascot";

export default function Loading() {
  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-tertiary/10 to-tertiary/10 min-h-screen">
      <div className="relative w-full bg-tertiary rounded-3xl p-1 shadow-clay-surface overflow-hidden">
        <div className="absolute inset-0 rounded-3xl border-4 border-dashed border-surface/40 pointer-events-none"></div>
        <div className="relative bg-surface/95 backdrop-blur-sm rounded-[24px] p-6 md:p-8">
          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
            <div className="relative w-32 h-32 mb-6">
              <Mascot pose="thinking" size={128} />
            </div>
            <h1 className="font-headline-2xl text-headline-2xl text-text-primary font-extrabold mb-4">
              Loading Library...
            </h1>
            <p className="font-body-lg text-body-lg text-text-muted mb-8">
              Fetching your video lessons. Just a moment!
            </p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
