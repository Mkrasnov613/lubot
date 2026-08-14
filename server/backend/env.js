// Must be the first import in server.js: other modules read process.env at
// their own top level (e.g. lib/botTokens.js), and ES module imports are
// evaluated before any of the importing file's own statements run — so
// loading .env from inside server.js itself would be too late.
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
