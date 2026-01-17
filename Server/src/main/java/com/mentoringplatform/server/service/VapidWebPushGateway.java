package com.mentoringplatform.server.service;

import com.mentoringplatform.server.config.PushProperties;
import com.mentoringplatform.server.dto.WebPushRequest;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.List;
import java.util.concurrent.ExecutionException;
import org.jose4j.lang.JoseException;

import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;

/**
 * Web push gateway backed by VAPID credentials.
 */
@Component
public class VapidWebPushGateway implements WebPushGateway {

    private static final Logger log = LoggerFactory.getLogger(VapidWebPushGateway.class);

    private final PushSubscriptionService pushSubscriptionService;
    private final PushProperties pushProperties;
    private final PushService pushService;
    private final boolean vapidConfigured;

    public VapidWebPushGateway(PushSubscriptionService pushSubscriptionService,
                               PushProperties pushProperties) {
        this.pushSubscriptionService = pushSubscriptionService;
        this.pushProperties = pushProperties;
        ensureSecurityProvider();
        PushProperties.Vapid vapid = pushProperties.getVapid();
        if (pushProperties.isDispatchEnabled() && vapid.isConfigured()) {
            PushService candidate = buildPushService(pushProperties);
            if (candidate != null) {
                this.pushService = candidate;
                this.vapidConfigured = true;
            } else {
                this.pushService = null;
                this.vapidConfigured = false;
                log.warn("VAPID credentials appear invalid; web push dispatch is disabled");
            }
        } else {
            this.pushService = null;
            this.vapidConfigured = false;
            log.warn("⚠️ [VapidWebPushGateway] Web push dispatch disabled - dispatchEnabled={}, vapidConfigured={}, publicKey={}, privateKey={}, subject={}",
                    pushProperties.isDispatchEnabled(), 
                    vapid.isConfigured(),
                    vapid.getPublicKey() != null ? "SET" : "NOT SET",
                    vapid.getPrivateKey() != null ? "SET" : "NOT SET",
                    vapid.getSubject() != null ? vapid.getSubject() : "NOT SET");
        }
    }

    @Override
    public void sendBatch(List<WebPushRequest> requests) {
        log.info("📨 [VapidWebPushGateway] sendBatch called with {} request(s)", requests != null ? requests.size() : 0);
        
        if (requests == null || requests.isEmpty()) {
            log.warn("⚠️ [VapidWebPushGateway] No requests to send, returning early");
            return;
        }
        
        if (!vapidConfigured) {
            log.warn("⚠️ [VapidWebPushGateway] VAPID credentials not configured; skipping web push send. dispatchEnabled={}, vapidConfigured={}", 
                    pushProperties.isDispatchEnabled(), vapidConfigured);
            return;
        }

        log.info("✅ [VapidWebPushGateway] VAPID is configured, proceeding to send {} push notification(s)", requests.size());

        for (WebPushRequest request : requests) {
            try {
                log.info("📤 [VapidWebPushGateway] Sending push notification to endpoint: {}", request.getEndpoint());
                log.debug("📤 [VapidWebPushGateway] Payload length: {} bytes", request.getPayload() != null ? request.getPayload().length() : 0);
                
                Notification notification = new Notification(
                        request.getEndpoint(),
                        request.getP256dhKey(),
                        request.getAuthKey(),
                        request.getPayload()
                );
                
                log.debug("📤 [VapidWebPushGateway] Notification object created, calling pushService.send()");
                HttpResponse response = pushService.send(notification);
                int statusCode = response.getStatusLine().getStatusCode();
                
                log.info("📬 [VapidWebPushGateway] Push notification sent to {} - Status Code: {}", request.getEndpoint(), statusCode);
                
                if (statusCode == 404 || statusCode == 410) {
                    log.warn("⚠️ [VapidWebPushGateway] Subscription endpoint {} returned status {}; deactivating subscription.",
                            request.getEndpoint(), statusCode);
                    pushSubscriptionService.deactivateSubscription(request.getEndpoint());
                } else if (statusCode >= 400) {
                    log.error("❌ [VapidWebPushGateway] Failed to send web push to {}: status {}", request.getEndpoint(), statusCode);
                } else {
                    log.info("✅ [VapidWebPushGateway] Web push successfully delivered to {} with status {}", request.getEndpoint(), statusCode);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("❌ [VapidWebPushGateway] Web push send interrupted for endpoint {}", request.getEndpoint(), e);
            } catch (GeneralSecurityException | IOException | ExecutionException | JoseException e) {
                log.error("❌ [VapidWebPushGateway] Error sending web push to endpoint {}: {}", request.getEndpoint(), e.getMessage(), e);
            }
        }
        
        log.info("✅ [VapidWebPushGateway] Completed processing batch of {} push notification(s)", requests.size());
    }

    private PushService buildPushService(PushProperties properties) {
        PushProperties.Vapid vapid = properties.getVapid();
        try {
            PushService service = new PushService();
            service.setSubject(vapid.getSubject());
            service.setPublicKey(vapid.getPublicKey());
            service.setPrivateKey(vapid.getPrivateKey());
            return service;
        } catch (GeneralSecurityException | IllegalArgumentException e) {
            log.error("Failed to initialize VAPID push service; verify public/private keys.", e);
            return null;
        }
    }

    private void ensureSecurityProvider() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }
}
