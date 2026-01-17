package com.mentoringplatform.server.dto;

import lombok.Builder;
import lombok.Value;

/**
 * Represents a single web push dispatch request.
 */
@Value
@Builder
public class WebPushRequest {
    String endpoint;
    String p256dhKey;
    String authKey;
    String payload;
    Integer ttlSeconds;
}
