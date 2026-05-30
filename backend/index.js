import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimit.js';
import stockRoutes from './routes/stock.js';
import chatRoutes from './routes/chat.js';
import portfolioRoutes from './routes/portfolio.js';
import authRoutes from './routes/auth.js';
import alertRoutes from './routes/alerts.js';
import watchlistRoutes from './routes/watchlist.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(rateLimiter);

app.use('/api/stock', stockRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/watchlist', watchlistRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use(errorHandler);

app.listen(PORT, () => console.log(`Backend running on :${PORT}`));
