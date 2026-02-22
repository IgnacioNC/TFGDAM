package com.sara.tfgdam.service;

import com.sara.tfgdam.exception.BusinessValidationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GoogleTokenVerifierService {

    private static final Set<String> ALLOWED_ISSUERS = Set.of(
            "accounts.google.com",
            "https://accounts.google.com"
    );

    private final RestTemplate restTemplate = new RestTemplate();
    private final Set<String> allowedClientIds;
    private final String allowedDomain;
    private final String tokenInfoUrl;

    public GoogleTokenVerifierService(
            @Value("${sara.google-auth.client-ids:}") String allowedClientIdsRaw,
            @Value("${sara.google-auth.allowed-domain:colegiomiralmonte.es}") String allowedDomain,
            @Value("${sara.google-auth.tokeninfo-url:https://oauth2.googleapis.com/tokeninfo}") String tokenInfoUrl
    ) {
        this.allowedClientIds = parseClientIds(allowedClientIdsRaw);
        this.allowedDomain = normalizeDomain(allowedDomain);
        this.tokenInfoUrl = tokenInfoUrl;
    }

    public GoogleIdentity verifyIdToken(String idToken) {
        if (idToken == null || idToken.trim().isEmpty()) {
            throw new BusinessValidationException("Google idToken is required");
        }
        if (allowedClientIds.isEmpty()) {
            throw new BusinessValidationException("Google login is not configured: sara.google-auth.client-ids is empty");
        }

        Map<String, Object> payload = fetchTokenInfo(idToken.trim());
        String audience = asString(payload.get("aud"));
        if (!allowedClientIds.contains(audience)) {
            throw new BusinessValidationException("Google token audience is not allowed");
        }

        String issuer = asString(payload.get("iss"));
        if (!ALLOWED_ISSUERS.contains(issuer)) {
            throw new BusinessValidationException("Google token issuer is invalid");
        }

        long exp = asLong(payload.get("exp"));
        if (exp <= Instant.now().getEpochSecond()) {
            throw new BusinessValidationException("Google token is expired");
        }

        String email = asString(payload.get("email")).toLowerCase(Locale.ROOT);
        if (email.isEmpty()) {
            throw new BusinessValidationException("Google token does not include email");
        }
        if (!isEmailVerified(payload.get("email_verified"))) {
            throw new BusinessValidationException("Google account email is not verified");
        }
        if (!email.endsWith("@" + allowedDomain)) {
            throw new BusinessValidationException("Google account must belong to domain @" + allowedDomain);
        }

        String hostedDomain = asString(payload.get("hd")).toLowerCase(Locale.ROOT);
        if (!allowedDomain.equals(hostedDomain)) {
            throw new BusinessValidationException("Google account must belong to hosted domain " + allowedDomain);
        }

        String subject = asString(payload.get("sub"));
        if (subject.isEmpty()) {
            throw new BusinessValidationException("Google token does not include subject");
        }

        return new GoogleIdentity(email, subject, hostedDomain);
    }

    private Map<String, Object> fetchTokenInfo(String idToken) {
        String url = UriComponentsBuilder.fromUriString(tokenInfoUrl)
                .queryParam("id_token", idToken)
                .build(true)
                .toUriString();

        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map body = response.getBody();
            if (body == null) {
                throw new BusinessValidationException("Cannot validate Google token");
            }
            return body;
        } catch (RestClientException ex) {
            throw new BusinessValidationException("Cannot validate Google token: " + ex.getMessage());
        }
    }

    private Set<String> parseClientIds(String raw) {
        if (raw == null || raw.trim().isEmpty()) {
            return Set.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String normalizeDomain(String domain) {
        if (domain == null || domain.trim().isEmpty()) {
            throw new BusinessValidationException("sara.google-auth.allowed-domain cannot be empty");
        }
        return domain.trim().toLowerCase(Locale.ROOT);
    }

    private String asString(Object value) {
        if (value == null) {
            return "";
        }
        return String.valueOf(value).trim();
    }

    private long asLong(Object value) {
        String text = asString(value);
        if (text.isEmpty()) {
            return 0L;
        }
        try {
            return Long.parseLong(text);
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    private boolean isEmailVerified(Object value) {
        String text = asString(value);
        return "true".equalsIgnoreCase(text) || "1".equals(text);
    }

    public record GoogleIdentity(String email, String subject, String hostedDomain) {
    }
}
