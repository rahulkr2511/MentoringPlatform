package com.mentoringplatform.server.controller;

import com.mentoringplatform.server.dto.ApiResponse;
import com.mentoringplatform.server.dto.AuthRequest;
import com.mentoringplatform.server.dto.AuthResponse;
import com.mentoringplatform.server.dto.SignupRequest;
import com.mentoringplatform.server.dto.SignupResponse;
import com.mentoringplatform.server.model.User;
import com.mentoringplatform.server.security.JwtTokenProvider;
import com.mentoringplatform.server.security.UserPrincipal;
import com.mentoringplatform.server.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/monitoringPlatform/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthController(AuthenticationManager authenticationManager,
                         UserService userService,
                         PasswordEncoder passwordEncoder,
                         JwtTokenProvider tokenProvider) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignupResponse>> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        User user = new User();
        user.setUsername(signupRequest.getUsername());
        user.setEmail(signupRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        
        // Set the role from the request
        String role = signupRequest.getRole();
        if (role != null && (role.equals("MENTOR") || role.equals("MENTEE"))) {
            user.getRoles().add(role);
        } else {
            // Default to MENTEE if invalid role
            user.getRoles().add("MENTEE");
        }

        User savedUser = userService.createUser(user);

        SignupResponse signupResponse = new SignupResponse(
                savedUser.getUsername(),
                savedUser.getEmail(),
                "User registered successfully"
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(signupResponse, "User registered successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticateUser(@Valid @RequestBody AuthRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        AuthResponse authResponse = new AuthResponse(
                jwt,
                userPrincipal.getUsername(),
                userPrincipal.getEmail(),
                userPrincipal.getAuthorities().stream()
                        .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                        .toArray(String[]::new)
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(authResponse, "Login successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        AuthResponse authResponse = new AuthResponse(
                null,
                userPrincipal.getUsername(),
                userPrincipal.getEmail(),
                userPrincipal.getAuthorities().stream()
                        .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                        .toArray(String[]::new)
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(authResponse, "User details retrieved successfully"));
    }
} 