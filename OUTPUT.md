🧩 Contexto del Sistema

Sistema: Plataforma de gestión de inventarios multibodega.
Módulo relevante: Módulo de Productos → Submódulo “Crear Producto”.
Usuarios:

Administrador de Inventario (rol con permisos de creación y asignación de bodegas).

Restricciones:

Cada producto debe tener una bodega principal obligatoria.

Solo se pueden asignar bodegas activas.

La cantidad inicial debe ser un entero ≥ 0.

El sistema debe validar duplicidad de bodegas.

🧪 Casos de Prueba Manuales
## TC-01: Creación de producto con bodega principal
Campo	Valor
ID	TC-HU01-001
Título	Crear producto con bodega principal válida
Prioridad	Alta
Riesgo	Medio
Trazabilidad	Cubre escenario 1 de los criterios de aceptación

Precondiciones:

Usuario autenticado como Administrador de Inventario.

Existen bodegas activas en el sistema (ej: “Bodega Central”).

No existen productos duplicados con el mismo nombre.

Datos de Prueba:

Nombre: “Fertilizante Orgánico A”

Unidad: “kg”

Precio base: “20000”

Impuesto: “19%”

Precio total: “23800”

Costo inicial: “15000”

Bodega principal: “Bodega Central”

Cantidad inicial: “100”

Pasos y Resultados Esperados:

#	Paso	Resultado Esperado	Validación
1	Acceder al módulo “Productos” → “Crear Producto”	Se muestra formulario de creación	UI
2	Completar los campos requeridos	Los campos se completan correctamente	UI
3	Seleccionar “Bodega Central” como bodega principal	Campo se llena correctamente	UI
4	Ingresar cantidad “100”	Valor aceptado (entero positivo)	UI
5	Clic en “Crear Producto”	Se valida información y se guarda	API (POST /products)
6	Validar mensaje “Producto creado exitosamente”	Mensaje visible	UI
7	Revisar lista de productos	Producto aparece con stock 100 en “Bodega Central”	UI / API GET /products

Casos negativos / de borde:

Cantidad inicial = 0 → debe crear el producto exitosamente.

Cantidad inicial con decimales (ej. 100.5) → debe mostrar error.

Ambiente / Dependencias:

Base de datos con bodegas activas.

API /products funcional.

TC-02: Agregar bodegas adicionales al crear producto
Campo	Valor
ID	TC-HU01-002
Título	Crear producto con bodegas adicionales
Prioridad	Media
Riesgo	Medio
Trazabilidad	Cubre escenario 2 de los criterios de aceptación

Precondiciones:

Usuario autenticado.

Existen bodegas: “Central”, “Norte”, “Sur”.

Datos de Prueba:

Producto: “Semilla Premium”

Bodega principal: “Bodega Central” (100)

Bodega adicional 1: “Bodega Norte” (50)

Bodega adicional 2: “Bodega Sur” (30)

Pasos y Resultados Esperados:

#	Paso	Resultado Esperado	Validación
1	Crear producto con datos básicos	Datos aceptados	UI
2	Seleccionar “Bodega Central” (100) como principal	Correcto	UI
3	Clic en “Agregar Bodega” → Seleccionar “Bodega Norte” (50) → Guardar	Bodega agregada exitosamente	UI
4	Repetir con “Bodega Sur” (30)	Agregada correctamente	UI
5	Clic en “Crear Producto”	Producto creado con tres bodegas	API
6	Validar que el producto aparece con: Central (100), Norte (50), Sur (30)	Correcto	UI/API

Casos negativos / de borde:

Intentar agregar “Bodega Central” como adicional → error “La bodega seleccionada no puede ser la principal”.

Repetir una bodega → error “Bodega ya asignada”.

Ambiente / Dependencias:

Bodegas activas cargadas.

Modal “Agregar Bodega” funcional.

TC-03: Validación de bodega principal requerida
Campo	Valor
ID	TC-HU01-003
Título	Validar error al no seleccionar bodega principal
Prioridad	Alta
Riesgo	Alto
Trazabilidad	Cubre escenario 3 de los criterios de aceptación

Precondiciones:

Usuario autenticado.

Existen bodegas activas.

Datos de Prueba:

Producto: “Abono Verde”

Sin bodega seleccionada.

Pasos y Resultados Esperados:

#	Paso	Resultado Esperado	Validación
1	Acceder a “Crear Producto”	Formulario visible	UI
2	Completar todos los campos excepto la bodega	Campos correctos	UI
3	Clic en “Crear Producto”	Error mostrado “La bodega principal es obligatoria”	UI
4	Validar que el campo bodega se resalta	Se muestra en color de error	UI
5	No se crea producto	Sin registro nuevo en base de datos	API
✅ Checklist de Calidad QA
Ítem	Verificación
🔲	Validaciones de campos requeridos (nombre, unidad, precios, bodega, cantidad)
🔲	Validación numérica en cantidad (solo enteros ≥ 0)
🔲	Prevención de bodegas duplicadas
🔲	Mensajes de error y éxito claros
🔲	Persistencia del producto y bodegas asociadas
🔲	Prueba de API (POST /products, GET /products/:id)
🔲	Validación visual de campos obligatorios en UI
🔲	Casos límite (cantidad = 0, sin bodegas activas, duplicados)
❓ Supuestos y Preguntas para el Product Owner

¿Se permite crear productos sin stock inicial (cantidad = 0)?

¿La validación de bodegas duplicadas se realiza por nombre o ID interno?

¿Qué ocurre si no existen bodegas activas en el sistema al intentar crear un producto?

¿Debe existir control transaccional (rollback) si falla la asignación a una bodega secundaria?

¿Los mensajes de error deben estar localizados (multilenguaje) o solo en español?

# 🧩 Contexto del Sistema

Sistema: Plataforma de gestión de inventarios corporativos
Módulo relevante: Reportes → “Valor de Inventario”
Tipo de usuarios:

Gerente de Inventario (permiso de visualización y exportación de reportes financieros)

Restricciones:

El usuario debe estar autenticado con rol “Gerente de Inventario”.

Los filtros deben soportar selección múltiple.

Los cálculos deben usar el costo promedio actual por producto.

Los valores deben mostrarse en formato de moneda local.

Exportación solo disponible si existe al menos un resultado.

🧪 Casos de Prueba Manuales
TC-HU02-001: Visualización del valor de inventario con filtros simples
Campo	Valor
ID	TC-HU02-001
Título	Visualizar valor de inventario filtrando por una categoría y una bodega
Prioridad	Alta
Riesgo	Medio
Trazabilidad	Cubre escenario 1 de los criterios de aceptación

Precondiciones:

Usuario autenticado como Gerente de Inventario.

Existen productos en el sistema con las siguientes características:

Categoría: “Electrónica”

Bodega: “Bodega Central”

Datos de ejemplo:

Producto	Cantidad	Costo Promedio
Laptop X	10	$3.000
Teclado Y	15	$500

Datos de Prueba:

Categoría seleccionada: “Electrónica”

Bodega seleccionada: “Bodega Central”

Pasos y Resultados Esperados:

#	Paso	Resultado Esperado	Validación
1	Acceder al módulo “Valor de Inventario”	Se visualiza la pantalla con filtros y tabla vacía	UI
2	Seleccionar categoría “Electrónica”	Campo muestra selección correcta	UI
3	Seleccionar bodega “Bodega Central”	Campo muestra selección correcta	UI
4	Clic en “Buscar”	Se consulta API con filtros aplicados	API (GET /inventory/value?category=Electrónica&warehouse=Central)
5	Validar resultados en pantalla	Se muestran los productos correctos (Laptop X, Teclado Y)	UI
6	Validar valor total	Muestra $37.500 (10×3.000 + 15×500)	UI/API
7	Validar stock total	Muestra “25 unidades”	UI
8	Validar formato de moneda	Valores en formato “$xx.xxx”	UI

Casos negativos / de borde:

No existen productos con esos filtros → mensaje “No se encontraron resultados”.

Filtro con cantidad = 0 → producto no debe aparecer.

Ambiente / Dependencias:

API de productos e inventarios disponible.

Base de datos con categorías y bodegas activas.

## TC-HU02-002: Filtrado por múltiples categorías y bodegas
Campo	Valor
ID	TC-HU02-002
Título	Visualizar inventario combinando múltiples categorías y bodegas
Prioridad	Media
Riesgo	Medio
Trazabilidad	Cubre escenario 2 de los criterios de aceptación

Precondiciones:

Usuario autenticado como Gerente de Inventario.

Existen productos en las siguientes combinaciones:

Electrónica → Bodega Central (Laptop X)

Ropa → Bodega Norte (Camisa Y)

Electrónica → Bodega Norte (Audífonos Z)

Datos de Prueba:

Categorías: [“Electrónica”, “Ropa”]

Bodegas: [“Bodega Central”, “Bodega Norte”]

Pasos y Resultados Esperados:

#	Paso	Resultado Esperado	Validación
1	Acceder a módulo “Valor de Inventario”	Interfaz visible	UI
2	Seleccionar categorías “Electrónica”, “Ropa”	Selección múltiple visible	UI
3	Seleccionar bodegas “Central” y “Norte”	Selección múltiple visible	UI
4	Clic en “Buscar”	Consulta generada correctamente	API (GET /inventory/value?category=Electrónica,Ropa&warehouse=Central,Norte)
5	Validar productos mostrados	Solo productos de las categorías y bodegas seleccionadas	UI
6	Validar valor total y unidades	Suma correcta de todos los productos filtrados	UI/API
7	Validar totales (suma = Σ Cantidad × Costo promedio)	Correcto	UI

Casos negativos / de borde:

Si se selecciona una categoría sin productos en ninguna bodega → no debe afectar resultados.

Si se deselecciona una bodega → resultados deben actualizarse dinámicamente.

Ambiente / Dependencias:

Endpoints /categories, /warehouses, /inventory/value activos.

TC-HU02-003: Exportar reporte en PDF
Campo	Valor
ID	TC-HU02-003
Título	Exportar el reporte de valor de inventario a PDF
Prioridad	Alta
Riesgo	Alto
Trazabilidad	Extiende escenarios 1 y 2 (exportación derivada del resultado visualizado)

Precondiciones:

Haber ejecutado una búsqueda válida con resultados.

Pasos y Resultados Esperados:

#	Paso	Resultado Esperado	Validación
1	Clic en “Exportar a PDF”	Sistema genera archivo PDF	UI
2	Validar descarga de archivo	Se descarga valor_inventario.pdf	UI
3	Abrir PDF	Contiene encabezado, filtros aplicados, fecha, totales y tabla de productos	Manual
4	Validar formato	Valores numéricos en formato moneda, totales correctos	Manual
5	Validar coincidencia con vista en pantalla	Datos en PDF = Datos del sistema	Manual / Comparativo

Casos negativos / de borde:

Intentar exportar sin resultados → mensaje “No hay datos para exportar”.

Error de servidor → mensaje “No se pudo generar el archivo. Intente nuevamente”.

Ambiente / Dependencias:

Servicio de generación de PDF funcional.

Conexión estable a API /inventory/value/export/pdf.

✅ Checklist de Calidad QA
Ítem	Verificación
🔲	Cálculo correcto de valor total (Σ cantidad × costo promedio)
🔲	Formato monetario aplicado en UI y PDF
🔲	Filtros permiten selección múltiple y combinada
🔲	Paginación y ordenamiento funcional en tabla
🔲	Mensajes de error y éxito claros y consistentes
🔲	Exportación PDF conserva formato y totales
🔲	Validación de endpoints /inventory/value y /export/pdf
🔲	Rendimiento adecuado (<2s en búsqueda promedio)
❓ Supuestos y Preguntas Abiertas para el Product Owner

¿Debe existir un filtro por rango de fechas o la consulta es siempre en tiempo real?

¿El cálculo del costo promedio se realiza en base al histórico o al último registro?

¿Se espera que la exportación incluya logos corporativos o metadatos del usuario?

¿Qué formato debe usarse para los valores (símbolo $, separador de miles, decimales)?

¿Debe limitarse la cantidad máxima de categorías o bodegas seleccionables?

¿Deseas que te genere también una matriz de trazabilidad (HU → Escenarios → Casos → API/UI) para esta historia? Puedo hacerlo en el mismo estilo para seguimiento en JIRA o TestRail.

🧩 Contexto del Sistema

Sistema: Plataforma de gestión de inventario empresarial.
Módulo relevante: Compras → Facturas de Compra.
Tipo de usuarios:

Operador de Inventario (rol con permisos de registro de compras y actualización de stock).

Restricciones:

Solo usuarios autenticados pueden registrar facturas.

Una factura debe tener al menos un producto.

El proveedor, la fecha, la bodega y el número de factura son campos obligatorios.

Cantidades, precios y descuentos deben ser válidos (no negativos, descuentos ≤ 100%).

La creación de factura debe actualizar el stock en la bodega destino y registrar movimientos tipo “COMPRA”.

🧪 Casos de Prueba Manuales
## TC-HU03-001: Creación de factura de compra con múltiples productos
Campo	Valor
ID	TC-HU03-001
Título	Registrar una factura de compra válida con varios productos
Prioridad	Alta
Riesgo	Alto
Trazabilidad	Cubre escenario 1 (Creación de factura de compra con múltiples productos)

Precondiciones:

Usuario autenticado como Operador de Inventario.

Existen proveedores activos (“Proveedor ABC”).

Existen productos activos (“Camiseta Básica”, “Pantalón Deportivo”).

Existe una bodega activa (“Bodega Central”).

Datos de prueba:

Producto	Cantidad	Precio Unitario	Descuento	Bodega
Camiseta Básica	50	15.00	5%	Bodega Central
Pantalón Deportivo	30	25.00	0%	Bodega Central

Pasos y Resultados Esperados:

#	Paso	Resultado Esperado	Validación
1	Acceder al módulo “Facturas de Compra” y hacer clic en “Nueva Factura”	Se muestra el formulario vacío	UI
2	Seleccionar proveedor “Proveedor ABC”	Campo se llena correctamente	UI
3	Ingresar número “FAC-2024-001”, fecha “20/01/2024”, medio de pago “Efectivo”	Datos aceptados	UI
4	Seleccionar bodega “Bodega Central”	Selección correcta	UI
5	Agregar producto “Camiseta Básica” (50 × 15.00, 5%)	Se calcula subtotal: 50 × 15 = 750; descuento 5% = 37.5; subtotal neto 712.5	UI
6	Agregar producto “Pantalón Deportivo” (30 × 25.00, 0%)	Subtotal: 750.00	UI
7	Validar total factura = 712.5 + 750 = 1,462.5	Total correcto mostrado	UI/API
8	Clic en “Guardar Factura” y confirmar	Factura registrada con estado “Registrada”	API (POST /purchases)
9	Validar actualización de stock	Camiseta +50, Pantalón +30 en “Bodega Central”	API (GET /stock)
10	Validar registro de movimientos tipo “COMPRA”	Dos movimientos generados	API (GET /inventory/movements)
11	Validar mensaje “Factura de compra registrada exitosamente”	Mensaje visible y redirección al detalle	UI

Casos negativos / de borde:

Mismo número de factura duplicado → error “Número de factura ya existente”.

Descuento en blanco → debe asumirse 0%.

Ambiente / Dependencias:

Base de datos con bodegas y productos activos.

APIs /purchases, /stock, /inventory/movements activas.

TC-HU03-002: Validación de campos requeridos
Campo	Valor
ID	TC-HU03-002
Título	Validar errores al omitir campos obligatorios en factura
Prioridad	Alta
Riesgo	Alto
Trazabilidad	Cubre escenario 2 (Validación de campos requeridos en factura de compra)

Precondiciones:

Usuario autenticado como Operador de Inventario.

Datos de prueba:

Proveedor vacío

Número de factura vacío

Sin productos agregados

Pasos y Resultados Esperados:

#	Paso	Resultado Esperado	Validación
1	Acceder al formulario “Nueva Factura de Compra”	Formulario visible	UI
2	Dejar campos obligatorios vacíos y hacer clic en “Guardar Factura”	Campos marcados en rojo	UI
3	Verificar mensajes específicos (“El proveedor es obligatorio”, etc.)	Mensajes visibles	UI
4	Botón “Guardar Factura” deshabilitado	No permite envío	UI
5	Completar todos los campos → verificar que se habilita el botón	Validación correcta	UI

Casos negativos / de borde:

Intentar enviar el formulario vía API con campos nulos → error HTTP 400.

Ambiente / Dependencias:

Validaciones front y backend activas.

TC-HU03-003: Agregar y eliminar productos de la factura
Campo	Valor
ID	TC-HU03-003
Título	Validar agregar y eliminar productos en factura
Prioridad	Media
Riesgo	Medio
Trazabilidad	Cubre escenario 3 (Agregar y eliminar productos en la factura)

Precondiciones:

Factura en edición, con proveedor, fecha y bodega completados.

Datos de prueba:

Producto 1: “Camiseta Básica” (10 × 20.00)

Producto 2: “Pantalón Deportivo” (5 × 25.00)

Pasos y Resultados Esperados:

#	Paso	Resultado Esperado	Validación
1	Hacer clic en “Agregar Producto”	Se muestra selector de productos	UI
2	Buscar “Camiseta” y seleccionarlo	Producto agregado a la tabla	UI
3	Ingresar cantidad 10 y precio 20	Subtotal calculado 200.00	UI
4	Repetir con “Pantalón Deportivo” (5 × 25 = 125.00)	Total factura = 325.00	UI
5	Clic en “Eliminar” sobre “Pantalón Deportivo”	Fila eliminada y total actualizado (200.00)	UI
6	Validar que no queda rastro del producto eliminado	Fila desaparece de tabla	UI

Casos negativos / de borde:

Eliminar el único producto → total = 0, botón “Guardar” deshabilitado.

Ambiente / Dependencias:

API /products y /purchases/temp activas.

TC-HU03-004: Validación de cantidad, precio y descuento
Campo	Valor
ID	TC-HU03-004
Título	Validar reglas numéricas de cantidad, precio y descuento
Prioridad	Alta
Riesgo	Alto
Trazabilidad	Cubre escenario 5 (Validación de cantidad y precios en productos)

Datos de prueba:

Campo	Valor Inválido	Mensaje Esperado
Cantidad	0	“La cantidad debe ser mayor a 0”
Precio	-10	“El precio unitario no puede ser negativo”
Descuento	150	“El descuento no puede superar 100%”
Descuento	-5	“El descuento no puede ser negativo”

Pasos:

Ingresar cada valor inválido en los campos correspondientes.

Verificar mensaje de error.

Intentar guardar la factura.

Resultado esperado:
El sistema bloquea el guardado y resalta el campo en error.

Validación: UI y API (respuestas 400 o 422).

✅ Checklist de Calidad QA
Ítem	Verificación
🔲	Validaciones de campos requeridos (proveedor, fecha, bodega, productos)
🔲	Cálculo correcto de totales y descuentos
🔲	Actualización de stock tras guardar factura
🔲	Registro de movimientos tipo “COMPRA”
🔲	Mensajes de error y éxito consistentes
🔲	Prevención de valores negativos o nulos
🔲	Validación del formato monetario
🔲	Redirección correcta al detalle de factura
❓ Supuestos y Preguntas Abiertas para el Product Owner

¿Se permite repetir el mismo producto más de una vez en la misma factura?

¿El descuento se aplica antes o después de impuestos (si los hubiera)?

¿Qué ocurre si el proveedor está inactivo en el momento de guardar la factura?

¿Se requiere control de concurrencia al actualizar stock si varios usuarios registran facturas simultáneamente?

¿Debe generarse automáticamente un número de factura interno además del número del proveedor?

🧩 Contexto del sistema

Sistema: ERP de gestión comercial

Módulo relevante: Administración → Vendedores

Tipo de usuarios: Administrador del Sistema (rol con permisos de gestión)

Restricciones:

Los campos obligatorios deben validarse en frontend y backend.
El documento de vendedor debe ser único (clave primaria).
Los vendedores inactivos no deben aparecer en listas de selección de facturas.
Persistencia de histórico en base de datos (referencial con facturas).

🧪 Casos de prueba manuales

ID	Título	Prioridad	Riesgo	Criterio de aceptación asociado
TC-04-01	Crear nuevo vendedor con datos válidos	Alta	Alto	“Scenario - Crear un nuevo vendedor”
TC-04-02	Validar documento duplicado al crear vendedor	Alta	Alto	“Scenario - Validación de documento único”
TC-04-03	Editar información de un vendedor existente	Media	Medio	“Scenario - Editar información de un vendedor existente”
TC-04-04	Desactivar vendedor con facturas asociadas	Alta	Alto	“Scenario - Desactivar un vendedor”

🧩 TC-04-01: Crear nuevo vendedor con datos válidos

Precondiciones

Usuario autenticado con rol “Administrador de Sistema”.

No existe un vendedor con documento “12345678”.

Datos de prueba
Campo	Valor
Nombre	Juan Pérez
Documento	12345678
Email	juan.perez@empresa.com
Teléfono	3001234567
Dirección	Calle 123 #45-67
Pasos y resultados esperados

#	Paso	Resultado esperado	Validación
1	Acceder al módulo “Vendedores”.	Se visualiza la lista actual de vendedores.	UI
2	Hacer clic en “Nuevo Vendedor”.	Se muestra el formulario vacío.	UI
3	Completar los campos con los datos válidos.	Todos los campos muestran formato válido.	UI
4	Hacer clic en “Guardar”.	Sistema valida campos requeridos, formato de email y unicidad del documento.	API/UI
5	Confirmar creación exitosa.	Mensaje “Vendedor creado exitosamente”. Vendedor aparece en la lista con estado “Activo”.	UI
6	Revisar disponibilidad en facturación.	En módulo de facturas, “Juan Pérez” aparece como opción en campo “Vendedor”.	UI

Casos negativos / borde
Email sin “@” → error de formato.
Documento vacío → error requerido.
Ambiente: QA / base de datos limpia
Dependencias: API /vendedores (POST, GET)

🧩 TC-04-02: Validar documento duplicado al crear vendedor

Precondiciones

Usuario autenticado con rol “Administrador de Sistema”.
Existe vendedor con documento “12345678”.

Datos de prueba
Campo	Valor
Nombre	Juan Gómez
Documento	12345678
Email	juan.gomez@empresa.com
Teléfono	3019999999
Dirección	Calle 55 #10-10

Pasos
#	Paso	Resultado esperado	Validación
1	Ingresar al módulo “Vendedores” → “Nuevo Vendedor”.	Formulario visible.	UI
2	Completar campos con documento ya existente.	Sin errores iniciales.	UI
3	Hacer clic en “Guardar”.	Sistema detecta duplicado y muestra mensaje “Ya existe un vendedor con este documento”. Campo “Documento” resaltado en rojo.	API/UI
4	Intentar guardar nuevamente sin cambiar el documento.	No se crea registro duplicado.	BD/API

Casos negativos / borde

Documento con espacios o guiones → validar normalización.
Documento con caracteres no numéricos → error de validación.

## 🧩 TC-04-03: Editar información de un vendedor existente

Precondiciones
Usuario autenticado.
Existe “Juan Pérez” con documento “12345678”.
Datos de prueba
Campo	Valor anterior	Valor nuevo
Email	juan.perez@empresa.com	juan.perez.nuevo@empresa.com
Teléfono	3001234567	3009876543

Pasos
#	Paso	Resultado esperado	Validación
1	Acceder al módulo “Vendedores”.	Lista visible.	UI
2	Hacer clic en “Editar” del vendedor “Juan Pérez”.	Se abre formulario con datos actuales.	UI
3	Modificar email y teléfono.	Campos actualizados en formulario.	UI
4	Hacer clic en “Guardar Cambios”.	Validación de formato de email, documento inmutable.	API/UI
5	Confirmar mensaje “Vendedor actualizado exitosamente”.	Lista refleja nuevos datos.	UI
6	Consultar factura donde aparezca el vendedor.	Factura muestra el email/telefono actualizado.	API/UI

Casos negativos / borde
Email inválido → error “Formato de correo no válido”.
Intentar cambiar documento → campo bloqueado.

🧩 TC-04-04: Desactivar vendedor con facturas asociadas

Precondiciones
Usuario autenticado.
Vendedor “Juan Pérez” activo con facturas en histórico.

Pasos
#	Paso	Resultado esperado	Validación
1	Acceder a “Vendedores”.	Lista visible.	UI
2	Hacer clic en “Desactivar” junto a “Juan Pérez”.	Se muestra cuadro de confirmación.	UI
3	Confirmar acción.	Estado cambia a “Inactivo”. Mensaje “Vendedor desactivado exitosamente”.	UI/API
4	Revisar módulo de facturas.	“Juan Pérez” no aparece en lista de selección.	UI
5	Consultar factura histórica.	Factura mantiene referencia al vendedor (información preservada).	API/BD

Casos negativos / borde

Cancelar en confirmación → no cambia estado.
Intentar crear factura con vendedor inactivo → error esperado.

✅ Checklist de calidad del QA
Criterio	Verificado
Validaciones de frontend (campos obligatorios, formatos)	☐
Validaciones backend (unicidad, integridad referencial)	☐
Mensajes de éxito/error coherentes con guías de UX	☐
Cambios reflejados inmediatamente en UI (sin refrescar)	☐
Persistencia en base de datos confirmada	☐
No se pierden datos históricos (facturas referenciadas)	☐
Diferenciación visual de estados (Activo/Inactivo)	☐
Cobertura de escenarios negativos	☐

🧩 Contexto del sistema

Sistema: ERP de Gestión de Inventario
Módulo relevante: Inventario → Historial de Movimientos
Tipo de usuarios: Operador de Inventario (rol autenticado con permisos de lectura)

Restricciones:

El sistema debe soportar grandes volúmenes de datos con paginación y ordenamiento.
Los filtros pueden combinarse entre sí (fecha, tipo, bodega, producto).
Debe haber búsqueda reactiva (debounce ≤ 500 ms).
La API /movimientos debe devolver resultados paginados y filtrados.

🧪 Casos de prueba manuales

ID	Título	Prioridad	Riesgo	Criterio de aceptación asociado
TC-05-01	Consultar historial de movimientos inicial	Alta	Medio	“Scenario: Consultar historial de movimientos con filtros básicos”
TC-05-02	Filtrar movimientos por fecha específica	Alta	Alto	“Scenario: Filtrar movimientos por fecha específica”
TC-05-03	Filtrar movimientos por tipo de movimiento	Media	Medio	“Scenario: Filtrar movimientos por tipo”
TC-05-04	Combinación múltiple de filtros (fecha + tipo + bodega + producto)	Alta	Alto	“Scenario: Combinar múltiples filtros”

🧩 TC-05-01: Consultar historial de movimientos inicial

Precondiciones

Usuario autenticado como “Operador de Inventario”.
Existen movimientos registrados en la base de datos.

Pasos y resultados esperados
#	Paso	Resultado esperado	Validación
1	Acceder al módulo “Historial de Movimientos”.	Se muestra tabla con los movimientos más recientes.	UI/API
2	Verificar columnas visibles.	Se muestran: Fecha, Tipo, Bodega, Producto, Cantidad, Observación.	UI
3	Revisar contador de resultados.	Muestra el total de movimientos (ej: “Mostrando 1–20 de 250”).	UI
4	Validar paginación.	Aparecen controles “Anterior / Siguiente” y selector de items por página.	UI
5	Verificar botón “Filtros”.	Al hacer clic, se despliega panel de filtros.	UI

Casos negativos / borde

No existen movimientos → mensaje “No se encontraron movimientos”.
Error API → mostrar mensaje de error controlado (sin romper UI).
Ambiente: QA
Dependencias: API /movimientos?limit=20&page=1

🧩 TC-05-02: Filtrar movimientos por fecha específica

Precondiciones
Usuario autenticado.
Existen movimientos registrados en diferentes fechas.
Datos de prueba
Campo	Valor
Fecha filtro	15/01/2024

Pasos
#	Paso	Resultado esperado	Validación
1	Ingresar a “Historial de Movimientos”.	Tabla visible.	UI
2	Hacer clic en “Filtros”.	Panel de filtros se abre.	UI
3	Seleccionar fecha “15/01/2024”.	Filtro cargado correctamente.	UI
4	Hacer clic en “Aplicar Filtros”.	Se envía petición a API con parámetro fecha=2024-01-15.	API
5	Validar tabla.	Solo se muestran movimientos con esa fecha.	UI/API
6	Revisar contador.	Muestra número exacto de coincidencias.	UI
7	Si no hay resultados.	Muestra mensaje “No se encontraron movimientos para la fecha seleccionada”.	UI

Casos negativos / borde

Fecha futura sin registros → mensaje vacío.
Fecha inválida → error de validación.
Ambiente: QA
Dependencias: API /movimientos?fecha=2024-01-15

🧩 TC-05-03: Filtrar movimientos por tipo de movimiento

Precondiciones
Usuario autenticado.
Existen movimientos de tipo “Compra”, “Venta” y “Ajuste”.
Datos de prueba
Campo	Valor
Tipo filtro	Compra / Venta / Todos

Pasos
#	Paso	Resultado esperado	Validación
1	Acceder al módulo “Historial de Movimientos”.	Tabla cargada.	UI
2	Abrir panel de filtros.	Visible.	UI
3	Seleccionar tipo “Compra”.	Campo tipo = Compra.	UI
4	Aplicar filtros.	Tabla muestra solo compras, con badge verde “Compra”.	UI/API
5	Cambiar tipo a “Venta”.	Tabla muestra solo ventas, con badge rojo o correspondiente.	UI/API
6	Seleccionar “Todos”.	Tabla muestra todos los tipos.	UI
Casos negativos / borde
No existen movimientos del tipo → mensaje “No se encontraron movimientos”.
Cambio rápido de filtro → validar debounce funcional (no recarga excesiva).
Ambiente: QA
Dependencias: API /movimientos?tipo=compra

## 🧩 TC-05-04: Combinación múltiple de filtros (fecha + tipo + bodega + producto)

Precondiciones
Usuario autenticado.
Existen registros que cumplen y no cumplen la combinación de filtros.
Datos de prueba
Campo	Valor
Fecha	15/01/2024
Tipo	Compra
Bodega	Bodega Central
Producto	Camiseta

Pasos
#	Paso	Resultado esperado	Validación
1	Acceder al módulo “Historial de Movimientos”.	Tabla inicial cargada.	UI
2	Abrir “Filtros”.	Panel visible.	UI
3	Completar filtros con los valores indicados.	Filtros visibles con resumen.	UI
4	Hacer clic en “Aplicar Filtros”.	Se realiza petición a API con todos los parámetros combinados.	API
5	Verificar resultados.	Solo se muestran movimientos que cumplen todos los criterios.	UI/API
6	Revisar contador de resultados.	Actualizado correctamente.	UI
7	Hacer clic en “Limpiar Filtros”.	Se eliminan todos los filtros, tabla vuelve a estado inicial.	UI

Casos negativos / borde

No existen coincidencias → mensaje de “sin resultados”.
Filtro combinado incompatible (ej. producto sin registro en esa bodega) → respuesta vacía.
Búsqueda parcial de producto (“Camis”) → resultados con coincidencias parciales.
Ambiente: QA
Dependencias: API /movimientos?fecha=2024-01-15&tipo=compra&bodega=central&producto=camiseta

✅ Checklist de calidad del QA

Criterio	Verificado
Campos y filtros cargan con valores por defecto	☐
Filtros aplican correctamente y combinan resultados	☐
Paginación y ordenamiento se mantienen al cambiar filtros	☐
Mensajes de “sin resultados” visibles y coherentes	☐
API responde con datos correctos según parámetros enviados	☐
Orden visual consistente (badges, columnas, fechas)	☐
Desempeño aceptable (<2s por consulta)	☐
Búsqueda reactiva con debounce ≤500 ms	☐