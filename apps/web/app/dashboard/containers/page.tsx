"use client"
import { trpc } from "@/trpc/client"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog"
import type { inferRouterOutputs } from "@trpc/server"
import type { AppRouter } from "@workspace/backend/router"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import { Button } from "@workspace/ui/components/button"
import { PlayIcon, RefreshCcwIcon, StopCircleIcon, Trash2Icon } from "lucide-react"
import { useEffect } from "react"

type ContainerRowItem = inferRouterOutputs<AppRouter>["containerRouter"]["ps"][number]

export default function ContainersPage() {
    
    return <div className="flex flex-col p-3.5 w-full">
        <Tabs className="w-full">
            <TabsList>
                <TabsTrigger value="containers">
                    Containers
                </TabsTrigger>
                <TabsTrigger value="images">
                    Images
                </TabsTrigger>
            </TabsList>
            <ContainersTab />
        </Tabs>
    </div>
}

function ContainersTab() {
    const containers = trpc.containerRouter.ps.useQuery()
    const stopContainer = trpc.containerRouter.stop.useMutation({
        onSuccess: () => containers.refetch()
    })
    const restartContainer = trpc.containerRouter.restart.useMutation({
        onSuccess: () => containers.refetch()
    })
    const startContainer = trpc.containerRouter.start.useMutation({
        onSuccess: () => containers.refetch()
    })
    const rmContainer = trpc.containerRouter.rm.useMutation({
        onSuccess: () => containers.refetch()
    })
    useEffect(() => {
        const interval = setInterval(() => {
            containers.refetch()
        }, 1000)
        return () => {
            clearInterval(interval)
        }
    }, [])
    return <TabsContent value="containers" className="w-full">
        <Table className="w-full">
            <TableHeader>
                <TableRow>
                    <TableHead>
                        ID
                    </TableHead>
                    <TableHead>
                        Image
                    </TableHead>
                    <TableHead>
                        Command
                    </TableHead>
                    <TableHead>
                        Created
                    </TableHead>
                    <TableHead>
                        Status
                    </TableHead>
                    <TableHead>
                        Ports
                    </TableHead>
                    <TableHead>
                        Names
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {containers.data?.map(item => <ContainerRow
                    key={item.Id}
                    item={item}
                    stopContainer={stopContainer}
                    restartContainer={restartContainer}
                    startContainer={startContainer}
                    rmContainer={rmContainer}
                />)}
            </TableBody>
        </Table>
    </TabsContent>
}

function ContainerRow({
    item,
    stopContainer,
    restartContainer,
    startContainer,
    rmContainer,
}: {
    item: ContainerRowItem
    stopContainer: ReturnType<typeof trpc.containerRouter.stop.useMutation>
    restartContainer: ReturnType<typeof trpc.containerRouter.restart.useMutation>
    startContainer: ReturnType<typeof trpc.containerRouter.start.useMutation>
    rmContainer: ReturnType<typeof trpc.containerRouter.rm.useMutation>
}) {
    return <Dialog>
        <DialogTrigger nativeButton={false} render={<TableRow>
            <TableHead>
                {item.Id}
            </TableHead>
            <TableHead>
                {item.Image}
            </TableHead>
            <TableHead>
                {item.Command}
            </TableHead>
            <TableHead>
                {item.Created}
            </TableHead>
            <TableHead>
                {item.State}
            </TableHead>
            <TableHead>
                {item.Ports.map(port => `${port.IP}:${port.PublicPort}->${port.PrivatePort}/${port.Type}`).join(", ")}
            </TableHead>
            <TableHead>
                {item.Names.join(", ")}
            </TableHead>
        </TableRow>} />
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    {item.Names.join(", ")}
                </DialogTitle>
                <DialogDescription>
                    {item.Image} - {item.State}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <ButtonGroup>
                    <Button variant={"outline"} onClick={() => {
                        rmContainer.mutate({id: item.Id})
                    }}>
                        <Trash2Icon />
                        Delete
                    </Button>
                    { (item.State != "exited" && item.State != "stopped") ? 
                        <>
                            <Button variant={"outline"} onClick={() => {
                                stopContainer.mutate({id: item.Id})
                            }}>
                                <StopCircleIcon />
                                Stop
                            </Button>
                            <Button variant={"outline"} onClick={() => {
                                restartContainer.mutate({id: item.Id})
                            }}>
                                <RefreshCcwIcon />
                                Restart
                            </Button>
                        </> : <Button variant={"outline"} onClick={() => {
                            startContainer.mutate({id: item.Id})
                        }}><PlayIcon />Start</Button>
                    }
                </ButtonGroup>
                <div className="flex-1" />
            </DialogFooter>
        </DialogContent>
    </Dialog>
}
