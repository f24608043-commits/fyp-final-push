import Link from "next/link";

export default function EditAvailabilityButton() {
  return (
    <Link
      href="/tutoring/dashboard/availability"
      className="rounded-xl bg-success text-text-primary px-4 py-2 font-label-md font-bold shadow-glow hover:bg-primary transition-all active:translate-y-[2px] inline-block text-center"
    >
      Edit Availability
    </Link>
  );
}
