import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const res = await fetch('http://localhost:5001/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Could not reach local scraper server. Make sure py server.py is running.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const res = await fetch('http://localhost:5001/status')
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { status: 'offline', message: 'Local scraper server is not running.' },
      { status: 500 }
    )
  }
}