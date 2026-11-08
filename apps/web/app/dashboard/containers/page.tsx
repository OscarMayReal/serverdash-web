"use client"
import { trpc } from "@/trpc/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog"
import type { inferRouterOutputs } from "@trpc/server"
import type { AppRouter } from "@workspace/backend/router"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import { Button } from "@workspace/ui/components/button"
import { DownloadIcon, PlayIcon, PlusCircleIcon, RefreshCcwIcon, StopCircleIcon, Trash2Icon } from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "@workspace/ui/components/input"

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
            <ImagesTab />
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
    return <TabsContent value="containers" className="w-full flex flex-col gap-2">
        <Button className="w-fit">
            <PlusCircleIcon />
            Create Container
        </Button>
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

function ImagesTab() {
    const [imageName, setImageName] = useState("")
    const [downloadImageDialogOpen, setDownloadImageDialogOpen] = useState(false)
    const [pullJobId, setPullJobId] = useState<string | null>(null)
    const images = trpc.containerRouter.image.ls.useQuery()
    const pull = trpc.containerRouter.image.pull.useMutation({
        onSuccess: ({ jobId }) => setPullJobId(jobId),
    })
    const pullProgress = trpc.containerRouter.image.pullProgress.useQuery(
        { jobId: pullJobId ?? "" },
        {
            enabled: pullJobId !== null,
            refetchInterval: (query) => query.state.data?.status === "pulling" ? 500 : false,
        },
    )
    useEffect(() => {
        if (pullProgress.data?.status === "complete") {
            void images.refetch()
        }
    }, [pullProgress.data?.status])
    useEffect(() => {
        const interval = setInterval(() => {
            images.refetch()
        }, 1000)
        return () => {
            clearInterval(interval)
        }
    }, [])
    return <TabsContent value="images" className="w-full flex flex-col gap-2">
        <Dialog open={downloadImageDialogOpen} onOpenChange={setDownloadImageDialogOpen}>
            <DialogTrigger render={<Button className="w-fit">
                <DownloadIcon />
                Download Image
            </Button>}/>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Pull Image
                    </DialogTitle>
                    <DialogDescription>
                        Enter the name of the image you want to pull
                    </DialogDescription>
                </DialogHeader>
                <Input placeholder="e.g. ubuntu:latest" value={imageName} onChange={text => setImageName(text.target.value)} />
                {(pull.isPending || pullProgress.data?.status === "pulling") && <div className="space-y-2" role="status" aria-live="polite">
                    <p>{pullProgress.data?.message ?? `Downloading ${imageName}…`}</p>
                    {pullProgress.data?.current !== undefined && pullProgress.data.total !== undefined && <>
                        <progress
                            className="w-full"
                            value={pullProgress.data.current}
                            max={pullProgress.data.total || 1}
                            aria-label="Image download progress"
                        />
                        <p className="text-sm text-muted-foreground">
                            {Math.min(100, Math.round(pullProgress.data.current / (pullProgress.data.total || 1) * 100))}% of current layer
                        </p>
                    </>}
                </div>}
                {pullProgress.data?.status === "complete" && <p role="status">{pullProgress.data.message}</p>}
                {pullProgress.data?.status === "error" && <p role="alert">{pullProgress.data.message}</p>}
                {pull.error && <p role="alert">{pull.error.message}</p>}
                <DialogFooter>
                    <Button onClick={() => {
                        setPullJobId(null)
                        pull.mutate({name: imageName.trim()})
                    }} disabled={!imageName.trim() || pull.isPending || pullProgress.data?.status === "pulling"}>
                        <DownloadIcon />
                        Pull
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <Table className="w-full">
            <TableHeader>
                <TableRow>
                    <TableHead>
                        Image
                    </TableHead>
                    <TableHead>
                        ID
                    </TableHead>
                    <TableHead>
                        Disk Usage
                    </TableHead>
                    <TableHead>
                        Content Size
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {images.data?.map(item => <TableRow>
                    <TableCell>
                        {item.RepoTags}
                    </TableCell>
                    <TableCell>
                        {item.Id}
                    </TableCell>
                    <TableCell>
                        {item.Size}
                    </TableCell>
                    <TableCell>
                        {item.VirtualSize}
                    </TableCell>
                </TableRow>)}
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
