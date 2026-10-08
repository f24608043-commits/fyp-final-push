import Mascot from "@/components/Mascot";

export default function Loading() {
  return (
    <div className="w-full px-6 py-6 bg-gradient-to-br from-background via-primary/5 to-secondary/5 min-h-screen">
      <div className="relative clay-card p-8 md:p-12 overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-primary/25 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="relative w-32 h-32 mb-6">
            <Mascot pose="thinking" size={128} />
          </div>
          <h1 className="font-headline-2xl text-headline-2xl text-text-primary font-extrabold mb-4">
            Loading Lesson...
          </h1>
          <p className="font-body-lg text-body-lg text-text-muted mb-8">
            Preparing your video and quiz. Just a moment!
          </p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}
