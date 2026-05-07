"use client";

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});

function labelFor(time: string) {
  const [h, m] = time.split(":").map(Number);
  const hh12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${String(hh12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function TimeSelect({
  value,
  onChange,
  name,
}: {
  value: string;
  onChange: (next: string) => void;
  name: string;
}) {
  return (
    <div className="mt-1">
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-teal-300">
        <select
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full appearance-none bg-transparent pl-10 pr-10 text-sm font-semibold tracking-wide text-slate-800 outline-none ring-teal-500 focus:ring-2"
        >
          {TIME_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {labelFor(t)}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base text-slate-400">
          ⏱
        </span>
        <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400">
          ▾
        </span>
      </div>
    </div>
  );
}
