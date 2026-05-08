import { formatInTimeZone } from "date-fns-tz";
import { BLOCK_QUARTER_HOURS, blockTimeSelectOptions } from "@/lib/block-time-options";
import { defaultTimeZone } from "@/lib/timezone";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30";

const selectClass =
  `${inputClass} cursor-pointer appearance-none bg-[length:1.25rem] bg-[right_0.65rem_center] bg-no-repeat pr-10` +
  ` bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%2314b8a6%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22/%3E%3C/svg%3E')]`;

function RangeCard({
  title,
  dateName,
  timeName,
  timeOptions,
  defaultDate,
  defaultTime,
}: {
  title: string;
  dateName: string;
  timeName: string;
  timeOptions: readonly string[];
  defaultDate?: string;
  defaultTime?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-teal-50/25 p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Día
          </span>
          <input
            name={dateName}
            type="date"
            required
            defaultValue={defaultDate}
            className={inputClass}
          />
        </label>
        <label className="block min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Hora
          </span>
          <select
            name={timeName}
            required
            defaultValue={defaultTime}
            className={selectClass}
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export function CreateBlockDatetimeFields() {
  const tz = defaultTimeZone;
  const today = formatInTimeZone(new Date(), tz, "yyyy-MM-dd");

  return (
    <>
      <RangeCard
        title="Desde"
        dateName="startsAtDate"
        timeName="startsAtTime"
        timeOptions={BLOCK_QUARTER_HOURS}
        defaultDate={today}
        defaultTime="09:00"
      />
      <RangeCard
        title="Hasta"
        dateName="endsAtDate"
        timeName="endsAtTime"
        timeOptions={BLOCK_QUARTER_HOURS}
        defaultDate={today}
        defaultTime="18:00"
      />
    </>
  );
}

export function EditBlockDatetimeFields({
  startsAt,
  endsAt,
}: {
  startsAt: Date;
  endsAt: Date;
}) {
  const tz = defaultTimeZone;
  const startOpts = blockTimeSelectOptions(startsAt, tz);
  const endOpts = blockTimeSelectOptions(endsAt, tz);

  return (
    <>
      <RangeCard
        title="Desde"
        dateName="startsAtDate"
        timeName="startsAtTime"
        timeOptions={startOpts}
        defaultDate={formatInTimeZone(startsAt, tz, "yyyy-MM-dd")}
        defaultTime={formatInTimeZone(startsAt, tz, "HH:mm")}
      />
      <RangeCard
        title="Hasta"
        dateName="endsAtDate"
        timeName="endsAtTime"
        timeOptions={endOpts}
        defaultDate={formatInTimeZone(endsAt, tz, "yyyy-MM-dd")}
        defaultTime={formatInTimeZone(endsAt, tz, "HH:mm")}
      />
    </>
  );
}
