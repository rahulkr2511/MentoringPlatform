package com.mentoringplatform.server.repository;

import com.mentoringplatform.server.model.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    List<UserNotification> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<UserNotification> findByIdAndUserId(Long id, Long userId);

    long countByUserIdAndReadIsFalse(Long userId);
}
