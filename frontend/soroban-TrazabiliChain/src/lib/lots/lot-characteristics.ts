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
  quantity: "",
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
  if (unit === "g") return isSingular ? "gramo" : "gramos";
  if (unit === "kg") return isSingular ? "kilogramo" : "kilogramos";
  if (unit === "t") return isSingular ? "tonelada" : "toneladas";
  if (unit === "lb") return isSingular ? "libra" : "libras";
  return unit;
}

function getUnitCode(unit: string) {
  if (unit === "gramo" || unit === "gramos") return "g";
  if (unit === "kilogramo" || unit === "kilogramos") return "kg";
  if (unit === "tonelada" || unit === "toneladas") return "t";
  if (unit === "libra" || unit === "libras") return "lb";
  return unit;
}

function parsePrice(value: string) {
  const match = value.match(
    /^([\d.,]+)\s+([A-Z]{3})(?:\/(g|gramo|gramos|kg|kilogramo|kilogramos|t|tonelada|toneladas|lb|libra|libras))?$/,
  );
  if (!match || !Number.isFinite(parseLocalizedNumber(match[1], match[2]))) return null;
  return {
    amount: match[1],
    currency: match[2],
    unit: match[3] ? getUnitCode(match[3]) : "",
  };
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
  let hasQuantityUnit = false;
  let hasExplicitPrice = false;

  for (const entry of value
    .split(" · ")
    .map((item) => item.trim())
    .filter(Boolean)) {
    const separator = entry.indexOf(": ");
    const label = separator > -1 ? entry.slice(0, separator) : "";
    const detail = separator > -1 ? entry.slice(separator + 2) : entry;
    const field = fieldLabels[label];

    if (field) {
      if (field === "quantity") {
        const quantity = detail.match(
          /^(.+?)\s+(g|gramo|gramos|kg|kilogramo|kilogramos|t|tonelada|toneladas|lb|libra|libras)$/,
        );
        const unitOnly = detail.match(
          /^(g|gramo|gramos|kg|kilogramo|kilogramos|t|tonelada|toneladas|lb|libra|libras)$/,
        );
        const parsedUnit = quantity?.[2] ?? unitOnly?.[1];
        result.quantity = quantity ? quantity[1] : unitOnly ? "" : detail;
        if (parsedUnit) {
          result.unit = getUnitCode(parsedUnit);
          hasQuantityUnit = true;
        }
      } else {
        result[field] = detail;
      }
    } else if (label === "Valor" || label === "Valor del producto") {
      const price = parsePrice(detail);
      if (price) {
        result.price = price.amount;
        result.currency = price.currency;
        if (price.unit && !hasQuantityUnit) result.unit = price.unit;
        hasExplicitPrice = true;
      } else {
        otherDetails.push(detail);
      }
    } else if (label === "Otros datos del producto") {
      for (const item of detail.split(" · ").map((part) => part.trim()).filter(Boolean)) {
        const legacyPrice = parsePrice(item);
        if (legacyPrice) {
          if (!hasExplicitPrice && !result.price) {
            result.price = legacyPrice.amount;
            result.currency = legacyPrice.currency;
            if (legacyPrice.unit && !hasQuantityUnit) result.unit = legacyPrice.unit;
          }
        } else {
          otherDetails.push(item);
        }
      }
    } else {
      otherDetails.push(entry);
    }
  }

  const quantity = parseLocalizedNumber(result.quantity, result.currency);
  result.quantity = Number.isFinite(quantity) ? String(quantity) : "";

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
      ? `Valor: ${formatLocalizedNumberInput(value.price, value.currency)} ${value.currency}`
      : "",
    value.otherDetails.trim() ? `Otros datos del producto: ${value.otherDetails.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function listLotCharacteristics(value: string) {
  const parsed = parseLotCharacteristics(value);
  const quantity = parseLocalizedNumber(parsed.quantity, parsed.currency);
  return [
    ["Variedad", parsed.variety],
    ["Presentación", parsed.presentation],
    ["Cosecha", parsed.harvest],
    ["Calidad", parsed.quality],
    [
      "Cantidad",
      Number.isFinite(quantity)
        ? `${formatNumberForCurrency(quantity, parsed.currency)} ${getUnitLabel(parsed.unit, quantity)}`
        : "",
    ],
    [
      "Valor del producto",
      parsed.price
        ? `${getCurrencySymbol(parsed.currency)} ${formatLocalizedNumberInput(parsed.price, parsed.currency)} ${parsed.currency}`
        : "",
    ],
    ["Otros datos del producto", parsed.otherDetails],
  ].filter((entry): entry is [string, string] => Boolean(entry[1].trim()));
}
