package com.mentoringplatform.server.service;

import com.mentoringplatform.server.dto.PushSubscriptionRequest;
import com.mentoringplatform.server.model.PushSubscription;
import com.mentoringplatform.server.model.User;
import com.mentoringplatform.server.repository.PushSubscriptionRepository;
import com.mentoringplatform.server.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PushSubscriptionService {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final UserRepository userRepository;

    public PushSubscriptionService(PushSubscriptionRepository pushSubscriptionRepository,
                                   UserRepository userRepository) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void upsertSubscription(String username, PushSubscriptionRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        PushSubscription subscription = pushSubscriptionRepository.findByEndpoint(request.getEndpoint())
                .filter(PushSubscription::isActive)
                .orElseGet(PushSubscription::new);

        subscription.setUser(user);
        subscription.setEndpoint(request.getEndpoint());
        subscription.setP256dhKey(request.getKeys().getP256dh());
        subscription.setAuthKey(request.getKeys().getAuth());
        subscription.setActive(true);
        subscription.touch();

        pushSubscriptionRepository.save(subscription);
    }

    @Transactional(readOnly = true)
    public List<PushSubscription> getActiveSubscriptions(Long userId) {
        return pushSubscriptionRepository.findAllByUserIdAndActiveTrue(userId);
    }

    @Transactional
    public void deactivateSubscription(String endpoint) {
        pushSubscriptionRepository.findByEndpoint(endpoint)
                .ifPresent(subscription -> {
                    subscription.setActive(false);
                    subscription.touch();
                    pushSubscriptionRepository.save(subscription);
                });
    }
}
