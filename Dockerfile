# ── Build stage ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN ./mvnw dependency:go-offline -B

COPY src src
RUN ./mvnw package -DskipTests -B

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache python3 py3-openpyxl

WORKDIR /app

# JAR del backend
COPY --from=build /app/target/*.jar app.jar

# Scripts de exportacion
COPY scripts /app/scripts

# Plantillas Excel (solo lectura; los imports van en volumen)
COPY storage/templates /app/storage/templates

# El directorio de imports se montara como volumen en docker-compose
RUN mkdir -p /app/storage/imports-ra

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
