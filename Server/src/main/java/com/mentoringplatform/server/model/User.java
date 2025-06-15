package com.mentoringplatform.server.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.HashSet;
import java.util.Set;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true)
    private String username;

    @NotBlank
    @Email
    @Column(unique = true)
    private String email;

    @NotBlank
    private String password;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    private Set<String> roles = new HashSet<>();

    private boolean enabled = true;
    
    // Profile fields for mentors
    @Column(name = "full_name")
    private String name;
    
    @Column(name = "expertise")
    private String expertise;
    
    @Column(name = "availability")
    private String availability;
    
    @Column(name = "hourly_rate")
    private Double hourlyRate;
    
    @Column(name = "description", length = 1000)
    private String description;
} 