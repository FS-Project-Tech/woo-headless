#!/bin/bash

echo "🚀 WooCommerce Headless Store Setup"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.example .env.local
    echo "✅ Created .env.local file"
    echo ""
    echo "⚠️  Please update .env.local with your WooCommerce API credentials:"
    echo "   - NEXT_PUBLIC_WOOCOMMERCE_URL"
    echo "   - NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY"
    echo "   - NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET"
    echo "   - NEXT_PUBLIC_WORDPRESS_URL"
    echo ""
else
    echo "✅ .env.local file already exists"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your WooCommerce API credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For detailed setup instructions, see README.md"

