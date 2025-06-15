package com.mentoringplatform.server.service;

import com.mentoringplatform.server.dto.ProfileRequest;
import com.mentoringplatform.server.dto.ProfileResponse;
import com.mentoringplatform.server.model.User;
import com.mentoringplatform.server.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final UserRepository userRepository;

    public ProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        ProfileResponse profile = new ProfileResponse();
        profile.setName(user.getName());
        profile.setExpertise(user.getExpertise());
        profile.setAvailability(user.getAvailability());
        profile.setHourlyRate(user.getHourlyRate());
        profile.setDescription(user.getDescription());
        profile.setUsername(user.getUsername());
        profile.setEmail(user.getEmail());

        return profile;
    }

    @Transactional
    public ProfileResponse updateProfile(String username, ProfileRequest profileRequest) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // Update profile fields
        user.setName(profileRequest.getName());
        user.setExpertise(profileRequest.getExpertise());
        user.setAvailability(profileRequest.getAvailability());
        user.setHourlyRate(profileRequest.getHourlyRate());
        user.setDescription(profileRequest.getDescription());

        // Save the updated user
        User savedUser = userRepository.save(user);

        // Return the updated profile
        ProfileResponse profile = new ProfileResponse();
        profile.setName(savedUser.getName());
        profile.setExpertise(savedUser.getExpertise());
        profile.setAvailability(savedUser.getAvailability());
        profile.setHourlyRate(savedUser.getHourlyRate());
        profile.setDescription(savedUser.getDescription());
        profile.setUsername(savedUser.getUsername());
        profile.setEmail(savedUser.getEmail());

        return profile;
    }
} 