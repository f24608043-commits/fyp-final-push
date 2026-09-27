import Link from "next/link";

interface BookSessionButtonProps {
  tutorId: string;
}

export default function BookSessionButton({ tutorId }: BookSessionButtonProps) {
  return (
    <Link
      href={`/tutoring/book/${tutorId}`}
      className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 font-label-md font-bold shadow-xl border-4 border-white/30 transform hover:scale-105 transition-all active:scale-95 flex items-center gap-2 text-center"
    >
      Book Session
    </Link>
  );
}
