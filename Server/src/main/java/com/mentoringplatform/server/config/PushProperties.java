package com.mentoringplatform.server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@ConfigurationProperties(prefix = "push")
public class PushProperties {

    /**
     * Master flag to toggle outbound push dispatching.
     */
    private boolean dispatchEnabled = true;

    private final Vapid vapid = new Vapid();

    public boolean isDispatchEnabled() {
        return dispatchEnabled;
    }

    public void setDispatchEnabled(boolean dispatchEnabled) {
        this.dispatchEnabled = dispatchEnabled;
    }

    public Vapid getVapid() {
        return vapid;
    }

    public static class Vapid {
        /**
         * Public key shared with clients for subscription.
         */
        private String publicKey;
        /**
         * Private key used to sign VAPID requests.
         */
        private String privateKey;
        /**
         * Subject (mailto or URL) identifying the sender.
         */
        private String subject;

        public String getPublicKey() {
            return publicKey;
        }

        public void setPublicKey(String publicKey) {
            this.publicKey = publicKey;
        }

        public String getPrivateKey() {
            return privateKey;
        }

        public void setPrivateKey(String privateKey) {
            this.privateKey = privateKey;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public boolean isConfigured() {
            return StringUtils.hasText(publicKey) && StringUtils.hasText(privateKey) && StringUtils.hasText(subject);
        }
    }
}
