# MPDL-Unified

Repositorio unificado para todos los proyectos MPDL - Cada rama representa una aplicación diferente

## 📋 Descripción

Este repositorio centraliza todos los proyectos de MPDL en un solo lugar, utilizando ramas separadas para cada aplicación. Esto permite:

- Gestión centralizada de código
- Control de versiones unificado
- Despliegues independientes por rama en Vercel
- Mantenimiento simplificado

## 🌳 Estructura de Ramas

Cada rama contiene una aplicación completa e independiente:

### Ramas de Producción

- **`productos-limpieza`** - Sistema de productos de limpieza
  - Vercel: v0-productos-limpieza.vercel.app
  - Repo original: MPDL-Assistant

- **`asistente-app-dc`** - Aplicación de asistente (versión DC)
  - Vercel: mpdl-asistant.vercel.app
  - Repo original: v0-mpdl-assistant-app

- **`asistente-revisiones`** - Aplicación de revisiones
  - Vercel: v0-mpdl-revisiones-app.vercel.app
  - Repo original: MP-DL-Assist

- **`productos-solicitudes`** - Gestión de productos y solicitudes
  - Vercel: v0-mpdl-productos.vercel.app / mpdl-productos.vercel.app
  - Repo original: Productos-Limpieza-Mpdl

- **`botiquines`** - Gestión de botiquines
  - Vercel: v0-botiquines.vercel.app
  - Repo original: v0-mpdl-botiquines

- **`web-principal`** - Web principal de MPDL
  - Vercel: v0-mpdl-web.vercel.app
  - Sin repo Git previo

- **`inventario`** - Sistema de inventario
  - Vercel: v0-next-js-inventory-app-virid.vercel.app
  - Sin repo Git previo

- **`chat-assistant`** - Asistente de chat AI
  - Vercel: v0-ai-chat-assistant-rosy.vercel.app
  - Sin repo Git previo

- **`app-productos`** - Otra versión de app de productos
  - Vercel: v0-next-js-app-mocha-beta.vercel.app
  - Repo original: Mpdl-Productos-Limpieza

- **`web-002`** - Proyecto web 002
  - Vercel: v0-002-ten.vercel.app
  - Repo original: web

- **`web-001-rs`** - Proyecto web 001-rs
  - Vercel: v0-001-rs.vercel.app
  - Sin repo Git previo

## 🚀 Configuración en Vercel

Cada proyecto en Vercel debe configurarse para desplegar desde una rama específica:

1. En Vercel, ve a Project Settings → Git
2. Cambia el repositorio a `OttO0101/MPDL-Unified`
3. En "Production Branch", selecciona la rama correspondiente
4. Guarda los cambios

## 🔄 Migración desde Repositorios Anteriores

### Pasos para migrar código existente a este repo:

```bash
# 1. Clonar este repositorio
git clone https://github.com/OttO0101/MPDL-Unified.git
cd MPDL-Unified

# 2. Crear una nueva rama para tu proyecto
git checkout -b nombre-de-rama

# 3. Copiar el código de tu proyecto anterior
# (elimina README.md de main primero)
rm README.md
cp -r /path/to/old/project/* .

# 4. Commitear y pushear
git add .
git commit -m "feat: migrar proyecto [nombre]"
git push origin nombre-de-rama
```

## 📝 Convenciones

- Cada rama debe contener un proyecto completo y funcional
- No mezclar código de diferentes proyectos en la misma rama
- La rama `main` solo contiene documentación
- Usar commits descriptivos con prefijos: `feat:`, `fix:`, `docs:`, etc.

## ⚠️ Importante

- **NO** hacer merge entre ramas de proyectos diferentes
- Cada rama funciona de forma independiente
- Los cambios en una rama NO afectan a las demás
- Mantener la rama `main` solo con documentación

## 🤝 Contribuir

1. Trabaja en la rama correspondiente a tu proyecto
2. Haz commits frecuentes y descriptivos
3. Push directo a la rama (no requiere PR si trabajas solo)
4. Vercel desplegará automáticamente los cambios

## 📞 Soporte

Para dudas o problemas, contacta al equipo de desarrollo de MPDL.
