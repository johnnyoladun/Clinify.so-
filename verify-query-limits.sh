#!/bin/bash

# Query Limits Verification Script
# Checks that all Supabase queries use .limit(1000000)

echo "🔍 Verifying Query Limits..."
echo "================================"
echo ""

# Check organisations API
echo "📋 Checking app/api/organisations/route.ts..."
grep -n "\.limit(" app/api/organisations/route.ts

echo ""

# Check patients API  
echo "📋 Checking app/api/patients/route.ts..."
grep -n "\.limit(" app/api/patients/route.ts

echo ""
echo "================================"
echo "✅ Expected: All .limit() should be .limit(1000000)"
echo ""
echo "If you see any .limit(1000) or other values, they need updating."
