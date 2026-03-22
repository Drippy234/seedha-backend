# MongoDB Local Setup Guide

## Option 1: Install MongoDB Community Server (Recommended)

### Windows Installation:

1. **Download MongoDB:**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: Windows x64
   - Download the MSI installer

2. **Install MongoDB:**
   - Run the installer
   - Choose "Complete" installation
   - Install as a Windows Service (recommended)
   - Install MongoDB Compass (optional GUI tool)

3. **Verify Installation:**
   ```bash
   mongod --version
   ```

4. **Start MongoDB Service:**
   - MongoDB should start automatically as a Windows service
   - Or manually: `net start MongoDB`

5. **Create Data Directory (if needed):**
   ```bash
   mkdir C:\data\db
   ```

## Option 2: Use MongoDB Docker Container

If you have Docker installed:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## Option 3: Use MongoDB Atlas (Cloud)

If you prefer cloud database, update `.env` with your Atlas connection string:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/seedha_order
```

## Verify Connection

After installation, restart the backend server:
```bash
cd backend
npm start
```

You should see: ✅ MongoDB Connected Successfully!

## Seed Initial Data

Once connected, run the seed script to populate initial data:
```bash
node seed.js
```
