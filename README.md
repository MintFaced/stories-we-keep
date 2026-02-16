# Stories We Keep

Preserve the voices you love. We sit with your parents and grandparents, record their stories, and give you a private audio keepsake to treasure forever.

## Setup

1. Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

Then open `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `CALENDLY_URL` | Your Calendly scheduling link |
| `STRIPE_AUDIO_LINK` | Stripe Payment Link URL for the audio session |
| `STRIPE_AUDIO_STORAGE_LINK` | Stripe Payment Link URL for audio + storage |
| `STRIPE_VIDEO_LINK` | Stripe Payment Link URL for the video session |
| `STRIPE_VIDEO_STORAGE_LINK` | Stripe Payment Link URL for video + storage |

Create four [Stripe Payment Links](https://dashboard.stripe.com/payment-links) (one per product/tier) and paste the URLs above.

## API

- `GET /api/health` — Health check
- `GET /api/config` — Frontend configuration (Calendly URL, Stripe payment links)
