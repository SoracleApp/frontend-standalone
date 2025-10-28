import express from 'express';
import cors from 'cors';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { connectDB } from './db/index.js';
import Token from './models/Token.js';
import config from './config.js';

const app = express();
const port = config.PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize viem client
const client = createPublicClient({
    transport: http(config.RPC_URL)
});
console.log('RPC URL:', config.RPC_URL);
console.log(client);

// Clanker.sol stuff
const clankerAddress = config.CLANKER_CONTRACT_ADDRESS;
const clankerABI = [
    {
        type: 'event',
        name: 'TokenCreated',
        inputs: [
            { type: 'address', name: 'tokenAddress', indexed: true },
            { type: 'uint256', name: 'positionId' },
            { type: 'address', name: 'deployer' },
            { type: 'uint256', name: 'fid' },
            { type: 'string', name: 'name' },
            { type: 'string', name: 'symbol' },
            { type: 'uint256', name: 'supply' },
            { type: 'address', name: 'lockerAddress' },
            { type: 'string', name: 'castHash' }
        ]
    }
];

// Example ABI for the token contract
const tokenABI = [
    {
        type: 'function',
        name: 'image',
        inputs: [],
        outputs: [{ type: 'string' }],
        stateMutability: 'view'
    }
];

// Function to fetch historical logs
const fetchHistoricalLogs = async () => {
    try {
        console.log('Fetching historical logs...');
        
        // Get latest block
        const latestBlock = await client.getBlockNumber();
        const fromBlock = latestBlock - 5000n; // Last 50 blocks
        
        console.log(`Fetching logs from block ${fromBlock} to ${latestBlock}`);
        
        const logs = await client.getLogs({
            address: clankerAddress,
            event: parseAbiItem('event TokenCreated(address tokenAddress, uint256 positionId, address deployer, uint256 fid, string name, string symbol, uint256 supply, address lockerAddress, string castHash)'),
            fromBlock,
            toBlock: latestBlock
        });
        
        console.log(`Found ${logs.length} historical logs`);
        
        // Process each log
        for (const log of logs) {
            console.log('Raw log:', log);
            
            try {
                const {
                    args: {
                        tokenaddress,
                        deployer,
                        name,
                        symbol,
                        supply
                    }
                } = log;
                
                console.log('Processing historical token:', {
                    tokenaddress,
                    deployer,
                    name,
                    symbol,
                    supply: supply.toString()
                });
                
                // Check if token already exists
                const existingToken = await Token.findOne({ where: { tokenaddress } });
                if (!existingToken) {
                    await Token.create({
                        tokenaddress,
                        deployer,
                        name,
                        symbol,
                        supply: supply.toString(),
                        image_url: "imageUrl"
                    });
                    console.log('Historical token created:', tokenAddress);
                }
            } catch (error) {
                console.error('Error processing log:', error);
                console.error('Problematic log:', log);
            }
        }
        
        console.log('Historical log processing complete');
    } catch (error) {
        console.error('Error fetching historical logs:', error);
    }
};

// Start listening to events
async function startEventListener() {
    console.log('Starting event listener...');
    
    // Get the latest block number
    const latestBlock = await client.getBlockNumber();
    console.log('Latest block:', latestBlock);
    
    // Watch for TokenCreated events
    client.watchContractEvent({
        address: clankerAddress,
        abi: clankerABI,
        eventName: 'TokenCreated',
        onEvent: async (log) => {
            console.log('Raw Event Log:', log);
            
            try {
                const {
                    args: {
                        tokenaddress,
                        deployer,
                        name,
                        symbol,
                        supply
                    }
                } = log;
                
                console.log('Parsed Event Details:', {
                    tokenaddress,
                    deployer,
                    name,
                    symbol,
                    supply: supply.toString()
                });

                // Store the token data in the database
                const createdToken = await Token.create({
                    tokenaddress,
                    deployer,
                    name,
                    symbol,
                    supply: supply.toString(),
                    image_url: "imageUrl"
                });
                
                console.log('New token created:', createdToken.toJSON());
            } catch (error) {
                console.error('Error processing event log:', error);
                console.error('Problematic log:', log);
            }
        }
    });
}

// API Endpoints
app.get('/api/tokens', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows: tokens } = await Token.findAndCountAll({
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            tokens,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalTokens: count
        });
    } catch (error) {
        console.error('Error fetching tokens:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Initialize database and start server
const init = async () => {
    try {
        // Connect to database
        await connectDB();
        
        // Fetch historical logs before starting event listener
        await fetchHistoricalLogs();
        
        // Start event listener for new tokens
        startEventListener();
        
        // Start server
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Error during initialization:', error);
        process.exit(1);
    }
};

init();
