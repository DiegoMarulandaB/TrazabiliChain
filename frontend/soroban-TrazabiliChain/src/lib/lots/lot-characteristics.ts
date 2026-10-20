export type LotCharacteristicsData = {
  variety: string;
  presentation: string;
  harvest: string;
  quality: string;
  quantity: string;
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
  quantity: "1",
  price: "",
  currency: "COP",
  unit: "g",
  otherDetails: "",
};

const fieldLabels: Record<string, keyof LotCharacteristicsData> = {
  Variedad: "variety",
  Presentación: "presentation",
  Cosecha: "harvest",
  Calidad: "quality",
  Cantidad: "quantity",
};

const currencyLocales: Record<string, string> = {
  COP: "es-CO",
  USD: "en-US",
  EUR: "es-ES",
  MXN: "es-MX",
  PEN: "es-PE",
  BRL: "pt-BR",
  GBP: "en-GB",
  JPY: "ja-JP",
  CAD: "en-CA",
  AUD: "en-AU",
};

export function getCurrencyLocale(currency: string) {
  return currencyLocales[currency] ?? "es-CO";
}

export function getCurrencySymbol(currency: string) {
  try {
    return (
      new Intl.NumberFormat(getCurrencyLocale(currency), {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value ?? currency
    );
  } catch {
    return currency;
  }
}

export function getCurrencyDecimalSeparator(currency: string) {
  return (
    new Intl.NumberFormat(getCurrencyLocale(currency))
      .formatToParts(1.1)
      .find((part) => part.type === "decimal")?.value ?? "."
  );
}

export function getCurrencyGroupingSeparator(currency: string) {
  return (
    new Intl.NumberFormat(getCurrencyLocale(currency))
      .formatToParts(1000)
      .find((part) => part.type === "group")?.value ?? ","
  );
}

export function getUnitLabel(unit: string, quantity = 1) {
  const count = typeof quantity === "number" ? quantity : Number(quantity);
  const isSingular = count === 1;
   if (unit === "g") return isSingular ? "gramo" : "gramo";
  if (unit === "kg") return isSingular ? "kilogramo" : "kilogramos";
  if (unit === "t") return isSingular ? "tonelada" : "toneladas";
  if (unit === "lb") return isSingular ? "libra" : "libras";
  return unit;
}

export function parseLocalizedNumber(value: string, currency = "COP") {
  const normalized = value.trim();
  if (!normalized) return Number.NaN;
  const groupingSeparator = getCurrencyGroupingSeparator(currency);
  const decimalSeparator = getCurrencyDecimalSeparator(currency);
  const parsed = normalized.split(groupingSeparator).join("").replace(decimalSeparator, ".");
  return /^\d+(\.\d+)?$/.test(parsed) ? Number(parsed) : Number.NaN;
}

export function formatLocalizedNumberInput(value: string, currency: string) {
  const number = parseLocalizedNumber(value, currency);
  if (!Number.isFinite(number)) return value;
  return formatNumberForCurrency(number, currency);
}

export function formatNumberForCurrency(number: number, currency: string) {
  if (!Number.isFinite(number)) return "";
  return new Intl.NumberFormat(getCurrencyLocale(currency), {
    maximumFractionDigits: 2,
  }).format(number);
}

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
      const price = detail.match(/^(.+?)\s+([A-Z]{3})\/(kg|t|lb)$/);
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

  const quantity = parseLocalizedNumber(result.quantity, result.currency);
  if (Number.isFinite(quantity)) result.quantity = String(quantity);

  result.otherDetails = otherDetails.join(" · ");
  return result;
}

export function formatLotCharacteristics(value: LotCharacteristicsData) {
  return [
    value.variety.trim() ? `Variedad: ${value.variety.trim()}` : "",
    value.presentation ? `Presentación: ${value.presentation}` : "",
    value.harvest.trim() ? `Cosecha: ${value.harvest.trim()}` : "",
    value.quality.trim() ? `Calidad: ${value.quality.trim()}` : "",
    value.quantity.trim()
      ? `Cantidad: ${formatNumberForCurrency(Number(value.quantity), value.currency)} ${getUnitLabel(value.unit, Number(value.quantity))}`
      : "",
    value.price.trim()
      ? `Valor: ${formatLocalizedNumberInput(value.price, value.currency)} ${value.currency}/${getUnitLabel(value.unit, Number(value.quantity))}`
      : "",
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
    [
      "Cantidad",
      parsed.quantity
        ? `${formatNumberForCurrency(Number(parsed.quantity), parsed.currency)} ${getUnitLabel(parsed.unit, Number(parsed.quantity))}`
        : "",
    ],
    [
      "Valor",
      parsed.price
        ? `${getCurrencySymbol(parsed.currency)} ${formatLocalizedNumberInput(parsed.price, parsed.currency)} ${parsed.currency}/${getUnitLabel(parsed.unit, Number(parsed.quantity))}`
        : "",
    ],
    ["Otros datos del producto", parsed.otherDetails],
  ].filter((entry): entry is [string, string] => Boolean(entry[1].trim()));
}
