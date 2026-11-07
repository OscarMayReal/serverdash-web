"use client"

import { Button } from "@workspace/ui/components/button";
import { ClipboardPasteIcon, CopyIcon, DownloadIcon, FileIcon, FolderIcon, HomeIcon, ListIcon, MoreVerticalIcon, PlusIcon, ServerIcon, SlashIcon, Trash2Icon, UploadIcon } from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@workspace/ui/components/table"
import { trpc } from "@/trpc/client";
import { useRef, useState } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@workspace/ui/components/breadcrumb";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from "@workspace/ui/components/dropdown-menu"

export default function FileBrowserPage() {
    const [path, setPath] = useState(["."])
    const [copiedItem, setCopiedItem] = useState<{path: string; name: string} | null>(null)
    const fileInput = useRef<HTMLInputElement>(null)
    const replacementTarget = useRef<string | null>(null)
    const dir = trpc.filesRouter.ls.useQuery({path: path.join("/")})
    const trpcUtils = trpc.useUtils()
    const deleteFile = trpc.filesRouter.rm.useMutation({
        onSuccess: () => dir.refetch()
    })
    const uploadFile = trpc.filesRouter.upload.useMutation({
        onSuccess: () => dir.refetch()
    })
    const copyItem = trpc.filesRouter.copy.useMutation({
        onSuccess: () => dir.refetch()
    })
    const [uploading, setUploading] = useState(false)

    const uploadSelectedFiles = async (files: FileList | null) => {
        if (!files?.length) return
        const replaceName = replacementTarget.current
        replacementTarget.current = null
        setUploading(true)
        try {
            for (const file of Array.from(files)) {
                const bytes = new Uint8Array(await file.arrayBuffer())
                let binary = ""
                for (let offset = 0; offset < bytes.length; offset += 0x8000) {
                    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
                }
                await uploadFile.mutateAsync({
                    path: path.join("/"),
                    fileName: replaceName ?? file.name,
                    data: btoa(binary),
                })
            }
            await dir.refetch()
        } catch (error) {
            alert(error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed")
        } finally {
            setUploading(false)
            if (fileInput.current) fileInput.current.value = ""
        }
    }

    const downloadFile = async (filePath: string) => {
        const result = await trpcUtils.filesRouter.download.fetch({path: filePath})
        const binary = atob(result.data)
        const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))
        const url = URL.createObjectURL(new Blob([bytes]))
        const link = document.createElement("a")
        link.href = url
        link.download = result.fileName
        link.click()
        URL.revokeObjectURL(url)
    }
    return <div className="relative flex h-svh min-h-0 w-full flex-col overflow-hidden">
        <div className="flex flex-row absolute top-0 z-10 left-0 w-full items-center h-[60px] px-[10px] gap-3 bg-gradient-to-b from-background to-background/0">
            <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant={"ghost"} size="icon" className="h-[40px] w-[40px] rounded-full bg-muted hover:bg-neutral-200 border-1 border-border"><ListIcon /></Button>} />
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setPath(["/", "home"])}>
                        <HomeIcon />Home
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPath(["/"])}>
                        <SlashIcon />root
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPath(["."])}>
                        <ServerIcon />Server
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex h-[40px] flex-row items-center rounded-full border bg-muted px-5 border-1">
                <Breadcrumb>
                    <BreadcrumbList>
                        {path.map((item, index) => <>
                            <BreadcrumbItem>
                                <BreadcrumbLink onClick={() => {
                                    setPath(path.slice(0, index + 1))
                                }}>
                                    {item}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {index !== path.length - 1 && <BreadcrumbSeparator />}
                        </>)}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="flex-1"/>
            {copiedItem && <Button variant="secondary" className="h-[40px] rounded-full" disabled={copyItem.isPending} onClick={async () => {
                try {
                    await copyItem.mutateAsync({sourcePath: copiedItem.path, destinationPath: path.join("/")})
                    setCopiedItem(null)
                } catch (error) {
                    alert(error instanceof Error ? `Copy failed: ${error.message}` : "Copy failed")
                }
            }}>
                <ClipboardPasteIcon /> Paste {copiedItem.name}
            </Button>}
            <input
                ref={fileInput}
                type="file"
                multiple
                className="hidden"
                onChange={event => uploadSelectedFiles(event.currentTarget.files)}
            />
            <Button size="icon" className="h-[40px] w-[40px] rounded-full" disabled={uploading} onClick={() => {
                replacementTarget.current = null
                if (fileInput.current) {
                    fileInput.current.multiple = true
                    fileInput.current.click()
                }
            }} aria-label="Upload files">
                <PlusIcon />
            </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="min-h-[60px] w-full" />
        <div className="flex flex-col gap-4 p-4">
            <div className="overflow-hidden rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-5">
                            
                        </TableHead>
                        <TableHead>
                            Name
                        </TableHead>
                        <TableHead>
                            Size
                        </TableHead>
                        <TableHead>
                            Modified
                        </TableHead>
                        <TableHead className="w-5">
                            
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {/* {path.length != 1 && <TableRow onClick={() => {
                        const newPath = path
                        newPath.pop()
                        setPath(newPath)
                    }}>
                        <TableCell>
                            
                        </TableCell>
                        <TableCell>
                            (Up a directory)
                        </TableCell>
                        <TableCell>
                            
                        </TableCell>
                        <TableCell>
                            
                        </TableCell>
                        <TableCell>
                            
                        </TableCell>
                    </TableRow>} */}
                    {dir.data && dir.data.map(item => <TableRow key={item.file} onClick={() => {
                        if (item.isFolder) {
                            setPath([...path, item.file])
                            console.log([...path, item.file].join("/"))
                        }
                    }}>
                        <TableCell>
                            {item.isFolder ? <FolderIcon size={16} /> : <FileIcon size={16} />}
                        </TableCell>
                        <TableCell>
                            {item.file}
                        </TableCell>
                        <TableCell>
                            {item.stats.size}
                        </TableCell>
                        <TableCell>
                            {new Date(item.stats.mtimeMs).toLocaleString()}
                        </TableCell>
                        <TableCell className="p-0" onClick={ev => {
                            ev.stopPropagation()
                        }}>
                            <DropdownMenu>
                                <DropdownMenuTrigger render={<Button variant={"ghost"} size="icon-sm"><MoreVerticalIcon /></Button>} />
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setCopiedItem({
                                        path: path.join("/") + "/" + item.file,
                                        name: item.file,
                                    })}>
                                        <CopyIcon /> Copy
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled={item.isFolder} onClick={() => {
                                        replacementTarget.current = item.file
                                        if (fileInput.current) {
                                            fileInput.current.multiple = false
                                            fileInput.current.click()
                                        }
                                    }}>
                                        <UploadIcon /> Replace
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled={item.isFolder} onClick={() => downloadFile(path.join("/") + "/" + item.file)}>
                                        <DownloadIcon /> Download
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive" onClick={() => {
                                        if (confirm("Are you sure you want to delete this file")) {
                                            console.log("test")
                                            deleteFile.mutate({path: path.join("/") + "/" + item.file})
                                        }
                                    }}>
                                        <Trash2Icon /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>)}
                </TableBody>
            </Table>
            </div>
        </div>
        </div>
    </div>
}
