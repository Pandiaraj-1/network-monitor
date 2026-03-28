package com.netmonitor.backend.service;

import com.netmonitor.backend.model.Device;
import com.netmonitor.backend.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository deviceRepository;

    public Device registerDevice(Device device) {
        device.setStatus("online");
        return deviceRepository.save(device);
    }

    public Device getDevice(String deviceId) {
        return deviceRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("Device not found: " + deviceId));
    }

    public List<Device> getAllDevices() {
        return deviceRepository.findAll();
    }

    public Device updateStatus(String deviceId, String status) {
        Device device = getDevice(deviceId);
        device.setStatus(status);
        return deviceRepository.save(device);
    }

    public void deleteDevice(Long id) {
        deviceRepository.deleteById(id);
    }
}