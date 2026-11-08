"use client"

import { Terminal } from "@wterm/react"
import "@wterm/react/css"
import { useCallback, useEffect, useRef } from "react"
import { trpc } from "@/trpc/client"

export default function TerminalSession() {
  const startSession = trpc.terminalRouter.start.useMutation()
  const sendInput = trpc.terminalRouter.input.useMutation()
  const resizeSession = trpc.terminalRouter.resize.useMutation()
  const readOutput = trpc.terminalRouter.read.useMutation()
  const closeSession = trpc.terminalRouter.close.useMutation()
  const closeTerminalSession = closeSession.mutate
  const sessionIdRef = useRef<string | null>(null)
  const inputQueueRef = useRef<Promise<unknown>>(Promise.resolve())
  const dimensionsRef = useRef({ cols: 80, rows: 24 })
  const mountedRef = useRef(false)

  const sendResize = useCallback((cols: number, rows: number) => {
    dimensionsRef.current = { cols, rows }
    const id = sessionIdRef.current
    if (id) {
      inputQueueRef.current = inputQueueRef.current.then(() => resizeSession.mutateAsync({ id, cols, rows })).catch(() => undefined)
    }
  }, [resizeSession])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (sessionIdRef.current) closeSession.mutate({ id: sessionIdRef.current })
    }
  }, [closeTerminalSession])

  return (
    <main className="h-dvh min-w-0 flex-1 overflow-hidden bg-white">
      <Terminal
        aria-label="Signed-in user shell"
        autoResize
        theme="light"
        className="h-full w-full"
        onReady={(terminal) => {
          terminal.focus()
          void startSession.mutateAsync().then(async ({ id }) => {
            if (!mountedRef.current) {
              closeSession.mutate({ id })
              return
            }
            sessionIdRef.current = id
            await resizeSession.mutateAsync({ id, ...dimensionsRef.current })

            const poll = async () => {
              if (!mountedRef.current || sessionIdRef.current !== id) return
              try {
                const result = await readOutput.mutateAsync({ id })
                if (result.data) terminal.write(result.data)
                if (result.closed) {
                  terminal.write("\r\nTerminal session ended.\r\n")
                  sessionIdRef.current = null
                  return
                }
                window.setTimeout(poll, 80)
              } catch (error) {
                terminal.write(`\r\nTerminal session failed: ${error instanceof Error ? error.message : "Unknown error"}\r\n`)
              }
            }

            void poll()
          }).catch((error) => {
            terminal.write(`\r\nUnable to start terminal session: ${error instanceof Error ? error.message : "Unknown error"}\r\n`)
          })
        }}
        onData={(data) => {
          const id = sessionIdRef.current
          if (id) {
            inputQueueRef.current = inputQueueRef.current.then(() => sendInput.mutateAsync({ id, data })).catch(() => undefined)
          }
        }}
        onResize={sendResize}
        onError={(error) => console.error("Unable to initialize terminal", error)}
      />
    </main>
  )
}
