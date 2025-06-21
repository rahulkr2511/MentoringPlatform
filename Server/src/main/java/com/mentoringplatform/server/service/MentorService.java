package com.mentoringplatform.server.service;

import com.mentoringplatform.server.dto.MentorDetailsResponse;
import com.mentoringplatform.server.model.User;
import com.mentoringplatform.server.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MentorService {

    private final UserRepository userRepository;

    public MentorService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MentorDetailsResponse> getAllAvailableMentors() {
        List<User> mentors = userRepository.findAllMentorsWithProfiles();
        
        return mentors.stream()
                .map(this::convertToMentorDetailsResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MentorDetailsResponse> getAllMentors() {
        List<User> mentors = userRepository.findAllMentors();
        
        return mentors.stream()
                .map(this::convertToMentorDetailsResponse)
                .collect(Collectors.toList());
    }

    private MentorDetailsResponse convertToMentorDetailsResponse(User user) {
        MentorDetailsResponse response = new MentorDetailsResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setExpertise(user.getExpertise());
        response.setAvailability(user.getAvailability());
        response.setHourlyRate(user.getHourlyRate());
        response.setDescription(user.getDescription());
        response.setEnabled(user.isEnabled());
        return response;
    }
} 