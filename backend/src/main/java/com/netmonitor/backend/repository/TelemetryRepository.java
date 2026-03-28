package com.netmonitor.backend.repository;

import com.netmonitor.backend.model.TelemetryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface TelemetryRepository extends JpaRepository<TelemetryEvent, Long> {
    List<TelemetryEvent> findByDeviceIdOrderByTimestampDesc(String deviceId);
    List<TelemetryEvent> findByDeviceIdAndTimestampAfter(String deviceId, LocalDateTime since);
}