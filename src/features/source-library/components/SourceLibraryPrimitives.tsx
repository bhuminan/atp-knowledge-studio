export function SummaryStat({
  label,
  value
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="border-2 border-studio-line bg-studio-ink/70 p-2">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
    </div>
  );
}

export function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 leading-6 text-slate-100">{value}</dd>
    </div>
  );
}

export function EditorField({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-xs font-black uppercase text-slate-400">
      {label}
      <input
        className="mt-1 w-full border-2 border-studio-line bg-studio-ink px-3 py-2 text-sm font-bold normal-case text-white"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

export function EditorSelect({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="text-xs font-black uppercase text-slate-400">
      {label}
      <select
        className="mt-1 w-full border-2 border-studio-line bg-studio-ink px-3 py-2 text-sm font-bold normal-case text-white"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function EditorTextarea({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-xs font-black uppercase text-slate-400">
      {label}
      <textarea
        className="mt-1 min-h-24 w-full resize-y border-2 border-studio-line bg-studio-ink px-3 py-2 text-sm font-bold leading-6 normal-case text-white"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}
