# 🚀 API de Reservas Optimizada (Taller de Backend)

Este proyecto es una API construida con **Next.js**, **Prisma** y **Redis**, enfocada en la optimización de recursos y rendimiento mediante patrones avanzados de diseño.

## 🛠️ Puntos Implementados

* **A. API Base:** Endpoint `/api/booking` funcional con persistencia en base de datos.
* **B. Caché (Redis):** Implementación de caché con TTL de 300s para reducir latencia.
* **C. DataLoader (N+1):** Resolución eficiente de relaciones entre Reservas y Usuarios en un solo lote (Batching).
* **D. Job Queue:** Sistema de encolado de tareas asíncronas simulado mediante logs y conexión a Redis.
* **E. Lazy-loading:** Paginación de resultados para optimizar el payload de respuesta.

## 📋 Requisitos Previos
* Node.js (v18 o superior)
* Servidor Redis (Puerto 6379)
* Base de Datos Relacional (PostgreSQL/MySQL) configurada en Prisma.

## 🚀 Pasos de Ejecución

1. **Instalar dependencias:**
   ```bash
   npm install