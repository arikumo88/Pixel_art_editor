import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  return new Promise<NextResponse>((resolve) => {
    const py = spawn('python3', ['python/hello.py'])
    let output = ''
    let error = ''

    py.stdout.on('data', (data) => {
      output += data
    })

    py.stderr.on('data', (data) => {
      error += data
    })

    py.on('close', (code) => {
      if (code !== 0 || error) {
        resolve(NextResponse.json({ error: error || `Python exited with code ${code}` }, { status: 500 }))
      } else {
        try {
          const result = JSON.parse(output)
          resolve(NextResponse.json(result))
        } catch (e) {
          resolve(NextResponse.json({ error: 'Invalid JSON from Python' }, { status: 500 }))
        }
      }
    })

    py.stdin.write(JSON.stringify(body))
    py.stdin.end()
  })
}
