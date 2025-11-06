@echo off
echo 🚀 WooCommerce Headless Store Setup
echo ==================================
echo.

REM Check if .env.local exists
if not exist .env.local (
    echo 📝 Creating .env.local file...
    copy .env.example .env.local
    echo ✅ Created .env.local file
    echo.
    echo ⚠️  Please update .env.local with your WooCommerce API credentials:
    echo    - NEXT_PUBLIC_WOOCOMMERCE_URL
    echo    - NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY
    echo    - NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET
    echo    - NEXT_PUBLIC_WORDPRESS_URL
    echo.
) else (
    echo ✅ .env.local file already exists
)

REM Check if node_modules exists
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Update .env.local with your WooCommerce API credentials
echo 2. Run 'npm run dev' to start the development server
echo 3. Open http://localhost:3000 in your browser
echo.
echo For detailed setup instructions, see README.md
pause

