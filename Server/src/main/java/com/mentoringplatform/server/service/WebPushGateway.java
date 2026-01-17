package com.mentoringplatform.server.service;

import com.mentoringplatform.server.dto.WebPushRequest;

import java.util.List;

/**
 * Abstraction over the actual Web Push transport.
 * Implementations should respect rate controls and handle retries.
 */
public interface WebPushGateway {

    void sendBatch(List<WebPushRequest> requests);
}
