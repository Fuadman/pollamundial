#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Iniciando Polla Mundial con Docker...${NC}\n"

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
    echo -e "${RED}❌ Error: .env.docker no encontrado${NC}"
    echo "Por favor, copia .env.docker.example a .env.docker y completa tus credenciales Google"
    exit 1
fi

# Check if credentials are filled
if grep -q "tu_client_id" .env.docker; then
    echo -e "${RED}❌ Error: Credenciales de Google no configuradas en .env.docker${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Configuración encontrada${NC}"
echo -e "${YELLOW}Levantando servicios...${NC}\n"

# Load environment variables
export $(cat .env.docker | grep -v '#' | xargs)

# Start Docker Compose
docker-compose up --build

echo -e "\n${GREEN}✓ Servicios iniciados${NC}"
echo -e "${YELLOW}URLs disponibles:${NC}"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3000"
echo "  DB:       localhost:5432"
echo "  Redis:    localhost:6379"
