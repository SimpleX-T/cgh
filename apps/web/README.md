# Celo Game Hub (Web)

A decentralized gaming platform built on the Celo blockchain, featuring multiple games, a global leaderboard, and crypto-based rewards.

## Features

- **Multi-Game Hub**: Play Tetris, Snake, 2048, F1 Racing, and Breakout.
- **Wallet Connect**: Seamless login with MiniPay, MetaMask, Valora, and other WalletConnect-compatible wallets.
- **Global Leaderboard**: Compete for the top spot based on spending and high scores.
- **Crypto Payments**: Use cUSD to buy lives and powerups.
- **Profile System**: Track your stats, high scores, and inventory.
- **Mobile First**: Optimized for mobile browsers and MiniPay.

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Blockchain**: [Wagmi](https://wagmi.sh/), [Viem](https://viem.sh/), [RainbowKit](https://www.rainbowkit.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)

## Source Code Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   │   ├── api/          # Backend API endpoints (auth, games, leaderboard)
│   │   ├── games/        # Game pages (Tetris, Snake, etc.)
│   │   └── leaderboard/  # Leaderboard page
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks (useUserProfile, useSaveScore)
│   ├── lib/              # Utilities (db connection, web3 helpers)
│   └── models/           # Mongoose database models (User)
├── public/               # Static assets
└── ...
```

## Installation & Setup

### Prerequisites

- Node.js 18+
- MongoDB Database (local or Atlas)
- WalletConnect Project ID (get one from [WalletConnect Cloud](https://cloud.walletconnect.com/))

### Steps

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd my-celo-app/apps/web
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install # do not use any other package manager
    ```

3.  **Environment Variables:**
    Create a `.env` file in the `apps/web` directory and add the following:

    ```env
    # Database
    MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<DB_NAME>

    # WalletConnect
    NEXT_PUBLIC_WC_PROJECT_ID=your_project_id_here

    # Celo Network (alfajores or mainnet)
    NEXT_PUBLIC_CELO_NETWORK=alfajores

    # Receiver Address for Payments
    NEXT_PUBLIC_RECEIVER_ADDRESS=0x...
    ```

4.  **Run the development server:**

    ```bash
    pnpm run dev
    ```

5.  **Open the app:**
    Visit `http://localhost:3000` in your browser or use `ngrok` to tunnel it and open it in your minipay app

## Usage

### Connecting a Wallet

1.  Click the "Connect Wallet" button in the header.
2.  Choose your wallet (MetaMask, Phantom, etc.) or scan the QR code, wallet automatically connects on minipay tho.
3.  Once connected, you provide a username and your profile is automatically created.

### Playing Games

1.  Navigate to a game from the home page.
2.  **Lives**: You start with 5 hearts. Each game over consumes 1 heart.
3.  **Refill**: Hearts refill over time, or you can buy more in the store.

### Saving Scores

- Scores are automatically saved when a game ends.
- Check the **Leaderboard** to see how you rank against other players.

### Store & Powerups

- Visit the **Store** to buy hearts and powerups using cUSD.
- **Powerups**:
  - **Sonar**: Reveal hidden items (concept).
  - **X-Ray**: Remove low-value tiles (2048).
  - **Time Freeze**: Undo the last move.
  - **Lucky**: Upgrade a random tile/item.
