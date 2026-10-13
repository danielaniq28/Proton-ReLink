# Proton-ReLink
Proton Link Alternative with Modern UI

# Proton Re-Link
Remote control and live status for Proton vehicles, in the browser. Sign in with the same Malaysian mobile number and password used in Proton Link, then lock, start, climate, and check the car from a phone or desktop.
Add it to the home screen to use it as an app.
## Features
- Sign in with Proton Link credentials (Malaysia `01` numbers)
- Overview: engine, fuel (litres), range, efficiency, service interval
- Controls: lock, engine, find car, trunk, windows, vent
- Climate: 18–31°C with 3, 5, 8, or 10 minute run times
- Tyres & Status: pressures, battery voltage, doors, windows, trunk, engine, A/C
- Find My Car: last known position
- Preview garage without a vehicle
- Installable web app (standalone, home-screen icon)
## Help Improve the App
If Proton Re-Link is useful, you can support further work from Overview: tap **Help improve this app**. A Maybank QR is shown so friends and family can send a contribution.
The developer is [danielaniq.com](https://www.danielaniq.com).
## Stack
- Next.js 15 (App Router) and React 19
- TypeScript and Tailwind CSS
- Proton Link legacy (`app.acotech.my`) and Atlas (`app-atlas.acotech.my`) gateways
## Run locally
Requires Node 20+.
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to `.env.local` if you need to override hosts:
```
PROTON_LEGACY_BASE=https://app.acotech.my:8443
PROTON_ATLAS_BASE=https://app-atlas.acotech.my:8443
PROTON_AGENT_TYPE=android
PROTON_DEVICE_ID=
```
```bash
npm run build
npm start
```
The password is hashed (MD5) only for the Proton login request and is never stored.
## Deploy on Vercel
1. Import this repository in Vercel (framework: Next.js, Node 20+).
2. Set the same env vars as `.env.example` if you are not using the production defaults.
3. Deploy.
On iPhone: open the live URL → Share → **Add to Home Screen**.  
On Android: open the live URL → **Install app** / Add to Home screen.
## Licence
Private project unless otherwise stated. Proton, Proton Link, and Atlas are trademarks of their owners. This app is an independent client, not an official Proton product.
