package com.netmonitor.backend.service;

import com.netmonitor.backend.model.Device;
import com.netmonitor.backend.repository.DeviceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeviceServiceTest {

    @Mock
    private DeviceRepository deviceRepository;

    @InjectMocks
    private DeviceService deviceService;

    @Test
    void shouldRegisterDeviceWithOnlineStatus() {
        // Arrange
        Device device = new Device();
        device.setDeviceId("router-01");
        device.setName("Core Router");
        when(deviceRepository.save(any(Device.class))).thenReturn(device);

        // Act
        Device result = deviceService.registerDevice(device);

        // Assert
        assertEquals("online", result.getStatus());
        verify(deviceRepository, times(1)).save(device);
    }

    @Test
    void shouldReturnAllDevices() {
        // Arrange
        Device d1 = new Device();
        d1.setDeviceId("router-01");
        Device d2 = new Device();
        d2.setDeviceId("switch-01");
        when(deviceRepository.findAll()).thenReturn(Arrays.asList(d1, d2));

        // Act
        List<Device> result = deviceService.getAllDevices();

        // Assert
        assertEquals(2, result.size());
        verify(deviceRepository, times(1)).findAll();
    }

    @Test
    void shouldThrowExceptionWhenDeviceNotFound() {
        // Arrange
        when(deviceRepository.findByDeviceId("unknown")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> deviceService.getDevice("unknown"));
    }

    @Test
    void shouldUpdateDeviceStatus() {
        // Arrange
        Device device = new Device();
        device.setDeviceId("router-01");
        device.setStatus("online");
        when(deviceRepository.findByDeviceId("router-01")).thenReturn(Optional.of(device));
        when(deviceRepository.save(any(Device.class))).thenReturn(device);

        // Act
        Device result = deviceService.updateStatus("router-01", "offline");

        // Assert
        assertEquals("offline", result.getStatus());
    }
}