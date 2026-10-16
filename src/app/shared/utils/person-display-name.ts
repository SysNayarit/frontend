export interface PersonDisplayNameSource {
  nombres: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
}

export function personDisplayName(
  person: PersonDisplayNameSource,
): string {
  return [
    person.nombres,
    person.apellido_paterno,
    person.apellido_materno,
  ]
    .filter(
      (part): part is string =>
        part !== null &&
        part.trim() !== '',
    )
    .join(' ');
}