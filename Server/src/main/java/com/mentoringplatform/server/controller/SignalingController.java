package com.mentoringplatform.server.controller;

import com.mentoringplatform.server.dto.SignalMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    public SignalingController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/signal")
    public void handleSignal(SignalMessage message) {
        // Route the message to the target user
        String targetUser = message.getTo();
        messagingTemplate.convertAndSend("/topic/signal/" + targetUser, message);
    }

    @MessageMapping("/join")
    public void handleJoin(SignalMessage message) {
        // Notify other participants that user joined
        String targetUser = message.getTo();
        messagingTemplate.convertAndSend("/topic/signal/" + targetUser, message);
    }

    @MessageMapping("/leave")
    public void handleLeave(SignalMessage message) {
        // Notify other participants that user left
        String targetUser = message.getTo();
        messagingTemplate.convertAndSend("/topic/signal/" + targetUser, message);
    }
} 