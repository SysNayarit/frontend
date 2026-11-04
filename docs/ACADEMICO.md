# SIGA — Aplicación de los acuerdos académicos en Frontend

Versión documental: 2. Fecha: 2026-11-04.
Estado: PLANIFICADA. Acuerdos funcionales aprobados; implementación e integración académica pendientes de acreditar.

## Fuente funcional

La definición compartida se mantiene en [Backend docs/ACADEMICO.md](https://github.com/Gardurom/Backend/blob/main/docs/ACADEMICO.md). Incluye G/F/D/A/R, P01–P24, M01–M09, C01–C03, E01–E03 y S01 con las precisiones vigentes. Esta referencia evita duplicar reglas divergentes. Angular no constituye una fuente independiente de autorización o reglas de negocio.

## Aplicación prevista

| Área | Comportamiento de la interfaz |
|---|---|
| Persona Usuario y registro académico | Reutilizar identidad y contexto autenticado; no duplicar Personas ni habilitar cuentas al incorporar participantes. Matrícula sin login ni alias. |
| Incorporaciones y expedientes | Distinguir registro maestro, incorporación, expediente central, expediente académico y estado documental frente a situación académica. Los nombres físicos y contratos están pendientes. |
| Matrícula inicial | Vista previa ordenada; confirmar en un único acto las incorporaciones seleccionadas. Antes de confirmar no presentar matrícula como emitida. El Backend fija orden y consecutivos. |
| Altas posteriores | Mostrar siguiente matrícula devuelta por Backend; no reordenar ni renumerar lista inicial. No calcular consecutivos en el navegador. |
| Matrículas históricas | Mostrar valor íntegro emitido, incluidos DMPG2026_…, DMSG2026_…, DMTG2026_…. No reformatear. |
| Calificaciones | Un valor final por intento, rango 0.0–10.0, un decimal sin redondeo, aprobación desde 7.0; pendiente distinto de cero. Visibilidad inmediata tras guardado correcto. |
| Corrección | Informar ventana móvil; desde las 12 horas exactas exigir autorización concreta del administrador. El tiempo y autorización efectivos pertenecen al Backend. |
| Excel | Solo .xlsx; vista previa, correcciones expresas, confirmación de filas válidas e informe de rechazadas. No presentar una carga parcial como éxito total. |
| Resultado y ratificación | Mostrar valor, consecuencia y estado en consultas, reportes y exportaciones. Ratificar no cambia valor. Baja definitiva, avance y acreditación formal condicionados a ratificación. |
| Reingreso | Mostrar resolución autorizada y antecedente pendiente cuando aplique; no recuperar estudios ni habilitar Usuario automáticamente. |
| Evaluación conjunta | Una respuesta por cadete, Persona formadora y actividad; identificar ambas funciones sin duplicar calificaciones. Preguntas diferenciadas solo si las contempla el cuestionario versionado. |
| Confidencialidad | Mostrar resultados solo si Backend autoriza el conjunto realmente evaluado con mínimo cinco; no calcular resultados ocultos en cliente ni descargar respuestas individuales para agregarlas. Aplicar restricciones también a filtros y exportaciones. |
| Seguimiento docente | Lista operativa de pendientes con permiso separado, sin vínculo con respuestas; comentarios visibles solo tras revisión autorizada. |
| Ámbitos | Permiso efectivo más relación y alcance; coincidencia de todas las dimensiones delimitadas. No tratar ámbito vacío como institucional. |
| Documentación institucional | Requisito de consulta de acuerdos y versiones dentro de SIGA; pantalla, persistencia y permisos aún por diseñar. Publicar Markdown no implementa esa pantalla. |

## Integración y seguridad

- Laravel y PermissionResolver conservan autoridad de autorización y DENY/ALLOW; perfiles solo orientan UX.
- Cadete consulta sus propios datos mediante la Persona vinculada al Usuario; formador únicamente sus asignaciones; directivos y administrador según permisos efectivos. Los permisos de consulta no habilitan captura, corrección o ratificación.
- No confiar en identificadores enviados por navegador para acreditar pertenencia. Ocultar botones no sustituye controles del servidor.
- Persona BAJA o INACTIVA y restricciones de Usuario siguen los controles centrales; baja académica permanece separada.
- Utilizar contratos reales publicados y contexto autenticado vigente. Este documento no define endpoints, modelos TypeScript o permisos existentes.
- Mantener arquitectura modular y Atomic Design conforme a decisiones vigentes. Incorporar ayudas de reglas junto a acciones cuando se implemente el módulo.

## Validación futura

Validar únicamente lo necesario para los cambios concretos: representación correcta de estados, carga parcial, errores y autorizaciones, ausencia de duplicación y privacidad. No ejecutar pruebas conectadas a la base institucional sin aislamiento y autorización adecuados; no crear bases adicionales.

La publicación actual cambia documentación, no código, datos ni controles ejecutables. No certifica el cierre de Fase 2 ni de la auditoría Persona–Usuario.
