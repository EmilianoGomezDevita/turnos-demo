# Plan de pruebas: reserva y confirmación de turnos

## Application Overview

Plan QA del flujo público de reservas del negocio demo (/?n=demo-turnos): selección de servicio, profesional, día y horario, ingreso de datos del cliente y confirmación. Ejecutar cada escenario de forma independiente desde un estado limpio; usar datos de prueba y no reutilizar horarios ya reservados. La exploración confirmó las pantallas y validaciones básicas sin enviar una reserva válida ni alterar datos.

## Test Scenarios

### 1. Reserva y confirmación exitosa

**Seed:** `e2e/seed.spec.ts`

#### 1.1. Completar una reserva y verificar su confirmación

**File:** `e2e/reserva-confirmacion/reserva-exitosa.spec.ts`

**Steps:**
  1. Abrir http://localhost:3000/?n=demo-turnos en un estado limpio, con el negocio demo disponible y sin reservas previas del escenario.
    - expect: Se muestra la página «Reservá tu turno» y la lista de servicios.
  2. Seleccionar un servicio disponible, por ejemplo Brushing, y continuar.
    - expect: Se muestra el paso de selección de profesional.
    - expect: El resumen lateral refleja el servicio y su precio.
  3. Elegir «Cualquiera» o un profesional disponible y continuar.
    - expect: Se muestra el paso para elegir día y horario.
  4. Elegir un día futuro habilitado y un horario disponible.
    - expect: El horario queda seleccionado y el resumen muestra día y hora.
    - expect: El botón para continuar permite avanzar.
  5. Continuar, ingresar un nombre completo y un número de WhatsApp válido con característica, y pulsar «Reservar turno» una sola vez.
    - expect: La aplicación informa que la reserva fue confirmada, sin mensaje de error.
    - expect: La confirmación identifica coherentemente el servicio, profesional (si aplica), día, hora y cliente.
    - expect: Los datos de precio y negocio coinciden con la selección previa.
    - expect: La reserva queda confirmada una sola vez; no se presenta como pendiente o fallida.
  6. Actualizar la página o volver a consultar el estado de la reserva si la interfaz ofrece una referencia o acceso a la confirmación.
    - expect: La confirmación mostrada no cambia a un estado contradictorio y no se genera una segunda reserva al consultar.

### 2. Validaciones de selección y datos

**Seed:** `e2e/seed.spec.ts`

#### 2.1. Impedir avanzar sin seleccionar elementos obligatorios

**File:** `e2e/reserva-confirmacion/validar-selecciones.spec.ts`

**Steps:**
  1. Abrir el negocio demo en un estado limpio y no seleccionar un servicio.
    - expect: «Continuar» permanece deshabilitado o la aplicación impide avanzar con una indicación clara.
  2. Seleccionar un servicio y avanzar al paso de profesional sin elegir profesional.
    - expect: No es posible avanzar hasta elegir «Cualquiera» o una persona disponible.
  3. Elegir profesional y avanzar al calendario; intentar elegir un día cerrado que la interfaz marque como «Cerrado».
    - expect: El día cerrado no se puede seleccionar como una fecha disponible.
    - expect: No se puede continuar sin un día y un horario elegidos.
  4. Elegir un día habilitado, pero no seleccionar ningún horario.
    - expect: «Continuar» permanece deshabilitado o se informa claramente que falta seleccionar un horario.

#### 2.2. Validar nombre y WhatsApp antes de crear la reserva

**File:** `e2e/reserva-confirmacion/validar-datos-cliente.spec.ts`

**Steps:**
  1. Desde el paso de datos de una reserva válida en curso, dejar nombre y WhatsApp vacíos y pulsar «Reservar turno».
    - expect: Se muestra un mensaje de validación que solicita el nombre completo.
    - expect: La pantalla permanece en el formulario y no aparece una confirmación.
  2. Ingresar un nombre incompleto, por ejemplo «Ana», dejar WhatsApp vacío y volver a intentar reservar.
    - expect: La aplicación solicita datos válidos antes de aceptar la reserva.
    - expect: No se crea una reserva ni se muestra éxito.
  3. Ingresar un nombre y un WhatsApp con formato inválido, por ejemplo «abc», e intentar reservar.
    - expect: Se muestra un error que indica que el WhatsApp debe ser válido e incluir característica.
    - expect: El formulario conserva los datos para corregirlos y no aparece una confirmación.
  4. Reemplazar los datos por un nombre completo y un número válido, y volver a enviar solo si el escenario de validación se ejecuta en un entorno de prueba aislado.
    - expect: La validación deja de bloquear el envío; si se envía, el resultado es una única confirmación válida.

### 3. Consistencia del recorrido y manejo de errores

**Seed:** `e2e/seed.spec.ts`

#### 3.1. Volver entre pasos y mantener coherentes las selecciones

**File:** `e2e/reserva-confirmacion/navegacion-y-resumen.spec.ts`

**Steps:**
  1. En un estado limpio, seleccionar un servicio y profesional, avanzar al calendario, elegir día y horario y avanzar a «Tus datos».
    - expect: El resumen muestra el servicio, profesional, fecha, hora y precio elegidos.
  2. Pulsar «Volver» una vez para regresar al paso anterior y volver al paso de datos sin cambiar las selecciones.
    - expect: Las elecciones anteriores se conservan o se solicitan de nuevo de forma explícita; nunca se muestra un resumen que contradiga las selecciones activas.
    - expect: El resumen vuelve a mostrar los datos correctos de la cita.
  3. Regresar al paso de servicio, cambiarlo por otro disponible y continuar por los pasos de profesional y agenda.
    - expect: El precio del resumen se actualiza al servicio nuevo.
    - expect: La fecha y los horarios no disponibles para el servicio o profesional elegido no quedan seleccionados de forma inválida.
    - expect: La reserva no se confirma hasta completar de nuevo las selecciones requeridas.

#### 3.2. Informar cuando el negocio no existe

**File:** `e2e/reserva-confirmacion/errores-de-acceso.spec.ts`

**Steps:**
  1. Abrir la aplicación con un identificador de negocio inexistente, por ejemplo http://localhost:3000/?n=negocio-inexistente.
    - expect: Se muestra «Negocio no encontrado» y una indicación para revisar el enlace de reservas.
    - expect: No se ofrece un formulario que permita crear una reserva para un negocio inválido.
