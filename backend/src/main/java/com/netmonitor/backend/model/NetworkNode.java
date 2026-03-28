package com.netmonitor.backend.model;

import org.springframework.data.neo4j.core.schema.*;
import lombok.Data;
import java.util.List;
import java.util.ArrayList;

@Node("NetworkDevice")
@Data
public class NetworkNode {

    @Id @GeneratedValue
    private Long id;

    @Property("deviceId")
    private String deviceId;

    private String name;
    private String type;
    private String ipAddress;

    @Relationship(type = "CONNECTS_TO", direction = Relationship.Direction.OUTGOING)
    private List<NetworkNode> connections = new ArrayList<>();
}