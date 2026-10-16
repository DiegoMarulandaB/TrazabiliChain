export type LotCharacteristicsData = {
  variety: string;
  presentation: string;
  harvest: string;
  quality: string;
  price: string;
  currency: string;
  unit: string;
  otherDetails: string;
};

export const emptyLotCharacteristics: LotCharacteristicsData = {
  variety: "",
  presentation: "",
  harvest: "",
  quality: "",
  price: "",
  currency: "COP",
  unit: "kg",
  otherDetails: "",
};

const fieldLabels: Record<string, keyof LotCharacteristicsData> = {
  Variedad: "variety",
  Presentación: "presentation",
  Cosecha: "harvest",
  Calidad: "quality",
};

export function parseLotCharacteristics(value: string): LotCharacteristicsData {
  const result = { ...emptyLotCharacteristics };
  const otherDetails: string[] = [];

  for (const entry of value
    .split(" · ")
    .map((item) => item.trim())
    .filter(Boolean)) {
    const separator = entry.indexOf(": ");
    const label = separator > -1 ? entry.slice(0, separator) : "";
    const detail = separator > -1 ? entry.slice(separator + 2) : entry;
    const field = fieldLabels[label];

    if (field) {
      result[field] = detail;
    } else if (label === "Valor") {
      const price = detail.match(/^([\d.,]+)\s+([A-Z]{3})\/(kg|t|lb)$/);
      if (price) {
        result.price = price[1];
        result.currency = price[2];
        result.unit = price[3];
      } else {
        otherDetails.push(detail);
      }
    } else if (label === "Otros datos del producto") {
      otherDetails.push(detail);
    } else {
      otherDetails.push(entry);
    }
  }

  result.otherDetails = otherDetails.join(" · ");
  return result;
}

export function formatLotCharacteristics(value: LotCharacteristicsData) {
  return [
    value.variety.trim() ? `Variedad: ${value.variety.trim()}` : "",
    value.presentation ? `Presentación: ${value.presentation}` : "",
    value.harvest.trim() ? `Cosecha: ${value.harvest.trim()}` : "",
    value.quality.trim() ? `Calidad: ${value.quality.trim()}` : "",
    value.price.trim() ? `Valor: ${value.price.trim()} ${value.currency}/${value.unit}` : "",
    value.otherDetails.trim() ? `Otros datos del producto: ${value.otherDetails.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function listLotCharacteristics(value: string) {
  const parsed = parseLotCharacteristics(value);
  return [
    ["Variedad", parsed.variety],
    ["Presentación", parsed.presentation],
    ["Cosecha", parsed.harvest],
    ["Calidad", parsed.quality],
    ["Valor", parsed.price ? `${parsed.price} ${parsed.currency}/${parsed.unit}` : ""],
    ["Otros datos del producto", parsed.otherDetails],
  ].filter((entry): entry is [string, string] => Boolean(entry[1].trim()));
}
