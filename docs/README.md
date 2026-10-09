# SIGA — Documentación técnica del Frontend

Última actualización: 2026-10-09

## 1. Propósito

Este directorio conserva la documentación técnica viva del **Frontend de la Plataforma Integral SIGA** y forma parte de la base de requisitos, diseño, implementación, pruebas y validación de la aplicación web.

La documentación no es decorativa: debe consultarse antes de diseñar o implementar cambios relevantes en el Frontend.

El Frontend debe mantenerse alineado con los contratos, reglas funcionales, decisiones técnicas y controles de seguridad publicados por el Backend.

El Frontend no constituye una fuente independiente de reglas de negocio, autenticación o autorización.

---

## 2. Tipos de fuente

### Decisiones vivas

`DECISIONES_TECNICAS.md`

Gobierna las decisiones técnicas y funcionales vigentes de SIGA que también condicionan el diseño del Frontend.

Las decisiones específicas de Angular deberán respetar este documento y no podrán debilitar controles definidos por el Backend.

### Documentos compartidos con el Backend

Los siguientes documentos proceden del Backend y se mantienen también en el Frontend porque contienen decisiones, contratos o reglas que afectan directamente a la aplicación web:

- `ARQUITECTURA_TECNICA.md`;
- `AUTENTICACION_SEGURIDAD.md`;
- `DECISIONES_TECNICAS.md`;
- `ESTADO_SIGA.md`;
- `PERSONA.md`.

Estos documentos son referencias compartidas Backend ↔ Frontend.

Una copia de un documento compartido no debe modificarse únicamente para representar decisiones particulares de Angular.

Cuando cambie el documento de origen en el Backend deberá:

1. identificarse el cambio;
2. determinarse su impacto sobre el Frontend;
3. actualizarse la copia correspondiente;
4. actualizarse código y pruebas cuando sea necesario.

### Estado general de SIGA

`ESTADO_SIGA.md`

Describe el estado técnico publicado de SIGA desde la perspectiva general y del Backend.

Puede contener referencias históricas indicando que el Frontend estaba pendiente en el momento de su publicación.

El estado real del Frontend debe comprobarse también mediante:

- código actual de `main`;
- pruebas;
- configuración Angular;
- documentación específica del Frontend.

---

## 3. Jerarquía para evitar conflictos

Antes de programar el Frontend se debe consultar:

1. decisión explícita más reciente aprobada para SIGA;
2. `DECISIONES_TECNICAS.md`;
3. documento vivo del dominio afectado;
4. `ESTADO_SIGA.md`;
5. contrato real publicado por el Backend;
6. código y pruebas actuales del Frontend en `main`.

El código y las pruebas demuestran lo que está implementado.

Los documentos vivos establecen las reglas que deben gobernar el diseño vigente.

Los contratos reales del Backend determinan lo que Angular puede consumir.

El Frontend no debe inventar:

- endpoints;
- métodos HTTP;
- campos;
- respuestas;
- estados;
- roles;
- permisos;
- perfiles;
- reglas funcionales;
- mecanismos de autenticación;
- mecanismos de autorización.

Si existe una contradicción entre documentación, Backend y Frontend, no se debe ampliar esa funcionalidad hasta reconciliar la diferencia.

---

## 4. Estado general del Frontend

El Frontend actual fue reconstruido desde cero conservando únicamente el repositorio Git existente.

### Base tecnológica

- Angular 22.2.2;
- TypeScript 6.0.2;
- Tailwind CSS 4.3.3;
- PostCSS 8.5.29;
- Vitest;
- Node.js 24.18.1;
- npm 11.16.0.

### Decisión de interfaz y estilos

Angular es el framework oficial para el desarrollo del Frontend de SIGA.

Tailwind CSS es la tecnología oficial para la construcción, composición y mantenimiento de la interfaz visual y de los estilos del Frontend.

La interfaz deberá desarrollarse utilizando las utilidades, principios de composición y capacidades de Tailwind CSS como base de presentación.

No se incorporará otro framework CSS en paralelo salvo que exista una necesidad técnica real, evaluación previa y decisión documentada.

Los estilos CSS personalizados deberán limitarse a aquellos casos que no puedan resolverse adecuadamente mediante Tailwind CSS o que correspondan a necesidades globales justificadas de la aplicación.

La incorporación de componentes visuales deberá respetar:

- accesibilidad;
- consistencia visual;
- diseño adaptable;
- mantenibilidad;
- reutilización;
- separación entre presentación y reglas de negocio;
- compatibilidad con Angular;
- ausencia de lógica de autorización basada exclusivamente en la interfaz.

Tailwind CSS pertenece exclusivamente a la capa de presentación y no sustituye las validaciones, permisos ni controles de seguridad establecidos por el Backend.

### Reconstrucción

La implementación anterior fue eliminada.

No se reutilizaron:

- componentes anteriores;
- rutas anteriores;
- estilos anteriores;
- modelos anteriores;
- repositorios anteriores;
- casos de uso anteriores;
- pantalla anterior de Login;
- pantallas anteriores de Persona;
- layout anterior;
- configuración anterior de Tailwind.

La implementación nueva debe crecer únicamente cuando exista una necesidad funcional real.

Regla vigente:

> Si un archivo, dependencia, configuración o documento no se utiliza, está vacío, es obsoleto, es incompatible o pertenece a una implementación descartada, debe eliminarse.

---

## 5. Integración actual con el Backend

La primera integración funcional del nuevo Frontend corresponde a la autenticación SPA entre Angular y Laravel.

Actualmente están implementados en Angular:

- configuración de `HttpClient`;
- modelos TypeScript del contrato de autenticación;
- `AuthService`;
- inicialización de protección CSRF;
- inicio de sesión;
- consulta del usuario asociado a la sesión autenticada;
- cierre de sesión;
- reautenticación;
- proxy local Angular → Laravel;
- pruebas automatizadas del servicio de autenticación.

### 5.1 Modelo de autenticación

SIGA utiliza **Laravel Sanctum en modo SPA stateful**.

La autenticación se basa en:

- sesión administrada por Laravel;
- cookies;
- protección CSRF;
- guard `web`;
- `auth:sanctum` para las rutas API protegidas.

Angular no genera ni administra directamente un token de autenticación.

No se utilizan como mecanismo principal de autenticación de la SPA:

- JWT;
- Personal Access Tokens;
- Bearer tokens almacenados en el navegador;
- tokens de sesión almacenados en `localStorage`.

### 5.2 Flujo correcto de inicio de sesión

El flujo implementado es:

```text
Angular
   |
   | 1. GET /sanctum/csrf-cookie
   v
Laravel / Sanctum
   |
   | Inicializa la protección CSRF
   | y entrega la cookie XSRF
   v
Angular
   |
   | 2. POST /login
   |    email + password
   v
Laravel
   |
   | Valida credenciales
   | Aplica rate limiting
   | Autentica mediante guard web
   | Regenera la sesión
   | Registra marcas de autenticación
   |
   | Respuesta correcta:
   | HTTP 204 No Content
   v
Sesión autenticada
   |
   | 3. GET /api/user
   v
Laravel
   |
   | auth:sanctum
   | valida la sesión existente
   |
   | Respuesta correcta:
   | HTTP 200
   | usuario autenticado
   v
Angular
   |
   v
Usuario identificado en la interfaz
```

Las responsabilidades son diferentes:

`GET /sanctum/csrf-cookie`

Inicializa la protección CSRF necesaria para el flujo SPA.

No autentica al usuario.

`POST /login`

Valida las credenciales y establece la sesión autenticada.

Esta es la operación de inicio de sesión.

`GET /api/user`

Consulta al usuario correspondiente a una sesión que ya fue autenticada.

No realiza el login.

### 5.3 Contrato de Login

Endpoint:

```text
POST /login
```

Solicitud:

```json
{
  "email": "usuario@dominio",
  "password": "contraseña"
}
```

El Backend:

1. elimina espacios externos del correo;
2. normaliza el correo a minúsculas;
3. valida `email`;
4. valida `password`;
5. aplica el límite de intentos;
6. verifica las credenciales;
7. regenera la sesión;
8. registra `siga_authenticated_at`;
9. registra `siga_reauthenticated_at`.

Cuando las credenciales son correctas responde:

```text
HTTP 204 No Content
```

El Login no devuelve un objeto Usuario.

Después de un Login correcto Angular consulta:

```text
GET /api/user
```

para obtener al usuario asociado a la sesión.

### 5.4 Usuario autenticado

Endpoint:

```text
GET /api/user
```

La ruta está protegida mediante:

- Sanctum stateful;
- `auth:sanctum`;
- timeout absoluto de sesión.

El contrato actualmente consumido por Angular contempla:

```text
AuthenticatedUser
├── id
├── id_persona
├── name
├── email
├── email_verified_at
├── created_at
├── updated_at
└── person
    ├── id_persona
    ├── nombres
    ├── apellido_paterno
    └── apellido_materno
```

`id_persona` puede ser nulo.

`person` puede ser nulo.

Angular no debe asumir que la respuesta contiene:

- roles;
- permisos;
- perfiles;

mientras el Backend no los publique expresamente dentro de ese contrato.

### 5.5 Sesión autenticada

Después del Login correcto, las peticiones protegidas utilizan la sesión administrada por Laravel.

El Frontend no debe:

- leer la cookie de sesión;
- modificar la cookie de sesión;
- generar identificadores de sesión;
- almacenar una copia de la cookie;
- almacenar un token equivalente en `localStorage`;
- considerar únicamente el estado visual de Angular como prueba de autenticación.

La autoridad sobre la validez de la sesión pertenece al Backend.

Una respuesta HTTP 401 deberá manejarse como pérdida, ausencia o expiración de una sesión autenticada válida, según el contexto.

### 5.6 Reautenticación

Algunas operaciones sensibles requieren una confirmación reciente de la contraseña.

Endpoint:

```text
POST /reauthenticate
```

Solicitud:

```json
{
  "password": "contraseña"
}
```

Una reautenticación correcta responde:

```text
HTTP 204 No Content
```

La reautenticación:

- no sustituye la autenticación;
- no sustituye la autorización;
- no concede permisos.

Únicamente vuelve a confirmar la identidad del usuario para operaciones sensibles.

Cuando una operación requiere una nueva confirmación, el Backend responde:

```text
HTTP 423 Locked
```

El flujo esperado en el Frontend es:

```text
Operación sensible
        |
        v
Backend responde HTTP 423
        |
        v
Frontend solicita contraseña actual
        |
        v
POST /reauthenticate
        |
        +---- error ----> no repetir operación
        |
        v
HTTP 204
        |
        v
Repetir la operación sensible original
```

La operación sensible solo debe repetirse después de una reautenticación correcta.

### 5.7 Cierre de sesión

Endpoint:

```text
POST /logout
```

Cuando el cierre de sesión es correcto:

```text
HTTP 204 No Content
```

El Backend:

- ejecuta logout del guard `web`;
- invalida la sesión;
- regenera el token CSRF.

Después de un logout correcto, Angular debe limpiar únicamente el estado de interfaz correspondiente al usuario autenticado.

No existe un Bearer token almacenado por Angular que deba eliminarse.

### 5.8 Desarrollo local

Durante el desarrollo:

Frontend:

```text
http://localhost:4200
```

Backend:

```text
http://localhost:8000
```

Angular utiliza URLs relativas:

```text
/sanctum/csrf-cookie
/login
/logout
/reauthenticate
/api/user
/api/...
```

El proxy de desarrollo dirige estas solicitudes hacia Laravel.

Esto permite mantener el cliente alineado con el flujo de sesión y CSRF sin colocar URLs absolutas del Backend dentro de los servicios Angular.

---

## 6. Seguridad

La prioridad de SIGA es defensa en profundidad.

El Frontend debe respetar los controles descritos en:

`AUTENTICACION_SEGURIDAD.md`

El Backend continúa siendo la autoridad de:

- autenticación;
- autorización;
- permisos;
- reautenticación;
- expiración de sesión;
- reglas de negocio;
- auditoría.

Ocultar una opción, botón, menú o pantalla en Angular no constituye un control de autorización.

### Respuestas que el Frontend debe contemplar

Según la operación, Angular deberá manejar correctamente:

- HTTP 401 — sesión ausente, inválida o vencida;
- HTTP 403 — operación no autorizada;
- HTTP 422 — validación incorrecta;
- HTTP 423 — requiere reautenticación reciente;
- HTTP 429 — límite de intentos alcanzado;
- encabezado `Retry-After` cuando sea proporcionado.

No deben deshabilitarse las defensas CSRF para simplificar el Frontend.

### Controles preproducción

Continúan como controles obligatorios del sistema antes de producción:

- HTTPS;
- HSTS;
- CSP;
- headers defensivos;
- auditoría de autenticación y throttling;
- MFA;
- Passkeys/WebAuthn.

Un control no debe documentarse como implementado en el Frontend hasta existir:

```text
decisión
-> implementación
-> prueba
-> evidencia
-> aceptación
```

---

## 7. Persona

`PERSONA.md` define el contrato funcional compartido del núcleo de identidad institucional.

Cuando se implemente Persona en Angular deberá respetarse:

- campos publicados;
- dominios;
- estados;
- reglas de integridad;
- obligatoriedad;
- endpoints;
- autorización;
- reautenticación de operaciones sensibles.

Actualmente las pantallas de Persona todavía no han sido reconstruidas en el nuevo Frontend.

La implementación deberá partir del contrato vigente del Backend y no de la implementación Frontend eliminada.

---

## 8. Autorización y experiencia de usuario

SIGA mantiene separados:

```text
Roles y Permisos -> Seguridad
Perfiles          -> Experiencia de usuario
```

El Frontend podrá utilizar perfiles para aspectos como:

- navegación;
- presentación;
- módulos visibles;
- experiencia de usuario.

Los perfiles no conceden permisos.

La autorización efectiva corresponde siempre al Backend.

La regla vigente es:

```text
DENY > ALLOW > NO_RULE
```

La ausencia de regla equivale a acceso denegado.

El Frontend puede ocultar elementos que el usuario no necesita visualizar, pero esa ocultación nunca sustituye la comprobación de permisos del servidor.

---

## 9. Pruebas y calidad del Frontend

El Frontend utiliza:

- Vitest;
- Angular TestBed;
- `HttpTestingController`;
- build de producción de Angular;
- `npm audit`;
- `git diff --check`.

Actualmente existen pruebas para:

- creación de la aplicación;
- inicialización CSRF;
- Login;
- obtención del usuario autenticado;
- Logout;
- reautenticación.

El flujo de desarrollo debe mantener:

```text
necesidad
-> requisito
-> contrato Backend
-> diseño Frontend
-> implementación
-> prueba
-> build
-> evidencia
-> aceptación
```

Antes de integrar un bloque relevante deben ejecutarse como mínimo:

```text
npm test -- --watch=false
npm run build
npm audit
git diff --check
```

Cuando exista contenido preparado para commit también debe comprobarse:

```text
git diff --cached --check
```

No se debe publicar como terminada una funcionalidad que no tenga implementación y evidencia.

---

## 10. Trazabilidad

Toda funcionalidad dependiente del Backend debe permitir identificar:

- endpoint;
- método HTTP;
- estructura de solicitud;
- estructura de respuesta;
- códigos HTTP relevantes;
- autenticación requerida;
- autorización requerida;
- reautenticación cuando corresponda;
- comportamiento esperado de Angular;
- pruebas asociadas.

La trazabilidad general será:

```text
necesidad
-> requisito
-> contrato Backend
-> diseño Frontend
-> implementación
-> prueba
-> evidencia
-> aceptación
```

---

## 11. Mantenimiento documental

Actualizar la documentación cuando:

- cierre un bloque relevante;
- cambie una decisión;
- cambie la arquitectura;
- cambie un contrato del Backend;
- se agregue una integración;
- se incorpore seguridad;
- cambie una regla funcional;
- cambien pruebas o criterios de aceptación;
- se publique un hito relevante.

No documentar trabajo local como terminado.

Un documento que deje de ser aplicable debe actualizarse o eliminarse.

No conservar documentación obsoleta únicamente por historial dentro del Frontend.

---

## 12. Gobierno de Git para documentación

La documentación técnica del Frontend se mantiene en:

```text
main/docs
```

Reglas:

- no crear ramas ni Pull Requests sin autorización explícita previa;
- los cambios documentales aprobados pueden integrarse directamente a `main`;
- utilizar mensajes de commit en castellano español latinoamericano;
- verificar el estado del repositorio antes del commit;
- ejecutar las validaciones correspondientes;
- verificar el commit remoto después del push;
- mantener sincronizados código y documentación.

La documentación compartida procedente del Backend debe actualizarse cuando un cambio publicado afecte directamente al Frontend.

---

## 13. Orden recomendado de lectura

Antes de desarrollar una funcionalidad del Frontend:

1. `DECISIONES_TECNICAS.md`
2. `ESTADO_SIGA.md`
3. documento del dominio afectado
4. `AUTENTICACION_SEGURIDAD.md` cuando intervengan autenticación, sesiones o seguridad
5. `ARQUITECTURA_TECNICA.md`
6. código y pruebas actuales del Frontend

Para Persona:

1. `DECISIONES_TECNICAS.md`
2. `ESTADO_SIGA.md`
3. `PERSONA.md`
4. `AUTENTICACION_SEGURIDAD.md`
5. `ARQUITECTURA_TECNICA.md`
6. código y pruebas actuales del Frontend

---

## 14. Actualización Backend ↔ Frontend

Los documentos compartidos no deben divergir silenciosamente.

Cuando el Backend publique un cambio que afecte:

- API;
- autenticación;
- sesiones;
- permisos;
- reautenticación;
- Persona;
- reglas funcionales;
- seguridad;

se deberá:

1. identificar el cambio publicado;
2. revisar el contrato real;
3. determinar el impacto sobre Angular;
4. actualizar la documentación compartida;
5. modificar modelos o servicios cuando corresponda;
6. actualizar o agregar pruebas;
7. ejecutar pruebas y build;
8. registrar la evidencia mediante Git.

El Frontend debe desarrollarse siempre contra el contrato vigente del Backend.

No debe desarrollarse contra:

- supuestos;
- documentación histórica superada;
- endpoints inventados;
- implementaciones anteriores eliminadas.

---

## 15. Regla final del Frontend

Toda incorporación al Frontend debe responder a una necesidad real de SIGA.

La secuencia de trabajo será:

```text
contrato real
-> implementación mínima
-> prueba
-> validación
-> documentación
-> commit
-> push
```

Si algo deja de utilizarse, queda obsoleto o pertenece a una implementación descartada:

```text
se elimina
```
