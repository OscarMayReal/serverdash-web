import { request as httpRequest } from "node:http"

const socketPath = process.env.DOCKER_SOCKET ?? "/var/run/docker.sock"

export type DockerContainerSummary = {
  Id: string
  Names: string[]
  Image: string
  Command: string
  Created: number
  State: string
  Status: string
  Ports: Array<{ IP?: string; PublicPort?: number; PrivatePort: number; Type: string }>
}

export type DockerImageSummary = {
  Id: string
  RepoTags: string[] | null
  Size: number
  VirtualSize: number
}

export function dockerRequest<T = unknown>(method: string, path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = httpRequest({ socketPath, path, method }, (response) => {
      let body = ""
      response.setEncoding("utf8")
      response.on("data", (chunk: string) => { body += chunk })
      response.on("end", () => {
        if ((response.statusCode ?? 500) >= 400) {
          try {
            const payload = JSON.parse(body) as { message?: string }
            reject(new Error(payload.message ?? `Docker API returned ${response.statusCode}`))
          } catch (error) {
            reject(error instanceof Error ? error : new Error(`Docker API returned ${response.statusCode}`))
          }
          return
        }
        if (!body) return resolve(undefined as T)
        try {
          resolve(JSON.parse(body) as T)
        } catch (error) {
          reject(error)
        }
      })
    })
    request.on("error", reject)
    request.end()
  })
}

export async function pullDockerImage(name: string, onEvent: (event: Record<string, unknown>) => void) {
  const path = `/images/create?fromImage=${encodeURIComponent(name)}`
  await new Promise<void>((resolve, reject) => {
    let buffered = ""
    const request = httpRequest({ socketPath, path, method: "POST" }, (response) => {
      response.setEncoding("utf8")
      response.on("data", (chunk: string) => {
        buffered += chunk
        const lines = buffered.split("\n")
        buffered = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const event = JSON.parse(line) as Record<string, unknown>
            if (event.error || (event.errorDetail as { message?: string } | undefined)?.message) {
              reject(new Error(String(event.error ?? (event.errorDetail as { message?: string }).message)))
              request.destroy()
              return
            }
            onEvent(event)
          } catch (error) {
            reject(error)
            request.destroy()
            return
          }
        }
      })
      response.on("end", () => {
        if (buffered.trim()) {
          try {
            const event = JSON.parse(buffered) as Record<string, unknown>
            if (event.error) return reject(new Error(String(event.error)))
            onEvent(event)
          } catch (error) {
            return reject(error)
          }
        }
        if ((response.statusCode ?? 500) >= 400) return reject(new Error(`Docker API returned ${response.statusCode}`))
        resolve()
      })
    })
    request.on("error", reject)
    request.end()
  })
}
