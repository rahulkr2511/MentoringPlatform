package com.mentoringplatform.server.service;

import com.mentoringplatform.server.dto.SessionBookingRequest;
import com.mentoringplatform.server.dto.SessionResponse;
import com.mentoringplatform.server.model.Session;
import com.mentoringplatform.server.model.User;
import com.mentoringplatform.server.repository.SessionRepository;
import com.mentoringplatform.server.repository.UserRepository;
import com.mentoringplatform.server.service.AvailabilityService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final AvailabilityService availabilityService;

    public SessionService(SessionRepository sessionRepository, UserRepository userRepository, AvailabilityService availabilityService) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.availabilityService = availabilityService;
    }

    @Transactional
    public SessionResponse bookSession(String menteeUsername, SessionBookingRequest request) {
        // Get mentee
        User mentee = userRepository.findByUsername(menteeUsername)
                .orElseThrow(() -> new UsernameNotFoundException("Mentee not found"));

        // Get mentor
        User mentor = userRepository.findById(request.getMentorId())
                .orElseThrow(() -> new RuntimeException("Mentor not found"));

        // Validate mentor is actually a mentor
        if (!mentor.getRoles().contains("MENTOR")) {
            throw new RuntimeException("Selected user is not a mentor");
        }

        // Initialize default availability if mentor doesn't have any
        availabilityService.initializeDefaultAvailability(mentor.getId());

        // Check for conflicting sessions
        LocalDateTime endTime = request.getScheduledDateTime().plusMinutes(request.getDurationMinutes());
        List<Session> conflictingSessions = sessionRepository.findSessionsForMentorInTimeRange(
            mentor.getId(), 
            request.getScheduledDateTime().minusMinutes(request.getDurationMinutes()), 
            endTime.plusMinutes(request.getDurationMinutes())
        );
        
        // Check if any existing sessions overlap with the new session
        boolean hasConflict = conflictingSessions.stream().anyMatch(existingSession -> {
            LocalDateTime existingEnd = existingSession.getScheduledDateTime().plusMinutes(existingSession.getDurationMinutes());
            return (request.getScheduledDateTime().isBefore(existingEnd) && 
                    endTime.isAfter(existingSession.getScheduledDateTime()));
        });
        
        if (hasConflict) {
            throw new RuntimeException("Mentor has a conflicting session at this time");
        }

        // Create session
        Session session = new Session();
        session.setMentor(mentor);
        session.setMentee(mentee);
        session.setScheduledDateTime(request.getScheduledDateTime());
        session.setDurationMinutes(request.getDurationMinutes());
        session.setSessionType(request.getSessionType());
        session.setNotes(request.getNotes());
        session.setStatus(Session.SessionStatus.PENDING);

        Session savedSession = sessionRepository.save(session);
        return convertToSessionResponse(savedSession);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getUpcomingSessions(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<Session> sessions = sessionRepository.findUpcomingSessionsByUserId(user.getId(), LocalDateTime.now());
        return sessions.stream()
                .map(this::convertToSessionResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getPastSessions(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        List<Session> sessions = sessionRepository.findPastSessionsByUserId(user.getId(), LocalDateTime.now());
        return sessions.stream()
                .map(this::convertToSessionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SessionResponse updateSessionStatus(Long sessionId, Session.SessionStatus status, String username) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Validate that the user is the mentor for this session
        if (!session.getMentor().getUsername().equals(username)) {
            throw new RuntimeException("You can only update sessions where you are the mentor");
        }

        session.setStatus(status);
        Session updatedSession = sessionRepository.save(session);
        return convertToSessionResponse(updatedSession);
    }

    @Transactional
    public SessionResponse cancelSession(Long sessionId, String username) {
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        // Validate that the user is either the mentor or mentee
        if (!session.getMentor().getUsername().equals(username) && 
            !session.getMentee().getUsername().equals(username)) {
            throw new RuntimeException("You can only cancel your own sessions");
        }

        session.setStatus(Session.SessionStatus.CANCELLED);
        Session updatedSession = sessionRepository.save(session);
        return convertToSessionResponse(updatedSession);
    }

    private SessionResponse convertToSessionResponse(Session session) {
        SessionResponse response = new SessionResponse();
        response.setId(session.getId());
        response.setMentorId(session.getMentor().getId());
        response.setMentorName(session.getMentor().getName());
        response.setMentorUsername(session.getMentor().getUsername());
        response.setMenteeId(session.getMentee().getId());
        response.setMenteeName(session.getMentee().getName());
        response.setMenteeUsername(session.getMentee().getUsername());
        response.setScheduledDateTime(session.getScheduledDateTime());
        response.setDurationMinutes(session.getDurationMinutes());
        response.setStatus(session.getStatus().name());
        response.setSessionType(session.getSessionType());
        response.setNotes(session.getNotes());
        response.setCreatedAt(session.getCreatedAt());
        response.setUpdatedAt(session.getUpdatedAt());
        return response;
    }
} 