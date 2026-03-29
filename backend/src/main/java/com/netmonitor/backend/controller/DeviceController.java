package com.netmonitor.backend.controller;

import com.netmonitor.backend.model.Device;
import com.netmonitor.backend.service.DeviceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class DeviceController {

    private final DeviceService deviceService;

    @PostMapping
    public ResponseEntity<Device> registerDevice(@RequestBody Device device) {
        return ResponseEntity.ok(deviceService.registerDevice(device));
    }

    @GetMapping
    public ResponseEntity<List<Device>> getAllDevices() {
        return ResponseEntity.ok(deviceService.getAllDevices());
    }

    @GetMapping("/{deviceId}")
    public ResponseEntity<Device> getDevice(@PathVariable String deviceId) {
        return ResponseEntity.ok(deviceService.getDevice(deviceId));
    }

    @PatchMapping("/{deviceId}/status")
    public ResponseEntity<Device> updateStatus(
            @PathVariable String deviceId,
            @RequestParam String status) {
        return ResponseEntity.ok(deviceService.updateStatus(deviceId, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDevice(@PathVariable Long id) {
        deviceService.deleteDevice(id);
        return ResponseEntity.noContent().build();
    }
}