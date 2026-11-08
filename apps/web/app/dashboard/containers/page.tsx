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
import { Field, FieldContent, FieldSet, FieldTitle } from "@workspace/ui/components/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"

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
    const [createOpen, setCreateOpen] = useState(false)
    const [name, setName] = useState("")
    const [image, setImage] = useState("")
    const [command, setCommand] = useState("")
    const [ports, setPorts] = useState("")
    const [mounts, setMounts] = useState("")
    const [env, setEnv] = useState("")
    const [createValidationError, setCreateValidationError] = useState("")
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
    const images = trpc.containerRouter.image.ls.useQuery()
    const createContainer = trpc.containerRouter.create.useMutation({
        onSuccess: async () => {
            setCreateOpen(false)
            await containers.refetch()
            setName("")
            setImage("")
            setCommand("")
            setPorts("")
            setMounts("")
            setEnv("")
        },
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
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button className="w-fit">
                <PlusCircleIcon />
                Create Container
            </Button>} />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Create Container
                    </DialogTitle>
                </DialogHeader>
                <FieldSet>
                    <Field>
                        <FieldTitle>Container Name</FieldTitle>
                        <FieldContent><Input placeholder="my-container" value={name} onChange={event => setName(event.target.value)} /></FieldContent>
                    </Field>
                    <Field>
                        <FieldTitle>Image</FieldTitle>
                        <FieldContent>
                            <Select value={image} onValueChange={value => setImage(value ?? "")}>
                                <SelectTrigger className={"w-full"}>
                                    <SelectValue placeholder="Select Image" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {images.data?.flatMap(item => item.RepoTags ?? []).map(tag => <SelectItem key={tag} value={tag}>
                                            {tag}
                                        </SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </FieldContent>
                    </Field>
                    <Field><FieldTitle>Command (optional)</FieldTitle><FieldContent><Input placeholder="python -m http.server" value={command} onChange={event => setCommand(event.target.value)} /></FieldContent></Field>
                    <Field><FieldTitle>Port mappings</FieldTitle><FieldContent><textarea className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]" placeholder={"8080:80\n127.0.0.1:8443:443/udp"} value={ports} onChange={event => setPorts(event.target.value)} /><p className="text-muted-foreground text-xs">One mapping per line: host:container[/tcp|udp], optionally bind to an IP.</p></FieldContent></Field>
                    <Field><FieldTitle>Storage mappings</FieldTitle><FieldContent><textarea className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]" placeholder={"/host/path:/container/path\nmy-volume:/data:ro"} value={mounts} onChange={event => setMounts(event.target.value)} /><p className="text-muted-foreground text-xs">One Docker bind or named volume per line: source:container-path[:ro].</p></FieldContent></Field>
                    <Field><FieldTitle>Environment variables</FieldTitle><FieldContent><textarea className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]" placeholder={"NODE_ENV=production\nAPP_PORT=3000"} value={env} onChange={event => setEnv(event.target.value)} /><p className="text-muted-foreground text-xs">One KEY=value entry per line.</p></FieldContent></Field>
                    {(createValidationError || createContainer.error?.message) && <p role="alert" className="text-destructive text-sm">{createValidationError || createContainer.error?.message}</p>}
                </FieldSet>
                <DialogFooter>
                    <Button onClick={() => {
                        try {
                            setCreateValidationError("")
                            const parsedPorts = ports.split("\n").map(line => line.trim()).filter(Boolean).map(line => {
                                const match = line.match(/^(?:(\d{1,3}(?:\.\d{1,3}){3}):)?(\d{1,5}):(\d{1,5})(?:\/(tcp|udp))?$/)
                                if (!match) throw new Error(`Invalid port mapping: ${line}`)
                                return { hostIp: match[1], host: match[2]!, container: match[3]!, protocol: (match[4] ?? "tcp") as "tcp" | "udp" }
                            })
                            createContainer.mutate({
                                name: name.trim(), image,
                                command: command.trim() ? command.trim().split(/\s+/) : [],
                                ports: parsedPorts,
                                mounts: mounts.split("\n").map(line => line.trim()).filter(Boolean),
                                env: env.split("\n").map(line => line.trim()).filter(Boolean),
                            })
                        } catch (error) {
                            setCreateValidationError(error instanceof Error ? error.message : "Check the container settings")
                        }
                    }} disabled={!name.trim() || !image || createContainer.isPending}>
                        <PlusCircleIcon />{createContainer.isPending ? "Creating…" : "Create and Start"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
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
