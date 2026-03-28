package com.netmonitor.backend.service;

import com.netmonitor.backend.kafka.TelemetryProducer;
import com.netmonitor.backend.model.TelemetryEvent;
import com.netmonitor.backend.repository.TelemetryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TelemetryService {

    private final TelemetryRepository telemetryRepository;
    private final TelemetryProducer telemetryProducer;

    public TelemetryEvent ingestTelemetry(TelemetryEvent event) {
        TelemetryEvent saved = telemetryRepository.save(event);
        telemetryProducer.sendTelemetry(saved);
        return saved;
    }

    public List<TelemetryEvent> getRecentTelemetry(String deviceId, int minutes) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(minutes);
        return telemetryRepository.findByDeviceIdAndTimestampAfter(deviceId, since);
    }
}