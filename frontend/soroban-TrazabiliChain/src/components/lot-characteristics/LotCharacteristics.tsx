import { listLotCharacteristics } from "@/lib/lots/lot-characteristics";

export function LotCharacteristics({ value }: { value: string }) {
  const entries = listLotCharacteristics(value);

  return (
    <ul className="grid min-w-0 gap-x-5 gap-y-1 sm:grid-cols-2">
      {entries.map(([label, detail]) => (
        <li key={label} className="min-w-0 wrap-break-word text-sm leading-6 text-ink">
          <span className="font-semibold">{label}: </span>
          {detail}
        </li>
      ))}
    </ul>
  );
}
