package com.sara.tfgdam.service;

import com.sara.tfgdam.domain.entity.UserAccount;
import com.sara.tfgdam.domain.entity.UserRole;
import com.sara.tfgdam.domain.entity.UserStatus;
import com.sara.tfgdam.dto.GoogleLoginRequest;
import com.sara.tfgdam.dto.LoginRequest;
import com.sara.tfgdam.dto.LoginResponse;
import com.sara.tfgdam.exception.BusinessValidationException;
import com.sara.tfgdam.repository.UserAccountRepository;
import com.sara.tfgdam.security.JwtTokenService;
import com.sara.tfgdam.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        return toLoginResponse(principal);
    }

    @Transactional
    public LoginResponse googleLogin(GoogleLoginRequest request) {
        GoogleTokenVerifierService.GoogleIdentity identity = googleTokenVerifierService.verifyIdToken(request.getIdToken());

        UserAccount user = userAccountRepository.findByEmailIgnoreCase(identity.email())
                .orElseGet(() -> userAccountRepository.save(UserAccount.builder()
                        .email(identity.email())
                        .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .roles(Set.of(UserRole.ROLE_TEACHER))
                        .status(UserStatus.ACTIVE)
                        .build()));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessValidationException("User is disabled");
        }

        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            throw new BusinessValidationException("User has no roles assigned");
        }

        UserPrincipal principal = new UserPrincipal(user);
        return toLoginResponse(principal);
    }

    private LoginResponse toLoginResponse(UserPrincipal principal) {
        return LoginResponse.builder()
                .accessToken(jwtTokenService.generateAccessToken(principal))
                .tokenType("Bearer")
                .userId(principal.getId())
                .email(principal.getEmail())
                .roles(principal.getRoles().stream().map(Enum::name).collect(Collectors.toSet()))
                .status(principal.getStatus().name())
                .build();
    }
}
