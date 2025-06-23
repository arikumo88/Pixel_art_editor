import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { file: string } }
) {
  const filename = params.file
  return new Promise<NextResponse>((resolve) => {
    const csvPath = path.join(process.cwd(), 'data', filename)
    const py = spawn('python3', ['python/read_csv.py', csvPath])
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
        resolve(
          NextResponse.json(
            { error: error || `Python exited with code ${code}` },
            { status: 500 }
          )
        )
      } else {
        try {
          const result = JSON.parse(output)
          resolve(NextResponse.json(result))
        } catch (e) {
          resolve(
            NextResponse.json(
              { error: 'Invalid JSON from Python' },
              { status: 500 }
            )
          )
        }
      }
    })
  })
}
