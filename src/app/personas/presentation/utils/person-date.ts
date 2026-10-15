interface ParsedPersonDate {
  year: number;
  month: number;
  day: number;
}

const monthNames = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

function isLeapYear(year: number): boolean {
  return (
    year % 400 === 0 ||
    (year % 4 === 0 && year % 100 !== 0)
  );
}

function parsePersonDate(
  value: string | null,
): ParsedPersonDate | null {
  if (value === null) {
    return null;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(
      value,
    );

  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) {
    return null;
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  const maxDay = daysInMonth[month - 1];

  if (
    maxDay === undefined ||
    day < 1 ||
    day > maxDay
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
  };
}

export function personDateInputValue(
  value: string | null,
): string {
  const date = parsePersonDate(value);

  if (date === null) {
    return '';
  }

  const year = String(date.year).padStart(
    4,
    '0',
  );

  const month = String(date.month).padStart(
    2,
    '0',
  );

  const day = String(date.day).padStart(
    2,
    '0',
  );

  return `${year}-${month}-${day}`;
}

export function formatPersonDateLong(
  value: string | null,
): string | null {
  if (value === null) {
    return null;
  }

  const date = parsePersonDate(value);

  if (date === null) {
    return value;
  }

  const monthName =
    monthNames[date.month - 1];

  return `${date.day} de ${monthName} de ${date.year}`;
}