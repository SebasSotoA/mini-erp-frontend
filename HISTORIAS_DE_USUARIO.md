# Historias de Usuario - Mini-SCM de Inventario

---

# Historia de Usuario 1

**Como:** Administrador de Inventario

**Quiero:** Registrar productos en bodegas con cantidades iniciales

**Para:** Mantener un control preciso del inventario distribuido en múltiples ubicaciones desde la creación del producto

**Descripción:**

El sistema debe permitir a los administradores crear productos y asignarlos a una o múltiples bodegas con cantidades iniciales. Al crear un producto, se debe seleccionar una bodega principal obligatoria y opcionalmente agregar bodegas adicionales, cada una con su cantidad inicial, cantidad mínima y máxima. Esta funcionalidad es esencial para establecer la distribución inicial del inventario cuando se registra un nuevo producto en el sistema.

**Criterios de aceptación (Gherkin):**

Scenario: Crear producto con bodega principal y cantidad inicial

Given que soy un Administrador de Inventario autenticado

And que accedo al módulo de creación de productos

And que existen bodegas activas en el sistema

When completo los datos básicos del producto (nombre, unidad de medida, precio base, impuesto, precio total, costo inicial)

And selecciono la bodega principal "Bodega Central"

And ingreso la cantidad inicial "100" en la bodega principal

And hago clic en el botón "Crear Producto"

Then el sistema debe validar que todos los campos requeridos están completos

And debe validar que la cantidad inicial es un número entero (sin decimales) mayor o igual a cero

And debe crear el producto exitosamente

And debe asociar el producto a la bodega principal "Bodega Central" con 100 unidades

And debe mostrar un mensaje de éxito "Producto creado exitosamente"

And el producto debe aparecer en la lista de productos con el stock correcto en la bodega principal



Scenario: Agregar bodegas adicionales al crear un producto

Given que soy un Administrador de Inventario autenticado

And que estoy creando un nuevo producto

And que he seleccionado la bodega principal "Bodega Central" con cantidad inicial "100"

And que existen otras bodegas activas en el sistema ("Bodega Norte", "Bodega Sur")

When hago clic en el botón "Agregar Bodega"

And selecciono la bodega "Bodega Norte"

And ingreso la cantidad inicial "50"

And hago clic en el botón "Guardar" del modal de bodega

Then el sistema debe validar que la bodega seleccionada no es la misma que la bodega principal

And debe agregar "Bodega Norte" a la lista de bodegas adicionales

And debe mostrar un mensaje de éxito "Bodega agregada exitosamente"

When agrego otra bodega "Bodega Sur" con cantidad inicial "30"

And hago clic en "Crear Producto"

Then el sistema debe crear el producto

And debe asociar el producto a las tres bodegas: "Bodega Central" (100 unidades), "Bodega Norte" (50 unidades), y "Bodega Sur" (30 unidades)



Scenario: Validación de bodega principal requerida

Given que soy un Administrador de Inventario autenticado

And que estoy creando un nuevo producto

And que he completado los demás campos requeridos (nombre, unidad, precios, cantidad, costo)

When intento crear el producto sin seleccionar una bodega principal

Then el sistema debe mostrar un mensaje de error "La bodega principal es obligatoria"

And debe resaltar visualmente el campo de bodega principal como error

And no debe permitir crear el producto hasta que se seleccione una bodega principal



Scenario: Validación de cantidad inicial inválida

Given que soy un Administrador de Inventario autenticado

And que estoy creando un nuevo producto

And que he seleccionado la bodega principal "Bodega Central"

When ingreso una cantidad inicial con decimales (ej: "100.5")

Or ingreso una cantidad negativa (ej: "-10")

Or dejo el campo de cantidad inicial vacío

And intento crear el producto

Then el sistema debe mostrar un mensaje de error específico según el caso:

- Si tiene decimales: "La cantidad inicial debe ser un número entero (sin decimales)"

- Si es negativa: "La cantidad inicial debe ser mayor o igual a cero"

- Si está vacía: "La cantidad inicial es requerida"

And no debe permitir crear el producto hasta que la cantidad sea válida



Scenario: Validación de bodegas duplicadas

Given que soy un Administrador de Inventario autenticado

And que estoy creando un nuevo producto

And que he seleccionado la bodega principal "Bodega Central"

When intento agregar "Bodega Central" como bodega adicional

Then el sistema debe mostrar un mensaje de error "La bodega ya está configurada como bodega principal"

And no debe permitir agregar la bodega duplicada

When intento agregar "Bodega Norte" como bodega adicional

And luego intento agregar "Bodega Norte" nuevamente

Then el sistema debe mostrar un mensaje de error "La bodega ya está agregada en la lista de bodegas adicionales"

And no debe permitir agregar la bodega duplicada



Scenario: Eliminar bodega adicional antes de guardar

Given que soy un Administrador de Inventario autenticado

And que estoy creando un nuevo producto

And que he agregado la bodega "Bodega Norte" como bodega adicional con cantidad inicial "50"

When hago clic en el botón "Eliminar" de la bodega "Bodega Norte"

Then el sistema debe eliminar la bodega de la lista de bodegas adicionales

And debe mostrar un mensaje de éxito "Bodega eliminada de la lista"

And la bodega "Bodega Norte" debe volver a estar disponible para ser agregada nuevamente



Scenario: Validación de rangos de cantidad

Given que soy un Administrador de Inventario autenticado

And que estoy creando un nuevo producto

And que he seleccionado la bodega principal "Bodega Central" con cantidad inicial "100"

When ingreso una cantidad mínima "150" (mayor que la inicial)

Or ingreso una cantidad máxima "50" (menor que la inicial)

And intento crear el producto

Then el sistema debe validar que la cantidad mínima sea menor o igual que la cantidad inicial

And debe validar que la cantidad máxima sea mayor o igual que la cantidad inicial

And debe mostrar mensajes de error apropiados si los rangos son inconsistentes

And no debe permitir crear el producto hasta que los rangos sean válidos



Scenario: Crear nueva bodega desde el formulario de producto

Given que soy un Administrador de Inventario autenticado

And que estoy creando un nuevo producto

And que necesito una bodega que no existe en el sistema

When hago clic en la opción "Crear nueva bodega" en el selector de bodega principal

Then el sistema debe mostrar un modal para crear una nueva bodega

And el modal debe incluir campos para: nombre de la bodega (requerido), dirección (opcional), observaciones (opcional)

When completo el nombre de la bodega "Bodega Nueva"

And hago clic en "Guardar"

Then el sistema debe crear la nueva bodega

And debe seleccionar automáticamente la bodega recién creada como bodega principal

And debe mostrar un mensaje de éxito "Bodega creada exitosamente"

---

# Historia de Usuario 2

**Como:** Gerente de Inventario

**Quiero:** Visualizar reportes de valor de inventario filtrados por fecha y bodega

**Para:** Tomar decisiones financieras informadas sobre el stock disponible

**Descripción:**

El sistema debe permitir a los gerentes consultar el valor total del inventario en un momento específico, filtrando por fecha y bodega. Debe mostrar métricas financieras clave, una tabla detallada de productos con sus valores, y permitir exportar esta información en formatos Excel o PDF para análisis externo.

**Criterios de aceptación (Gherkin):**

Scenario: Visualización del valor de inventario con filtros por fecha y bodega

Given que soy un Gerente de Inventario autenticado

And que accedo al módulo "Valor de Inventario"

And que existen productos en el sistema con movimientos registrados

When selecciono la fecha "15/01/2024" en el filtro "Hasta"

And selecciono la bodega "Bodega Central" en el filtro de bodegas

And hago clic en el botón "Aplicar Filtros"

Then el sistema debe calcular el valor del inventario hasta esa fecha

And debe mostrar el valor total del inventario en formato de moneda (ej: "$50.000")

And debe mostrar el stock total de unidades (ej: "125 unidades")

And debe mostrar una tabla con los productos de esa bodega que existían hasta esa fecha

And cada fila de la tabla debe mostrar: Nombre del producto, Referencia/SKU, Descripción, Cantidad, Unidad, Estado, Costo promedio, y Total

And el valor total debe ser la suma de (Cantidad × Costo promedio) de todos los productos filtrados



Scenario: Filtrado por todas las bodegas con distribución porcentual

Given que soy un Gerente de Inventario autenticado

And que accedo al módulo "Valor de Inventario"

And que existen productos en múltiples bodegas

When selecciono "Todas las bodegas" en el filtro de bodegas

And aplico los filtros

Then el sistema debe mostrar el valor total del inventario de todas las bodegas

And debe mostrar el stock total de todas las bodegas

And debe mostrar una distribución porcentual del valor por bodega (ej: "Bodega Central: 70%, Bodega Norte: 30%")

And la tabla debe incluir productos de todas las bodegas

And cada fila debe indicar en qué bodega se encuentra el producto



Scenario: Búsqueda de productos en la tabla de inventario

Given que soy un Gerente de Inventario autenticado

And que estoy visualizando la tabla de valor de inventario con productos filtrados

When ingreso el texto "Camiseta" en el campo de búsqueda

Then el sistema debe filtrar la tabla en tiempo real

And debe mostrar solo los productos cuyo nombre o referencia contenga "Camiseta"

And debe actualizar el contador de resultados mostrando cuántos productos coinciden

And si no hay coincidencias, debe mostrar el mensaje "No se encontraron productos que coincidan con la búsqueda"



Scenario: Exportación del reporte a Excel

Given que soy un Gerente de Inventario autenticado

And que he aplicado filtros de fecha y bodega en el módulo "Valor de Inventario"

And que estoy visualizando la tabla de productos con los datos filtrados

When hago clic en el botón "Exportar a Excel"

Then el sistema debe generar un archivo Excel (.xlsx)

And el archivo debe incluir todas las columnas de la tabla: Nombre, Referencia, Descripción, Cantidad, Unidad, Estado, Costo promedio, Total

And el archivo debe incluir los productos que cumplen con los filtros aplicados

And el archivo debe incluir una hoja de resumen con: Fecha del reporte, Bodega(s) filtrada(s), Valor total, Stock total

And el archivo debe descargarse automáticamente con un nombre descriptivo (ej: "Reporte_Inventario_2024-01-15_BodegaCentral.xlsx")



Scenario: Exportación del reporte a PDF

Given que soy un Gerente de Inventario autenticado

And que he aplicado filtros de fecha y bodega en el módulo "Valor de Inventario"

And que estoy visualizando la tabla de productos con los datos filtrados

When hago clic en el botón "Exportar a PDF"

Then el sistema debe generar un archivo PDF

And el PDF debe incluir un encabezado con: Título "Reporte de Valor de Inventario", Fecha del reporte, Bodega(s) filtrada(s)

And el PDF debe incluir una sección de resumen con: Valor total, Stock total, Número de productos

And el PDF debe incluir una tabla con todas las columnas: Nombre, Referencia, Descripción, Cantidad, Unidad, Estado, Costo promedio, Total

And el PDF debe incluir un pie de página con: Fecha de generación, Página X de Y

And el archivo debe descargarse automáticamente con un nombre descriptivo (ej: "Reporte_Inventario_2024-01-15_BodegaCentral.pdf")



Scenario: Validación de fecha futura

Given que soy un Gerente de Inventario autenticado

And que estoy en el módulo "Valor de Inventario"

When selecciono una fecha futura en el filtro "Hasta"

And aplico los filtros

Then el sistema debe mostrar un mensaje de advertencia "No se puede consultar el inventario de una fecha futura"

And debe sugerir seleccionar una fecha igual o anterior a la fecha actual

And no debe realizar el cálculo del inventario

---

# Historia de Usuario 3

**Como:** Operador de Inventario

**Quiero:** Registrar facturas de compra con múltiples productos y proveedores

**Para:** Mantener un registro completo de las adquisiciones de inventario

**Descripción:**

El sistema debe permitir a los operadores crear facturas de compra que incluyan múltiples productos, asociadas a un proveedor específico. Al registrar una factura de compra, el sistema debe actualizar automáticamente el stock de los productos en la bodega correspondiente y registrar los movimientos de inventario.

**Criterios de aceptación (Gherkin):**

Scenario: Creación de factura de compra con múltiples productos

Given que soy un Operador de Inventario autenticado

And que accedo al módulo "Facturas de Compra"

And que existen proveedores activos en el sistema

And que existen productos y bodegas en el sistema

When hago clic en el botón "Nueva Factura de Compra"

And selecciono el proveedor "Proveedor ABC"

And ingreso el número de factura "FAC-2024-001"

And selecciono la fecha de compra "20/01/2024"

And selecciono la bodega destino "Bodega Central"

And selecciono el medio de pago "Efectivo"

And agrego el producto "Camiseta Básica" con cantidad "50", precio unitario "15.00" y descuento "5%"

And agrego el producto "Pantalón Deportivo" con cantidad "30", precio unitario "25.00" y descuento "0%"

And agrego una observación "Compra para temporada de verano"

And hago clic en el botón "Guardar Factura"

Then el sistema debe validar que todos los campos requeridos están completos

And debe calcular el subtotal de cada producto (cantidad × precio unitario)

And debe aplicar el descuento a cada producto si corresponde

And debe calcular el total de la factura (suma de subtotales con descuentos)

When confirmo la creación de la factura

Then el sistema debe guardar la factura de compra con estado "Registrada"

And debe actualizar el stock de "Camiseta Básica" en "Bodega Central" aumentando 50 unidades

And debe actualizar el stock de "Pantalón Deportivo" en "Bodega Central" aumentando 30 unidades

And debe registrar 2 movimientos de inventario tipo "COMPRA" (uno por cada producto)

And debe mostrar un mensaje de éxito "Factura de compra registrada exitosamente"

And debe redirigir a la página de detalle de la factura creada



Scenario: Validación de campos requeridos en factura de compra

Given que soy un Operador de Inventario autenticado

And que estoy en el formulario de nueva factura de compra

When intento guardar la factura sin seleccionar proveedor

Or sin ingresar número de factura

Or sin seleccionar fecha

Or sin seleccionar bodega

Or sin agregar al menos un producto

Then el sistema debe mostrar mensajes de validación específicos para cada campo faltante

And el botón "Guardar Factura" debe estar deshabilitado

And debe resaltar visualmente los campos con error

And no debe permitir el envío del formulario hasta que todos los campos requeridos estén completos



Scenario: Agregar y eliminar productos en la factura

Given que soy un Operador de Inventario autenticado

And que estoy creando una nueva factura de compra

And que he completado los datos básicos de la factura (proveedor, fecha, bodega)

When hago clic en el botón "Agregar Producto"

Then el sistema debe mostrar un selector de productos

And debo poder buscar productos por nombre o SKU

And debo poder seleccionar un producto de la lista

And al seleccionar un producto, debe agregarse una fila en la tabla de productos

And la fila debe incluir campos para: cantidad, precio unitario, descuento (opcional)

And debe calcular automáticamente el subtotal de la fila

And debe actualizar el total de la factura

When hago clic en el botón "Eliminar" de una fila de producto

Then el sistema debe eliminar el producto de la factura

And debe actualizar el total de la factura restando el subtotal del producto eliminado



Scenario: Cálculo automático de totales con descuentos

Given que soy un Operador de Inventario autenticado

And que estoy creando una nueva factura de compra

And que he agregado el producto "Camiseta Básica" con cantidad "100" y precio unitario "20.00"

When ingreso un descuento del "10%" para ese producto

Then el sistema debe calcular el subtotal sin descuento: 100 × 20.00 = 2000.00

And debe calcular el monto del descuento: 2000.00 × 10% = 200.00

And debe calcular el subtotal con descuento: 2000.00 - 200.00 = 1800.00

And debe mostrar estos valores en la fila del producto

And debe actualizar el total de la factura incluyendo el descuento aplicado

When agrego otro producto "Pantalón" con cantidad "50", precio "30.00" y sin descuento

Then el sistema debe calcular el subtotal: 50 × 30.00 = 1500.00

And el total de la factura debe ser: 1800.00 + 1500.00 = 3300.00



Scenario: Validación de cantidad y precios en productos

Given que soy un Operador de Inventario autenticado

And que estoy creando una nueva factura de compra

And que he agregado un producto a la factura

When ingreso una cantidad de "0" o un valor negativo

Or ingreso un precio unitario de "0" o un valor negativo

Or ingreso un descuento mayor al "100%"

Or ingreso un descuento negativo

Then el sistema debe mostrar un mensaje de error específico para cada caso

And debe impedir guardar la factura hasta que los valores sean válidos

And debe resaltar visualmente el campo con error



Scenario: Visualización de factura de compra creada

Given que soy un Operador de Inventario autenticado

And que existe una factura de compra registrada en el sistema

When accedo a la lista de facturas de compra

And hago clic en una factura de la lista

Then el sistema debe mostrar la página de detalle de la factura

And debe mostrar: número de factura, proveedor, fecha, bodega, medio de pago, estado

And debe mostrar una tabla con todos los productos incluidos en la factura

And cada fila debe mostrar: nombre del producto, cantidad, precio unitario, descuento, subtotal

And debe mostrar los totales: subtotal, descuentos totales, total de la factura

And debe mostrar la observación si fue ingresada

And debe mostrar la fecha de creación y última actualización

And debe mostrar un botón para imprimir o exportar la factura

---

# Historia de Usuario 4

**Como:** Administrador de Sistema

**Quiero:** Gestionar vendedores (activar, desactivar y editar información)

**Para:** Mantener actualizada la información del equipo de ventas y controlar quién puede registrar ventas en el sistema

**Descripción:**

El sistema debe permitir a los administradores crear, editar, activar y desactivar vendedores. Los vendedores activos deben estar disponibles para ser asignados a facturas de venta, mientras que los vendedores inactivos no deben aparecer en las listas de selección pero su información histórica debe preservarse.

**Criterios de aceptación (Gherkin):**

Scenario: Crear un nuevo vendedor

Given que soy un Administrador de Sistema autenticado

And que accedo al módulo "Vendedores"

And que no existe un vendedor con el documento "12345678"

When hago clic en el botón "Nuevo Vendedor"

And completo el formulario con: Nombre "Juan Pérez", Documento "12345678", Email "juan.perez@empresa.com", Teléfono "3001234567", Dirección "Calle 123 #45-67"

And hago clic en el botón "Guardar"

Then el sistema debe validar que todos los campos requeridos están completos

And debe validar que el documento no existe en el sistema

And debe validar el formato del email

And debe crear el vendedor con estado "Activo" por defecto

And debe mostrar un mensaje de éxito "Vendedor creado exitosamente"

And el vendedor debe aparecer en la lista de vendedores

And el vendedor debe estar disponible para ser asignado a facturas de venta



Scenario: Editar información de un vendedor existente

Given que soy un Administrador de Sistema autenticado

And que existe un vendedor "Juan Pérez" con documento "12345678" en el sistema

When accedo a la lista de vendedores

And hago clic en el botón "Editar" del vendedor "Juan Pérez"

And modifico el email a "juan.perez.nuevo@empresa.com"

And modifico el teléfono a "3009876543"

And hago clic en el botón "Guardar Cambios"

Then el sistema debe validar que el nuevo email tiene un formato válido

And debe actualizar la información del vendedor

And debe preservar el documento (que es el identificador único)

And debe mostrar un mensaje de éxito "Vendedor actualizado exitosamente"

And los cambios deben reflejarse inmediatamente en la lista de vendedores

And si el vendedor está asignado a facturas de venta, la información actualizada debe verse en esas facturas



Scenario: Desactivar un vendedor

Given que soy un Administrador de Sistema autenticado

And que existe un vendedor activo "Juan Pérez" en el sistema

And que el vendedor tiene facturas de venta asociadas en el historial

When accedo a la lista de vendedores

And hago clic en el botón "Desactivar" del vendedor "Juan Pérez"

And confirmo la acción en el diálogo de confirmación

Then el sistema debe cambiar el estado del vendedor a "Inactivo"

And debe mostrar un mensaje de éxito "Vendedor desactivado exitosamente"

And el vendedor no debe aparecer en la lista de vendedores activos para nuevas facturas de venta

And las facturas de venta históricas asociadas al vendedor deben mantener la referencia al vendedor

And la información del vendedor debe preservarse en el sistema



Scenario: Activar un vendedor previamente desactivado

Given que soy un Administrador de Sistema autenticado

And que existe un vendedor inactivo "Juan Pérez" en el sistema

When accedo a la lista de vendedores

And activo el filtro para mostrar vendedores inactivos

And hago clic en el botón "Activar" del vendedor "Juan Pérez"

And confirmo la acción

Then el sistema debe cambiar el estado del vendedor a "Activo"

And debe mostrar un mensaje de éxito "Vendedor activado exitosamente"

And el vendedor debe aparecer en la lista de vendedores activos

And el vendedor debe estar disponible para ser asignado a nuevas facturas de venta



Scenario: Validación de documento único

Given que soy un Administrador de Sistema autenticado

And que existe un vendedor con documento "12345678" en el sistema

When intento crear un nuevo vendedor con el mismo documento "12345678"

And completo los demás campos requeridos

And hago clic en el botón "Guardar"

Then el sistema debe validar que el documento ya existe

And debe mostrar un mensaje de error "Ya existe un vendedor con este documento"

And no debe crear el vendedor duplicado

And debe resaltar el campo de documento como error

And debe permitir corregir el documento y volver a intentar



Scenario: Filtrado de vendedores activos e inactivos

Given que soy un Administrador de Sistema autenticado

And que existen vendedores activos e inactivos en el sistema

When accedo al módulo "Vendedores"

And visualizo la lista de vendedores por defecto

Then el sistema debe mostrar solo los vendedores activos

When activo el filtro "Mostrar todos" o "Incluir inactivos"

Then el sistema debe mostrar todos los vendedores (activos e inactivos)

And debe diferenciar visualmente los vendedores inactivos (ej: texto atenuado, badge de estado)

When estoy en el formulario de creación de factura de venta

And selecciono el campo "Vendedor"

Then el sistema debe mostrar solo los vendedores activos en la lista desplegable

And no debe mostrar los vendedores inactivos



Scenario: Búsqueda de vendedores

Given que soy un Administrador de Sistema autenticado

And que existen múltiples vendedores en el sistema

When accedo al módulo "Vendedores"

And ingreso el texto "Juan" en el campo de búsqueda

Then el sistema debe filtrar la lista en tiempo real

And debe mostrar solo los vendedores cuyo nombre o documento contenga "Juan"

And debe actualizar el contador de resultados

And si no hay coincidencias, debe mostrar el mensaje "No se encontraron vendedores que coincidan con la búsqueda"

When limpio el campo de búsqueda

Then el sistema debe mostrar todos los vendedores nuevamente

---

# Historia de Usuario 5

**Como:** Operador de Inventario

**Quiero:** Consultar el historial de movimientos de inventario con filtros avanzados (fecha, tipo, bodega, producto)

**Para:** Realizar auditorías y seguimiento de las transacciones de stock

**Descripción:**

El sistema debe permitir a los operadores consultar todos los movimientos de inventario registrados en el sistema, con la capacidad de filtrar por fecha, tipo de movimiento (compra, venta, ajuste, transferencia), bodega y producto. Debe incluir paginación, ordenamiento y búsqueda para facilitar la consulta de grandes volúmenes de datos.

**Criterios de aceptación (Gherkin):**

Scenario: Consultar historial de movimientos con filtros básicos

Given que soy un Operador de Inventario autenticado

And que accedo al módulo "Historial de Movimientos"

And que existen movimientos de inventario registrados en el sistema

When visualizo la página de historial de movimientos

Then el sistema debe mostrar una tabla con los movimientos más recientes

And cada fila debe mostrar: Fecha, Tipo de movimiento, Bodega, Producto, Cantidad, Observación

And debe mostrar el total de movimientos registrados

And debe mostrar controles de paginación en la parte inferior

And debe mostrar un botón "Filtros" para abrir/cerrar el panel de filtros



Scenario: Filtrar movimientos por fecha específica

Given que soy un Operador de Inventario autenticado

And que estoy en el módulo "Historial de Movimientos"

And que existen movimientos registrados en diferentes fechas

When hago clic en el botón "Filtros"

And selecciono la fecha "15/01/2024" en el filtro de fecha

And hago clic en "Aplicar Filtros"

Then el sistema debe mostrar solo los movimientos registrados el 15/01/2024

And debe actualizar el contador de resultados mostrando cuántos movimientos coinciden

And debe mostrar los movimientos ordenados por hora (más recientes primero)

And si no hay movimientos en esa fecha, debe mostrar el mensaje "No se encontraron movimientos para la fecha seleccionada"



Scenario: Filtrar movimientos por tipo

Given que soy un Operador de Inventario autenticado

And que estoy en el módulo "Historial de Movimientos"

And que existen movimientos de tipo "Compra", "Venta" y "Ajuste" en el sistema

When hago clic en el botón "Filtros"

And selecciono "Compra" en el filtro de tipo de movimiento

And aplico los filtros

Then el sistema debe mostrar solo los movimientos de tipo "Compra"

And debe mostrar los movimientos con un indicador visual del tipo (ej: badge verde para compras)

And debe actualizar el contador de resultados

When cambio el filtro a "Venta"

Then el sistema debe mostrar solo los movimientos de tipo "Venta"

When selecciono "Todos"

Then el sistema debe mostrar todos los tipos de movimientos



Scenario: Filtrar movimientos por bodega

Given que soy un Operador de Inventario autenticado

And que estoy en el módulo "Historial de Movimientos"

And que existen movimientos en múltiples bodegas

When hago clic en el botón "Filtros"

And selecciono "Bodega Central" en el filtro de bodega

And aplico los filtros

Then el sistema debe mostrar solo los movimientos de "Bodega Central"

And cada movimiento mostrado debe indicar "Bodega Central" en la columna de bodega

And debe actualizar el contador de resultados

When selecciono "Todas las bodegas"

Then el sistema debe mostrar movimientos de todas las bodegas



Scenario: Buscar movimientos por nombre de producto

Given que soy un Operador de Inventario autenticado

And que estoy en el módulo "Historial de Movimientos"

And que existen movimientos de diferentes productos

When hago clic en el botón "Filtros"

And ingreso el texto "Camiseta" en el campo de búsqueda de producto

And aplico los filtros

Then el sistema debe filtrar los movimientos en tiempo real (con debounce de 500ms)

And debe mostrar solo los movimientos de productos cuyo nombre contenga "Camiseta"

And debe actualizar el contador de resultados

And si no hay coincidencias, debe mostrar el mensaje "No se encontraron movimientos para el producto buscado"

When limpio el campo de búsqueda

Then el sistema debe mostrar todos los movimientos nuevamente



Scenario: Combinar múltiples filtros

Given que soy un Operador de Inventario autenticado

And que estoy en el módulo "Historial de Movimientos"

When aplico los siguientes filtros simultáneamente: Fecha "15/01/2024", Tipo "Compra", Bodega "Bodega Central", Producto "Camiseta"

And hago clic en "Aplicar Filtros"

Then el sistema debe mostrar solo los movimientos que cumplan TODOS los criterios

And debe actualizar el contador de resultados

And debe mostrar un resumen de los filtros aplicados

When hago clic en el botón "Limpiar Filtros" (ícono X)

Then el sistema debe eliminar todos los filtros

And debe mostrar todos los movimientos nuevamente

And debe resetear los campos de filtro a sus valores por defecto



Scenario: Ordenar movimientos por diferentes columnas

Given que soy un Operador de Inventario autenticado

And que estoy en el módulo "Historial de Movimientos"

And que estoy visualizando la tabla de movimientos

When hago clic en la cabecera de la columna "Fecha"

Then el sistema debe ordenar los movimientos por fecha

And si hago clic nuevamente, debe cambiar entre orden ascendente y descendente

And debe mostrar un indicador visual del ordenamiento (ícono de flecha)

When hago clic en la cabecera de la columna "Cantidad"

Then el sistema debe ordenar los movimientos por cantidad

And debe mantener el ordenamiento al cambiar de página

When hago clic en la cabecera de la columna "Producto"

Then el sistema debe ordenar los movimientos alfabéticamente por nombre de producto



Scenario: Paginación de movimientos

Given que soy un Operador de Inventario autenticado

And que estoy en el módulo "Historial de Movimientos"

And que existen más de 20 movimientos en el sistema (o el límite de items por página)

When visualizo la primera página de movimientos

Then el sistema debe mostrar máximo 20 movimientos por página (o el número configurado)

And debe mostrar controles de paginación con: número de página actual, total de páginas, botones anterior/siguiente

And debe mostrar un selector para cambiar el número de items por página (10, 20, 50, 100)

When hago clic en el botón "Siguiente"

Then el sistema debe cargar la siguiente página de movimientos

And debe mantener los filtros aplicados

And debe mantener el ordenamiento seleccionado

When cambio el selector de items por página a "50"

Then el sistema debe mostrar 50 movimientos por página

And debe recalcular el número total de páginas

And debe mantener los filtros aplicados



Scenario: Visualizar detalles de un movimiento

Given que soy un Operador de Inventario autenticado

And que estoy en el módulo "Historial de Movimientos"

And que estoy visualizando la tabla de movimientos

When hago clic en una fila de movimiento (o en un botón "Ver Detalles")

Then el sistema debe mostrar un modal o panel con los detalles completos del movimiento

And debe mostrar: Fecha y hora completa, Tipo de movimiento, Bodega, Producto (nombre y SKU), Cantidad, Observación/razón, Referencia (número de factura o documento relacionado), Usuario que registró el movimiento

And debe mostrar un botón para cerrar el modal

And el modal debe poder cerrarse haciendo clic fuera de él o presionando la tecla ESC
