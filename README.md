# Price Scraper Web Application

A full-stack web application for scraping Australian toner prices from InkStation and HotToner. Upload an Excel file with OEM codes, and receive price comparisons via email.

## 🏗️ Architecture

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Python Flask API
- **Scraper**: Selenium (parallel processing with 4 workers)
- **Email**: SMTP (Gmail/custom)

## 📁 Project Structure

```
price_scrapper_web/
├── frontend/              # Next.js application
│   ├── app/
│   │   ├── page.tsx      # Main upload UI
│   │   ├── layout.tsx    # App layout
│   │   └── globals.css   # Global styles
│   ├── package.json
│   └── .env.local        # Frontend environment variables
│
└── backend/              # Flask API
    ├── app.py           # Main Flask application
    ├── scrapers/        # Scraper modules (copied from price_scrapper)
    ├── utils/           # Utility modules
    ├── uploads/         # Uploaded Excel files
    ├── results/         # Generated results
    ├── requirements.txt
    └── .env             # Backend environment variables
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- Chrome browser (for Selenium)
- Gmail account (for sending emails)

### Backend Setup

1. **Navigate to backend directory:**
   ```powershell
   cd C:\Users\akash\Desktop\price_scrapper_web\backend
   ```

2. **Create virtual environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Configure email settings:**
   - Copy `.env.example` to `.env`
   - Update with your Gmail credentials:
   ```
   EMAIL_FROM=your-email@gmail.com
   EMAIL_PASSWORD=your-app-specific-password
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   ```
   
   **Important**: For Gmail, you need to create an **App Password**:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a new app password
   - Use this password in `.env` (not your regular Gmail password)

5. **Start the Flask API:**
   ```powershell
   python app.py
   ```
   
   API will run on: `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```powershell
   cd C:\Users\akash\Desktop\price_scrapper_web\frontend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Start the development server:**
   ```powershell
   npm run dev
   ```
   
   Frontend will run on: `http://localhost:3000`

## 📝 Usage

1. **Open the web application:**
   - Go to `http://localhost:3000` in your browser

2. **Upload Excel file:**
   - Click "Upload Excel File" and select your file with OEM codes
   - File should have OEM codes in the first column

3. **Enter email address:**
   - Type your email where results will be sent

4. **Start scraping:**
   - Click "Start Scraping" button
   - Multiple Chrome windows will open (4 workers)
   - You'll need to **solve CAPTCHA once in each browser window** (click the checkbox)

5. **Wait for completion:**
   - Progress bar shows current status
   - Scraping takes 1-2 hours for ~1160 codes
   - Results will be emailed automatically

6. **Receive results:**
   - Check your email for the Excel file attachment
   - File contains: OEM_CODE | Ink Station | Hot Tonner

## 🔧 Configuration

### Parallel Workers

In `backend/app.py`, line 123:
```python
num_workers = 4  # Adjust based on your CPU (3-5 recommended)
```

### Email Provider

To use a different email provider (not Gmail):

1. Update `.env` with your SMTP settings:
   ```
   SMTP_SERVER=smtp.yourprovider.com
   SMTP_PORT=587
   EMAIL_FROM=your-email@yourprovider.com
   EMAIL_PASSWORD=your-password
   ```

2. Common providers:
   - **Outlook**: smtp.office365.com:587
   - **Yahoo**: smtp.mail.yahoo.com:587
   - **SendGrid**: smtp.sendgrid.net:587

## 🌐 Deployment

### Option 1: VPS Deployment (Recommended)

**Requirements:**
- Ubuntu/Debian VPS (DigitalOcean, AWS EC2, etc.)
- 4GB+ RAM
- Chrome/Chromium installed

**Steps:**

1. **Install dependencies on server:**
   ```bash
   sudo apt update
   sudo apt install python3-pip nodejs npm chromium-browser xvfb
   ```

2. **Clone/upload your project to server**

3. **Setup backend:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Setup frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

5. **Run with PM2 (process manager):**
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start backend
   cd backend
   pm2 start app.py --interpreter python3 --name scraper-api
   
   # Start frontend
   cd frontend
   pm2 start npm --name scraper-web -- start
   ```

6. **Setup Nginx reverse proxy** (optional)

### Option 2: Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - EMAIL_FROM=${EMAIL_FROM}
      - EMAIL_PASSWORD=${EMAIL_PASSWORD}
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/results:/app/results
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:5000
    depends_on:
      - backend
```

## ⚠️ Important Notes

1. **CAPTCHA Solving**: You must manually click the Cloudflare checkbox in each browser window when it first opens. This cannot be automated.

2. **Server Requirements**: The server needs a GUI environment or Xvfb (virtual display) to run Chrome browsers.

3. **Rate Limiting**: Scraping 1000+ products takes time. Don't run multiple jobs simultaneously.

4. **Email Deliverability**: Some email providers may mark automated emails as spam. Use a dedicated SMTP service like SendGrid for production.

## 🐛 Troubleshooting

**Chrome won't start:**
- Install ChromeDriver: `pip install webdriver-manager`
- Check Chrome is installed: `google-chrome --version`

**Email not sending:**
- Verify Gmail App Password is correct
- Check 2-Step Verification is enabled
- Try port 465 with SSL instead of 587 with TLS

**CAPTCHA timeout:**
- Increase timeout in `scrapers/selenium_scraper.py`
- Solve CAPTCHA faster (within 2 minutes)

**Out of memory:**
- Reduce `num_workers` in `app.py`
- Increase server RAM

## 📄 License

MIT

## 🤝 Support

For issues or questions, contact: your-email@example.com
