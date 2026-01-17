package com.mentoringplatform.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request payload representing a browser push subscription.
 */
@Data
public class PushSubscriptionRequest {

    @NotBlank
    @Size(max = 1024)
    private String endpoint;

    @NotNull
    private PushSubscriptionKeys keys;

    @Data
    public static class PushSubscriptionKeys {

        @NotBlank
        @Size(max = 180)
        private String p256dh;

        @NotBlank
        @Size(max = 48)
        private String auth;
    }
}
