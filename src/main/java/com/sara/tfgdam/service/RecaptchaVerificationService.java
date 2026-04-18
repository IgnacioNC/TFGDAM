package com.sara.tfgdam.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sara.tfgdam.exception.BusinessValidationException;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Locale;

@Service
public class RecaptchaVerificationService {

    private final RestClient restClient;
    private final String secretKey;
    private final String verifyUrl;

    public RecaptchaVerificationService(
            RestClient.Builder restClientBuilder,
            @Value("${sara.recaptcha.secret-key:}") String secretKey,
            @Value("${sara.recaptcha.verify-url:https://www.google.com/recaptcha/api/siteverify}") String verifyUrl
    ) {
        this.restClient = restClientBuilder.build();
        this.secretKey = secretKey == null ? "" : secretKey.trim();
        this.verifyUrl = verifyUrl;
    }

    public boolean isEnabled() {
        return !secretKey.isBlank();
    }

    public void verifyLoginToken(String token, String remoteIp) {
        if (!isEnabled()) {
            return;
        }

        if (token == null || token.trim().isEmpty()) {
            throw new BusinessValidationException("reCAPTCHA verification is required");
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", secretKey);
        form.add("response", token.trim());
        if (remoteIp != null && !remoteIp.isBlank()) {
            form.add("remoteip", remoteIp.trim());
        }

        RecaptchaVerifyResponse response;
        try {
            response = restClient.post()
                    .uri(verifyUrl)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(RecaptchaVerifyResponse.class);
        } catch (Exception ex) {
            throw new BusinessValidationException("reCAPTCHA verification could not be completed");
        }

        if (response == null || !Boolean.TRUE.equals(response.getSuccess())) {
            throw new BusinessValidationException(buildErrorMessage(response));
        }

        // Para reCAPTCHA v3: verificar score mínimo (>= 0.5 = probable humano)
        if (response.getScore() != null && response.getScore() < 0.5) {
            throw new BusinessValidationException("reCAPTCHA: puntuación demasiado baja, intenta de nuevo");
        }
    }

    private String buildErrorMessage(RecaptchaVerifyResponse response) {
        if (response == null || response.getErrorCodes() == null || response.getErrorCodes().isEmpty()) {
            return "reCAPTCHA verification failed";
        }

        List<String> errorCodes = response.getErrorCodes();
        if (errorCodes.contains("timeout-or-duplicate")) {
            return "reCAPTCHA expired. Please try again";
        }
        if (errorCodes.contains("missing-input-response")) {
            return "reCAPTCHA verification is required";
        }
        if (errorCodes.contains("invalid-input-response")) {
            return "reCAPTCHA response is invalid";
        }

        return "reCAPTCHA verification failed: " + String.join(", ", errorCodes).toLowerCase(Locale.ROOT);
    }

    @Getter
    public static class RecaptchaVerifyResponse {
        private Boolean success;

        private Double score;

        private String action;

        @JsonProperty("challenge_ts")
        private String challengeTs;

        private String hostname;

        @JsonProperty("error-codes")
        private List<String> errorCodes;
    }
}
