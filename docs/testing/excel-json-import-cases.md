# Casos de prueba `POST /imports/excel-json`

Estos casos validan los cambios recientes:

- Validacion de sumas exactas al 100%.
- Importacion de alumnos aunque no tengan notas.
- Validacion de `raDistributions` por instrumento.
- Validacion de `exerciseWeights` por instrumento.

## Requisitos

1. Backend levantado en `http://localhost:8080`.
2. Token JWT en variable `TOKEN`.

Ejemplo para obtener `TOKEN` (bash):

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@admin.com","password":"adminmiralmonte"}' | jq -r '.accessToken')
```

Ejemplo para obtener `TOKEN` (PowerShell):

```powershell
$loginBody = @{ email = "admin@admin.com"; password = "adminmiralmonte" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:8080/auth/login" -ContentType "application/json" -Body $loginBody
$TOKEN = $loginResponse.accessToken
```

## Caso 1 (valido): alumno sin notas

Archivo: `docs/testing/excel-json-case-01-valid-students-without-grades.json`

```bash
curl -i -X POST 'http://localhost:8080/imports/excel-json' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @docs/testing/excel-json-case-01-valid-students-without-grades.json
```

Esperado:

- HTTP `201`.
- `studentCount = 2`.
- Se importa `A001` aunque `grades` este vacio.

## Caso 2 (invalido): UT-RA por RA no suma 100

Archivo: `docs/testing/excel-json-case-02-invalid-ut-ra-not-100.json`

```bash
curl -i -X POST 'http://localhost:8080/imports/excel-json' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @docs/testing/excel-json-case-02-invalid-ut-ra-not-100.json
```

Esperado:

- HTTP `400`.
- Mensaje similar a: `UT-RA distribution must sum exactly 100 for RA1`.

## Caso 3 (invalido): instrumentos de una UT no suman 100

Archivo: `docs/testing/excel-json-case-03-invalid-ut-instruments-not-100.json`

```bash
curl -i -X POST 'http://localhost:8080/imports/excel-json' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @docs/testing/excel-json-case-03-invalid-ut-instruments-not-100.json
```

Esperado:

- HTTP `400`.
- Mensaje similar a: `Instrument weights in UT must sum exactly 100`.

## Caso 4 (invalido): `raDistributions` de instrumento no suma 100

Archivo: `docs/testing/excel-json-case-04-invalid-instrument-ra-distribution-not-100.json`

```bash
curl -i -X POST 'http://localhost:8080/imports/excel-json' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @docs/testing/excel-json-case-04-invalid-instrument-ra-distribution-not-100.json
```

Esperado:

- HTTP `400`.
- Mensaje similar a: `Instrument RA distribution must sum exactly 100`.

## Caso 5 (invalido): `exerciseWeights` de instrumento no suma 100

Archivo: `docs/testing/excel-json-case-05-invalid-exercise-weights-not-100.json`

```bash
curl -i -X POST 'http://localhost:8080/imports/excel-json' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @docs/testing/excel-json-case-05-invalid-exercise-weights-not-100.json
```

Esperado:

- HTTP `400`.
- Mensaje similar a: `Exercise weights in instrument must sum exactly 100`.

## Caso 6 (valido): instrumento con ejercicios y notas por ejercicio coherentes

Archivo: `docs/testing/excel-json-case-06-valid-exercise-weights-and-grades.json`

```bash
curl -i -X POST 'http://localhost:8080/imports/excel-json' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @docs/testing/excel-json-case-06-valid-exercise-weights-and-grades.json
```

Esperado:

- HTTP `201`.
- Importacion correcta con `exerciseWeights` y `exerciseGrades`.
