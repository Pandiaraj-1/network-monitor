package com.netmonitor.backend.controller;

import com.netmonitor.backend.model.NetworkNode;
import com.netmonitor.backend.service.TopologyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/topology")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class TopologyController {

    private final TopologyService topologyService;

    @PostMapping("/devices")
    public ResponseEntity<NetworkNode> addDevice(@RequestBody NetworkNode node) {
        return ResponseEntity.ok(topologyService.addDevice(node));
    }

    @PostMapping("/connect")
    public ResponseEntity<Void> connect(
            @RequestParam String from,
            @RequestParam String to) {
        topologyService.connectDevices(from, to);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/path")
    public ResponseEntity<List<NetworkNode>> shortestPath(
            @RequestParam String from,
            @RequestParam String to) {
        return ResponseEntity.ok(topologyService.getShortestPath(from, to));
    }

    @GetMapping("/neighbors/{deviceId}")
    public ResponseEntity<List<NetworkNode>> neighbors(
            @PathVariable String deviceId,
            @RequestParam(defaultValue = "2") int hops) {
        return ResponseEntity.ok(topologyService.getNeighbors(deviceId, hops));
    }

    @GetMapping
    public ResponseEntity<List<NetworkNode>> getAllNodes() {
        return ResponseEntity.ok(topologyService.getAllNodes());
    }
}