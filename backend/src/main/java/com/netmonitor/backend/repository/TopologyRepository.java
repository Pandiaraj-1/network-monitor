package com.netmonitor.backend.repository;

import com.netmonitor.backend.model.NetworkNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import java.util.List;
import java.util.Optional;

public interface TopologyRepository extends Neo4jRepository<NetworkNode, Long> {

    Optional<NetworkNode> findByDeviceId(String deviceId);

    @Query("MATCH path = shortestPath((a:NetworkDevice {deviceId: $from})-[*]-(b:NetworkDevice {deviceId: $to})) RETURN path")
    List<NetworkNode> findShortestPath(String from, String to);

    @Query("MATCH (d:NetworkDevice {deviceId: $deviceId})-[*1..$hops]-(neighbor) RETURN neighbor")
    List<NetworkNode> findNeighbors(String deviceId, int hops);
}