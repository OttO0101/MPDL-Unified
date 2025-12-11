#!/bin/bash

# Script de Migración Automática para MPDL-Unified
# Este script migra todos los proyectos existentes al repositorio unificado

set -e  # Salir si hay algún error

echo "🚀 Iniciando migración a MPDL-Unified..."
echo "==========================================="

# Directorio temporal para el trabajo
WORK_DIR="$HOME/mpdl-migration-temp"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para migrar un proyecto
migrate_project() {
    local source_repo=$1
    local branch_name=$2
    local description=$3
    
    echo -e "${BLUE}📦 Migrando: $description${NC}"
    echo "   Repo origen: $source_repo"
    echo "   Rama destino: $branch_name"
    
    # Clonar el repo origen si existe
    if [ "$source_repo" != "NONE" ]; then
        echo "   - Clonando repositorio origen..."
        git clone "https://github.com/OttO0101/$source_repo.git" "$branch_name-temp"
        cd "$branch_name-temp"
        
        # Obtener el contenido (sin .git)
        rm -rf .git
        cd ..
    else
        echo "   ${YELLOW}⚠️  No hay repo origen, se creará rama vacía${NC}"
        mkdir -p "$branch_name-temp"
    fi
    
    # Clonar MPDL-Unified si no existe
    if [ ! -d "MPDL-Unified" ]; then
        echo "   - Clonando MPDL-Unified..."
        git clone "https://github.com/OttO0101/MPDL-Unified.git"
    fi
    
    cd MPDL-Unified
    
    # Crear y cambiar a la nueva rama
    echo "   - Creando rama $branch_name..."
    git checkout main
    git pull origin main
    git checkout -b "$branch_name" 2>/dev/null || git checkout "$branch_name"
    
    # Limpiar todo excepto .git y README.md
    echo "   - Copiando código..."
    find . -mindepth 1 -maxdepth 1 ! -name '.git' ! -name 'README.md' -exec rm -rf {} +
    
    # Copiar el código del proyecto
    if [ "$source_repo" != "NONE" ]; then
        cp -r "../$branch_name-temp/"* .
        cp -r "../$branch_name-temp/".* . 2>/dev/null || true
    fi
    
    # Crear un .gitignore si no existe
    if [ ! -f ".gitignore" ]; then
        cat > .gitignore << 'EOL'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
/coverage

# Next.js
.next/
out/
build
dist/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
EOL
    fi
    
    # Commit y push
    echo "   - Commiteando cambios..."
    git add .
    git commit -m "feat: migrar proyecto $description desde $source_repo" || echo "   No hay cambios para commitear"
    
    echo "   - Pusheando a GitHub..."
    git push origin "$branch_name" --force
    
    cd ..
    
    # Limpiar temp
    rm -rf "$branch_name-temp"
    
    echo -e "${GREEN}   ✅ Migración completada${NC}"
    echo ""
}

# ============================================
# MIGRACIONES DE PROYECTOS
# ============================================

echo -e "${BLUE}📋 Lista de proyectos a migrar:${NC}"
echo "1. productos-limpieza (desde MPDL-Assistant)"
echo "2. asistente-app-dc (desde v0-mpdl-assistant-app)"
echo "3. asistente-revisiones (desde MP-DL-Assist)"
echo "4. productos-solicitudes (desde Productos-Limpieza-Mpdl)"
echo "5. botiquines (desde v0-mpdl-botiquines)"
echo "6. app-productos (desde Mpdl-Productos-Limpieza)"
echo "7. web-002 (desde web)"
echo "8. web-principal (sin repo previo)"
echo "9. inventario (sin repo previo)"
echo "10. chat-assistant (sin repo previo)"
echo "11. web-001-rs (sin repo previo)"
echo ""

read -p "¿Deseas continuar? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Migración cancelada"
    exit 0
fi

echo ""
echo "🔄 Iniciando migraciones..."
echo ""

# Migrar cada proyecto
migrate_project "MPDL-Assistant" "productos-limpieza" "Sistema de productos de limpieza"
migrate_project "v0-mpdl-assistant-app" "asistente-app-dc" "Aplicación de asistente (versión DC)"
migrate_project "MP-DL-Assist" "asistente-revisiones" "Aplicación de revisiones"
migrate_project "Productos-Limpieza-Mpdl" "productos-solicitudes" "Gestión de productos y solicitudes"
migrate_project "v0-mpdl-botiquines" "botiquines" "Gestión de botiquines"
migrate_project "Mpdl-Productos-Limpieza" "app-productos" "App de productos"
migrate_project "web" "web-002" "Proyecto web 002"
migrate_project "NONE" "web-principal" "Web principal de MPDL"
migrate_project "NONE" "inventario" "Sistema de inventario"
migrate_project "NONE" "chat-assistant" "Asistente de chat AI"
migrate_project "NONE" "web-001-rs" "Proyecto web 001-rs"

# Limpieza final
cd "$HOME"
echo ""
echo -e "${GREEN}========================================="
echo "✅ ¡Migración completada exitosamente!"
echo "=========================================\{NC}"
echo ""
echo "📋 Próximos pasos:"
echo "1. Verifica las ramas en GitHub: https://github.com/OttO0101/MPDL-Unified/branches"
echo "2. Reconfigura cada proyecto en Vercel:"
echo "   - Project Settings → Git → Connect MPDL-Unified"
echo "   - Selecciona la rama correspondiente"
echo "3. Para proyectos sin código previo (web-principal, inventario, etc.):"
echo "   - Descarga el código actual desde Vercel"
echo "   - Cópialo manualmente a su rama correspondiente"
echo ""
echo "🗑️  Para limpiar archivos temporales:"
echo "   rm -rf $WORK_DIR"
echo ""
