/**
 * Cliente de Supabase Storage
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "⚠️ Supabase no está configurado. Las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben estar configuradas en .env.local"
  )
}

// Validar y limpiar la URL de Supabase
let cleanSupabaseUrl = SUPABASE_URL
if (cleanSupabaseUrl) {
  // Remover cualquier ruta adicional que pueda estar en la URL
  cleanSupabaseUrl = cleanSupabaseUrl.replace(/\/storage\/v1\/.*$/, "")
  cleanSupabaseUrl = cleanSupabaseUrl.replace(/\/rest\/v1\/.*$/, "")
  cleanSupabaseUrl = cleanSupabaseUrl.replace(/\/$/, "") // Remover trailing slash
  
  // Si contiene ".storage.supabase.co", es incorrecto
  if (cleanSupabaseUrl.includes(".storage.supabase.co")) {
    console.error(
      "❌ ERROR: La URL de Supabase está mal configurada. " +
      "No debe incluir '.storage'. El formato correcto es: https://xxxxx.supabase.co"
    )
  }
}

/**
 * Cliente de Supabase
 */
export const supabase = cleanSupabaseUrl && SUPABASE_ANON_KEY
  ? createClient(cleanSupabaseUrl, SUPABASE_ANON_KEY)
  : null

/**
 * Bucket de almacenamiento para imágenes de productos
 */
const PRODUCTS_BUCKET = "productos"

/**
 * Bucket de almacenamiento para imágenes de categorías
 */
const CATEGORIES_BUCKET = "categorias"

/**
 * Sube una imagen a Supabase Storage
 * @param file - Archivo de imagen a subir
 * @param productId - ID del producto (opcional, para productos existentes)
 * @returns URL pública de la imagen subida
 */
export async function uploadProductImage(
  file: File,
  productId?: string
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase no está configurado. Por favor, configura las variables de entorno.")
  }

  // Validar que el archivo sea una imagen
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.")
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error("La imagen no puede ser mayor a 5MB.")
  }

  // Validar que la URL de Supabase esté correctamente configurada
  if (SUPABASE_URL && SUPABASE_URL.includes(".storage.supabase.co")) {
    throw new Error(
      "La URL de Supabase está mal configurada. Debe ser: https://xxxxx.supabase.co (sin '.storage'). " +
      "Verifica tu variable NEXT_PUBLIC_SUPABASE_URL en .env.local"
    )
  }

  // Generar nombre único para el archivo
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split(".").pop() || "jpg"
  const fileName = productId
    ? `${productId}/${timestamp}-${randomString}.${fileExtension}`
    : `temp/${timestamp}-${randomString}.${fileExtension}`

  // Subir archivo a Supabase Storage
  const { data, error } = await supabase.storage
    .from(PRODUCTS_BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false, // No sobrescribir si existe
    })

  if (error) {
    console.error("Error al subir imagen:", error)
    console.error("Error completo:", JSON.stringify(error, null, 2))
    
    // Mensajes de error más descriptivos
    if (error.message?.includes("Bucket not found") || error.message?.includes("does not exist")) {
      throw new Error(
        `El bucket "${PRODUCTS_BUCKET}" no existe en Supabase Storage. ` +
        `Por favor, crea el bucket "${PRODUCTS_BUCKET}" en tu proyecto de Supabase: ` +
        `Storage > Create bucket > Nombre: "${PRODUCTS_BUCKET}" > Public bucket`
      )
    }
    
    if (error.message?.includes("new row violates row-level security")) {
      throw new Error(
        `Error de permisos: El bucket "${PRODUCTS_BUCKET}" no tiene permisos públicos. ` +
        `Por favor, configura las políticas RLS del bucket en Supabase Storage.`
      )
    }
    
    throw new Error(`Error al subir la imagen: ${error.message || "Error desconocido"}`)
  }

  if (!data) {
    throw new Error("No se pudo obtener la URL de la imagen subida.")
  }

  // Obtener URL pública de la imagen
  const { data: urlData } = supabase.storage
    .from(PRODUCTS_BUCKET)
    .getPublicUrl(data.path)

  if (!urlData?.publicUrl) {
    throw new Error("No se pudo obtener la URL pública de la imagen.")
  }

  return urlData.publicUrl
}

/**
 * Elimina una imagen de Supabase Storage
 * @param imageUrl - URL pública de la imagen a eliminar
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no está configurado. Por favor, configura las variables de entorno.")
  }

  if (!imageUrl) {
    return // No hay imagen para eliminar
  }

  try {
    // Extraer el path del archivo desde la URL
    // La URL de Supabase Storage tiene el formato: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split("/")
    const bucketIndex = pathParts.indexOf("public")
    
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      console.warn("No se pudo extraer el path del archivo desde la URL:", imageUrl)
      return
    }

    // El path del archivo está después de "public/[bucket]/"
    const filePath = pathParts.slice(bucketIndex + 2).join("/")

    // Eliminar archivo de Supabase Storage
    const { error } = await supabase.storage
      .from(PRODUCTS_BUCKET)
      .remove([filePath])

    if (error) {
      console.error("Error al eliminar imagen:", error)
      // No lanzar error, solo loguear (puede que la imagen ya no exista)
      console.warn(`No se pudo eliminar la imagen: ${imageUrl}. Error: ${error.message}`)
    }
  } catch (error) {
    console.error("Error al procesar la eliminación de imagen:", error)
    // No lanzar error, solo loguear
  }
}

/**
 * Extrae el path del archivo desde una URL de Supabase Storage
 * @param imageUrl - URL pública de la imagen
 * @returns Path del archivo en el bucket
 */
export function extractFilePathFromUrl(imageUrl: string): string | null {
  if (!imageUrl) return null

  try {
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split("/")
    const bucketIndex = pathParts.indexOf("public")
    
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      return null
    }

    return pathParts.slice(bucketIndex + 2).join("/")
  } catch {
    return null
  }
}

/**
 * Mueve una imagen de la carpeta temporal a la carpeta del producto
 * @param imageUrl - URL de la imagen temporal
 * @param productId - ID del producto
 * @returns Nueva URL pública de la imagen
 */
export async function moveImageToProductFolder(
  imageUrl: string,
  productId: string
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase no está configurado. Por favor, configura las variables de entorno.")
  }

  const filePath = extractFilePathFromUrl(imageUrl)
  if (!filePath) {
    throw new Error("No se pudo extraer el path del archivo desde la URL.")
  }

  // Verificar que el archivo esté en la carpeta temporal
  if (!filePath.startsWith("temp/")) {
    // Si ya está en la carpeta del producto, retornar la URL original
    return imageUrl
  }

  // Generar nuevo nombre en la carpeta del producto
  const fileName = filePath.split("/").pop() || `image-${Date.now()}.jpg`
  const newPath = `${productId}/${fileName}`

  // Obtener el archivo de la ubicación temporal
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(PRODUCTS_BUCKET)
    .download(filePath)

  if (downloadError || !fileData) {
    throw new Error(`Error al descargar la imagen temporal: ${downloadError?.message || "Desconocido"}`)
  }

  // Subir el archivo a la nueva ubicación
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(PRODUCTS_BUCKET)
    .upload(newPath, fileData, {
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Error al mover la imagen: ${uploadError.message}`)
  }

  // Eliminar el archivo temporal
  await deleteProductImage(imageUrl)

  // Obtener nueva URL pública
  const { data: urlData } = supabase.storage
    .from(PRODUCTS_BUCKET)
    .getPublicUrl(uploadData.path)

  if (!urlData?.publicUrl) {
    throw new Error("No se pudo obtener la URL pública de la imagen movida.")
  }

  return urlData.publicUrl
}

/**
 * Sube una imagen de categoría a Supabase Storage
 * @param file - Archivo de imagen a subir
 * @param categoriaId - ID de la categoría (opcional, para categorías existentes)
 * @returns URL pública de la imagen subida
 */
export async function uploadCategoryImage(
  file: File,
  categoriaId?: string
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase no está configurado. Por favor, configura las variables de entorno.")
  }

  // Validar que el archivo sea una imagen
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.")
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error("La imagen no puede ser mayor a 5MB.")
  }

  // Validar que la URL de Supabase esté correctamente configurada
  if (SUPABASE_URL && SUPABASE_URL.includes(".storage.supabase.co")) {
    throw new Error(
      "La URL de Supabase está mal configurada. Debe ser: https://xxxxx.supabase.co (sin '.storage'). " +
      "Verifica tu variable NEXT_PUBLIC_SUPABASE_URL en .env.local"
    )
  }

  // Generar nombre único para el archivo
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const fileExtension = file.name.split(".").pop() || "jpg"
  const fileName = categoriaId
    ? `${categoriaId}/${timestamp}-${randomString}.${fileExtension}`
    : `temp/${timestamp}-${randomString}.${fileExtension}`

  // Subir archivo a Supabase Storage
  const { data, error } = await supabase.storage
    .from(CATEGORIES_BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false, // No sobrescribir si existe
    })

  if (error) {
    console.error("Error al subir imagen:", error)
    console.error("Error completo:", JSON.stringify(error, null, 2))
    
    // Mensajes de error más descriptivos
    if (error.message?.includes("Bucket not found") || error.message?.includes("does not exist")) {
      throw new Error(
        `El bucket "${CATEGORIES_BUCKET}" no existe en Supabase Storage. ` +
        `Por favor, crea el bucket "${CATEGORIES_BUCKET}" en tu proyecto de Supabase: ` +
        `Storage > Create bucket > Nombre: "${CATEGORIES_BUCKET}" > Public bucket`
      )
    }
    
    if (error.message?.includes("new row violates row-level security")) {
      throw new Error(
        `Error de permisos: El bucket "${CATEGORIES_BUCKET}" no tiene permisos públicos. ` +
        `Por favor, configura las políticas RLS del bucket en Supabase Storage.`
      )
    }
    
    throw new Error(`Error al subir la imagen: ${error.message || "Error desconocido"}`)
  }

  if (!data) {
    throw new Error("No se pudo obtener la URL de la imagen subida.")
  }

  // Obtener URL pública de la imagen
  const { data: urlData } = supabase.storage
    .from(CATEGORIES_BUCKET)
    .getPublicUrl(data.path)

  if (!urlData?.publicUrl) {
    throw new Error("No se pudo obtener la URL pública de la imagen.")
  }

  return urlData.publicUrl
}

/**
 * Elimina una imagen de categoría de Supabase Storage
 * @param imageUrl - URL pública de la imagen a eliminar
 */
export async function deleteCategoryImage(imageUrl: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase no está configurado. Por favor, configura las variables de entorno.")
  }

  if (!imageUrl) {
    return // No hay imagen para eliminar
  }

  try {
    // Extraer el path del archivo desde la URL
    // La URL de Supabase Storage tiene el formato: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split("/")
    const bucketIndex = pathParts.indexOf("public")
    
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) {
      console.warn("No se pudo extraer el path del archivo desde la URL:", imageUrl)
      return
    }

    // El path del archivo está después de "public/[bucket]/"
    const filePath = pathParts.slice(bucketIndex + 2).join("/")

    // Eliminar archivo de Supabase Storage
    const { error } = await supabase.storage
      .from(CATEGORIES_BUCKET)
      .remove([filePath])

    if (error) {
      console.error("Error al eliminar imagen:", error)
      // No lanzar error, solo loguear (puede que la imagen ya no exista)
      console.warn(`No se pudo eliminar la imagen: ${imageUrl}. Error: ${error.message}`)
    }
  } catch (error) {
    console.error("Error al procesar la eliminación de imagen:", error)
    // No lanzar error, solo loguear
  }
}

/**
 * Mueve una imagen de categoría de la carpeta temporal a la carpeta de la categoría
 * @param imageUrl - URL de la imagen temporal
 * @param categoriaId - ID de la categoría
 * @returns Nueva URL pública de la imagen
 */
export async function moveImageToCategoryFolder(
  imageUrl: string,
  categoriaId: string
): Promise<string> {
  if (!supabase) {
    throw new Error("Supabase no está configurado. Por favor, configura las variables de entorno.")
  }

  const filePath = extractFilePathFromUrl(imageUrl)
  if (!filePath) {
    throw new Error("No se pudo extraer el path del archivo desde la URL.")
  }

  // Verificar que el archivo esté en la carpeta temporal
  if (!filePath.startsWith("temp/")) {
    // Si ya está en la carpeta de la categoría, retornar la URL original
    return imageUrl
  }

  // Generar nuevo nombre en la carpeta de la categoría
  const fileName = filePath.split("/").pop() || `image-${Date.now()}.jpg`
  const newPath = `${categoriaId}/${fileName}`

  // Obtener el archivo de la ubicación temporal
  const { data: fileData, error: downloadError } = await supabase.storage
    .from(CATEGORIES_BUCKET)
    .download(filePath)

  if (downloadError || !fileData) {
    throw new Error(`Error al descargar la imagen temporal: ${downloadError?.message || "Desconocido"}`)
  }

  // Subir el archivo a la nueva ubicación
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(CATEGORIES_BUCKET)
    .upload(newPath, fileData, {
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Error al mover la imagen: ${uploadError.message}`)
  }

  // Eliminar el archivo temporal
  await deleteCategoryImage(imageUrl)

  // Obtener nueva URL pública
  const { data: urlData } = supabase.storage
    .from(CATEGORIES_BUCKET)
    .getPublicUrl(uploadData.path)

  if (!urlData?.publicUrl) {
    throw new Error("No se pudo obtener la URL pública de la imagen movida.")
  }

  return urlData.publicUrl
}

