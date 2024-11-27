[![progress-banner](https://backend.codecrafters.io/progress/redis/b6a78a22-eb1b-4cac-b254-d5aef9748d7f)](https://app.codecrafters.io/users/codecrafters-bot?r=2qF)

# Redis Implementation

This project is a custom implementation of Redis, built from scratch as part of a **Code Crafters challenge**. It demonstrates deep insights into how Redis operates internally and offers several core functionalities.  

### Core Functionalities  
1. **RESP Parser**  
   - Implements the Redis Serialization Protocol (RESP) to handle structured communication between the client and server.  
   - Supports parsing of Redis commands and responding with appropriate data types, ensuring seamless command execution.  

2. **RDB Persistence**  
   - Parses existing Redis database (RDB) files for restoring data into memory.  
   - Handles the deserialization of complex data structures, enabling efficient persistence and recovery of data.
   - Supports saving in-memory data to disk using RDB file persistence.  
   - Ensures data durability and recovery during restarts or unexpected failures by periodically saving snapshots of the dataset.  

3. **Commands Supported**  
   - Supports `GET` and `SET` operations to store and retrieve key-value pairs.  
   - Implements expiration handling.  
   - Includes the `WAIT` command for ensuring replication to a specified number of slaves.  
   - Provides stream operations like `XADD` for adding entries to a stream and `XRANGE` for retrieving a range of stream entries, with blocking support for advanced use cases.  

4. **Transactions**  
   - Supports atomic execution of multiple commands using `MULTI` and `EXEC`.  
   - Allows rollback of commands using the `DISCARD` command in case of changes in transaction. 
   - Implements `INCR` for atomic increment operations on numeric keys.  

5. **Master-Slave Replication**  
   - Establishes replication with handshaking mechanisms for initial synchronization between master and slave instances.  
   - Propagates commands from the master to the slave in real time, ensuring data consistency.  
   - Enables communication between master and slave for robust fault tolerance and load balancing.  

## Future Enhancements  

1. **Load Handling and Scalability**  
   - Add support for concurrent client connections using worker threads to improve performance under high load.  
   - Implement a clustering module to distribute the dataset across multiple nodes for horizontal scalability.  

2. **Unit Testing**  
   - Develop a comprehensive suite of unit tests to ensure the correctness and stability of core functionalities.  

3. **Improved Master-Slave Communication**  
   - Introduce mechanisms for master instances to periodically check the status of slave instances.  
   - Implement the `REPLCONF ACK` command to synchronize and validate replication configurations.  

4. **Enhanced RDB Functionality**  
   - Extend functionality to include the conversion of in-memory data into RDB files for backup and sharing.  

5. **Redis-CLI (Client)**  
   - Develop a user-friendly command-line interface to allow clients to interact directly with the Redis server.  
   - Support advanced client features such as history tracking, autocomplete, and multi-command execution.  

6. **Deployment**  
   - Create Docker containerization and orchestration scripts for easy deployment in various environments.  
   - Provide CI/CD pipelines for automated testing and deployment.  


## Testing  

The **test clients** are used to verify the responses from the Redis server and ensure its functionalities are working as expected. A detailed list of supported commands and instructions on how to test the server will be added in future updates.  
