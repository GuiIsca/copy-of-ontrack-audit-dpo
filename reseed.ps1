# Script para reinserir dados com encoding UTF-8 correto
# Garante que os acentos aparecem corretamente

Write-Host "Limpando dados existentes..." -ForegroundColor Yellow
Get-Content -Path "reseed_database.sql" -Encoding UTF8 | docker-compose exec -T postgres psql -U ontrack_user -d ontrack_db

Write-Host "`nReinserindo dados do seed..." -ForegroundColor Yellow
Get-Content -Path "server/db/seed.sql" -Encoding UTF8 | docker-compose exec -T postgres psql -U ontrack_user -d ontrack_db

Write-Host "`nRebuilding containers..." -ForegroundColor Yellow
docker-compose up --build -d

Write-Host "`nConcluído! Base de dados limpa e repovoada com encoding correto." -ForegroundColor Green
