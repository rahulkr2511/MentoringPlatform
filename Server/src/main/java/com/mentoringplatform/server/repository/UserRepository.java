package com.mentoringplatform.server.repository;

import com.mentoringplatform.server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.id = ?1 ORDER BY u.username")
    Optional<User> findById(Long id);
    
    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE r = 'MENTOR' AND u.enabled = true")
    List<User> findAllMentors();
    
    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE r = 'MENTOR' AND u.enabled = true AND u.name IS NOT NULL")
    List<User> findAllMentorsWithProfiles();
} 