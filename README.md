[![progress-banner](https://backend.codecrafters.io/progress/redis/b6a78a22-eb1b-4cac-b254-d5aef9748d7f)](https://app.codecrafters.io/users/codecrafters-bot?r=2qF)

# Redis Implementation

This project is a custom implementation of Redis, built from scratch as part of a **Code Crafters challenge**. It demonstrates deep insights into how Redis operates internally and offers several core functionalities.  

## Features

### Core Functionalities
1. **RESP Parser**
    - Implements the Redis Serialization Protocol for client-server communication.

2. **RDB File Parser**
    - Parses Redis database (RDB) files for persistent storage.

3. **Basic Commands**
    - Supports `GET` and `SET` operations with expiration handling with `px` flag.
    - Implements the `WAIT` command.
    - Provides support for stream operations like `XADD` and `XRANGE` (with blocking support). Id generation and validation as well.

4. **Transactions**
    - Includes commands like `INCR`, `MULTI`, and `DISCARD` to enable transactional support.

5. **Persistence**
    - Implements persistent storage using RDB file parsing.

6. **Master-Slave Replication**
    - Features handshaking, command propagation, and communication between master and slave instances.  

## Future Enhancements

1. **Load Handling and Scalability**
    - Add support for concurrent connections using worker threads.
    - Implement a clustering module for load distribution.

2. **Unit Testing**
    - Introduce comprehensive unit tests to ensure robustness and reliability.

3. **Improved Master-Slave Communication**
    - Enable master instances to regularly check the status of slaves and update them using the `REPLCONF ACK` command.

4. **Enhanced RDB Functionality**
    - Extend RDB file handling to include conversion from in-memory data to RDB files.  

5. **Redis-CLI (Client)**
   - Develop a command-line interface for interacting with the Redis server.

6. **Deployment**
   - Create scripts or containerized solutions (e.g., Docker) for easy deployment and scalability.


**Test clients file is for testing the reponse from server, I'll add list of all commands later on to provide you with how you can test redis server.**
