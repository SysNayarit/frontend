import { personDisplayName } from './person-display-name';

describe('personDisplayName', () => {
  it('construye el nombre completo con ambos apellidos', () => {
    expect(
      personDisplayName({
        nombres: 'MARIA ELENA',
        apellido_paterno: 'LOPEZ',
        apellido_materno: 'GARCIA',
      }),
    ).toBe(
      'MARIA ELENA LOPEZ GARCIA',
    );
  });

  it('omite el apellido paterno cuando es null', () => {
    expect(
      personDisplayName({
        nombres: 'MARIA',
        apellido_paterno: null,
        apellido_materno: 'GARCIA',
      }),
    ).toBe(
      'MARIA GARCIA',
    );
  });

  it('omite valores vacios sin modificar los datos restantes', () => {
    expect(
      personDisplayName({
        nombres: 'MARIA',
        apellido_paterno: '',
        apellido_materno: 'GARCIA',
      }),
    ).toBe(
      'MARIA GARCIA',
    );
  });
});