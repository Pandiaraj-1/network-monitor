package com.netmonitor.backend.controller;

import com.netmonitor.backend.model.TelemetryEvent;
import com.netmonitor.backend.service.TelemetryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/telemetry")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class TelemetryController {

    private final TelemetryService telemetryService;

    @PostMapping
    public ResponseEntity<TelemetryEvent> ingest(@RequestBody TelemetryEvent event) {
        return ResponseEntity.ok(telemetryService.ingestTelemetry(event));
    }

    @GetMapping("/{deviceId}")
    public ResponseEntity<List<TelemetryEvent>> getRecent(
            @PathVariable String deviceId,
            @RequestParam(defaultValue = "30") int minutes) {
        return ResponseEntity.ok(telemetryService.getRecentTelemetry(deviceId, minutes));
    }
}