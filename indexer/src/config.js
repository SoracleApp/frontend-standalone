import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const RPC_URL = process.env.RPC_URL || 'YOUR_RPC_URL';
export const CLANKER_CONTRACT_ADDRESS = process.env.CLANKER_CONTRACT_ADDRESS || 'YOUR_CONTRACT_ADDRESS';
export const PORT = process.env.PORT || 3001;
export const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/blockchain_indexer';

export default {
    RPC_URL,
    CLANKER_CONTRACT_ADDRESS,
    PORT,
    DATABASE_URL
};
