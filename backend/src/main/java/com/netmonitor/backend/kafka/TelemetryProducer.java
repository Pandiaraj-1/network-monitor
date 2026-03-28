package com.netmonitor.backend.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.netmonitor.backend.model.TelemetryEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TelemetryProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void sendTelemetry(TelemetryEvent event) {
        try {
            String message = objectMapper.writeValueAsString(event);
            kafkaTemplate.send("telemetry-events", event.getDeviceId(), message);
            log.info("Sent telemetry for device: {}", event.getDeviceId());
        } catch (Exception e) {
            log.error("Failed to send telemetry: {}", e.getMessage());
        }
    }
}