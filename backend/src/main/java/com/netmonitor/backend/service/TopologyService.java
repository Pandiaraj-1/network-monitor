package com.netmonitor.backend.service;

import com.netmonitor.backend.model.NetworkNode;
import com.netmonitor.backend.repository.TopologyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional("neo4jTransactionManager") // <-- ADD THIS TO THE CLASS LEVEL
public class TopologyService {

    private final TopologyRepository topologyRepository;

    public NetworkNode addDevice(NetworkNode node) {
        return topologyRepository.save(node);
    }

    // Remove the @Transactional from above this method since the whole class has it now
    public void connectDevices(String fromId, String toId) {
        NetworkNode from = topologyRepository.findByDeviceId(fromId)
                .orElseThrow(() -> new RuntimeException("Device not found: " + fromId));
        NetworkNode to = topologyRepository.findByDeviceId(toId)
                .orElseThrow(() -> new RuntimeException("Device not found: " + toId));
        from.getConnections().add(to);
        topologyRepository.save(from);
    }



    public List<NetworkNode> getShortestPath(String from, String to) {
        return topologyRepository.findShortestPath(from, to);
    }

    public List<NetworkNode> getNeighbors(String deviceId, int hops) {
        return topologyRepository.findNeighbors(deviceId, hops);
    }

    public List<NetworkNode> getAllNodes() {
        return topologyRepository.findAll();
    }
}