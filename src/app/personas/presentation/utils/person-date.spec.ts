import {
  formatPersonDateLong,
  personDateInputValue,
} from './person-date';

describe('person-date', () => {
  it('obtiene la fecha civil para un input date desde un timestamp', () => {
    expect(
      personDateInputValue(
        '1990-01-01T00:00:00.000000Z',
      ),
    ).toBe('1990-01-01');
  });

  it('conserva una fecha civil para un input date', () => {
    expect(
      personDateInputValue('1990-05-20'),
    ).toBe('1990-05-20');
  });

  it('devuelve vacio para una fecha no registrada', () => {
    expect(
      personDateInputValue(null),
    ).toBe('');
  });

  it('presenta un timestamp como fecha larga en español', () => {
    expect(
      formatPersonDateLong(
        '1990-05-20T00:00:00.000000Z',
      ),
    ).toBe('20 de mayo de 1990');
  });

  it('presenta correctamente el primer dia de un mes', () => {
    expect(
      formatPersonDateLong('1990-01-01'),
    ).toBe('1 de enero de 1990');
  });

  it('mantiene null cuando la fecha no esta registrada', () => {
    expect(
      formatPersonDateLong(null),
    ).toBeNull();
  });
});