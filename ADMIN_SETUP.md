# Conectar como Administrador

## Paso 1: Conectarse a PostgreSQL desde tu máquina local

Ejecuta UNO de estos comandos en tu terminal:

### Opción A (SIN contraseña):
```
PGPASSWORD=password psql -U user -d copa_prediction -h localhost -p 5434
```

### Opción B (CON contraseña - te la pedirá después):
```
psql -U user -d copa_prediction -h localhost -p 5434
```
Contraseña: `password`

### Opción C (Usando Docker):
```
docker exec -it pollamundial_db psql -U user -d copa_prediction
```

---

## Paso 2: Una vez dentro de PostgreSQL

Ejecuta este comando SQL para hacerte admin:

```sql
UPDATE users SET role = 'admin' WHERE email = 'fuadsalomon@gmail.com';
```

**REEMPLAZA** `fuadsalomon@gmail.com` con tu email real.

---

## Paso 3: Verifica que funcionó

Ejecuta:

```sql
SELECT email, role FROM users;
```

Deberías ver tu usuario con `role = 'admin'`

---

## Paso 4: Salir de PostgreSQL

```sql
\q
```

---

## Paso 5: Actualizar la app

1. Ve a http://localhost:5173
2. Cierra sesión (si estabas logueado)
3. Vuelve a ingresar con Google
4. Ahora podrás acceder a http://localhost:5173/admin/users
